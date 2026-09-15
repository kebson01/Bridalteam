# Bridal Team — AI-Powered Wedding Planning (2026 rebuild)

A modern rebuild of the original Bridal Team wedding-planning platform
(circa 2012–2013), keeping the same brand — colors, logo, tagline and
structure — while replacing the old Laravel + WordPress + jQuery stack with a
current **Next.js 16 + React 19 + Tailwind v4** app, and adding **AI** at the
core of the experience.

> _Fun, simple wedding planning. Organize details. Find ideas. Collaborate with your team._

## What's here

- **Faithful brand system** ported from the original site
  (`app/globals.css`): the signature orange (`#ff8c1c` / `#f36705`), near-black
  `#222`, and grays, with Jost (a free Futura-PT stand-in) + Raleway.
- **Modern homepage** (`app/page.tsx`) — hero with the original tagline and
  orange wash, the four AI pillars, alternating highlight sections, and the
  original footer structure.
- **Live AI planning assistant** (`components/ai-planner.tsx` +
  `app/api/plan/route.ts`) — chat that gives real, tailored guidance on
  timelines, budgets, checklists and vendor sequencing.
- **The wedding workspace** (`app/w/[id]/`) — timeline, budget, guest list with
  invite-only RSVP, menu and dish-per-guest, printable place cards and seating
  chart, caterer export, travel, ideas, team and vendors, plus a public wedding
  website at `/wedding/[slug]` with a cover photo.
- **Community and inspiration** (`app/community/`, `app/inspiration/`) — groups,
  posts, polls, events and shared mood boards, readable signed-out.
- **The vendor side** (`app/vendor/`, `app/for-vendors/`) — self-serve profiles,
  a lead inbox, reviews and Stripe-billed Free / Pro / Featured tiers
  (`lib/tiers.ts`).
- **Published legal** (`app/terms`, `app/privacy`) — rendered from `TERMS.md`
  and `PRIVACY.md` through `components/legal-doc.tsx` so they can't drift.

## The four AI pillars

1. **AI wedding planner** — timelines, checklists and to-dos for the whole team.
2. **Smart vendor matching** — best-fit vendors from style, budget and location.
3. **AI content & inspiration** — mood boards, bios and blog ideas from a prompt.
4. **Budget & guest tools** — realistic budget estimates and guest-list help.

## Running it

```bash
npm install
npm run dev      # http://localhost:3000
```

Before opening a pull request, run what CI runs:

```bash
npm run typecheck   # tsc --noEmit
npm run build
```

Both go green on a clean checkout with no environment variables set — the
Supabase publishable credentials and the canonical site URL have defaults — so
a failure here is a real one.

### AI: demo mode vs. live Claude

The planner works out of the box in **demo mode** — smart, deterministic
replies that read the couple's question (budget, timeline, vendors, vibe) and
respond in context. No key required.

To power replies with **live Claude AI**, add a key:

```bash
cp .env.example .env.local
# then set ANTHROPIC_API_KEY=sk-ant-...
```

The API route (`app/api/plan/route.ts`) calls the Anthropic Messages API
(`claude-sonnet-5` by default; override with `ANTHROPIC_MODEL`) and falls back
to demo mode automatically if the key is missing or a call fails.

## Vendor directory (Supabase)

The `/vendors` page reads vendors **live from Supabase**. The public Bridal Team
project (URL + publishable key) is baked into `lib/supabase.ts` as a default, so
the directory works with no configuration — reads are guarded by row-level
security (public can read; nobody can write with the public key).

There are **two vendor tables**, and they are not interchangeable:

- **`vendor_profiles`** backs everything public. A vendor creates their own
  account, fills in their profile and publishes it; `/vendors` lists only rows
  with `status = 'published'`, ordered so Featured-plan vendors come first. With
  nothing published the page shows an empty state rather than invented listings.
- **`vendors`** is the older admin-curated table (`name`, `category`, `city`,
  `state`, `price`, `capacity`, `tag`, `description`, `image_url`, `website`,
  `featured`). It still holds ~29 seeded sample rows and is reachable **only**
  through `/admin/venues` — no public page renders it.

So the way a vendor gets listed today is by signing up and publishing a profile.
`/admin/venues` remains for curating the legacy table.

### Managing vendors from `/admin/venues`

The admin page adds/edits/deletes vendors through a password-gated API route that
writes with the Supabase **service-role** key. Both of these must be set (they
are server-only secrets — never commit them):

```bash
cp .env.example .env.local
# in .env.local:
#   SUPABASE_SERVICE_ROLE_KEY=...   (Supabase → Project Settings → API → service_role)
#   ADMIN_PASSWORD=your-strong-passphrase
```

Then open `/admin/venues`, enter your `ADMIN_PASSWORD`, and manage vendors.
Without these set, the directory still displays; only editing is disabled.

> Note: this is lightweight password protection suitable for a single admin.
> For multiple users, swap it for Supabase Auth later.

## Relationship to the original

This repository is the new, self-contained version of Bridal Team. The original
2012/13 Laravel + WordPress + blog codebase was removed when the project was
rebuilt; it remains recoverable in the git history if ever needed.

## Launch state

The app is feature-complete and builds clean. The signed-in product — accounts,
onboarding, the dashboard and the wedding workspace — sits behind one build-time
flag, `NEXT_PUBLIC_SHOW_PLANNER_APP`. `lib/config.ts` reads it as `SIGNUPS_OPEN`,
which is the single source of truth for where every "Start free" CTA, `/signup`
and `/login` point: the waitlist while it's off, the real auth screens once it's
on. Because it's a `NEXT_PUBLIC_*` flag it is read at build time, so opening
accounts means setting it **and redeploying**.

Before flipping it, make sure the server-only keys are set in production —
`STRIPE_SECRET_KEY` and the price/webhook ids, `RESEND_API_KEY`,
`ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`. Each one
degrades quietly rather than erroring (see `.env.example`), so a missing key
looks like a working site until a vendor tries to pay or an invite never sends.

## Next steps (not yet built)

- Surface the non-venue categories in the directory UI (the data already has them)
- Wire the matching AI to query real vendor data
- A test suite — CI typechecks and builds every pull request
  (`.github/workflows/ci.yml`), but nothing asserts behaviour yet
