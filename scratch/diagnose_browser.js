const http = require('http');
const WebSocket = require('ws');

http.get('http://127.0.0.1:9222/json', (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const tabs = JSON.parse(d);
    console.log('All tabs:', tabs.map(t => ({ title: t.title.slice(0,50), url: t.url.slice(0,60) })));
    const t = tabs.find(x => x.url && x.url.includes('5500'));
    if (!t) { console.log('no Smart School tab found on port 5500'); return; }

    const w = new WebSocket(t.webSocketDebuggerUrl);
    
    w.on('open', () => {
      console.log('Connected to tab:', t.title);
      // Wait 1 second then check state
      setTimeout(() => {
        const expr = `
          (function() {
            try {
              const u = JSON.parse(localStorage.getItem('user') || 'null');
              return JSON.stringify({
                role: u ? u.role : 'none',
                windowAuthType: typeof window.auth,
                canManageType: typeof window.canManage,
                storeJsSrc: Array.from(document.scripts).map(s => s.src).filter(s => s.includes('store.js')),
                currentHash: location.hash,
              });
            } catch(e) { return JSON.stringify({error: e.message}); }
          })()
        `;
        w.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } }));
      }, 1000);
    });
    
    w.on('message', (m) => {
      const parsed = JSON.parse(m);
      if (parsed.id === 1) {
        console.log('Browser state:', parsed.result && parsed.result.result ? parsed.result.result.value : JSON.stringify(parsed));
        w.close();
      }
    });
    w.on('error', e => console.log('WS error:', e.message));
  });
});
