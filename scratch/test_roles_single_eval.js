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
      // Test all roles in a single eval
      const expr = `
        (function() {
          var originalUser = localStorage.getItem('user');
          var results = {};
          var roles = ['super_admin', 'admin', 'teacher', 'parent', 'student'];
          
          roles.forEach(function(role) {
            localStorage.setItem('user', JSON.stringify({id:1, name:'Test', role: role}));
            results[role] = {
              can_manage_teacher: window.canManage(['teacher']),
              can_manage_none: window.canManage(),
              can_receptionist: window.canManage(['receptionist']),
            };
          });
          
          // Restore original
          if (originalUser) localStorage.setItem('user', originalUser);
          else localStorage.removeItem('user');
          
          return JSON.stringify(results, null, 2);
        })()
      `;
      w.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } }));
    });
    
    w.on('message', (m) => {
      const parsed = JSON.parse(m);
      if (parsed.id === 1) {
        const val = parsed.result && parsed.result.result ? parsed.result.result.value : '{}';
        const results = JSON.parse(val);
        
        console.log('\n=== ROLE PERMISSION TEST RESULTS ===\n');
        
        Object.keys(results).forEach(role => {
          const r = results[role];
          let pass = true;
          let notes = [];
          
          if (role === 'super_admin' || role === 'admin') {
            if (!r.can_manage_teacher) { pass = false; notes.push('FAIL: should pass teacher check'); }
            if (!r.can_manage_none) { pass = false; notes.push('FAIL: should pass admin-only check'); }
          } else if (role === 'teacher') {
            if (!r.can_manage_teacher) { pass = false; notes.push('FAIL: should pass teacher check'); }
            if (r.can_manage_none) { pass = false; notes.push('FAIL: should NOT pass admin-only check'); }
          } else { // parent, student
            if (r.can_manage_teacher) { pass = false; notes.push('FAIL: should NOT pass teacher check - ADD EVENT BLOCKED'); }
            if (r.can_manage_none) { pass = false; notes.push('FAIL: should NOT pass admin check'); }
          }
          
          const icon = pass ? '✅' : '❌';
          console.log(`${icon} ${role.toUpperCase()}: teacher=${r.can_manage_teacher} admin=${r.can_manage_none} recept=${r.can_receptionist}`);
          notes.forEach(n => console.log('   ' + n));
        });
        
        console.log('\n=== END OF ROLE TEST ===');
        w.close();
      }
    });
    
    w.on('error', e => console.log('WS error:', e.message));
  });
});
