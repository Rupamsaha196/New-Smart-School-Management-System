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
    let step = 0;
    
    const roles = ['super_admin', 'admin', 'teacher', 'parent', 'student'];
    
    w.on('open', () => {
      testNextRole();
    });
    
    function testNextRole() {
      if (step >= roles.length) {
        console.log('\n✅ ALL ROLE TESTS PASSED!');
        w.close();
        return;
      }
      const role = roles[step];
      const expr = `
        (function() {
          // Set user role
          localStorage.setItem('user', JSON.stringify({id:1, name:'Test User', role: '${role}'}));
          // Test permissions
          var canTeacher = window.canManage(['teacher']);
          var canReceptionist = window.canManage(['receptionist']);
          var canAdmin = window.canManage();
          return JSON.stringify({
            role: '${role}',
            can_add_event_upload: canTeacher,
            can_create_admission: canReceptionist,
            can_delete_admin_only: canAdmin,
          });
        })()
      `;
      w.send(JSON.stringify({ id: 100 + step, method: 'Runtime.evaluate', params: { expression: expr, returnByValue: true } }));
    }
    
    w.on('message', (m) => {
      const parsed = JSON.parse(m);
      if (parsed.id >= 100 && parsed.id < 200) {
        const val = parsed.result && parsed.result.result ? JSON.parse(parsed.result.result.value) : {};
        const roleStr = val.role || 'unknown';
        
        // Assertions
        let ok = true;
        let issues = [];
        
        if (roleStr === 'super_admin' || roleStr === 'admin') {
          if (!val.can_add_event_upload) { ok = false; issues.push('FAIL: admin should be able to add events/upload'); }
          if (!val.can_create_admission) { ok = false; issues.push('FAIL: admin should be able to create admission'); }
          if (!val.can_delete_admin_only) { ok = false; issues.push('FAIL: admin should have admin-only access'); }
        } else if (roleStr === 'teacher') {
          if (!val.can_add_event_upload) { ok = false; issues.push('FAIL: teacher should be able to add events/upload'); }
          if (val.can_create_admission) { ok = false; issues.push('FAIL: teacher should NOT be able to create admission'); }
          if (val.can_delete_admin_only) { ok = false; issues.push('FAIL: teacher should NOT have admin-only access'); }
        } else if (roleStr === 'parent' || roleStr === 'student') {
          if (val.can_add_event_upload) { ok = false; issues.push('FAIL: parent/student should NOT be able to add events/upload'); }
          if (val.can_create_admission) { ok = false; issues.push('FAIL: parent/student should NOT be able to create admission'); }
          if (val.can_delete_admin_only) { ok = false; issues.push('FAIL: parent/student should NOT have admin-only access'); }
        }
        
        const icon = ok ? '✅' : '❌';
        console.log(`${icon} Role: ${roleStr.toUpperCase()}`);
        console.log(`   can_add_event_upload=${val.can_add_event_upload}, can_create_admission=${val.can_create_admission}, can_delete_admin_only=${val.can_delete_admin_only}`);
        if (issues.length > 0) console.log('   ISSUES:', issues.join('; '));
        
        step++;
        setTimeout(testNextRole, 200);
      }
    });
    
    w.on('error', e => console.log('WS error:', e.message));
  });
});
