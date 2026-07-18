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

# Remove any existing .env file and create a new one
rm -f .env
echo "Creating .env file..."
cat > .env <<'EOF'
APP_NAME=Bridalteam
APP_ENV=local
APP_KEY=base64:lMPLHbZNxs7gCFYIWcmijeP+aOJYYg61th1l1vCBjgI=
APP_DEBUG=true
APP_URL=http://localhost

LOG_CHANNEL=stack

DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=bridalteam
DB_USERNAME=bridalteam_user
DB_PASSWORD=userpassword

BROADCAST_DRIVER=log
CACHE_DRIVER=file
SESSION_DRIVER=file
SESSION_LIFETIME=120
QUEUE_DRIVER=sync

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_DRIVER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null

PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
PUSHER_APP_CLUSTER=mt1

MIX_PUSHER_APP_KEY="${PUSHER_APP_KEY}"
MIX_PUSHER_APP_CLUSTER="${PUSHER_APP_CLUSTER}"

JWT_SECRET=CHANGE_ME_AT_BOOT

ALLOW_ORIGIN=http://localhost
SEO_SITETITLE="Bridal Team - Wedding Planning Made Simple"
EOF

# Generate app key if needed
if ! grep -q "APP_KEY=base64:" .env 2>/dev/null; then
    echo "Generating Laravel app key..."
    php artisan key:generate --force
fi

# Ensure a real JWT secret exists (token auth is broken without one).
# Prefer an injected env var; otherwise generate a strong random secret.
if grep -q "JWT_SECRET=CHANGE_ME_AT_BOOT" .env 2>/dev/null; then
    JWT_VALUE="${JWT_SECRET:-$(openssl rand -base64 48 | tr -d '\n/+=' | cut -c1-48)}"
    sed -ri "s#^JWT_SECRET=.*#JWT_SECRET=${JWT_VALUE}#" .env
    echo "JWT secret set."
fi

# Clear Laravel caches to ensure routes work
echo "Clearing Laravel caches..."
php artisan route:clear
php artisan config:clear
php artisan view:clear

# Export DB settings from .env so the readiness check below can see them.
export DB_HOST=$(grep -E '^DB_HOST=' .env | cut -d= -f2-)
export DB_PORT=$(grep -E '^DB_PORT=' .env | cut -d= -f2-)
export DB_USERNAME=$(grep -E '^DB_USERNAME=' .env | cut -d= -f2-)
export DB_PASSWORD=$(grep -E '^DB_PASSWORD=' .env | cut -d= -f2-)

# Wait for the database to accept connections, then run migrations + seed.
echo "Waiting for database..."
for i in $(seq 1 30); do
    if php -r '
        try {
            new PDO(
                "mysql:host=".getenv("DB_HOST").";port=".getenv("DB_PORT"),
                getenv("DB_USERNAME"), getenv("DB_PASSWORD")
            );
            exit(0);
        } catch (Exception $e) { exit(1); }
    ' 2>/dev/null; then
        echo "Database is ready."
        break
    fi
    echo "  db not ready yet ($i/30)..."
    sleep 2
done

echo "Running migrations..."
php artisan migrate --force || echo "WARNING: migrations failed (continuing)"

echo "Seeding starter data (idempotent)..."
php artisan db:seed --class=TaskTemplatesSeeder --force || echo "WARNING: seed failed (continuing)"

# Set proper permissions for Laravel
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# Start Apache in foreground
exec apache2-foreground


