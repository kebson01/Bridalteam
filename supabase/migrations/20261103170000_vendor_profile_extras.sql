-- Optional parts of a vendor profile: a price tier ($ to $$$$), highlights,
-- packages with a starting price, and FAQs. See lib/vendor-extras.ts.
--
-- Vendors can update their own vendor_profiles row directly through the API,
-- not only through the profile form, so the shapes and limits are enforced
-- here as well. Keep them in step with LIMITS in lib/vendor-extras.ts.

create or replace function public.vendor_highlights_ok(p jsonb)
returns boolean
language sql
immutable
set search_path to 'public', 'pg_temp'
as $$
  select jsonb_typeof(p) = 'array'
     and jsonb_array_length(p) <= 6
     and not exists (
       select 1 from jsonb_array_elements(p) e
        where jsonb_typeof(e) <> 'object'
           or jsonb_typeof(e->'title') is distinct from 'string'
           or length(e->>'title') not between 1 and 40
           or (e ? 'detail' and jsonb_typeof(e->'detail') not in ('string', 'null'))
           or length(coalesce(e->>'detail', '')) > 60
           or coalesce(e->>'icon', 'star') not in
                ('award', 'star', 'heart', 'leaf', 'language', 'truck', 'clock', 'sparkle')
     )
$$;

create or replace function public.vendor_packages_ok(p jsonb)
returns boolean
language sql
immutable
set search_path to 'public', 'pg_temp'
as $$
  select jsonb_typeof(p) = 'array'
     and jsonb_array_length(p) <= 6
     and not exists (
       select 1 from jsonb_array_elements(p) e
        where jsonb_typeof(e) <> 'object'
           or jsonb_typeof(e->'name') is distinct from 'string'
           or length(e->>'name') not between 1 and 60
           or (e ? 'price' and jsonb_typeof(e->'price') not in ('number', 'null'))
           or (jsonb_typeof(e->'price') = 'number' and (e->>'price')::numeric not between 0 and 1000000)
           or (e ? 'description' and jsonb_typeof(e->'description') not in ('string', 'null'))
           or length(coalesce(e->>'description', '')) > 400
           or (e ? 'featured' and jsonb_typeof(e->'featured') <> 'boolean')
           or (e ? 'includes' and (
                 jsonb_typeof(e->'includes') <> 'array'
                 or jsonb_array_length(e->'includes') > 10
                 or exists (
                   select 1 from jsonb_array_elements(e->'includes') i
                    where jsonb_typeof(i) <> 'string' or length(i #>> '{}') > 120
                 )
              ))
     )
$$;

create or replace function public.vendor_faqs_ok(p jsonb)
returns boolean
language sql
immutable
set search_path to 'public', 'pg_temp'
as $$
  select jsonb_typeof(p) = 'array'
     and jsonb_array_length(p) <= 10
     and not exists (
       select 1 from jsonb_array_elements(p) e
        where jsonb_typeof(e) <> 'object'
           or jsonb_typeof(e->'q') is distinct from 'string'
           or jsonb_typeof(e->'a') is distinct from 'string'
           or length(e->>'q') not between 1 and 200
           or length(e->>'a') not between 1 and 1000
     )
$$;

alter table public.vendor_profiles
  add column if not exists price_tier smallint,
  add column if not exists highlights jsonb not null default '[]'::jsonb,
  add column if not exists packages jsonb not null default '[]'::jsonb,
  add column if not exists faqs jsonb not null default '[]'::jsonb;

alter table public.vendor_profiles
  drop constraint if exists vendor_profiles_price_tier_check,
  drop constraint if exists vendor_profiles_highlights_ok,
  drop constraint if exists vendor_profiles_packages_ok,
  drop constraint if exists vendor_profiles_faqs_ok;

alter table public.vendor_profiles
  add constraint vendor_profiles_price_tier_check check (price_tier is null or price_tier between 1 and 4),
  add constraint vendor_profiles_highlights_ok check (public.vendor_highlights_ok(highlights)),
  add constraint vendor_profiles_packages_ok check (public.vendor_packages_ok(packages)),
  add constraint vendor_profiles_faqs_ok check (public.vendor_faqs_ok(faqs));

comment on column public.vendor_profiles.price_tier is '1-4, shown as $ to $$$$. NULL = not stated.';
comment on column public.vendor_profiles.highlights is '[{icon, title, detail}], up to 6. See lib/vendor-extras.ts.';
comment on column public.vendor_profiles.packages is '[{name, price (USD, from), description, includes[], featured}], up to 6.';
comment on column public.vendor_profiles.faqs is '[{q, a}], up to 10.';
