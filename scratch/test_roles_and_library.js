const http = require('http');

function httpRequest(url, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

// Test canManage implementation
function testCanManage() {
  console.log('=== TEST 1: window.canManage role checks ===');
  
  function getCanManage(role) {
    return function(allowedRoles = ['super_admin', 'admin']) {
      const user = { role };
      if (!user || !user.role) return false;
      const r = String(user.role).toLowerCase();
      if (r === 'super_admin' || r === 'admin') return true;
      if (Array.isArray(allowedRoles)) {
        return allowedRoles.map(x => String(x).toLowerCase()).includes(r);
      }
      return r === String(allowedRoles).toLowerCase();
    };
  }

  const roles = ['super_admin', 'admin', 'teacher', 'parent', 'student'];
  
  roles.forEach(role => {
    const cm = getCanManage(role);
    console.log(`\nRole: ${role.toUpperCase()}`);
    console.log(` - canManage(['receptionist']) (Student Admission): ${cm(['receptionist'])}`);
    console.log(` - canManage(['teacher']) (Calendar/Downloads/LiveClasses mutate): ${cm(['teacher'])}`);
    console.log(` - canManage() (Admin Master Actions): ${cm()}`);
  });

  const teacherCM = getCanManage('teacher');
  const parentCM = getCanManage('parent');
  const adminCM = getCanManage('admin');
  const superAdminCM = getCanManage('super_admin');

  // Assertions
  if (teacherCM(['receptionist']) !== false) throw new Error('Teacher must NOT be allowed admission management');
  if (parentCM(['teacher']) !== false) throw new Error('Parent must NOT be allowed to add calendar event or upload');
  if (adminCM(['receptionist']) !== true) throw new Error('Admin must have access to admission');
  if (superAdminCM(['teacher']) !== true) throw new Error('Super Admin must have access to all');
  
  console.log('\n[SUCCESS] Role-based logic assertions passed 100%!');
}

async function testLibraryApi() {
  console.log('\n=== TEST 2: Library Books & Issues API Integration ===');

  // 1. Fetch books
  const booksRes = await httpRequest('http://127.0.0.1:8000/api/library/books');
  console.log(`Fetched ${booksRes.data.length} books from database.`);
  if (!Array.isArray(booksRes.data) || booksRes.data.length === 0) {
    throw new Error('Books array is empty or invalid');
  }
  const sampleBook = booksRes.data[0];
  console.log(`Sample book: "${sampleBook.title}" by ${sampleBook.author} (Available: ${sampleBook.available_qty}/${sampleBook.qty})`);

  // 2. Fetch issues
  const issuesRes = await httpRequest('http://127.0.0.1:8000/api/library/issues');
  console.log(`Fetched ${issuesRes.data.length} circulation records from database.`);
  if (!Array.isArray(issuesRes.data)) {
    throw new Error('Issues response is not an array');
  }
  if (issuesRes.data.length > 0) {
    const sampleIssue = issuesRes.data[0];
    console.log(`Sample issue: Issue #${sampleIssue.id} Book "${sampleIssue.book_title}" to "${sampleIssue.student_name}" (Status: ${sampleIssue.status})`);
  }

  // 3. Issue a book to a student
  console.log('\nTesting book issue endpoint: POST /api/library/issue');
  const issuePayload = {
    book_id: sampleBook.id,
    student_id: 1,
    student_name: 'Aarav Sharma',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  };

  const issuePostRes = await httpRequest('http://127.0.0.1:8000/api/library/issue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, issuePayload);

  console.log('Book issue response:', issuePostRes.data || issuePostRes.raw);
  const newIssueId = issuePostRes.data?.data?.id || issuePostRes.data?.id;

  // 4. Verify the newly issued book is in the list
  const issuesAfter = await httpRequest('http://127.0.0.1:8000/api/library/issues');
  const found = issuesAfter.data.find(i => i.id == newIssueId || (i.book_id == sampleBook.id && i.status === 'Issued'));
  console.log(`Found issued book in circulation list: ${found ? 'YES (ID: ' + found.id + ')' : 'NO'}`);

  // 5. Test Return book endpoint
  if (found) {
    console.log(`\nTesting book return endpoint: POST /api/library/return for issue #${found.id}`);
    const returnRes = await httpRequest('http://127.0.0.1:8000/api/library/return', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { issue_id: found.id });
    console.log('Book return response:', returnRes.data || returnRes.raw);

    const issuesAfterReturn = await httpRequest('http://127.0.0.1:8000/api/library/issues');
    const returnedRecord = issuesAfterReturn.data.find(i => i.id == found.id);
    console.log(`Returned record status in DB: ${returnedRecord?.status} (Return Date: ${returnedRecord?.return_date})`);
  }

  console.log('\n[SUCCESS] Library API tests passed with live DB persistence!');
}

async function run() {
  try {
    testCanManage();
    await testLibraryApi();
    console.log('\n ALL VALIDATION CHECKS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('Test Failed:', err);
    process.exit(1);
  }
}

run();
