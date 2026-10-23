# Queries for the funnel

Run in the Supabase SQL editor. The user runs them and pastes the results.
Tables: `page_events` (`supabase/migrations/20260920060000_page_events.sql`:
`name`, `path` without query string, `source`, `created_at`, no personal
identifier) and `auth.users` (signup attribution is stored in
`raw_user_meta_data` by `components/auth/auth-panel.tsx`, from
`lib/attribution.ts`). Event names are the four in `lib/events.ts`:
`page_view`, `planner_message`, `planner_limit`, `signup_success`.

Before relying on these, check the migrations and `lib/events.ts` haven't
changed.

## Diagnose: last 7 days

```sql
select name, count(*) from page_events
 where created_at > now() - interval '7 days'
 group by name order by 2 desc;
```

## Weekly: by source, this week vs last

```sql
select coalesce(source, '(none)') as source, name,
       count(*) filter (where created_at > now() - interval '7 days') as this_week,
       count(*) filter (where created_at <= now() - interval '7 days'
                          and created_at > now() - interval '14 days') as last_week
  from page_events
 where created_at > now() - interval '14 days'
 group by 1, 2
 order by 1, 2;
```

## Which pages strangers land on

```sql
select path, coalesce(source, '(none)') as source, count(*)
  from page_events
 where name = 'page_view' and created_at > now() - interval '7 days'
 group by 1, 2 order by 3 desc limit 30;
```

## Signups by campaign

```sql
select coalesce(raw_user_meta_data->>'utm_source', '(untracked)') as source,
       raw_user_meta_data->>'utm_campaign' as campaign,
       count(*)
  from auth.users
 where created_at > now() - interval '30 days'
 group by 1, 2 order by 3 desc;
```

Attribution lives in the visitor's own browser session (`sessionStorage`),
so a visitor who comes back later from a bookmark counts as untracked. That
understates every channel a little.

## Community gate

```sql
select count(*) from posts where visibility = 'public';
```
