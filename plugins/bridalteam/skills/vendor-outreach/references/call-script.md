# Call script: claim your listing

A call has one job: get the email address the vendor wants to use for their
listing. Keep it under three minutes. Adapt the words, keep the honesty.
Before using a price or perk, check `lib/tiers.ts` and the vendor's comp.

## Opening (10 seconds)

> Hi, is this [business]? My name is [name], I run Bridal Team, a wedding
> planning site for Florida couples. Have you got one minute? It's about a free
> listing you already have with us.

If they're busy: "No problem. When's a better time?" Note `call back <date>`.

## Why you're calling

> We list wedding vendors in [metro], and [business] is on there already, with
> your name, phone and website from your public site. I'm calling so you can
> claim it, check the details are right, and add your own photos and
> description. It's free, there's no card, and nothing changes unless you
> want it to.

Then something specific: "I saw [a real detail about their work]."

## The honest part (say it before they ask)

> Being straight with you: we're early on the couples side, so I can't
> promise you bookings. What you get is a page you control that Google can
> find, linked to your site.

## The ask

> What's the best email to attach to the listing? You'd then sign up on
> bridalteam.com with that same address and the listing is waiting for you.

Confirm they're the business, not someone who happens to answer the number:
ask who you're speaking to and their role. Read the address back to them
letter by letter.

If they're a founding vendor with a comp: "Because you're one of the first,
Pro is free for [term]: [the Pro features from `lib/tiers.ts`]."

## If they say no

> Totally fine. Would you like me to take the listing down, or leave it as it
> is?

Record `no` (permanent). If they want it removed, record
`delete requested` and the user deletes it today.

## Voicemail

Leave at most one, short, and don't call again for a week:

> Hi, this is [name] from Bridal Team, bridalteam.com. [Business] has a free
> listing on our wedding directory and I'd like to help you claim it. You can
> reach me at [number] or hello@bridalteam.com. Thanks.

Record `no reply` with the date. That counts as the first contact.

## After the call

Same day:

1. On `/admin/claims`: search the number, confirm the business, type the
   email, save.
2. Record the outcome in the vendor's category table in `VENDOR-PROSPECTS.md`.
3. If they asked for it, send a short note with the sign-up link. That's a
   reply they asked for, not a cold email.
