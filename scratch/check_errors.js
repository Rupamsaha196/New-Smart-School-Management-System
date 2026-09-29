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
    const errors = [];
    
    w.on('open', () => {
      // Enable Runtime and Console domains
      w.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
      w.send(JSON.stringify({ id: 2, method: 'Log.enable' }));
      
      // Try to manually call the window.canManage definition inline
      setTimeout(() => {
        const testExpr = `
          (function() {
            try {
              // Test if we can define it manually
              var testFn = function(allowedRoles) {
                allowedRoles = allowedRoles || ['super_admin', 'admin'];
                var u = null;
                try { u = JSON.parse(localStorage.getItem('user') || 'null'); } catch(e) {}
                if (!u || !u.role) return false;
                var role = String(u.role).toLowerCase();
                if (role === 'super_admin' || role === 'admin') return true;
                return allowedRoles.map(function(r) { return String(r).toLowerCase(); }).indexOf(role) !== -1;
              };
              var result = testFn(['teacher']);
              // Now try to find errors in the store.js content
              return JSON.stringify({
                manualTestResult: result,
                canManageBefore: typeof window.canManage,
                // Try to eval the window.canManage definition directly
                tryEval: (function() {
                  try {
                    window.canManage = testFn;
                    return 'assigned OK, result=' + window.canManage(['teacher']);
                  } catch(e) { return 'error: ' + e.message; }
                })(),
                canManageAfter: typeof window.canManage,
              });
            } catch(e) {
              return JSON.stringify({topError: e.message, stack: e.stack});
            }
          })()
        `;
        w.send(JSON.stringify({ id: 3, method: 'Runtime.evaluate', params: { expression: testExpr, returnByValue: true } }));
      }, 500);
    });
    
    w.on('message', (m) => {
      const parsed = JSON.parse(m);
      if (parsed.method === 'Runtime.exceptionThrown') {
        errors.push(parsed.params);
        console.log('RUNTIME ERROR:', JSON.stringify(parsed.params.exceptionDetails, null, 2));
      }
      if (parsed.method === 'Log.entryAdded') {
        const entry = parsed.params.entry;
        if (entry.level === 'error' || entry.level === 'warning') {
          console.log('LOG:', entry.level, entry.text);
        }
      }
      if (parsed.id === 3) {
        console.log('Manual test result:', parsed.result && parsed.result.result ? parsed.result.result.value : JSON.stringify(parsed));
        console.log('Errors collected:', errors.length);
        w.close();
      }
    });
    w.on('error', e => console.log('WS error:', e.message));
  });
});
