-- Menu choices, per attending person.
--
-- A household of four where two are coming needs two dishes, not one: the
-- kitchen counts plates, and place cards carry a name and a meal. So the reply
-- stops being a single number and becomes a row per attendee.

create table if not exists public.wedding_menu_options (
  id          uuid primary key default gen_random_uuid(),
  wedding_id  uuid not null references public.weddings(id) on delete cascade,
  name        text not null,
  description text,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists wedding_menu_options_wedding_idx
  on public.wedding_menu_options(wedding_id, position);
alter table public.wedding_menu_options enable row level security;

drop policy if exists "Members read the menu" on public.wedding_menu_options;
create policy "Members read the menu" on public.wedding_menu_options
  for select using (can_access_wedding(wedding_id));
drop policy if exists "Editors write the menu" on public.wedding_menu_options;
create policy "Editors write the menu" on public.wedding_menu_options
  for all using (can_edit_wedding(wedding_id)) with check (can_edit_wedding(wedding_id));

create table if not exists public.guest_attendees (
  id             uuid primary key default gen_random_uuid(),
  guest_id       uuid not null references public.wedding_guests(id) on delete cascade,
  name           text,
  -- A dish can be removed from the menu after people have chosen it; that must
  -- not delete their attendance, so this goes null rather than cascading.
  menu_option_id uuid references public.wedding_menu_options(id) on delete set null,
  position       integer not null default 0,
  created_at     timestamptz not null default now()
);
create index if not exists guest_attendees_guest_idx on public.guest_attendees(guest_id, position);
alter table public.guest_attendees enable row level security;

drop policy if exists "Members read attendees" on public.guest_attendees;
create policy "Members read attendees" on public.guest_attendees
  for select using (
    can_access_wedding((select g.wedding_id from public.wedding_guests g where g.id = guest_id))
  );
drop policy if exists "Editors write attendees" on public.guest_attendees;
create policy "Editors write attendees" on public.guest_attendees
  for all using (
    can_edit_wedding((select g.wedding_id from public.wedding_guests g where g.id = guest_id))
  ) with check (
    can_edit_wedding((select g.wedding_id from public.wedding_guests g where g.id = guest_id))
  );

alter table public.wedding_guests add column if not exists dietary text;
comment on column public.wedding_guests.meal is
  'Legacy free-text dish, from before wedding_menu_options existed. New replies use guest_attendees.menu_option_id and wedding_guests.dietary.';

-- ── Guest-facing: one json document, and a reply that carries the party ──────
drop function if exists public.get_guest_invite(uuid);
create or replace function public.get_guest_invite(p_token uuid)
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object(
    'household', jsonb_build_object(
      'name', g.household_name, 'seats', g.seats, 'responded_at', g.responded_at,
      'attending', g.attending, 'party_size', g.party_size,
      'dietary', coalesce(g.dietary, g.meal), 'note', g.note),
    'wedding', jsonb_build_object(
      'partner_one', w.partner_one, 'partner_two', w.partner_two,
      'event_date', w.event_date, 'city', w.city, 'venue', w.venue,
      'welcome_message', w.welcome_message),
    'menu', coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'name',m.name,'description',m.description)
                                       order by m.position, m.created_at)
                        from public.wedding_menu_options m where m.wedding_id = g.wedding_id), '[]'::jsonb),
    'attendees', coalesce((select jsonb_agg(jsonb_build_object('name',a.name,'menu_option_id',a.menu_option_id)
                                            order by a.position)
                             from public.guest_attendees a where a.guest_id = g.id), '[]'::jsonb))
  from public.wedding_guests g join public.weddings w on w.id = g.wedding_id
  where g.token = p_token;
$$;

-- The head count is derived from the attendee list rather than sent alongside
-- it, so the two can't disagree.
drop function if exists public.submit_guest_rsvp(uuid, boolean, integer, text, text);
create or replace function public.submit_guest_rsvp(
  p_token uuid, p_attending boolean, p_attendees jsonb, p_dietary text, p_note text
) returns void language plpgsql security definer set search_path = public as $$
declare g public.wedding_guests; n integer; allowed integer;
begin
  select * into g from public.wedding_guests where token = p_token;
  if g.id is null then raise exception 'invite_not_found'; end if;

  -- Never more people than the invitation offered, however the form was posted.
  n := coalesce(jsonb_array_length(coalesce(p_attendees, '[]'::jsonb)), 0);
  allowed := least(greatest(n, 1), g.seats);

  update public.wedding_guests
     set attending = p_attending,
         party_size = case when p_attending then allowed else 0 end,
         dietary = nullif(btrim(coalesce(p_dietary,'')),''),
         note = left(nullif(btrim(coalesce(p_note,'')),''), 1000),
         responded_at = now(), updated_at = now()
   where id = g.id;

  -- A reply is a complete statement of who's coming, so the previous one is
  -- replaced rather than merged.
  delete from public.guest_attendees where guest_id = g.id;

  if p_attending then
    insert into public.guest_attendees (guest_id, name, menu_option_id, position)
    select g.id,
           left(nullif(btrim(coalesce(e.value->>'name','')),''), 120),
           -- Only a dish that is actually on this wedding's menu.
           (select m.id from public.wedding_menu_options m
             where m.id = nullif(e.value->>'menu_option_id','')::uuid
               and m.wedding_id = g.wedding_id),
           e.ord - 1
      from jsonb_array_elements(coalesce(p_attendees,'[]'::jsonb)) with ordinality as e(value, ord)
     where e.ord <= allowed;
  end if;
end;
$$;

revoke execute on function public.get_guest_invite(uuid) from public;
revoke execute on function public.submit_guest_rsvp(uuid, boolean, jsonb, text, text) from public;
grant  execute on function public.get_guest_invite(uuid) to anon, authenticated;
grant  execute on function public.submit_guest_rsvp(uuid, boolean, jsonb, text, text) to anon, authenticated;
