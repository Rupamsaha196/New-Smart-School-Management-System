/**
 * Smart School Management System
 * Standalone Keep-Alive & Auto-Waker Runner (Node.js)
 * Infosof Technologies 2026
 *
 * Runs locally or on any server/VPS to keep your Render instance awake 24/7
 * without relying on third-party services like UptimeRobot.
 *
 * Usage:
 *   node keepalive-runner.js [URL] [INTERVAL_MINUTES]
 * Example:
 *   node keepalive-runner.js https://smart-school-infosof.onrender.com 10
 */

const https = require('https');
const http = require('http');

const targetUrl = process.argv[2] || process.env.RENDER_APP_URL || 'http://localhost:8000';
const intervalMinutes = parseFloat(process.argv[3] || process.env.PING_INTERVAL_MINUTES || '10');
const intervalMs = Math.max(1, intervalMinutes) * 60 * 1000;

const healthEndpoint = targetUrl.replace(/\/+$/, '') + '/health';

console.log('====================================================');
console.log('   SMART SCHOOL - RENDER 24/7 KEEP-ALIVE RUNNER    ');
console.log('====================================================');
console.log(`Target Health Endpoint: ${healthEndpoint}`);
console.log(`Ping Interval:          ${intervalMinutes} minute(s)`);
console.log('Press Ctrl+C to terminate anytime.');
console.log('----------------------------------------------------');

let pingCount = 0;

function ping() {
  pingCount++;
  const timeStr = new Date().toLocaleTimeString();
  const protocol = healthEndpoint.startsWith('https') ? https : http;

  const req = protocol.get(healthEndpoint, { timeout: 45000 }, (res) => {
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log(`[${timeStr}] [#${pingCount}] Server HEALTHY (HTTP ${res.statusCode}) - Stay-awake pulse sent.`);
      } else {
        console.warn(`[${timeStr}] [#${pingCount}] Server responded with HTTP ${res.statusCode} (Instance may be waking up).`);
      }
    });
  });

  req.on('timeout', () => {
    req.destroy();
    console.warn(`[${timeStr}] [#${pingCount}] Request timed out after 45s (Instance is likely cold-starting).`);
  });

  req.on('error', (err) => {
    console.error(`[${timeStr}] [#${pingCount}] Connection error: ${err.message}`);
  });
}

// Initial ping immediately
ping();

// Recurring interval
setInterval(ping, intervalMs);
