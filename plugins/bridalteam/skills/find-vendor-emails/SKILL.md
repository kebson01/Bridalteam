---
name: find-vendor-emails
description: Find the published business contact email for Bridal Team's vendor prospects and fill the Email column in VENDOR-PROSPECTS.md. Use whenever the user wants to find, look up, gather, fill in or verify vendor emails or contact details; check vendors' websites, contact pages or Facebook pages for an email; or get vendors ready to email. Trigger on phrases like "find emails for the photographers", "fill in the missing emails", "search their websites for contact info", "get emails for the Orlando vendors" — even if the word email is only implied.
---

# Finding vendor emails

Goal: for each vendor in `VENDOR-PROSPECTS.md` with an empty **Email**
column, find the contact address **the business itself publishes**, record it
with where it came from, and leave the cell empty when there isn't one.

A correct empty cell beats a guessed address. A wrong or personal address
bounces, draws spam complaints, and damages bridalteam.com's sending
reputation, which the transactional mail (signups, password resets, invites)
depends on. That has happened before (M9 in `SECURITY-AUDIT-MAIN.md`).

## What counts as a usable email

Accept an address only when **all** of these hold:

1. **The business published it**, on one of:
   - its own website (contact page, footer, about page, booking page),
   - its own Facebook business Page or Instagram profile (the contact or
     "intro" details the business filled in),
   - its own listing on a directory it controls (Google Business Profile,
     The Knot or WeddingWire storefront, Yelp page).
2. **It's a business contact point**, such as `info@`, `hello@`,
   `bookings@`, `studio@`, or the business name at a free provider
   (`flowersbyana@gmail.com`). A named person's address is fine only when
   the business publishes it as *the* contact (a sole photographer's
   `jane@janephoto.com` on their contact page).
3. **It's current.** A source the search dates as several years old, or a
   domain that no longer resolves, means `verify`, not accept.

**Reject** and never record:

- Addresses from people-search and sales-data sites (ContactOut, Apollo,
  RocketReach, ZoomInfo, Hunter, Lusha, Snov, SignalHire and similar). They
  guess or harvest, and "email format" pages are guesses by definition.
- Any address you construct yourself (`info@<domain>` because the domain
  exists). Never guess.
- Personal-looking addresses that aren't published as the business contact,
  such as someone's own gmail or comcast address found in a review, forum or
  old flyer. If you see one, note `personal-looking email: do not mail` so
  nobody re-researches it.
- Addresses for a different business with a similar name. When a search
  can't tell two businesses apart, leave it empty and note why.

## How to search

This environment's network policy blocks direct access to vendor websites
and Facebook (both `curl` and WebFetch fail). Test one fetch at the start of a
session. If fetches work, read the vendor's own contact page directly, which
is the best source. If they don't:

- Use **WebSearch in `extended` mode**. It reads pages and quotes contact
  details with their source. Standard mode rarely returns emails.
- One vendor per query, specific: `"<Business name>" <city> contact email`.
  If the first result is thin, try `"<domain>" email` or
  `"<Business name>" facebook`.
- Run several vendors' searches in parallel in one turn. Batches of 10–15
  keep it manageable.
- For a whole metro, split the vendors across parallel subagents (about 35
  each) that write JSON results to the scratchpad, and merge them into
  `VENDOR-PROSPECTS.md` yourself afterwards. Web searches are capped at about
  200 per turn, **shared by every agent running at once**, so a round covers
  roughly 200 vendors. Have agents use one search per vendor and mark any
  vendor they couldn't reach `NOT SEARCHED` so the next round retries it
  instead of recording it as having no email.
- Read the result's attribution. Accept only addresses it attributes to an
  allowed source above. If it gives several, prefer the one on the business's
  own website.

Never log in to Facebook, Instagram or any site, never automate browsing of
them, and never run bulk scrapers against them. Meta's terms forbid automated
collection, and logged-in browsing would be under the user's account. Reading
what a search engine already shows from a public business Page is fine.

To fix the blocked fetches permanently, the user can allow the vendor domains
in the environment's network settings (Network access → Allowed domains).

## Recording results

In the vendor's row in its **category table** of `VENDOR-PROSPECTS.md` (never
the generated "Call these first" table):

- **Email** gets the address.
- **Outcome** gets a short source note, merged with any existing flag:
  `email: own site via search`, `email: own Facebook Page via search`,
  `email: Yelp listing, verify`.
- Nothing found: leave Email empty and note `no published email found
  <date>`, so the next session skips it unless asked to retry.
- Conflicts (two different addresses from allowed sources): record the one
  from the business's own site and note the other.
- Website looks dead (domain doesn't resolve in results, or results say the
  business closed): note `site may be down: verify` or `possibly closed:
  verify`.

Then update the email count in the "Read this before using it" section
("Almost no contact emails: N of 931").

## Keep the database in step

`VENDOR-PROSPECTS.md` is a record of what's in the database, so the file and
the listings shouldn't drift. After a batch, draft SQL for the user to review and run in the Supabase SQL
editor. Don't run it yourself. There are two email columns, and they do
different things (see
`supabase/migrations/20260920040000_claimable_vendor_listings.sql` and
`20261006210000_claim_listing_by_email.sql`):

- `vendor_profiles.email` is shown **publicly** on the vendor's listing.
  Filling it is the user's call. Ask before drafting it.
- `vendor_claims.contact_email` (unclaimed rows only) is where outreach goes,
  **and** it lets a confirmed account on that address claim the listing.
  That's right for the business's own inbox and wrong for anything less
  certain. Only draft it for addresses from the business's own site or
  Facebook Page, never for `verify` ones.

Re-read those migrations before drafting, in case the columns have changed.

## Using the emails

Finding an address doesn't make it OK to email it yet.

- **Cold commercial email goes through the automated campaign only**
  (`lib/outreach/`, see the `vendor-outreach` skill). The CAN-SPAM mailing
  address is `Bridal Team, 2139 N University Dr #2055, Coral Springs, FL 33071, United States`,
  set as `OUTREACH_MAILING_ADDRESS`. Never send cold email by hand.
- The campaign warms up at 20, then 35, then 50 a day, one metro at a time,
  with one follow-up, and treats every unsubscribe as permanent.

## Report back

After each batch, give a table: business, email found (or none), source,
confidence. Then totals (searched, found, none, rejected and why), the rows
changed in `VENDOR-PROSPECTS.md`, and any SQL waiting for the user. List the
sources the search results cited.
