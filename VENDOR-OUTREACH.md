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

1. **A page they control that Google can find.** Published listings are now in
   the sitemap (`app/sitemap.ts`), `/v/[id]` sets real per-vendor metadata, and
   `robots.ts` allows it. For a small vendor with a thin web presence, one more
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
message, and a working opt-out that you honour. Note that the mailing address
is one of the unresolved `[TODO]`s in `TERMS.md` — settle it before the first
send, because it has to appear in the email. If the volume ever grows past
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
> [physical mailing address]
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

## 3. Claim-your-listing variant — use this once the claim flow ships

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
> [physical mailing address]

The "reply delete and it's gone" line is doing real work: it removes the fear
that someone has published something about their business without asking. Mean
it, and act on it the same day.

## 4. Follow-up — once, after 5–7 days

> Hi [name] — just closing the loop on the Bridal Team listing. Still happy to
> set it up, still free, and still fine if the answer is no. Either way I won't
> chase you again.

One follow-up. Then stop, permanently. Two is where goodwill turns into spam
complaints.

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

## When to stop doing this by hand

At roughly **50 published listings in one metro**, the directory becomes worth
linking to on its own and the pitch changes from "help me start this" to "your
competitors are here." That's the point to flip
`NEXT_PUBLIC_SHOW_VENDOR_DIRECTORY=true`, put the directory back in the nav and
on the homepage, and start pointing couples at it.
