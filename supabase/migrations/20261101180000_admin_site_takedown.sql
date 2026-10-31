-- Admin takedown for guest websites, and locking the website columns.
--
-- ── Takedown ────────────────────────────────────────────────────────────────
-- A guest reports a site (the "Report this page" link), or we spot one that
-- breaks the content policy. An admin takes it down from /admin/sites:
--   * the guest website is switched off (standard and custom page alike),
--   * the couple's site keys are revoked, so their own AI can't republish,
--   * the wedding is marked blocked: publishing and turning the website back
--     on are refused until an admin restores it.
-- Nothing is deleted. The couple keeps their draft (and can fix it), and we
-- keep the live code as evidence until the normal retention clean-up.
-- Every takedown and restore is logged with the admin and the reason.
--
-- ── Locked website columns ──────────────────────────────────────────────────
-- Editors have table-level UPDATE on weddings (details, tools, cover photo all
-- update it directly). That also let a couple PATCH public_slug or
-- website_published over the REST API, around the address rules, the
-- retention take-down and now a takedown. A trigger refuses changes to the
-- website columns from API roles; they change only through the functions
-- below and in 20261101120000_custom_site_policy_and_retention.sql, which
-- run as their owner.

alter table public.weddings
  add column if not exists site_blocked_at timestamptz,
  add column if not exists site_block_reason text check (site_block_reason is null or char_length(site_block_reason) <= 500);

create or replace function public._guard_wedding_website_columns()
returns trigger
language plpgsql set search_path = public, pg_temp
as $$
begin
  -- SECURITY DEFINER functions run as their owner, so only direct API writes
  -- (current_user = anon / authenticated) are checked here.
  if current_user in ('anon', 'authenticated') and (
       new.public_slug is distinct from old.public_slug
    or new.website_published is distinct from old.website_published
    or new.website_ended_at is distinct from old.website_ended_at
    or new.site_notice_30_at is distinct from old.site_notice_30_at
    or new.site_notice_7_at is distinct from old.site_notice_7_at
    or new.site_blocked_at is distinct from old.site_blocked_at
    or new.site_block_reason is distinct from old.site_block_reason
  ) then
    raise exception 'website settings change through the Website tab' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists weddings_guard_website_columns on public.weddings;
create trigger weddings_guard_website_columns
  before update on public.weddings
  for each row execute function public._guard_wedding_website_columns();

-- ── Moderation log ──────────────────────────────────────────────────────────
create table if not exists public.site_moderation_log (
  id         uuid primary key default gen_random_uuid(),
  wedding_id uuid references public.weddings(id) on delete set null,
  slug       text,
  action     text not null check (action in ('takedown', 'restore')),
  reason     text check (reason is null or char_length(reason) <= 500),
  admin      text,
  created_at timestamptz not null default now()
);
create index if not exists site_moderation_log_wedding_idx on public.site_moderation_log (wedding_id, created_at desc);
alter table public.site_moderation_log enable row level security;
comment on table public.site_moderation_log is
  'Who took down or restored which guest website, and why. Written only by admin_take_down_site / admin_restore_site (service role).';

-- Who to tell about a wedding's site: the owner and editors.
create or replace function public._wedding_site_contacts(p_wid uuid)
returns jsonb
language sql stable security definer set search_path = public, pg_temp
as $$
  select coalesce(jsonb_agg(distinct u.email), '[]'::jsonb)
    from auth.users u
   where u.email is not null
     and (u.id = (select owner_user_id from public.weddings where id = p_wid)
          or u.id in (select wm.user_id from public.wedding_members wm where wm.wedding_id = p_wid and wm.can_edit));
$$;
revoke all on function public._wedding_site_contacts(uuid) from public, anon, authenticated;

-- Server only (service_role): take a wedding's guest website down.
-- Returns {names, slug, emails} so the app can tell the couple.
create or replace function public.admin_take_down_site(p_wid uuid, p_reason text, p_admin text)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v record; v_reason text := left(btrim(coalesce(p_reason, '')), 500);
begin
  if v_reason = '' then
    raise exception 'a reason is required' using errcode = '22023';
  end if;
  select id, public_slug, partner_one, partner_two into v from public.weddings where id = p_wid for update;
  if not found then
    raise exception 'no such wedding' using errcode = 'P0002';
  end if;
  update public.weddings
     set website_published = false, site_mode = 'standard',
         site_blocked_at = now(), site_block_reason = v_reason, updated_at = now()
   where id = p_wid;
  update public.wedding_site_keys set revoked_at = coalesce(revoked_at, now()) where wedding_id = p_wid;
  insert into public.site_moderation_log (wedding_id, slug, action, reason, admin)
  values (p_wid, v.public_slug, 'takedown', v_reason, nullif(left(btrim(coalesce(p_admin, '')), 100), ''));
  return jsonb_build_object(
    'names', concat_ws(' & ', nullif(v.partner_one, ''), nullif(v.partner_two, '')),
    'slug', v.public_slug,
    'emails', public._wedding_site_contacts(p_wid));
end;
$$;
revoke all on function public.admin_take_down_site(uuid, text, text) from public, anon, authenticated;
grant execute on function public.admin_take_down_site(uuid, text, text) to service_role;

-- Server only (service_role): lift a takedown. The site stays off; the couple
-- can publish again (custom sites still go through the content check).
create or replace function public.admin_restore_site(p_wid uuid, p_note text, p_admin text)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v record;
begin
  select id, public_slug, partner_one, partner_two, site_blocked_at into v from public.weddings where id = p_wid for update;
  if not found then
    raise exception 'no such wedding' using errcode = 'P0002';
  end if;
  if v.site_blocked_at is null then
    raise exception 'this site is not taken down' using errcode = '22023';
  end if;
  update public.weddings set site_blocked_at = null, site_block_reason = null, updated_at = now() where id = p_wid;
  insert into public.site_moderation_log (wedding_id, slug, action, reason, admin)
  values (p_wid, v.public_slug, 'restore', nullif(left(btrim(coalesce(p_note, '')), 500), ''),
          nullif(left(btrim(coalesce(p_admin, '')), 100), ''));
  return jsonb_build_object(
    'names', concat_ws(' & ', nullif(v.partner_one, ''), nullif(v.partner_two, '')),
    'slug', v.public_slug,
    'emails', public._wedding_site_contacts(p_wid));
end;
$$;
revoke all on function public.admin_restore_site(uuid, text, text) from public, anon, authenticated;
grant execute on function public.admin_restore_site(uuid, text, text) to service_role;

-- ── Blocked weddings can't publish ──────────────────────────────────────────
create or replace function public._publish_custom_site(p_wid uuid, p_uid uuid)
returns timestamptz
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_now timestamptz := now(); v_html text; v_ok text;
begin
  if exists (select 1 from public.weddings where id = p_wid and site_blocked_at is not null) then
    raise exception 'this site was taken down by Bridal Team' using errcode = 'BT003';
  end if;
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

create or replace function public.set_wedding_website(p_wid uuid, p_published boolean, p_welcome text, p_slug text)
returns table(public_slug text, website_published boolean)
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_current text; v_problem text; v_blocked timestamptz;
begin
  if not public.can_edit_wedding(p_wid) then raise exception 'not_allowed'; end if;
  select w.public_slug, w.site_blocked_at into v_current, v_blocked from public.weddings w where w.id = p_wid for update;
  if v_blocked is not null and coalesce(p_published, false) then
    raise exception 'this site was taken down by Bridal Team' using errcode = 'BT003';
  end if;
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
