-- Custom guest websites.
--
-- Until now every couple's /wedding/[slug] page was the one built-in layout.
-- This lets a couple replace it with their own HTML/CSS/JS, produced any of
-- four ways, all landing in the same place:
--
--   paste    -- they wrote it (or got it elsewhere) and pasted it in
--   template -- Bridal Team's built-in themes / the AI planner's "standard" site
--   ai       -- Bridal Team's AI designer wrote it from a description
--   mcp      -- their OWN assistant (Claude, ChatGPT, ...) wrote it through the
--               per-wedding site key on /api/mcp/site
--
-- ── Draft vs live ────────────────────────────────────────────────────────────
-- Every save writes the DRAFT and a version row. Guests only ever see LIVE,
-- which changes only when someone publishes. So an assistant iterating on a
-- design, or a half-pasted file, never reaches guests mid-edit.
--
-- ── Why the HTML is safe to serve from bridalteam.com ───────────────────────
-- It isn't, on our origin -- so it never runs there. app/sandbox/* serves it
-- with `Content-Security-Policy: sandbox allow-scripts ...` (no
-- allow-same-origin), which gives the document an opaque origin: it can't read
-- our cookies, localStorage or call our API as the viewer. See
-- lib/custom-site/serve.ts. The database's only job is size limits and
-- permissions.
--
-- ── Site keys ────────────────────────────────────────────────────────────────
-- A key is a bearer secret that lets the couple's own assistant read their
-- site context and write the site, with nothing else. Only its SHA-256 is
-- stored (same pattern as vendor_claims); the raw key is returned once by
-- create_site_key(). The key_* functions are executable by anon on purpose:
-- the MCP endpoint has no Supabase session, and possession of a 192-bit
-- secret IS the authorization. Every key_* function resolves the key through
-- _wedding_for_site_key(), which also refuses revoked keys.

-- 1. Which page guests get. 'custom' with no live HTML falls back to standard.
alter table public.weddings
  add column if not exists site_mode text not null default 'standard'
  check (site_mode in ('standard', 'custom'));

-- 2. The current draft and live code, one row per wedding.
create table if not exists public.wedding_custom_sites (
  wedding_id       uuid primary key references public.weddings(id) on delete cascade,
  draft_html       text check (draft_html is null or octet_length(draft_html) <= 512000),
  draft_source     text check (draft_source in ('paste', 'template', 'ai', 'mcp')),
  draft_updated_at timestamptz,
  live_html        text check (live_html is null or octet_length(live_html) <= 512000),
  live_updated_at  timestamptz,
  updated_by       uuid references auth.users(id) on delete set null
);
comment on table public.wedding_custom_sites is
  'Couple-authored guest website code. Draft is what they edit; live is what /wedding/[slug] serves (sandboxed, see lib/custom-site/serve.ts). Written only through save_custom_site / publish_custom_site / key_* functions.';

-- 3. History, so an assistant overwriting a design is always undoable.
create table if not exists public.wedding_site_versions (
  id         uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings(id) on delete cascade,
  html       text not null check (octet_length(html) <= 512000),
  source     text not null check (source in ('paste', 'template', 'ai', 'mcp')),
  note       text check (note is null or char_length(note) <= 200),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists wedding_site_versions_wedding_idx
  on public.wedding_site_versions (wedding_id, created_at desc);

-- 4. Site keys for the couple's own assistant.
create table if not exists public.wedding_site_keys (
  id           uuid primary key default gen_random_uuid(),
  wedding_id   uuid not null references public.weddings(id) on delete cascade,
  token_hash   text not null unique,
  hint         text not null,              -- last 4 chars, for telling keys apart
  label        text not null check (char_length(label) between 1 and 60),
  created_by   uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at   timestamptz
);
create index if not exists wedding_site_keys_wedding_idx on public.wedding_site_keys (wedding_id);
comment on table public.wedding_site_keys is
  'Per-wedding bearer keys for /api/mcp/site. Only the SHA-256 of each key is stored; the raw key is returned once by create_site_key().';

-- ── RLS: read for members, no direct writes ─────────────────────────────────
alter table public.wedding_custom_sites  enable row level security;
alter table public.wedding_site_versions enable row level security;
alter table public.wedding_site_keys     enable row level security;

drop policy if exists custom_sites_select_members on public.wedding_custom_sites;
create policy custom_sites_select_members on public.wedding_custom_sites
  for select using (public.can_access_wedding(wedding_id));

drop policy if exists site_versions_select_members on public.wedding_site_versions;
create policy site_versions_select_members on public.wedding_site_versions
  for select using (public.can_access_wedding(wedding_id));

-- Keys are listed only to people who could create them.
drop policy if exists site_keys_select_editors on public.wedding_site_keys;
create policy site_keys_select_editors on public.wedding_site_keys
  for select using (public.can_edit_wedding(wedding_id));

-- ── Shared write path ───────────────────────────────────────────────────────
-- Not callable by clients: every public entry point checks permission first.
create or replace function public._write_custom_site_draft(
  p_wid uuid, p_html text, p_source text, p_note text, p_uid uuid
) returns timestamptz
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_now timestamptz := now();
begin
  if p_html is null or btrim(p_html) = '' then
    raise exception 'empty site' using errcode = '22023';
  end if;
  if octet_length(p_html) > 512000 then
    raise exception 'site too large' using errcode = '22001';
  end if;

  insert into public.wedding_custom_sites (wedding_id, draft_html, draft_source, draft_updated_at, updated_by)
  values (p_wid, p_html, p_source, v_now, p_uid)
  on conflict (wedding_id) do update
    set draft_html = excluded.draft_html,
        draft_source = excluded.draft_source,
        draft_updated_at = excluded.draft_updated_at,
        updated_by = excluded.updated_by;

  insert into public.wedding_site_versions (wedding_id, html, source, note, created_by)
  values (p_wid, p_html, p_source, nullif(left(btrim(coalesce(p_note, '')), 200), ''), p_uid);

  -- Keep the 30 most recent versions.
  delete from public.wedding_site_versions
   where wedding_id = p_wid
     and id not in (select id from public.wedding_site_versions
                     where wedding_id = p_wid order by created_at desc limit 30);
  return v_now;
end;
$$;

create or replace function public._publish_custom_site(p_wid uuid, p_uid uuid)
returns timestamptz
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_now timestamptz := now();
begin
  update public.wedding_custom_sites
     set live_html = draft_html, live_updated_at = v_now, updated_by = p_uid
   where wedding_id = p_wid and draft_html is not null;
  if not found then
    raise exception 'no draft to publish' using errcode = 'P0002';
  end if;
  update public.weddings set site_mode = 'custom', updated_at = v_now where id = p_wid;
  return v_now;
end;
$$;

revoke all on function public._write_custom_site_draft(uuid, text, text, text, uuid) from public, anon, authenticated;
revoke all on function public._publish_custom_site(uuid, uuid) from public, anon, authenticated;

-- ── Signed-in couple ────────────────────────────────────────────────────────
create or replace function public.save_custom_site(
  p_wid uuid, p_html text, p_source text, p_note text default null
) returns timestamptz
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.can_edit_wedding(p_wid) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if p_source not in ('paste', 'template', 'ai') then
    raise exception 'bad source' using errcode = '22023';
  end if;
  return public._write_custom_site_draft(p_wid, p_html, p_source, p_note, auth.uid());
end;
$$;

create or replace function public.publish_custom_site(p_wid uuid)
returns timestamptz
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.can_edit_wedding(p_wid) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return public._publish_custom_site(p_wid, auth.uid());
end;
$$;

-- Restoring copies an old version into the draft (as a new version), so the
-- history only ever grows forward and a restore is itself undoable.
create or replace function public.restore_custom_site_version(p_version uuid)
returns timestamptz
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v record;
begin
  select wedding_id, html, source into v from public.wedding_site_versions where id = p_version;
  if not found or not public.can_edit_wedding(v.wedding_id) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  return public._write_custom_site_draft(v.wedding_id, v.html, v.source, 'Restored an earlier version', auth.uid());
end;
$$;

create or replace function public.create_site_key(p_wid uuid, p_label text)
returns text
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_key text;
begin
  if not public.can_edit_wedding(p_wid) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if (select count(*) from public.wedding_site_keys
       where wedding_id = p_wid and revoked_at is null) >= 5 then
    raise exception 'too many keys' using errcode = '54000';
  end if;
  v_key := 'btsite_' || encode(extensions.gen_random_bytes(24), 'hex');
  insert into public.wedding_site_keys (wedding_id, token_hash, hint, label, created_by)
  values (p_wid, encode(extensions.digest(v_key, 'sha256'), 'hex'), right(v_key, 4),
          coalesce(nullif(left(btrim(coalesce(p_label, '')), 60), ''), 'My assistant'), auth.uid());
  return v_key;
end;
$$;

create or replace function public.revoke_site_key(p_id uuid)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_wid uuid;
begin
  select wedding_id into v_wid from public.wedding_site_keys where id = p_id;
  if v_wid is null or not public.can_edit_wedding(v_wid) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  update public.wedding_site_keys set revoked_at = coalesce(revoked_at, now()) where id = p_id;
end;
$$;

-- ── Site key (the couple's own assistant, no session) ───────────────────────
create or replace function public._wedding_for_site_key(p_key text)
returns uuid
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_id uuid; v_wid uuid;
begin
  select id, wedding_id into v_id, v_wid
    from public.wedding_site_keys
   where token_hash = encode(extensions.digest(coalesce(p_key, ''), 'sha256'), 'hex')
     and revoked_at is null;
  if v_wid is null then
    raise exception 'invalid site key' using errcode = '28000';
  end if;
  update public.wedding_site_keys set last_used_at = now()
   where id = v_id and (last_used_at is null or last_used_at < now() - interval '1 minute');
  return v_wid;
end;
$$;
revoke all on function public._wedding_for_site_key(text) from public, anon, authenticated;

-- Everything an assistant needs to design the site, in one call.
create or replace function public.key_site_context(p_key text)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_wid uuid := public._wedding_for_site_key(p_key); v jsonb;
begin
  select jsonb_build_object(
    'wedding_id', w.id,
    'partner_one', w.partner_one, 'partner_two', w.partner_two,
    'event_date', w.event_date, 'venue', w.venue, 'city', w.city, 'region', w.region,
    'welcome_message', w.welcome_message, 'cover_image_url', w.cover_image_url,
    'style', w.style, 'guest_count', w.guest_count,
    'public_slug', w.public_slug, 'website_published', w.website_published,
    'site_mode', w.site_mode,
    'has_draft', s.draft_html is not null, 'draft_updated_at', s.draft_updated_at,
    'has_live', s.live_html is not null, 'live_updated_at', s.live_updated_at,
    'registry', coalesce((select jsonb_agg(jsonb_build_object('label', r.label, 'url', r.url)
                                            order by r.position, r.created_at)
                            from public.registry_links r where r.wedding_id = w.id), '[]'::jsonb)
  ) into v
  from public.weddings w
  left join public.wedding_custom_sites s on s.wedding_id = w.id
  where w.id = v_wid;
  return v;
end;
$$;

create or replace function public.key_get_site(p_key text, p_which text default 'draft')
returns text
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_wid uuid := public._wedding_for_site_key(p_key);
begin
  return (select case when p_which = 'live' then live_html else draft_html end
            from public.wedding_custom_sites where wedding_id = v_wid);
end;
$$;

create or replace function public.key_save_site(p_key text, p_html text, p_note text default null)
returns timestamptz
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  return public._write_custom_site_draft(public._wedding_for_site_key(p_key), p_html, 'mcp', p_note, null);
end;
$$;

create or replace function public.key_publish_site(p_key text)
returns timestamptz
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  return public._publish_custom_site(public._wedding_for_site_key(p_key), null);
end;
$$;

-- Back to the built-in page. The custom code is kept.
create or replace function public.key_use_standard_site(p_key text)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  update public.weddings set site_mode = 'standard', updated_at = now()
   where id = public._wedding_for_site_key(p_key);
end;
$$;

create or replace function public.key_add_registry_link(p_key text, p_label text, p_url text)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_wid uuid := public._wedding_for_site_key(p_key);
begin
  if p_url is null or p_url !~* '^https?://[^\s<>"]+$' or char_length(p_url) > 2000 then
    raise exception 'invalid url' using errcode = '22023';
  end if;
  if coalesce(btrim(p_label), '') = '' then
    raise exception 'missing label' using errcode = '22023';
  end if;
  if (select count(*) from public.registry_links where wedding_id = v_wid) >= 20 then
    raise exception 'too many registry links' using errcode = '54000';
  end if;
  insert into public.registry_links (wedding_id, label, url, position)
  values (v_wid, left(btrim(p_label), 80), p_url,
          coalesce((select max(position) + 1 from public.registry_links where wedding_id = v_wid), 0));
end;
$$;

-- ── Guests ──────────────────────────────────────────────────────────────────
-- The live custom page for a published wedding in custom mode, else null
-- (the caller then renders the standard page).
create or replace function public.get_public_custom_site(p_slug text)
returns text
language sql stable security definer set search_path = public
as $$
  select s.live_html
    from public.weddings w
    join public.wedding_custom_sites s on s.wedding_id = w.id
   where w.public_slug = p_slug and w.website_published = true and w.site_mode = 'custom'
   limit 1;
$$;

-- ── Grants ──────────────────────────────────────────────────────────────────
revoke all on function public.save_custom_site(uuid, text, text, text) from public, anon;
revoke all on function public.publish_custom_site(uuid) from public, anon;
revoke all on function public.restore_custom_site_version(uuid) from public, anon;
revoke all on function public.create_site_key(uuid, text) from public, anon;
revoke all on function public.revoke_site_key(uuid) from public, anon;
grant execute on function public.save_custom_site(uuid, text, text, text) to authenticated;
grant execute on function public.publish_custom_site(uuid) to authenticated;
grant execute on function public.restore_custom_site_version(uuid) to authenticated;
grant execute on function public.create_site_key(uuid, text) to authenticated;
grant execute on function public.revoke_site_key(uuid) to authenticated;

revoke all on function public.key_site_context(text) from public;
revoke all on function public.key_get_site(text, text) from public;
revoke all on function public.key_save_site(text, text, text) from public;
revoke all on function public.key_publish_site(text) from public;
revoke all on function public.key_use_standard_site(text) from public;
revoke all on function public.key_add_registry_link(text, text, text) from public;
grant execute on function public.key_site_context(text) to anon, authenticated;
grant execute on function public.key_get_site(text, text) to anon, authenticated;
grant execute on function public.key_save_site(text, text, text) to anon, authenticated;
grant execute on function public.key_publish_site(text) to anon, authenticated;
grant execute on function public.key_use_standard_site(text) to anon, authenticated;
grant execute on function public.key_add_registry_link(text, text, text) to anon, authenticated;

grant execute on function public.get_public_custom_site(text) to anon, authenticated;
