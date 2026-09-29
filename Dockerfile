FROM php:8.3-apache

# Set maintainer metadata
LABEL maintainer="Infosof Technologies <support@infosof.com>"
LABEL description="Smart School Management System - Render Cloud Deployment"

# Install system utilities and library dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libzip-dev \
    zip \
    unzip \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libicu-dev \
    libsqlite3-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Configure & Install essential PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo \
        pdo_mysql \
        pdo_sqlite \
        mysqli \
        zip \
        gd \
        intl \
        opcache

# Production PHP settings & opcache optimization
RUN { \
        echo 'opcache.memory_consumption=128'; \
        echo 'opcache.interned_strings_buffer=8'; \
        echo 'opcache.max_accelerated_files=4000'; \
        echo 'opcache.revalidate_freq=2'; \
        echo 'opcache.fast_shutdown=1'; \
        echo 'opcache.enable_cli=1'; \
        echo 'upload_max_filesize=32M'; \
        echo 'post_max_size=32M'; \
        echo 'memory_limit=256M'; \
        echo 'date.timezone=Asia/Kolkata'; \
        echo 'display_errors=Off'; \
        echo 'log_errors=On'; \
    } > /usr/local/etc/php/conf.d/smart-school-custom.ini

# Enable Apache modules required for CodeIgniter & SPA routing
RUN a2enmod rewrite headers mime

# Configure Apache DocumentRoot & AllowOverride for .htaccess support
RUN sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

# Set working directory in container
WORKDIR /var/www/html

# Copy application source code into the web root
COPY . /var/www/html/

# Copy and prepare entrypoint script (ensure Unix line endings)
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh && chmod +x /usr/local/bin/docker-entrypoint.sh

# Ensure storage, cache and log directories exist with full write access
RUN mkdir -p \
        /var/www/html/backend_codeigniter/application/cache \
        /var/www/html/backend_codeigniter/application/logs \
        /var/www/html/database \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html \
    && chmod -R 777 /var/www/html/backend_codeigniter/application/cache \
    && chmod -R 777 /var/www/html/backend_codeigniter/application/logs

# Default fallback port (Render injects dynamic $PORT environment variable, e.g. 10000)
ENV PORT=10000
EXPOSE ${PORT}

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
