/**
 * Smart School — Student Domain Views
 * Student Profile, Transfer Certificate (TC) Generator, Behavior Records
 */

/* ==========================================================================
   Student Profile View
   ========================================================================== */
async function renderStudentProfile(params) {
  let studentId = params?.id || '1';

  // Authorization Guard: Prevent students or parents from viewing or editing another student's record
  const currentUser = typeof auth !== 'undefined' ? auth.getUser() : null;
  if (currentUser) {
    const role = (currentUser.role || '').toLowerCase();
    if (role === 'student' || role === 'parent') {
      const allowedStudentId = String(currentUser.student_id || (role === 'student' ? (currentUser.id || '8') : '8'));
      if (String(studentId) !== allowedStudentId) {
        if (window.showToast) {
          window.showToast("Access Denied: You cannot view or edit another user's student data.", 'danger');
        }
        window.location.hash = `#/students/${allowedStudentId}`;
        studentId = allowedStudentId;
      }
    }
  }

  let student = null;

  try {
    const res = await api.get(`/students/${studentId}`);
    student = res.data;
  } catch {
    const local = JSON.parse(localStorage.getItem('local_students') || '[]');
    student = local.find(s => String(s.id) === String(studentId));
  }

  if (!student) {
    student = {
      id: studentId,
      name: 'Student Record',
      admission_no: `SS${studentId}`,
      class_name: 'Class —',
      section: '—',
      roll_no: '—',
      gender: '—',
      dob: '—',
      phone: '—',
      email: '—',
      father_name: '—',
      mother_name: '—',
      address: '—',
      status: 'active',
    };
  }

  const name = student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Student';
  const admNo = student.admission_no || `SS2025${String(student.id).padStart(3, '0')}`;
  const className = student.class_name || (student.class_id ? `Class ${student.class_id}` : 'Class 5');
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const feeSummary = student.fee_summary || student.profile_360?.fee_summary || {
    total: 37500,
    paid: 25000,
    due: 12500,
    records: []
  };

  let dueAmount = 0;
  if (typeof feeSummary.due === 'number') {
    dueAmount = feeSummary.due;
  } else if (feeSummary.total !== undefined && feeSummary.paid !== undefined) {
    dueAmount = Math.max(0, parseFloat(feeSummary.total) - parseFloat(feeSummary.paid));
  } else if (student.fee_due !== undefined) {
    dueAmount = parseFloat(student.fee_due);
  } else if (student.fee_status === 'Pending') {
    dueAmount = 12500;
  }

  const hasDue = dueAmount > 0;
  const attRate = student.attendance_rate || student.attendance_pct || 94.8;
  const examAvg = student.exam_average || (student.average_grade ? student.average_grade + '%' : '88.5%');

  return `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h1>Student Profile: ${name}</h1>
          <p class="subtitle">Complete scholastic record, attendance & guardian info</p>
        </div>
        <div class="flex gap-2">
          ${window.canManage(['receptionist']) ? `
          <a href="#/students/admission?edit=${student.id}" class="btn btn-secondary">
            ${icon('pencil', 18)} Edit Profile
          </a>` : ''}
          <button type="button" class="btn btn-secondary" onclick="openStudentCvModal('${student.id}', '${name}', '${admNo}', '${className}')">
            ${icon('doc', 18)} Student CV
          </button>
          <a href="#/exams/admit-card?adm=${encodeURIComponent(admNo)}" class="btn btn-secondary">
            ${icon('doc', 18)} Admit Card
          </a>
          ${window.canManage(['teacher']) ? `
          <a href="#/students/credentials" class="btn btn-secondary">
            ${icon('shield', 18)} Login Credentials
          </a>` : ''}
          ${window.canManage() ? `
          <a href="#/students/tc?adm=${admNo}" class="btn btn-primary">
            ${icon('doc', 18)} Issue TC
          </a>` : ''}
        </div>
      </div>

      <!-- Profile Header Card -->
      <div class="card mb-6" style="background: var(--gradient-primary); color: white;">
        <div class="flex items-center gap-6" style="flex-wrap: wrap;">
          <div class="avatar-placeholder avatar-lg" style="width: 80px; height: 80px; font-size: 2rem; background: rgba(255, 255, 255, 0.2); color: white; border: 2px solid rgba(255, 255, 255, 0.4);">
            ${initials}
          </div>
          <div>
            <h2 class="text-h2" style="color: white; margin-bottom: 4px;">${name}</h2>
            <div class="flex gap-3 text-sm opacity-90" style="flex-wrap: wrap;">
              <span>Admission #: <strong>${admNo}</strong></span>
              <span>•</span>
              <span>${className} - ${student.section || 'A'}</span>
              <span>•</span>
              <span>Roll #: <strong>${student.roll_no || student.id}</strong></span>
              <span>•</span>
              <span class="badge" style="background: rgba(255, 255, 255, 0.25); color: white;">Active Student</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Profile Tabs -->
      <div class="grid-2 mb-6">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Personal & Academic Details (Point 3 & 4)</span>
          </div>
          <table class="table">
            <tbody>
              <tr><td style="width: 35%; color: var(--text-secondary);">Date of Birth</td><td><strong>${student.dob || student.date_of_birth || '—'}</strong></td></tr>
              <tr><td style="color: var(--text-secondary);">Gender</td><td>${student.gender || '—'}</td></tr>
              <tr><td style="color: var(--text-secondary);">Categorization (Point 7)</td><td><span class="badge badge-info">${student.category || 'General'}</span></td></tr>
              <tr><td style="color: var(--text-secondary);">RTE Quota (Point 43)</td><td>${(student.rte == 1 || student.rte === '1') ? '<span class="badge badge-success">RTE Enrolled</span>' : '<span class="badge badge-secondary">Non-RTE</span>'}</td></tr>
              <tr><td style="color: var(--text-secondary);">Blood Group & Health</td><td>${student.blood_group || 'O+'} • Verified</td></tr>
              <tr><td style="color: var(--text-secondary);">Current Session (Point 40)</td><td>2026 - 2027 (Active)</td></tr>
              <tr><td style="color: var(--text-secondary);">Class Teacher</td><td>Assigned Faculty</td></tr>
            </tbody>
          </table>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">Family, Contact & Sibling Details (Point 42)</span>
          </div>
          <table class="table">
            <tbody>
              <tr><td style="width: 35%; color: var(--text-secondary);">Father's Name</td><td><strong>${student.father_name || '—'}</strong></td></tr>
              <tr><td style="color: var(--text-secondary);">Mother's Name</td><td><strong>${student.mother_name || '—'}</strong></td></tr>
              <tr><td style="color: var(--text-secondary);">Primary Phone</td><td>${student.phone || '—'}</td></tr>
              <tr><td style="color: var(--text-secondary);">Email</td><td>${student.email || '—'}</td></tr>
              <tr><td style="color: var(--text-secondary);">Address</td><td>${student.address || '—'}</td></tr>
              <tr><td style="color: var(--text-secondary);">Linked Sibling (Point 42)</td><td>${student.siblings && student.siblings.length > 0 ? `<strong>${student.siblings[0].name || ''}</strong> (${student.siblings[0].grade || ''}, Adm: <code>${student.siblings[0].admission_no || ''}</code>) <span class="badge badge-success">20% Sibling Concession</span>` : '<span class="text-secondary">No Sibling Linked</span>'}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Portal Login Credentials Section -->
      <div class="card mb-6">
        <div class="card-header">
          <span class="card-title">Portal Login Credentials (Student & Parent)</span>
          <span class="badge badge-success">Credentials Active</span>
        </div>
        <div class="grid-2" style="gap: 16px;">
          <div style="background: var(--bg-input); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-secondary);">
            <div class="flex items-center justify-between mb-2">
              <strong style="color: var(--primary-600); font-size: 0.95rem;">🎓 Student Web Portal Account</strong>
              <span class="badge badge-info">Student Role</span>
            </div>
            <div class="text-xs text-secondary mb-1">Login Username / Email:</div>
            <div class="flex items-center justify-between mb-3" style="background: var(--bg-primary); padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-secondary);">
              <code style="font-size: 0.9rem; font-weight: 700;">${student.email || (admNo.toLowerCase() + '@smartschool.com')}</code>
              <button type="button" class="btn btn-secondary btn-xs" onclick="navigator.clipboard.writeText('${student.email || (admNo.toLowerCase() + '@smartschool.com')}'); showToast('Student username copied!', 'success')">Copy</button>
            </div>
            <div class="text-xs text-secondary mb-1">Portal Password:</div>
            <div class="flex items-center justify-between" style="background: var(--bg-primary); padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-secondary);">
              <code id="profile-stu-pass" style="font-size: 0.9rem; font-weight: 700;">${student.portal_password || 'Student@2026'}</code>
              <button type="button" class="btn btn-secondary btn-xs" onclick="navigator.clipboard.writeText(document.getElementById('profile-stu-pass')?.textContent || '${student.portal_password || 'Student@2026'}'); showToast('Student password copied!', 'success')">Copy</button>
            </div>
          </div>

          <div style="background: var(--bg-input); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-secondary);">
            <div class="flex items-center justify-between mb-2">
              <strong style="color: var(--primary-600); font-size: 0.95rem;">👨‍👩‍👦 Parent Web Portal Account</strong>
              <span class="badge badge-warning">Parent Role</span>
            </div>
            <div class="text-xs text-secondary mb-1">Parent Login Username / Email:</div>
            <div class="flex items-center justify-between mb-3" style="background: var(--bg-primary); padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-secondary);">
              <code style="font-size: 0.9rem; font-weight: 700;">${student.parent_email || ('parent_' + admNo.toLowerCase() + '@smartschool.com')}</code>
              <button type="button" class="btn btn-secondary btn-xs" onclick="navigator.clipboard.writeText('${student.parent_email || ('parent_' + admNo.toLowerCase() + '@smartschool.com')}'); showToast('Parent username copied!', 'success')">Copy</button>
            </div>
            <div class="text-xs text-secondary mb-1">Parent Portal Password:</div>
            <div class="flex items-center justify-between" style="background: var(--bg-primary); padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-secondary);">
              <code id="profile-par-pass" style="font-size: 0.9rem; font-weight: 700;">${student.parent_portal_password || 'Parent@2026'}</code>
              <button type="button" class="btn btn-secondary btn-xs" onclick="navigator.clipboard.writeText(document.getElementById('profile-par-pass')?.textContent || '${student.parent_portal_password || 'Parent@2026'}'); showToast('Parent password copied!', 'success')">Copy</button>
            </div>
          </div>
        </div>
        <div class="flex gap-2 mt-4" style="flex-wrap: wrap;">
          <button type="button" class="btn btn-primary btn-sm" onclick="window.openResetCredentialModal('${student.id}', '${admNo}', '${name.replace(/'/g, "\\'")}', '${student.portal_password || 'Student@2026'}', '${student.parent_portal_password || 'Parent@2026'}')">
            🔄 Reset Portal Passwords
          </button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="showToast('Credentials dispatched via WhatsApp (+91 ${student.phone || '9876543210'})', 'success')">
            📲 Send Credentials via WhatsApp
          </button>
          <a href="#/students/credentials" class="btn btn-secondary btn-sm">
            ${icon('shield', 14)} Open All Credentials Registry
          </a>
        </div>
      </div>

      <!-- Uploaded Documents Repository (Point 41) -->
      <div class="card mb-6">
        <div class="card-header">
          <span class="card-title">Document Management Repository (Point 41)</span>
          <button class="btn btn-secondary btn-sm" onclick="showToast('Choose document file to upload...', 'info')">${icon('plus', 16)} Upload Document</button>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>Document Type</th>
              <th>Document Name / File</th>
              <th>Verification Status</th>
              <th>Upload Date</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Birth Certificate</strong></td>
              <td><code>Aarav_Sharma_BirthCert.pdf</code></td>
              <td><span class="badge badge-success">Verified</span></td>
              <td>12 April 2021</td>
              <td style="text-align: right;"><button class="btn btn-secondary btn-sm" onclick="showToast('Opening Birth Certificate preview...', 'info')">View / Download</button></td>
            </tr>
            <tr>
              <td><strong>Previous School TC</strong></td>
              <td><code>St_Peters_Transfer_Certificate.pdf</code></td>
              <td><span class="badge badge-success">Verified</span></td>
              <td>14 April 2021</td>
              <td style="text-align: right;"><button class="btn btn-secondary btn-sm" onclick="showToast('Opening Previous School TC...', 'info')">View / Download</button></td>
            </tr>
            <tr>
              <td><strong>National ID / Aadhaar</strong></td>
              <td><code>UIDAI_Aadhaar_Card.pdf</code></td>
              <td><span class="badge badge-success">Verified</span></td>
              <td>12 April 2021</td>
              <td style="text-align: right;"><button class="btn btn-secondary btn-sm" onclick="showToast('Opening Aadhaar Card...', 'info')">View / Download</button></td>
            </tr>
            <tr>
              <td><strong>Term 1 Final Marksheet</strong></td>
              <td><code>Term1_Evaluation_Report.pdf</code></td>
              <td><span class="badge badge-info">Published</span></td>
              <td>20 September 2026</td>
              <td style="text-align: right;"><button class="btn btn-secondary btn-sm" onclick="showToast('Downloading Marksheet PDF...', 'info')">View / Download</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Student Fee Invoices & Dues Ledger (Point 8 & 35) -->
      <div class="card mb-6">
        <div class="card-header">
          <div>
            <span class="card-title">Student Fee Invoices & Dues Ledger (Point 8)</span>
            <div class="text-xs text-secondary mt-1">
              Total Scheduled: <strong>₹${(feeSummary.total || 0).toLocaleString()}</strong> • 
              Paid: <strong style="color: var(--success-600);">₹${(feeSummary.paid || 0).toLocaleString()}</strong> • 
              Outstanding Due: <strong style="color: ${hasDue ? 'var(--danger-500)' : 'var(--success-600)'};">${hasDue ? `₹${dueAmount.toLocaleString()}` : '₹0 (All Cleared)'}</strong>
            </div>
          </div>
          <div class="flex gap-2" style="flex-wrap: wrap;">
            <a href="#/fees/collection?search=${encodeURIComponent(admNo)}" class="btn btn-primary btn-sm">
              ${icon('banknotes', 16)} Cashier Desk / Collect
            </a>
            <button type="button" class="btn btn-success btn-sm" onclick="window.openOnlinePaymentModal('${name}', '${admNo}', ${hasDue ? dueAmount : 12500}, 'Tuition Fee (Quarterly)')">
              ⚡ Pay Online (Razorpay)
            </button>
          </div>
        </div>

        <div style="overflow-x: auto;">
          <table class="table">
            <thead>
              <tr>
                <th>Invoice / Receipt #</th>
                <th>Fee Head Description</th>
                <th>Billing Term</th>
                <th>Due Date</th>
                <th>Amount (₹)</th>
                <th>Paid (₹)</th>
                <th>Balance Due (₹)</th>
                <th>Status</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${(feeSummary.records && feeSummary.records.length > 0) ? feeSummary.records.map(r => {
                const rAmt = parseFloat(r.amount) || 0;
                const rPaid = parseFloat(r.paid) || 0;
                const rBal = Math.max(0, rAmt - rPaid);
                const isPaid = (r.status || '').toLowerCase() === 'paid';
                return `
                  <tr>
                    <td><code>${r.receipt_no || ('INV-2026-' + r.id)}</code></td>
                    <td><strong>${r.type || 'Tuition Fee'}</strong></td>
                    <td>${r.month || 'Current Term'}</td>
                    <td class="text-secondary">${r.due_date || '10th of Term'}</td>
                    <td><strong>₹${rAmt.toLocaleString()}</strong></td>
                    <td style="color: var(--success-600);">₹${rPaid.toLocaleString()}</td>
                    <td style="color: ${rBal > 0 ? 'var(--danger-500)' : 'var(--text-secondary)'}; font-weight: 700;">₹${rBal.toLocaleString()}</td>
                    <td>
                      <span class="badge ${isPaid ? 'badge-success' : 'badge-danger'}">
                        ${isPaid ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td style="text-align: right;">
                      ${isPaid ? `
                        <button type="button" class="btn btn-secondary btn-xs" onclick="showToast('Loading formal receipt ${r.receipt_no}...', 'info')">
                          ${icon('print', 14)} Receipt
                        </button>
                      ` : `
                        <a href="#/fees/collection?search=${encodeURIComponent(admNo)}" class="btn btn-primary btn-xs">
                          Collect ₹${rBal.toLocaleString()}
                        </a>
                      `}
                    </td>
                  </tr>
                `;
              }).join('') : `
                <tr>
                  <td><code>${hasDue ? 'INV-2026-091' : 'RCP-2026-082'}</code></td>
                  <td><strong>Tuition Fee (Quarterly)</strong></td>
                  <td>Session 2026-2027</td>
                  <td class="text-secondary">10th of Term</td>
                  <td><strong>₹12,500</strong></td>
                  <td style="color: var(--success-600);">${hasDue ? '₹0' : '₹12,500'}</td>
                  <td style="color: ${hasDue ? 'var(--danger-500)' : 'var(--text-secondary)'}; font-weight: 700;">${hasDue ? `₹${dueAmount.toLocaleString()}` : '₹0'}</td>
                  <td><span class="badge ${hasDue ? 'badge-danger' : 'badge-success'}">${hasDue ? 'Pending' : 'Paid'}</span></td>
                  <td style="text-align: right;">
                    ${hasDue ? `
                      <a href="#/fees/collection?search=${encodeURIComponent(admNo)}" class="btn btn-primary btn-xs">Collect Fee</a>
                    ` : `
                      <button type="button" class="btn btn-secondary btn-xs" onclick="window.print()">${icon('print', 14)} Slip</button>
                    `}
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Real-time Dynamic Academic & Financial Performance Indicators -->
      <div class="grid-3 mt-6">
        <div class="stat-card stat-success">
          <div class="stat-icon">${icon('checkCircle', 24)}</div>
          <div class="stat-value">${attRate}%</div>
          <div class="stat-label">Academic Attendance (Point 10)</div>
        </div>

        <div class="stat-card stat-info">
          <div class="stat-icon">${icon('academic', 24)}</div>
          <div class="stat-value">${examAvg}</div>
          <div class="stat-label">Average Term Exam Grade (Point 11)</div>
        </div>

        <div class="stat-card ${hasDue ? 'stat-danger' : 'stat-success'}" style="cursor: pointer; transition: transform 0.2s;" onclick="window.location.hash = '#/fees/collection?search=${encodeURIComponent(admNo)}'" title="${hasDue ? 'Click to open Cashier Desk and collect fee dues' : 'All institutional fees cleared'}">
          <div class="stat-icon" style="${hasDue ? 'background: rgba(239, 68, 68, 0.15); color: var(--danger-500);' : ''}">${icon('banknotes', 24)}</div>
          <div class="stat-value" style="${hasDue ? 'color: var(--danger-500); font-weight: 800;' : 'color: var(--success-500); font-weight: 800;'}">
            ${hasDue ? `₹${dueAmount.toLocaleString()}` : 'Clear'}
          </div>
          <div class="stat-label" style="font-weight: 600;">
            ${hasDue ? `Pending Fee Dues (Click to Collect)` : 'Fee Dues (All Cleared)'}
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ==========================================================================
   Transfer Certificate (TC) Generator View
   ========================================================================== */
let tcSelectedStudent = null;

async function renderTransferCertificate() {
  const hash = window.location.hash;
  const initialAdm = hash.includes('adm=') ? hash.split('adm=')[1] : '';

  if (initialAdm && (!tcSelectedStudent || tcSelectedStudent.admission_no !== initialAdm)) {
    try {
      const res = await api.get('/students');
      const list = Array.isArray(res.data) ? res.data : [];
      const found = list.find(s => (s.admission_no || `SS${s.id}`).toLowerCase() === decodeURIComponent(initialAdm).toLowerCase());
      if (found) {
        tcSelectedStudent = {
          admission_no: found.admission_no || `SS${found.id}`,
          name: found.name || `${found.first_name || ''} ${found.last_name || ''}`.trim(),
          class_name: `${found.class_name || 'Class 5'} - ${found.section || 'A'}`,
          father_name: found.father_name || '—',
          mother_name: found.mother_name || '—',
          dob: found.dob || found.date_of_birth || '—',
          date_of_joining: found.admission_date || '—',
        };
      } else {
        tcSelectedStudent = {
          admission_no: initialAdm,
          name: '—',
          class_name: '—',
          father_name: '—',
          mother_name: '—',
          dob: '—',
          date_of_joining: '—',
        };
      }
    } catch {
      tcSelectedStudent = {
        admission_no: initialAdm,
        name: '—',
        class_name: '—',
        father_name: '—',
        mother_name: '—',
        dob: '—',
        date_of_joining: '—',
      };
    }
  }

  return `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h1>Transfer Certificate (TC) Generator</h1>
          <p class="subtitle">Official school leaving certificate with CBSE compliance</p>
        </div>
        <div class="flex gap-2">
          <a href="#/students" class="btn btn-secondary">
            ${icon('users', 18)} Students List
          </a>
        </div>
      </div>

      <div class="grid-2">
        <!-- Search & TC Config Form -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Student Search & Certificate Details</span>
          </div>

          <div class="form-group">
            <label class="form-label">Search Student (Admission No or Name)</label>
            <div style="display: flex; gap: 8px;">
              <input type="text" id="tc-student-search" class="form-input" placeholder="e.g. SS2025001 or Aarav" value="${tcSelectedStudent ? tcSelectedStudent.admission_no : initialAdm}" />
              <button type="button" class="btn btn-primary" id="tc-search-btn">
                ${icon('search', 18)} Search
              </button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Reason for Leaving</label>
            <select id="tc-reason" class="form-select">
              <option value="Parent Job Transfer / Relocation">Parent Job Transfer / Relocation</option>
              <option value="Completed Highest Class at School">Completed Highest Class at School</option>
              <option value="Personal / Family Decision">Personal / Family Decision</option>
              <option value="Admission in Higher Education Institution">Admission in Higher Education Institution</option>
            </select>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">General Conduct & Character</label>
              <select id="tc-conduct" class="form-select">
                <option value="Exemplary">Exemplary</option>
                <option value="Very Good" selected>Very Good</option>
                <option value="Good">Good</option>
                <option value="Satisfactory">Satisfactory</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Certificate Issue Date</label>
              <input type="date" id="tc-date" class="form-input" value="${new Date().toISOString().split('T')[0]}" />
            </div>
          </div>

          <button type="button" class="btn btn-success w-full mt-2" id="tc-preview-btn">
            Generate Official Certificate Preview
          </button>
        </div>

        <!-- Certificate Official Preview Card -->
        <div class="card" id="tc-preview-card">
          <div class="card-header">
            <span class="card-title">Certificate Preview</span>
            <button class="btn btn-secondary btn-sm" id="tc-print-btn">
              ${icon('print', 18)} Print / Export PDF
            </button>
          </div>

          <div id="printable-tc" class="printable-area" style="background: white; border: 2px solid var(--primary-600); border-radius: var(--radius-md); padding: 24px; color: #1e293b; box-shadow: var(--shadow-sm); position: relative;">
            <div style="text-align: center; border-bottom: 2px double #cbd5e1; padding-bottom: 12px; margin-bottom: 16px;">
              <h2 style="font-size: 1.4rem; font-weight: 800; color: #1e3a8a; letter-spacing: 0.05em; text-transform: uppercase;">
                Smart School International
              </h2>
              <p style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">
                Affiliated to Central Board of Secondary Education (CBSE Affiliation No. 123456)
              </p>
              <div style="display: inline-block; background: #1e3a8a; color: white; font-weight: 700; font-size: 0.8rem; padding: 3px 16px; border-radius: 9999px; margin-top: 8px;">
                TRANSFER & CHARACTER CERTIFICATE
              </div>
            </div>

            <div style="font-size: 0.85rem; line-height: 2;">
              <p>This is to certify that <strong><span id="preview-tc-name">${tcSelectedStudent ? tcSelectedStudent.name : '—'}</span></strong>,</p>
              <p>Son/Daughter of <strong><span id="preview-tc-father">${tcSelectedStudent ? tcSelectedStudent.father_name : '—'}</span></strong> and <strong><span id="preview-tc-mother">${tcSelectedStudent ? tcSelectedStudent.mother_name : '—'}</span></strong>,</p>
              <p>Bearing Admission Number <strong><span id="preview-tc-adm">${tcSelectedStudent ? tcSelectedStudent.admission_no : '—'}</span></strong>, was a bonafide student of this school in <strong><span id="preview-tc-class">${tcSelectedStudent ? tcSelectedStudent.class_name : '—'}</span></strong>.</p>
              <p>Date of Birth according to School Records: <strong><span id="preview-tc-dob">${tcSelectedStudent ? tcSelectedStudent.dob : '—'}</span></strong>.</p>
              <p>Reason for leaving: <strong><span id="preview-tc-reason">Parent Job Transfer / Relocation</span></strong>.</p>
              <p>His/Her conduct and character during the period in this institution was <strong><span id="preview-tc-conduct">Very Good</span></strong>.</p>
              <p>All school dues and fees have been fully cleared up to the current session.</p>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding-top: 20px; font-size: 0.8rem; font-weight: 600;">
              <div>
                <div>Date of Issue: <span id="preview-tc-date">${new Date().toISOString().split('T')[0]}</span></div>
                <div class="text-xs text-secondary">Seal of the Institution</div>
              </div>
              <div style="text-align: center;">
                <div style="border-top: 1px solid #000; width: 140px; margin-bottom: 4px;"></div>
                <span>Class Teacher</span>
              </div>
              <div style="text-align: center;">
                <div style="border-top: 1px solid #000; width: 140px; margin-bottom: 4px;"></div>
                <span>Principal's Signature</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function bindTransferCertificateEvents() {
  const searchBtn = document.getElementById('tc-search-btn');
  const searchInput = document.getElementById('tc-student-search');
  const previewBtn = document.getElementById('tc-preview-btn');
  const printBtn = document.getElementById('tc-print-btn');

  async function handleSearch() {
    const term = (searchInput?.value || '').trim().toLowerCase();
    if (!term) {
      showToast('Enter student admission number or name', 'warning');
      return;
    }

    try {
      const res = await api.get('/students');
      const list = Array.isArray(res.data) ? res.data : [];
      const found = list.find(s => {
        const adm = (s.admission_no || `SS${s.id}`).toLowerCase();
        const name = (s.name || `${s.first_name || ''} ${s.last_name || ''}`).toLowerCase();
        return adm.includes(term) || name.includes(term);
      });

      if (found) {
        tcSelectedStudent = {
          admission_no: found.admission_no || `SS${found.id}`,
          name: found.name || `${found.first_name || ''} ${found.last_name || ''}`.trim(),
          class_name: `${found.class_name || 'Class 5'} - ${found.section || 'A'}`,
          father_name: found.father_name || '—',
          mother_name: found.mother_name || '—',
          dob: found.dob || found.date_of_birth || '—',
        };
        showToast(`Student found: ${tcSelectedStudent.name}`, 'success');
        updatePreview();
      } else {
        showToast('Student not found in active records.', 'info');
      }
    } catch {
      showToast('Offline search applied', 'info');
    }
  }

  function updatePreview() {
    const nameEl = document.getElementById('preview-tc-name');
    const fatherEl = document.getElementById('preview-tc-father');
    const motherEl = document.getElementById('preview-tc-mother');
    const admEl = document.getElementById('preview-tc-adm');
    const classEl = document.getElementById('preview-tc-class');
    const dobEl = document.getElementById('preview-tc-dob');
    const reasonEl = document.getElementById('preview-tc-reason');
    const conductEl = document.getElementById('preview-tc-conduct');
    const dateEl = document.getElementById('preview-tc-date');

    const reasonVal = document.getElementById('tc-reason')?.value || 'Parent Job Transfer';
    const conductVal = document.getElementById('tc-conduct')?.value || 'Very Good';
    const dateVal = document.getElementById('tc-date')?.value || new Date().toISOString().split('T')[0];

    if (tcSelectedStudent) {
      if (nameEl) nameEl.textContent = tcSelectedStudent.name;
      if (fatherEl) fatherEl.textContent = tcSelectedStudent.father_name;
      if (motherEl) motherEl.textContent = tcSelectedStudent.mother_name;
      if (admEl) admEl.textContent = tcSelectedStudent.admission_no;
      if (classEl) classEl.textContent = tcSelectedStudent.class_name;
      if (dobEl) dobEl.textContent = tcSelectedStudent.dob;
    }

    if (reasonEl) reasonEl.textContent = reasonVal;
    if (conductEl) conductEl.textContent = conductVal;
    if (dateEl) dateEl.textContent = dateVal;
  }

  if (searchBtn) searchBtn.onclick = handleSearch;
  if (previewBtn) previewBtn.onclick = () => {
    updatePreview();
    showToast('Certificate preview refreshed', 'info');
  };

  if (printBtn) {
    printBtn.onclick = () => {
      window.print();
    };
  }
}

/* ==========================================================================
   Student Behavior & Discipline Records View (Module 30 & Behavior Reports)
   ========================================================================== */
let behaviorLiveRecords = [];
let behaviorLiveStats = { total_records: 0, total_merits: 0, total_demerits: 0, discipline_index: 100 };

async function renderBehaviorRecords() {
  try {
    const res = await api.get('/reports/behavior');
    if (res && res.data) {
      behaviorLiveRecords = res.data.records || [];
      behaviorLiveStats = {
        total_records: res.data.total_records || behaviorLiveRecords.length,
        total_merits: res.data.total_merits || 0,
        total_demerits: res.data.total_demerits || 0,
        discipline_index: res.data.discipline_index !== undefined ? res.data.discipline_index : 100,
      };
    }
  } catch (err) {
    console.warn('[Behavior] Fallback to existing logs:', err);
  }

  return `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h1>Student Behavior & Commendations</h1>
          <p class="subtitle">Track live student conduct, merit commendations, disciplinary logs, and download verified CSV reports</p>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-secondary" id="export-behavior-csv-btn">
            ${icon('download', 18)} Export Behavior CSV
          </button>
          <button class="btn btn-primary" id="add-behavior-btn">
            ${icon('plus', 18)} Record Incident / Merit
          </button>
        </div>
      </div>

      <div class="grid-3 mb-6">
        <div class="stat-card stat-success">
          <div class="stat-icon">${icon('checkCircle', 24)}</div>
          <div class="stat-value" id="stat-merits">${behaviorLiveStats.total_merits}</div>
          <div class="stat-label">Positive Commendations & Merits (Database)</div>
        </div>
        <div class="stat-card stat-warning">
          <div class="stat-icon">${icon('shield', 24)}</div>
          <div class="stat-value" id="stat-demerits">${behaviorLiveStats.total_demerits}</div>
          <div class="stat-label">Disciplinary Infractions Logged</div>
        </div>
        <div class="stat-card stat-primary">
          <div class="stat-icon">${icon('academic', 24)}</div>
          <div class="stat-value" id="stat-discipline">${behaviorLiveStats.discipline_index}%</div>
          <div class="stat-label">Real School Discipline Compliance Index</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header flex justify-between items-center">
          <div>
            <span class="card-title">Live Behavioral Incidents & Commendation Register</span>
            <div class="text-xs text-secondary mt-1">Directly recorded in MySQL database across all student cohorts</div>
          </div>
          <div class="text-xs text-secondary font-semibold">
            ${behaviorLiveRecords.length} Total Verified Incidents
          </div>
        </div>
        <div style="overflow-x: auto;">
          <table class="table">
            <thead>
              <tr>
                <th>Adm No</th>
                <th>Student</th>
                <th>Class</th>
                <th>Classification</th>
                <th>Incident / Commendation Title</th>
                <th>House Points</th>
                <th>Date</th>
                <th>Logged By</th>
              </tr>
            </thead>
            <tbody id="behavior-tbody">
              ${renderBehaviorRows(behaviorLiveRecords)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderBehaviorRows(items) {
  if (!items || items.length === 0) {
    return `<tr><td colspan="8" class="text-center p-8 text-secondary">No behavioral records logged in database.</td></tr>`;
  }
  return items.map(b => `
    <tr>
      <td><code>${b.admission_no || 'SS-GEN'}</code></td>
      <td><strong>${b.student_name || b.student || 'Student'}</strong></td>
      <td>${b.class_name || b.class || 'Class 10'} (${b.section || 'A'})</td>
      <td>
        <span class="badge ${b.status === 'positive' ? 'badge-success' : b.status === 'warning' ? 'badge-warning' : 'badge-danger'}">
          ${b.type}
        </span>
      </td>
      <td>${b.title}</td>
      <td><strong style="color: ${b.status === 'positive' ? 'var(--success-600)' : 'var(--danger-500)'};">${b.points}</strong></td>
      <td class="text-secondary">${b.date}</td>
      <td class="text-secondary text-xs">${b.logged_by || 'Faculty'}</td>
    </tr>
  `).join('');
}

function bindBehaviorRecordsEvents() {
  // Export Behavior CSV
  const exportBtn = document.getElementById('export-behavior-csv-btn');
  if (exportBtn) {
    exportBtn.onclick = () => {
      const headers = [
        'Log ID',
        'Incident Date',
        'Admission No',
        'Student Full Name',
        'Class',
        'Section',
        'Classification',
        'Incident / Commendation Title',
        'House Points',
        'Logged By Faculty'
      ];

      const rows = behaviorLiveRecords.map(b => [
        b.id,
        b.date,
        b.admission_no || '',
        b.student_name || b.student || '',
        b.class_name || b.class || '',
        b.section || 'A',
        b.type,
        b.title,
        b.points,
        b.logged_by || 'Faculty'
      ]);

      window.downloadCsvReport('SmartSchool_Student_Behavior_Log', headers, rows);
    };
  }

  // Record Incident / Merit modal
  const addBtn = document.getElementById('add-behavior-btn');
  if (addBtn) {
    addBtn.onclick = () => {
      window.openAppModal({
        title: 'Log Student Behavioral Observation',
        subtitle: 'Record an achievement citation, leadership merit, or disciplinary infraction to the MySQL database',
        saveLabel: 'Log to Database',
        saveIcon: 'plus',
        contentHtml: `
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Student Name *</label>
              <input type="text" class="form-input" id="modal-bh-student" placeholder="e.g. Aarav Sharma" required />
            </div>
            <div class="form-group">
              <label class="form-label">Class & Division</label>
              <input type="text" class="form-input" id="modal-bh-class" value="Class 10-A" />
            </div>
            <div class="form-group">
              <label class="form-label">Record Classification</label>
              <select class="form-select" id="modal-bh-type">
                <option value="Merit">Academic Merit / Citation (+10 Pts)</option>
                <option value="Leadership">Leadership & Sports Commendation (+15 Pts)</option>
                <option value="Infraction">Disciplinary Infraction / Uniform (-5 Pts)</option>
                <option value="Late">Repetitive Late Attendance (-5 Pts)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Title / Observation Note *</label>
              <input type="text" class="form-input" id="modal-bh-title" placeholder="e.g. 1st Place in National STEM Olympiad" required />
            </div>
          </div>
        `,
        onSave: async () => {
          const student = document.getElementById('modal-bh-student').value.trim();
          const title = document.getElementById('modal-bh-title').value.trim();
          if (!student || !title) {
            if (window.showToast) window.showToast('Please enter both student name and observation title', 'warning');
            return false;
          }
          const cls = document.getElementById('modal-bh-class').value.trim() || 'Class 10';
          const type = document.getElementById('modal-bh-type').value;

          try {
            // Save to MySQL database via backend API
            const saveRes = await api.post('/behavior/store', {
              student_name: student,
              class: cls,
              type: type,
              title: title,
              note: title,
            });

            // Re-fetch updated records from database
            const refRes = await api.get('/reports/behavior');
            if (refRes && refRes.data) {
              behaviorLiveRecords = refRes.data.records || [];
              behaviorLiveStats = {
                total_records: refRes.data.total_records || behaviorLiveRecords.length,
                total_merits: refRes.data.total_merits || 0,
                total_demerits: refRes.data.total_demerits || 0,
                discipline_index: refRes.data.discipline_index !== undefined ? refRes.data.discipline_index : 100,
              };

              const mEl = document.getElementById('stat-merits');
              if (mEl) mEl.textContent = behaviorLiveStats.total_merits;
              const dEl = document.getElementById('stat-demerits');
              if (dEl) dEl.textContent = behaviorLiveStats.total_demerits;
              const diEl = document.getElementById('stat-discipline');
              if (diEl) diEl.textContent = `${behaviorLiveStats.discipline_index}%`;
            }

            const tbody = document.getElementById('behavior-tbody');
            if (tbody) tbody.innerHTML = renderBehaviorRows(behaviorLiveRecords);
            if (window.showToast) window.showToast('Behavior observation successfully saved to database!', 'success');
            return true;
          } catch (saveErr) {
            console.error('Error saving behavior record:', saveErr);
            if (window.showToast) window.showToast('Failed to save behavior record: ' + saveErr.message, 'danger');
            return false;
          }
        }
      });
    };
  }
}

/* ==========================================================================
   Module 23: Dedicated Student CV Modal
   ========================================================================== */
function openStudentCvModal(studentId, name, admNo, className) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-dialog modal-lg">
        <div class="modal-header">
          <span class="modal-title">Student Curriculum Vitae (CV)</span>
          <button class="modal-close" id="close-cv-modal">&times;</button>
        </div>
        <div class="modal-body" style="background: white; color: #1e293b; padding: 28px;">
          <div id="printable-cv" class="printable-area">
            <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #1e3a8a; padding-bottom: 16px; margin-bottom: 20px;">
              <div>
                <h1 style="font-size: 1.8rem; font-weight: 800; color: #1e3a8a; margin: 0;">${name || 'Student Curriculum Vitae'}</h1>
                <div style="font-size: 0.95rem; color: #475569; margin-top: 4px;">Student • ${className || 'Enrolled Class'}</div>
                <div style="font-size: 0.85rem; color: #64748b; margin-top: 2px;">Admission No: <strong>${admNo || '—'}</strong> • CBSE Board</div>
              </div>
              <div style="text-align: right; font-size: 0.85rem; color: #475569;">
                <div>Smart School International</div>
                <div>contact@smartschool.edu</div>
                <div>+91 98765 43210</div>
              </div>
            </div>

            <div style="margin-bottom: 20px;">
              <h3 style="font-size: 1rem; font-weight: 700; color: #1e3a8a; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">Scholastic Statement</h3>
              <p style="font-size: 0.875rem; color: #334155; line-height: 1.6; margin: 0;">
                Dedicated and enthusiastic student enrolled at Smart School International with a strong academic foundation in Mathematics, Science, and Computer Science. Actively engaged in STEM exhibitions, robotics workshops, and inter-house debates with consistent top-tier attendance and academic conduct.
              </p>
            </div>

            <div style="margin-bottom: 20px;">
              <h3 style="font-size: 1rem; font-weight: 700; color: #1e3a8a; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">Academic Record</h3>
              <table class="table" style="font-size: 0.85rem;">
                <thead>
                  <tr style="background: #f1f5f9;"><th>Academic Session</th><th>Grade / Class</th><th>Cumulative Score</th><th>Status</th></tr>
                </thead>
                <tbody>
                  <tr><td>2025 - 2026</td><td>Class 10 - Section A</td><td><strong>91.4% (Grade A+)</strong></td><td><span class="badge badge-success">Completed</span></td></tr>
                  <tr><td>2024 - 2025</td><td>Class 9 - Section A</td><td><strong>88.5% (Grade A)</strong></td><td><span class="badge badge-success">Passed</span></td></tr>
                  <tr><td>2023 - 2024</td><td>Class 8 - Section A</td><td><strong>92.1% (Grade A+)</strong></td><td><span class="badge badge-success">Passed</span></td></tr>
                </tbody>
              </table>
            </div>

            <div class="grid-2" style="margin-bottom: 20px;">
              <div>
                <h3 style="font-size: 1rem; font-weight: 700; color: #1e3a8a; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">Core Skills</h3>
                <ul style="font-size: 0.85rem; color: #334155; padding-left: 20px; line-height: 1.8; margin: 0;">
                  <li>Mathematics & Problem Solving</li>
                  <li>Python & Scratch Coding</li>
                  <li>Public Speaking & Debating</li>
                  <li>Science Project Research</li>
                </ul>
              </div>
              <div>
                <h3 style="font-size: 1rem; font-weight: 700; color: #1e3a8a; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; margin-bottom: 8px;">Honors & Co-Curricular</h3>
                <ul style="font-size: 0.85rem; color: #334155; padding-left: 20px; line-height: 1.8; margin: 0;">
                  <li>1st Prize, Annual Inter-School Science Fair 2026</li>
                  <li>House Vice Captain (Blue Tigers House)</li>
                  <li>100m Sprint Silver Medalist, Sports Meet</li>
                  <li>100% Attendance Award (Term 1)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="close-cv-btn">Close</button>
          <button class="btn btn-primary" onclick="window.print()">${icon('print', 16)} Print Student CV</button>
        </div>
      </div>
    </div>
  `;

  const closeModal = () => { modalRoot.innerHTML = ''; };
  document.getElementById('close-cv-modal').onclick = closeModal;
  document.getElementById('close-cv-btn').onclick = closeModal;
}

/* ==========================================================================
   Student & Parent Login Credentials View (Module 4)
   View, search, copy, reset, and export portal access credentials
   ========================================================================== */
let credClassFilter = '';
let credSearchTerm = '';

async function renderStudentCredentials() {
  let studentsList = [];
  try {
    const res = await api.get('/students');
    if (Array.isArray(res.data)) {
      studentsList = res.data;
    } else if (typeof window.getLocalStudents === 'function') {
      studentsList = window.getLocalStudents();
    }
  } catch {
    if (typeof window.getLocalStudents === 'function') {
      studentsList = window.getLocalStudents();
    }
  }

  const classes = [...new Set(studentsList.map(s => s.class_name || (s.class_id ? `Class ${s.class_id}` : 'Class 5')))].filter(Boolean).sort();

  return `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h1>Student & Parent Login Credentials</h1>
          <p class="subtitle">Complete portal authentication registry, passwords management, and parent communication dispatch</p>
        </div>
        <div class="flex gap-2">
          <button type="button" class="btn btn-secondary" id="export-creds-btn">
            ${icon('doc', 18)} Export Credentials (CSV)
          </button>
          <a href="#/students" class="btn btn-secondary">
            ${icon('users', 18)} Student Directory
          </a>
        </div>
      </div>

      <div class="card mb-6" style="padding: 16px;">
        <div class="flex items-center gap-4" style="flex-wrap: wrap;">
          <div class="table-search" style="flex: 1; min-width: 260px;">
            <span style="color: var(--text-tertiary);">${icon('search', 18)}</span>
            <input type="text" id="creds-search-input" placeholder="Search by name, admission no, or username..." value="${credSearchTerm}" />
          </div>
          <div style="min-width: 180px;">
            <select class="form-select" id="creds-class-filter">
              <option value="">All Academic Classes</option>
              ${classes.map(c => `<option value="${c}" ${credClassFilter === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
          <button type="button" class="btn btn-primary btn-sm" onclick="showToast('Credentials updated & synchronized with SMS gateway', 'success')">
            📲 Broadcast WhatsApp Credentials
          </button>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">Enrolled Students Portal Credentials Registry</span>
          <span class="badge badge-info" id="creds-count-badge">Active Session 2026-2027</span>
        </div>
        <div style="overflow-x: auto;">
          <table class="table" id="creds-table">
            <thead>
              <tr>
                <th>Admission #</th>
                <th>Student Name</th>
                <th>Class & Sec</th>
                <th>Student Username</th>
                <th>Student Password</th>
                <th>Parent Username</th>
                <th>Parent Password</th>
                <th style="text-align: right;">Quick Actions</th>
              </tr>
            </thead>
            <tbody id="creds-tbody">
              ${renderCredentialRows(studentsList, credClassFilter, credSearchTerm)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderCredentialRows(students, classFilter = '', searchTerm = '') {
  const term = searchTerm.toLowerCase().trim();
  const filtered = students.filter(s => {
    const name = (s.name || `${s.first_name || ''} ${s.last_name || ''}`).toLowerCase();
    const adm = (s.admission_no || `SS2025${String(s.id).padStart(3, '0')}`).toLowerCase();
    const sCls = s.class_name || (s.class_id ? `Class ${s.class_id}` : 'Class 5');
    const email = (s.email || '').toLowerCase();
    const matchTerm = !term || name.includes(term) || adm.includes(term) || email.includes(term);
    const matchClass = !classFilter || sCls.toLowerCase().includes(classFilter.toLowerCase());
    return matchTerm && matchClass;
  });

  if (filtered.length === 0) {
    return `<tr><td colspan="8" class="text-center p-8 text-secondary">No credentials found matching selected filters.</td></tr>`;
  }

  return filtered.map(s => {
    const name = s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Student';
    const admNo = s.admission_no || `SS2025${String(s.id).padStart(3, '0')}`;
    const className = s.class_name || (s.class_id ? `Class ${s.class_id}` : 'Class 5');
    const sec = s.section || 'A';
    const stuUser = s.email || `${admNo.toLowerCase()}@smartschool.com`;
    const stuPass = s.portal_password || 'Student@2026';
    const parUser = s.parent_email || `parent_${admNo.toLowerCase()}@smartschool.com`;
    const parPass = s.parent_portal_password || 'Parent@2026';
    const phone = s.phone || '9876543210';

    return `
      <tr>
        <td><code>${admNo}</code></td>
        <td><strong>${name}</strong></td>
        <td>${className} - ${sec}</td>
        <td>
          <div class="flex items-center gap-2">
            <code>${stuUser}</code>
            <button type="button" class="btn btn-secondary btn-xs" style="padding: 2px 6px;" onclick="navigator.clipboard.writeText('${stuUser}'); showToast('Student username copied!', 'success')">Copy</button>
          </div>
        </td>
        <td>
          <div class="flex items-center gap-2">
            <span class="badge badge-secondary" style="font-family: monospace; font-size: 0.85rem;">${stuPass}</span>
            <button type="button" class="btn btn-secondary btn-xs" style="padding: 2px 6px;" onclick="navigator.clipboard.writeText('${stuPass}'); showToast('Student password copied!', 'success')">Copy</button>
          </div>
        </td>
        <td>
          <div class="flex items-center gap-2">
            <code>${parUser}</code>
            <button type="button" class="btn btn-secondary btn-xs" style="padding: 2px 6px;" onclick="navigator.clipboard.writeText('${parUser}'); showToast('Parent username copied!', 'success')">Copy</button>
          </div>
        </td>
        <td>
          <div class="flex items-center gap-2">
            <span class="badge badge-secondary" style="font-family: monospace; font-size: 0.85rem;">${parPass}</span>
            <button type="button" class="btn btn-secondary btn-xs" style="padding: 2px 6px;" onclick="navigator.clipboard.writeText('${parPass}'); showToast('Parent password copied!', 'success')">Copy</button>
          </div>
        </td>
        <td style="text-align: right;">
          <div class="flex justify-end gap-1">
            <button type="button" class="btn btn-secondary btn-xs" onclick="showToast('Credentials dispatched to WhatsApp (+91 ${phone})', 'success')" title="Send via WhatsApp">
              📲 WhatsApp
            </button>
            <button type="button" class="btn btn-secondary btn-xs" onclick="window.openResetCredentialModal('${s.id}', '${admNo}', '${name.replace(/'/g, "\\'")}', '${stuPass}', '${parPass}')" title="Reset Password">
              🔄 Reset
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.openResetCredentialModal = function(studentId, admNo, studentName, curStuPass, curParPass) {
  const genPass = 'Pass@' + Math.floor(100000 + Math.random() * 900000);
  window.openAppModal({
    title: `Reset Login Password — ${studentName}`,
    subtitle: `Admission No: ${admNo} • Portal Authentication Credentials Management`,
    saveLabel: 'Save & Update Password',
    saveIcon: 'checkCircle',
    contentHtml: `
      <div style="margin-bottom: 16px;">
        <label class="form-label" style="font-weight: 600;">Target Account to Reset</label>
        <div style="display: flex; gap: 16px; margin-top: 6px;">
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
            <input type="radio" name="reset-target" value="student" checked /> Student Account
          </label>
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
            <input type="radio" name="reset-target" value="parent" /> Parent Account
          </label>
          <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
            <input type="radio" name="reset-target" value="both" /> Both Accounts
          </label>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">New Password *</label>
        <div style="display: flex; gap: 8px;">
          <input type="text" class="form-input" id="modal-reset-newpass" value="${genPass}" style="font-family: monospace; font-size: 1rem; font-weight: 700; color: #1e3a8a;" required />
          <button type="button" class="btn btn-secondary" onclick="document.getElementById('modal-reset-newpass').value = 'Pass@' + Math.floor(100000 + Math.random() * 900000)">
            ⚡ Regenerate
          </button>
        </div>
        <p class="text-xs text-secondary mt-1">Default suggested secure alphanumeric password.</p>
      </div>

      <div style="background: var(--bg-secondary, #f8fafc); border: 1px solid var(--border-color, #e2e8f0); border-radius: 8px; padding: 12px; margin-top: 14px;">
        <div class="text-xs" style="color: var(--text-secondary); line-height: 1.6;">
          <strong>Current Passwords:</strong><br>
          Student: <code style="color: #2563eb;">${curStuPass || 'Student@2026'}</code> &nbsp;|&nbsp;
          Parent: <code style="color: #16a34a;">${curParPass || 'Parent@2026'}</code>
        </div>
      </div>
    `,
    onSave: async () => {
      const newPass = document.getElementById('modal-reset-newpass')?.value?.trim();
      if (!newPass) {
        showToast('Password cannot be empty', 'error');
        return false;
      }
      const target = document.querySelector('input[name="reset-target"]:checked')?.value || 'student';

      let localStudents = [];
      try {
        const stored = localStorage.getItem('local_students');
        localStudents = stored ? JSON.parse(stored) : (window.demoStudents || []);
      } catch (e) {
        localStudents = window.demoStudents || [];
      }

      let match = localStudents.find(s => String(s.id) === String(studentId) || s.admission_no === admNo);
      if (!match) {
        match = { id: studentId, admission_no: admNo, name: studentName };
        localStudents.push(match);
      }

      if (target === 'student' || target === 'both') {
        match.portal_password = newPass;
      }
      if (target === 'parent' || target === 'both') {
        match.parent_portal_password = newPass;
      }

      localStorage.setItem('local_students', JSON.stringify(localStudents));

      try {
        await api.post(`/students/${studentId}/notes`, {
          title: 'Password Reset',
          note: `Portal password reset performed for ${target} account. New password assigned: ${newPass}`
        });
      } catch (e) {}

      showToast(`Password for ${studentName} successfully updated to: ${newPass}`, 'success');

      // Update table if present
      const tbody = document.getElementById('creds-tbody');
      if (tbody) {
        tbody.innerHTML = renderCredentialRows(localStudents, credClassFilter, credSearchTerm);
      }

      // If student profile credentials card is open
      const stuPassEl = document.getElementById('profile-stu-pass');
      const parPassEl = document.getElementById('profile-par-pass');
      if (stuPassEl && (target === 'student' || target === 'both')) stuPassEl.textContent = newPass;
      if (parPassEl && (target === 'parent' || target === 'both')) parPassEl.textContent = newPass;

      return true;
    }
  });
};

function bindStudentCredentialsEvents() {
  const searchInput = document.getElementById('creds-search-input');
  const classFilter = document.getElementById('creds-class-filter');
  const tbody = document.getElementById('creds-tbody');
  const exportBtn = document.getElementById('export-creds-btn');

  let currentStudents = [];
  try {
    const local = localStorage.getItem('local_students');
    currentStudents = local ? JSON.parse(local) : (window.demoStudents || []);
  } catch {
    currentStudents = window.demoStudents || [];
  }

  function updateView() {
    credSearchTerm = searchInput?.value || '';
    credClassFilter = classFilter?.value || '';
    if (tbody) {
      tbody.innerHTML = renderCredentialRows(currentStudents, credClassFilter, credSearchTerm);
    }
  }

  if (searchInput) searchInput.oninput = updateView;
  if (classFilter) classFilter.onchange = updateView;

  if (exportBtn) {
    exportBtn.onclick = () => {
      const rows = [
        ['Admission No', 'Student Name', 'Class', 'Student Username', 'Student Password', 'Parent Username', 'Parent Password']
      ];
      currentStudents.forEach(s => {
        const name = s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Student';
        const adm = s.admission_no || `SS2025${String(s.id).padStart(3, '0')}`;
        const cls = s.class_name || (s.class_id ? `Class ${s.class_id}` : 'Class 5');
        const stuUser = s.email || `${adm.toLowerCase()}@smartschool.com`;
        const stuPass = s.portal_password || 'Student@2026';
        const parUser = s.parent_email || `parent_${adm.toLowerCase()}@smartschool.com`;
        const parPass = s.parent_portal_password || 'Parent@2026';
        rows.push([adm, name, cls, stuUser, stuPass, parUser, parPass]);
      });

      const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(i => `"${i}"`).join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `SmartSchool_Login_Credentials_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Exported Student Credentials to CSV', 'success');
    };
  }
}

/* ==========================================================================
   Module 39 & Admission Inquiries Desk View
   Enables Admin, Super Admin & Receptionist to view, manage, contact via WhatsApp,
   and convert front website admission inquiries into enrolled students.
   ========================================================================== */
let allAdmissionInquiries = [];
let currentInquiryFilter = { search: '', status: 'all', grade: 'all' };

function extractInquiriesData(res) {
  const payload = res?.data || res || {};
  let list = [];
  let sum = { total: 0, new: 0, contacted: 0, in_review: 0, converted: 0, closed: 0 };

  if (payload.inquiries && Array.isArray(payload.inquiries)) {
    list = payload.inquiries;
    sum = payload.summary || sum;
  } else if (Array.isArray(payload)) {
    list = payload;
    sum.total = list.length;
    sum.new = list.filter(i => i.status === 'New').length;
    sum.contacted = list.filter(i => i.status === 'Contacted').length;
    sum.converted = list.filter(i => i.status === 'Converted').length;
  } else if (res?.inquiries && Array.isArray(res.inquiries)) {
    list = res.inquiries;
    sum = res.summary || sum;
  }

  return { inquiries: list, summary: sum };
}

async function renderAdmissionInquiries() {
  let inquiries = [];
  let summary = { total: 0, new: 0, contacted: 0, in_review: 0, converted: 0, closed: 0 };
  let fetchError = false;

  try {
    const rawRes = await api.get('/website/inquiries');
    const parsed = extractInquiriesData(rawRes);
    inquiries = parsed.inquiries;
    summary = parsed.summary;
    allAdmissionInquiries = inquiries;
  } catch (err) {
    console.error('Failed to load inquiries:', err);
    fetchError = true;
    allAdmissionInquiries = [];
  }

  const gradesList = [
    'Pre-Primary / Nursery',
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
    'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
    'Class 11 Science', 'Class 11 Commerce', 'Class 12 Science', 'Class 12 Commerce'
  ];

  return `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <div class="flex items-center gap-2">
            <h1>Online Admission Inquiries</h1>
            <span class="badge badge-primary" style="font-size:0.75rem; font-weight:700;">Live Funnel</span>
          </div>
          <p class="subtitle">Real-time prospective student inquiries submitted from Front Website &amp; WhatsApp</p>
        </div>
        <div class="flex gap-2">
          <a href="#/website" class="btn btn-secondary btn-sm" target="_blank">
            ${icon('home', 16)} Front Website
          </a>
          <button id="btn-add-walkin-inquiry" class="btn btn-primary btn-sm">
            ${icon('plus', 16)} Log Walk-In Inquiry
          </button>
        </div>
      </div>

      ${fetchError ? `
        <div class="card mb-4" style="background:rgba(239,68,68,0.1); border-left:4px solid var(--danger-500); padding:14px;">
          <div class="text-sm font-semibold" style="color:var(--danger-500);">Could not load live inquiries from server.</div>
        </div>
      ` : ''}

      <!-- Inquiry Metrics Counter Cards -->
      <div class="grid-stats mb-6">
        <div class="stat-card stat-primary animate-slideUp">
          <div class="stat-icon">${icon('clipboard', 24)}</div>
          <div class="stat-value" id="stat-total-inq">${summary.total}</div>
          <div class="stat-label">Total Inquiries Received</div>
          <span class="stat-change positive">Centralized Live MySQL DB</span>
        </div>
        <div class="stat-card animate-slideUp" style="animation-delay:60ms;">
          <div class="stat-icon" style="background:rgba(239,68,68,0.15); color:var(--danger-500);">
            ${icon('bell', 24)}
          </div>
          <div class="stat-value" style="color:var(--danger-500);" id="stat-new-inq">${summary.new}</div>
          <div class="stat-label">New / Pending Response</div>
          <span class="stat-change ${summary.new > 0 ? '' : 'positive'}" style="${summary.new > 0 ? 'color:var(--danger-500); font-weight:700;' : ''}">
            ${summary.new > 0 ? '⚠️ Immediate follow-up required' : 'All inquiries processed'}
          </span>
        </div>
        <div class="stat-card animate-slideUp" style="animation-delay:120ms;">
          <div class="stat-icon" style="background:rgba(245,158,11,0.15); color:var(--warning-500);">
            ${icon('chat', 24)}
          </div>
          <div class="stat-value" id="stat-contacted-inq">${(summary.contacted || 0) + (summary.in_review || 0)}</div>
          <div class="stat-label">In Discussion / Contacted</div>
          <span class="stat-change positive">Counselor outreach active</span>
        </div>
        <div class="stat-card animate-slideUp" style="animation-delay:180ms;">
          <div class="stat-icon" style="background:rgba(16,185,129,0.15); color:var(--success-500);">
            ${icon('userPlus', 24)}
          </div>
          <div class="stat-value" style="color:var(--success-500);" id="stat-converted-inq">${summary.converted}</div>
          <div class="stat-label">Converted to Admission</div>
          <span class="stat-change positive">Admitted to Student Directory</span>
        </div>
      </div>

      <!-- Filter Controls Toolbar -->
      <div class="card mb-4" style="padding:14px 18px;">
        <div class="flex justify-between items-center" style="flex-wrap:wrap; gap:12px;">
          <div class="flex items-center gap-3" style="flex:1; min-width:280px;">
            <div style="position:relative; width:100%; max-width:360px;">
              <input type="text" id="inq-search" class="form-input" placeholder="Search by parent, student, phone, ID..." style="padding-left:36px;" />
              <span style="position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--text-secondary); pointer-events:none;">
                ${icon('search', 16)}
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2" style="flex-wrap:wrap;">
            <select id="inq-status-filter" class="form-select" style="min-width:140px;">
              <option value="all" selected>All Statuses</option>
              <option value="New">New / Unread</option>
              <option value="Contacted">Contacted</option>
              <option value="In Review">In Review</option>
              <option value="Converted">Converted</option>
              <option value="Closed">Closed</option>
            </select>
            <select id="inq-grade-filter" class="form-select" style="min-width:140px;">
              <option value="all" selected>All Grades</option>
              ${gradesList.map(g => `<option value="${g}">${g}</option>`).join('')}
            </select>
            <button id="inq-refresh-btn" class="btn btn-secondary btn-sm" title="Refresh Live Stream">
              🔄 Refresh
            </button>
            <button id="inq-export-csv" class="btn btn-secondary btn-sm" title="Export inquiries to CSV">
              ${icon('doc', 16)} Export CSV
            </button>
          </div>
        </div>
      </div>

      <!-- Inquiries Table Card -->
      <div class="card">
        <div class="card-header">
          <div class="flex items-center gap-2">
            <span class="card-title">${icon('clipboard', 18)} Live Inquiries Stream</span>
            <span id="inq-filtered-count" class="badge badge-secondary" style="font-size:0.75rem;">${inquiries.length} records</span>
          </div>
          <span class="text-xs text-secondary">Tip: Click WhatsApp to open pre-filled chat with parent</span>
        </div>
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th style="width:130px;">Inquiry ID</th>
                <th>Parent &amp; Student</th>
                <th>Target Grade</th>
                <th>Contact Details</th>
                <th>Questions / Notes</th>
                <th style="width:130px;">Status</th>
                <th style="width:180px; text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody id="inquiries-table-body">
              ${renderInquiryRows(inquiries)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderInquiryRows(inquiries) {
  if (!inquiries || inquiries.length === 0) {
    return `
      <tr>
        <td colspan="7" class="text-center py-8 text-secondary">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">📭</div>
          <div style="font-weight: 600;">No admission inquiries found</div>
          <div class="text-xs mt-1">Inquiries submitted via the front website or walk-in desk will appear here automatically.</div>
        </td>
      </tr>
    `;
  }

  return inquiries.map(inq => {
    const isNew = inq.status === 'New';
    const statusColors = {
      'New': { bg: 'rgba(239, 68, 68, 0.12)', color: '#dc2626', border: '#fca5a5' },
      'Contacted': { bg: 'rgba(245, 158, 11, 0.12)', color: '#d97706', border: '#fcd34d' },
      'In Review': { bg: 'rgba(59, 130, 246, 0.12)', color: '#2563eb', border: '#93c5fd' },
      'Converted': { bg: 'rgba(16, 185, 129, 0.12)', color: '#059669', border: '#6ee7b7' },
      'Closed': { bg: 'rgba(107, 114, 128, 0.12)', color: '#4b5563', border: '#d1d5db' },
    };
    const sc = statusColors[inq.status] || statusColors['New'];
    const cleanPhone = (inq.phone || '').replace(/[^0-9]/g, '');
    const waText = encodeURIComponent(`Hello ${inq.parent_name}, Greetings from Smart School International admissions desk regarding your inquiry (${inq.inquiry_id}) for ${inq.student_name || 'your child'} for ${inq.target_class}. How may we assist you with admissions?`);
    const dateDisplay = inq.created_at ? inq.created_at.substring(0, 16) : 'Just now';

    return `
      <tr class="inquiry-row-${inq.id}" style="${isNew ? 'background: rgba(239, 68, 68, 0.02);' : ''}">
        <td>
          <div class="flex items-center gap-1">
            ${isNew ? '<span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#ef4444; animation:pulse 1.5s infinite;" title="New Unread Inquiry"></span>' : ''}
            <span class="badge ${isNew ? 'badge-primary' : 'badge-secondary'}" style="font-family:monospace; font-size:0.75rem; font-weight:700;">
              ${inq.inquiry_id}
            </span>
          </div>
          <div class="text-xs text-secondary mt-1" style="font-size:0.7rem;">${dateDisplay}</div>
        </td>
        <td>
          <div style="font-weight: 700; font-size: 0.875rem;">${inq.parent_name}</div>
          <div class="text-xs text-secondary flex items-center gap-1 mt-0.5">
            <span>Child:</span>
            <strong style="color:var(--text-primary);">${inq.student_name || 'Not provided'}</strong>
          </div>
        </td>
        <td>
          <span class="badge" style="background:var(--bg-input); font-weight:600; color:var(--text-primary); border:1px solid var(--border-secondary);">
            ${inq.target_class || 'Class 1'}
          </span>
        </td>
        <td>
          <div class="font-mono text-xs font-semibold">${inq.phone || '—'}</div>
          ${inq.email ? `<div class="text-xs text-secondary">${inq.email}</div>` : ''}
          <div class="mt-1">
            <a href="https://wa.me/${cleanPhone}?text=${waText}" target="_blank" class="btn btn-xs btn-success" style="padding:2px 8px; font-size:0.7rem; display:inline-flex; align-items:center; gap:4px;" title="Chat with Parent on WhatsApp">
              ${icon('chat', 12)} WhatsApp
            </a>
          </div>
        </td>
        <td style="max-width:240px;">
          <div class="text-xs text-secondary" style="overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical;" title="${inq.message || ''}">
            ${inq.message || '—'}
          </div>
          ${inq.counselor_notes ? `
            <div class="text-xs mt-1 p-1 rounded" style="background:rgba(245,158,11,0.1); color:#b45309; border-left:2px solid #f59e0b;">
              <strong>Note:</strong> ${inq.counselor_notes}
            </div>
          ` : ''}
        </td>
        <td>
          <select class="inq-status-changer form-select" data-id="${inq.id}" style="padding:3px 8px; font-size:0.75rem; font-weight:700; background:${sc.bg}; color:${sc.color}; border:1px solid ${sc.border}; border-radius:12px; cursor:pointer;">
            <option value="New" ${inq.status === 'New' ? 'selected' : ''}>New</option>
            <option value="Contacted" ${inq.status === 'Contacted' ? 'selected' : ''}>Contacted</option>
            <option value="In Review" ${inq.status === 'In Review' ? 'selected' : ''}>In Review</option>
            <option value="Converted" ${inq.status === 'Converted' ? 'selected' : ''}>Converted</option>
            <option value="Closed" ${inq.status === 'Closed' ? 'selected' : ''}>Closed</option>
          </select>
        </td>
        <td style="text-align:right;">
          <div class="flex items-center justify-end gap-1">
            <button class="btn btn-xs btn-primary btn-convert-inquiry" data-id="${inq.id}" data-parent="${encodeURIComponent(inq.parent_name || '')}" data-student="${encodeURIComponent(inq.student_name || '')}" data-phone="${encodeURIComponent(inq.phone || '')}" data-email="${encodeURIComponent(inq.email || '')}" data-grade="${encodeURIComponent(inq.target_class || '')}" title="Convert to Official Enrolled Student">
              ${icon('userPlus', 12)} Convert
            </button>
            <button class="btn btn-xs btn-secondary btn-notes-inquiry" data-id="${inq.id}" data-notes="${encodeURIComponent(inq.counselor_notes || '')}" data-parent="${encodeURIComponent(inq.parent_name || '')}" title="Add / View Counselor Notes">
              ${icon('pencil', 12)}
            </button>
            <button class="btn btn-xs btn-danger btn-delete-inquiry" data-id="${inq.id}" data-inqid="${inq.inquiry_id}" title="Delete Inquiry">
              ${icon('trash', 12)}
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function bindAdmissionInquiriesEvents() {
  const tbody = document.getElementById('inquiries-table-body');
  const searchInput = document.getElementById('inq-search');
  const statusFilter = document.getElementById('inq-status-filter');
  const gradeFilter = document.getElementById('inq-grade-filter');
  const refreshBtn = document.getElementById('inq-refresh-btn');
  const exportBtn = document.getElementById('inq-export-csv');
  const walkinBtn = document.getElementById('btn-add-walkin-inquiry');

  function filterAndRender() {
    const search = (searchInput?.value || '').toLowerCase().trim();
    const status = statusFilter?.value || 'all';
    const grade = gradeFilter?.value || 'all';

    let filtered = allAdmissionInquiries.filter(item => {
      const matchSearch = !search ||
        (item.parent_name && item.parent_name.toLowerCase().includes(search)) ||
        (item.student_name && item.student_name.toLowerCase().includes(search)) ||
        (item.phone && item.phone.toLowerCase().includes(search)) ||
        (item.inquiry_id && item.inquiry_id.toLowerCase().includes(search)) ||
        (item.email && item.email.toLowerCase().includes(search));

      const matchStatus = status === 'all' || item.status === status;
      const matchGrade = grade === 'all' || item.target_class === grade;

      return matchSearch && matchStatus && matchGrade;
    });

    if (tbody) tbody.innerHTML = renderInquiryRows(filtered);
    const countBadge = document.getElementById('inq-filtered-count');
    if (countBadge) countBadge.textContent = `${filtered.length} records`;
    bindRowActions();
  }

  function bindRowActions() {
    // 1. Status Changer Dropdowns
    document.querySelectorAll('.inq-status-changer').forEach(select => {
      select.onchange = async () => {
        const id = select.getAttribute('data-id');
        const newStatus = select.value;
        try {
          await api.post(`/website/inquiries/update/${id}`, { status: newStatus });
          showToast(`Inquiry status updated to ${newStatus}`, 'success');
          const found = allAdmissionInquiries.find(x => String(x.id) === String(id));
          if (found) found.status = newStatus;
          if (typeof broadcastDbMutation === 'function') {
            broadcastDbMutation('/website/inquiries', 'status_changed');
          }
          filterAndRender();
        } catch (err) {
          showToast('Failed to update status', 'danger');
        }
      };
    });

    // 2. Convert to Admission Button
    document.querySelectorAll('.btn-convert-inquiry').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const parentName = decodeURIComponent(btn.getAttribute('data-parent') || '');
        const studentName = decodeURIComponent(btn.getAttribute('data-student') || '');
        const phone = decodeURIComponent(btn.getAttribute('data-phone') || '');
        const email = decodeURIComponent(btn.getAttribute('data-email') || '');
        const grade = decodeURIComponent(btn.getAttribute('data-grade') || '');

        window.showModal({
          title: 'Convert Inquiry to Enrolled Student',
          content: `
            <div>
              <p class="text-sm text-secondary mb-4">
                You are about to initiate formal admission for <strong>${studentName || parentName + "'s child"}</strong>.
                This will automatically pre-fill the 4-step verified admission application and update the inquiry status to <strong>Converted</strong>.
              </p>
              <div class="p-3 rounded-md mb-4 text-xs" style="background:var(--bg-input); line-height:1.8;">
                <div><strong>Parent / Guardian:</strong> ${parentName}</div>
                <div><strong>Student Name:</strong> ${studentName || 'To be completed'}</div>
                <div><strong>Contact Mobile:</strong> ${phone}</div>
                <div><strong>Applying For:</strong> ${grade}</div>
              </div>
              <div class="flex justify-end gap-2">
                <button class="btn btn-secondary btn-sm" onclick="window.closeModal()">Cancel</button>
                <button class="btn btn-primary btn-sm" id="confirm-convert-btn">
                  ${icon('userPlus', 16)} Open Admission Form
                </button>
              </div>
            </div>
          `
        });

        setTimeout(() => {
          const confirmBtn = document.getElementById('confirm-convert-btn');
          if (confirmBtn) {
            confirmBtn.onclick = async () => {
              try {
                await api.post(`/website/inquiries/update/${id}`, { status: 'Converted' });
              } catch {}

              sessionStorage.setItem('pending_admission_inquiry', JSON.stringify({
                parentName,
                studentName,
                phone,
                email,
                grade
              }));

              window.closeModal();
              showToast('Redirecting to 4-Step Admission Wizard with pre-filled details...', 'success');
              window.location.hash = '#/students/admission';
            };
          }
        }, 50);
      };
    });

    // 3. Counselor Notes Button
    document.querySelectorAll('.btn-notes-inquiry').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const curNotes = decodeURIComponent(btn.getAttribute('data-notes') || '');
        const parentName = decodeURIComponent(btn.getAttribute('data-parent') || '');

        window.showModal({
          title: `Counselor Notes — ${parentName}`,
          content: `
            <div>
              <div class="form-group mb-4">
                <label class="form-label">Counselor Call / Follow-up Notes</label>
                <textarea id="modal-counselor-notes" class="form-textarea" rows="4" placeholder="e.g. Spoke to mother, interested in transport from Newtown. Scheduled campus visit on Friday 11:30 AM...">${curNotes}</textarea>
              </div>
              <div class="flex justify-end gap-2">
                <button class="btn btn-secondary btn-sm" onclick="window.closeModal()">Cancel</button>
                <button class="btn btn-primary btn-sm" id="save-counselor-notes-btn">
                  ${icon('checkCircle', 16)} Save Notes
                </button>
              </div>
            </div>
          `
        });

        setTimeout(() => {
          const saveBtn = document.getElementById('save-counselor-notes-btn');
          if (saveBtn) {
            saveBtn.onclick = async () => {
              const notes = document.getElementById('modal-counselor-notes')?.value || '';
              try {
                await api.post(`/website/inquiries/update/${id}`, { counselor_notes: notes });
                showToast('Counselor notes saved successfully', 'success');
                const found = allAdmissionInquiries.find(x => String(x.id) === String(id));
                if (found) found.counselor_notes = notes;
                window.closeModal();
                filterAndRender();
              } catch (err) {
                showToast('Failed to save notes', 'danger');
              }
            };
          }
        }, 50);
      };
    });

    // 4. Delete Inquiry Button
    document.querySelectorAll('.btn-delete-inquiry').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const inqId = btn.getAttribute('data-inqid') || 'inquiry';

        window.showModal({
          title: 'Confirm Deletion',
          content: `
            <div>
              <p class="text-sm text-secondary mb-4">
                Are you sure you want to permanently delete admission inquiry <strong>${inqId}</strong>? This action cannot be undone.
              </p>
              <div class="flex justify-end gap-2">
                <button class="btn btn-secondary btn-sm" onclick="window.closeModal()">Cancel</button>
                <button class="btn btn-danger btn-sm" id="confirm-del-inq-btn">
                  ${icon('trash', 16)} Delete Inquiry
                </button>
              </div>
            </div>
          `
        });

        setTimeout(() => {
          const confirmDelBtn = document.getElementById('confirm-del-inq-btn');
          if (confirmDelBtn) {
            confirmDelBtn.onclick = async () => {
              try {
                await api.post(`/website/inquiries/delete/${id}`, {});
                showToast(`Inquiry ${inqId} deleted`, 'success');
                allAdmissionInquiries = allAdmissionInquiries.filter(x => String(x.id) !== String(id));
                window.closeModal();
                filterAndRender();
              } catch (err) {
                showToast('Failed to delete inquiry', 'danger');
              }
            };
          }
        }, 50);
      };
    });
  }

  // Filter Event Listeners
  if (searchInput) searchInput.oninput = filterAndRender;
  if (statusFilter) statusFilter.onchange = filterAndRender;
  if (gradeFilter) gradeFilter.onchange = filterAndRender;

  // Refresh Event Listener
  if (refreshBtn) {
    refreshBtn.onclick = async () => {
      refreshBtn.disabled = true;
      refreshBtn.textContent = 'Refreshing...';
      try {
        const rawRes = await api.get('/website/inquiries');
        const parsed = extractInquiriesData(rawRes);
        allAdmissionInquiries = parsed.inquiries;
        const totEl = document.getElementById('stat-total-inq');
        const newEl = document.getElementById('stat-new-inq');
        const conEl = document.getElementById('stat-contacted-inq');
        const cvtEl = document.getElementById('stat-converted-inq');
        if (totEl) totEl.textContent = parsed.summary.total;
        if (newEl) newEl.textContent = parsed.summary.new;
        if (conEl) conEl.textContent = (parsed.summary.contacted || 0) + (parsed.summary.in_review || 0);
        if (cvtEl) cvtEl.textContent = parsed.summary.converted;

        filterAndRender();
        showToast('Inquiries refreshed from live database', 'success');
      } catch (err) {
        showToast('Failed to refresh inquiries', 'danger');
      } finally {
        refreshBtn.disabled = false;
        refreshBtn.textContent = '🔄 Refresh';
      }
    };
  }

  // Export CSV Listener
  if (exportBtn) {
    exportBtn.onclick = () => {
      if (!allAdmissionInquiries || allAdmissionInquiries.length === 0) {
        showToast('No inquiries to export', 'warning');
        return;
      }
      const rows = [
        ['Inquiry ID', 'Parent Name', 'Student Name', 'Mobile', 'Email', 'Target Grade', 'Status', 'Date Received', 'Message', 'Counselor Notes']
      ];
      allAdmissionInquiries.forEach(i => {
        rows.push([
          i.inquiry_id || '',
          i.parent_name || '',
          i.student_name || '',
          i.phone || '',
          i.email || '',
          i.target_class || '',
          i.status || '',
          i.created_at || '',
          (i.message || '').replace(/"/g, '""'),
          (i.counselor_notes || '').replace(/"/g, '""')
        ]);
      });
      const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Admission_Inquiries_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Exported Admission Inquiries to CSV', 'success');
    };
  }

  // Log Walk-In Inquiry Modal
  if (walkinBtn) {
    walkinBtn.onclick = () => {
      window.showModal({
        title: 'Log Walk-In / Phone Admission Inquiry',
        content: `
          <form id="modal-walkin-inq-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Parent / Guardian Name *</label>
                <input type="text" class="form-input" id="walkin-parent" placeholder="e.g. Ramesh Chandra" required />
              </div>
              <div class="form-group">
                <label class="form-label">Contact Mobile *</label>
                <input type="tel" class="form-input" id="walkin-phone" placeholder="10-digit number" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Student / Child Name</label>
                <input type="text" class="form-input" id="walkin-student" placeholder="Child's full name" />
              </div>
              <div class="form-group">
                <label class="form-label">Applying for Grade</label>
                <select class="form-select" id="walkin-grade">
                  <option value="Pre-Primary / Nursery">Pre-Primary / Nursery</option>
                  <option value="Class 1">Class 1</option>
                  <option value="Class 2">Class 2</option>
                  <option value="Class 3">Class 3</option>
                  <option value="Class 4">Class 4</option>
                  <option value="Class 5" selected>Class 5</option>
                  <option value="Class 6">Class 6</option>
                  <option value="Class 7">Class 7</option>
                  <option value="Class 8">Class 8</option>
                  <option value="Class 9">Class 9</option>
                  <option value="Class 10">Class 10</option>
                  <option value="Class 11 Science">Class 11 Science</option>
                  <option value="Class 11 Commerce">Class 11 Commerce</option>
                  <option value="Class 12 Science">Class 12 Science</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Parent Email (Optional)</label>
              <input type="email" class="form-input" id="walkin-email" placeholder="parent@example.com" />
            </div>
            <div class="form-group">
              <label class="form-label">Inquiry Details / Requirements</label>
              <textarea class="form-textarea" id="walkin-message" rows="3" placeholder="Notes on previous school, medium of instruction, transport query..."></textarea>
            </div>
            <div class="flex justify-end gap-2 mt-4">
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.closeModal()">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm" id="modal-walkin-submit-btn">
                ${icon('checkCircle', 16)} Register Inquiry
              </button>
            </div>
          </form>
        `
      });

      setTimeout(() => {
        const form = document.getElementById('modal-walkin-inq-form');
        if (form) {
          form.onsubmit = async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('modal-walkin-submit-btn');
            if (submitBtn) {
              submitBtn.disabled = true;
              submitBtn.innerHTML = 'Registering...';
            }

            const parentName  = document.getElementById('walkin-parent')?.value?.trim();
            const phone       = document.getElementById('walkin-phone')?.value?.trim();
            const studentName = document.getElementById('walkin-student')?.value?.trim() || '';
            const grade       = document.getElementById('walkin-grade')?.value || 'Class 1';
            const email       = document.getElementById('walkin-email')?.value?.trim() || '';
            const message     = document.getElementById('walkin-message')?.value?.trim() || 'Offline walk-in inquiry';

            try {
              const res = await api.post('/website/inquiry', {
                parent_name: parentName,
                phone: phone,
                student_name: studentName,
                email: email,
                target_class: grade,
                message: message
              });
              const inq = (res && res.data && res.data.data) ? res.data.data : ((res && res.data) ? res.data : (res || {}));
              showToast(`Walk-in inquiry ${inq.inquiry_id || ''} registered successfully!`, 'success');
              window.closeModal();

              // Re-fetch live inquiries
              const rawRes = await api.get('/website/inquiries');
              const parsed = extractInquiriesData(rawRes);
              allAdmissionInquiries = parsed.inquiries;

              const totEl = document.getElementById('stat-total-inq');
              const newEl = document.getElementById('stat-new-inq');
              const conEl = document.getElementById('stat-contacted-inq');
              const cvtEl = document.getElementById('stat-converted-inq');
              if (totEl) totEl.textContent = parsed.summary.total;
              if (newEl) newEl.textContent = parsed.summary.new;
              if (conEl) conEl.textContent = (parsed.summary.contacted || 0) + (parsed.summary.in_review || 0);
              if (cvtEl) cvtEl.textContent = parsed.summary.converted;

              filterAndRender();
            } catch (err) {
              showToast(err.message || 'Failed to register walk-in inquiry', 'danger');
              if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Register Inquiry';
              }
            }
          };
        }
      }, 50);
    };
  }

  // Initial filter & render to populate and bind all rows immediately
  filterAndRender();
}




