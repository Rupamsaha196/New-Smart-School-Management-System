# ==============================================================================
# SMART SCHOOL MANAGEMENT SYSTEM - RENDER & PRODUCTION DOCKERFILE
# Infosof Technologies 2026
#
# Production PHP 8.2 + Apache Container
# Supports Render dynamic $PORT, MySQL 8 / TiDB Cloud TLS/SSL, CodeIgniter 3.x
# ==============================================================================

FROM php:8.2-apache

# Set non-interactive debian frontend
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies and PHP build requirements
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    git \
    unzip \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    libonig-dev \
    libicu-dev \
    libsqlite3-dev \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Configure & Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_mysql \
        mysqli \
        pdo_sqlite \
        gd \
        mbstring \
        zip \
        intl \
        bcmath \
        opcache

# Recommended PHP production settings
RUN { \
    echo 'opcache.enable=1'; \
    echo 'opcache.memory_consumption=128'; \
    echo 'opcache.interned_strings_buffer=8'; \
    echo 'opcache.max_accelerated_files=10000'; \
    echo 'opcache.revalidate_freq=2'; \
    echo 'opcache.fast_shutdown=1'; \
    echo 'upload_max_filesize=64M'; \
    echo 'post_max_size=64M'; \
    echo 'memory_limit=256M'; \
    echo 'max_execution_time=120'; \
    echo 'date.timezone=UTC'; \
} > /usr/local/etc/php/conf.d/smart-school-custom.ini

# Enable Apache modules required by CodeIgniter and Frontend
RUN a2enmod rewrite headers mime deflate

# Configure Apache virtual host & AllowOverride for .htaccess
RUN { \
    echo '<Directory /var/www/html>'; \
    echo '    Options -Indexes +FollowSymLinks'; \
    echo '    AllowOverride All'; \
    echo '    Require all granted'; \
    echo '</Directory>'; \
    echo 'ServerTokens Prod'; \
    echo 'ServerSignature Off'; \
} > /etc/apache2/conf-available/smart-school.conf \
    && a2enconf smart-school

# Set working directory
WORKDIR /var/www/html

# Copy application files into the container
COPY . /var/www/html/

# Copy & set permissions for custom entrypoint
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Ensure write permissions for runtime cache, logs, and database directories
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html/backend_codeigniter/application/cache \
    && chmod -R 775 /var/www/html/backend_codeigniter/application/logs

# Render exposes $PORT (default 10000)
EXPOSE 10000 80

# Health check probe against the /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT:-10000}/health || curl -f http://localhost:80/health || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["apache2-foreground"]
