-- Which part of the cover photo to show.
--
-- The hero is a wide band and a phone photo is usually tall, so object-cover has
-- to crop something. Rather than guess, the couple picks the vertical focal
-- point: 0 = top of the photo, 100 = bottom, 50 = middle. Faces are rarely in
-- the middle of a portrait shot, which is why the default crop looked wrong.
alter table public.weddings
  add column if not exists cover_position smallint not null default 50
  check (cover_position between 0 and 100);

comment on column public.weddings.cover_position is
  'Vertical focal point of cover_image_url as a percentage: 0 = top of image, 100 = bottom. Maps to CSS object-position.';

-- Adding a column changes the OUT row type, so the function is replaced wholesale.
drop function if exists public.get_public_wedding(text);
create function public.get_public_wedding(p_slug text)
returns table (
  partner_one text, partner_two text, event_date date, venue text, city text,
  region text, welcome_message text, cover_image_url text, cover_position smallint
)
language sql stable security definer set search_path to 'public'
as $$
  select partner_one, partner_two, event_date, venue, city, region,
         welcome_message, cover_image_url, cover_position
  from public.weddings
  where public_slug = p_slug and website_published = true
  limit 1;
$$;
revoke execute on function public.get_public_wedding(text) from public;
grant execute on function public.get_public_wedding(text) to anon, authenticated;
