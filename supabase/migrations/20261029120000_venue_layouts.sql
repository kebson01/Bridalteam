-- Overhead venue layouts: a floor plan (or a straightened photo of the room)
-- with tables, a dance floor, a bar and the rest dragged on top of it.
--
-- Everything in a layout is measured in FEET, not pixels. The base image is
-- stretched over a width_ft × length_ft rectangle, and every piece's position
-- and size is in that same space. That is what lets a 60" round actually take
-- up five feet of the room, and it means the layout survives the picture being
-- replaced or re-measured.
--
-- The pieces live in one jsonb array rather than a row each. A layout is
-- edited as a whole — dragging ten tables around is ten writes to one document,
-- not ten round trips — nothing queries a single table on its own, and the
-- seating link to guests goes by table LABEL (guest_attendees.table_name is
-- free text), not by id. The size check keeps a runaway client from storing a
-- megabyte of junk; a realistic 300-guest reception is well under 20 KB.
create table if not exists public.venue_layouts (
  id             uuid primary key default gen_random_uuid(),
  wedding_id     uuid not null references public.weddings(id) on delete cascade,
  name           text not null default 'Reception' check (char_length(name) between 1 and 80),
  -- Public URL in the wedding-media bucket, under <wedding_id>/. Null = a plain
  -- grid with no picture underneath.
  base_image_url text,
  width_ft       numeric(6,2) not null default 60 check (width_ft between 5 and 1000),
  length_ft      numeric(6,2) not null default 40 check (length_ft between 5 and 1000),
  items          jsonb not null default '[]'::jsonb
                   check (jsonb_typeof(items) = 'array' and pg_column_size(items) < 200000),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists venue_layouts_wedding_idx on public.venue_layouts(wedding_id);
alter table public.venue_layouts enable row level security;

-- Same rules as the guest list: anyone on the wedding's team can look, editors
-- can change it. A planner or venue coordinator invited to the team gets the
-- access their role already carries.
drop policy if exists "Members read layouts" on public.venue_layouts;
create policy "Members read layouts" on public.venue_layouts
  for select using (can_access_wedding(wedding_id));
drop policy if exists "Editors add layouts" on public.venue_layouts;
create policy "Editors add layouts" on public.venue_layouts
  for insert with check (can_edit_wedding(wedding_id));
drop policy if exists "Editors update layouts" on public.venue_layouts;
create policy "Editors update layouts" on public.venue_layouts
  for update using (can_edit_wedding(wedding_id)) with check (can_edit_wedding(wedding_id));
drop policy if exists "Editors remove layouts" on public.venue_layouts;
create policy "Editors remove layouts" on public.venue_layouts
  for delete using (can_edit_wedding(wedding_id));

comment on table public.venue_layouts is
  'Overhead floor plans with tables placed on them. Coordinates and sizes in feet; see lib/venue-layout.ts for the item shape.';
