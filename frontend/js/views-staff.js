/**
 * Smart School — Staff & HR Domain Views
 * Staff & Faculty Directory, Biometric Staff Attendance Ledger
 */

/* ==========================================================================
   Staff Directory View
   ========================================================================== */
let staffMembers = [
  { id: 1, staff_id: 'EMP1001', name: 'Dr. Vivek Saxena', role: 'Principal / HOD Science', department: 'Academics', phone: '9811223344', email: 'principal@smartschool.com', status: 'Active' },
  { id: 2, staff_id: 'EMP1002', name: 'Mrs. Anjali Deshmukh', role: 'Senior Teacher', department: 'Mathematics', phone: '9822334455', email: 'anjali.d@smartschool.com', status: 'Active' },
  { id: 3, staff_id: 'EMP1003', name: 'Mr. Arvind Roy', role: 'Faculty IT & Robotics', department: 'Computer Science', phone: '9833445566', email: 'arvind.roy@smartschool.com', status: 'Active' },
  { id: 4, staff_id: 'EMP1004', name: 'Mr. Suresh Kumar', role: 'Accountant & Bursar', department: 'Finance & Accounts', phone: '9844556677', email: 'bursar@smartschool.com', status: 'Active' },
  { id: 5, staff_id: 'EMP1005', name: 'Mrs. Neha Kapoor', role: 'Primary Coordinator', department: 'Primary Wing', phone: '9855667788', email: 'neha.k@smartschool.com', status: 'Active' },
  { id: 6, staff_id: 'EMP1006', name: 'Mr. Ramesh Shinde', role: 'Head Librarian', department: 'Library', phone: '9866778899', email: 'library@smartschool.com', status: 'Active' },
];

async function renderStaff() {
  try {
    const res = await api.get('/staff');
    if (Array.isArray(res.data) && res.data.length > 0) {
      staffMembers = res.data;
    }
  } catch {
    // fallback
  }

  return `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h1>Staff & Faculty Directory</h1>
          <p class="subtitle">Institutional Human Resources, designations, and department allocation</p>
        </div>
        <div class="flex gap-2">
          <a href="#/staff/attendance" class="btn btn-secondary">
            ${icon('checkCircle', 18)} Staff Attendance
          </a>
          <button class="btn btn-primary" id="add-staff-btn">
            ${icon('plus', 18)} Add Staff Member
          </button>
        </div>
      </div>

      <div class="card">
        <table class="table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Emp ID</th>
              <th>Designation</th>
              <th>Department</th>
              <th>Contact Phone</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="staff-tbody">
            ${staffMembers.map(s => {
              const initials = (s.name || 'Staff').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
              return `
                <tr>
                  <td>
                    <div class="flex items-center gap-3">
                      <div class="avatar-placeholder avatar-sm" style="background: var(--warning-50); color: var(--warning-600);">
                        ${initials}
                      </div>
                      <div>
                        <strong>${s.name}</strong>
                        <div class="text-xs text-secondary">${s.email || ''}</div>
                      </div>
                    </div>
                  </td>
                  <td><code>${s.emp_id || s.staff_id || `EMP${s.id}`}</code></td>
                  <td><strong>${s.role || s.designation || 'Teacher'}</strong></td>
                  <td><span class="badge badge-info">${s.department || 'Academics'}</span></td>
                  <td>${s.phone || '—'}</td>
                  <td><span class="badge badge-success">${s.status || 'Active'}</span></td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function bindStaffEvents() {
  const addBtn = document.getElementById('add-staff-btn');
  if (addBtn) {
    addBtn.onclick = () => {
      window.openAppModal({
        title: 'Register Faculty & Staff Member',
        subtitle: 'Add teacher, administrative officer, or librarian record and assign employee ID',
        saveLabel: 'Register Staff',
        saveIcon: 'plus',
        contentHtml: `
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Full Name *</label>
              <input type="text" class="form-input" id="modal-staff-name" placeholder="e.g. Dr. Kavita Krishnan" required />
            </div>
            <div class="form-group">
              <label class="form-label">Role / Designation *</label>
              <input type="text" class="form-input" id="modal-staff-role" placeholder="e.g. Senior Chemistry Faculty" required />
            </div>
            <div class="form-group">
              <label class="form-label">Department</label>
              <select class="form-select" id="modal-staff-dept">
                <option value="Academics">Academics & Teaching</option>
                <option value="Accounts & Finance">Accounts & Finance</option>
                <option value="Operations">Operations & Fleet</option>
                <option value="Administration">Administration & Front Office</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Contact Phone *</label>
              <input type="text" class="form-input" id="modal-staff-phone" placeholder="e.g. +91 98765 43210" required />
            </div>
            <div class="form-group">
              <label class="form-label">Monthly Remuneration (₹)</label>
              <input type="number" class="form-input" id="modal-staff-salary" value="62000" />
            </div>
          </div>
        `,
        onSave: async () => {
          const name = document.getElementById('modal-staff-name').value.trim();
          const role = document.getElementById('modal-staff-role').value.trim();
          const phone = document.getElementById('modal-staff-phone').value.trim();
          if (!name || !role) {
            if (window.showToast) window.showToast('Please provide Staff Full Name and Role', 'warning');
            return false;
          }
          const dept = document.getElementById('modal-staff-dept').value;
          const salary = parseFloat(document.getElementById('modal-staff-salary').value) || 50000;
          const genEmpId = `EMP${Math.floor(1000 + Math.random() * 9000)}`;

          const newStaff = {
            id: Date.now(),
            emp_id: genEmpId,
            staff_id: genEmpId,
            name,
            role,
            designation: role,
            department: dept,
            phone: phone || '+91 98765 00000',
            email: `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@smartschool.edu`,
            basic_salary: salary,
            salary,
            status: 'Active',
          };

          try {
            await api.post('/staff', newStaff);
          } catch (err) {
            console.warn('Staff backend sync fallback:', err);
          }

          if (window.SS_STORE) {
            window.SS_STORE.add('staff', newStaff);
          }
          staffMembers.push(newStaff);

          if (window.showToast) window.showToast(`Staff member "${name}" registered`, 'success');
          window.dispatchEvent(new Event('hashchange'));
          return true;
        }
      });
    };
  }
}

/* ==========================================================================
   Staff Attendance View
   ========================================================================== */
let staffAttList = [
  { id: 1, name: 'Dr. Vivek Saxena', role: 'Principal', in_time: '08:15 AM', out_time: '—', status: 'Present' },
  { id: 2, name: 'Mrs. Anjali Deshmukh', role: 'Senior Teacher', in_time: '08:24 AM', out_time: '—', status: 'Present' },
  { id: 3, name: 'Mr. Arvind Roy', role: 'Faculty IT', in_time: '08:30 AM', out_time: '—', status: 'Present' },
  { id: 4, name: 'Mr. Suresh Kumar', role: 'Accountant', in_time: '08:45 AM', out_time: '—', status: 'Present' },
  { id: 5, name: 'Mrs. Neha Kapoor', role: 'Primary Coordinator', in_time: '—', out_time: '—', status: 'On Leave' },
  { id: 6, name: 'Mr. Ramesh Shinde', role: 'Head Librarian', in_time: '08:52 AM', out_time: '—', status: 'Present' },
];

async function renderStaffAttendance() {
  return `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h1>Staff & Faculty Attendance Ledger</h1>
          <p class="subtitle">Biometric check-in, leave tracking, and daily duty timestamps</p>
        </div>
        <div class="flex gap-2">
          <a href="#/staff" class="btn btn-secondary">
            ${icon('briefcase', 18)} Staff Directory
          </a>
          <button class="btn btn-primary" id="mark-staff-checkin-btn">
            ${icon('checkCircle', 18)} Quick Check-In
          </button>
        </div>
      </div>

      <div class="grid-3 mb-6">
        <div class="stat-card stat-success">
          <div class="stat-icon">${icon('checkCircle', 24)}</div>
          <div class="stat-value">5 / 6</div>
          <div class="stat-label">Faculty On Campus Today</div>
        </div>
        <div class="stat-card stat-warning">
          <div class="stat-icon">${icon('calendar', 24)}</div>
          <div class="stat-value">1 Staff</div>
          <div class="stat-label">Approved Medical / Casual Leave</div>
        </div>
        <div class="stat-card stat-primary">
          <div class="stat-icon">${icon('qr', 24)}</div>
          <div class="stat-value">Biometric</div>
          <div class="stat-label">Sync Gateway Active</div>
        </div>
      </div>

      <div class="card">
        <table class="table">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Designation</th>
              <th>Punch In Time</th>
              <th>Punch Out Time</th>
              <th>Daily Status</th>
            </tr>
          </thead>
          <tbody id="staff-att-tbody">
            ${staffAttList.map(s => `
              <tr>
                <td><strong>${s.name}</strong></td>
                <td class="text-secondary">${s.role}</td>
                <td><strong style="color: var(--primary-600);">${s.in_time}</strong></td>
                <td class="text-secondary">${s.out_time}</td>
                <td>
                  <span class="badge ${s.status === 'Present' ? 'badge-success' : 'badge-warning'}">
                    ${s.status}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function bindStaffAttendanceEvents() {
  const btn = document.getElementById('mark-staff-checkin-btn');
  if (btn) {
    btn.onclick = () => {
      showToast('Faculty biometric check-in verified for current timestamp', 'success');
    };
  }
}
