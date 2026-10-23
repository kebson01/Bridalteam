# Couples tracker

Where Bridal Team has been posted, answered or shared for couples, and what
came of it. Kept by the `bridalteam:couples-acquisition` skill.

Statuses: `drafted` (waiting on approval), `posted`, `removed` (by mods: note
why), `skipped` (with reason).

## Communities

One row per community. Check the rule before every post.

| Community | Self-promo rule (quoted) | Rule checked | Last post | Notes |
|---|---|---|---|---|

## Posts

| Date | Where | What (one line) | Link to post | utm tags | Status | Visits after 7 days |
|---|---|---|---|---|---|---|

## Weekly numbers

| Week ending | page_view | planner_message | planner_limit | signup_success | Top source | Notes |
|---|---|---|---|---|---|---|
| 2026-10-23 | 46 | 0 | 0 | 0 | (none) | Baseline. 30 days: 261 views, 1 planner message, 1 signup (untracked). auth.users holds 2 accounts in all. Every source is `(none)`: untagged visits never record a referrer (see Log). |

## Log

- 2026-10-23: First diagnosis. The funnel is in the "nobody arrives" row: about 46 page views a week, and many are likely our own. Top pages over 30 days: `/` 63, `/vendors` 41, `/auth/signup` 24, `/pricing` 15, `/inspiration` 14, `/planner` 12, `/guides` 11. The most-viewed guide is `save-the-dates-vs-invitations` (7). 0 public community posts.
- 2026-10-23: Found a measurement gap. `lib/attribution.ts` records `referrer_host` only when a visit also carries UTM or click-id tags, so organic visits from Google, Reddit or Pinterest without tags show as `(none)`. The `page_events` migration says `source` should fall back to the referring host. Until that's fixed, "a stranger found us on their own" can't be seen in the data.
