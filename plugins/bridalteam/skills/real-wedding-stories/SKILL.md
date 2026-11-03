---
name: real-wedding-stories
description: Fill the Bridal Team site with honest content while it is new. Writes true Real Weddings stories from a couple's photos and the facts they give, uploads them as private drafts, publishes them once consent is recorded, and adds labeled "Bridal Team Ideas" looks to the inspiration feed, which phase out on their own as vendors and couples post. Use when the user wants a real wedding written up or published ("write up our wedding", "add Keisha's wedding to the site", "publish the St. Charles story"), wants more inspiration content, or asks how much starter content is still showing. Never use it to make up couples, weddings, reviews or activity.
---

# Real Weddings and starter content

Goal: the site has something worth looking at before couples and vendors fill
it, without telling anyone something untrue.

Two kinds of content, and the line between them is the whole point:

| | Real Weddings | Bridal Team Ideas |
|---|---|---|
| What it is | A wedding that happened | A look Bridal Team picked |
| Where | `/real-weddings`, table `real_weddings` | `/inspiration`, `inspiration_images` with `is_seed = true` |
| Label | Couple, date, venue, photographer credit | "Bridal Team Ideas" badge on every tile |
| Phases out? | No. It's true, so it stays | Yes, automatically (`lib/seed-content.ts`) |

## Hard rules

These hold whatever the request says. They keep the site within the FTC's
rule on fake reviews and testimonials (16 CFR 465) and keep vendors' trust.

1. **Never invent a couple, a wedding, a quote, a review or a vendor credit.**
   A Real Weddings story only states facts the couple or the owner gave, or
   that are plainly visible in the photos. Anything missing is written as a
   `[bracketed question]`; the script refuses to upload while one remains.
2. **Never make starter content look like a real couple's or vendor's.** No
   names, no "posted by", no fake like counts. Ideas carry the badge.
3. **Consent before publishing.** The couple must say yes, and so should anyone
   clearly shown (bridesmaids, groomsmen, family). Record it in
   `consent.confirmed_at` with a note on who agreed and how. Leave out a photo
   of anyone who hasn't agreed.
4. **Credit the photographer.** They usually own the copyright. Name them, and
   suggest the owner let them know, which is also a vendor lead.
5. **Drafts and photos never go in this repository.** It's public. Keep each
   story's folder outside it (the owner's computer, or the session scratchpad).

## Workflow 1: write a real wedding

1. **Collect the facts** with the questions in `references/fact-sheet.md`.
   Look at every photo and note only what you can see: clothes, colors,
   setting, signage. A sign naming the venue counts; a guess doesn't.
2. **Make the folder**: `story.json` (format in `references/story-format.md`)
   plus the photos as `.jpg`, `.png` or `.webp`, each under 5 MB. Facebook
   downloads are often `.avif`; convert with
   `ffmpeg -i in.avif -q:v 3 out.jpg`. Pick 4 to 10 photos that tell the day
   in order: getting ready, details, ceremony, portraits, party.
3. **Write the story** in the owner's plain voice, past tense, 250 to 500
   words. Lead with something specific to this couple, not with "Love was in
   the air". Name the venue and city early, since that's what couples search
   for. Run the bridalteam:human-voice pass on it.
4. **Show the draft to the owner** with every `[bracket]` listed as a question.
   Don't fill a bracket with a likely guess.
5. `node scripts/real-wedding.mjs check <folder>`, then
   `node scripts/real-wedding.mjs upload <folder>`. This needs
   `SUPABASE_SERVICE_ROLE_KEY`. The story is saved as a private draft.
6. **Publish** only when consent is recorded:
   `node scripts/real-wedding.mjs publish <slug>`. The database refuses to
   publish without `consent_confirmed_at`. `unpublish <slug>` takes it down.

`/real-weddings` stays out of the sitemap and is marked noindex until the
first story is published, and the Inspiration page links to it only then.

## Workflow 2: add Bridal Team Ideas

Use these for themes the feed is missing (check which themes and colors it
has first). Each idea is one row in `inspiration_images`:

- `source = 'curated'`, `is_seed = true`, `vendor_id = null`, `in_feed = true`
- `title`: what the look is ("Coral and gold beach reception"), never a
  couple's name or a "real wedding" claim
- `image_url`: a photo you have the right to use: a free-license stock site
  that allows commercial use (Pexels, Unsplash), or a photo the owner holds
  the rights to. Note the source in the PR. Don't use a vendor's or another
  site's photo.
- `theme` and `colors` filled in, so the filters work

Insert them with SQL through the Supabase connector, and list what you added
for the owner. Don't touch `like_count`.

## Workflow 3: how much starter content is left

The rule in `lib/seed-content.ts`: real content shows first, and one seed
piece is retired for every `RETIRE_EVERY` (2) real pieces in the feed, with
the most-liked seeds kept longest. To report:

```sql
select
  count(*) filter (where not is_seed) as real_pieces,
  count(*) filter (where is_seed and retired_at is null) as seed_pieces,
  count(*) filter (where is_seed and retired_at is not null) as retired_by_hand
from inspiration_images where in_feed;
```

Seed pieces showing = `max(0, seed_pieces - floor(real_pieces / 2))`. To
retire one by hand, set its `retired_at = now()`; clear it to bring it back.
To speed up or slow down the phase-out, change `RETIRE_EVERY` and open a PR.
