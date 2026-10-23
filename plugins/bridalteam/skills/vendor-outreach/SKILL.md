---
name: vendor-outreach
description: Run founding-vendor outreach for Bridal Team's wedding vendor directory. Use whenever the user wants to recruit, contact, call, email, DM or follow up with wedding vendors (photographers, florists, DJs, venues, caterers and so on); plan a call list or outreach batch; prepare call scripts or claim-your-listing messages; record outreach outcomes; research and add new vendor prospects in a metro; answer a vendor's objection; ask vendors for backlinks; or check how many listings are claimed and published. Trigger on phrases like "vendor outreach", "who should I call today", "get vendors to claim their listings", "add vendors in Orlando", "write to this photographer", "how's the vendor side going" — even if the word outreach never appears.
---

# Bridal Team vendor outreach

Goal: turn the listings already in the directory into vendors who have claimed
them, and add new real vendors where a metro is thin. A claimed listing gives
the vendor a page they control. It gives Bridal Team an engaged vendor, often a
backlink, and a directory worth sending couples to.

## Know the current state first

The repo docs are the source of truth, but they were written at different
times. Read them in this order, and when they disagree, trust the newer one
and say so:

1. `VENDOR-PROSPECTS.md`: the newest. 931 researched Florida vendors across
   seven metros. 930 are live listings in the database, about 710 of them
   published. It holds the per-category tables with **Sent** and **Outcome**
   columns, the research flags, and the "Call these first" list.
2. `VENDOR-OUTREACH.md`: the pitch, the honesty rules, the templates,
   objections, the claim SQL and the tracking queries. It was written when the
   directory had **zero** listings, so its "the directory is almost empty"
   lines are out of date. Keep the honesty, update the facts (see below).
3. `README.md` also says `vendor_profiles` has no published rows. That's
   stale too.
4. `lib/tiers.ts`: plan names, prices and what each tier includes. Quote
   prices from here, never from memory or from the templates.
5. `lib/categories.ts` and `lib/areas.ts`: valid category names and the metros.

If the user can share current numbers from Supabase, run the tracking queries
in `VENDOR-OUTREACH.md` (listings by status, comped vendors) and use those
instead of the file's counts.

## Ground rules (non-negotiable)

- **No cold commercial email yet.** CAN-SPAM requires a physical mailing
  address in every commercial email, and the site has none: `TERMS.md` still
  has `[TODO: mailing address for legal notices]`, and the published
  `/terms` lists only email addresses. Until the user gives you a real
  address to put in messages, don't draft cold emails for sending. Phone calls
  and replies to vendors who asked to hear from us aren't blocked.
- **Only a business's own published contact details.** Never guess `info@` or
  `hello@` addresses. Never use a personal-looking address (the file flags
  these `do not mail`). Never scrape. This domain's sending reputation has
  been attacked before (M9 in `SECURITY-AUDIT-MAIN.md`), and transactional
  mail is the first thing that suffers.
- **Calls are made by hand by the user.** No autodialers, robocalls,
  prerecorded messages or cold text messages. Those carry TCPA and Florida
  Telephone Solicitation Act risk. Call business numbers during business
  hours.
- **A "no" is permanent.** Record it, never contact them again, and if they
  want the listing removed, the user deletes it that day (SQL in
  `VENDOR-OUTREACH.md`). "No reply" is different and gets one follow-up at
  most.
- **One follow-up, then stop.** 5–7 days after first contact. Never two.
- **Volume stays low and personal.** 20–30 contacts a day at most, one metro
  at a time, each message edited for that vendor.
- **Honest about reach.** Couples traffic is still small. Never promise leads,
  bookings or visitor numbers. Never invent stats, testimonials or "vendors
  like you" stories.
- **A phone number isn't a credential.** Never attach an email to a listing
  just because someone called from the listed number. Confirm on the call that
  they are the business. The confirmed email inbox is what authorises a claim.
- **The user sends and submits; you prepare.** Draft everything, get the
  user's OK on final text before anything is sent. `/admin/claims` and
  `/admin/venues` are password-gated admin pages the user operates. Database
  writes (SQL with the service role) are the user's to run.

## Updated pitch, for a directory that has listings

The three verifiable things from `VENDOR-OUTREACH.md` still hold. Say them in
terms of today's state:

1. **Your listing already exists.** Name, category, city, phone and website
   are on a public page (`/v/<id>`) that's in the sitemap. Claiming it lets
   them correct it, add photos and a description, and control it.
2. **Free, without a catch.** No card. Contact details stay ungated on Free.
3. **Founding-vendor perk.** Comped Pro is set per listing (`comp_plan` on
   `organizations`). Check the comp query before promising it to a specific
   vendor, and quote the current Pro price from `lib/tiers.ts`.

The honest line about reach changes from "the directory is empty" to
something like: "we have several hundred Florida vendors listed and we're
early on the couples side, so I can't promise you bookings."

## Workflows

### 1. Plan a call batch ("who should I call today?")

1. Ask which metro, or default to South Florida (the launch market,
   `LAUNCH_METRO` in `lib/site.ts`).
2. Follow the category order in `VENDOR-PROSPECTS.md` ("Order of attack"):
   photographers and florists first, venues and caterers last.
3. Pick 10–20 rows that have a phone, have no **Sent** date, and carry no
   `verify`, `do not mail` or `corporate` flag. A blank flag on the newest
   metros (Jacksonville, Southwest Florida, Panhandle, Space Coast) means "not
   checked", not "safe" (see the file's note).
4. For each, do a quick web search to confirm the business still trades, still
   does weddings and is in the metro. Drop or flag any that fail.
5. Give the user a table: business, category, city, phone, one specific thing
   about their work to open with, and anything to watch for. Then the call
   script from `references/call-script.md`.

### 2. After calls: record outcomes

Update the business's row in its **category table** in `VENDOR-PROSPECTS.md`
(never the generated "Call these first" table): **Sent** gets the date and
channel (`2026-10-23 call`), **Outcome** gets one of:

- `yes: email attached` (user attached it on `/admin/claims`)
- `yes: sent claim link`
- `call back <date>`
- `no reply` (one follow-up allowed)
- `no` (permanent, never contact again)
- `delete requested: deleted <date>`
- `wrong number`, `closed`, `no longer does weddings`

For each "yes", remind the user of the `/admin/claims` steps: search the
number, confirm the business, type the email the vendor read out, save. The
vendor then signs up with that same address and is offered the listing.

### 3. Messages to vendors

Start from the templates in `VENDOR-OUTREACH.md` and update the facts as
above. Write each message for one vendor, opening with something specific
about their work that a person who looked at it would say.

- **Email:** only to a verified business address. Cold email is blocked until
  there's a mailing address (see ground rules). A message to a vendor who said
  yes on a call and asked for their link is a reply, not cold outreach.
- **Instagram DM:** under 100 words, no link in the first message unless they
  asked.
- **Follow-up:** the one-time template in `VENDOR-OUTREACH.md`.
- **Objections:** use the honest answers in `VENDOR-OUTREACH.md`. Re-check any
  number or price they contain against `lib/tiers.ts` first.

### 4. Ask for the backlink

When a vendor has claimed their listing and is pleased with it, draft the
one-line ask to link to their Bridal Team page from their own site. When a link
goes live, record it in the vendor's Outcome cell and, if the `seo-promotion`
skill's `PROMOTION-TRACKER.md` exists, under "Mentions found" there too.

### 5. Research and add new vendors

Only for metros or categories that are thin. Follow
`references/new-listings.md`: research from public sources, check for
duplicates in `VENDOR-PROSPECTS.md`, draft the `create_claimable_listing` SQL
for the user to run, and add the rows to the file.

### 6. Progress report

Count Sent and Outcome values in `VENDOR-PROSPECTS.md` by metro and category.
If the user shares the Supabase query results, add listings by status and
claimed counts. Report the number that matters most: how many contacted
vendors went on to claim. If people say yes and don't claim, the problem is
the claim flow, not the pitch. Say so.

`VENDOR-OUTREACH.md` says to flip `NEXT_PUBLIC_SHOW_VENDOR_DIRECTORY` at about
50 published listings in one metro, and `COUPLES-ACQUISITION.md` says 5+ per
core category. Check those against the current numbers and tell the user if
the directory is ready to be promoted.

## What to report back

End each session briefly: what was prepared, what's waiting on the user
(calls to make, admin steps, SQL to run, approvals), and which rows in
`VENDOR-PROSPECTS.md` you changed.
