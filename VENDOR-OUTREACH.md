# Getting the first vendors on Bridal Team

The directory has **zero published listings**. Everything below is written for
that specific problem — the cold start — and should be thrown away once there
are fifty listings and couples arriving on their own.

## The one thing to be honest about

A vendor's first question is *"how many brides will see this?"* Today the
answer is "almost none, and I'm not going to pretend otherwise." Every template
here says that out loud, early, in the vendor's own reading order. That is not
modesty — it is the only thing that makes the rest of the message believable,
and `/for-vendors` already takes the same line ("The directory is brand new").

So the pitch cannot be leads. It is three things a vendor can verify in five
minutes:

1. **A page they control that Google can find.** Once a listing has a
   description or a photo it's in the sitemap (`app/sitemap.ts`), `/v/[id]`
   sets real per-vendor metadata, and `robots.ts` allows it. An untouched
   imported listing is kept out of Google until then (`lib/vendor-content.ts`),
   which makes "claim it and fill it in" the step that gets them indexed. For a small vendor with a thin web presence, one more
   indexed page with their name, photos and a link is worth something on its
   own, whatever the directory's traffic is.
2. **Free, and free without a catch.** No card, no trial clock. Free shows
   their name, category, location, description, five photos, and — this is the
   part people assume is paywalled — **their email and phone, ungated**
   (`app/v/[id]/page.tsx`). A couple who finds them can always make contact.
3. **Founding-vendor Pro, comped.** `comp_plan` (see
   `supabase/migrations/20260920030000_founding_vendor_comp.sql`) grants Pro
   without payment: the outbound link to their own site, the inquiry inbox,
   stats, and unlimited photos. Decide a term — a year is clean — and say so.

## Who to approach first

Not venues. They are the highest-value listing and the slowest to say yes:
multiple decision-makers, an existing marketing contract, and no urgency. Start
where the answer is one person's to give and the web presence is weakest:

| Priority | Category | Why they say yes |
|---|---|---|
| 1 | Photographers, videographers | Visual portfolio, actively chase backlinks and SEO, usually a sole operator |
| 2 | Florists, cake and dessert | Same, plus the photos already exist and look good in a gallery |
| 3 | DJs, bands, officiants | Thin or no website at all — an indexed page is a genuine upgrade |
| 4 | Hair and makeup, planners | Instagram-first, often no site to speak of |
| 5 | Venues, caterers | Worth having, but go last, once you can point at real listings |

Work **one metro area at a time**, and say which one in the message. A directory
with twenty vendors in one city is useful to a couple there; two hundred
scattered nationally is useful to nobody. Given the Florida footprint in the
legal pages, South Florida is the obvious first market.

Source names from public listings — Google Maps by category and city,
Instagram location and hashtag search, local wedding-show exhibitor lists. Use
the business's **own published contact address**, never a scraped personal one.

## Volume, and staying on the right side of the law

Keep it low and personal: **20–30 a day, hand-written, one market at a time.**
That is not a moral flourish, it is self-interest. This domain already had its
sending reputation put at risk once — M9 in `SECURITY-AUDIT-MAIN.md`, where an
attacker pushed 28 password-reset emails to harvested addresses in a day — and
the confirmation emails real customers need are the first thing to land in spam
when reputation goes. A cold blast from the same domain would finish the job.

For commercial email in the US, CAN-SPAM applies whether or not it feels like
marketing: accurate `From` and subject, a physical mailing address in the
message, and a working opt-out that you honour. The mailing address is
Bridal Team, 2139 N University Dr #2055, Coral Springs, FL 33071, United States (a virtual mailbox registered to Bridal Team). It is
in `TERMS.md` and `PRIVACY.md` and must appear in every email. If the volume ever grows past
hand-sending, send from a **subdomain**, never the root domain that carries
transactional mail.

---

# Templates

Edit every one of these before sending. A template that arrives unedited reads
like a template.

## 1. Cold email — the default

> **Subject:** Your listing on Bridal Team (free, and we're new)
>
> Hi [name],
>
> I'm building Bridal Team, a wedding planning site for couples in
> [metro area]. I found [business] through [where — be specific: "your work at
> the Vizcaya wedding on Instagram"] and I'd like to list you.
>
> Being straight with you: we launched recently and the directory is almost
> empty, so I can't promise you bookings. What I can promise is a page you
> control — your photos, your description, your contact details, linked from
> our site and submitted to Google — and it costs nothing.
>
> Because you'd be one of the first, I'll also comp the Pro plan for a year
> ($29/mo, free for you): a direct link to your website, a message inbox from
> couples, and unlimited photos.
>
> Takes about five minutes: [link]
>
> If it's not useful, no hard feelings — just tell me and I won't follow up.
>
> [your name]
> Bridal Team, 2139 N University Dr #2055, Coral Springs, FL 33071, United States
> [unsubscribe link]

Why it works: the bad news is in paragraph three, before the ask. The offer is
specific and verifiable. The out is explicit, which is also your opt-out.

## 2. Instagram DM — shorter, no subject

> Hi [name] — the [specific piece of work] you posted in [month] is beautiful.
>
> I run Bridal Team, a wedding planning site for [metro area] couples. We're
> new and the vendor directory is nearly empty, so I'm not going to promise you
> leads — but I'd like to give you a free listing: your photos, your contact
> info, a page Google can index. Free Pro for a year since you'd be one of the
> first.
>
> Want me to set it up? [link]

Keep it under 100 words. Lead with something only a human who looked at their
work could say.

## 3. Claim-your-listing variant — the best one

Far better conversion than asking someone to fill in a form for a site they've
never heard of, because the work is already done:

> **Subject:** I made you a page on Bridal Team — want it?
>
> Hi [name],
>
> I put together a listing for [business] on Bridal Team, a wedding planning
> site for [metro area] couples: [claim link]
>
> It's not live yet — it's yours to claim, edit or delete. I pulled the details
> from your website, so fix anything I got wrong.
>
> Honest context: we're new and the directory is nearly empty, so this isn't a
> lead-generation pitch. It's a free page you control, linked from us and
> submitted to Google, plus Pro comped for a year since you'd be one of the
> first.
>
> If you'd rather I delete it, reply "delete" and it's gone today.
>
> [your name]
> Bridal Team, 2139 N University Dr #2055, Coral Springs, FL 33071, United States

The "reply delete and it's gone" line is doing real work: it removes the fear
that someone has published something about their business without asking. Mean
it, and act on it the same day.

### Creating the listing and its link

Run this in the Supabase SQL editor (service role — the function is revoked
from every other role, because it mints a credential):

```sql
select * from create_claimable_listing(
  p_business_name := 'Marisol Reyes Photography',
  p_category      := 'Photography',
  p_city          := 'Fort Lauderdale',
  p_region        := 'FL',
  p_website       := 'https://example.com',
  p_email         := 'hello@example.com',
  p_description   := 'Documentary wedding photography across South Florida.',
  p_contact_email := 'hello@example.com',
  p_note          := 'Founding vendor outreach, Sept 2026',
  p_comp_plan     := 'pro',
  p_comp_months   := 12
);
```

It returns `org_id` and `token`. The claim link is
`https://bridalteam.com/claim/<token>`.

**Copy the token immediately — it is shown once and never again.** Only its
SHA-256 is stored, the same way admin session cookies are handled, so a
database read cannot reconstruct a working link. If you lose one, delete the
claim row and create a fresh listing.

The listing is created as a **draft** with the comp already attached, so the
vendor sees Pro the moment they claim it and nothing is public until they
choose to publish. Claim links expire after 60 days.

To honour a "please delete it" reply:

```sql
delete from organizations where id = '<org uuid>';  -- cascades to profile and claim
```

## 4. Follow-up — once, after 5–7 days

> Hi [name] — just closing the loop on the Bridal Team listing. Still happy to
> set it up, still free, and still fine if the answer is no. Either way I won't
> chase you again.

One follow-up. Then stop, permanently. Two is where goodwill turns into spam
complaints.

---

# Automated email campaign

Emails every listing that has a business contact address (705 at launch), one
metro and one category tier at a time, with one follow-up a week later. No
calls, no hand-written batches. Code: `lib/outreach/`; daily trigger:
`.github/workflows/vendor-outreach.yml`; tables: `vendor_outreach`,
`outreach_suppressions`, `outreach_events`
(`supabase/migrations/20261101090000_vendor_outreach.sql`).

## What it does each weekday (about 10:15 Eastern)

1. Stops if the last batches drew too many bounces (over 5%) or 2+ spam
   complaints, and emails `OUTREACH_ALERT_TO`. Nothing sends until it is resumed.
2. Marks any listing claimed since yesterday so it gets no follow-up.
3. Sends the follow-ups that are 7+ days old, then first emails, within the
   warm-up limit: 20 a day for the first 5 sending days, 35 for the next 5,
   then 50. South Florida first, photographers and videographers, then
   florists and cakes, then music and officiants, then beauty and planners,
   other categories, and venues and caterers last.
4. Before each first email: skips the address if its domain takes no mail,
   makes the listing's claim link work for 60 days from today, and (if
   `OUTREACH_OFFER_PRO=true`) grants a year of Pro.

Every message has the sender, the reason they got it, the mailing address and
an unsubscribe link. Gmail and Yahoo also get the one-click unsubscribe header.
An unsubscribe, a hard bounce or a spam complaint blocks the address forever.
"Unsubscribe and remove my listing" takes the listing off the site at once (back to draft);
delete it for good with the SQL in the templates section above.

The wording lives in `lib/outreach/templates.ts`. Same honesty rules as the
hand-written templates: no promised bookings, one follow-up, an easy way out.

## Setting it up (once)

1. **Mailing address.** Done: `Bridal Team, 2139 N University Dr #2055, Coral Springs, FL 33071, United States`.
   It goes in every email (CAN-SPAM) and is already in `TERMS.md` and `PRIVACY.md`.
2. **Resend sending domain.** In Resend (the account `RESEND_API_KEY` already
   uses): Domains → Add domain → `outreach.bridalteam.com`. Paste the DNS
   records it shows into Cloudflare (DNS only, not proxied) and wait for
   "Verified". Never send the campaign from `bridalteam.com` itself: that
   domain carries signup and password-reset mail. Leave open and click tracking off.
3. **DMARC** for the subdomain, if Resend doesn't add one: a TXT record
   `_dmarc.outreach` = `v=DMARC1; p=none; rua=mailto:<your address>`.
4. **Reply inbox.** A Google Workspace alias such as `vendors@bridalteam.com`.
5. **Webhook.** Resend → Webhooks → Add endpoint →
   `https://bridalteam.com/api/outreach/webhook`, events `email.delivered`,
   `email.bounced`, `email.complained`. Copy its signing secret.
6. **App environment variables** (DigitalOcean → Settings → Environment
   variables, encrypted where marked):

   | Variable | Value |
   |---|---|
   | `OUTREACH_SECRET` (encrypt) | 40+ random characters, e.g. from `openssl rand -base64 48` |
   | `OUTREACH_FROM` | `Kebson at Bridal Team <kebson@outreach.bridalteam.com>` |
   | `OUTREACH_REPLY_TO` | `vendors@bridalteam.com` |
   | `OUTREACH_MAILING_ADDRESS` | `Bridal Team, 2139 N University Dr #2055, Coral Springs, FL 33071, United States` |
   | `OUTREACH_SENDER_NAME` | the first name that signs the emails |
   | `RESEND_WEBHOOK_SECRET` (encrypt) | `whsec_...` from step 5 |
   | `OUTREACH_ALERT_TO` | where a pause alert should go |
   | `OUTREACH_OFFER_PRO` | `true` to offer a free year of Pro, else leave unset |
   | `OUTREACH_ENABLED` | leave unset until the dry run looks right |

7. **Apply the migration** `20261101090000_vendor_outreach.sql` to Supabase.
8. **GitHub secret.** Repository → Settings → Secrets and variables → Actions →
   `OUTREACH_SECRET`, the same value as in step 6.
9. **Dry run.** Actions → Vendor outreach → Run workflow (dry run is ticked).
   The log lists today's 20 vendors. Nothing is sent.
10. **Switch on.** Set `OUTREACH_ENABLED=true`. The next weekday run sends.

## Day to day

```sql
-- Where the campaign stands
select status, count(*) from vendor_outreach group by status order by 2 desc;

-- Contacted vs claimed, by category
select p.category, count(*) as emailed, count(*) filter (where o.status = 'claimed') as claimed
  from vendor_outreach o join vendor_profiles p using (org_id)
 where o.status <> 'invalid' group by 1 order by 2 desc;

-- Bounces and complaints so far
select kind, count(*) from outreach_events
 where kind in ('sent_first','sent_followup','delivered','bounced','complained','unsubscribed')
 group by 1;

-- Removal requests to delete for good
select e.created_at, p.business_name, e.org_id from outreach_events e
  join vendor_profiles p using (org_id) where e.kind = 'removal_requested' order by 1 desc;
```

**Pause and resume.** To stop at once, unset `OUTREACH_ENABLED`. If the
campaign paused itself, find out why (the alert email and the bounce query
above), fix it, then resume:

```sql
insert into outreach_events (kind, detail) values ('resumed', '{"note":"<what was fixed>"}');
```

**Someone replies "no" or "delete".** Do it by hand the same day:

```sql
insert into outreach_suppressions (email, reason, note) values (lower('<address>'), 'manual', 'replied no');
```

and delete the listing if they asked.

---

# Objections, answered honestly

**"How many couples actually use this?"**
Almost none yet, and I'd rather tell you that than have you find out. That's
why it's free and why I'm comping Pro — you're early, and early is only worth
anything if it costs you nothing.

**"I'm already on The Knot / Zola / WeddingWire."**
Those cost $200–500 a month and rank you against everyone who pays more. This
is free, it's one more indexed page with your name on it, and it doesn't
compete with anything you're already doing.

**"What happens after the free year?"**
You drop to the Free listing, which keeps your page, your photos and your
contact details. Nothing gets deleted and nothing auto-charges — there's no
card on file to charge.

**"Who owns my photos?"**
You do. Delete the listing and they go with it.

**"Is this going to become paid later?"**
Pro is $29 and Featured $79 today, and they're both optional. Your comped year
is a year; if you want to stay on Free after that, stay on Free.

---

# Tracking

Keep a sheet with: business, category, city, contact, source, date sent,
follow-up date, outcome, claim link. It matters less which tool than that a
"no" and a "no reply" are recorded differently — they get treated differently
next time, and a "no" is permanent.

Watch two numbers in the database:

```sql
-- Listings by status
select status, count(*) from vendor_profiles group by status;

-- Comped founding vendors and when their comp lapses
select o.name, o.comp_plan, o.comp_expires_at, o.comp_note
  from organizations o where o.comp_plan is not null order by o.comp_expires_at;
```

Sent-to-published conversion is the number that tells you whether the message
or the product is the problem. If people reply warmly and never publish, the
friction is in the flow, not the pitch — go fix the flow.

## Ask for the link

When a vendor claims their listing and is pleased with it, ask them to link to
it from their own site. One line in the follow-up email, and most say yes
because it costs them nothing.

This is not a courtesy — it is the highest-value thing the vendor programme
produces for the couples side. Local, topically relevant inbound links are
exactly what a new wedding domain needs to rank, they are almost impossible to
buy honestly, and every vendor is a chance at one. See the flywheel section in
`COUPLES-ACQUISITION.md`.

## When to stop doing this by hand

At roughly **50 published listings in one metro**, the directory becomes worth
linking to on its own and the pitch changes from "help me start this" to "your
competitors are here." That's the point to flip
`NEXT_PUBLIC_SHOW_VENDOR_DIRECTORY=true`, put the directory back in the nav and
on the homepage, and start pointing couples at it.
