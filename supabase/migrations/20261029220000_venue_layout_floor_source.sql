-- Where a layout's floor came from, so a layout built on a photo can be
-- marked approximate.
--
-- A floor plan is measured (the couple sets the scale from a known length) and
-- a blank room is typed in by size, but a photo straightened from floor level
-- is only as good as the four corners tapped on it and the size typed in. The
-- editor, the layout list and the print page say so whenever this is 'photo'.
--
-- Nullable with no default: layouts made before this column existed have an
-- unknown source and are shown without the label, rather than being guessed.
alter table public.venue_layouts
  add column if not exists floor_source text
  check (floor_source is null or floor_source in ('plan', 'photo', 'blank'));

comment on column public.venue_layouts.floor_source is
  'How the floor was set up: plan (measured floor plan), photo (straightened room photo, approximate) or blank (size only). Null for layouts made before this was recorded.';
