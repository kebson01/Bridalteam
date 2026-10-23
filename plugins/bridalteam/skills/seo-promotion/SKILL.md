---
name: seo-promotion
description: Run SEO and promotion for Bridal Team (bridalteam.com), the AI wedding planner. Use whenever the user wants Bridal Team to rank better, get indexed, show up on major websites, directories, "best wedding planning app" roundups, AI-tool directories, social platforms or in AI search answers; wants backlinks, press mentions, listing submissions, pitch or profile copy; or asks for an SEO audit, a keyword plan, a promotion plan or a status check on where Bridal Team is listed. Trigger on phrases like "do the SEO", "promote Bridal Team", "get us listed", "where should we be listed", "why aren't we ranking", "write our Product Hunt launch", "pitch us to wedding blogs" — even if the word SEO never appears.
---

# Bridal Team SEO and promotion

Goal: more of the right strangers find Bridal Team, through search and through
the sites couples and vendors already use. Every channel leads to the thing
worth sending people to: the free AI planner at `/planner` (three real answers,
no account). The homepage comes second. Don't send traffic to `/vendors` or
`/community` while their flags are off (see below).

## Ground rules (non-negotiable)

These protect the domain this work is trying to build. Break one and you can
undo months of progress overnight.

- **Never fake anything.** No invented reviews, testimonials, user counts,
  "as seen in" logos, press quotes or founder stories. No sockpuppet or
  multiple accounts, and never answer your own question on a forum.
- **Never buy links, swap links or spam directories.** Google detects all
  three, and the penalty lands on bridalteam.com.
- **Read each community's rules first and follow them literally** (Reddit,
  Facebook groups, Product Hunt, Hacker News). Most ban self-promotion outside
  a designated thread, and a ban there is permanent.
- **Don't list Bridal Team as a wedding vendor** on vendor marketplaces (The
  Knot, WeddingWire, Zola vendors, Yelp's wedding categories). It isn't one,
  and those platforms are competitors. Getting a mention *in their editorial
  content* is fine.
- **The user publishes; you prepare.** Draft every profile, pitch, post and
  submission, but get the user's explicit OK on the final text before anything
  goes public, is sent, or is submitted under their name. That includes form
  submissions made through a browser tool.
- **Tell the truth about scale.** The product is new and the directory is
  nearly empty. Copy that says so ("brand new", "free", "built by a small
  team") is more believable and survives scrutiny. `VENDOR-OUTREACH.md` shows
  the tone.

## Know the current state before acting

Read these first (they're in the repo root and `lib/`). They're the source of
truth and already settle a lot of questions. Don't redo or contradict them
without saying why.

- `COUPLES-ACQUISITION.md`, Part 2 is the SEO strategy: what's done, what's
  missing (links and age), winnable targets, the vendor-backlink flywheel.
- `VENDOR-OUTREACH.md`: launch market (South Florida, one metro at a time),
  honesty rules, CAN-SPAM, email volume limits.
- `lib/site.ts`: `SITE_URL`, `SITE_NAME`, `SITE_DESCRIPTION`, `LAUNCH_METRO`,
  `pageMetadata()`.
- `lib/flags.ts`: `SHOW_COMMUNITY` and `SHOW_VENDOR_DIRECTORY`. While these
  are off, `/community` and `/vendors` aren't promoted or in the sitemap.
- `app/sitemap.ts`, `app/robots.ts`, `lib/structured-data.ts`: technical SEO.
- `lib/guides.ts` (20+ guides with `keywords` and `faqs`) and `lib/blog.ts`:
  the content that's live.
- `PROMOTION-TRACKER.md` at the repo root, if it exists: what has been
  submitted, where, when, and with what result. If it's missing, create it
  from `references/tracker-template.md` the first time you run.

## Workflow

Pick the mode that fits the request. "Do the SEO" with nothing more specific
means run **Status check**, then propose the top three next actions and do
whichever the user picks.

### 1. Status check (where do we stand?)

1. Read `PROMOTION-TRACKER.md`. Note anything pending for more than two weeks
   as needing a follow-up.
2. Search the web for `site:bridalteam.com` (indexed pages), `"bridalteam.com"`
   and `"Bridal Team" wedding planner` (mentions and links that aren't ours).
   Record what you find in the tracker.
3. Find out whether the user has Google Search Console and Bing Webmaster Tools
   numbers to share (impressions, clicks, top queries). You can't read those
   yourself. Ask for a screenshot or an export. Don't guess.
4. If they give database access or numbers, use the `page_events` queries in
   `COUPLES-ACQUISITION.md` to see which `source` values are bringing visitors.
5. Report in plain words: what's indexed, where we're listed, what's working,
   what's stuck, and the top three next actions.

### 2. Technical SEO audit (the code)

Work through `references/technical-audit.md` against the code. Fix real
problems in the code on the current branch, run `npm run typecheck`,
`npm test` and `npm run build` before committing, and keep each change small.
The foundation is already strong, so expect few findings. Don't churn working
code to look busy.

### 3. Get listed on major websites

Use `references/listing-targets.md`. It's grouped by channel, ordered by value
for a new domain, and says which targets fit and which don't. For each target:

1. Check the tracker. Skip anything already done.
2. Check the target's current submission rules on its own site. They change,
   and a stale rule is how a submission gets rejected.
3. Draft the full submission: name, tagline, short and long description,
   category, tags, screenshots needed, the URL with a `utm_source` tag (see
   below). Write it for that site's audience, not one blurb pasted everywhere.
4. Show it to the user. Once they approve, they submit it, or you do it
   through a browser tool if one is connected and they've said to.
5. Update the tracker: date, URL, status, any login or follow-up owner.

Work in small batches (3–5 targets at a time) so each one gets written well.

### 4. Press, roundups and backlinks

The highest-leverage links for a wedding site are editorial: "best wedding
planning apps" roundups, wedding blogs, and local press in the launch metro.

1. Search for current roundups ("best wedding planning apps 2026", "AI
   wedding planner", "free wedding planning tools") and list the articles that
   rank, who wrote them and whether they get updated.
2. Draft a short, specific pitch for each author: what's different (free AI
   planner, no account needed, team collaboration), one concrete example
   answer from the planner, a link. No mass mail. Each one is written by hand
   for one person.
3. For journalist-request services (Qwoted, Featured and similar), draft
   answers to wedding cost, etiquette and planning questions using the guides'
   material. The answer has to be useful on its own merits.
4. Remind the user of the vendor flywheel: every vendor who claims a listing
   gets asked to link to it from their own site (`COUPLES-ACQUISITION.md`).

### 5. Content and keywords

Only when the gap is real. `COUPLES-ACQUISITION.md` says it plainly: there's
more content than links, and another guide doesn't fix that. Good reasons to
touch content:

- Search Console shows a query we rank on page 2 for. Improve that page.
- A long-tail or local query ("wedding florists Fort Lauderdale", "who pays for
  the rehearsal dinner") has intent we can genuinely answer.
- A guide's `updated` date is old and the facts have moved (prices, trends).

New guides follow the existing shape in `lib/guides.ts` (substantive, FAQs,
`keywords`, internal links to `/planner`). Never write thin or near-duplicate
pages. Google's helpful-content system penalises them.

### 6. AI search visibility

Couples increasingly ask ChatGPT, Gemini, Copilot and Perplexity "what's the
best wedding planning app". Those answers draw on the web index (Bing in
particular) and on what other sites say. So the same work applies: be indexed
on Bing, be in the roundups, and have a clear, factual `/about` page that
states what Bridal Team is. Check what these assistants currently say about
Bridal Team with web searches and note it in the tracker. Don't make claims
about how any of them rank sources beyond that.

## Tag every link

Every URL you hand out carries a source so `lib/attribution.ts` and
`page_events` can attribute visitors:

```
https://bridalteam.com/planner?utm_source=producthunt&utm_medium=listing
https://bridalteam.com/planner?utm_source=pinterest&utm_medium=social
https://bridalteam.com/?utm_source=<site>&utm_medium=<listing|pr|social|forum>
```

Use the short lowercase site name as `utm_source`, and record it in the
tracker so results can be matched back later. Profile "website" fields on
directories can take a tagged URL too. Use the bare domain only where a site
strips or rejects query strings.

## Brand facts for copy

Pull exact wording from `lib/site.ts` (`SITE_NAME`, `SITE_TAGLINE`,
`SITE_DESCRIPTION`) and the four pillars in `README.md` so every listing says
the same thing. Prices and plan names come from `lib/tiers.ts`, never from
memory. If a site asks for something the repo can't answer (founding date,
founder bio, logo files, a mailing address, social handles), ask the user.
Don't invent it. Logos and brand images are in `public/brand/`.

## What to report back

End each session with a short summary: what you did, what's waiting on the
user (approvals, logins, numbers), and the tracker rows you changed. Keep it
short. The tracker holds the detail.
