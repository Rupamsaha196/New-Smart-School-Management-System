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

# ── Self-Ping Keep-Alive Daemon (Prevents Render Free Tier 15-min idle sleep) ──
(
  echo "[Keep-Alive] Daemon started. Waiting 60s for Apache startup..."
  sleep 60
  while true; do
    TARGET_HOST=""
    if [ -n "$RENDER_EXTERNAL_URL" ]; then
      TARGET_HOST="$RENDER_EXTERNAL_URL"
    elif [ -n "$RENDER_EXTERNAL_HOSTNAME" ]; then
      TARGET_HOST="https://$RENDER_EXTERNAL_HOSTNAME"
    elif [ -n "$APP_URL" ]; then
      TARGET_HOST="$APP_URL"
    fi

    if [ -n "$TARGET_HOST" ]; then
      STATUS=$(curl -s -k -o /dev/null -w "%{http_code}" "$TARGET_HOST/health" 2>/dev/null || echo "failed")
      echo "[Keep-Alive] Pinged $TARGET_HOST/health -> Status: $STATUS (Timer reset)"
    else
      # If RENDER_EXTERNAL_URL not yet resolved, ping local port to maintain activity
      curl -s -o /dev/null "http://127.0.0.1:${TARGET_PORT}/health" 2>/dev/null || true
    fi

    # Ping every 12 minutes (720 seconds) - safely under Render's 15-minute idle limit
    sleep 720
  done
) &

# Execute Apache in foreground
exec apache2-foreground
