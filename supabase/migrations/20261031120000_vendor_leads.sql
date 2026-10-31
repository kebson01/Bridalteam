-- Vendor leads: one staging table for every way we find a vendor.
--
-- Until now each research pass wrote straight into the directory with
-- create_claimable_listing(), and the only record of where a row came from was
-- a line in VENDOR-PROSPECTS.md. That worked for one source (web search). It
-- does not work for six: web search, Google Places, county business tax
-- receipts, DBPR licence files, association and venue preferred-vendor lists,
-- and recommendations from couples and vendors. Each of those produces rows of
-- very different quality, and several of them overlap heavily -- the caterer a
-- venue recommends is usually also in the county tax roll and on Google.
--
-- So every source now lands here first, as a lead, and one function decides
-- what happens to it:
--
--   * it matches an existing listing (by phone, then website domain, then
--     normalised name) -> the lead is marked 'duplicate' and linked. If that
--     listing is still unclaimed, any blank phone / website / category is
--     filled from the lead, and a draft that becomes contactable publishes.
--     That is how the 220 drafts with no phone and no website get rescued.
--   * it is new -> create_claimable_listing() makes it, exactly as before, and
--     it publishes if it has a phone or a first-party website (the rule in
--     VENDOR-PROSPECTS.md: a listing a couple cannot contact is held back).
--
-- Nothing a vendor has claimed is ever modified. A claimed listing is
-- somebody's account; a lead can only link to it.
--
-- Recommendations from signed-in users come in through suggest_vendor(), and
-- are NEVER auto-imported: import_vendor_leads() skips the two referral
-- sources unless asked for them by name, because a couple typing a name is a
-- tip, not a published fact. An admin reviews them on /admin/leads.

create table if not exists public.vendor_leads (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in (
    'web_search', 'google_places', 'county_btr', 'dbpr',
    'association', 'venue_preferred', 'couple_referral', 'vendor_referral'
  )),
  -- The source's own identifier: a Google place_id, a licence or BTR account
  -- number, or the venue / association whose list named the vendor.
  source_ref text,
  -- Where the facts were read, so anyone can check them.
  source_url text,
  business_name text not null check (btrim(business_name) <> ''),
  category text,
  city text,
  region text not null default 'FL',
  website text,
  phone text,
  -- The business's own published address. Goes to vendor_claims.contact_email
  -- (what claim_listing_by_email() matches), never to the public profile.
  email text,
  note text,
  raw jsonb,
  status text not null default 'new'
    check (status in ('new', 'duplicate', 'imported', 'rejected')),
  org_id uuid references public.organizations(id) on delete set null,
  submitted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists vendor_leads_status_idx on public.vendor_leads (status, source);
create index if not exists vendor_leads_org_idx on public.vendor_leads (org_id);

-- Re-running a licence or Places import must not stack duplicate leads. Only
-- the sources whose source_ref is a real per-business identifier: a venue's
-- name is shared by every vendor on its list.
create unique index if not exists vendor_leads_source_ref_uniq
  on public.vendor_leads (source, source_ref)
  where source in ('google_places', 'county_btr', 'dbpr') and source_ref is not null;

-- Lists are re-researched; the same vendor from the same venue list is one lead.
create unique index if not exists vendor_leads_list_uniq
  on public.vendor_leads (source, lower(coalesce(source_ref, '')), lower(btrim(business_name)))
  where source in ('web_search', 'association', 'venue_preferred');

-- Same posture as vendor_claims: RLS on, no policies, reachable only through
-- the definer functions below and the service role.
alter table public.vendor_leads enable row level security;
revoke all on public.vendor_leads from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Matching keys. Mirrored in lib/vendor-leads.ts for the import scripts; the
-- tests there pin the same cases.
-- ---------------------------------------------------------------------------

-- Last ten digits, so +1 (954) 721-9911 and 954.721.9911 match. Null when
-- there are not ten digits -- a partial number must not match anything.
create or replace function public.vendor_phone10(p text)
returns text language sql immutable set search_path to 'public', 'pg_temp' as $$
  select case when length(d) >= 10 then right(d, 10) end
  from (select regexp_replace(coalesce(p, ''), '\D', '', 'g') as d) s
$$;

-- Bare host of a first-party site. Null for directories and social profiles:
-- two vendors who both "have a website" at facebook.com are not the same
-- business, and VENDOR-PROSPECTS.md never treats those as a website at all.
create or replace function public.vendor_site_domain(p text)
returns text language sql immutable set search_path to 'public', 'pg_temp' as $$
  select case
    when h = '' then null
    when h ~ '(^|\.)(facebook|instagram|theknot|weddingwire|yelp|linktr|google|tiktok|pinterest|zola|thumbtack|bark|x|twitter|youtube|weddingrule|herecomestheguide)\.(com|ee|co)$' then null
    else h
  end
  from (
    select regexp_replace(
             regexp_replace(lower(btrim(coalesce(p, ''))), '^[a-z]+://', ''),
             '^www\.|[/?#:].*$', '', 'g') as h
  ) s
$$;

-- Name with the noise removed: case, punctuation, "&" vs "and", a leading
-- "the" and a trailing legal suffix. Deliberately NOT stripping words like
-- "studio" or "events" -- "Bliss Events" and "Bliss Photography" are different
-- businesses, and a false merge loses a listing where a false split only
-- leaves a duplicate an admin can see.
create or replace function public.vendor_name_key(p text)
returns text language sql immutable set search_path to 'public', 'pg_temp' as $$
  select nullif(btrim(regexp_replace(regexp_replace(regexp_replace(regexp_replace(
           lower(coalesce(p, '')),
           '&', ' and ', 'g'),
           '[^a-z0-9 ]', ' ', 'g'),
           '^\s*the\s+|\s+(llc|inc|corp|corporation|co|company|ltd|pa|pllc)\s*$', ' ', 'g'),
           '\s+', ' ', 'g')), '')
$$;

-- The listing a lead is the same business as, or null. Phone first (the
-- strongest signal we hold), then domain, then name -- and a name match must
-- be unambiguous, because two different "Elegant Events" exist in Florida.
create or replace function public.find_vendor_match(
  p_name text, p_city text, p_phone text, p_website text
) returns uuid
language plpgsql stable security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_phone text := public.vendor_phone10(p_phone);
  v_domain text := public.vendor_site_domain(p_website);
  v_name text := public.vendor_name_key(p_name);
  v_hit uuid;
  v_n int;
begin
  if v_phone is not null then
    select org_id into v_hit from public.vendor_profiles
     where public.vendor_phone10(phone) = v_phone limit 1;
    if v_hit is not null then return v_hit; end if;
  end if;

  if v_domain is not null then
    select org_id into v_hit from public.vendor_profiles
     where public.vendor_site_domain(website) = v_domain limit 1;
    if v_hit is not null then return v_hit; end if;
  end if;

  if v_name is not null then
    select count(*), min(org_id::text)::uuid into v_n, v_hit
      from public.vendor_profiles
     where public.vendor_name_key(business_name) = v_name;
    if v_n = 1 then return v_hit; end if;
  end if;

  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- Importing one lead
-- ---------------------------------------------------------------------------

create or replace function public.import_vendor_lead(p_lead uuid)
returns table (status text, org_id uuid)
language plpgsql security definer
set search_path to 'public', 'pg_temp'
as $$
#variable_conflict use_column
declare
  l public.vendor_leads%rowtype;
  v_match uuid;
  v_claimed boolean;
  v_site text;
  v_email text;
  v_new uuid;
begin
  select * into l from public.vendor_leads where id = p_lead for update;
  if not found then
    raise exception 'No such lead' using errcode = 'P0002';
  end if;
  if l.status <> 'new' then
    return query select l.status, l.org_id;
    return;
  end if;

  -- A directory URL is not the business's website; keep it out of the listing.
  v_site := case when public.vendor_site_domain(l.website) is not null
                 then nullif(btrim(l.website), '') end;
  -- Only a researched source carries a published business address. What a
  -- couple types into a form is unverified and must not become a credential
  -- that claim_listing_by_email() honours.
  v_email := case when l.source in ('couple_referral', 'vendor_referral') then null
                  else nullif(btrim(coalesce(l.email, '')), '') end;

  v_match := public.find_vendor_match(l.business_name, l.city, l.phone, v_site);

  if v_match is not null then
    select exists (select 1 from public.org_members m where m.org_id = v_match)
      into v_claimed;

    if not v_claimed then
      update public.vendor_profiles p set
        phone = coalesce(p.phone, nullif(btrim(coalesce(l.phone, '')), '')),
        website = coalesce(p.website, v_site),
        category = coalesce(p.category, nullif(btrim(coalesce(l.category, '')), ''))
      where p.org_id = v_match;

      update public.vendor_profiles p set status = 'published'
       where p.org_id = v_match and p.status = 'draft'
         and (p.phone is not null or p.website is not null);

      if v_email is not null then
        update public.vendor_claims c set contact_email = v_email
         where c.org_id = v_match and c.claimed_at is null and c.contact_email is null;
      end if;
    end if;

    update public.vendor_leads set status = 'duplicate', org_id = v_match, reviewed_at = now()
     where id = l.id;
    return query select 'duplicate'::text, v_match;
    return;
  end if;

  select c.org_id into v_new from public.create_claimable_listing(
    p_business_name => l.business_name,
    p_category => l.category,
    p_city => l.city,
    p_region => l.region,
    p_website => v_site,
    p_email => null,          -- the public email stays the vendor's choice
    p_phone => l.phone,
    p_description => null,
    p_contact_email => v_email,
    p_note => 'lead:' || l.source || coalesce(' / ' || l.source_ref, '')
  ) c;

  update public.vendor_profiles p set status = 'published'
   where p.org_id = v_new and (p.phone is not null or p.website is not null);

  update public.vendor_leads set status = 'imported', org_id = v_new, reviewed_at = now()
   where id = l.id;
  return query select 'imported'::text, v_new;
end;
$$;

-- Every new lead from the researched sources, or one named source. Returns one
-- row per outcome with a count. Referrals only when named explicitly.
create or replace function public.import_vendor_leads(p_source text default null)
returns table (outcome text, n bigint)
language plpgsql security definer
set search_path to 'public', 'pg_temp'
as $$
#variable_conflict use_column
declare
  r record;
  v_out text;
begin
  create temp table if not exists _lead_results (outcome text) on commit drop;
  for r in
    select id from public.vendor_leads
     where vendor_leads.status = 'new'
       and (case when p_source is null
                 then source not in ('couple_referral', 'vendor_referral')
                 else source = p_source end)
       and nullif(btrim(coalesce(category, '')), '') is not null
       and nullif(btrim(coalesce(city, '')), '') is not null
     order by created_at
  loop
    select i.status into v_out from public.import_vendor_lead(r.id) i;
    insert into _lead_results values (v_out);
  end loop;
  return query select x.outcome, count(*) from _lead_results x group by x.outcome;
  drop table if exists _lead_results;
end;
$$;

-- ---------------------------------------------------------------------------
-- Recommendations from signed-in users
-- ---------------------------------------------------------------------------

create or replace function public.suggest_vendor(
  p_business_name text,
  p_category text default null,
  p_city text default null,
  p_website text default null,
  p_phone text default null,
  p_note text default null
) returns uuid
language plpgsql security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_uid uuid := auth.uid();
  v_source text;
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'Sign in to recommend a vendor' using errcode = '42501';
  end if;
  if coalesce(btrim(p_business_name), '') = '' then
    raise exception 'A business name is required' using errcode = '22023';
  end if;
  if length(p_business_name) > 200 or length(coalesce(p_note, '')) > 1000
     or length(coalesce(p_website, '')) > 300 or length(coalesce(p_phone, '')) > 40
     or length(coalesce(p_city, '')) > 100 or length(coalesce(p_category, '')) > 60 then
    raise exception 'That is longer than we accept' using errcode = '22001';
  end if;
  -- A form anyone signed in can post to: cap it so it cannot fill the table.
  if (select count(*) from public.vendor_leads
       where submitted_by = v_uid and created_at > now() - interval '1 day') >= 20 then
    raise exception 'Thanks -- that is plenty for today' using errcode = '54000';
  end if;

  v_source := case when exists (
      select 1 from public.org_members m join public.organizations o on o.id = m.org_id
       where m.user_id = v_uid and o.type = 'vendor')
    then 'vendor_referral' else 'couple_referral' end;

  insert into public.vendor_leads (
    source, business_name, category, city, website, phone, note, submitted_by
  ) values (
    v_source, btrim(p_business_name),
    nullif(btrim(coalesce(p_category, '')), ''),
    nullif(btrim(coalesce(p_city, '')), ''),
    nullif(btrim(coalesce(p_website, '')), ''),
    nullif(btrim(coalesce(p_phone, '')), ''),
    nullif(btrim(coalesce(p_note, '')), ''),
    v_uid
  ) returning id into v_id;
  return v_id;
end;
$$;

-- Grants. Revoke from anon and authenticated BY NAME as well as from PUBLIC:
-- Supabase's default privileges grant EXECUTE to those roles directly (see
-- 20261006210000_claim_listing_by_email.sql), so revoking from PUBLIC alone
-- leaves them callable.
revoke all on function public.find_vendor_match(text, text, text, text) from public, anon, authenticated;
revoke all on function public.import_vendor_lead(uuid) from public, anon, authenticated;
revoke all on function public.import_vendor_leads(text) from public, anon, authenticated;
revoke all on function public.suggest_vendor(text, text, text, text, text, text) from public, anon;
grant execute on function public.suggest_vendor(text, text, text, text, text, text) to authenticated;
