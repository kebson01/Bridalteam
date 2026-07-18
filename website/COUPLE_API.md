# Couple Planner API (MVP)

Base URL: `/api/v1/couple`. All authenticated routes take a JWT
`Authorization: Bearer <token>` header (same JWT scheme as vendors).

## Auth
| Method | Path | Auth | Body |
|---|---|---|---|
| POST | `/register` | no | `firstname, lastname, email, password` |
| POST | `/login` | no | `email, password` → `{ token }` |
| GET  | `/me` | yes | — → account + their weddings |

## Weddings
| Method | Path | Notes |
|---|---|---|
| GET | `/weddings` | list the couple's weddings |
| POST | `/weddings` | create a wedding; **auto-generates the starter checklist** from templates |
| GET | `/weddings/{id}` | wedding + `progress` (countdown, % done) + members |
| PUT | `/weddings/{id}` | update details; changing the date recomputes task due dates |

Create body: `partner1_name` (required), `partner2_name, wedding_date,
venue_name, location_city, location_region, guest_estimate, budget_total, style`.

## Tasks (checklist)
| Method | Path | Notes |
|---|---|---|
| GET | `/weddings/{id}/tasks` | supports `?status=` and `?category=` filters; returns `progress` too |
| POST | `/weddings/{id}/tasks` | add a custom task (`title` required) |
| PUT | `/weddings/{id}/tasks/{taskId}` | update — e.g. `{ "status": "done" }` to check off |
| DELETE | `/weddings/{id}/tasks/{taskId}` | remove a task |

## Deliverables (attachments on a task)
| Method | Path | Notes |
|---|---|---|
| GET | `/weddings/{id}/tasks/{taskId}/deliverables` | list |
| POST | `/weddings/{id}/tasks/{taskId}/deliverables` | add a `note` or `link` (`title` required); file upload comes later |
| DELETE | `/weddings/{id}/tasks/{taskId}/deliverables/{deliverableId}` | remove |

## Co-planners & bridal party
| Method | Path | Notes |
|---|---|---|
| GET | `/weddings/{id}/members` | list members (owner + invitees) |
| POST | `/weddings/{id}/members` | invite (`name` required; `email`, `role`); returns an `invite_token` |
| PUT | `/weddings/{id}/members/{memberId}` | update role / edit rights |
| DELETE | `/weddings/{id}/members/{memberId}` | remove (owner cannot be removed) |
| POST | `/invites/accept` | the logged-in invitee accepts via `{ invite_token }` |

Roles: `co_planner, maid_of_honor, best_man, bridesmaid, groomsman, family, other`.
Emailing the invite link is deferred to Phase 7 (notifications); for now the
token is returned in the response so a link can be shared manually.

## Frontend
The couple web app is served at **`/plan`** (static SPA in
`public/plan/index.html`) — account → onboarding wizard → dashboard + checklist.

## Setup
```bash
php artisan migrate --seed        # creates tables + seeds the checklist templates
```
The `TaskTemplatesSeeder` ships ~40 real planning tasks across the timeline
(12mo → day-of → after). Creating a wedding with a date copies the applicable
ones into that wedding's task list with due dates derived from the date.

## Ownership
Every couple route enforces that the wedding belongs to the authenticated
user; others get `404`. See `App\Http\Controllers\Concerns\ResolvesWedding`.
