#!/bin/bash
set -euo pipefail

# Cloud Run expects the app to listen on $PORT
export PORT=${PORT:-8080}

echo "Starting Apache on port $PORT"

# Configure Apache to listen on $PORT
sed -ri "s/^Listen 80$/Listen ${PORT}/" /etc/apache2/ports.conf
sed -ri "s/:80>/:${PORT}>/g" /etc/apache2/sites-available/000-default.conf

# Ensure Laravel public is accessible
cat >/etc/apache2/conf-available/laravel.conf <<CONF
<Directory "/var/www/html/website/public">
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
</Directory>
CONF

a2enconf laravel
a2enmod rewrite

# Laravel setup
cd /var/www/html/website

# --- Fail closed on missing secrets -----------------------------------------
# Secrets MUST be supplied through the container environment (Cloud Run env
# vars / Secret Manager, docker-compose `environment`, etc). They are never
# hardcoded here. A missing secret aborts startup rather than silently falling
# back to a well-known value.
: "${APP_KEY:?APP_KEY is required. Generate one with 'php artisan key:generate --show' and set it in the deploy environment.}"
: "${JWT_SECRET:?JWT_SECRET is required. Generate one with 'php artisan jwt:secret --show' and set it in the deploy environment.}"

# Environment-driven configuration with safe production defaults.
APP_ENV="${APP_ENV:-production}"
APP_DEBUG="${APP_DEBUG:-false}"
APP_NAME="${APP_NAME:-Bridalteam}"
APP_URL="${APP_URL:-http://localhost}"

DB_CONNECTION="${DB_CONNECTION:-mysql}"
DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-3306}"
DB_DATABASE="${DB_DATABASE:-bridalteam}"
DB_USERNAME="${DB_USERNAME:-bridalteam_user}"
DB_PASSWORD="${DB_PASSWORD:-}"

CACHE_DRIVER="${CACHE_DRIVER:-file}"
SESSION_DRIVER="${SESSION_DRIVER:-file}"
QUEUE_DRIVER="${QUEUE_DRIVER:-sync}"
REDIS_HOST="${REDIS_HOST:-127.0.0.1}"
REDIS_PASSWORD="${REDIS_PASSWORD:-null}"
REDIS_PORT="${REDIS_PORT:-6379}"

MAIL_DRIVER="${MAIL_DRIVER:-smtp}"
MAIL_HOST="${MAIL_HOST:-smtp.mailtrap.io}"
MAIL_PORT="${MAIL_PORT:-2525}"
MAIL_USERNAME="${MAIL_USERNAME:-null}"
MAIL_PASSWORD="${MAIL_PASSWORD:-null}"
MAIL_ENCRYPTION="${MAIL_ENCRYPTION:-null}"

ALLOW_ORIGIN="${ALLOW_ORIGIN:-$APP_URL}"
SEO_SITETITLE="${SEO_SITETITLE:-Bridal Team - Wedding Planning Made Simple}"

echo "Writing .env (APP_ENV=$APP_ENV, APP_DEBUG=$APP_DEBUG)..."
rm -f .env
cat > .env <<EOF
APP_NAME=${APP_NAME}
APP_ENV=${APP_ENV}
APP_KEY=${APP_KEY}
APP_DEBUG=${APP_DEBUG}
APP_URL=${APP_URL}

LOG_CHANNEL=stack

DB_CONNECTION=${DB_CONNECTION}
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_DATABASE=${DB_DATABASE}
DB_USERNAME=${DB_USERNAME}
DB_PASSWORD=${DB_PASSWORD}

BROADCAST_DRIVER=log
CACHE_DRIVER=${CACHE_DRIVER}
SESSION_DRIVER=${SESSION_DRIVER}
SESSION_LIFETIME=120
QUEUE_DRIVER=${QUEUE_DRIVER}

REDIS_HOST=${REDIS_HOST}
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_PORT=${REDIS_PORT}

MAIL_DRIVER=${MAIL_DRIVER}
MAIL_HOST=${MAIL_HOST}
MAIL_PORT=${MAIL_PORT}
MAIL_USERNAME=${MAIL_USERNAME}
MAIL_PASSWORD=${MAIL_PASSWORD}
MAIL_ENCRYPTION=${MAIL_ENCRYPTION}

JWT_SECRET=${JWT_SECRET}

ALLOW_ORIGIN=${ALLOW_ORIGIN}
SEO_SITETITLE="${SEO_SITETITLE}"
EOF

# Clear Laravel caches to ensure config/routes reflect the fresh .env
echo "Clearing Laravel caches..."
php artisan route:clear
php artisan config:clear
php artisan view:clear

# Apply database migrations (adds the users.is_admin column, etc.)
echo "Running migrations..."
php artisan migrate --force || echo "WARNING: migrations failed or database unavailable; continuing."

# Set proper permissions for Laravel
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# Start Apache in foreground
exec apache2-foreground
