/**
 * Smart School Management System
 * Render Free Tier Anti-Sleep & Cold-Start Auto-Waker Engine
 * Infosof Technologies 2026
 *
 * Solves Render Free Web Service auto-sleep (15-minute inactivity shutdown):
 * 1. Background Keep-Alive Heartbeat: Sends lightweight GET /health every 8 minutes
 *    using an unthrottled Blob Web Worker (keeps timer alive even in minimized/background tabs).
 * 2. Multi-Tab Leader Election: Coordinates across browser tabs via localStorage & BroadcastChannel
 *    so multiple open tabs never spam the server.
 * 3. Cold-Start Auto-Wake & Auto-Retry: Detects when the server is waking from standby (502/503/504 or NetworkError),
 *    displays a sleek glassmorphic wake-up banner, polls until healthy, and auto-retries failed requests.
 * 4. Tab Focus & Reconnection Watcher: Instantly checks and pings when tab regains focus or network reconnects.
 */

(function (global) {
  'use strict';

  // Configuration
  const CONFIG = {
    // Render free tier sleeps after 15 min (900s). We ping at 8 min (480s) to be safely ahead.
    PING_INTERVAL_MS: 8 * 60 * 1000,
    // Polling interval while waiting for server to wake up from cold start (~30-60s)
    WAKE_POLL_INTERVAL_MS: 3500,
    // Max attempts while polling cold start (~90 seconds total)
    MAX_WAKE_ATTEMPTS: 25,
    // Key for tab synchronization
    STORAGE_KEY_LAST_PING: 'render_keepalive_last_ping',
    STORAGE_KEY_LAST_STATUS: 'render_keepalive_status',
    BROADCAST_CHANNEL: 'render_keepalive_channel',
  };

  // State
  const state = {
    isWakingUp: false,
    wakePromise: null,
    lastPingTime: 0,
    lastHealthData: null,
    worker: null,
    broadcastChannel: null,
    bannerEl: null,
    isInitialized: false,
  };

  /**
   * Determine the health check URL dynamically
   */
  function getHealthUrl() {
    if (global.RENDER_HEALTH_URL) return global.RENDER_HEALTH_URL;
    const stored = localStorage.getItem('render_health_url');
    if (stored) return stored;

    if (typeof window !== 'undefined' && window.location) {
      if (window.location.protocol === 'file:') {
        return 'http://127.0.0.1:8000/health';
      }
      return `${window.location.origin}/health`;
    }
    return '/health';
  }

  /**
   * Create an unthrottled Web Worker via Blob
   * Standard browser setInterval gets heavily throttled (or frozen) in background tabs.
   * A Worker running a simple tick loop runs reliably without background tab throttling.
   */
  function createTimerWorker() {
    try {
      const workerCode = `
        let timer = null;
        self.onmessage = function(e) {
          if (e.data === 'START') {
            if (timer) clearInterval(timer);
            // Tick every 15 seconds to check if keep-alive ping is due
            timer = setInterval(function() {
              self.postMessage('TICK');
            }, 15000);
          } else if (e.data === 'STOP') {
            if (timer) clearInterval(timer);
            timer = null;
          }
        };
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));
      worker.onmessage = function (e) {
        if (e.data === 'TICK') {
          checkAndPingIfNeeded();
        }
      };
      worker.postMessage('START');
      return worker;
    } catch (err) {
      console.warn('[KeepAlive] Web Worker unavailable, falling back to standard interval:', err);
      setInterval(checkAndPingIfNeeded, 15000);
      return null;
    }
  }

  /**
   * Check if a ping is needed and send if this tab should do it
   */
  async function checkAndPingIfNeeded(force = false) {
    if (state.isWakingUp) return;

    const now = Date.now();
    const lastPing = parseInt(localStorage.getItem(CONFIG.STORAGE_KEY_LAST_PING) || '0', 10);
    const elapsed = now - lastPing;

    // Only ping if elapsed time >= interval or explicitly forced
    if (force || elapsed >= CONFIG.PING_INTERVAL_MS) {
      await sendPing();
    }
  }

  /**
   * Send a lightweight keep-alive request to the server
   */
  async function sendPing() {
    const healthUrl = `${getHealthUrl()}?t=${Date.now()}`;
    const now = Date.now();

    try {
      // Mark as pinging to prevent race condition across multiple tabs
      localStorage.setItem(CONFIG.STORAGE_KEY_LAST_PING, String(now));
      state.lastPingTime = now;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(healthUrl, {
        method: 'GET',
        cache: 'no-store',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json().catch(() => ({ status: 'ok' }));
        state.lastHealthData = json;
        localStorage.setItem(CONFIG.STORAGE_KEY_LAST_STATUS, 'online');
        notifyBroadcast({ type: 'PING_SUCCESS', timestamp: now });
        console.debug('[KeepAlive] Server heartbeat OK at', new Date(now).toLocaleTimeString());
        return { ok: true, data: json };
      } else if (res.status === 502 || res.status === 503 || res.status === 504) {
        // Cold start in progress or bad gateway from Render
        triggerWakeUpSequence('Server is currently sleeping (HTTP ' + res.status + ')');
        return { ok: false, status: res.status };
      }
    } catch (err) {
      console.debug('[KeepAlive] Ping failed (server might be asleep or spinning up):', err.message);
      // If error occurred and not already waking, check if it's a cold start
      if (!state.isWakingUp) {
        triggerWakeUpSequence('Server is currently in standby');
      }
      return { ok: false, error: err };
    }
    return { ok: false };
  }

  /**
   * Cold-Start Auto-Wake Engine:
   * Polls /health repeatedly with visual feedback until the instance is awake
   */
  function triggerWakeUpSequence(reason = 'Server waking up') {
    if (state.isWakingUp && state.wakePromise) {
      return state.wakePromise;
    }

    state.isWakingUp = true;
    showWakeBanner(true);

    state.wakePromise = (async () => {
      let attempts = 0;
      const startTime = Date.now();

      while (attempts < CONFIG.MAX_WAKE_ATTEMPTS) {
        attempts++;
        const elapsedSec = Math.round((Date.now() - startTime) / 1000);
        updateWakeBannerProgress(attempts, CONFIG.MAX_WAKE_ATTEMPTS, elapsedSec);

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 8000);

          const res = await fetch(`${getHealthUrl()}?wake=${Date.now()}`, {
            method: 'GET',
            cache: 'no-store',
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            // Cold start succeeded!
            state.isWakingUp = false;
            state.lastPingTime = Date.now();
            localStorage.setItem(CONFIG.STORAGE_KEY_LAST_PING, String(Date.now()));
            localStorage.setItem(CONFIG.STORAGE_KEY_LAST_STATUS, 'online');

            showWakeSuccessBanner(elapsedSec);
            notifyBroadcast({ type: 'WAKE_SUCCESS', elapsedSec });

            // Dispatch global event for application listeners
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('render:online', { detail: { elapsedSec } }));
              window.dispatchEvent(new CustomEvent('render:woke_up', { detail: { elapsedSec } }));
            }

            state.wakePromise = null;
            return true;
          }
        } catch {
          // Still waiting for container boot
        }

        await new Promise((r) => setTimeout(r, CONFIG.WAKE_POLL_INTERVAL_MS));
      }

      // If reached max attempts without wake
      state.isWakingUp = false;
      showWakeFailureBanner();
      state.wakePromise = null;
      return false;
    })();

    return state.wakePromise;
  }

  /**
   * Multi-tab BroadcastChannel notification
   */
  function notifyBroadcast(data) {
    if (state.broadcastChannel) {
      try {
        state.broadcastChannel.postMessage(data);
      } catch {}
    }
  }

  /**
   * UI: Render sleek, modern wake-up overlay / banner
   */
  function ensureBanner() {
    if (state.bannerEl) return state.bannerEl;

    const el = document.createElement('div');
    el.id = 'render-keepalive-banner';
    el.className = 'render-wake-banner';
    el.style.display = 'none';

    el.innerHTML = `
      <div class="render-wake-card">
        <div class="render-wake-icon">
          <div class="render-wake-pulse"></div>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
        </div>
        <div class="render-wake-info">
          <div class="render-wake-title">Cloud Server Starting Up</div>
          <div class="render-wake-desc" id="render-wake-desc">Waking free instance from standby (~30-45s)...</div>
          <div class="render-wake-bar-wrap">
            <div class="render-wake-bar" id="render-wake-bar"></div>
          </div>
        </div>
        <button type="button" class="render-wake-close" id="render-wake-close" title="Dismiss">&times;</button>
      </div>
    `;

    document.body.appendChild(el);
    state.bannerEl = el;

    const closeBtn = el.querySelector('#render-wake-close');
    if (closeBtn) {
      closeBtn.onclick = () => {
        el.style.display = 'none';
      };
    }

    injectBannerStyles();
    return el;
  }

  function injectBannerStyles() {
    if (document.getElementById('render-keepalive-styles')) return;

    const style = document.createElement('style');
    style.id = 'render-keepalive-styles';
    style.textContent = `
      .render-wake-banner {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif;
        animation: renderSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      .render-wake-card {
        display: flex;
        align-items: center;
        gap: 14px;
        background: rgba(15, 23, 42, 0.94);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(59, 130, 246, 0.35);
        box-shadow: 0 12px 36px rgba(0, 0, 0, 0.4), 0 0 20px rgba(59, 130, 246, 0.2);
        padding: 14px 18px;
        border-radius: 14px;
        color: #ffffff;
        min-width: 330px;
        max-width: 420px;
      }
      .render-wake-icon {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 38px;
        height: 38px;
        background: linear-gradient(135deg, #2563eb, #3b82f6);
        border-radius: 10px;
        color: #ffffff;
        flex-shrink: 0;
      }
      .render-wake-pulse {
        position: absolute;
        inset: -4px;
        border-radius: 14px;
        background: rgba(59, 130, 246, 0.4);
        animation: renderPulse 1.8s infinite ease-out;
        z-index: -1;
      }
      .render-wake-info {
        flex: 1;
        min-width: 0;
      }
      .render-wake-title {
        font-size: 13.5px;
        font-weight: 700;
        letter-spacing: -0.01em;
        color: #f8fafc;
        margin-bottom: 2px;
      }
      .render-wake-desc {
        font-size: 12px;
        color: #94a3b8;
        line-height: 1.35;
        margin-bottom: 8px;
      }
      .render-wake-bar-wrap {
        width: 100%;
        height: 4px;
        background: rgba(255, 255, 255, 0.12);
        border-radius: 999px;
        overflow: hidden;
      }
      .render-wake-bar {
        height: 100%;
        width: 25%;
        background: linear-gradient(90deg, #38bdf8, #3b82f6);
        border-radius: 999px;
        transition: width 0.3s ease;
      }
      .render-wake-close {
        background: none;
        border: none;
        color: #64748b;
        font-size: 20px;
        cursor: pointer;
        padding: 0 4px;
        line-height: 1;
        transition: color 0.2s;
        margin-left: 4px;
        align-self: flex-start;
      }
      .render-wake-close:hover {
        color: #ffffff;
      }
      .render-wake-card.success {
        border-color: rgba(16, 185, 129, 0.4);
        box-shadow: 0 12px 36px rgba(0, 0, 0, 0.4), 0 0 20px rgba(16, 185, 129, 0.2);
      }
      .render-wake-card.success .render-wake-icon {
        background: linear-gradient(135deg, #059669, #10b981);
      }
      .render-wake-card.success .render-wake-pulse {
        display: none;
      }
      .render-wake-card.success .render-wake-bar {
        width: 100% !important;
        background: #10b981;
      }
      @keyframes renderPulse {
        0% { transform: scale(0.95); opacity: 0.8; }
        50% { transform: scale(1.25); opacity: 0; }
        100% { transform: scale(0.95); opacity: 0; }
      }
      @keyframes renderSlideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }

  function showWakeBanner() {
    const el = ensureBanner();
    const card = el.querySelector('.render-wake-card');
    if (card) {
      card.className = 'render-wake-card';
    }
    const title = el.querySelector('.render-wake-title');
    if (title) title.textContent = 'Cloud Server Starting Up';
    const desc = el.querySelector('#render-wake-desc');
    if (desc) desc.textContent = 'Waking free instance from standby (~30-45s)...';
    el.style.display = 'block';
  }

  function updateWakeBannerProgress(attempt, maxAttempts, elapsedSec) {
    const el = state.bannerEl;
    if (!el) return;
    const desc = el.querySelector('#render-wake-desc');
    if (desc) {
      desc.textContent = `Waking free instance from standby (${elapsedSec}s elapsed)...`;
    }
    const bar = el.querySelector('#render-wake-bar');
    if (bar) {
      const pct = Math.min(95, Math.round((attempt / maxAttempts) * 100));
      bar.style.width = `${pct}%`;
    }
  }

  function showWakeSuccessBanner(elapsedSec) {
    const el = state.bannerEl;
    if (!el) return;
    const card = el.querySelector('.render-wake-card');
    if (card) card.classList.add('success');

    const title = el.querySelector('.render-wake-title');
    if (title) title.textContent = '✅ Cloud Server Online!';

    const desc = el.querySelector('#render-wake-desc');
    if (desc) {
      desc.textContent = `Ready and active (${elapsedSec}s wake time). Connecting...`;
    }

    const bar = el.querySelector('#render-wake-bar');
    if (bar) bar.style.width = '100%';

    setTimeout(() => {
      if (el) el.style.display = 'none';
    }, 2800);
  }

  function showWakeFailureBanner() {
    const el = state.bannerEl;
    if (!el) return;
    const desc = el.querySelector('#render-wake-desc');
    if (desc) {
      desc.textContent = 'Still connecting. Please refresh or verify Render dashboard.';
    }
  }

  /**
   * Global Public API
   */
  const RenderKeepAlive = {
    init: function () {
      if (state.isInitialized) return;
      state.isInitialized = true;

      // Broadcast channel for multi-tab sync
      if (typeof BroadcastChannel !== 'undefined') {
        try {
          state.broadcastChannel = new BroadcastChannel(CONFIG.BROADCAST_CHANNEL);
          state.broadcastChannel.onmessage = function (e) {
            if (e.data && e.data.type === 'PING_SUCCESS') {
              state.lastPingTime = e.data.timestamp;
            } else if (e.data && e.data.type === 'WAKE_SUCCESS') {
              if (state.isWakingUp) {
                state.isWakingUp = false;
                showWakeSuccessBanner(e.data.elapsedSec || 30);
              }
            }
          };
        } catch {}
      }

      // Initialize unthrottled Web Worker timer
      state.worker = createTimerWorker();

      // Listen for window visibility change (user returns to tab)
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) {
            checkAndPingIfNeeded();
          }
        });
      }

      // Listen for network online event
      if (typeof window !== 'undefined') {
        window.addEventListener('online', () => {
          checkAndPingIfNeeded(true);
        });
      }

      // Initial ping on boot
      checkAndPingIfNeeded();
      console.log('⚡ [KeepAlive] Render Anti-Sleep Engine initialized (Interval: 8 mins)');
    },

    ping: () => checkAndPingIfNeeded(true),

    wakeUp: () => triggerWakeUpSequence('Manual wake up requested'),

    waitForWakeUp: async function () {
      if (state.isWakingUp && state.wakePromise) {
        return state.wakePromise;
      }
      return triggerWakeUpSequence('API request failed due to standby');
    },

    getStatus: function () {
      return {
        isWakingUp: state.isWakingUp,
        lastPingTime: state.lastPingTime,
        lastPingDate: state.lastPingTime ? new Date(state.lastPingTime).toISOString() : null,
        healthData: state.lastHealthData,
        healthUrl: getHealthUrl(),
      };
    },
  };

  // Auto-init when DOM is ready
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => RenderKeepAlive.init());
    } else {
      RenderKeepAlive.init();
    }
  }

  global.RenderKeepAlive = RenderKeepAlive;
})(typeof window !== 'undefined' ? window : this);
