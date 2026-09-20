-- Claim-your-listing.
--
-- Cold-start conversion. Asking a vendor to create an account and fill in a
-- profile for a directory they have never heard of is a lot of work for no
-- promised return; handing them a page that already exists and saying "this is
-- yours, fix anything I got wrong" is almost none. The Free tier's own tagline
-- in lib/tiers.ts has said "Claim your listing" since it was written -- there
-- was simply never a claim to make.
--
-- Shape: an unclaimed listing is an `organizations` row with a `vendor_profiles`
-- row in 'draft' and NO `org_members`. Nothing public renders a draft, and the
-- organizations RLS policy is membership-based, so an unclaimed org is
-- invisible to every signed-in user until someone claims it. Claiming inserts
-- the missing org_members row -- exactly what create_vendor_account() would
-- have inserted had the vendor signed up themselves.
--
-- The token is the authorization, so it is treated like a credential: 32 random
-- bytes, and only its SHA-256 is stored, the same way admin_sessions handles
-- its cookie (security/2026-08-admin-hardening-tables.sql). A database read
-- cannot reconstruct a working claim link.
--
-- pgcrypto's digest() and gen_random_bytes() are schema-qualified as
-- extensions.* on purpose. Supabase installs pgcrypto into `extensions`, not
-- `public`, and these functions pin search_path to 'public', 'pg_temp' -- as
-- every SECURITY DEFINER function here does, because a wide search_path on a
-- definer function is how you get one hijacked. Unqualified, they fail with
-- "function digest(text, unknown) does not exist" at creation. Do not "fix"
-- this by widening the search_path. (gen_random_uuid() needs no prefix: it is
-- core Postgres since 13, not pgcrypto.)

create table if not exists public.vendor_claims (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  -- SHA-256 hex of the token we emailed. The raw token is returned exactly
  -- once, by create_claimable_listing(), and never stored.
  token_hash text not null unique,
  -- Where the claim link was sent, so a "who did we contact" question has an
  -- answer that does not depend on someone's sent-mail folder.
  contact_email text,
  note text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '60 days',
  claimed_at timestamptz,
  claimed_by uuid references auth.users(id)
);

create index if not exists vendor_claims_org_id_idx on public.vendor_claims (org_id);

-- RLS on, no policies: reachable only through the SECURITY DEFINER functions
-- below and the service role. Same posture as admin_sessions and ai_usage, and
-- it will show up in the advisors as the same INFO-level lint.
alter table public.vendor_claims enable row level security;

revoke all on public.vendor_claims from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Creating a claimable listing (us, not the vendor)
-- ---------------------------------------------------------------------------

create or replace function public.create_claimable_listing(
  p_business_name text,
  p_category text default null,
  p_city text default null,
  p_region text default null,
  p_website text default null,
  p_email text default null,
  p_phone text default null,
  p_description text default null,
  p_contact_email text default null,
  p_note text default null,
  p_comp_plan text default null,
  p_comp_months integer default 12
) returns table (org_id uuid, token text)
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_org uuid;
  v_token text;
begin
  if coalesce(btrim(p_business_name), '') = '' then
    raise exception 'A business name is required' using errcode = '22023';
  end if;

  -- url-safe: the token goes in a link, and base64 '+' and '/' do not survive
  -- being pasted into an email client intact.
  v_token := replace(replace(encode(extensions.gen_random_bytes(32), 'base64'), '+', '-'), '/', '_');
  v_token := replace(v_token, '=', '');

  insert into public.organizations (name, type, comp_plan, comp_expires_at, comp_note)
  values (
    btrim(p_business_name),
    'vendor',
    p_comp_plan,
    case when p_comp_plan is null then null
         else now() + make_interval(months => greatest(p_comp_months, 1)) end,
    p_note
  )
  returning id into v_org;

  -- Draft, always. Publishing is the vendor's decision to make, not ours --
  -- putting a business's details live before they have seen them is the one
  -- thing that would turn this from a favour into a complaint.
  insert into public.vendor_profiles (
    org_id, business_name, category, city, region, website, email, phone, description, status
  ) values (
    v_org, btrim(p_business_name),
    nullif(btrim(coalesce(p_category, '')), ''),
    nullif(btrim(coalesce(p_city, '')), ''),
    nullif(btrim(coalesce(p_region, '')), ''),
    nullif(btrim(coalesce(p_website, '')), ''),
    nullif(btrim(coalesce(p_email, '')), ''),
    nullif(btrim(coalesce(p_phone, '')), ''),
    nullif(btrim(coalesce(p_description, '')), ''),
    'draft'
  );

  insert into public.vendor_claims (org_id, token_hash, contact_email, note)
  values (v_org, encode(extensions.digest(v_token, 'sha256'), 'hex'),
          nullif(btrim(coalesce(p_contact_email, p_email, '')), ''), p_note);

  return query select v_org, v_token;
end;
$$;

-- Ours alone. This mints credentials and writes rows nobody owns yet.
revoke all on function public.create_claimable_listing(
  text, text, text, text, text, text, text, text, text, text, text, integer
) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Previewing a claim (signed out -- this is what the outreach link opens)
-- ---------------------------------------------------------------------------

create or replace function public.get_claim_preview(p_token text)
returns table (
  org_id uuid,
  business_name text,
  category text,
  city text,
  region text,
  website text,
  description text,
  claimed boolean,
  expired boolean
)
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $$
  -- Returns the listing's *public-facing* fields only. Deliberately omits the
  -- contact email and phone we may have gathered: someone holding the link is
  -- probably the business, but "probably" is not a reason to hand over contact
  -- details to whoever opens a forwarded email.
  select p.org_id, p.business_name, p.category, p.city, p.region, p.website,
         p.description,
         c.claimed_at is not null as claimed,
         c.expires_at <= now() as expired
    from public.vendor_claims c
    join public.vendor_profiles p on p.org_id = c.org_id
   where c.token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex')
   limit 1;
$$;

-- Anon has to reach this: the link is opened before anyone signs in. The token
-- is the authorization, and an unguessable 32-byte secret is what stands in for
-- a session here.
grant execute on function public.get_claim_preview(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Claiming it
-- ---------------------------------------------------------------------------

create or replace function public.claim_vendor_listing(p_token text)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_uid uuid := auth.uid();
  v_claim public.vendor_claims;
begin
  if v_uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  -- Locked, because two clicks on the same link a second apart would otherwise
  -- both pass the "not yet claimed" check and race to insert org_members.
  select * into v_claim
    from public.vendor_claims
   where token_hash = encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex')
   for update;

  if v_claim.id is null then
    raise exception 'That claim link is not valid' using errcode = '22023';
  end if;
  if v_claim.claimed_at is not null then
    -- Idempotent for the person who already claimed it: a second click on
    -- their own link lands them back on their listing instead of an error.
    if v_claim.claimed_by = v_uid then
      return v_claim.org_id;
    end if;
    raise exception 'That listing has already been claimed' using errcode = '22023';
  end if;
  if v_claim.expires_at <= now() then
    raise exception 'That claim link has expired' using errcode = '22023';
  end if;

  -- One workspace per account, the same rule create_vendor_account() enforces.
  -- Without this, a couple could claim a vendor listing onto the account that
  -- already holds their wedding and end up with two orgs and a dashboard that
  -- cannot decide where to send them.
  if exists (select 1 from public.org_members where user_id = v_uid) then
    raise exception 'This account already has a workspace. Sign up with a separate email for your business.'
      using errcode = '22023';
  end if;

  insert into public.org_members (org_id, user_id, role) values (v_claim.org_id, v_uid, 'owner');

  update public.vendor_claims
     set claimed_at = now(), claimed_by = v_uid
   where id = v_claim.id;

  return v_claim.org_id;
end;
$$;

-- Revoke from PUBLIC, not from `anon`. EXECUTE on a new function is granted to
-- PUBLIC, which anon inherits, so naming the role removes a grant that was
-- never there -- the exact trap the closing note of SECURITY-AUDIT-MAIN.md
-- describes. The first version of this file got it wrong and left
-- claim_vendor_listing anon-reachable; caught by checking
-- has_function_privilege() after applying rather than by reading the SQL.
revoke execute on function public.claim_vendor_listing(text) from public;
grant execute on function public.claim_vendor_listing(text) to authenticated;

comment on table public.vendor_claims is
  'Outreach claim links for pre-created vendor listings. Only the SHA-256 of each token is stored; the raw token is returned once by create_claimable_listing(). See VENDOR-OUTREACH.md.';
