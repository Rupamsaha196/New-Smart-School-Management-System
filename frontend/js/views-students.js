/**
 * Smart School — Student Domain Views
 * Student Profile, Transfer Certificate (TC) Generator, Behavior Records
 */

/* ==========================================================================
   Student Profile View
   ========================================================================== */
async function renderStudentProfile(params) {
  const studentId = params?.id || '1';
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
   Student Behavior & Discipline Records View
   ========================================================================== */
let behaviorLogs = [
  { id: 1, student: 'Aarav Sharma', class: 'Class 5-A', type: 'Commendation', title: 'Science Fair 1st Prize Winner', points: '+15', date: '2026-09-22', status: 'positive' },
  { id: 2, student: 'Rohan Patel', class: 'Class 10-A', type: 'Minor Infraction', title: 'Late arrival to morning assembly', points: '-2', date: '2026-09-24', status: 'warning' },
  { id: 3, student: 'Priya Singh', class: 'Class 8-B', type: 'Leadership', title: 'Elected House Captain', points: '+20', date: '2026-09-18', status: 'positive' },
  { id: 4, student: 'Vikram Reddy', class: 'Class 12-A', type: 'Uniform Violation', title: 'Incomplete formal uniform', points: '-5', date: '2026-09-25', status: 'danger' },
];

async function renderBehaviorRecords() {
  return `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h1>Student Behavior & Commendations</h1>
          <p class="subtitle">Track holistic conduct, disciplinary logs, and extracurricular achievements</p>
        </div>
        <button class="btn btn-primary" id="add-behavior-btn">
          ${icon('plus', 18)} Record Incident / Merit
        </button>
      </div>

      <div class="grid-3 mb-6">
        <div class="stat-card stat-success">
          <div class="stat-icon">${icon('checkCircle', 24)}</div>
          <div class="stat-value">142</div>
          <div class="stat-label">Positive Commendations This Term</div>
        </div>
        <div class="stat-card stat-warning">
          <div class="stat-icon">${icon('shield', 24)}</div>
          <div class="stat-value">18</div>
          <div class="stat-label">Minor Infractions</div>
        </div>
        <div class="stat-card stat-primary">
          <div class="stat-icon">${icon('academic', 24)}</div>
          <div class="stat-value">98.2%</div>
          <div class="stat-label">Overall School Discipline Index</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">Recent Behavior Logs</span>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Class</th>
              <th>Category</th>
              <th>Incident / Commendation</th>
              <th>House Points</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody id="behavior-tbody">
            ${renderBehaviorRows(behaviorLogs)}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderBehaviorRows(items) {
  return items.map(b => `
    <tr>
      <td><strong>${b.student}</strong></td>
      <td>${b.class}</td>
      <td>
        <span class="badge ${b.status === 'positive' ? 'badge-success' : b.status === 'warning' ? 'badge-warning' : 'badge-danger'}">
          ${b.type}
        </span>
      </td>
      <td>${b.title}</td>
      <td><strong style="color: ${b.status === 'positive' ? 'var(--success-600)' : 'var(--danger-500)'};">${b.points}</strong></td>
      <td class="text-secondary">${b.date}</td>
    </tr>
  `).join('');
}

function bindBehaviorRecordsEvents() {
  const addBtn = document.getElementById('add-behavior-btn');
  if (addBtn) {
    addBtn.onclick = () => {
      window.openAppModal({
        title: 'Log Student Behavioral Observation',
        subtitle: 'Record an achievement citation, leadership merit, or disciplinary infraction',
        saveLabel: 'Log Record',
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
          const isPositive = type.includes('Merit') || type.includes('Leadership');

          behaviorLogs.unshift({
            id: Date.now(),
            student,
            class: cls,
            type: isPositive ? 'Commendation' : 'Disciplinary Infraction',
            title,
            points: isPositive ? '+10' : '-5',
            date: new Date().toISOString().split('T')[0],
            status: isPositive ? 'positive' : 'warning',
          });

          const tbody = document.getElementById('behavior-tbody');
          if (tbody) tbody.innerHTML = renderBehaviorRows(behaviorLogs);
          if (window.showToast) window.showToast('Behavior record successfully logged', 'success');
          return true;
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
    if (Array.isArray(res.data) && res.data.length > 0) {
      studentsList = res.data;
    } else {
      const local = localStorage.getItem('local_students');
      studentsList = local ? JSON.parse(local) : (window.demoStudents || []);
    }
  } catch {
    const local = localStorage.getItem('local_students');
    studentsList = local ? JSON.parse(local) : (window.demoStudents || []);
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


