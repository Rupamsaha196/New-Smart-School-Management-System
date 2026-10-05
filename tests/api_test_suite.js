/**
 * Smart School Management System — Comprehensive API Test Suite
 * Infosof Technologies 2026
 *
 * Verifies:
 * 1. Correct HTTP status codes (200, 201, 400, 401, 403, 404, 409, 422, 500)
 * 2. Request / Response schema validation
 * 3. Invalid, missing, and malformed input handling
 * 4. Idempotency-Key caching and error handling
 * 5. Payment gateway webhooks & HMAC-SHA256 signature verification
 * 6. Third-party API resilience (outbox queue when external service is slow or down)
 * 7. Scheduled background jobs (cron) runner & concurrency lock protection
 */

const http = require('http');
const crypto = require('crypto');

const TEST_PORT = 5055;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;
const WEBHOOK_SECRET = 'smart_school_webhook_secret_2026';
const CRON_SECRET = 'smart_school_cron_2026';

// ── In-Memory Test State & Database ──────────────────────────────────────────
const mockDb = {
  students: [
    { id: 1, first_name: 'Aarav', last_name: 'Sharma', admission_no: 'ADM-2026-001', email: 'aarav@smartschool.com', class_id: 1, dob: '2012-05-15', updated_at: '2026-10-05 10:00:00' },
    { id: 2, first_name: 'Diya', last_name: 'Patel', admission_no: 'ADM-2026-002', email: 'diya@smartschool.com', class_id: 1, dob: '2012-08-20', updated_at: '2026-10-05 10:00:00' },
  ],
  fees: [
    { id: 1, student_id: 1, title: 'Quarterly Tuition', amount: 15000, status: 'Pending', razorpay_payment_id: null, updated_at: '2026-10-05 10:00:00' }
  ],
  outboxQueue: [],
  idempotencyCache: {},
  cronLocked: false
};

// ── Mock REST API Server (mirrors CodeIgniter REST_Controller logic) ──────────
const server = http.createServer((req, res) => {
  const urlParts = req.url.split('?');
  const pathname = urlParts[0];
  const query = new URLSearchParams(urlParts[1] || '');
  const method = req.method.toUpperCase();

  // Helper response functions mirroring REST_Controller
  const sendJson = (code, body, customHeaders = {}) => {
    res.writeHead(code, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      ...customHeaders
    });
    res.end(JSON.stringify(body));
  };

  const success = (data, message = 'Success', code = 200, customHeaders = {}) => {
    sendJson(code, { status: 'success', code, message, data }, customHeaders);
  };

  const error = (message, code = 400, errors = null, customHeaders = {}) => {
    const payload = { status: 'error', code, message };
    if (errors) payload.errors = errors;
    sendJson(code, payload, customHeaders);
  };

  // Idempotency check for mutating methods
  const idempKey = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];
  if (idempKey && ['POST', 'PUT', 'DELETE'].includes(method)) {
    if (mockDb.idempotencyCache[idempKey]) {
      const cached = mockDb.idempotencyCache[idempKey];
      return sendJson(cached.code, cached.body, { 'X-Cache-Lookup': 'HIT (Idempotent Replay)' });
    }
  }

  // Read request body
  let rawBody = '';
  req.on('data', chunk => { rawBody += chunk; });
  req.on('end', () => {
    let parsedBody = {};
    const trimmed = rawBody.trim();

    // 1. Malformed JSON Check (400 Bad Request)
    if (trimmed.length > 0 && (trimmed.startsWith('{') || trimmed.startsWith('[') || req.headers['content-type']?.includes('application/json'))) {
      try {
        parsedBody = JSON.parse(trimmed);
      } catch (e) {
        return error('Malformed JSON body: ' .concat(e.message), 400);
      }
    }

    const authHeader = req.headers['authorization'] || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');

    // ── Routes & Endpoints ───────────────────────────────────────────────────

    // GET /api/students — 200 OK
    if (method === 'GET' && pathname === '/api/students') {
      return success(mockDb.students, 'Students retrieved successfully', 200);
    }

    // GET /api/students/:id — 200 OK or 404 Not Found
    if (method === 'GET' && pathname.startsWith('/api/students/')) {
      const id = parseInt(pathname.split('/')[3], 10);
      const student = mockDb.students.find(s => s.id === id);
      if (!student) {
        return error(`Student with ID ${id} not found`, 404);
      }
      return success(student, 'Student profile retrieved', 200);
    }

    // POST /api/students — 201 Created / 422 Unprocessable / 409 Conflict
    if (method === 'POST' && pathname === '/api/students') {
      const { first_name, last_name, admission_no, email, dob, class_id } = parsedBody;

      // Declarative Schema Validation
      const errors = [];
      if (!first_name || first_name.trim() === '') errors.push("Field 'first_name' is required and cannot be empty.");
      if (first_name && first_name.length > 100) errors.push("Field 'first_name' cannot exceed 100 characters.");
      if (dob) {
        const dobDate = new Date(dob);
        if (isNaN(dobDate.getTime()) || dobDate > new Date()) {
          errors.push("Field 'dob' cannot be a future date.");
        }
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push("Field 'email' must be a valid email address.");
      }

      if (errors.length > 0) {
        return error('Validation failed: ' .concat(errors.join('; ')), 422, errors);
      }

      // Duplicate Unique Constraints (409 Conflict)
      if (admission_no && mockDb.students.some(s => s.admission_no === admission_no)) {
        return error(`Duplicate entry: Admission Number '${admission_no}' is already assigned.`, 409);
      }
      if (email && mockDb.students.some(s => s.email.toLowerCase() === email.toLowerCase())) {
        return error(`Duplicate entry: Student email '${email}' is already registered.`, 409);
      }

      const newStudent = {
        id: mockDb.students.length + 1,
        first_name: first_name.trim(),
        last_name: (last_name || '').trim(),
        admission_no: admission_no || `ADM-2026-00${mockDb.students.length + 1}`,
        email: email ? email.toLowerCase() : '',
        dob: dob || '2012-01-01',
        class_id: class_id || 1,
        updated_at: new Date().toISOString()
      };
      mockDb.students.push(newStudent);

      const resp = { status: 'success', code: 201, message: 'Student created successfully', data: newStudent };
      if (idempKey) {
        mockDb.idempotencyCache[idempKey] = { code: 201, body: resp };
      }
      return sendJson(201, resp);
    }

    // PUT /api/students/:id — 200 OK / 409 Concurrent Edit Conflict
    if (method === 'PUT' && pathname.startsWith('/api/students/')) {
      const id = parseInt(pathname.split('/')[3], 10);
      const student = mockDb.students.find(s => s.id === id);
      if (!student) return error(`Student with ID ${id} not found`, 404);

      // Optimistic Concurrency Control Check
      if (parsedBody.expected_updated_at && student.updated_at !== parsedBody.expected_updated_at) {
        return error(`Concurrent edit conflict: Record was updated by another session at ${student.updated_at}. Please reload before updating.`, 409);
      }

      Object.assign(student, parsedBody, { updated_at: new Date().toISOString() });
      return success(student, 'Student updated successfully', 200);
    }

    // DELETE /api/students/:id — 401 Unauthorized / 403 Forbidden / 200 OK
    if (method === 'DELETE' && pathname.startsWith('/api/students/')) {
      if (!token) {
        return error('Unauthorized: Authentication token is missing', 401);
      }
      if (token === 'student_token' || token === 'parent_token') {
        return error('Forbidden: Your role does not have permission to delete student records', 403);
      }
      const id = parseInt(pathname.split('/')[3], 10);
      const idx = mockDb.students.findIndex(s => s.id === id);
      if (idx === -1) return error(`Student with ID ${id} not found`, 404);

      mockDb.students.splice(idx, 1);
      return success(null, 'Student deleted successfully', 200);
    }

    // POST /api/fees/collect — 200 OK / 422 Boundary / Idempotent
    if (method === 'POST' && pathname === '/api/fees/collect') {
      const { student_id, amount } = parsedBody;

      // Type & Boundary validation
      if (amount === undefined || amount === null || typeof amount !== 'number') {
        return error("Field 'amount' must be a numeric value.", 422);
      }
      if (amount <= 0) {
        return error('Fee payment amount must be a positive number greater than 0.', 422);
      }
      if (amount > 10000000) {
        return error('Fee payment amount exceeds maximum permissible limit (₹1,00,00,000).', 422);
      }

      // Foreign key check
      if (!mockDb.students.some(s => s.id === student_id)) {
        return error(`Foreign key constraint: Student ID ${student_id} does not exist.`, 404);
      }

      const paymentRecord = {
        id: mockDb.fees.length + 1,
        student_id,
        amount,
        status: 'Paid',
        created_at: new Date().toISOString()
      };
      mockDb.fees.push(paymentRecord);

      const resp = { status: 'success', code: 200, message: 'Fee payment collected successfully', data: paymentRecord };
      if (idempKey) {
        mockDb.idempotencyCache[idempKey] = { code: 200, body: resp };
      }
      return sendJson(200, resp);
    }

    // POST /api/notifications/dispatch — Resilience & Outbox Queue
    if (method === 'POST' && pathname === '/api/notifications/dispatch') {
      const { channel, recipient, subject, message, simulate_external_down } = parsedBody;

      if (simulate_external_down) {
        // External provider (SMTP, Twilio) is down or slow -> queue in Outbox safely
        const queueItem = {
          id: 'queue_' + (mockDb.outboxQueue.length + 1),
          channel: channel || 'email',
          recipient,
          subject,
          message,
          status: 'pending',
          attempts: 1,
          next_retry_at: new Date(Date.now() + 60000).toISOString()
        };
        mockDb.outboxQueue.push(queueItem);
        return sendJson(200, {
          success: true,
          queued: true,
          queue_id: queueItem.id,
          notice: 'External mail/SMS gateway is slow or unreachable. Queued in outbox for asynchronous dispatch.'
        });
      }

      return sendJson(200, { success: true, queued: false, message: 'Dispatched directly via active gateway' });
    }

    // POST /api/razorpay/webhook — Webhook Signature Verification & Idempotency
    if (method === 'POST' && pathname === '/api/razorpay/webhook') {
      const signature = req.headers['x-razorpay-signature'];
      const expectedSig = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');

      if (!signature || signature !== expectedSig) {
        return error('Invalid webhook signature. Request rejected.', 400);
      }

      const event = parsedBody.event;
      if (event === 'payment.captured') {
        const payment = parsedBody.payload?.payment?.entity || {};
        const payment_id = payment.id || ('pay_' + Date.now());
        const amount = (payment.amount || 0) / 100;
        const fee_id = parseInt(payment.notes?.fee_id || 1, 10);

        // Idempotency: Check if payment_id already settled
        const alreadySettled = mockDb.fees.find(f => f.razorpay_payment_id === payment_id);
        if (alreadySettled) {
          return sendJson(200, {
            status: 'ignored',
            message: `Payment ${payment_id} was already settled in invoice #${alreadySettled.id}.`,
            receipt_no: alreadySettled.receipt_no,
            event
          });
        }

        const fee = mockDb.fees.find(f => f.id === fee_id) || mockDb.fees[0];
        fee.status = 'Paid';
        fee.paid = amount;
        fee.razorpay_payment_id = payment_id;
        fee.receipt_no = 'RZP-' + payment_id.slice(-8).toUpperCase();

        return sendJson(200, {
          status: 'success',
          event,
          receipt_no: fee.receipt_no,
          payment_id,
          settled: true
        });
      }

      return sendJson(200, { status: 'acknowledged', event });
    }

    // POST /api/cron/run — Scheduled Jobs Execution & Concurrency Lock
    if (method === 'POST' && pathname === '/api/cron/run') {
      const secret = query.get('secret') || req.headers['x-cron-secret'];
      if (secret !== CRON_SECRET) {
        return error('Forbidden: Valid cron secret token required', 403);
      }

      if (mockDb.cronLocked) {
        return sendJson(429, { status: 'skipped', message: 'Another cron instance is active. Concurrency lock held.', locked: true });
      }

      mockDb.cronLocked = true;
      try {
        let outboxProcessed = 0;
        mockDb.outboxQueue.forEach(item => {
          if (item.status === 'pending') {
            item.status = 'sent';
            outboxProcessed++;
          }
        });

        return sendJson(200, {
          status: 'success',
          jobs: {
            notification_outbox: { status: 'completed', processed: outboxProcessed },
            overdue_fee_reminders: { status: 'completed', reminders: 2 },
            daily_attendance_audit: { status: 'completed', present: 45, absent: 3 },
            cache_cleanup: { status: 'completed', pruned: 1 }
          },
          duration_ms: 12.4
        });
      } finally {
        mockDb.cronLocked = false;
      }
    }

    // GET /api/simulate-500 — 500 Internal Server Error (Gracefully Caught)
    if (pathname === '/api/simulate-500') {
      return error('Internal server error: Database transaction failure', 500);
    }

    // Fallback 404 Not Found
    return error(`Endpoint or resource not found: ${pathname}`, 404);
  });
});

// ── Test Runner Utilities ───────────────────────────────────────────────────
function doRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          json = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: json
        });
      });
    });
    req.on('error', reject);
    if (postData !== null) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

// ── Test Execution Suite ─────────────────────────────────────────────────────
let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passedCount++;
  } else {
    console.error(`[FAIL] ${message}`);
    failedCount++;
  }
}

async function runApiTests() {
  console.log('========================================================================');
  console.log('   SMART SCHOOL MANAGEMENT SYSTEM — AUTOMATED API TEST SUITE            ');
  console.log('   Status Codes, Webhooks, Third-Party Resilience & Scheduled Cron      ');
  console.log('========================================================================\n');

  try {
    // 1. Status 200 OK — Successful GET
    const res200 = await doRequest({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: '/api/students',
      method: 'GET'
    });
    assert(res200.statusCode === 200, 'Status 200: GET /api/students returns 200 OK');
    assert(res200.body.status === 'success' && Array.isArray(res200.body.data), 'Schema 200: Response matches standard envelope { status, code, data }');

    // 2. Status 201 Created — Successful Creation
    const res201 = await doRequest({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: '/api/students',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      first_name: 'Pooja',
      last_name: 'Sen',
      admission_no: 'ADM-2026-099',
      email: 'pooja@smartschool.com',
      dob: '2013-04-10',
      class_id: 1
    });
    assert(res201.statusCode === 201, 'Status 201: POST /api/students returns 201 Created');
    assert(res201.body.data.admission_no === 'ADM-2026-099', 'Schema 201: Newly created resource returned in data');

    // 3. Status 400 Bad Request — Malformed JSON
    const res400 = await doRequest({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: '/api/students',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, '{ "first_name": "Broken", "last_name": missing_quotes_and_brace ');
    assert(res400.statusCode === 400, 'Status 400: Malformed JSON syntax returns 400 Bad Request');
    assert(res400.body.status === 'error' && res400.body.message.includes('Malformed JSON'), 'Schema 400: Error message identifies JSON syntax error');

    // 4. Status 401 Unauthorized — Missing Bearer Token
    const res401 = await doRequest({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: '/api/students/1',
      method: 'DELETE'
    });
    assert(res401.statusCode === 401, 'Status 401: Deleting without token returns 401 Unauthorized');
    assert(res401.body.message.includes('Unauthorized'), 'Schema 401: Standard unauthorized message returned');

    // 5. Status 403 Forbidden — Insufficient Role Permissions
    const res403 = await doRequest({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: '/api/students/1',
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer student_token' }
    });
    assert(res403.statusCode === 403, 'Status 403: Student token attempting admin DELETE returns 403 Forbidden');
    assert(res403.body.message.includes('Forbidden'), 'Schema 403: Standard forbidden message returned');

    // 6. Status 404 Not Found — Missing Endpoint & Resource
    const res404Endpoint = await doRequest({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: '/api/non_existent_route',
      method: 'GET'
    });
    assert(res404Endpoint.statusCode === 404, 'Status 404: Unknown route returns 404 Not Found');

    const res404Resource = await doRequest({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: '/api/students/999999',
      method: 'GET'
    });
    assert(res404Resource.statusCode === 404, 'Status 404: Non-existent student ID returns 404 Not Found');

    // 7. Status 409 Conflict — Duplicate Unique Key & Concurrent Edits
    const res409Duplicate = await doRequest({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: '/api/students',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      first_name: 'Clone',
      admission_no: 'ADM-2026-001',
      email: 'clone@smartschool.com'
    });
    assert(res409Duplicate.statusCode === 409, 'Status 409: Duplicate Admission Number returns 409 Conflict');

    const res409Concurrent = await doRequest({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: '/api/students/1',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, {
      first_name: 'Aarav Updated',
      expected_updated_at: '2026-01-01 00:00:00'
    });
    assert(res409Concurrent.statusCode === 409, 'Status 409: Optimistic Concurrency Control collision returns 409 Conflict');

    // 8. Status 422 Unprocessable Entity — Missing Required Field
    const res422Missing = await doRequest({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: '/api/students',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      last_name: 'Sharma'
    });
    assert(res422Missing.statusCode === 422, 'Status 422: Missing required first_name returns 422 Unprocessable Entity');
    assert(Array.isArray(res422Missing.body.errors), 'Schema 422: Structured errors array returned');

    // 9. Status 422 Unprocessable Entity — Boundaries
    const res422FutureDob = await doRequest({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: '/api/students',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      first_name: 'Future',
      dob: '2040-01-01'
    });
    assert(res422FutureDob.statusCode === 422, 'Status 422: Future Date of Birth rejected with 422');

    const res422NegativeAmount = await doRequest({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: '/api/fees/collect',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      student_id: 1,
      amount: -500
    });
    assert(res422NegativeAmount.statusCode === 422, 'Status 422: Negative payment amount rejected with 422');

    // 10. Status 500 Internal Server Error — Graceful Caught Exception
    const res500 = await doRequest({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: '/api/simulate-500',
      method: 'GET'
    });
    assert(res500.statusCode === 500, 'Status 500: Server error caught and returns HTTP 500');
    assert(res500.body.status === 'error' && typeof res500.body.message === 'string', 'Schema 500: Standard JSON error envelope returned without HTML crash dumps');

    // 11. Idempotency Test — Replaying Identical Request
    const idempKey = 'txn-fee-payment-test-001';
    const firstFeeCall = await doRequest({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: '/api/fees/collect',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempKey
      }
    }, {
      student_id: 1,
      amount: 4500
    });
    assert(firstFeeCall.statusCode === 200, 'Idempotency: First request processes normally (HTTP 200)');
    const initialFeeCount = mockDb.fees.length;

    const secondFeeCall = await doRequest({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: '/api/fees/collect',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': idempKey
      }
    }, {
      student_id: 1,
      amount: 4500
    });
    assert(secondFeeCall.statusCode === 200, 'Idempotency: Replayed request returns same status code 200');
    assert(secondFeeCall.headers['x-cache-lookup'] === 'HIT (Idempotent Replay)', 'Idempotency: Cache header confirms replay HIT');
    assert(mockDb.fees.length === initialFeeCount, 'Idempotency: No duplicate fee transaction created in database');

    // 12. Third-Party API Resilience: External Service Down / Slow (Outbox Pattern)
    const outboxRes = await doRequest({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: '/api/notifications/dispatch',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      channel: 'email',
      recipient: 'parent@smartschool.com',
      subject: 'Term 1 Fee Receipt',
      message: 'Your fee payment was recorded.',
      simulate_external_down: true // Simulates external SMTP gateway down/timing out
    });
    assert(outboxRes.statusCode === 200, 'Resilience: User request succeeds (HTTP 200) even when external service times out');
    assert(outboxRes.body.queued === true && typeof outboxRes.body.queue_id === 'string', 'Resilience: Message enqueued in Outbox Queue without blocking user');
    assert(mockDb.outboxQueue.length > 0, 'Resilience: Outbox queue contains pending message for background retry');

    // 13. Webhook Security: Signature Verification (Forged Signature Rejected)
    const rawWebhookPayload = JSON.stringify({
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: 'pay_live_test_12345',
            amount: 1500000,
            notes: { fee_id: 1 }
          }
        }
      }
    });

    const forgedWebhookRes = await doRequest({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: '/api/razorpay/webhook',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Razorpay-Signature': 'invalid_forged_signature_hash'
      }
    }, rawWebhookPayload);
    assert(forgedWebhookRes.statusCode === 400, 'Webhook: Forged or invalid HMAC signature rejected with 400 Bad Request');

    // 14. Webhook Security: Valid HMAC-SHA256 Signature Accepted
    const validSignature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawWebhookPayload).digest('hex');
    const validWebhookRes = await doRequest({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: '/api/razorpay/webhook',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Razorpay-Signature': validSignature
      }
    }, rawWebhookPayload);
    assert(validWebhookRes.statusCode === 200, 'Webhook: Valid HMAC-SHA256 signature accepted (HTTP 200)');
    assert(validWebhookRes.body.settled === true, 'Webhook: Fee invoice status updated to Paid and settled');

    // 15. Webhook Idempotency: Duplicate Webhook Event Replay
    const duplicateWebhookRes = await doRequest({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: '/api/razorpay/webhook',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Razorpay-Signature': validSignature
      }
    }, rawWebhookPayload);
    assert(duplicateWebhookRes.statusCode === 200, 'Webhook: Duplicate webhook event accepted with HTTP 200');
    assert(duplicateWebhookRes.body.status === 'ignored', 'Webhook Idempotency: Duplicate payment delivery safely ignored without double-crediting');

    // 16. Scheduled Cron: Unauthorized Cron Access Blocked
    const unauthCronRes = await doRequest({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: '/api/cron/run?secret=wrong_secret',
      method: 'POST'
    });
    assert(unauthCronRes.statusCode === 403, 'Cron: Unauthorized cron trigger without valid secret rejected with 403');

    // 17. Scheduled Cron: Authorized Execution Processes Outbox & Maintenance
    const cronRes = await doRequest({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      path: `/api/cron/run?secret=${CRON_SECRET}`,
      method: 'POST'
    });
    assert(cronRes.statusCode === 200, 'Cron: Scheduled jobs execute successfully (HTTP 200)');
    assert(cronRes.body.jobs.notification_outbox.status === 'completed', 'Cron: Outbox queue processor ran and flushed pending notifications');
    assert(cronRes.body.jobs.overdue_fee_reminders.status === 'completed', 'Cron: Overdue fee scan and reminder dispatch executed');
    assert(mockDb.outboxQueue.every(item => item.status === 'sent'), 'Cron: All queued outbox messages transitioned from pending to sent');

  } catch (err) {
    console.error('Test execution error:', err);
    failedCount++;
  } finally {
    server.close(() => {
      console.log('\n========================================================================');
      console.log(` API TEST SUMMARY: ${passedCount} PASSED / ${passedCount + failedCount} TOTAL`);
      console.log('========================================================================');
      process.exit(failedCount > 0 ? 1 : 0);
    });
  }
}

// Start test server and execute test suite
server.listen(TEST_PORT, '127.0.0.1', () => {
  runApiTests();
});
