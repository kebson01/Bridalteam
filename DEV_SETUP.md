# Local Development Setup

The app targets **Laravel 5.5 / PHP 7.4**, so run it in Docker rather than on a
modern host PHP (it will not boot on PHP 8.x).

## Prerequisites
- Docker Desktop (or Docker Engine + Compose v2)

## Start everything
```bash
docker-compose up --build
```
This builds the PHP 7.4 + Apache image, starts MySQL 8, then on boot the
container automatically:
1. writes a local `.env`,
2. generates an `APP_KEY` and a real `JWT_SECRET` (token auth needs this),
3. waits for the database,
4. runs `php artisan migrate --force`,
5. seeds the wedding-planning checklist templates (idempotent).

## Open the apps
| App | URL |
|---|---|
| **Couple planner (Phase 1)** | http://localhost/plan |
| Vendor marketplace (existing) | http://localhost/ |
| Couple API base | http://localhost/api/v1/couple |

## Try the couple flow
1. Go to http://localhost/plan
2. Create an account → onboarding wizard (names, date, city, guests, budget)
3. Land on the dashboard: countdown, progress bar, and an auto-generated
   checklist grouped by timeline (12mo → day-of). Check tasks off; progress
   updates live. Add your own tasks too.

## Useful commands
```bash
docker-compose exec web bash                       # shell into the app container
docker-compose exec web php artisan migrate:status
docker-compose exec web php artisan db:seed --class=TaskTemplatesSeeder
docker-compose exec web vendor/bin/phpunit --filter WeddingPlannerTest
docker-compose down                                # stop
docker-compose down -v                             # stop + wipe the DB volume
```

## Configuration notes
- **Secrets:** `production.env` and `website/.env` are gitignored. Never commit
  real credentials. `JWT_SECRET` can be injected as an env var (see
  `docker-compose.yml`); otherwise the entrypoint generates one at boot.
- **Vendor dir:** `docker-compose.yml` keeps an anonymous volume at
  `/var/www/html/website/vendor` so the bind mount doesn't hide the
  `composer install` output from the image build.

## Known follow-ups (Phase 0 backlog)
- `cloudrun/entrypoint.sh` currently rewrites `.env` with local values on every
  boot. Before the DigitalOcean production deploy, make it respect injected
  production env (don't overwrite when `APP_ENV=production`).
- The DB passwords previously committed in `production.env` are still in git
  history — rotate them before going live.
