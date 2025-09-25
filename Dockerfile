# Dockerfile for Bridalteam Project
FROM php:7.4-apache

# Install basic dependencies
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libjpeg-dev \
    libonig-dev \
    libfreetype6-dev \
    zip \
    unzip \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install gd pdo pdo_mysql mbstring

# Install Composer v1 (Laravel 5.5 compatibility)
COPY --from=composer:1 /usr/bin/composer /usr/bin/composer

# Configure Apache: set DocumentRoot to Laravel public and enable overrides
ENV APACHE_DOCUMENT_ROOT=/var/www/html/website/public
RUN sed -ri 's#DocumentRoot /var/www/html#DocumentRoot ${APACHE_DOCUMENT_ROOT}#g' /etc/apache2/sites-available/000-default.conf \
 && sed -ri 's#<Directory /var/www/>#<Directory /var/www/>\n    AllowOverride All#g' /etc/apache2/apache2.conf \
 && a2enmod rewrite

# Copy application files
COPY . /var/www/html/
COPY cloudrun/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
 && chmod -R 755 /var/www/html

EXPOSE 8080
