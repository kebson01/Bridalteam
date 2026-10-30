---
name: facebook-posting
description: Run the Bridal Team Facebook Page at about 50 posts a month. Plans and drafts a month of posts into the queue in marketing/facebook/queue/, publishes the one that's due through the Zapier Facebook Pages connector, records it as posted, and reports how the month went. Use whenever the user wants Facebook Page posts planned, written, queued, scheduled, published or reported on; says "plan next month's Facebook posts", "fill the Facebook queue", "post what's due", "what's going out this week", "how is the Facebook Page doing"; or a scheduled run asks to publish the next Facebook post. Facebook groups and Stories stay with couples-acquisition, since neither can be posted through the API.
---

# Bridal Team Facebook Page posting

Goal: the Bridal Team Facebook **Page** posts about 50 useful things a month,
so couples who follow it keep seeing Bridal Team, and some of them click
through to a guide, a free tool or the planner.

Three workflows:
1. **Plan the month**: draft ~50 posts into the queue, for the owner to approve.
2. **Post what's due**: publish one due post through Zapier. Usually run by a
   scheduled task twice a day, at 12:20 and 19:20 Eastern.
3. **Monthly report**: what went out and what it brought in.

## How the pieces fit

- **The queue** is `marketing/facebook/queue/`, one folder per post with a
  `post.json`. The format is in `marketing/facebook/queue/README.md`.
- **Approval is merging to `main`.** Plan the month on a branch and open a
  pull request. The owner reads it, edits or deletes posts, and merges. Only
  posts on `main` are ever published. Never publish from a branch.
- **`scripts/facebook-queue.mjs`** is the exact part: `check` validates the
  queue, `next` picks the one due post (with public image URLs), and `done`
  records it as posted and moves it to `marketing/facebook/posted/`.
- **Zapier** does the posting, with the Facebook Pages actions. The exact
  calls are in `references/zapier.md`.

## Ground rules (non-negotiable)

- **Only approved posts go out.** Publishing means posting exactly what's
  on `main` in `post.json`, unchanged. If a post looks wrong at posting time
  (a broken link, a date that's passed, a fact that no longer holds), skip it
  and report it. Don't fix it on the fly.
- **Only the Bridal Team Page.** Never post to a personal profile, a group
  or any other Page, even when Zapier offers one.
- **Facts come from the site.** Numbers, dates and advice are quoted from
  `lib/guides.ts`, `lib/blog.ts` and the tools' own code
  (`lib/plan-template.ts`, `lib/budget-template.ts`,
  `lib/seating-calculator.ts`). No invented statistics, user counts,
  testimonials, press or "couples love…".
- **Honest about who we are.** Bridal Team is new and small. Never pretend
  to be a couple, a guest or a vendor.
- **Images we own or may use.** Use the images in `marketing/`, or new ones
  made for Bridal Team. For photos from `lib/inspiration.ts`, follow each
  photo's license note; if there's no note allowing reuse, don't.
- **Not every post sells.** At least 1 in 5 posts has no link at all. A Page
  that only promotes itself gets ignored, and Facebook shows it to fewer
  people.

## 1. Plan the month

Do this in the last week of the month before, on a branch.

1. **Read what's there.** Run `node scripts/facebook-queue.mjs check` for
   what's still queued, look at `marketing/facebook/posted/` for the last
   two months, and read `COUPLES-TRACKER.md`. Don't repeat a post from the
   last 60 days, and keep anything already queued for the month.
2. **Lay out the slots.** About 50 slots: a midday post every day at 12:13
   ET, plus an evening post at 19:13 ET Monday to Friday. Drop slots to land
   on 50 (holidays first). The scheduled runs are at 12:20 and 19:20, just
   after each slot. Use the right offset: `-04:00` until the first Sunday of November,
   `-05:00` until the second Sunday of March.
3. **Fill the slots** with the mix in `references/content-mix.md`, following
   its spacing rules.
4. **Write each post** to the guide's or tool's own facts, in the Page's
   voice (`references/content-mix.md`, "Voice"). Tag every link (below).
5. **Save** each one as `marketing/facebook/queue/<YYYY-MM-DD>-<noon|eve>-<slug>/post.json`,
   with its `type` from the mix, and images alongside or referenced from
   elsewhere in `marketing/`.
6. **Check** with `node scripts/facebook-queue.mjs check`. It must pass.
7. **Log** one row per post in `COUPLES-TRACKER.md` under **Posts**, status
   `scheduled`, plus one line in the **Log**.
8. **Open a pull request** titled "Facebook posts for <Month YYYY>", listing
   the posts by week with their first lines, and ask the owner to review and
   merge it.

## 2. Post what's due

One post per run, so a missed day drains slowly instead of flooding the Page.

1. Get the latest `main`: `git checkout main && git pull origin main`.
2. Run `node scripts/facebook-queue.mjs next`. If it prints `null`, nothing is
   due: stop, and don't report anything.
3. Publish it with Zapier, following `references/zapier.md`. That includes
   checking that the Page is Bridal Team and that the post isn't already up.
4. With the post id Zapier returns, run
   `node scripts/facebook-queue.mjs done <name> <post_id>`.
5. In `COUPLES-TRACKER.md`, change the post's row to `posted` and put the
   post URL in its link column.
6. Commit ("Record Facebook post <name>") and push to `main`.

If Zapier fails, don't run `done`. The post stays queued and the next run
tries again. Report the error and what fixes it (for example, reconnect
Facebook in Zapier). After the same post fails twice, stop retrying it and
tell the owner.

## 3. Monthly report

At the start of each month, for the month before:

- **Posted vs planned**, and any posts skipped or failed, with why.
- **Visits from Facebook:** ask the owner to run this in the Supabase SQL
  editor (you can't read the database yourself) and paste the result:

  ```sql
  select path, count(*) as visits
  from page_events
  where name = 'page_view' and source = 'facebook'
    and created_at >= '<YYYY-MM>-01' and created_at < '<next month>-01'
  group by path order by visits desc;
  ```

  `page_events` stores the source and the page, not the full UTM tags, so
  match each page back to the posts that linked to it that month. Signups
  keep their full UTM tags on the account (`lib/attribution.ts`).
- **What worked:** the 5 posts that brought the most visits, and which
  content types did best. Use that to shift next month's mix.
- **Reach,** if the owner shares Page insights from Meta Business Suite.

Keep it short and add a line to the tracker's **Log**.

## Tag every link

Every link in a post carries:

```
utm_source=facebook&utm_medium=social&utm_campaign=<YYYY-MM>&utm_content=<post-folder-name>
```

For example
`https://bridalteam.com/guides/wedding-guest-list?utm_source=facebook&utm_medium=social&utm_campaign=2026-11&utm_content=2026-11-05-noon-guest-list-tiers`.
The visit counts by `source` and page; a signup keeps the full tags, so it
names the exact post that brought it.

## What to report back

After planning: how many posts, the mix, the PR link, and what the owner
needs to do (review and merge). After posting: one line with the post's
link, or the failure and its fix. Say nothing on runs where nothing was due.
