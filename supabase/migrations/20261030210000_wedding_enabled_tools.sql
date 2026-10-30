-- Which dashboard tools a couple has switched on for their wedding.
--
-- Null means the couple hasn't customised anything yet; the app resolves that
-- to its default set (lib/wedding-tools.ts DEFAULT_TOOLS), so existing weddings
-- need no backfill. Keys are validated in the app, not here, so adding a tool
-- never needs a migration. Writes go through the existing weddings UPDATE
-- policy (can_edit_wedding), so only editors can change the dashboard.
alter table public.weddings
  add column if not exists enabled_tools text[];

alter table public.weddings
  drop constraint if exists weddings_enabled_tools_size;
alter table public.weddings
  add constraint weddings_enabled_tools_size
  check (enabled_tools is null or cardinality(enabled_tools) <= 50);
