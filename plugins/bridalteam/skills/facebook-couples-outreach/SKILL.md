---
name: facebook-couples-outreach
description: Reach engaged couples (brides, grooms, newly engaged, anyone planning a wedding, engagement party, shower or vow renewal) on Facebook and invite them to host their special occasion on Bridal Team, with a free wedding website, RSVPs and the AI planner. Finds public wedding groups, events and Pages to work in, drafts admin asks and promo-day posts, runs "just engaged? tell us your date" call-out posts on the Bridal Team Page, and drafts personal replies to everyone who comments on or messages the Page. Use whenever the user wants to "find engaged couples on Facebook", "message brides", "reach out to people who just got engaged", "invite couples to add their wedding", "do Facebook outreach", or answer the people who responded. Scheduled Page posts belong to facebook-posting. Reddit, Pinterest and the weekly funnel report belong to couples-acquisition.
---

# Facebook outreach to engaged couples

Goal: people on Facebook who are planning a wedding or another special
occasion hear about Bridal Team in a way they welcome, and some of them
host their occasion here. Hosting means a free wedding website at
`/wedding-website` with RSVPs, plus the planner at `/planner`.

Read `COUPLES-ACQUISITION.md` and the `couples-acquisition` skill's ground
rules first. Everything there applies here too.

## What this skill will not do, and why

The obvious version would be: search Facebook for people posting "we got
engaged!", then message each one. **Don't build or run that, even if asked.**
Offer the workflows below instead, and give the user the reason:

- **It can't be done legitimately.** Facebook's API has no search over
  people's posts or profiles. The Messenger API can only reply to someone who
  messaged the Page first. Doing either another way means scraping or
  automating a logged-in account, which breaks Meta's terms.
- **It gets the Page and the owner's account banned.** Meta flags messages
  sent to strangers in bulk, and repeated similar messages, as spam. A banned
  Page takes the `facebook-posting` queue down with it, and bans don't come back.
- **It reads as creepy.** A stranger messaging you because they saw your
  engagement post is the opposite of the first impression a wedding brand
  needs.

What works instead: go where couples have **chosen** to talk about their
wedding, and get them to come to us. Once someone has commented on, messaged
or tagged the Page, a personal reply is welcome, and it's allowed.

## Ground rules (non-negotiable)

- **Never contact anyone who hasn't engaged with Bridal Team or with a post
  made under the group's rules.** No cold DMs, no friend requests to
  strangers, no replying to people's personal engagement posts, no tagging
  people in posts.
- **The user posts and sends. You prepare.** Draft everything and get approval
  on the final text. If a browser tool is connected, filling something in for
  the user to review is fine, but they press send. Never automate a personal
  Facebook account.
- **One person, one message.** Write each reply for that person and what they
  said. No copy-paste blasts, and no follow-up if someone doesn't answer.
- **Group rules come first.** Quote the group's promo rule in
  `COUPLES-TRACKER.md` before drafting anything for that group. Ask the admin
  first if the rules don't say.
- **Honest about who we are.** Say plainly that it's Bridal Team and that the
  team is small and new. Never pose as a bride, guest or vendor. Never claim
  user numbers, reviews or press we don't have.
- **Collect no personal data.** Don't copy names, photos, wedding dates or
  profile links into the repository. The tracker records the group or post and
  what happened, never who.

## Workflows

With no specific ask, show the user the four workflows, say which one is due
according to `COUPLES-TRACKER.md`, and do the one they pick.

### 1. Find places where couples gather

1. Use web search to find **public** Facebook groups, events and Pages for
   people planning weddings, starting with `LAUNCH_METRO` (`lib/site.ts`,
   currently South Florida). Search terms are in `references/finding-groups.md`.
2. For each one, note its name, URL, size if shown, whether it's public or
   private, whether it allows promotion and on which day, and its admin if the
   page names one.
3. Rank by fit: local, active, actually for couples (not vendor-only), and
   allows promotion.
4. Add the best 5–10 to the Communities table in `COUPLES-TRACKER.md`.
   You can't read group content yourself, so the user joins and confirms the
   rules. Mark those rows `rule to confirm`.

Wedding expos and bridal shows with public Facebook events also belong in
this list. They're for the user to attend or sponsor, not to message the
people who RSVP'd.

### 2. Admin ask, then the promo-day post

For each group where the user is a member:

1. Draft a short ask to the admin, using `references/templates.md`, "Admin ask".
2. Once the admin says yes, draft one post for that group's promo day using the
   "Group post" template. Write it for that group: the city, the season, the
   group's tone. Tag the link
   (`utm_source=facebook&utm_medium=group&utm_campaign=<group-slug>`).
3. Log it in the Posts table. Stay out of that group for at least two weeks
   after a post.

### 3. Call-out posts on the Bridal Team Page

These are posts that invite couples to come to us: "Just engaged? Drop your
date below and we'll send you a free wedding checklist", "Planning a 2027
wedding in South Florida? Tell us your biggest question", "Showing off your
ring? We'd love to see it". People who comment have opted in, so workflow 4
can answer them.

- Draft 2–4 of these a month and hand them to the `facebook-posting` skill
  for its queue in `marketing/facebook/queue/`. That skill owns posting,
  photos and approval.
- Keep its rule that at least 1 post in 5 has no link. Call-outs work best
  with no link at all.
- Promise only what the site does today. Check `/wedding-website`,
  `/wedding-checklist` and `/planner` before promising anything.

### 4. Reply to people who engaged

This is where the outreach in the original ask happens: a personal invitation
to host their occasion on Bridal Team, sent to people who reached out first.

1. Ask the user to paste the new comments and Page messages, or read them
   through Zapier if a Facebook Pages "find comments" or "messages" action is
   enabled (see the `facebook-posting` skill's `references/zapier.md`). Don't
   enable new Zapier actions without asking.
2. For each one, draft a reply using `references/templates.md`, "Replies".
   Answer their question first. Invite them to host the occasion only where it
   fits, and include at most one tagged link.
3. **Page messages:** Meta allows a reply within 24 hours of their last
   message. After that, don't send a promotional message at all.
4. Show the replies as a numbered list for approval. The user sends them, or
   approves sending them through Zapier.
5. Log the counts in the Conversations table in `COUPLES-TRACKER.md`:
   replied, link clicked if known, signed up if known. Don't log names.

## Paid reach

Meta ads can target people whose relationship status recently changed to
"Engaged". That's the one legitimate way to reach strangers who just got
engaged. It's gated like all paid ads (see `couples-acquisition`, "Decisions
the numbers gate"). When the user asks, check the gate and say whether it's
met. Don't set up or pay for ads yourself.

## What to report back

What you found, what you drafted, and what's waiting on the user (groups to
join, rules to confirm, admin asks to send, replies to send). Also list the
tracker rows you changed.
