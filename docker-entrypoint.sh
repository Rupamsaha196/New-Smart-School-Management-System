#!/bin/bash
set -e

# Render assigns dynamic PORT (e.g. 10000). Default to 80 if not defined.
TARGET_PORT=${PORT:-80}

echo "=========================================================="
echo " Starting Smart School Management System (Render Cloud)   "
echo " Apache binding to dynamic PORT: ${TARGET_PORT}           "
echo " Environment: ${ENVIRONMENT:-production}                 "
echo "=========================================================="

# Dynamically reconfigure Apache to listen on Render's assigned port ($PORT)
sed -i "s/Listen [0-9]*/Listen ${TARGET_PORT}/g" /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:[0-9]*>/<VirtualHost \*:${TARGET_PORT}>/g" /etc/apache2/sites-available/000-default.conf

# Re-ensure write permissions on cache and logs
chmod -R 777 /var/www/html/backend_codeigniter/application/cache 2>/dev/null || true
chmod -R 777 /var/www/html/backend_codeigniter/application/logs 2>/dev/null || true

# Execute Apache in foreground
exec apache2-foreground
