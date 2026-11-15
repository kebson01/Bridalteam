-- Plan promotions: give a group of vendors a paid plan (Pro or Featured) for a
-- set window, from /admin/promotions. "Everyone gets Pro until Dec 31", or only
-- DJs in Miami, or a hand-picked list.
--
-- Like founding-vendor comps (20260920030000_founding_vendor_comp.sql), a
-- promotion never touches organizations.plan, which stays "what Stripe says".
-- Unlike comps it is not copied onto each vendor: a promotion is a rule,
-- evaluated live by promo_plan(), so vendors who sign up or publish while it
-- runs are covered too, and it ends on its own at ends_at with no clean-up.
--
-- Read path: promo_plan(organizations) is a PostgREST computed column, so it
-- rides along wherever lib/tiers.ts PLAN_COLUMNS is selected, and
-- effectivePlan() takes the best of paid, comp and promotion.

create table if not exists public.plan_promotions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 120),
  plan text not null check (plan in ('pro', 'featured')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  -- Audience. NULL / false means "no restriction"; every set filter must match.
  categories text[],
  cities text[],
  published_only boolean not null default false,
  claimed_only boolean not null default false,
  org_ids uuid[],
  note text,
  created_by text,
  created_at timestamptz not null default now(),
  -- Ended early from the admin page. ends_at is kept as originally planned.
  ended_at timestamptz,
  ended_by text,
  constraint plan_promotions_window check (ends_at > starts_at)
);

comment on table public.plan_promotions is
  'Time-boxed plan grants to a group of vendors, managed at /admin/promotions. Resolved live by promo_plan(); organizations.plan is never written.';

alter table public.plan_promotions enable row level security;
-- Admin-only: read and written with the service role from app/api/admin/promotions.
revoke all on public.plan_promotions from public, anon, authenticated;

-- Does promotion p cover vendor org p_org?
create or replace function public.promotion_covers(p public.plan_promotions, p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organizations o
    left join public.vendor_profiles vp on vp.org_id = o.id
    where o.id = p_org
      and o.type = 'vendor'
      and (p.org_ids is null or o.id = any (p.org_ids))
      and (p.categories is null
           or lower(btrim(coalesce(vp.category, ''))) in (select lower(btrim(c)) from unnest(p.categories) c))
      and (p.cities is null
           or lower(btrim(coalesce(vp.city, ''))) in (select lower(btrim(c)) from unnest(p.cities) c))
      and (not p.published_only or vp.status = 'published')
      and (not p.claimed_only or exists (select 1 from public.org_members m where m.org_id = o.id))
  );
$$;

revoke all on function public.promotion_covers(public.plan_promotions, uuid) from public, anon, authenticated;

-- The best plan any running promotion gives this org, or NULL.
create or replace function public.promo_plan(o public.organizations)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select p.plan
  from public.plan_promotions p
  where p.ended_at is null
    and now() >= p.starts_at
    and now() < p.ends_at
    and public.promotion_covers(p, o.id)
  order by (p.plan = 'featured') desc, p.ends_at desc
  limit 1;
$$;

-- When that plan lapses (the same promotion promo_plan picks), or NULL.
create or replace function public.promo_expires_at(o public.organizations)
returns timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  select p.ends_at
  from public.plan_promotions p
  where p.ended_at is null
    and now() >= p.starts_at
    and now() < p.ends_at
    and public.promotion_covers(p, o.id)
  order by (p.plan = 'featured') desc, p.ends_at desc
  limit 1;
$$;

grant execute on function public.promo_plan(public.organizations) to anon, authenticated;
grant execute on function public.promo_expires_at(public.organizations) to anon, authenticated;

-- Is this item in the public Inspiration feed right now?
--
-- inspiration_images.in_feed is stamped when media is added and rewritten by
-- the Stripe webhook, so it can't follow a comp or promotion starting or
-- ending. For vendor media, decide from the vendor's plan at read time
-- instead: paid, a live comp, or a running promotion (Pro and Featured both
-- include the feed; keep in step with lib/tiers.ts). Curated items, which have
-- no vendor, still use in_feed.
create or replace function public.feed_visible(i public.inspiration_images)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when i.vendor_id is null then i.in_feed
    else exists (
      select 1 from public.organizations o
      where o.id = i.vendor_id
        and (
          o.plan in ('pro', 'featured')
          or (o.comp_plan is not null and (o.comp_expires_at is null or o.comp_expires_at > now()))
          or public.promo_plan(o) is not null
        )
    )
  end;
$$;

grant execute on function public.feed_visible(public.inspiration_images) to anon, authenticated;

-- How many vendors a draft promotion would reach, for the admin preview.
create or replace function public.promotion_reach(
  p_categories text[],
  p_cities text[],
  p_published_only boolean,
  p_claimed_only boolean,
  p_org_ids uuid[]
)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.organizations o
  where o.type = 'vendor'
    and public.promotion_covers(
      row(
        gen_random_uuid(), 'preview', 'pro', now(), now() + interval '1 day',
        p_categories, p_cities, coalesce(p_published_only, false), coalesce(p_claimed_only, false),
        p_org_ids, null, null, now(), null, null
      )::public.plan_promotions,
      o.id
    );
$$;

revoke all on function public.promotion_reach(text[], text[], boolean, boolean, uuid[]) from public, anon, authenticated;
grant execute on function public.promotion_reach(text[], text[], boolean, boolean, uuid[]) to service_role;
