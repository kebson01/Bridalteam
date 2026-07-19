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
  orange wash, the four AI pillars, alternating highlight sections, an AI vendor
  matching band, and the original footer structure.
- **Live AI planning assistant** (`components/ai-planner.tsx` +
  `app/api/plan/route.ts`) — a chat demo that gives real, tailored guidance on
  timelines, budgets, checklists and vendors.

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

Data lives in the `vendors` table (`name`, `category`, `city`, `state`, `price`,
`capacity`, `tag`, `description`, `image_url`, `website`, `featured`) and already
covers every category — venues, photographers, caterers, music and more. You can
add vendors three ways:

1. **The admin page** — visit `/admin/venues` (see below).
2. **The Supabase dashboard** — Table editor → `vendors`.
3. **Bulk import** — upload a CSV into the `vendors` table.

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

## Next steps (not yet built)

- Supabase Auth for couple accounts + shared team workspaces
- Surface the non-venue categories in the directory UI (the data already has them)
- Wire the matching AI to query real venue/vendor data
