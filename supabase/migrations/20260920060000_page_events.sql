-- First-party funnel counts.
--
-- Nine days live, one signup, one AI chat turn -- and no way to tell whether
-- that is nobody arriving or everybody bouncing. Those need completely
-- different fixes, so guessing between them is the expensive mistake.
--
-- ── Why not Google Analytics ────────────────────────────────────────────────
-- The published privacy page says, in bold, that the site runs "no third-party
-- advertising or analytics trackers, so there is no consent banner to
-- dismiss". That is true today, it is a small competitive asset, and a script
-- tag would silently make it false. lib/attribution.ts already made this call
-- once for ad attribution; this follows it.
--
-- ── Why this is not "tracking" ──────────────────────────────────────────────
-- There is deliberately NO identifier of any kind in this table. No IP, no
-- user id, no session id, no cookie, no fingerprint -- so two rows cannot be
-- linked to the same person, and a "journey" cannot be reconstructed even by
-- us with full database access. What it supports is counting: how many landed
-- on this guide, how many reached the demo wall, how many finished signup.
-- That is the whole question, and it is answerable without following anybody.
--
-- The cost of that choice, stated plainly: no per-person conversion rate and
-- no deduplication, so `page_view` counts views and not visitors. A single
-- reader refreshing five times is five rows. Ratios between funnel stages stay
-- meaningful, absolute "visitor" numbers do not -- do not quote these as
-- unique visitors, because they are not.
--
-- An IP *is* used to rate-limit the write endpoint, in memory, for seconds. It
-- is never stored here.

create table if not exists public.page_events (
  id bigint generated always as identity primary key,
  -- Allowlisted in lib/events.ts; the API route rejects anything else, so this
  -- column cannot become a junk drawer.
  name text not null,
  -- Path only, query string stripped. Query strings carry UTM values and
  -- whatever else a referrer appended, and the useful part of that is already
  -- captured as `source`.
  path text,
  -- utm_source, or the referring host when there is no UTM. Never the full
  -- referring URL -- that records a browsing trail, which is the thing being
  -- avoided.
  source text,
  created_at timestamptz not null default now()
);

-- Every read is "events of this kind, over this window", and the table only
-- ever grows.
create index if not exists page_events_name_created_idx
  on public.page_events (name, created_at desc);
create index if not exists page_events_created_idx
  on public.page_events (created_at desc);

-- RLS on, no policies: service role only, same posture as vendor_events,
-- ai_usage and admin_sessions. Visitors must not read or forge counts.
alter table public.page_events enable row level security;
revoke all on public.page_events from anon, authenticated;

comment on table public.page_events is
  'First-party aggregate funnel counts. Contains NO identifier -- no IP, user id, session id or cookie -- so rows cannot be linked to a person. Counts views, not visitors. Written only by /api/track with the service role.';

-- Reading it back. The funnel in one query:
--
--   select name, count(*)
--     from page_events
--    where created_at > now() - interval '7 days'
--    group by name order by 2 desc;
--
-- Which pages people actually land on:
--
--   select path, count(*)
--     from page_events
--    where name = 'page_view' and created_at > now() - interval '7 days'
--    group by path order by 2 desc limit 30;
--
-- Whether a campaign did anything:
--
--   select source, count(*) filter (where name = 'page_view')   as views,
--          count(*) filter (where name = 'signup_success')      as signups
--     from page_events
--    where created_at > now() - interval '30 days'
--    group by source order by views desc;
