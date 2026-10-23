# Channel playbooks

Rules and features on these platforms change. Check the current rules on the
community's or platform's own page before every batch, and treat this file as
a starting point, not as fact about any rule today.

## Reddit

Where wedding planning actually happens online. Highest trust, strictest
rules.

**Communities:** r/weddingplanning, r/weddings, r/engaged, r/budgetwedding,
r/weddingsunder10k. Local subs (r/fortlauderdale, r/miami) only for local
questions, and only if their rules allow.

**What works:** answering real questions well, with no link. Vendor booking
order, budget splits, timeline questions, who-pays etiquette, guest-list
cuts. The guides cover all of these.

**How to draft:**
1. The user finds or pastes current questions (you can search for recent
   threads, but say the results may be stale).
2. Draft an answer that would be upvoted with no link: specific, kind, short
   paragraphs or a list, numbers where the guide has them.
3. Link only if the subreddit allows it **and** it genuinely helps (someone
   asked for a tool, or the answer is "here's a checklist"). Then say who you
   are: "I built a free planner that does this: <link>". Never pose as a
   neutral user.
4. Weekly self-promo threads, where they exist, are the right place for a
   plain "free AI wedding planner, no account" post.

**Never:** cross-post one link to many subs, use multiple accounts, comment
on your own posts from another account, ask questions to answer them, or
delete-and-repost to dodge removal.

## Facebook groups

**Which:** local and regional wedding groups, and "engaged in <city> 2027"
style groups, starting in South Florida (`LAUNCH_METRO` in `lib/site.ts`).

**How:**
1. The user finds the groups (you can suggest search terms). Facebook group
   content isn't readable from here.
2. Draft a short, honest message to the admin: "I built a free AI wedding
   planner for couples in <metro>. May I share it on your promo day?" That
   gets a yes more often than a surprise post gets forgiven.
3. Draft the post for the promo day: what it does in one line, one example
   question and answer, the tagged link, and "built by a small team, feedback
   welcome".
4. Answer comments helpfully. Many come back with real planning questions.

## Pinterest

The best fit for what you already have. It's a search engine for wedding
ideas, pins keep sending traffic for years, and posting your own material is
the expected behaviour.

**How:**
- One board per theme that matches the content: checklists and timelines,
  budget, each vendor category, inspiration styles.
- Pins for guides: a tall image with the guide's promise as the headline
  ("The 12-month wedding checklist"), linking to the guide with a tag. Draft
  the title, the description (natural keywords from the guide's `keywords`),
  the alt text and the board.
- Pins for the planner: "Ask an AI wedding planner anything, free" linking
  to `/planner`.
- Inspiration images: use only photos whose license in `lib/inspiration.ts`
  allows it, and credit where the license asks.
- Claim the website on the Pinterest business account (the `seo-promotion`
  tracker has this under foundations) so pins carry the domain.

Image design is the user's call. Describe the layout and text, or produce a
simple HTML or SVG mock if they want one.

## TikTok and Instagram

High ceiling, high effort. Only worth it if the user wants to do it
regularly. A half-hearted account is worse than none.

**The format that fits:** a screen recording of the planner answering a real
question ("We have $20k and 100 guests. Where does the money go?"), the
answer on screen, a caption hook, and the link in the bio with a tag. Draft:
the hook, the question, a 20–40 second script, caption, and hashtags that
match the question rather than generic tags.

**Never:** buy followers or engagement, or use trending audio the account
isn't licensed to use for business.

## Quora and wedding forums

Secondary. Same rules as Reddit: a complete answer first, a link only where
it helps and the site allows it, always disclosed.

## Email and friends

The cheapest channel the doc names: a friend telling a friend. Draft a short
note the user can send to people they know who are engaged, asking them to
try it and forward it if it helped. Personal messages from the user to people
they know, not a list.
