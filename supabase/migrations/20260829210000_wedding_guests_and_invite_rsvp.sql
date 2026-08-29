-- Guest list + personalised, invite-only RSVP.
--
-- A household is the unit: "Alex & Sam Smith — 2 seats" gets one invite, one
-- link and one reply covering everyone, which is how paper invitations work and
-- keeps a 100-guest wedding to roughly 60 rows.
--
-- The reply lives on the guest row rather than in a separate table because it
-- is strictly one-per-household and editable — a join would buy nothing and the
-- "who hasn't replied yet" query is the whole point of the page.
create table if not exists public.wedding_guests (
  id             uuid primary key default gen_random_uuid(),
  wedding_id     uuid not null references public.weddings(id) on delete cascade,
  household_name text not null,
  email          text,
  seats          integer not null default 1 check (seats between 1 and 20),
  -- The guest's personal RSVP link. Unguessable (122 bits) and the only thing
  -- standing between a stranger and this household's reply, exactly as
  -- wedding_invites.token already works for co-planners.
  token          uuid not null unique default gen_random_uuid(),
  invited_at     timestamptz,
  responded_at   timestamptz,
  attending      boolean,
  party_size     integer check (party_size is null or party_size >= 0),
  meal           text,
  note           text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists wedding_guests_wedding_idx on public.wedding_guests(wedding_id);
alter table public.wedding_guests enable row level security;

drop policy if exists "Members read the guest list" on public.wedding_guests;
create policy "Members read the guest list" on public.wedding_guests
  for select using (can_access_wedding(wedding_id));
drop policy if exists "Editors add guests" on public.wedding_guests;
create policy "Editors add guests" on public.wedding_guests
  for insert with check (can_edit_wedding(wedding_id));
drop policy if exists "Editors update guests" on public.wedding_guests;
create policy "Editors update guests" on public.wedding_guests
  for update using (can_edit_wedding(wedding_id)) with check (can_edit_wedding(wedding_id));
drop policy if exists "Editors remove guests" on public.wedding_guests;
create policy "Editors remove guests" on public.wedding_guests
  for delete using (can_edit_wedding(wedding_id));

-- Guests are anonymous and reach their invitation only by token. Both functions
-- are SECURITY DEFINER and return exactly one household — never the list.
create or replace function public.get_guest_invite(p_token uuid)
returns table (
  household_name text, seats integer, responded_at timestamptz, attending boolean,
  party_size integer, meal text, note text,
  partner_one text, partner_two text, event_date date, city text, venue text,
  welcome_message text
)
language sql security definer set search_path = public as $$
  select g.household_name, g.seats, g.responded_at, g.attending, g.party_size,
         g.meal, g.note,
         w.partner_one, w.partner_two, w.event_date, w.city, w.venue, w.welcome_message
  from public.wedding_guests g
  join public.weddings w on w.id = g.wedding_id
  where g.token = p_token;
$$;

create or replace function public.submit_guest_rsvp(
  p_token uuid, p_attending boolean, p_party_size integer, p_meal text, p_note text
) returns void
language plpgsql security definer set search_path = public as $$
declare g public.wedding_guests;
begin
  select * into g from public.wedding_guests where token = p_token;
  if g.id is null then raise exception 'invite_not_found'; end if;
  update public.wedding_guests
     set attending    = p_attending,
         -- Can't bring more people than they were invited for, and a decline is
         -- always zero regardless of what the form posted.
         party_size   = case when p_attending
                             then least(greatest(coalesce(p_party_size, 1), 1), g.seats)
                             else 0 end,
         meal         = nullif(btrim(coalesce(p_meal, '')), ''),
         note         = left(nullif(btrim(coalesce(p_note, '')), ''), 1000),
         responded_at = now(),
         updated_at   = now()
   where id = g.id;
end;
$$;

-- Postgres grants EXECUTE on new functions to PUBLIC by default, so revoking
-- from a named role alone changes nothing. Revoke PUBLIC first, then grant
-- explicitly.
revoke execute on function public.get_guest_invite(uuid) from public;
revoke execute on function public.submit_guest_rsvp(uuid, boolean, integer, text, text) from public;
grant  execute on function public.get_guest_invite(uuid) to anon, authenticated;
grant  execute on function public.submit_guest_rsvp(uuid, boolean, integer, text, text) to anon, authenticated;

-- RSVP is invite-only now, so the open public form is closed for good.
revoke execute on function public.submit_rsvp(text, text, boolean, integer, text, text)
  from public, anon, authenticated;
