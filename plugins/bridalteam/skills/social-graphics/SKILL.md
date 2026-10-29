---
name: social-graphics
description: Make and ship Bridal Team's social graphics, meaning Pinterest pins and Facebook Page stories, from the site's own guides and free tools. Covers picking what to post, designing on-brand images (photo or text layouts), rendering and checking them, writing the pin notes, scheduling through PinBridge, and logging everything in COUPLES-TRACKER.md. Use whenever the user asks to draft, design, make, schedule or post pins or a story; asks for "the next batch of Pinterest pins"; wants pictures or photos on the pins; or asks whether scheduled pins went out. Trigger on phrases like "make some pins", "draft the next batch", "schedule the pins one a day", "Facebook story for the tools", "add pictures to the pins". Which channels to use and why belongs to couples-acquisition; this skill is how the graphics get made and shipped.
---

# Bridal Team social graphics

Each batch of graphics drives couples to one page on bridalteam.com and can be
traced back in `page_events`. The `couples-acquisition` skill decides which
channels are worth it. This skill makes the posts, to the same standard every
time, and ships them.

## Rules that never bend

- **Every fact comes from the page the post links to.** Get it from:
  - `lib/guides.ts` for guides;
  - `lib/plan-template.ts`, `lib/budget-template.ts` or
    `lib/seating-calculator.ts` for the tools;
  - the page itself for anything else.

  Quote or condense; don't invent numbers, times, statistics, testimonials or
  user counts. If a guide gives durations but no clock times, the pin shows
  durations.
- **Keep the source's cautions.** Legal topics, such as officiants and marriage
  licenses, keep the guide's "rules vary by location".
- **Label made-up examples** ("Example site", "Example invitation"). Example
  couples are Alex & Jordan, with no real names.
- **Photos must be licensed for commercial use** and recorded in the batch
  notes. See `references/photos.md`. Never use AI-generated images presented
  as real weddings, never scrape photos, and never use a vendor's photos
  without their written permission.
- **AI-generated images** (outfits, centerpieces, tablescapes) are allowed
  only as clearly labeled concepts.
  - Put "Concept design" or "AI-generated idea" on the image, and say the same
    in the description.
  - Turn on Pinterest's AI-content label when posting.
  - Draw on trends (colors, silhouettes, materials), never a copy of a
    specific designer's piece or a specific photo.
  - Never present one as a real wedding, a real product or a vendor's work.
  - It needs an image-generation API, which the user must choose and supply a
    key for (an environment secret, plus that host in the network allow-list).
    Until then, use licensed photos or `palette`.
- **Nothing is posted until the user asks.** Drafting, rendering and
  committing are fine. Scheduling, creating boards and posting need the
  user's go-ahead in this conversation.
- **Commits** go on the working branch. Open a PR only when the user asks.

## Workflow

### 1. Pick what to post

- **Avoid repeats.** Read `COUPLES-TRACKER.md` (the Posts table and the log)
  and the existing `marketing/pinterest/*.md` batches. Don't re-pin a page that
  already has a pin unless the angle is clearly new.
- **Look at real traffic:**

  ```sql
  select path, count(*) views, count(*) filter (where source='pinterest') from_pinterest
  from page_events where name='page_view' and created_at > now() - interval '30 days'
  group by path order by views desc limit 25
  ```

  (Supabase project `yubcwyfhgxjnqydhgjit`.) While the numbers are tiny, pick
  for Pinterest appeal: checklists, timelines, budgets, "questions to ask" and
  "X vs. Y" lists.
- **Batch size:** five pins per batch, one page each.

### 2. Design

- Read each source fully, then pick one strong, specific angle per pin. A
  headline that promises a list or an answer works better than a topic name.
- **Choose a layout:**
  - `photoFull`: a full-bleed photo with the headline over it. It's the most
    eye-catching, so use it for aspirational topics (venues, flowers,
    honeymoon) when a good licensed photo exists.
  - `photoTop`: a photo across the top with a short list below. It mixes
    beauty and usefulness.
  - **Text layouts** (`band` plus `rows`, `numbered`, `checks`, `questions`,
    `callout`): for data-heavy pins such as budgets, tables and timelines.
  - `palette`: an original color-palette pin, with swatches, hex codes, what
    each color is for, and flat illustrations (dress, bouquet, place setting)
    drawn in the palette. It needs no photo or license, because it's all drawn
    in code. Palettes are a design suggestion rather than a fact, so the
    sourcing rule doesn't apply. Link it to `/inspiration` or a related guide.
  - **Mix layouts** within a batch. Never use the same photo twice.
- **Boards:** current boards on `kebsaint`, with their ids:
  - Wedding Planning Checklists & Timelines, `610800836902987645`;
  - Wedding Budget Tips, `610800836902987646`;
  - Wedding Etiquette & Invitations, `610800836902987647`;
  - Free Wedding Planning Tools, `610800836902987648`;
  - Choosing Wedding Vendors, `610800836902989437`.

  Propose a new board only when none fits, and create it only with the user's
  OK.

### 3. Render and check

1. Run `npm run build` once if `.next/` is missing; the renderer takes its
   fonts from there.
2. Write the batch as a spec file in your scratch directory, modeled on
   `scripts/example-batch.js`. Leave a source comment above each pin.
3. Render:

   ```
   node plugins/bridalteam/skills/social-graphics/scripts/render.js \
     <scratch>/batch.js marketing/pinterest/<YYYY-MM-DD>-batch-<N> <scratch>/sheet.png
   ```

   The script needs Playwright with Chromium. Set `NODE_PATH=$(npm root -g)`
   if Playwright is installed globally, and `CHROMIUM_PATH` if the browser
   isn't Playwright's default. Name images `01-<slug>.png` and so on.
4. Fix every `FAIL`: a font that didn't load, content running into the
   footer, or a missing photo.
5. **Look at the contact sheet.** The script can't judge these, so you must:
   - Is text over a photo readable everywhere? Adjust `focus` or pick another
     photo.
   - Are there headline words alone on a line, or awkward wraps?
   - Are there big empty gaps? Spread the rows out.
   - Is light text sitting on light orange? Use dark text on the paler tiers.
6. Re-render until all of it passes.

### 4. Write the notes and log it

- Create `marketing/pinterest/<YYYY-MM-DD>-batch-<N>.md` from
  `references/pin-notes-template.md`. Give every pin its board, title (100
  characters at most), description (800 at most, condensed from the source),
  alt text, tagged link, image file and, for photos, the photo credit.
- **Links:** `https://bridalteam.com/<path>?utm_source=pinterest&utm_medium=social&utm_content=<slug>`.
  Each slug must be unique across all batches, so check the tracker.
- Add a log line to `COUPLES-TRACKER.md` ("Drafted Pinterest batch N…
  Waiting on the owner"). Commit, push, then show the user the images and a
  table of the pins.

### 5. Schedule (only when asked)

Follow `references/scheduling.md`: images on `main`, the right PinBridge
workspace, existing schedules, dry run, one pin a day, tracker rows and a
follow-up check.

## Facebook Page stories

Use the same rules and renderer with `format: "story"` (1080 × 1920):
- **Safe area:** text stays between 270 px from the top and 460 px from the
  bottom, where Facebook draws its own UI. The renderer checks this.
- **Frames:** six frames is a good length: a hook on orange, one frame per
  page, and a closing frame.
- **Link stickers:** every frame that links gets `h.tap()`, with open space
  below it for the sticker, and its own tagged URL
  (`utm_source=facebook&utm_medium=story&utm_content=<story>-<slug>`).
- **Notes:** write `marketing/facebook/<date>-story-<N>.md` with the frame
  table, sticker URLs and posting steps. Copy the structure of
  `2026-10-29-story-2.md`.
- **Posting:** the owner posts stories from the Bridal Team Page in the app.
  There is no tool for it, so log them as `drafted`.

## What to report back

Report:
- the images, plus a table of pin, board and what's on each;
- anything you couldn't verify or that needs the user: a new board, photo
  licensing, network access, or a PinBridge workspace mismatch;
- the files and tracker lines you changed;
- whether there's a PR (only if asked).
