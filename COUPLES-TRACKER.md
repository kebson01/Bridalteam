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
| 2026-10-24 | Pinterest: Wedding Etiquette & Invitations | Save-the-dates vs. invitations | https://www.pinterest.com/pin/610800768261639220/ | utm_source=pinterest, utm_content=save-the-dates | posted | |
| 2026-10-24 | Pinterest: Wedding Planning Checklists & Timelines | Month-by-month planning checklist | https://www.pinterest.com/pin/610800768261639222/ | utm_source=pinterest, utm_content=checklist | posted | |
| 2026-10-24 | Pinterest: Wedding Budget Tips | Budget breakdown by category | https://www.pinterest.com/pin/610800768261639223/ | utm_source=pinterest, utm_content=budget-breakdown | posted | |
| 2026-10-24 | Pinterest: Wedding Budget Tips | Who pays for the wedding | https://www.pinterest.com/pin/610800768261639224/ | utm_source=pinterest, utm_content=who-pays | posted | |
| 2026-10-24 | Pinterest: Free Wedding Planning Tools | Free AI wedding planner | https://www.pinterest.com/pin/610800768261639225/ | utm_source=pinterest, utm_content=ai-planner | posted | |
| 2026-10-24 | Facebook Page story | "4 things to know before you plan", 6 frames, link sticker to /planner | | utm_source=facebook, utm_medium=story, utm_content=story-1 | drafted | |

## Weekly numbers

| Week ending | page_view | planner_message | planner_limit | signup_success | Top source | Notes |
|---|---|---|---|---|---|---|
| 2026-10-23 | 46 | 0 | 0 | 0 | (none) | Baseline. 30 days: 261 views, 1 planner message, 1 signup (untracked). auth.users holds 2 accounts in all. Every source is `(none)`: untagged visits never record a referrer (see Log). |

## Log

- 2026-10-23: First diagnosis. The funnel is in the "nobody arrives" row: about 46 page views a week, and many are likely our own. Top pages over 30 days: `/` 63, `/vendors` 41, `/auth/signup` 24, `/pricing` 15, `/inspiration` 14, `/planner` 12, `/guides` 11. The most-viewed guide is `save-the-dates-vs-invitations` (7). 0 public community posts.
- 2026-10-23: Found a measurement gap. `lib/attribution.ts` records `referrer_host` only when a visit also carries UTM or click-id tags, so organic visits from Google, Reddit or Pinterest without tags show as `(none)`. The `page_events` migration says `source` should fall back to the referring host. Until that's fixed, "a stranger found us on their own" can't be seen in the data.
- 2026-10-23: Fixed the gap on this branch: untagged visits now record the referring site's domain (e.g. `google.com`) as `source` in `page_events`, held per session in `bt_referrer`. Signup attribution is unchanged. Organic traffic shows up by source from the deploy onward. Earlier rows stay `(none)`.
- 2026-10-23: Drafted Pinterest batch 1 (5 pins) in `marketing/pinterest/2026-10-23-batch-1.md`. Waiting on the owner to review and post.
- 2026-10-24: Rendered the 5 pin images (1000 × 1500 PNG, Jost and Raleway, brand colors) into `marketing/pinterest/2026-10-23-batch-1/`.
- 2026-10-24: Found while making pin 5: the planner's demo-mode reply (used when `ANTHROPIC_API_KEY` is unset) misread "We have $20k and 100 guests. Where should the money go?" as about 20 guests and a $5,000 budget. If production ever falls back to demo mode, visitors would see this. Worth a fix in the demo reply logic.
- 2026-10-24: Drafted Facebook Page story 1 (6 frames, 1080 × 1920) in `marketing/facebook/2026-10-24-story-1/`, built from the Pinterest batch 1 content. Waiting on the owner to post.
- 2026-10-24: Published Pinterest batch 1 through PinBridge on the `kebsaint` account. Created 4 public boards (Wedding Planning Checklists & Timelines, Wedding Budget Tips, Wedding Etiquette & Invitations, Free Wedding Planning Tools) and posted all 5 pins. Images are served from raw.githubusercontent.com at commit b37619c. Check visits from `source = 'pinterest'` on 2026-10-31.
- 2026-10-29: Drafted Pinterest batch 2 (5 pins, one per free tool page) in `marketing/pinterest/2026-10-29-batch-2.md`, with images in `2026-10-29-batch-2/`. Every number on the pins comes from the tool's own code. Waiting on the owner to review and post.
