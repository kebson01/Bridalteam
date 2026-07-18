# Bridal Team — Data Model Design (couple-facing app)

This is the schema design for the couple/planner side. It is built to sit
**alongside the existing tables** (`users`, `vendors`, `vendor_categories`,
`vendor_regions`, `vendor_messages`, …) with no breaking changes.

Conventions match the current codebase: **Laravel 5.5**, models in `app/`
under namespace `App\`, integer auto-increment PKs, `timestamps()` on every
table, JWT auth via the existing `users` table.

## Key reuse decision
The `users` table is already the shared account: a `Vendor` has a `user_id`.
So **a couple is just a `User`** — no separate account system. We add an
optional `account_type` to make intent explicit, and hang a `Wedding` off the
user. Existing vendor records keep working untouched.

---

## Entity-relationship overview

```
users (existing)
  └─ 1─* weddings              (owner_user_id)                     Phase 1
weddings
  ├─ 1─* wedding_members       (co-planners + bridal party)        Phase 1/4
  ├─ 1─* tasks                                                     Phase 2
  ├─ 1─* budget_items                                             Phase 3
  ├─ 1─* wedding_vendors ──*─1 vendors (existing)                 Phase 3/5
  └─ 1─* guests                                                    Phase 4
tasks
  └─ 1─* deliverables          (files/notes on a task)            Phase 2
task_templates (seed data) ──generates──> tasks                   Phase 2
wedding_vendors
  └─ 1─* vendor_messages (existing, add wedding_id)               Phase 5
```

---

## Phase 1 — Accounts & Wedding

### `users` (existing — additive change only)
| column | type | notes |
|---|---|---|
| `account_type` | `enum('couple','vendor','admin')` nullable, default `null` | Purely for clarity/routing. Existing rows stay `null` and behave as before. |

No other change. Couples authenticate through the same JWT flow vendors use.

### `weddings` — the core project
| column | type | notes |
|---|---|---|
| `id` | increments | |
| `owner_user_id` | unsignedInteger, FK→users | the account that created it |
| `partner1_name` | string | e.g. the bride |
| `partner2_name` | string nullable | e.g. the groom |
| `wedding_date` | date nullable | drives the whole timeline; may be TBD |
| `is_date_tentative` | boolean, default true | |
| `venue_name` | string nullable | |
| `location_city` | string nullable | |
| `location_region` | string nullable | maps to existing `vendor_regions` for price lookup |
| `guest_estimate` | unsignedInteger nullable | |
| `budget_total` | decimal(10,2) nullable | |
| `style` | string nullable | e.g. rustic, modern, classic |
| `status` | `enum('planning','completed','archived')`, default `planning` | |
| `timestamps` | | |

### `wedding_members` — co-planners & bridal party (Phase 1 + 4)
| column | type | notes |
|---|---|---|
| `id` | increments | |
| `wedding_id` | FK→weddings | |
| `user_id` | unsignedInteger nullable, FK→users | set once they accept an invite; null while pending |
| `name` | string | |
| `email` | string nullable | for the invite |
| `role` | `enum('owner','co_planner','maid_of_honor','best_man','bridesmaid','groomsman','family','other')` | |
| `invite_token` | string nullable | for accept-invite links |
| `invite_status` | `enum('pending','accepted','declined')`, default `pending` | |
| `can_edit` | boolean, default false | co-planners true; party members usually false |
| `timestamps` | | |

---

## Phase 2 — Tasks & checklist engine

### `tasks`
| column | type | notes |
|---|---|---|
| `id` | increments | |
| `wedding_id` | FK→weddings | |
| `title` | string | |
| `description` | text nullable | |
| `category` | string | venue, attire, catering, photography, stationery, legal, etc. |
| `status` | `enum('todo','in_progress','done','skipped')`, default `todo` | |
| `priority` | `enum('low','normal','high')`, default `normal` | |
| `due_date` | date nullable | computed from the timeline template + wedding date |
| `timeline_offset_days` | integer nullable | days before the wedding this is "due" (from template) |
| `assigned_member_id` | FK→wedding_members nullable | |
| `template_id` | FK→task_templates nullable | provenance if auto-generated |
| `sort_order` | integer, default 0 | |
| `completed_at` | timestamp nullable | |
| `timestamps` | | |

### `task_templates` — seed data that generates a couple's starter checklist
| column | type | notes |
|---|---|---|
| `id` | increments | |
| `title` | string | |
| `description` | text nullable | |
| `category` | string | |
| `timeline_bucket` | `enum('12mo_plus','9mo','6mo','3mo','1mo','week_of','day_of','after')` | |
| `timeline_offset_days` | integer | e.g. 270 = ~9 months before |
| `default_priority` | `enum('low','normal','high')`, default `normal` | |
| `applies_if` | json nullable | optional conditions (e.g. only if guest_estimate > 100) |
| `sort_order` | integer | |

On wedding creation (or when the date is set), we copy matching templates into
`tasks`, setting `due_date = wedding_date - timeline_offset_days`.

### `deliverables` — files/notes attached to a task
| column | type | notes |
|---|---|---|
| `id` | increments | |
| `task_id` | FK→tasks | |
| `wedding_id` | FK→weddings | denormalized for easy querying |
| `type` | `enum('file','note','link')` | reuses existing media storage patterns for files |
| `title` | string | |
| `body` | text nullable | for notes |
| `file_path` | string nullable | for files (S3/local, same as vendor media) |
| `url` | string nullable | for links |
| `uploaded_by_user_id` | FK→users nullable | |
| `timestamps` | | |

---

## Phase 3 — Budget & vendor pricing

### `budget_items`
| column | type | notes |
|---|---|---|
| `id` | increments | |
| `wedding_id` | FK→weddings | |
| `category` | string | venue, catering, photography, … |
| `label` | string | |
| `estimated_cost` | decimal(10,2), default 0 | |
| `actual_cost` | decimal(10,2) nullable | |
| `amount_paid` | decimal(10,2), default 0 | |
| `due_date` | date nullable | deposit/final payment due |
| `vendor_id` | FK→vendors nullable | links to a real marketplace vendor if chosen |
| `wedding_vendor_id` | FK→wedding_vendors nullable | |
| `timestamps` | | |

### `wedding_vendors` — shortlist/booking bridge to the existing marketplace
| column | type | notes |
|---|---|---|
| `id` | increments | |
| `wedding_id` | FK→weddings | |
| `vendor_id` | FK→vendors (existing) | |
| `vendor_category_id` | FK→vendor_categories (existing) | |
| `status` | `enum('shortlisted','inquired','quoted','booked','declined')`, default `shortlisted` | |
| `quoted_amount` | decimal(10,2) nullable | logged against budget |
| `notes` | text nullable | |
| `timestamps` | | |

Vendor **price lookup** needs no new table — it reads the existing
`vendors` / pricing data, filtered by `location_region` and category.

---

## Phase 4 — Guests

### `guests`
| column | type | notes |
|---|---|---|
| `id` | increments | |
| `wedding_id` | FK→weddings | |
| `first_name` / `last_name` | string | |
| `email` / `phone` | string nullable | |
| `party_size` | unsignedInteger, default 1 | includes plus-ones |
| `rsvp_status` | `enum('invited','yes','no','maybe')`, default `invited` | |
| `meal_choice` | string nullable | |
| `group_label` | string nullable | e.g. "bride's family" |
| `seating_note` | string nullable | |
| `timestamps` | | |

---

## Phase 5 — Vendor collaboration (extends existing)

### `vendor_messages` (existing — additive)
| column | type | notes |
|---|---|---|
| `wedding_id` | unsignedInteger nullable, FK→weddings | ties an inquiry to a couple's wedding so threads live in their dashboard |
| `thread_id` | unsignedInteger nullable | groups back-and-forth into a conversation |

---

## Phase 6 — Planner intelligence (mostly config + logic, minimal schema)

- **"Did you think of this?"** prompts live in `task_templates` (flagged rows)
  plus a small `planner_prompts` config table if we want editable content.
- **Suggestions / budget % guidance** are computed at request time from the
  wedding's date, budget, size, and region against vendor data — no heavy
  schema needed initially.

---

## Eloquent relationships (summary)
- `User hasMany Wedding` (owner_user_id); `User belongsToMany Wedding` through `wedding_members`.
- `Wedding belongsTo User (owner)`, `hasMany` tasks, budgetItems, guests, weddingVendors, members.
- `Task belongsTo Wedding`, `hasMany Deliverable`, `belongsTo WeddingMember (assignee)`.
- `WeddingVendor belongsTo Wedding`, `belongsTo Vendor`, `belongsTo VendorCategory`.
- `BudgetItem belongsTo Wedding`, optional `belongsTo Vendor`.

---

## Migration order (safe, additive)
1. Alter `users` (add `account_type`).
2. `create weddings`.
3. `create wedding_members`.
4. `create task_templates` + seeder.
5. `create tasks`.
6. `create deliverables`.
7. `create budget_items`.
8. `create wedding_vendors`.
9. `create guests`.
10. Alter `vendor_messages` (add `wedding_id`, `thread_id`).

**MVP subset (build now):** steps 1–6 give couple accounts → wedding →
auto-generated checklist → deliverables. That is the smallest end-to-end slice.
