-- Custom guest websites: content policy, retention, and reusable addresses.
--
-- ── 1. Nothing goes live without passing the policy check ───────────────────
-- Couples (and their own AI) can write any HTML. Before it reaches guests,
-- the app reviews the draft against Bridal Team's content policy
-- (lib/custom-site/policy.ts): no explicit or hateful content, no scams, and
-- nothing that puts Bridal Team in a bad light. Only the server records a
-- pass, with the SHA-256 of the exact HTML it reviewed; publishing refuses any
-- draft whose hash doesn't match. So calling publish_custom_site or
-- key_publish_site directly over the REST API can't skip the check, and
-- editing the draft after a pass needs a fresh review.
--
-- ── 2. Sites come down 6 months after the wedding ───────────────────────────
-- Guest sites are for the wedding, not forever. run_site_retention(), called
-- daily by /api/cron/site-retention, does three things:
--   * 30 days after the wedding: version history is trimmed to the newest
--     version (old versions are most of the storage).
--   * 30 and 7 days before the end: returns who to remind (the app emails).
--   * 6 months after the wedding: the custom code, history and site keys are
--     deleted, the website is turned off, and its address is retired.
-- Planning data (guests, budget, checklist...) is untouched.
-- Weddings with no date end 24 months after they were created.
--
-- ── 3. Addresses can be reused ──────────────────────────────────────────────
-- A retired address shows "This wedding website has ended" for 30 days, so
-- old links don't land on a stranger's wedding, then anyone can claim it.
-- Couples can now pick a clean address (gene-and-john) instead of the random
-- suffix, through claim_wedding_slug(); reserved and offensive words, and
-- anything using the Bridal Team name, are refused.

-- ── Policy gate ─────────────────────────────────────────────────────────────
alter table public.wedding_custom_sites
  add column if not exists draft_approved_hash text,
  add column if not exists draft_approved_at timestamptz;

create or replace function public._site_html_hash(p_html text)
returns text
language sql immutable set search_path = public, pg_temp
as $$ select encode(extensions.digest(convert_to(coalesce(p_html, ''), 'UTF8'), 'sha256'), 'hex') $$;
revoke all on function public._site_html_hash(text) from public, anon, authenticated;

-- Server only (service_role): records that this exact draft passed review.
-- Returns false when the draft changed since it was reviewed.
create or replace function public.approve_custom_site_draft(p_wid uuid, p_hash text)
returns boolean
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  update public.wedding_custom_sites
     set draft_approved_hash = p_hash, draft_approved_at = now()
   where wedding_id = p_wid and draft_html is not null
     and public._site_html_hash(draft_html) = p_hash;
  return found;
end;
$$;
revoke all on function public.approve_custom_site_draft(uuid, text) from public, anon, authenticated;
grant execute on function public.approve_custom_site_draft(uuid, text) to service_role;

-- Publishing now requires a passed review of the current draft.
create or replace function public._publish_custom_site(p_wid uuid, p_uid uuid)
returns timestamptz
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_now timestamptz := now(); v_html text; v_ok text;
begin
  select draft_html, draft_approved_hash into v_html, v_ok
    from public.wedding_custom_sites where wedding_id = p_wid for update;
  if v_html is null then
    raise exception 'no draft to publish' using errcode = 'P0002';
  end if;
  if v_ok is null or v_ok <> public._site_html_hash(v_html) then
    raise exception 'draft has not passed the content check' using errcode = 'BT001';
  end if;
  update public.wedding_custom_sites
     set live_html = draft_html, live_updated_at = v_now, updated_by = p_uid
   where wedding_id = p_wid;
  update public.weddings set site_mode = 'custom', updated_at = v_now where id = p_wid;
  return v_now;
end;
$$;
revoke all on function public._publish_custom_site(uuid, uuid) from public, anon, authenticated;

-- The MCP endpoint needs the wedding behind a key to run the review.
create or replace function public.key_wedding_id(p_key text)
returns uuid
language plpgsql security definer set search_path = public, pg_temp
as $$ begin return public._wedding_for_site_key(p_key); end; $$;
revoke all on function public.key_wedding_id(text) from public;
grant execute on function public.key_wedding_id(text) to anon, authenticated;

-- ── Retention ───────────────────────────────────────────────────────────────
alter table public.weddings
  add column if not exists website_ended_at timestamptz,
  add column if not exists site_notice_30_at timestamptz,
  add column if not exists site_notice_7_at timestamptz;

-- When a wedding's guest website comes down. Keep in step with
-- lib/custom-site/retention.ts.
create or replace function public.wedding_site_ends_on(p_event_date date, p_created_at timestamptz)
returns date
language sql immutable set search_path = public, pg_temp
as $$
  select case when p_event_date is not null
              then (p_event_date + interval '6 months')::date
              else (p_created_at + interval '24 months')::date end
$$;
grant execute on function public.wedding_site_ends_on(date, timestamptz) to anon, authenticated;

create table if not exists public.retired_wedding_slugs (
  slug         text primary key,
  wedding_id   uuid references public.weddings(id) on delete set null,
  retired_at   timestamptz not null default now(),
  available_at timestamptz not null
);
alter table public.retired_wedding_slugs enable row level security;
comment on table public.retired_wedding_slugs is
  'Addresses whose site ended or moved. Until available_at, /wedding/[slug] says the site has ended and nobody else can claim it.';

create or replace function public._retire_slug(p_slug text, p_wid uuid)
returns void
language sql security definer set search_path = public, pg_temp
as $$
  insert into public.retired_wedding_slugs (slug, wedding_id, retired_at, available_at)
  values (p_slug, p_wid, now(), now() + interval '30 days')
  on conflict (slug) do update
    set wedding_id = excluded.wedding_id, retired_at = excluded.retired_at, available_at = excluded.available_at;
$$;
revoke all on function public._retire_slug(text, uuid) from public, anon, authenticated;

-- Server only (service_role). Idempotent: safe to run more than once a day.
-- Returns {trimmed, ended, notices: [{wedding_id, days, ends_on, names, emails}]}.
create or replace function public.run_site_retention(p_today date default current_date)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_trimmed int := 0;
  v_ended int := 0;
  v_notices jsonb := '[]'::jsonb;
  r record;
begin
  -- 1. Trim version history 30 days after the wedding.
  with old as (
    select v.id
      from public.wedding_site_versions v
      join public.weddings w on w.id = v.wedding_id
     where w.event_date is not null and w.event_date + 30 <= p_today
       and v.id <> (select v2.id from public.wedding_site_versions v2
                     where v2.wedding_id = v.wedding_id order by v2.created_at desc limit 1)
  )
  delete from public.wedding_site_versions where id in (select id from old);
  get diagnostics v_trimmed = row_count;

  -- 2. Reminders, 30 and 7 days before the end (each sent once).
  for r in
    select w.id, w.partner_one, w.partner_two,
           public.wedding_site_ends_on(w.event_date, w.created_at) as ends_on,
           w.site_notice_30_at, w.site_notice_7_at
      from public.weddings w
     where w.website_ended_at is null
       and (w.public_slug is not null
            or exists (select 1 from public.wedding_custom_sites s where s.wedding_id = w.id))
       and public.wedding_site_ends_on(w.event_date, w.created_at) > p_today
       and public.wedding_site_ends_on(w.event_date, w.created_at) <= p_today + 30
  loop
    if (r.ends_on <= p_today + 7 and r.site_notice_7_at is null)
       or (r.site_notice_30_at is null) then
      v_notices := v_notices || jsonb_build_object(
        'wedding_id', r.id,
        'days', r.ends_on - p_today,
        'ends_on', r.ends_on,
        'names', concat_ws(' & ', nullif(r.partner_one, ''), nullif(r.partner_two, '')),
        'emails', coalesce((
          select jsonb_agg(distinct u.email)
            from auth.users u
           where u.email is not null
             and (u.id = (select owner_user_id from public.weddings where id = r.id)
                  or u.id in (select wm.user_id from public.wedding_members wm
                               where wm.wedding_id = r.id and wm.can_edit))
        ), '[]'::jsonb));
      update public.weddings
         set site_notice_30_at = coalesce(site_notice_30_at, now()),
             site_notice_7_at = case when r.ends_on <= p_today + 7 then coalesce(site_notice_7_at, now())
                                     else site_notice_7_at end
       where id = r.id;
    end if;
  end loop;

  -- 3. Take down sites that have reached their end date.
  for r in
    select w.id, w.public_slug
      from public.weddings w
     where w.website_ended_at is null
       and (w.public_slug is not null
            or exists (select 1 from public.wedding_custom_sites s where s.wedding_id = w.id))
       and public.wedding_site_ends_on(w.event_date, w.created_at) <= p_today
     for update of w
  loop
    delete from public.wedding_custom_sites where wedding_id = r.id;
    delete from public.wedding_site_versions where wedding_id = r.id;
    delete from public.wedding_site_keys where wedding_id = r.id;
    if r.public_slug is not null then
      perform public._retire_slug(r.public_slug, r.id);
    end if;
    update public.weddings
       set public_slug = null, website_published = false, site_mode = 'standard',
           website_ended_at = now(), updated_at = now()
     where id = r.id;
    v_ended := v_ended + 1;
  end loop;

  -- 4. Forget holds that have run out.
  delete from public.retired_wedding_slugs where available_at < now() - interval '1 day';

  return jsonb_build_object('trimmed', v_trimmed, 'ended', v_ended, 'notices', v_notices);
end;
$$;
revoke all on function public.run_site_retention(date) from public, anon, authenticated;
grant execute on function public.run_site_retention(date) to service_role;

-- Guests following an old link: is this an ended site still in its hold?
create or replace function public.wedding_site_has_ended(p_slug text)
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select exists (select 1 from public.retired_wedding_slugs
                  where slug = lower(p_slug) and available_at > now())
     and not exists (select 1 from public.weddings where public_slug = lower(p_slug));
$$;
revoke all on function public.wedding_site_has_ended(text) from public;
grant execute on function public.wedding_site_has_ended(text) to anon, authenticated;

-- An address the couple changed away from: where their site lives now (if
-- it's still published), so old links redirect during the 30-day hold.
create or replace function public.wedding_slug_moved_to(p_slug text)
returns text
language sql stable security definer set search_path = public, pg_temp
as $$
  select w.public_slug
    from public.retired_wedding_slugs r
    join public.weddings w on w.id = r.wedding_id
   where r.slug = lower(p_slug) and r.available_at > now()
     and w.public_slug is not null and w.public_slug <> r.slug and w.website_published
   limit 1;
$$;
revoke all on function public.wedding_slug_moved_to(text) from public;
grant execute on function public.wedding_slug_moved_to(text) to anon, authenticated;

-- A wedding that ended starts its countdown again if the couple turns the
-- website back on with a later date — set_wedding_website clears the flags.

-- ── Addresses ───────────────────────────────────────────────────────────────
-- Why an address can't be used, or null when it can. Keep the word lists in
-- step with lib/custom-site/slug.ts (which explains them to the couple).
create or replace function public.wedding_slug_problem(p_slug text, p_wid uuid default null)
returns text
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare
  v text := lower(coalesce(p_slug, ''));
  tok text;
  reserved text[] := array['admin','api','app','auth','blog','contact','dashboard','help','login','logout',
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
  if exists (select 1 from public.weddings w where w.public_slug = v and w.id is distinct from p_wid) then
    return 'taken';
  end if;
  if exists (select 1 from public.retired_wedding_slugs r
              where r.slug = v and r.available_at > now() and r.wedding_id is distinct from p_wid) then
    return 'held';
  end if;
  return null;
end;
$$;
revoke all on function public.wedding_slug_problem(text, uuid) from public, anon;
grant execute on function public.wedding_slug_problem(text, uuid) to authenticated;

-- Pick or change a wedding's address. The old one is held for 30 days.
create or replace function public.claim_wedding_slug(p_wid uuid, p_slug text)
returns text
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v text := lower(btrim(coalesce(p_slug, ''))); v_old text; v_problem text;
begin
  if not public.can_edit_wedding(p_wid) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  v_problem := public.wedding_slug_problem(v, p_wid);
  if v_problem is not null then
    raise exception '%', v_problem using errcode = 'BT002';
  end if;
  select public_slug into v_old from public.weddings where id = p_wid for update;
  if v_old is not distinct from v then
    return v;
  end if;
  update public.weddings set public_slug = v, updated_at = now() where id = p_wid;
  delete from public.retired_wedding_slugs where slug = v;
  if v_old is not null then
    perform public._retire_slug(v_old, p_wid);
  end if;
  return v;
end;
$$;
revoke all on function public.claim_wedding_slug(uuid, text) from public, anon;
grant execute on function public.claim_wedding_slug(uuid, text) to authenticated;

-- First publish assigns the suggested address; it now goes through the same
-- rules, and turning the site back on after it ended restarts the reminders.
create or replace function public.set_wedding_website(p_wid uuid, p_published boolean, p_welcome text, p_slug text)
returns table(public_slug text, website_published boolean)
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_current text; v_problem text;
begin
  if not public.can_edit_wedding(p_wid) then raise exception 'not_allowed'; end if;
  select w.public_slug into v_current from public.weddings w where w.id = p_wid for update;
  if v_current is null and p_slug is not null then
    v_problem := public.wedding_slug_problem(p_slug, p_wid);
    if v_problem is not null then
      raise exception '%', v_problem using errcode = 'BT002';
    end if;
    delete from public.retired_wedding_slugs r where r.slug = lower(p_slug);
  end if;
  update public.weddings w
     set website_published = coalesce(p_published, w.website_published),
         welcome_message = p_welcome,
         public_slug = coalesce(w.public_slug, lower(p_slug)),
         website_ended_at = case when coalesce(p_published, false) then null else w.website_ended_at end,
         site_notice_30_at = case when coalesce(p_published, false) and w.website_ended_at is not null then null else w.site_notice_30_at end,
         site_notice_7_at = case when coalesce(p_published, false) and w.website_ended_at is not null then null else w.site_notice_7_at end
   where w.id = p_wid;
  return query select w.public_slug, w.website_published from public.weddings w where w.id = p_wid;
end;
$$;
revoke all on function public.set_wedding_website(uuid, boolean, text, text) from public, anon;
grant execute on function public.set_wedding_website(uuid, boolean, text, text) to authenticated;
