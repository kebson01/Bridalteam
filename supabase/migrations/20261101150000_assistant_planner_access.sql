-- ════════════════════════════════════════════════════════════════════════════
-- Full planner access for a couple's own AI assistant (ChatGPT, Claude, …)
-- ════════════════════════════════════════════════════════════════════════════
--
-- Site keys (20261031200000_custom_wedding_sites.sql) let an assistant build
-- the wedding website and nothing else. This adds a second SCOPE of key,
-- 'planner', that also reaches the rest of a wedding: details, checklist,
-- budget, guest list / RSVPs / meals, seating, vendors, travel and floor
-- plans. Planner keys are minted by the OAuth sign-in (/oauth/authorize, see
-- lib/oauth/core.ts) after the couple approves a consent screen that lists
-- all of that. Existing keys stay 'site': nobody's key silently gains power.
--
-- ── How a planner call is authorized ───────────────────────────────────────
-- Every key_planner_* function starts with _planner_wedding_for_key(), which
--   1. resolves the key (hash match, not revoked, scope = 'planner'),
--   2. sets request.jwt.claims for the rest of the transaction to the user
--      who created the key — so auth.uid() is that person, exactly as if they
--      were signed in, and the existing permission helpers apply to them,
--   3. checks can_edit_wedding() AS that user: a key stops working the moment
--      its creator loses edit access to the wedding, not just when revoked.
-- Then each function touches only rows WHERE wedding_id = that wedding, and
-- only the columns in _planner_table()'s allowlist. Seeding and RSVPs go
-- through the existing seed_wedding_plan / seed_wedding_budget /
-- submit_guest_rsvp functions, which do their own can_edit_wedding() checks
-- against the impersonated user.
--
-- Deliberately NOT reachable: team members and invites, the account, org and
-- billing, guest RSVP tokens, and sending email to guests.
-- ════════════════════════════════════════════════════════════════════════════

alter table public.wedding_site_keys
  add column if not exists scope text not null default 'site';

do $$ begin
  alter table public.wedding_site_keys
    add constraint wedding_site_keys_scope_check check (scope in ('site', 'planner'));
exception when duplicate_object then null;
end $$;

comment on column public.wedding_site_keys.scope is
  'site = website + registry only (the Website builder''s "Your own AI" keys). planner = the whole wedding (OAuth sign-in from ChatGPT/Claude).';

-- ── Minting ─────────────────────────────────────────────────────────────────

create or replace function public.create_assistant_key(p_wid uuid, p_label text, p_scope text default 'planner')
returns text
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_key text;
begin
  if p_scope not in ('site', 'planner') then
    raise exception 'unknown scope' using errcode = '22023';
  end if;
  if not public.can_edit_wedding(p_wid) then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  if (select count(*) from public.wedding_site_keys
       where wedding_id = p_wid and revoked_at is null) >= 5 then
    raise exception 'too many keys' using errcode = '54000';
  end if;
  v_key := 'btsite_' || encode(extensions.gen_random_bytes(24), 'hex');
  insert into public.wedding_site_keys (wedding_id, token_hash, hint, label, created_by, scope)
  values (p_wid, encode(extensions.digest(v_key, 'sha256'), 'hex'), right(v_key, 4),
          coalesce(nullif(left(btrim(coalesce(p_label, '')), 60), ''), 'My assistant'), auth.uid(), p_scope);
  return v_key;
end;
$$;

-- ── Resolving ───────────────────────────────────────────────────────────────

/** Which tools a key gets. Raises 28000 for an unknown or revoked key. */
create or replace function public.key_scope(p_key text)
returns text
language plpgsql stable security definer set search_path = public, pg_temp
as $$
declare v_scope text;
begin
  select scope into v_scope from public.wedding_site_keys
   where token_hash = encode(extensions.digest(coalesce(p_key, ''), 'sha256'), 'hex')
     and revoked_at is null;
  if v_scope is null then
    raise exception 'invalid site key' using errcode = '28000';
  end if;
  return v_scope;
end;
$$;

create or replace function public._planner_wedding_for_key(p_key text)
returns uuid
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_id uuid; v_wid uuid; v_uid uuid; v_scope text;
begin
  select id, wedding_id, created_by, scope into v_id, v_wid, v_uid, v_scope
    from public.wedding_site_keys
   where token_hash = encode(extensions.digest(coalesce(p_key, ''), 'sha256'), 'hex')
     and revoked_at is null;
  if v_wid is null or v_uid is null then
    raise exception 'invalid site key' using errcode = '28000';
  end if;
  if v_scope <> 'planner' then
    raise exception 'this key only covers the wedding website' using errcode = 'BT002';
  end if;

  -- Act as the key's creator for the rest of this transaction.
  perform set_config('request.jwt.claims',
                     json_build_object('sub', v_uid, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_uid::text, true);

  if not public.can_edit_wedding(v_wid) then
    raise exception 'the person who connected this assistant can no longer edit the wedding' using errcode = '28000';
  end if;

  update public.wedding_site_keys set last_used_at = now()
   where id = v_id and (last_used_at is null or last_used_at < now() - interval '1 minute');
  return v_wid;
end;
$$;

/**
 * The tables an assistant may write, and the only columns it may set. Ids,
 * wedding_id, tokens, timestamps and RSVP replies are never writable here.
 */
create or replace function public._planner_table(p_kind text,
  out tbl text, out cols text[], out has_position boolean, out has_updated_at boolean)
language sql immutable set search_path = public, pg_temp
as $$
  select v.tbl, v.cols, v.has_position, v.has_updated_at
    from (values
      ('tasks',    'tasks',                array['title','notes','start_date','due_date','completed_at'], true,  true),
      ('budget',   'budget_items',         array['category','label','estimated_cents','paid_cents'],     true,  true),
      ('guests',   'wedding_guests',       array['household_name','email','seats'],                      false, true),
      ('menu',     'wedding_menu_options', array['name','description'],                                  true,  false),
      ('vendors',  'wedding_vendors',      array['name','category','status','contact_name','email','phone','website',
                                                 'cost_cents','paid_cents','next_payment_date','contract_signed',
                                                 'next_appointment','notes'],                            true,  true),
      ('travel',   'travel_items',         array['kind','title','location','url','code','reserve_by','rate_cents','detail'], true, true),
      ('layouts',  'venue_layouts',        array['name','width_ft','length_ft','items','floor_source'],  false, true),
      ('registry', 'registry_links',       array['label','url'],                                         true,  false)
    ) as v(kind, tbl, cols, has_position, has_updated_at)
   where v.kind = p_kind;
$$;

-- ── Reading ─────────────────────────────────────────────────────────────────

create or replace function public.key_planner_overview(p_key text)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_wid uuid := public._planner_wedding_for_key(p_key);
begin
  return (
    select jsonb_build_object(
      'wedding', jsonb_build_object(
        'id', w.id, 'partner_one', w.partner_one, 'partner_two', w.partner_two,
        'event_date', w.event_date, 'city', w.city, 'region', w.region, 'country', w.country,
        'venue', w.venue, 'guest_count', w.guest_count, 'budget_cents', w.budget_cents,
        'currency', w.currency, 'style', w.style, 'notes', w.notes,
        'website_published', w.website_published, 'public_slug', w.public_slug,
        'enabled_tools', w.enabled_tools),
      'checklist', (select jsonb_build_object(
          'open', count(*) filter (where completed_at is null),
          'done', count(*) filter (where completed_at is not null),
          'overdue', count(*) filter (where completed_at is null and due_date < current_date))
        from public.tasks where wedding_id = v_wid and deleted_at is null),
      'budget', (select jsonb_build_object(
          'items', count(*),
          'estimated_cents', coalesce(sum(estimated_cents), 0),
          'paid_cents', coalesce(sum(paid_cents), 0))
        from public.budget_items where wedding_id = v_wid),
      'guests', (select jsonb_build_object(
          'households', count(*),
          'invited_seats', coalesce(sum(seats), 0),
          'attending_households', count(*) filter (where attending),
          'declined_households', count(*) filter (where attending = false),
          'awaiting_households', count(*) filter (where responded_at is null),
          'attending_people', coalesce(sum(party_size) filter (where attending), 0))
        from public.wedding_guests where wedding_id = v_wid),
      'vendors', (select jsonb_build_object(
          'total', count(*),
          'booked', count(*) filter (where status = 'booked'),
          'cost_cents', coalesce(sum(cost_cents), 0),
          'paid_cents', coalesce(sum(paid_cents), 0))
        from public.wedding_vendors where wedding_id = v_wid),
      'travel_items', (select count(*) from public.travel_items where wedding_id = v_wid),
      'layouts', (select count(*) from public.venue_layouts where wedding_id = v_wid),
      'menu_options', (select count(*) from public.wedding_menu_options where wedding_id = v_wid)
    )
    from public.weddings w where w.id = v_wid
  );
end;
$$;

create or replace function public.key_planner_list(p_key text, p_kind text)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_wid uuid := public._planner_wedding_for_key(p_key); v jsonb;
begin
  case p_kind
    when 'tasks' then
      select jsonb_agg(jsonb_build_object(
               'id', t.id, 'title', t.title, 'notes', t.notes, 'start_date', t.start_date,
               'due_date', t.due_date, 'completed', t.completed_at is not null,
               'milestone', m.name)
             order by t.completed_at is not null, t.due_date nulls last, t.position)
        into v
        from public.tasks t
        left join public.deliverables d on d.id = t.deliverable_id
        left join public.milestones m on m.id = d.milestone_id
       where t.wedding_id = v_wid and t.deleted_at is null;
    when 'guests' then
      select jsonb_agg(
               (to_jsonb(g) - 'wedding_id' - 'token' - 'reminded_at' - 'reminder_count')
               || jsonb_build_object('attendees', coalesce((
                    select jsonb_agg(jsonb_build_object(
                             'id', a.id, 'name', a.name, 'menu_option_id', a.menu_option_id,
                             'table_name', a.table_name, 'seat_number', a.seat_number)
                           order by a.position)
                      from public.guest_attendees a where a.guest_id = g.id), '[]'::jsonb))
             order by g.created_at)
        into v
        from public.wedding_guests g where g.wedding_id = v_wid;
    when 'budget' then
      select jsonb_agg(to_jsonb(x) - 'wedding_id' order by x.position) into v
        from public.budget_items x where x.wedding_id = v_wid;
    when 'menu' then
      select jsonb_agg(to_jsonb(x) - 'wedding_id' order by x.position) into v
        from public.wedding_menu_options x where x.wedding_id = v_wid;
    when 'vendors' then
      select jsonb_agg(to_jsonb(x) - 'wedding_id' order by x.position) into v
        from public.wedding_vendors x where x.wedding_id = v_wid;
    when 'travel' then
      select jsonb_agg(to_jsonb(x) - 'wedding_id' order by x.position) into v
        from public.travel_items x where x.wedding_id = v_wid;
    when 'layouts' then
      select jsonb_agg(to_jsonb(x) - 'wedding_id' - 'base_image_url' order by x.created_at) into v
        from public.venue_layouts x where x.wedding_id = v_wid;
    when 'registry' then
      select jsonb_agg(to_jsonb(x) - 'wedding_id' order by x.position) into v
        from public.registry_links x where x.wedding_id = v_wid;
    else
      raise exception 'unknown list %', p_kind using errcode = '22023';
  end case;
  return coalesce(v, '[]'::jsonb);
end;
$$;

-- ── Writing ─────────────────────────────────────────────────────────────────

/**
 * Insert (p_id null) or update one row of an allowlisted table. Only keys of
 * p_fields named in _planner_table().cols are used; values are typed by
 * jsonb_populate_record, so a bad date or number is a 22xxx error, and the
 * tables' own CHECK constraints still apply. The application layer
 * (lib/mcp/planner-tools.ts) cleans inputs the same way the dashboard does.
 */
create or replace function public.key_planner_save(p_key text, p_kind text, p_id uuid, p_fields jsonb)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_wid  uuid := public._planner_wedding_for_key(p_key);
  v_def  record;
  v_keys text[];
  v_sql  text;
  v_row  jsonb;
begin
  select * into v_def from public._planner_table(p_kind);
  if v_def.tbl is null then
    raise exception 'unknown kind %', p_kind using errcode = '22023';
  end if;
  if p_fields is null or jsonb_typeof(p_fields) <> 'object' then
    raise exception 'fields must be an object' using errcode = '22023';
  end if;

  select coalesce(array_agg(k order by k), '{}') into v_keys
    from jsonb_object_keys(p_fields) as k
   where k = any (v_def.cols);

  if p_id is null then
    v_sql := format(
      'insert into public.%1$I as t (wedding_id%2$s%3$s%4$s) '
      'select $1%5$s%6$s%7$s from jsonb_populate_record(null::public.%1$I, $2) as r '
      'returning to_jsonb(t.*)',
      v_def.tbl,
      coalesce((select string_agg(', ' || quote_ident(k), '') from unnest(v_keys) k), ''),
      case when v_def.has_position then ', position' else '' end,
      case when v_def.tbl = 'tasks' then ', created_by' else '' end,
      coalesce((select string_agg(', r.' || quote_ident(k), '') from unnest(v_keys) k), ''),
      case when v_def.has_position
           then format(', coalesce((select max(position) from public.%I where wedding_id = $1), 0) + 1', v_def.tbl)
           else '' end,
      case when v_def.tbl = 'tasks' then ', auth.uid()' else '' end);
    execute v_sql into v_row using v_wid, p_fields;
  else
    if cardinality(v_keys) = 0 then
      raise exception 'nothing to change' using errcode = '22023';
    end if;
    v_sql := format(
      'update public.%1$I as t set %2$s%3$s from jsonb_populate_record(null::public.%1$I, $2) as r '
      'where t.id = $3 and t.wedding_id = $1%4$s returning to_jsonb(t.*)',
      v_def.tbl,
      (select string_agg(format('%I = r.%I', k, k), ', ') from unnest(v_keys) k),
      case when v_def.has_updated_at then ', updated_at = now()' else '' end,
      case when v_def.tbl = 'tasks' then ' and t.deleted_at is null' else '' end);
    execute v_sql into v_row using v_wid, p_fields, p_id;
    if v_row is null then
      raise exception 'not found' using errcode = 'P0002';
    end if;
  end if;

  return v_row - 'wedding_id' - 'token' - 'base_image_url';
end;
$$;

/** Delete one row. Tasks are soft-deleted, so they appear in "Recently deleted". */
create or replace function public.key_planner_delete(p_key text, p_kind text, p_id uuid)
returns boolean
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_wid uuid := public._planner_wedding_for_key(p_key); v_def record; v_n integer;
begin
  select * into v_def from public._planner_table(p_kind);
  if v_def.tbl is null then
    raise exception 'unknown kind %', p_kind using errcode = '22023';
  end if;
  if v_def.tbl = 'tasks' then
    update public.tasks set deleted_at = now(), updated_at = now()
     where id = p_id and wedding_id = v_wid and deleted_at is null;
  else
    execute format('delete from public.%I where id = $1 and wedding_id = $2', v_def.tbl) using p_id, v_wid;
  end if;
  get diagnostics v_n = row_count;
  return v_n > 0;
end;
$$;

/** Wedding details. Optionally moves task/milestone dates with the wedding date, as the Details page offers. */
create or replace function public.key_planner_update_wedding(p_key text, p_fields jsonb, p_shift_deadlines boolean default false)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_wid   uuid := public._planner_wedding_for_key(p_key);
  v_cols  text[] := array['partner_one','partner_two','event_date','city','region','venue',
                          'guest_count','budget_cents','style','notes','welcome_message'];
  v_keys  text[];
  v_old   date;
  v_new   date;
  v_moved integer := 0;
begin
  if p_fields is null or jsonb_typeof(p_fields) <> 'object' then
    raise exception 'fields must be an object' using errcode = '22023';
  end if;
  select coalesce(array_agg(k), '{}') into v_keys
    from jsonb_object_keys(p_fields) as k where k = any (v_cols);
  if cardinality(v_keys) = 0 then
    raise exception 'nothing to change' using errcode = '22023';
  end if;

  select event_date into v_old from public.weddings where id = v_wid;
  execute format(
    'update public.weddings as w set %s, updated_at = now() '
    'from jsonb_populate_record(null::public.weddings, $1) as r where w.id = $2 returning w.event_date',
    (select string_agg(format('%I = r.%I', k, k), ', ') from unnest(v_keys) k))
    into v_new using p_fields, v_wid;

  if p_shift_deadlines and v_old is not null and v_new is not null and v_new <> v_old then
    v_moved := public.shift_wedding_dates(v_wid, v_new - v_old);
  end if;
  return jsonb_build_object('updated', to_jsonb(v_keys), 'deadlines_moved', v_moved,
                            'days_moved', coalesce(v_new - v_old, 0));
end;
$$;

/** Builds the starter checklist or budget from the app's templates (no-op if one exists). */
create or replace function public.key_planner_seed(p_key text, p_what text, p_template jsonb)
returns integer
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_wid uuid := public._planner_wedding_for_key(p_key);
begin
  if p_what = 'checklist' then
    return public.seed_wedding_plan(v_wid, p_template);
  elsif p_what = 'budget' then
    return public.seed_wedding_budget(v_wid, p_template);
  end if;
  raise exception 'unknown template %', p_what using errcode = '22023';
end;
$$;

/**
 * Records a household's RSVP taken by phone or in person, through the same
 * function the guest's own form uses (same clamping and menu checks). Like the
 * guest form, a new reply replaces the previous one, attendees and seats included.
 */
create or replace function public.key_planner_record_rsvp(
  p_key text, p_guest uuid, p_attending boolean, p_attendees jsonb, p_dietary text, p_note text)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_wid uuid := public._planner_wedding_for_key(p_key); v_token uuid;
begin
  select token into v_token from public.wedding_guests where id = p_guest and wedding_id = v_wid;
  if v_token is null then
    raise exception 'not found' using errcode = 'P0002';
  end if;
  perform public.submit_guest_rsvp(v_token, p_attending, coalesce(p_attendees, '[]'::jsonb), p_dietary, p_note);
end;
$$;

/** Seats one attending person (from a household's RSVP) at a table and chair. */
create or replace function public.key_planner_seat(p_key text, p_attendee uuid, p_table text, p_seat integer)
returns boolean
language plpgsql security definer set search_path = public, pg_temp
as $$
declare v_wid uuid := public._planner_wedding_for_key(p_key); v_n integer;
begin
  update public.guest_attendees a
     set table_name = nullif(left(btrim(coalesce(p_table, '')), 60), ''),
         seat_number = case when nullif(btrim(coalesce(p_table, '')), '') is null then null else p_seat end
   where a.id = p_attendee
     and a.guest_id in (select g.id from public.wedding_guests g where g.wedding_id = v_wid);
  get diagnostics v_n = row_count;
  return v_n > 0;
end;
$$;

-- ── Grants ──────────────────────────────────────────────────────────────────
-- key_* are callable with the anon key on purpose: the key is the
-- authorization (see the header). The helpers are not callable at all.

revoke all on function public._planner_wedding_for_key(text) from public, anon, authenticated;
revoke all on function public._planner_table(text) from public, anon, authenticated;

revoke all on function public.create_assistant_key(uuid, text, text) from public, anon;
grant execute on function public.create_assistant_key(uuid, text, text) to authenticated;

revoke all on function public.key_scope(text) from public;
revoke all on function public.key_planner_overview(text) from public;
revoke all on function public.key_planner_list(text, text) from public;
revoke all on function public.key_planner_save(text, text, uuid, jsonb) from public;
revoke all on function public.key_planner_delete(text, text, uuid) from public;
revoke all on function public.key_planner_update_wedding(text, jsonb, boolean) from public;
revoke all on function public.key_planner_seed(text, text, jsonb) from public;
revoke all on function public.key_planner_record_rsvp(text, uuid, boolean, jsonb, text, text) from public;
revoke all on function public.key_planner_seat(text, uuid, text, integer) from public;

grant execute on function public.key_scope(text) to anon, authenticated;
grant execute on function public.key_planner_overview(text) to anon, authenticated;
grant execute on function public.key_planner_list(text, text) to anon, authenticated;
grant execute on function public.key_planner_save(text, text, uuid, jsonb) to anon, authenticated;
grant execute on function public.key_planner_delete(text, text, uuid) to anon, authenticated;
grant execute on function public.key_planner_update_wedding(text, jsonb, boolean) to anon, authenticated;
grant execute on function public.key_planner_seed(text, text, jsonb) to anon, authenticated;
grant execute on function public.key_planner_record_rsvp(text, uuid, boolean, jsonb, text, text) to anon, authenticated;
grant execute on function public.key_planner_seat(text, uuid, text, integer) to anon, authenticated;
