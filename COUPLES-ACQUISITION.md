# Getting couples onto Bridal Team

The companion to `VENDOR-OUTREACH.md`, and the harder half. Vendors can be
recruited by hand — you can build someone a page and email them a claim link.
There is no equivalent for couples. They arrive from search, from somewhere
they already spend time, or from a friend, and that is the whole list.

## Where things actually stand

The site went live around 11 September. In the nine days to 20 September:
**one real signup (yours) and one AI chat turn.** Total planner usage since
July is 15 turns across about 11 people. Nothing is broken — nobody is
arriving.

That distinction is the reason `page_events` exists now. Before it, "no
signups" and "plenty of visitors who all bounce" looked identical from the
outside, and they need opposite fixes. Check which one you have before acting
on anything below:

```sql
select name, count(*) from page_events
 where created_at > now() - interval '7 days'
 group by name order by 2 desc;
```

If `page_view` is near zero, this document's Part 1 is the work. If `page_view`
is healthy but `planner_message` is not, the landing page is the problem. If
people reach `planner_limit` and never `signup_success`, the wall is.

## The thing you are actually selling

Not the directory — it has no vendors yet, and couples can tell. Not the
workspace — it is good, but nobody adopts a planning tool from a cold link.

**It is the AI planner.** Free, three real answers, no account, no card. It is
the only thing here that is immediately useful to a stranger, and a free useful
tool is the one kind of link people forward without being asked. Every channel
below leads there, not to the homepage.

---

# Part 1 — Distribution, this month

## Reddit

Where wedding planning actually happens online: r/weddingplanning, r/weddings,
r/engaged, r/budgetwedding, r/weddingsunder10k.

**Read the rules of each before posting, and take them literally.** Most ban
self-promotion outright, some allow it only in a weekly thread, and moderators
ban quickly and permanently. A ban is not recoverable, and it costs you the
single best venue there is.

What works, and it is slower than it sounds: answer questions from real
knowledge, without a link. Budget breakdowns, vendor-booking order, timeline
questions — the same ground the 22 guides cover, which means you can answer
well. Build a genuine history. Link only where the rules permit it or where
someone explicitly asks what you used.

What gets you banned and deserves to: posting the link in twenty subreddits,
inventing a "my fiancé built this" story, running several accounts, or
answering your own questions. Do not do any of it. Beyond being dishonest, it
is easily spotted and it forecloses the channel permanently.

## Facebook groups

Local and regional wedding groups, plus "engaged in \<city\> 2027" groups. Usually
admin-gated, usually with a designated self-promo day. Ask an admin before
posting; the honest ask — "I built a free AI wedding planner, may I share it?"
— gets a yes more often than a surprise post gets forgiveness.

## Pinterest

The most under-rated of these for weddings, and the best fit for what you
already have. It is a search engine more than a social network, its wedding
intent is enormous, pins keep returning traffic for years, and
`app/inspiration/` is exactly the content it rewards. It is also the one
channel here where posting your own material is the expected behaviour rather
than a rules violation.

## TikTok and Instagram

High ceiling, high effort, and a different skill from everything else in this
repo. Worth it only if you enjoy it — a half-hearted account is worse than
none. If you do: the planner answering a real question on camera is the format,
not brand posts.

## Tag every link

Now that `page_events` records `source`, this is the difference between knowing
and guessing:

```
https://bridalteam.com/planner?utm_source=reddit
https://bridalteam.com/planner?utm_source=pinterest
```

`lib/attribution.ts` carries the value through to signup, so a channel's
signups are attributable and not merely correlated with the week you posted.

## Not yet: paid ads

You have no baseline conversion rate, so you cannot tell a good campaign from a
bad one, and the first £200 would buy a number you cannot interpret. Let the
funnel collect a few hundred `page_view` rows first, then the same spend
answers a question instead of raising one.

---

# Part 2 — SEO, the 6–12 month play

## What is already done — genuinely

Do not redo any of this:

- **22 guides and 8 posts**, on the right high-intent topics.
- **Structured data** throughout: Article, BlogPosting, FAQPage, Breadcrumb,
  Organization, WebSite, LocalBusiness (`lib/structured-data.ts`).
- **Sitemap** covering marketing pages, guides, posts, and — as of this
  branch — every published vendor listing.
- **Internal linking** from guides to `/planner` and to related guides.
- **Per-page canonicals and metadata** via `pageMetadata()`.

The technical foundation is better than most sites this size ever get. It is
not the bottleneck.

## What is actually missing

**Links and age.** A nine-day-old domain with no inbound links ranks for
nothing, whatever is in the markup. Google needs to find the site, then trust
it, and trust is mostly other sites linking to you plus time. Six to twelve
months for anything competitive is the honest range, and no amount of
additional content shortens it.

**So writing a 23rd guide is not the work.** You already have more content than
links, and adding more widens that gap.

## Do these first, this week

1. **Google Search Console and Bing Webmaster Tools.** Verify the domain,
   submit `https://bridalteam.com/sitemap.xml`. Free, twenty minutes, and it is
   how you find out which queries you appear for at all. It is also the only
   honest source of that data — and it is server-side verification, so it does
   not touch the no-third-party-tracker promise on the privacy page.
2. **Check what is indexed.** `site:bridalteam.com` in Google. If the guides
   are not there, nothing else in this section matters yet.
3. **Pick winnable targets.** "How much does a wedding cost" is contested by
   The Knot and Zola and you will not win it for years. The long tail is
   winnable: "who pays for the wedding", "save-the-dates vs invitations",
   and above all **local** terms — "wedding florists in Fort Lauderdale" —
   which is where the vendor directory and the guides reinforce each other.

## The flywheel worth building deliberately

This is the part where the vendor work pays for itself twice:

**Vendors you onboard are a link source.** A photographer who claims a listing
has a website, and vendors routinely link to profiles that feature their work —
often unprompted, and reliably if you ask while they are pleased with you. Those
are exactly the local, topically relevant links a new wedding domain needs, and
they are almost impossible to buy honestly.

So: vendors → inbound links → rankings for local terms → couples → a directory
worth being listed in → more vendors. Each turn makes the next easier. It is
slow for the first two turns and then it is not.

Concretely: when a vendor claims a listing, **ask them to link to it** from
their own site. One line in the follow-up email. Most will say yes, and it
costs them nothing.

## Other legitimate links

- **Local**: chambers of commerce, wedding-show exhibitor pages, venue
  preferred-vendor lists.
- **Journalist requests** (Qwoted, Featured, the HARO successors): reporters
  want wedding-cost and etiquette quotes constantly, and you have 22 guides'
  worth of material to answer with.
- **Genuinely useful tools** get linked without asking. The free AI planner is
  the most linkable thing you have.

Never buy links, never join a link exchange, never post directory spam. All
three are detectable, and the penalty lands on the domain you are trying to
build.

## What to watch, and how often

Monthly, not daily — nothing here moves in a week:

- Search Console: impressions first, then clicks. Impressions rising with flat
  clicks means you are ranking on page two, which is progress.
- `page_events`: `page_view` on `/guides/*` is organic traffic arriving.
- The funnel ratio from the top of this document.

The number that tells you it is working is **`page_view` on guide pages from a
`source` you did not post to**. That is a stranger finding you through search,
and it is the first real one.
