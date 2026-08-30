-- A photo for the couple's public wedding page.
alter table public.weddings add column if not exists cover_image_url text;
comment on column public.weddings.cover_image_url is
  'Public URL of the hero photo shown on /wedding/<slug>. Uploaded to the wedding-media bucket.';

-- Public bucket: the wedding page is served to guests who have no account, so
-- the file must be readable without a session. Writes are the part to guard.
insert into storage.buckets (id, name, public)
values ('wedding-media', 'wedding-media', true)
on conflict (id) do nothing;

-- Files live under <wedding_id>/..., and only someone who may edit THAT wedding
-- may write there. Deliberately stricter than the existing vendor-media policy,
-- which checks only bucket_id and so lets any signed-in user upload into it.
-- The uuid cast is regex-guarded because a non-uuid folder name would raise
-- rather than simply being refused.
drop policy if exists "wedding media upload" on storage.objects;
create policy "wedding media upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'wedding-media'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and can_edit_wedding(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "wedding media update" on storage.objects;
create policy "wedding media update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'wedding-media'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and can_edit_wedding(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "wedding media delete" on storage.objects;
create policy "wedding media delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'wedding-media'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and can_edit_wedding(((storage.foldername(name))[1])::uuid)
  );

-- Adding a column changes the OUT row type, so the old signature has to go
-- first: Postgres will not replace a set-returning function in place.
drop function if exists public.get_public_wedding(text);
create function public.get_public_wedding(p_slug text)
returns table (
  partner_one text, partner_two text, event_date date, venue text, city text,
  region text, welcome_message text, cover_image_url text
)
language sql stable security definer set search_path to 'public'
as $$
  select partner_one, partner_two, event_date, venue, city, region,
         welcome_message, cover_image_url
  from public.weddings
  where public_slug = p_slug and website_published = true
  limit 1;
$$;
revoke execute on function public.get_public_wedding(text) from public;
grant execute on function public.get_public_wedding(text) to anon, authenticated;
