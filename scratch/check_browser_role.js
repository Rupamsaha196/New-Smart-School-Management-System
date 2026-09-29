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
    w.on('open', () => {
      const expr = `
        (function() {
          try {
            const u = JSON.parse(localStorage.getItem('user') || 'null');
            return JSON.stringify({
              role: u ? u.role : 'none',
              name: u ? u.name : 'none',
              windowAuthExists: typeof window.auth !== 'undefined',
              canManageStudent: window.canManage ? window.canManage(['student']) : 'canManage_missing',
              canManageTeacher: window.canManage ? window.canManage(['teacher']) : 'canManage_missing',
            });
          } catch(e) { return JSON.stringify({error: e.message}); }
        })()
      `;
      w.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } }));
    });
    w.on('message', (m) => {
      const parsed = JSON.parse(m);
      console.log('Browser state:', parsed.result && parsed.result.result ? parsed.result.result.value : parsed);
      w.close();
    });
    w.on('error', e => console.log('WS error:', e.message));
  });
});
