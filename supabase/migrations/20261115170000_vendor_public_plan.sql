-- The plan a vendor's PUBLIC listing should show: paid, a live comp, or a
-- running promotion, whichever is best.
--
-- Public pages (the directory, the homepage, /v/[id], the AI tools) used to
-- read the plan through an organizations(...) embed, but organizations is
-- readable only by its own members ("Members read their org"). For everyone
-- else the embed came back null and every vendor looked Free: no top
-- placement or badge for Featured, no inquiry form for Pro, comps included.
--
-- This computed column on vendor_profiles answers just the plan name, which
-- the listing shows anyway, without opening up the organizations row.
-- Keep in step with lib/tiers.ts effectivePlan().

create or replace function public.vendor_plan(vp public.vendor_profiles)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when 'featured' in (o.plan, x.comp, x.promo) then 'featured'
    when 'pro' in (o.plan, x.comp, x.promo) then 'pro'
    else 'free'
  end
  from public.organizations o
  cross join lateral (
    select
      case when o.comp_expires_at is null or o.comp_expires_at > now() then o.comp_plan end as comp,
      public.promo_plan(o) as promo
  ) x
  where o.id = vp.org_id;
$$;

grant execute on function public.vendor_plan(public.vendor_profiles) to anon, authenticated;
