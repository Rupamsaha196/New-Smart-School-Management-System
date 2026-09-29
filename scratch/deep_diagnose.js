const http = require('http');
const WebSocket = require('ws');

http.get('http://127.0.0.1:9222/json', (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const tabs = JSON.parse(d);
    const t = tabs.find(x => x.url && x.url.includes('5500'));
    if (!t) { console.log('no Smart School tab found'); return; }

    const w = new WebSocket(t.webSocketDebuggerUrl);
    
    w.on('open', () => {
      // Enable runtime to capture console messages
      w.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
      
      setTimeout(() => {
        // Get all console errors
        const expr = `
          (function() {
            // Check if canManage exists at all in global scope
            const keys = Object.keys(window).filter(k => k.toLowerCase().includes('can') || k.toLowerCase().includes('manage') || k.toLowerCase().includes('auth'));
            // Try to manually run what store.js does
            try {
              const s = localStorage.getItem('user');
              const u = s ? JSON.parse(s) : null;
              const role = u ? String(u.role).toLowerCase() : 'none';
              return JSON.stringify({
                matchingWindowKeys: keys,
                canManageDefined: typeof window.canManage,
                authDefined: typeof window.auth,
                storeJsLoaded: Array.from(document.scripts).find(s => s.src.includes('store.js')) ? 'yes' : 'no',
                appJsLoaded: Array.from(document.scripts).find(s => s.src.includes('app.js')) ? 'yes' : 'no',
                scriptVersions: Array.from(document.scripts).map(s => s.src.includes('5500') ? s.src.split('/').pop() : null).filter(Boolean),
                localStorage_user_role: role,
              });
            } catch(e) { return JSON.stringify({error: e.message}); }
          })()
        `;
        w.send(JSON.stringify({ id: 2, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } }));
      }, 500);
    });
    
    w.on('message', (m) => {
      const parsed = JSON.parse(m);
      if (parsed.id === 2) {
        console.log('Full diagnosis:', parsed.result && parsed.result.result ? parsed.result.result.value : JSON.stringify(parsed));
        w.close();
      }
    });
    w.on('error', e => console.log('WS error:', e.message));
  });
});
