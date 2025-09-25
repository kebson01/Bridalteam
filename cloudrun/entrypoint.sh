#!/usr/bin/env bash
set -euo pipefail

# Cloud Run expects the app to listen on $PORT
: "${PORT:=8080}"

# Configure Apache to listen on $PORT
sed -ri "s/^Listen 80$/Listen ${PORT}/" /etc/apache2/ports.conf || true
sed -ri "s/:80>/:${PORT}>/g" /etc/apache2/sites-available/000-default.conf || true

# Ensure Laravel public is accessible
cat >/etc/apache2/conf-available/laravel.conf <<CONF
<Directory "/var/www/html/website/public">
    Options Indexes FollowSymLinks
    AllowOverride All
    Require all granted
</Directory>
CONF
a2enconf laravel >/dev/null 2>&1 || true
a2enmod rewrite >/dev/null 2>&1 || true

exec apache2-foreground


