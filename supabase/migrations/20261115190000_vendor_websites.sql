-- Vendor websites: a business site for each vendor at bridalteam.com/biz/<slug>,
-- built the same four ways as couples' guest websites
-- (20261031200000_custom_wedding_sites.sql):
--
--   template -- one tap from Bridal Team's themes, filled from the listing
--   ai       -- Bridal Team's AI designer, from a description
--   paste    -- their own HTML
--   mcp      -- their own assistant, through a per-vendor site key
--              (/api/mcp/biz, keys start "btbiz_")
--
-- The safety model is the couples' one, unchanged:
--   * Drafts and live code are separate; visitors only see live.
--   * Live code is only ever served from app/sandbox/* with an opaque-origin
--     CSP (lib/custom-site/serve.ts), never on bridalteam.com itself.
--   * Nothing goes live without the server recording that this exact draft
--     passed the content check (approve_vendor_site_draft, service role only).
--   * Admins can take a site down; the vendor can't republish until restored.
--
-- Differences from wedding sites:
--   * Publishing, and staying online, needs Pro or Featured (paid, comped or
--     through a promotion). If the plan lapses the site goes offline but
--     nothing is deleted; it comes back when the plan does.
--   * No 6-month retention: a business site is meant to last.
--   * Settings live in this table, not on vendor_profiles, which the vendor
--     team can write directly. Every write below goes through a function.
--
-- Live listing details (name, about, packages, photos, reviews...) are not
-- copied into the HTML: _vendor_site_payload() supplies them at serve time
-- and the runtime fills data-bt placeholders (lib/vendor-site/runtime.ts), so
-- the site stays current when the listing changes.

-- ── Tables ──────────────────────────────────────────────────────────────────
create table if not exists public.vendor_sites (
  -- Keyed to the listing (which cascades from organizations), so the API can
  -- embed vendor_profiles from vendor_sites.
  org_id              uuid primary key references public.vendor_profiles(org_id) on delete cascade,
  slug                text unique,
  published           boolean not null default false,
  draft_html          text check (draft_html is null or octet_length(draft_html) <= 512000),
  draft_source        text check (draft_source in ('paste', 'template', 'ai', 'mcp')),
  draft_updated_at    timestamptz,
  draft_approved_hash text,
  draft_approved_at   timestamptz,
  live_html           text check (live_html is null or octet_length(live_html) <= 512000),
  live_updated_at     timestamptz,
  blocked_at          timestamptz,
  block_reason        text check (block_reason is null or char_length(block_reason) <= 500),
  updated_by          uuid references auth.users(id) on delete set null,
  created_at          timestamptz not null default now()
);
comment on table public.vendor_sites is
  'Vendor business websites (/biz/<slug>). Draft is what they edit; live is what visitors get (sandboxed). Written only through the functions in 20261115190000_vendor_websites.sql.';

create table if not exists public.vendor_site_versions (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references public.organizations(id) on delete cascade,
  html       text not null check (octet_length(html) <= 512000),
  source     text not null check (source in ('paste', 'template', 'ai', 'mcp')),
  note       text check (note is null or char_length(note) <= 200),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists vendor_site_versions_org_idx on public.vendor_site_versions (org_id, created_at desc);

create table if not exists public.vendor_site_keys (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.organizations(id) on delete cascade,
  token_hash   text not null unique,
  hint         text not null,
  label        text not null check (char_length(label) between 1 and 60),
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at   timestamptz
);
create index if not exists vendor_site_keys_org_idx on public.vendor_site_keys (org_id);
comment on table public.vendor_site_keys is
  'Per-vendor bearer keys for /api/mcp/biz. Only the SHA-256 of each key is stored; the raw key is returned once by create_vendor_site_key().';

alter table public.vendor_sites         enable row level security;
alter table public.vendor_site_versions enable row level security;
alter table public.vendor_site_keys     enable row level security;

-- Members read; nobody writes directly.
revoke insert, update, delete on public.vendor_sites, public.vendor_site_versions, public.vendor_site_keys from anon, authenticated;

drop policy if exists vendor_sites_select_members on public.vendor_sites;
create policy vendor_sites_select_members on public.vendor_sites
  for select to authenticated using (public.is_org_member(org_id));
drop policy if exists vendor_site_versions_select_members on public.vendor_site_versions;
create policy vendor_site_versions_select_members on public.vendor_site_versions
  for select to authenticated using (public.is_org_member(org_id));
drop policy if exists vendor_site_keys_select_members on public.vendor_site_keys;
create policy vendor_site_keys_select_members on public.vendor_site_keys
  for select to authenticated using (public.is_org_member(org_id));

-- Takedowns are logged with the wedding ones.
alter table public.site_moderation_log
  add column if not exists org_id uuid references public.organizations(id) on delete set null;

-- ── Helpers (not callable by clients) ───────────────────────────────────────
-- Pro or Featured right now: paid, a live comp or a running promotion.
create or replace function public._vendor_site_plan_ok(p_org uuid)
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select coalesce((select public.vendor_plan(vp) in ('pro', 'featured')
                     from public.vendor_profiles vp where vp.org_id = p_org), false);
$$;

create or replace function public._write_vendor_site_draft(
  p_org uuid, p_html text, p_source text, p_note text, p_uid uuid
) returns timestamptz
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_now timestamptz := now();
begin
  if not exists (select 1 from public.organizations where id = p_org and type = 'vendor') then
    raise exception 'not a vendor' using errcode = '42501';
  end if;
  if p_html is null or btrim(p_html) = '' then
    raise exception 'empty site' using errcode = '22023';
  end if;
  if octet_length(p_html) > 512000 then
    raise exception 'site too large' using errcode = '22001';
  end if;

  insert into public.vendor_sites (org_id, draft_html, draft_source, draft_updated_at, updated_by)
  values (p_org, p_html, p_source, v_now, p_uid)
  on conflict (org_id) do update
    set draft_html = excluded.draft_html,
        draft_source = excluded.draft_source,
        draft_updated_at = excluded.draft_updated_at,
        updated_by = excluded.updated_by;

  insert into public.vendor_site_versions (org_id, html, source, note, created_by)
  values (p_org, p_html, p_source, nullif(left(btrim(coalesce(p_note, '')), 200), ''), p_uid);

  delete from public.vendor_site_versions
   where org_id = p_org
     and id not in (select id from public.vendor_site_versions
                     where org_id = p_org order by created_at desc limit 30);
  return v_now;
end;
$$;

-- Why an address can't be used, or null. Same rules as wedding addresses
-- (wedding_slug_problem), in the /biz/ namespace.
create or replace function public.vendor_site_slug_problem(p_slug text, p_org uuid default null)
returns text
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v text := lower(coalesce(p_slug, ''));
  tok text;
  reserved text[] := array['admin','api','app','auth','biz','blog','contact','dashboard','help','login','logout',
    'mail','new','official','planner','pricing','sandbox','settings','signup','staff','support','team',
    'terms','privacy','test','vendor','vendors','wedding','weddings','www'];
  blocked text[] := array['anal','bitch','cock','cum','cunt','dick','fag','faggot','fuck','fucking','hitler',
    'jizz','kike','milf','nazi','nigga','nigger','nude','nudes','porn','porno','pussy','rape','retard',
    'sex','sexy','shit','slut','spic','tits','twat','whore','xxx'];
begin
  if v !~ '^[a-z0-9]([a-z0-9-]{1,38})[a-z0-9]$' or v like '%--%' then
    return 'format';
  end if;
  if v = any(reserved) or replace(v, '-', '') like '%bridalteam%' then
    return 'reserved';
  end if;
  foreach tok in array string_to_array(v, '-') loop
    if tok = any(blocked) then return 'blocked'; end if;
  end loop;
  if exists (select 1 from public.vendor_sites s where s.slug = v and s.org_id is distinct from p_org) then
    return 'taken';
  end if;
  return null;
end;
$$;

-- Everything a site shows that comes from the listing, as one JSON value.
create or replace function public._vendor_site_payload(p_org uuid)
returns jsonb
language sql stable security definer set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'org_id', vp.org_id,
    'business_name', vp.business_name,
    'category', vp.category,
    'description', vp.description,
    'city', vp.city,
    'region', vp.region,
    'website', vp.website,
    'email', vp.email,
    'phone', vp.phone,
    'logo_url', vp.logo_url,
    'cover_url', vp.cover_url,
    'social_links', coalesce(vp.social_links, '{}'::jsonb),
    'price_tier', vp.price_tier,
    'highlights', coalesce(vp.highlights, '[]'::jsonb),
    'packages', coalesce(vp.packages, '[]'::jsonb),
    'faqs', coalesce(vp.faqs, '[]'::jsonb),
    'listing_published', vp.status = 'published',
    'gallery', coalesce((
      select jsonb_agg(jsonb_build_object('image_url', g.image_url, 'title', g.title,
                                          'media_type', g.media_type, 'media_url', g.media_url)
                       order by g.created_at desc)
        from (select * from public.inspiration_images i where i.vendor_id = vp.org_id
               order by i.created_at desc limit 24) g), '[]'::jsonb),
    'reviews', jsonb_build_object(
      'count', (select count(*) from public.vendor_reviews r where r.vendor_org_id = vp.org_id),
      'average', (select round(avg(r.rating)::numeric, 1) from public.vendor_reviews r where r.vendor_org_id = vp.org_id),
      'items', coalesce((
        select jsonb_agg(jsonb_build_object('author_name', x.author_name, 'rating', x.rating, 'body', x.body)
                         order by x.created_at desc)
          from (select * from public.vendor_reviews r where r.vendor_org_id = vp.org_id
                 order by r.created_at desc limit 6) x), '[]'::jsonb))
  )
  from public.vendor_profiles vp
  where vp.org_id = p_org;
$$;

revoke all on function public._vendor_site_plan_ok(uuid) from public, anon, authenticated;
revoke all on function public._write_vendor_site_draft(uuid, text, text, text, uuid) from public, anon, authenticated;
revoke all on function public._vendor_site_payload(uuid) from public, anon, authenticated;
revoke all on function public.vendor_site_slug_problem(text, uuid) from public, anon;
grant execute on function public.vendor_site_slug_problem(text, uuid) to authenticated;

-- Publish the approved draft. Shared by the dashboard and the site key.
create or replace function public._publish_vendor_site(p_org uuid, p_uid uuid)
returns timestamptz
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_now timestamptz := now(); s record;
begin
  select * into s from public.vendor_sites where org_id = p_org for update;
  if not found or s.draft_html is null then
    raise exception 'no draft to publish' using errcode = 'P0002';
  end if;
  if s.blocked_at is not null then
    raise exception 'this site was taken down by Bridal Team' using errcode = 'BT003';
  end if;
  if not public._vendor_site_plan_ok(p_org) then
    raise exception 'vendor websites need Pro or Featured' using errcode = 'BT004';
  end if;
  if s.draft_approved_hash is null or s.draft_approved_hash <> public._site_html_hash(s.draft_html) then
    raise exception 'draft has not passed the content check' using errcode = 'BT001';
  end if;
  if s.slug is null then
    raise exception 'choose a web address first' using errcode = 'BT005';
  end if;
  update public.vendor_sites
     set live_html = draft_html, live_updated_at = v_now, published = true, updated_by = p_uid
   where org_id = p_org;
  return v_now;
end;
$$;
revoke all on function public._publish_vendor_site(uuid, uuid) from public, anon, authenticated;

-- ── Signed-in vendor team ───────────────────────────────────────────────────
create or replace function public.save_vendor_site(p_org uuid, p_html text, p_source text, p_note text default null)
returns timestamptz
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.is_org_member(p_org) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_source not in ('paste', 'template', 'ai') then
    raise exception 'bad source' using errcode = '22023';
  end if;
  return public._write_vendor_site_draft(p_org, p_html, p_source, p_note, auth.uid());
end;
$$;

create or replace function public.publish_vendor_site(p_org uuid)
returns timestamptz
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.is_org_member(p_org) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return public._publish_vendor_site(p_org, auth.uid());
end;
$$;

-- Take the site offline, or back online (only what was already published).
create or replace function public.set_vendor_site_online(p_org uuid, p_online boolean)
returns boolean
language plpgsql security definer set search_path = public, pg_temp
as $$
declare s record;
begin
  if not public.is_org_member(p_org) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  select * into s from public.vendor_sites where org_id = p_org for update;
  if not found then
    raise exception 'no site yet' using errcode = 'P0002';
  end if;
  if p_online then
    if s.live_html is null then raise exception 'no draft to publish' using errcode = 'P0002'; end if;
    if s.blocked_at is not null then raise exception 'taken down' using errcode = 'BT003'; end if;
    if not public._vendor_site_plan_ok(p_org) then raise exception 'plan' using errcode = 'BT004'; end if;
    if s.slug is null then raise exception 'address' using errcode = 'BT005'; end if;
  end if;
  update public.vendor_sites set published = p_online, updated_by = auth.uid() where org_id = p_org;
  return p_online;
end;
$$;

create or replace function public.claim_vendor_site_slug(p_org uuid, p_slug text)
returns text
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v text := lower(btrim(coalesce(p_slug, ''))); v_problem text;
begin
  if not public.is_org_member(p_org) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if not exists (select 1 from public.organizations where id = p_org and type = 'vendor') then
    raise exception 'not a vendor' using errcode = '42501';
  end if;
  v_problem := public.vendor_site_slug_problem(v, p_org);
  if v_problem is not null then
    raise exception '%', v_problem using errcode = 'BT002';
  end if;
  insert into public.vendor_sites (org_id, slug, updated_by) values (p_org, v, auth.uid())
  on conflict (org_id) do update set slug = excluded.slug, updated_by = excluded.updated_by;
  return v;
end;
$$;

create or replace function public.restore_vendor_site_version(p_version uuid)
returns timestamptz
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v record;
begin
  select org_id, html, source into v from public.vendor_site_versions where id = p_version;
  if not found or not public.is_org_member(v.org_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return public._write_vendor_site_draft(v.org_id, v.html, v.source, 'Restored an earlier version', auth.uid());
end;
$$;

create or replace function public.create_vendor_site_key(p_org uuid, p_label text)
returns text
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_key text;
begin
  if not public.is_org_member(p_org) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if (select count(*) from public.vendor_site_keys where org_id = p_org and revoked_at is null) >= 5 then
    raise exception 'too many keys' using errcode = '54000';
  end if;
  v_key := 'btbiz_' || encode(extensions.gen_random_bytes(24), 'hex');
  insert into public.vendor_site_keys (org_id, token_hash, hint, label, created_by)
  values (p_org, encode(extensions.digest(v_key, 'sha256'), 'hex'), right(v_key, 4),
          coalesce(nullif(left(btrim(coalesce(p_label, '')), 60), ''), 'My assistant'), auth.uid());
  return v_key;
end;
$$;

create or replace function public.revoke_vendor_site_key(p_id uuid)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_org uuid;
begin
  select org_id into v_org from public.vendor_site_keys where id = p_id;
  if v_org is null or not public.is_org_member(v_org) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  update public.vendor_site_keys set revoked_at = coalesce(revoked_at, now()) where id = p_id;
end;
$$;

-- The listing details for the dashboard preview and the AI designer.
create or replace function public.vendor_site_payload(p_org uuid)
returns jsonb
language plpgsql stable security definer set search_path = public, pg_temp
as $$
begin
  if not public.is_org_member(p_org) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return public._vendor_site_payload(p_org);
end;
$$;

-- Server only (service_role): records that this exact draft passed review.
create or replace function public.approve_vendor_site_draft(p_org uuid, p_hash text)
returns boolean
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  update public.vendor_sites
     set draft_approved_hash = p_hash, draft_approved_at = now()
   where org_id = p_org and draft_html is not null
     and public._site_html_hash(draft_html) = p_hash;
  return found;
end;
$$;

-- ── Site key (the vendor's own assistant, no session) ───────────────────────
create or replace function public._org_for_vendor_site_key(p_key text)
returns uuid
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_id uuid; v_org uuid;
begin
  select id, org_id into v_id, v_org
    from public.vendor_site_keys
   where token_hash = encode(extensions.digest(coalesce(p_key, ''), 'sha256'), 'hex')
     and revoked_at is null;
  if v_org is null then
    raise exception 'invalid site key' using errcode = '28000';
  end if;
  update public.vendor_site_keys set last_used_at = now()
   where id = v_id and (last_used_at is null or last_used_at < now() - interval '1 minute');
  return v_org;
end;
$$;
revoke all on function public._org_for_vendor_site_key(text) from public, anon, authenticated;

create or replace function public.vkey_org_id(p_key text)
returns uuid
language plpgsql security definer set search_path = public, pg_temp
as $$ begin return public._org_for_vendor_site_key(p_key); end; $$;

create or replace function public.vkey_site_context(p_key text)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_org uuid := public._org_for_vendor_site_key(p_key); s record;
begin
  select * into s from public.vendor_sites where org_id = v_org;
  return public._vendor_site_payload(v_org) || jsonb_build_object(
    'slug', s.slug,
    'published', coalesce(s.published, false),
    'has_draft', s.draft_html is not null, 'draft_updated_at', s.draft_updated_at,
    'has_live', s.live_html is not null, 'live_updated_at', s.live_updated_at,
    'plan_ok', public._vendor_site_plan_ok(v_org));
end;
$$;

create or replace function public.vkey_get_site(p_key text, p_which text default 'draft')
returns text
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_org uuid := public._org_for_vendor_site_key(p_key);
begin
  return (select case when p_which = 'live' then live_html else draft_html end
            from public.vendor_sites where org_id = v_org);
end;
$$;

create or replace function public.vkey_save_site(p_key text, p_html text, p_note text default null)
returns timestamptz
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  return public._write_vendor_site_draft(public._org_for_vendor_site_key(p_key), p_html, 'mcp', p_note, null);
end;
$$;

create or replace function public.vkey_publish_site(p_key text)
returns timestamptz
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  return public._publish_vendor_site(public._org_for_vendor_site_key(p_key), null);
end;
$$;

-- ── Visitors ────────────────────────────────────────────────────────────────
-- A live site and its listing details, or null (not published, taken down,
-- or the vendor's plan doesn't include a website right now).
create or replace function public.get_public_vendor_site(p_slug text)
returns jsonb
language sql stable security definer set search_path = public, pg_temp
as $$
  select jsonb_build_object('org_id', s.org_id, 'html', s.live_html, 'listing', public._vendor_site_payload(s.org_id))
    from public.vendor_sites s
   where s.slug = lower(p_slug)
     and s.published
     and s.live_html is not null
     and s.blocked_at is null
     and public._vendor_site_plan_ok(s.org_id)
   limit 1;
$$;

-- ── Admin (service_role) ────────────────────────────────────────────────────
create or replace function public._vendor_site_contacts(p_org uuid)
returns jsonb
language sql stable security definer set search_path = public, pg_temp
as $$
  select coalesce(jsonb_agg(distinct u.email), '[]'::jsonb)
    from public.org_members m join auth.users u on u.id = m.user_id
   where m.org_id = p_org and u.email is not null;
$$;
revoke all on function public._vendor_site_contacts(uuid) from public, anon, authenticated;

create or replace function public.admin_take_down_vendor_site(p_org uuid, p_reason text, p_admin text)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v record; v_reason text := left(btrim(coalesce(p_reason, '')), 500);
begin
  if v_reason = '' then
    raise exception 'a reason is required' using errcode = '22023';
  end if;
  select s.org_id, s.slug, vp.business_name into v
    from public.vendor_sites s left join public.vendor_profiles vp on vp.org_id = s.org_id
   where s.org_id = p_org for update of s;
  if not found then
    raise exception 'no such site' using errcode = 'P0002';
  end if;
  update public.vendor_sites
     set published = false, blocked_at = now(), block_reason = v_reason
   where org_id = p_org;
  update public.vendor_site_keys set revoked_at = coalesce(revoked_at, now()) where org_id = p_org;
  insert into public.site_moderation_log (org_id, slug, action, reason, admin)
  values (p_org, v.slug, 'takedown', v_reason, nullif(left(btrim(coalesce(p_admin, '')), 100), ''));
  return jsonb_build_object('names', v.business_name, 'slug', v.slug, 'emails', public._vendor_site_contacts(p_org));
end;
$$;

create or replace function public.admin_restore_vendor_site(p_org uuid, p_note text, p_admin text)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v record;
begin
  select s.org_id, s.slug, s.blocked_at, vp.business_name into v
    from public.vendor_sites s left join public.vendor_profiles vp on vp.org_id = s.org_id
   where s.org_id = p_org for update of s;
  if not found then
    raise exception 'no such site' using errcode = 'P0002';
  end if;
  if v.blocked_at is null then
    raise exception 'this site is not taken down' using errcode = '22023';
  end if;
  update public.vendor_sites set blocked_at = null, block_reason = null where org_id = p_org;
  insert into public.site_moderation_log (org_id, slug, action, reason, admin)
  values (p_org, v.slug, 'restore', nullif(left(btrim(coalesce(p_note, '')), 500), ''),
          nullif(left(btrim(coalesce(p_admin, '')), 100), ''));
  return jsonb_build_object('names', v.business_name, 'slug', v.slug, 'emails', public._vendor_site_contacts(p_org));
end;
$$;

-- ── Grants ──────────────────────────────────────────────────────────────────
revoke all on function public.save_vendor_site(uuid, text, text, text) from public, anon;
revoke all on function public.publish_vendor_site(uuid) from public, anon;
revoke all on function public.set_vendor_site_online(uuid, boolean) from public, anon;
revoke all on function public.claim_vendor_site_slug(uuid, text) from public, anon;
revoke all on function public.restore_vendor_site_version(uuid) from public, anon;
revoke all on function public.create_vendor_site_key(uuid, text) from public, anon;
revoke all on function public.revoke_vendor_site_key(uuid) from public, anon;
revoke all on function public.vendor_site_payload(uuid) from public, anon;
grant execute on function public.save_vendor_site(uuid, text, text, text) to authenticated;
grant execute on function public.publish_vendor_site(uuid) to authenticated;
grant execute on function public.set_vendor_site_online(uuid, boolean) to authenticated;
grant execute on function public.claim_vendor_site_slug(uuid, text) to authenticated;
grant execute on function public.restore_vendor_site_version(uuid) to authenticated;
grant execute on function public.create_vendor_site_key(uuid, text) to authenticated;
grant execute on function public.revoke_vendor_site_key(uuid) to authenticated;
grant execute on function public.vendor_site_payload(uuid) to authenticated;

revoke all on function public.approve_vendor_site_draft(uuid, text) from public, anon, authenticated;
grant execute on function public.approve_vendor_site_draft(uuid, text) to service_role;
revoke all on function public.admin_take_down_vendor_site(uuid, text, text) from public, anon, authenticated;
grant execute on function public.admin_take_down_vendor_site(uuid, text, text) to service_role;
revoke all on function public.admin_restore_vendor_site(uuid, text, text) from public, anon, authenticated;
grant execute on function public.admin_restore_vendor_site(uuid, text, text) to service_role;

revoke all on function public.vkey_org_id(text) from public;
revoke all on function public.vkey_site_context(text) from public;
revoke all on function public.vkey_get_site(text, text) from public;
revoke all on function public.vkey_save_site(text, text, text) from public;
revoke all on function public.vkey_publish_site(text) from public;
grant execute on function public.vkey_org_id(text) to anon, authenticated;
grant execute on function public.vkey_site_context(text) to anon, authenticated;
grant execute on function public.vkey_get_site(text, text) to anon, authenticated;
grant execute on function public.vkey_save_site(text, text, text) to anon, authenticated;
grant execute on function public.vkey_publish_site(text) to anon, authenticated;

revoke all on function public.get_public_vendor_site(text) from public;
grant execute on function public.get_public_vendor_site(text) to anon, authenticated;
