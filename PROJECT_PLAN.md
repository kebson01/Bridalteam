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

## Phase 0 — Foundation & decisions (get unblocked)
- [ ] **Decide the frontend direction** for the couple app: extend the existing React
      app, or start a fresh modern SPA. (Recommend a clean React/Next front end that
      talks to the Laravel API.)
- [ ] **Confirm the deploy target** — pick one of DO / GCP / docker-compose and delete
      the other two configs to stop the drift.
- [ ] **Repo cleanup** — move/retire the root hotfix files; get default creds out of
      `production.env` and into secrets.
- [ ] Stand up a local dev environment that runs the Laravel API + a couple-facing
      frontend together (a SessionStart hook can enforce this).
- [ ] Confirm the DB: MySQL vs. moving to a managed Postgres/Supabase (a Supabase
      connection is available in this workspace if we want it).

## Phase 1 — Couple accounts & the "Wedding" project
*The backbone everything else hangs off of.*
- [ ] Couple registration + login (reuse the `users` table; separate auth flow from vendors).
- [ ] **Wedding model**: date, venue, location, budget target, guest-count estimate,
      couple names, roles (partner A / partner B), theme/style.
- [ ] Onboarding wizard: a few questions (date, budget, location, style, size) that
      seed a personalized plan.
- [ ] Wedding dashboard: countdown, % of tasks done, budget used, upcoming items.
- [ ] Ability to invite a co-planner (fiancé, mom, maid of honor) with access to the wedding.

## Phase 2 — Task & checklist engine (the project manager)
*This is the core "planner" feature.*
- [ ] **Task model**: title, description, due date, category, status, assignee, priority.
- [ ] **Checklist templates by timeline** (12+ months, 9, 6, 3, 1 month, week-of, day-of)
      seeded from the couple's wedding date — auto-generate their master to-do list.
- [ ] Check tasks off; progress rolls up to the dashboard.
- [ ] Assign tasks to bridal-party members or the co-planner.
- [ ] **Deliverables**: attach files/notes to tasks (contracts, mood boards, playlists, menus).
- [ ] Timeline / calendar view of everything due.
- [ ] Reminders for upcoming and overdue tasks.

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
