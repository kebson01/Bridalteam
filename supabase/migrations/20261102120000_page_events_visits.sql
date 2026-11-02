-- Visits, time on page, and the analytics dashboard (/admin/analytics).
--
-- ── What changes, and what deliberately doesn't ─────────────────────────────
-- page_events was built with no identifier at all (20260920060000), which
-- answers "how many views did this page get" but not "how many people came",
-- "how long did they stay", "where did they go next" or "which landing page
-- leads to signups". Those need events from one visit to be linkable.
--
-- So each event may now carry a visit_id: a random UUID the browser keeps in
-- sessionStorage for one tab, and replaces after 30 minutes of inactivity.
-- What it is NOT:
--   - not a cookie, and not in localStorage: closing the tab forgets it;
--   - not linked to an account, an IP, a device or a fingerprint;
--   - not reused across visits, so a returning person is a new visit and
--     nobody can be followed from one day to the next, even by us.
-- "Visits" are therefore visits, not unique people. A person who comes back
-- tomorrow counts twice. That is the honest unit, and the dashboard says so.
--
-- duration_ms is how long a page was actually on screen (visible time only),
-- sent as a 'page_leave' event when the visitor navigates away, hides the tab
-- or closes it. Capped at 30 minutes per event so a forgotten tab can't skew
-- the averages.
--
-- Rows from before this migration have no visit_id. They still count as page
-- views; visit-based numbers start from the day this shipped.

alter table public.page_events
  add column if not exists visit_id uuid,
  add column if not exists duration_ms integer check (duration_ms is null or duration_ms between 0 and 1800000);

create index if not exists page_events_visit_idx
  on public.page_events (visit_id, created_at) where visit_id is not null;

comment on table public.page_events is
  'First-party analytics. No IP, user id, cookie or fingerprint. visit_id is a random per-tab id (sessionStorage, 30 min idle timeout) so one visit''s pages can be linked; it is never linked across visits. Written only by /api/track with the service role. Read by analytics_summary().';

-- ── Path grouping ────────────────────────────────────────────────────────────
-- Many pages differ only by an id: every couple's workspace, every vendor
-- profile, every wedding website. Grouped, they read as one row each
-- ("/w/[id]/budget") instead of hundreds of one-view rows, and no couple's
-- wedding id or website address appears on the dashboard.
create or replace function public.analytics_norm_path(p text)
returns text
language sql
immutable
set search_path to 'public', 'pg_temp'
as $$
  select case
    when p is null then null
    when p ~ '^/wedding/[^/]+' then regexp_replace(p, '^/wedding/[^/]+', '/wedding/[site]')
    else regexp_replace(p, '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}', '[id]', 'g')
  end
$$;

-- The signed-in app, as opposed to the public website. "Public" scope on the
-- dashboard leaves these out, so a couple working on their budget all evening
-- doesn't read as website traffic.
create or replace function public.analytics_is_app_path(p text)
returns boolean
language sql
immutable
set search_path to 'public', 'pg_temp'
as $$
  select p is not null and (
       p in ('/dashboard', '/onboarding', '/account', '/vendor', '/admin', '/w')
    or p like '/dashboard/%' or p like '/onboarding/%' or p like '/account/%'
    or p like '/vendor/%' or p like '/admin/%' or p like '/w/%'
  )
$$;

-- ── The dashboard's numbers, in one call ─────────────────────────────────────
-- p_days: the window, 1-365 days back from now.
-- p_scope: 'public' (website pages only) or 'all' (website and signed-in app).
-- p_tz: the time zone days are bucketed in.
--
-- SECURITY DEFINER because it reads auth.users for account counts. Callable
-- only by the service role (the admin API route); revoked from everyone else
-- below.
create or replace function public.analytics_summary(
  p_days integer default 30,
  p_scope text default 'public',
  p_tz text default 'America/New_York'
) returns jsonb
language sql
stable
security definer
set search_path to 'public', 'pg_temp'
as $$
with
params as (
  select greatest(1, least(coalesce(p_days, 30), 365)) as days,
         now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 365))) as since
),
ev as (
  select e.name, e.visit_id, e.source, e.duration_ms, e.created_at,
         public.analytics_norm_path(e.path) as path
    from public.page_events e, params
   where e.created_at >= params.since
),
scoped as (
  select * from ev
   where coalesce(p_scope, 'public') = 'all'
      or path is null
      or not public.analytics_is_app_path(path)
),
views as (select * from scoped where name = 'page_view'),
visits as (
  select visit_id,
         min(created_at) as first_at,
         count(*) filter (where name = 'page_view') as pageviews,
         coalesce(sum(duration_ms) filter (where name = 'page_leave'), 0) as ms,
         bool_or(name = 'signup_success') as signed_up,
         (array_agg(path order by created_at) filter (where name = 'page_view'))[1] as entry,
         (array_agg(path order by created_at desc) filter (where name = 'page_view'))[1] as exit_path,
         coalesce((array_agg(source order by created_at) filter (where source is not null))[1], '(direct)') as source
    from scoped
   where visit_id is not null
   group by visit_id
  having count(*) filter (where name = 'page_view') > 0
),
seq as (
  select path, lead(path) over (partition by visit_id order by created_at) as nxt
    from views
   where visit_id is not null
),
page_time as (
  select path, sum(duration_ms) as ms from scoped where name = 'page_leave' group by path
),
tot as (
  select (select count(*) from views) as page_views,
         (select count(*) from visits) as visits,
         (select count(*) from visits where pageviews = 1) as bounces,
         (select count(*) from visits where signed_up) as signup_visits,
         (select coalesce(avg(pageviews), 0) from visits) as pages_per_visit,
         (select coalesce(avg(ms), 0) from visits where ms > 0) as avg_visit_ms,
         (select count(*) from scoped where name = 'planner_message') as planner_messages,
         (select min(created_at) from public.page_events where visit_id is not null) as visits_since
),
accounts as (
  select (select count(*) from auth.users u, params where u.created_at >= params.since) as new_accounts,
         (select count(*) from public.weddings w, params where w.created_at >= params.since) as new_weddings,
         (select count(*) from public.org_members m join public.organizations o on o.id = m.org_id, params
           where o.type = 'vendor' and m.created_at >= params.since) as new_vendor_accounts
),
days as (
  select generate_series(
           date_trunc('day', (select since from params) at time zone p_tz),
           date_trunc('day', now() at time zone p_tz),
           interval '1 day')::date as day
)
select jsonb_build_object(
  'range', jsonb_build_object('days', (select days from params), 'since', (select since from params), 'scope', coalesce(p_scope, 'public'), 'tz', p_tz),
  'totals', (
    select jsonb_build_object(
      'page_views', t.page_views,
      'visits', t.visits,
      'pages_per_visit', round(t.pages_per_visit::numeric, 2),
      'avg_visit_seconds', round((t.avg_visit_ms / 1000.0)::numeric),
      'bounce_rate', case when t.visits > 0 then round(t.bounces::numeric / t.visits, 3) else null end,
      'signup_visits', t.signup_visits,
      'visit_to_signup', case when t.visits > 0 then round(t.signup_visits::numeric / t.visits, 4) else null end,
      'planner_messages', t.planner_messages,
      'visits_tracked_since', t.visits_since,
      'new_accounts', a.new_accounts,
      'new_weddings', a.new_weddings,
      'new_vendor_accounts', a.new_vendor_accounts
    ) from tot t, accounts a
  ),
  'daily', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'day', d.day,
      'views', (select count(*) from views v where (v.created_at at time zone p_tz)::date = d.day),
      'visits', (select count(*) from visits x where (x.first_at at time zone p_tz)::date = d.day),
      'signups', (select count(*) from auth.users u where (u.created_at at time zone p_tz)::date = d.day)
    ) order by d.day), '[]'::jsonb) from days d
  ),
  'top_pages', (
    select coalesce(jsonb_agg(r order by (r->>'views')::int desc), '[]'::jsonb) from (
      select jsonb_build_object(
        'path', v.path,
        'views', count(*),
        'share', round(count(*)::numeric / nullif((select page_views from tot), 0), 4),
        'visits', count(distinct v.visit_id),
        -- Averaged over views that belong to a visit: views recorded before
        -- timing existed have no page_leave and would only drag it down.
        'avg_seconds', case when count(v.visit_id) > 0
                            then round(coalesce(max(pt.ms), 0) / 1000.0 / count(v.visit_id)) end
      ) as r
        from views v left join page_time pt on pt.path = v.path
       where v.path is not null
       group by v.path
       order by count(*) desc
       limit 25
    ) s
  ),
  'entry_pages', (
    select coalesce(jsonb_agg(r order by (r->>'visits')::int desc), '[]'::jsonb) from (
      select jsonb_build_object(
        'path', entry,
        'visits', count(*),
        'share', round(count(*)::numeric / nullif((select visits from tot), 0), 4),
        'bounce_rate', round(count(*) filter (where pageviews = 1)::numeric / count(*), 3),
        'signups', count(*) filter (where signed_up)
      ) as r
        from visits group by entry order by count(*) desc limit 15
    ) s
  ),
  'exit_pages', (
    select coalesce(jsonb_agg(r order by (r->>'visits')::int desc), '[]'::jsonb) from (
      select jsonb_build_object(
        'path', exit_path,
        'visits', count(*),
        'share', round(count(*)::numeric / nullif((select visits from tot), 0), 4)
      ) as r
        from visits group by exit_path order by count(*) desc limit 15
    ) s
  ),
  'flows', (
    select coalesce(jsonb_agg(r order by (r->>'count')::int desc), '[]'::jsonb) from (
      select jsonb_build_object('from', path, 'to', nxt, 'count', count(*)) as r
        from seq where nxt is not null and nxt <> path
       group by path, nxt order by count(*) desc limit 20
    ) s
  ),
  'sources', (
    select coalesce(jsonb_agg(r order by (r->>'visits')::int desc), '[]'::jsonb) from (
      select jsonb_build_object(
        'source', source,
        'visits', count(*),
        'share', round(count(*)::numeric / nullif((select visits from tot), 0), 4),
        'signups', count(*) filter (where signed_up)
      ) as r
        from visits group by source order by count(*) desc limit 15
    ) s
  ),
  'vendors', (
    select jsonb_build_object(
      'profile_views', (select count(*) from public.vendor_events e, params where e.kind = 'view' and e.created_at >= params.since),
      'website_clicks', (select count(*) from public.vendor_events e, params where e.kind = 'link_click' and e.created_at >= params.since),
      'top', (
        select coalesce(jsonb_agg(r order by (r->>'views')::int desc), '[]'::jsonb) from (
          select jsonb_build_object(
            'name', p.business_name,
            'org_id', e.vendor_org_id,
            'views', count(*) filter (where e.kind = 'view'),
            'clicks', count(*) filter (where e.kind = 'link_click')
          ) as r
            from public.vendor_events e
            join public.vendor_profiles p on p.org_id = e.vendor_org_id, params
           where e.created_at >= params.since
           group by p.business_name, e.vendor_org_id
           order by count(*) filter (where e.kind = 'view') desc
           limit 10
        ) s
      )
    )
  )
)
$$;

-- Supabase grants EXECUTE on new functions to anon and authenticated directly
-- (see 20261006210000_claim_listing_by_email.sql), so revoke by name.
revoke all on function public.analytics_summary(integer, text, text) from public, anon, authenticated;
grant execute on function public.analytics_summary(integer, text, text) to service_role;
