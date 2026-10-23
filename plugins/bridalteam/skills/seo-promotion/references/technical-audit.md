# Technical SEO audit checklist

Most of this already passes. `COUPLES-ACQUISITION.md` lists what's done. The
point is to catch regressions and new pages that missed the pattern, not to
rebuild what works. Report each item as pass, fail (with file and line) or
not checked.

This is Next.js 16. Before changing metadata, sitemap or robots code, read the
relevant guide in `node_modules/next/dist/docs/` (see `AGENTS.md`). The APIs
differ from older versions.

## Crawl and index

- [ ] `app/robots.ts` allows `/` and disallows only private paths (`/admin`,
      `/api/`, `/claim`). Nothing public got blocked.
- [ ] `app/sitemap.ts` includes every public marketing page, every guide, every
      blog post and published vendor listings. It excludes auth, dashboard and
      `/w/*`, and respects `SHOW_COMMUNITY` and `SHOW_VENDOR_DIRECTORY`.
- [ ] Any new public route under `app/` is in the sitemap, or there's a reason
      it isn't.
- [ ] `app/robots.test.ts` and `app/sitemap.test.ts` pass and cover any change.
- [ ] Private and token pages (`/claim/*`, `/invite/*`, `/rsvp/*`) set
      `robots: { index: false }`.

## Per-page metadata

- [ ] Every public page exports metadata through `pageMetadata()` in
      `lib/site.ts`, so it has a self-referencing canonical, a title, a
      description and OG/Twitter tags.
- [ ] Titles are unique and under ~60 characters. Descriptions are unique and
      roughly 120–160 characters, and describe the page, not the brand.
- [ ] `/v/[id]`, `/guides/[slug]` and `/blog/[slug]` generate per-item titles
      and descriptions.
- [ ] `app/opengraph-image.tsx` renders. Pages with their own images pass them.

## Structured data (`lib/structured-data.ts`)

- [ ] Organization and WebSite on the homepage.
- [ ] Article and FAQPage on guides, BlogPosting on posts, BreadcrumbList on
      nested pages, LocalBusiness on vendor pages.
- [ ] FAQ schema only lists questions that are visibly on the page.
- [ ] Organization `sameAs` lists the brand's real social and directory
      profiles. Update it as listings from `PROMOTION-TRACKER.md` go live.
      Only add a profile that actually exists.
- [ ] Spot-check one page of each type with Google's Rich Results Test or the
      Schema.org validator (ask the user to paste the URL in if you can't
      reach it).

## Content and links

- [ ] Each guide links to `/planner` and to related guides.
- [ ] No two guides target the same primary keyword.
- [ ] Guide `updated` dates reflect real edits, not bumps.
- [ ] Images have meaningful `alt` text.
- [ ] No broken internal links (run the build, then check the routes).

## Performance and UX (ranking signals)

- [ ] Core Web Vitals: ask the user for PageSpeed Insights or Search Console
      results on `/`, `/planner` and one guide. Don't guess numbers.
- [ ] Mobile layout works at phone width.
- [ ] Fonts and images load without layout shift.

## Host and domain

- [ ] `bridalteam.net` and `www.` variants 301 to `https://bridalteam.com`
      (`lib/site.ts` says `.net` already does). Check with a request if network
      access allows.
- [ ] HTTPS everywhere, no mixed content.
