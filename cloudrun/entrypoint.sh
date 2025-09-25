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

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env <<EOF
APP_NAME=Bridalteam
APP_ENV=production
APP_KEY=
APP_DEBUG=true
APP_URL=${APP_URL:-http://localhost}

DB_CONNECTION=mysql
DB_HOST=${DB_HOST:-127.0.0.1}
DB_PORT=${DB_PORT:-3306}
DB_DATABASE=${DB_DATABASE:-bridalteam}
DB_USERNAME=${DB_USERNAME:-root}
DB_PASSWORD=${DB_PASSWORD:-}

CACHE_DRIVER=file
SESSION_DRIVER=file
QUEUE_DRIVER=sync

JWT_SECRET=your_jwt_secret_here
EOF
fi

# Generate app key if needed
if ! grep -q "APP_KEY=base64:" .env 2>/dev/null; then
    echo "Generating Laravel app key..."
    php artisan key:generate --force
fi

# Set proper permissions for Laravel
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# Start Apache in foreground
exec apache2-foreground


