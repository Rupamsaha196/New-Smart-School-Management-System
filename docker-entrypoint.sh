#!/bin/bash
set -e

# ==============================================================================
# SMART SCHOOL MANAGEMENT SYSTEM - DOCKER RUNTIME ENTRYPOINT
# Infosof Technologies 2026
# ==============================================================================

# 1. Configure Apache listening port to match Render's dynamic $PORT (default 10000 or 80)
PORT="${PORT:-10000}"
echo "[Smart School] Configuring Apache to listen on port: ${PORT}"

# Dynamically adjust ports.conf and default vhost
sed -i "s/Listen .*/Listen ${PORT}/" /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:[0-9]*>/<VirtualHost \*:${PORT}>/" /etc/apache2/sites-available/000-default.conf

# 2. Ensure application directories exist and have correct permissions
mkdir -p /var/www/html/backend_codeigniter/application/cache
mkdir -p /var/www/html/backend_codeigniter/application/logs
chown -R www-data:www-data /var/www/html/backend_codeigniter/application/cache
chown -R www-data:www-data /var/www/html/backend_codeigniter/application/logs
chmod -R 775 /var/www/html/backend_codeigniter/application/cache
chmod -R 775 /var/www/html/backend_codeigniter/application/logs

# 3. Automatic Database Migration & Seeding if DB credentials or AUTO_MIGRATE=true
AUTO_MIGRATE="${AUTO_MIGRATE:-true}"
HAS_DB_CONFIG=""

if [ -n "$DB_HOST" ] || [ -n "$MYSQL_URL" ] || [ -n "$DATABASE_URL" ]; then
    HAS_DB_CONFIG="1"
fi

if [ "$AUTO_MIGRATE" = "true" ] && [ -n "$HAS_DB_CONFIG" ]; then
    echo "[Smart School] Database credentials detected. Running automated migration & seed check..."
    # Run migration safely without aborting container startup on DB network latency
    php /var/www/html/migrate.php || {
        echo "[Smart School] Automated migration notice: Database initialization could not connect immediately or already seeded."
        echo "[Smart School] You can run migration anytime via web: https://your-domain.onrender.com/migrate.php?secret=${MIGRATION_SECRET:-smart_school_init_2026}"
    }
else
    echo "[Smart School] Skipping startup auto-migration (AUTO_MIGRATE=${AUTO_MIGRATE}, HAS_DB_CONFIG=${HAS_DB_CONFIG:-0})."
    echo "[Smart School] Once your MySQL database is ready, trigger migration at: /migrate.php?secret=${MIGRATION_SECRET:-smart_school_init_2026}"
fi

echo "[Smart School] Container initialization complete. Starting Apache web server..."

# 4. Hand off to Apache foreground process
exec "$@"
