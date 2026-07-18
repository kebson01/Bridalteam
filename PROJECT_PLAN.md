# Bridal Team — Product Roadmap & To-Do List

**Vision:** An app that acts as a couple's personal wedding planner. Any bride,
groom, or couple can use it to coordinate their whole wedding — communicate with
their bridal party (bridesmaids/groomsmen) and vendors, look up vendors and their
prices, manage a budget, and work through a smart, guided checklist of everything
that needs to get done. The app should proactively surface things a couple may not
have thought of, so it feels like having a real wedding planner in their pocket.

---

## Where the project stands today

**Already built (vendor side — "Wedfolio"):**
- Laravel API + a small React frontend, WordPress for blog/admin content.
- Vendor accounts: registration, email verification, JWT login, Stripe subscriptions & add-ons.
- Vendor directory: categories, regions, search/filter, vendor profile pages, portfolio galleries.
- Vendor inquiry messages (a couple can send a message to a vendor).
- Admin tools to approve vendors/media and import vendors.

**Not built yet (the couple side — this is the gap we're filling):**
- No couple/planner accounts (the `users` table exists but is unused for planning).
- No concept of a "Wedding" project.
- No task checklists, timeline, or project management.
- No budget or vendor-price comparison for couples.
- No guest list or bridal-party coordination.
- No in-app messaging owned by the couple, no notifications.
- No "virtual planner" guidance/intelligence.

**Also outstanding (housekeeping):**
- Stray root-level hotfix files (`PageController_HOTFIX.php`, `fix-blog-server.sh`).
- Committed default credentials (`production.env`); production hardening checklist unfinished.
- Three overlapping deploy configs (DigitalOcean, GCP/Cloud Run, docker-compose) — pick one.

---

## Phase 0 — Foundation & decisions (get unblocked)  ✅ complete
- [x] **Frontend direction** — decided: a lightweight couple web app served by
      Laravel at `/plan` (no separate Node build) for now; graduate to a standalone
      React SPA later since the API is already decoupled.
- [x] **Deploy target** — standardized on **Docker Compose / DigitalOcean** (PHP 7.4 +
      MySQL). GCP/Cloud Run files kept only because the Dockerfile reuses
      `cloudrun/entrypoint.sh`; documented, not deleted, to avoid breaking the build.
- [x] **Repo cleanup** — stray hotfix files moved to `archive/`; `production.env`
      untracked and scrubbed of committed passwords (rotate history creds before launch).
- [x] **Local dev environment** — `docker-compose up --build` now boots the API +
      couple frontend, waits for the DB, migrates, and seeds. See `DEV_SETUP.md`.
      Also fixed: real `JWT_SECRET` at boot (was a placeholder — token auth was broken)
      and an anonymous `vendor/` volume so the bind mount doesn't hide it.
- [x] **DB** — staying on MySQL (the app is built for it); Supabase remains a later option.

## Phase 1 — Couple accounts & the "Wedding" project
*The backbone everything else hangs off of.*
- [x] Couple registration + login (reuse the `users` table; same JWT flow as vendors). — API built
- [x] **Wedding model**: date, venue, location, budget target, guest-count estimate,
      couple names, roles (partner A / partner B), theme/style. — migration + model built
- [x] Onboarding wizard (frontend): 3-step wizard (names/style → date/city → guests/budget)
      that creates the wedding and seeds a personalized plan. — built at `/plan`
- [x] Wedding dashboard: countdown, % of tasks done, live progress bar, grouped checklist. — built
- [x] Ability to invite a co-planner (fiancé, mom, maid of honor). — invite + accept API built
      (`WeddingMemberController`); email delivery deferred to Phase 7.

## Phase 2 — Task & checklist engine (the project manager)
*This is the core "planner" feature.*
- [x] **Task model**: title, description, due date, category, status, assignee, priority. — built
- [x] **Checklist templates by timeline** (12+, 9, 6, 3, 1 month, week-of, day-of, after)
      seeded from the wedding date — auto-generates the master to-do list. — seeder + generator built (~40 tasks)
- [x] Check tasks off; progress rolls up to the dashboard. — `PUT .../tasks/{id}` + progress
- [ ] Assign tasks to bridal-party members or the co-planner. *(column + API field exist; needs members UI.)*
- [x] **Deliverables**: attach notes/links to tasks. — API built *(file upload deferred)*
- [ ] Timeline / calendar view of everything due. *(frontend)*
- [ ] Reminders for upcoming and overdue tasks. *(Phase 7 notifications)*

> **Built (Phases 0–1 + Phase 2 core):** migrations 1–6, models, ~40-task checklist
> seeder, the couple/wedding/task/deliverable/member API, and the `/plan` web app
> (auth → onboarding → dashboard + checklist). Run it with `docker-compose up --build`
> (see `DEV_SETUP.md`); API reference in `website/COUPLE_API.md`.
>
> **Verification status:** all PHP/JS/bash lint clean; feature tests in
> `tests/Feature/WeddingPlannerTest.php`. Not yet booted end-to-end by me — Docker
> isn't available in this authoring environment — so the first `docker-compose up`
> on a real machine is the remaining smoke test.

## Phase 3 — Budget & vendor price lookup
*Ties the couple side into the vendor marketplace you already have.*
- [ ] **Budget model**: total budget, per-category allocations (venue, catering, photo, etc.).
- [ ] Track estimated vs. actual cost per line item; show remaining budget.
- [ ] **Vendor price lookup**: surface pricing from the existing vendor directory so couples
      can compare cost by category and region.
- [ ] "Save"/shortlist vendors to a wedding; request quotes; log the quoted price against budget.
- [ ] Payment/deposit tracker (what's paid, what's due, when).

## Phase 4 — Bridal party & guest coordination
- [ ] **People model**: bridesmaids, groomsmen, family, guests — with roles & contact info.
- [ ] Invite bridal-party members into the app (lightweight accounts / invite links).
- [ ] **Group messaging / announcements** to the bridal party (owned by the couple, not
      routed through vendors) — dress fittings, rehearsal, day-of logistics.
- [ ] Guest list: RSVP status, meal choice, +1s, plus-one management, seating notes.
- [ ] Shareable links (registry, event details, directions).

## Phase 5 — Vendor collaboration (upgrade the existing marketplace)
- [ ] Couple-owned message threads with vendors (extend the current one-off inquiry).
- [ ] Booking status per vendor (inquired → quoted → booked → paid).
- [ ] Store contracts/deliverables from each booked vendor against the wedding.
- [ ] Notify the couple when a vendor replies.

## Phase 6 — The "virtual wedding planner" intelligence
*What makes this feel like a planner, not just a checklist app.*
- [ ] Smart suggestions: based on date, budget, size, and location, recommend what to do
      next and which vendor categories still need booking.
- [ ] **"Did you think of this?"** prompts — commonly forgotten items (marriage license,
      vendor meals, weather backup, tips/gratuities, thank-you cards, insurance, etc.).
- [ ] Q&A / assistant: let couples ask questions ("how much should catering cost for 120
      guests?") answered from vendor data + planning knowledge.
- [ ] Budget guidance: recommended % splits per category, flags when a category is over.
- [ ] Personalized timeline that adapts as the date approaches.

## Phase 7 — Polish, notifications & launch
- [ ] Email/push notifications for reminders, messages, and RSVPs.
- [ ] Mobile-responsive (or a mobile app) — couples plan on their phones.
- [ ] Onboarding polish, empty states, sample data.
- [ ] Analytics on task completion / drop-off.
- [ ] Production hardening: secrets, SSL, managed DB, backups, monitoring.
- [ ] Beta with a few real couples; gather feedback; iterate.

---

## Suggested build order (fastest path to something usable)
1. **Phase 0 + Phase 1** — a couple can sign up and create their wedding.
2. **Phase 2** — auto-generated checklist + dashboard. *This alone is a usable MVP planner.*
3. **Phase 3** — budget + vendor price lookup (leverages what already exists).
4. **Phase 4** — bridal party & guests.
5. **Phase 5–6** — vendor collaboration + smart planner intelligence.
6. **Phase 7** — polish & launch.

**Recommended first milestone (MVP):** Phases 0–2 → a couple signs up, enters their
wedding date and details, and instantly gets a personalized, checkable to-do list with a
dashboard. That's the smallest thing that already delivers the core promise.
