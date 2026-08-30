-- Where each person sits.
--
-- Free text rather than a number or a tables table: real weddings label them
-- "Table 4", "Head table", "Oak", "Bride's family". A lookup table would force
-- couples to create a table before they can seat anyone, which is backwards —
-- seating happens by moving names around, not by administering a schema.
alter table public.guest_attendees add column if not exists table_name text;

create index if not exists guest_attendees_table_idx
  on public.guest_attendees (guest_id, table_name);

comment on column public.guest_attendees.table_name is
  'Free-text table label for seating and place cards ("Table 4", "Head table"). Null = unseated.';
