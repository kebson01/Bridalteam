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

# Start Apache in foreground
exec apache2-foreground


