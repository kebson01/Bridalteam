# Bridalteam — Security Audit

**Date:** 2026-08-03
**Scope:** Source-code (white-box) review of the `kebson01/bridalteam` repository (Laravel API + deployment config). No live/production exploitation was performed.
**Stack:** Laravel 5.5 (PHP `>=7.0`, image runs PHP 7.4), `tymon/jwt-auth` 0.5, `laravel/cashier` 7, `maatwebsite/excel` 2.1, MySQL, Redis, Docker.

---

## Summary

| # | Severity | Issue | Location | Status |
|---|----------|-------|----------|--------|
| 1 | 🔴 Critical | Entire admin API is unauthenticated | `routes/api.php`, `AdminController.php` | ✅ Fixed |
| 2 | 🔴 Critical | JWT signing secret defaults to `changeme`/placeholder → token forgery / account takeover | `config/jwt.php:24`, `cloudrun/entrypoint.sh`, deployment | ✅ Fixed |
| 3 | 🟠 High | CORS allows any origin/method/header | `config/cors.php` | ✅ Fixed |
| 4 | 🟠 High | Unauthenticated HTML/email injection into vendor & admin emails | `VendorController@sendVendorMessage`, `resources/views/email/*` | ✅ Fixed |
| 5 | 🟠 High | End-of-life framework & dependencies (unpatched CVEs); XXE risk in Excel import | `composer.json`, `VendorController@importVendors` | 🟨 Partial |
| 6 | 🟠 High | Unauthenticated abuse endpoints (spam / email-bombing / brute force) | `sendVendorMessage`, `login`, `registerVendor` | ✅ Fixed |
| 7 | 🟡 Medium | Missing null checks → 500 / DoS / info disclosure | multiple controllers | ⬜ Open |
| 8 | 🟡 Medium | Full Stripe charge object written to logs | `VendorController@saveSubscription:695` | ⬜ Open |
| 9 | 🟡 Medium | Stripe charge amount sent in dollars, not cents (billing bug) | `saveSubscription`, `submitSubscription` | ⬜ Open |
| 10 | 🟡 Medium | Plaintext / weak secrets in `production.env`; hardcoded `APP_KEY` in entrypoint | `production.env`, `cloudrun/entrypoint.sh` | 🟨 Partial |
| 11 | ⚪ Low | Debug route, dead code, hardcoded business IDs | `routes/web.php`, `Vendor.php:115` | ⬜ Open |

> **Note:** `production.env` and `.env.gcp` are **not** committed to git history and are excluded by `.dockerignore` (`.env*`, `env.*`), so they are *not* leaked through the repository or the Docker image. They still hold live-looking credentials at rest — see #10.

---

## 1. 🔴 Critical — The entire admin API has no authentication

`routes/api.php` wraps the admin endpoints in a plain `prefix` group with **no `middleware`**:

```php
Route::group(['prefix' => 'admin'], function(){
    Route::get('/vendors',            'AdminController@getAllVendors');   // dumps ALL vendor PII
    Route::post('/vendors/{id}',      'AdminController@saveVendor');
    Route::post('/vendors/{id}/approve','AdminController@approveVendor');
    Route::post('/vendors/{id}/disable','AdminController@disableVendor');
    Route::post('/media/{id}/review', 'AdminController@approveMedia');
    Route::post('/importVendors',     'VendorController@importVendors');
    ...
});
```

`AdminController` (`app/Http/Controllers/AdminController.php`) has **no constructor middleware and no in-method auth checks** — every method runs for anyone.

**Impact:** Any anonymous user can:
- `GET /api/v1/admin/vendors` → dump **every vendor's PII** (owner/contact first+last name, email, phone, physical address) plus all pending claims.
- Approve, disable, or overwrite any vendor record (`saveVendor`, `approveVendor`, `disableVendor`).
- Approve/reject any media (`approveMedia`).
- Bulk-import arbitrary vendor rows (`importVendors`).

This is a textbook Broken Access Control (OWASP A01).

**Fix:** Put the admin group behind real authentication **and** an admin authorization gate. Minimum:
```php
Route::group(['prefix' => 'admin', 'middleware' => ['jwt.auth', 'can:admin']], function(){ ... });
```
Add an `is_admin` flag/role to `users`, register an `admin` Gate/policy, and verify it. Do **not** rely on the URL prefix alone.

**✅ Resolution (applied on this branch):**
- Added a `users.is_admin` boolean column (migration `2026_08_03_000000_add_is_admin_to_users_table`). It is deliberately excluded from `User::$fillable` so it can never be set via mass assignment.
- Added `App\Http\Middleware\AdminAuth` — authenticates the JWT and requires `is_admin`, returning `401`/`403` JSON and failing closed on any error.
- Registered it as the `admin` route middleware (`app/Http/Kernel.php`) and applied it to the admin group: `Route::group(['prefix' => 'admin', 'middleware' => 'admin'], ...)`.
- Added `php artisan user:make-admin {email} [--revoke]` to grant/revoke admin access.

**Action required after deploy:** run the migration (the entrypoint now does this automatically) and promote your admin account: `php artisan user:make-admin you@example.com`.

---

## 2. 🔴 Critical — JWT secret defaults to `changeme` and is never overridden

`config/jwt.php:24`:
```php
'secret' => env('JWT_SECRET', 'changeme'),
```

`JWT_SECRET` is **not set** in `production.env`, `docker-compose*.yml`, `Dockerfile`, or any deploy script (verified by grep). All JWTs are therefore signed with the well-known literal `changeme`.

**Impact:** An attacker who knows the secret can **forge a valid token for any user id**, defeating every `jwt.auth`-protected endpoint and the `vendortoken` web guard — full vendor account takeover: read private inbound leads/messages (`/me/messages`), change/cancel subscriptions, upload media, edit the profile, etc.

**Fix:** Generate a strong random secret and inject it via environment (`php artisan jwt:secret`, then set `JWT_SECRET` in the deployment env). Rotate it (this invalidates existing tokens — acceptable). Never keep the `changeme` fallback in production.

**Additional discovery during the fix:** `cloudrun/entrypoint.sh` **rewrote `.env` on every container start** with hardcoded values — `APP_ENV=local`, `APP_DEBUG=true`, a fixed `APP_KEY`, and `JWT_SECRET=your_jwt_secret_here`. So the Cloud Run deployment was signing tokens with a known placeholder *regardless* of `config/jwt.php`, **and** running with debug enabled in production.

**✅ Resolution (applied on this branch):**
- `config/jwt.php` now uses `env('JWT_SECRET')` with **no fallback** — the app fails closed if the secret is unset.
- `cloudrun/entrypoint.sh` no longer hardcodes any secret. It requires `APP_KEY` and `JWT_SECRET` from the container environment (`: "${JWT_SECRET:?...}"`) and aborts startup if either is missing. It now defaults to `APP_ENV=production` / `APP_DEBUG=false` and builds `.env` entirely from environment variables.
- `JWT_SECRET` wired into `docker-compose.prod.yml` and documented in `production.env.example`, `env.gcp.example` (and already present in `env.production.example`).

**Action required after deploy:** set a real, random `JWT_SECRET` (and `APP_KEY`) in the deployment environment / secret manager. Generate with `php artisan jwt:secret --show` and `php artisan key:generate --show`. Rotating `JWT_SECRET` invalidates all existing vendor sessions (they will need to log in again) — this is expected and desirable given the old secret was public.

---

## 3. 🟠 High — Wide-open CORS

`config/cors.php`:
```php
'allowedOrigins' => ['*'],
'allowedHeaders' => ['*'],
'allowedMethods' => ['*'],
```

Any website can call the API from a victim's browser. `supportsCredentials` is `false`, which limits cookie-based attacks, but the JSON API (including the unauthenticated admin endpoints in #1 and token-in-body flows) is fully reachable cross-origin. The commented-out manual `Access-Control-*` header block in `routes/api.php` also echoed `env('ALLOW_ORIGIN')` — reconcile on one correct mechanism.

**Fix:** Restrict `allowedOrigins` to the known front-end origin(s) (`https://bridalteam.com`) and narrow methods/headers to what's used.

**✅ Resolution (applied on this branch):** `config/cors.php` now derives `allowedOrigins` from the `ALLOW_ORIGIN` env var (comma-separated for multiple hosts), falling back to `APP_URL` — never `*`. Methods are limited to `GET/POST/PUT/DELETE/OPTIONS` and headers to `Content-Type/Authorization/X-Requested-With/Accept/Origin`. Set `ALLOW_ORIGIN` in the deploy env to your real front-end origin(s) (e.g. `https://bridalteam.com,https://www.bridalteam.com`).

---

## 4. 🟠 High — Unauthenticated HTML/email injection

The public, unauthenticated `POST /api/v1/vendors/sendvendormessage/{id}` (`VendorController@sendVendorMessage`) builds an **HTML** email from raw request input:
```php
$message  = "<p>You have a new message from " . $request->firstname . " " . $request->lastname . "</p>";
...
EmailSystem::sendVendorEmail($vendor->id, $message);
```
`EmailSystem` passes that string to the Blade template as `$data['msg']`, and the templates render it **unescaped**:
```
resources/views/email/vendoremail.blade.php:6:  {!! $data['msg'] !!}
resources/views/email/admin.blade.php:1:        {!! $data['msg'] !!}
resources/views/email/vendorclaim.blade.php:6:  {!! $data['msg'] !!}
```
The same pattern reaches the **admin** inbox via `registerVendor` (attacker-controlled business name/email in `sendAdminEmail`).

**Impact:** Anonymous injection of arbitrary HTML (phishing links, spoofed content, tracking pixels) into emails delivered to vendors and site admins. The message body is also stored (`messagejson`) and surfaced in the vendor account UI, so review the client-side rendering for DOM XSS as well.

**Fix:** Escape user data (`{{ }}`) in templates, or build the email from structured fields and let Blade escape them. Never concatenate request input into an HTML string rendered with `{!! !!}`.

**✅ Resolution (applied on this branch):** Every user-controlled value interpolated into these HTML email bodies is now escaped with Laravel's `e()` helper (HTML-encodes injected markup while leaving the intended `<p>`/`<a>` structure intact):
- `VendorController@sendVendorMessage` — `firstname` / `lastname` from the public contact form.
- `VendorController@registerVendor` (claim path) — vendor contact name and user email in the admin notice.
- `Media@submitForReview` — vendor `businessname` in the admin review notice.

**Still recommended (not in this change):** the stored `messagejson` (including the raw message body) is rendered in the vendor account UI client-side — ensure that JS escapes it (avoid `innerHTML`) to close the DOM-XSS path, and consider validating/normalizing `email`/`brideid` on `sendVendorMessage`.

---

## 5. 🟠 High — End-of-life framework/dependencies & Excel-import XXE

`composer.json` pins Laravel `5.5.*` (EOL since 2018) on PHP `>=7.0`, plus `tymon/jwt-auth 0.5.*`, `laravel/cashier ~7.0`, and `maatwebsite/excel ~2.1.0` (built on the abandoned **PHPExcel**). These carry publicly known, unpatched vulnerabilities.

`VendorController@importVendors` (reachable **unauthenticated**, see #1) calls `Excel::load($file->getRealPath(), ...)` on an uploaded file. Old PHPExcel-based readers are historically vulnerable to **XXE** via crafted `.xlsx`, enabling local file read / SSRF.

**Fix:** Prioritize upgrading off Laravel 5.5 to a supported LTS; at minimum move `maatwebsite/excel` to a maintained major version and confirm the XML reader disables external entities. Restrict + authenticate the import endpoint immediately (#1).

**🟨 Partial resolution (applied on this branch):** the import endpoint is now behind admin auth (see #1), and `importVendors` was hardened:
- Rejects anything that isn't a valid uploaded `.xls` / `.xlsx` / `.csv`, and caps size at 5 MB.
- Calls `libxml_disable_entity_loader(true)` before parsing to block **XXE** in the legacy PHPExcel reader (PHP 7.x; the function is gone in PHP 8, where libxml defaults to safe).

**Still open:** the underlying framework/dependency upgrade off EOL Laravel 5.5 and `maatwebsite/excel` 2.1. GitHub Dependabot reports 712 alerts on this repo — this needs a dedicated upgrade effort, tracked separately.

---

## 6. 🟠 High — Unauthenticated abuse endpoints (spam, email-bombing, brute force)

- `sendVendorMessage` — no CAPTCHA, no per-target rate limit → mass spam / email-bombing of vendors (each call sends an email via `EmailSystem`).
- `login` — only the global `throttle:60,1` (per-IP, per-minute) applies → credential brute-forcing / stuffing is feasible.
- `registerVendor`, `filterVendors`, `getVendorContactFormUI` — unauthenticated and unthrottled beyond the global limit.

**Fix:** Add a dedicated stricter throttle to `login` (e.g. `throttle:5,1` keyed on email+IP), add CAPTCHA + rate limiting to `sendVendorMessage`/`registerVendor`.

**✅ Resolution (applied on this branch):** per-route throttles added in `routes/api.php` (on top of the existing global `throttle:60,1`):
- `login` → `throttle:5,1` (5/min per IP) to slow brute-force/credential-stuffing.
- `register` → `throttle:5,10` (5 per 10 min) against automated account creation.
- `sendvendormessage/{id}` → `throttle:5,10` to stop spam / vendor email-bombing.
- `verify` → `throttle:10,1`.

**Still recommended:** add a CAPTCHA to the public contact form and registration (front-end + a verification secret) for stronger bot resistance — rate-limiting alone slows but does not stop distributed abuse.

---

## 7. 🟡 Medium — Missing null checks (500 / DoS / info disclosure)

Several methods dereference a model without checking for `null`, so a bad/guessed id returns a 500 (and a stack trace if `APP_DEBUG` is ever on):
- `VendorController@getVendor` — `$vendor->media = ...` when slug not found (`:163`).
- `MediaController@getMedia` — `Vendor::find($media->vendor_id)` with no media guard (`:336`).
- `MediaController@getPublicMedia` — `$vendor->businessname` when vendor missing (`:167`).
- `PageController@showVendorCategory` — `$category->id` when category missing (`:165`).
- `Vendor@getMessage` — `$message->unread = false` on a null result (`:154`).

**Fix:** Guard every `find()`/`first()` result and return a proper 404/JSON error.

---

## 8. 🟡 Medium — Sensitive payment data logged

`VendorController@saveSubscription:695`:
```php
Log::info('charge result', $charge);
```
Writes the full Stripe charge object (customer id, outcome, risk data) to application logs.

**Fix:** Log only a charge id / status; never the full object.

---

## 9. 🟡 Medium — Stripe amount unit bug (billing correctness)

`saveSubscription` and `submitSubscription` pass `'amount' => floatval($pricing['total'])`. Stripe expects the amount in the currency's **smallest unit (cents)**. A $199.00 plan is charged as 199 cents = **$1.99**. Not an attacker-injected price (pricing is recomputed server-side from the DB, which is good), but a real revenue/integrity bug.

**Fix:** `'amount' => (int) round($pricing['total'] * 100)`.

---

## 10. 🟡 Medium — Secrets at rest

`production.env` contains a real-looking `APP_KEY`, guessable DB passwords (`SecureDbPass2024!`, `SecureRootPass2024!`), and no `JWT_SECRET`. It is **not** in git history and **not** baked into the image (excluded by `.dockerignore`), so exposure is limited to whoever can read the deploy host. Still: rotate `APP_KEY` and the DB passwords, use a secrets manager, and set a strong `JWT_SECRET` (#2).

---

## 11. ⚪ Low — Hygiene

- `routes/web.php` ships a `GET /debug-route` in production — remove.
- `Vendor@getMonthlyMediaImageLimit:115` hardcodes `if ($this->id != 18202)` business logic.
- Large blocks of dead "Old Endpoints" in `VendorController` (`vendorLogin`, `submitSubscription`, `uploadMedia`, `getMediaEditorUI`, …) increase attack surface — prune.
- Stray root-level source files (`PageController_HOTFIX.php`, `ago`) — remove from the repo.

---

## Recommended remediation order

1. **Authenticate + authorize the admin API** (#1) and set a real **`JWT_SECRET`** (#2) — these are actively exploitable today.
2. Lock down **CORS** (#3) and fix **email HTML injection** (#4).
3. Add **rate limiting / CAPTCHA** and restrict the **Excel import** (#5, #6).
4. Plan the **framework/dependency upgrade** off EOL Laravel 5.5 (#5).
5. Clean up null-handling, logging, the Stripe unit bug, and secrets (#7–#11).

I reviewed source only and did not test against the live site. I can implement any of the above fixes on this branch — the fastest, highest-impact change is adding auth middleware to the admin routes and provisioning `JWT_SECRET`. Say the word and I'll do it.
