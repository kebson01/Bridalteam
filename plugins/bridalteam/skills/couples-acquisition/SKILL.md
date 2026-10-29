---
name: couples-acquisition
description: Get engaged couples to Bridal Team (bridalteam.com) through the places they already spend time, and measure what works. Use whenever the user wants more couples, visitors, planner users or signups; wants to post or answer on Reddit, Facebook groups, Pinterest, TikTok or Instagram; asks which channel is working, why nobody is signing up, or for a weekly growth report; wants Reddit answers, pins, group posts or video ideas drafted; or asks whether to run paid ads or turn the Community tab back on. Trigger on phrases like "get more couples", "find brides", "post on Reddit", "make some pins", "is anyone using the planner", "how are signups doing" — even if the word acquisition never appears. SEO and listings belong to the seo-promotion skill; vendors to vendor-outreach.
---

# Bridal Team couples acquisition

Goal: strangers who are planning a wedding find Bridal Team, try the AI
planner, and some of them sign up. This skill is Part 1 of
`COUPLES-ACQUISITION.md` (distribution). Part 2 (SEO) belongs to the
`seo-promotion` skill. Read `COUPLES-ACQUISITION.md` first. It's the strategy,
and this skill is how to carry it out.

## What to send people to

**The AI planner at `/planner`.** It's free, gives three real answers, and
needs no account or card. It's the one thing on the site that's immediately
useful to a stranger, and the kind of link people forward. Every channel
leads there, not to the homepage.

Don't send couples to `/community` or `/vendors` while `SHOW_COMMUNITY` or
`SHOW_VENDOR_DIRECTORY` (`lib/flags.ts`) is off. An empty page on a first
visit is the clearest "leave now" signal a new site can send.

## Ground rules (non-negotiable)

Breaking one of these can close a channel permanently. Reddit and Facebook
bans don't come back.

- **Read each community's rules before drafting, and follow them literally.**
  Most wedding subreddits ban self-promotion outside a weekly thread, and most
  Facebook groups have a promo day. Quote the relevant rule in the tracker.
- **No fakes.** No sock-puppet or multiple accounts. No invented stories ("my
  fiancé built this", "a friend recommended"). Never ask a question in order to
  answer it yourself. No fake reviews, upvotes or engagement.
- **No spam.** Never post the same link in many places. Each post is written
  for one community and one question.
- **Answers must stand on their own.** On Reddit and Quora the answer should
  be genuinely useful with no link at all. Add a link only where the rules
  allow it, or where someone asks what you used, and say plainly that you
  built it.
- **The user posts. You prepare.** You can't log in to Reddit, Facebook,
  Pinterest, TikTok or Instagram, and you mustn't post under the user's name
  without their OK. Draft everything and get approval on the final text. If a
  browser tool is connected, filling in a post for the user to review is fine,
  but they press publish.
- **Honest about scale.** Bridal Team is new. Never claim user numbers,
  testimonials or press you don't have.

## Workflows

"Get more couples" with nothing more specific means **Diagnose**, then
propose this week's top three actions and do the one the user picks.

### 1. Diagnose: find which problem you have

The three problems look the same from outside ("no signups") and need
opposite fixes. Ask the user to run the queries in `references/queries.md` in
the Supabase SQL editor and paste the results. You can't read the database
yourself. Then:

| What the numbers show | The problem | The work |
|---|---|---|
| `page_view` near zero | Nobody arrives | Distribution: the channels below |
| `page_view` healthy, `planner_message` low | The landing page doesn't convince | Look at `/planner` and the homepage, and propose changes |
| Many reach `planner_limit`, few `signup_success` | The sign-up wall | Look at what the limit screen says and asks for |

Say which row you're in before proposing anything. Fixing distribution when
the problem is the landing page wastes the traffic you earn.

### 2. Distribution: one channel at a time

Follow `references/channels.md` for the channel's playbook. For every piece:

1. Check `COUPLES-TRACKER.md` (create it from `references/tracker-template.md`
   the first time). Don't post where you posted in the last two weeks.
2. Check the community's current rules on its own page. Record the rule.
3. Draft the piece for that community: its tone, its question, its format.
4. Tag any link (see below).
5. Show it to the user. They post it.
6. Log it in the tracker: date, where, what, link to the post, the rule.

Small batches: 3–5 pieces a week done well beat 20 done badly. Reddit
answers can be more frequent, since they're answers, not promotion.

### 3. Content to draw from

You have more material than most sites this age:

- The guides in `lib/guides.ts` (20 as of October 2026: budgets, timelines,
  vendor booking order, etiquette), each with `faqs` and `keywords`.
- The posts in `lib/blog.ts`.
- Inspiration boards in `app/inspiration/` and `lib/inspiration.ts`. Check
  each photo's license note there before reusing images off-site.
- The planner itself: a real question and its real answer is the best demo.

Rewrite for each platform. Never paste a guide wholesale. Quote facts and
numbers only as the guide states them.

### 4. Weekly report

Ask for the queries in `references/queries.md` (weekly section) and report:

- Visits, planner messages, limit hits and signups, by `source`, this week vs
  last.
- Which channels in the tracker produced visits. A post with no matching
  `source` traffic after a week didn't work.
- **The number that means it's working:** `page_view` on `/guides/*` or
  `/planner` from a source you didn't post to. That's a stranger finding you
  on their own.
- The next three actions.

Keep it short. Detail lives in the tracker.

### 5. Decisions the numbers gate

- **Paid ads:** not until there are a few hundred `page_view` rows and a
  known planner-to-signup rate (`COUPLES-ACQUISITION.md`, "Not yet: paid
  ads"). Before that, the first ad spend buys a number nobody can interpret.
  When the user asks about ads, check the numbers and say whether the gate is
  met. Don't set up ads yourself.
- **Community tab:** recommend flipping `NEXT_PUBLIC_SHOW_COMMUNITY=true` at
  about 30 real public posts. Check with
  `select count(*) from posts where visibility = 'public';`. It's a build-time
  flag, so it needs a redeploy.
- **Vendor directory:** that call belongs to `vendor-outreach` (5+ published
  vendors per core category in a metro).

## Tag every link

`lib/attribution.ts` reads UTM parameters from the landing URL, carries them
through to signup, and stores them on the new account. `page_events.source`
records `utm_source` (or the referring host). So every link you hand out
carries one:

```
https://bridalteam.com/planner?utm_source=reddit&utm_medium=social&utm_campaign=<subreddit>
https://bridalteam.com/planner?utm_source=pinterest&utm_medium=social&utm_content=<pin-slug>
https://bridalteam.com/guides/<slug>?utm_source=facebook&utm_medium=group&utm_campaign=<group>
```

Lowercase, short, no personal data. Record the exact tags in the tracker so
results match back. Where a platform strips query strings, note that its
visits will show the referring host as `source` instead.

## Making the graphics

To design, render, schedule or log Pinterest pins and Facebook stories, use
the `social-graphics` skill. It holds the renderer, the photo rules and the
PinBridge scheduling steps.

## What to report back

End each session with what you drafted, what's waiting on the user (posts to
publish, queries to run, rules to confirm), and the tracker rows you changed.
