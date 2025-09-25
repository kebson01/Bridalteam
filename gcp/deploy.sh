#!/usr/bin/env bash
set -euo pipefail

# Bridalteam GCE deployment script (Docker + Cloud SQL Auth Proxy)

# 1) Ensure root env exists
if [ ! -f .env.gcp ]; then
  echo "Missing .env.gcp. Copy env.gcp.example to .env.gcp and fill in values." >&2
  exit 1
fi

# 2) Ensure service account key exists
if [ ! -f gcp/key.json ]; then
  echo "Missing gcp/key.json (service account with Cloud SQL Client role)." >&2
  exit 1
fi

# 3) Prepare Laravel env
if [ ! -f website/.env ]; then
  if [ -f website/.env.gcp.example ]; then
    cp website/.env.gcp.example website/.env
  else
    echo "Missing website/.env.gcp.example." >&2
    exit 1
  fi
fi

# 4) Start stack
docker compose -f docker-compose.gce.yml up -d --build

# 5) Wait for Cloud SQL proxy
sleep 8

# 6) Install PHP deps, key, and migrate
docker compose exec web bash -lc "cd /var/www/html/website && composer install --no-dev --prefer-dist && php artisan key:generate && php artisan migrate --force"

echo "Deployed. Visit: http://YOUR_VM_EXTERNAL_IP"


