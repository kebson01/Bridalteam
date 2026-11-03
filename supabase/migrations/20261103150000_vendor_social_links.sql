-- Social media profiles on a vendor listing (Instagram, Facebook, TikTok,
-- YouTube, Pinterest, X), stored as { "instagram": "https://...", ... }.
--
-- Vendors can update their own vendor_profiles row directly through the API,
-- not only through the profile form, so the shape is enforced here: known
-- platforms only, and each value an https URL on that platform's own domain.
-- lib/social.ts normalises what vendors type into exactly this shape; keep
-- the domain lists in the two places in step.

create or replace function public.vendor_social_links_ok(p jsonb)
returns boolean
language sql
immutable
set search_path to 'public', 'pg_temp'
as $$
  select jsonb_typeof(p) = 'object' and not exists (
    select 1
      from jsonb_each(p) e
     where e.key not in ('instagram', 'facebook', 'tiktok', 'youtube', 'pinterest', 'x')
        or jsonb_typeof(e.value) <> 'string'
        or length(e.value #>> '{}') > 300
        or (e.value #>> '{}') !~ (
             '^https://([a-z0-9-]+\.)*'
             || case e.key
                  when 'instagram' then 'instagram\.com'
                  when 'facebook'  then '(facebook\.com|fb\.com)'
                  when 'tiktok'    then 'tiktok\.com'
                  when 'youtube'   then 'youtube\.com'
                  when 'pinterest' then 'pinterest\.com'
                  when 'x'         then '(x\.com|twitter\.com)'
                end
             || '/[^\s<>"''?#]+(\?id=[A-Za-z0-9%]+)?$')
  )
$$;

alter table public.vendor_profiles
  add column if not exists social_links jsonb not null default '{}'::jsonb;

alter table public.vendor_profiles
  drop constraint if exists vendor_profiles_social_links_ok;
alter table public.vendor_profiles
  add constraint vendor_profiles_social_links_ok check (public.vendor_social_links_ok(social_links));

comment on column public.vendor_profiles.social_links is
  'Social profiles: {platform: https URL}. Platforms: instagram, facebook, tiktok, youtube, pinterest, x. See lib/social.ts.';
