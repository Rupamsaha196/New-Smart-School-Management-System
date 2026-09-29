const http = require('http');
const WebSocket = require('ws');

http.get('http://127.0.0.1:9222/json', (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const tabs = JSON.parse(d);
    const t = tabs.find(x => x.url && x.url.includes('5500'));
    if (!t) { console.log('no tab found'); return; }

    const w = new WebSocket(t.webSocketDebuggerUrl);
    let msgCount = 0;
    
    w.on('open', () => {
      // Hard reload to force fresh load of v=1.5 files
      w.send(JSON.stringify({ id: 1, method: 'Page.reload', params: { ignoreCache: true } }));
    });
    
    w.on('message', (m) => {
      const parsed = JSON.parse(m);
      msgCount++;
      if (parsed.id === 1) {
        console.log('Hard reload sent. Waiting 3s then checking canManage...');
        setTimeout(() => {
          const expr = `
            (function() {
              try {
                const u = JSON.parse(localStorage.getItem('user') || 'null');
                return JSON.stringify({
                  role: u ? u.role : 'none',
                  windowAuthExists: typeof window.auth !== 'undefined',
                  canManageExists: typeof window.canManage === 'function',
                  canManageTeacher_asAdmin: window.canManage ? window.canManage(['teacher']) : 'N/A',
                });
              } catch(e) { return JSON.stringify({error: e.message}); }
            })()
          `;
          w.send(JSON.stringify({ id: 2, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } }));
        }, 3000);
      } else if (parsed.id === 2) {
        console.log('Browser state after reload:', parsed.result && parsed.result.result ? parsed.result.result.value : parsed);
        w.close();
      }
    });
    w.on('error', e => console.log('WS error:', e.message));
  });
});
