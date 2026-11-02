# Message templates

These are starting points, not scripts. Run every final draft through the
`human-voice` skill before showing it. Rewrite each one for the person or
group: their city, their date, what they actually said. Never send the same
text twice. Keep messages short, with at most one link, always tagged.

## Admin ask

> Hi <admin name>! I run Bridal Team, a small new wedding-planning site based
> in <metro>. It gives couples a free wedding website with RSVPs and a free AI
> planner. Would it be OK to share it with the group on your promo day? Happy
> to follow whatever format you prefer. Thanks either way!

## Group post (promo day only)

> Hi everyone! I'm <first name> from Bridal Team. We built a free place to host
> your wedding (or engagement party, shower or vow renewal): one page with your
> date, venue, story and registry, plus a private RSVP link for each
> household. There's a free AI planner too, if you want help with budgets or
> timelines. No card needed.
>
> We're new and small, so any feedback is really welcome. Congrats to everyone
> planning.
>
> https://bridalteam.com/wedding-website?utm_source=facebook&utm_medium=group&utm_campaign=<group-slug>

## Call-out posts (Bridal Team Page)

Give these to the `facebook-posting` queue. No link is needed.

- "Just got engaged? Tell us your season and city below and we'll
  reply with what to book first."
- "Planning a 2027 wedding in South Florida? What's the one question you
  can't find a straight answer to? We'll answer every comment."
- "Showers, engagement parties, vow renewals: what are you celebrating
  this year? Tell us below."

## Replies

Answer what they said first. Invite them only where it fits.

**Someone shares their engagement or date:**

> Congratulations! <one specific, genuine line about their date, season
> or city>. If it helps, you can set up a free wedding page with RSVPs on
> Bridal Team whenever you're ready: <tagged /wedding-website link>

**Someone asks a planning question:** answer it properly from
`lib/guides.ts`, with no link unless the matching guide adds something. Then
optionally: "We wrote more on this here: <tagged /guides/<slug> link>".

**Someone asks what Bridal Team is:**

> We're a small, new wedding-planning site. Couples get a free wedding website
> with RSVPs, a checklist, a budget calculator and an AI planner, all free.
> Here's the place to start: <tagged /planner or /wedding-website link>

**Someone says no, or doesn't answer:** leave it. No follow-up.

## Link tags

```
utm_source=facebook&utm_medium=group&utm_campaign=<group-slug>
utm_source=facebook&utm_medium=comment&utm_campaign=<post-slug>
utm_source=facebook&utm_medium=message&utm_campaign=outreach
```
