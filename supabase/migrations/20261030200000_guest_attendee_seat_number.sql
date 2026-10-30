-- Which chair at the table.
--
-- table_name says where a person sits; this says which seat, so the layout's
-- seat dial can show who is next to whom and the caterer's sheet can go chair
-- by chair. Null = seated at the table but no chair chosen yet (the editor
-- fills those into the free chairs for display without saving them).
--
-- Seats are numbered clockwise from 12 o'clock, the same order the layout
-- draws chairs in (lib/venue-layout.ts chairPositions). Not unique: table names
-- are free text, so two attendees can briefly hold "seat 3" of what turn out to
-- be different spellings of one table; the editor resolves it when it draws.
alter table public.guest_attendees
  add column if not exists seat_number integer check (seat_number between 1 and 24);

comment on column public.guest_attendees.seat_number is
  'Chair at the table, 1 = 12 o''clock, clockwise. Null = no chair chosen. Only meaningful with table_name.';
