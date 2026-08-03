# Dependency & Framework Upgrade Plan (Finding #5)

**Status:** Not yet executed. This is a staged plan, not a completed change.

**Why it isn't done in the security-audit branch:** upgrading off Laravel 5.5 is a
multi-step migration with breaking changes across the framework and several
first-party packages. It **must be validated by running the application and its
test suite** at each step. That can't be done safely in a static review
environment, so attempting it blind (and pushing it) would risk breaking
production. This document lays out the path so it can be executed with testing.

---

## Current state

| Package | Current | Status |
|---------|---------|--------|
| PHP (target) | `>=7.0` (runtime image 7.4) | EOL |
| `laravel/framework` | `5.5.*` | EOL 2018 |
| `tymon/jwt-auth` | `0.5.*` | Pre-1.0, unmaintained |
| `laravel/cashier` | `~7.0` | Old |
| `maatwebsite/excel` | `~2.1.0` (PHPExcel) | Abandoned base lib |
| `barryvdh/laravel-cors` | `^0.11.0` | Superseded (merged into Laravel core in 7+) |
| `folklore/image` | `0.3.*` | Old |

Front-end (`website/package.json`) is already reasonably modern
(laravel-mix ^6, axios ^1.6, jquery 3.7). The committed `package-lock.json` /
`yarn.lock` may still resolve older transitive packages — regenerate them
(`npm install` / `yarn install`) and re-check Dependabot after step 0.

> GitHub Dependabot currently reports 712 alerts on the default branch. Expect
> the large majority to clear once the framework and lockfiles are current.

---

## Guiding principles

1. **One major version at a time.** Do not jump 5.5 → 11 in a single step.
   Go 5.5 → 5.8 → 6 → 7 → 8 → 9 → 10 (→ 11). Each hop has an official
   upgrade guide (https://laravel.com/docs/{version}/upgrade).
2. **Green tests before and after every hop.** The current test suite is thin —
   **write characterization tests first** (step 0) so regressions are visible.
3. **Branch per hop.** Keep each version bump as its own reviewable PR.
4. **Runtime-verify the money paths** (login/JWT, Stripe checkout, media upload,
   vendor import) manually in staging after every hop — these use the packages
   most affected by the upgrade.

---

## Stage 0 — Safety net (do this first, low risk)

- Regenerate lockfiles and re-run Dependabot to clear front-end/transitive alerts.
- Add feature tests covering the critical flows so later hops have a safety net:
  - vendor login → JWT issued → authenticated `GET /api/v1/vendors/me`
  - admin middleware: non-admin gets 403, admin gets 200
  - `POST /api/v1/vendors/register` happy path + duplicate-email path
  - `POST /api/v1/vendors/sendvendormessage/{id}` (throttle + escaping)
  - subscription pricing math + Stripe charge amount (cents)
- Stand up a staging environment that mirrors production (DB copy, Stripe test keys).

## Stage 1 — Laravel 5.5 → 5.8

- Follow the 5.6/5.7/5.8 upgrade guides in sequence (they're small hops).
- Replace `barryvdh/laravel-cors` usage understanding; keep it for now.
- Verify `tymon/jwt-auth` 0.5 still boots (it will need replacing at Laravel 6).

## Stage 2 — Laravel 6 (LTS) + JWT + Cashier

- Upgrade to Laravel 6 (LTS — a good stable checkpoint).
- **Replace `tymon/jwt-auth` 0.5 with `tymon/jwt-auth` ^1.0** (config and facade
  changes; middleware alias moves). Re-issue `JWT_SECRET`.
- Upgrade `laravel/cashier` to the version matching Laravel 6.
- **Replace `maatwebsite/excel` 2.1 with ^3.1** (API changed from `Excel::load`
  to import classes). This also removes the abandoned PHPExcel base and its XXE
  exposure at the source (the `libxml_disable_entity_loader` guard added in the
  audit is an interim mitigation, not a substitute).

## Stage 3 — Laravel 7 → 8

- Adopt Laravel's **built-in CORS** (`fruitcake/laravel-cors` / core) and drop
  `barryvdh/laravel-cors`. Port `config/cors.php` (already restricted to
  `ALLOW_ORIGIN` — carry that over).
- Model factories move to classes (Laravel 8). Update `folklore/image` or replace
  with `intervention/image` directly.

## Stage 4 — Laravel 9 → 10 (→ 11) + PHP 8.x

- Move runtime to PHP 8.1+ (update the Dockerfile base image).
- Remove the PHP-7-only `libxml_disable_entity_loader` call once on PHP 8
  (libxml is safe by default there) — it's already guarded by `function_exists`,
  so it no-ops, but clean it up.
- Final Dependabot sweep; enable Dependabot auto-PRs to stay current.

---

## Interim mitigations already applied (see SECURITY-AUDIT.md)

- Vendor import is behind admin auth, validates the upload, and disables libxml
  external-entity loading before parsing (XXE mitigation for the legacy reader).
- These reduce risk **today** but do not replace the upgrade — the EOL framework
  and packages still receive no security patches.

---

## Secrets to rotate at cutover (Finding #10)

Independent of the framework upgrade, rotate on the next deploy:

- `APP_KEY` (the value in `production.env` should be considered known — regenerate).
- `JWT_SECRET` (must be set; app now fails closed without it).
- Database passwords (`DB_PASSWORD`, `DB_ROOT_PASSWORD`) — the committed-example
  values (`SecureDbPass2024!` etc.) are weak/guessable patterns.
- Any Stripe / mail credentials that have lived in plaintext env files.

Store all of these in a secret manager (Cloud Run secrets / Secret Manager),
not in files on the host.
