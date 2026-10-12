/**
 * Smart School — Staff & HR Domain Views
 * Staff & Faculty Directory, Biometric Staff Attendance Ledger
 */

/* ==========================================================================
   Staff Directory View
   ========================================================================== */
const defaultDemoStaff = [
  { id: 1, staff_id: 'EMP1001', name: 'Dr. Vivek Saxena', role: 'Principal / HOD Science', department: 'Academics', phone: '9811223344', email: 'principal@smartschool.com', status: 'Active', campus: 'Kolkata Main Campus (Salt Lake Sector V)' },
  { id: 2, staff_id: 'EMP1002', name: 'Mrs. Anjali Deshmukh', role: 'Senior Teacher', department: 'Mathematics', phone: '9822334455', email: 'anjali.d@smartschool.com', status: 'Active', campus: 'Kolkata Main Campus (Salt Lake Sector V)' },
  { id: 3, staff_id: 'EMP1003', name: 'Mr. Arvind Roy', role: 'Faculty IT & Robotics', department: 'Computer Science', phone: '9833445566', email: 'arvind.roy@smartschool.com', status: 'Active', campus: 'Kolkata Main Campus (Salt Lake Sector V)' },
  { id: 4, staff_id: 'EMP1004', name: 'Mr. Suresh Kumar', role: 'Accountant & Bursar', department: 'Finance & Accounts', phone: '9844556677', email: 'bursar@smartschool.com', status: 'Active', campus: 'Kolkata Main Campus (Salt Lake Sector V)' },
  { id: 5, staff_id: 'EMP1005', name: 'Mrs. Neha Kapoor', role: 'Primary Coordinator', department: 'Primary Wing', phone: '9855667788', email: 'neha.k@smartschool.com', status: 'Active', campus: 'Kolkata Main Campus (Salt Lake Sector V)' },
  { id: 6, staff_id: 'EMP1006', name: 'Mr. Ramesh Shinde', role: 'Head Librarian', department: 'Library', phone: '9866778899', email: 'library@smartschool.com', status: 'Active', campus: 'Kolkata Main Campus (Salt Lake Sector V)' },
];

let staffMembers = [];

async function renderStaff() {
  const activeCampus = (typeof window.getActiveCampus === 'function') ? window.getActiveCampus() : 'Kolkata Main Campus (Salt Lake Sector V)';
  const isMain = (typeof window.isMainCampus === 'function') ? window.isMainCampus(activeCampus) : true;

  try {
    const res = await api.get('/staff', { campus: activeCampus });
    if (Array.isArray(res?.data)) {
      staffMembers = res.data;
    } else if (Array.isArray(res)) {
      staffMembers = res;
    } else {
      staffMembers = isMain ? defaultDemoStaff : [];
    }
  } catch {
    staffMembers = isMain ? defaultDemoStaff : [];
  }

  // Auto-sync any locally cached staff to DB
  if (window.SS_STORE && Array.isArray(staffMembers)) {
    try {
      const localStaff = window.SS_STORE.get('staff', activeCampus) || [];
      let syncedAny = false;
      for (const ls of localStaff) {
        if (ls && ls.name && !staffMembers.some(s => (s.name || '').trim().toLowerCase() === ls.name.trim().toLowerCase())) {
          try {
            await api.post('/staff', {
              name: ls.name,
              role: ls.role || ls.designation || 'Teacher',
              department: ls.department || 'Academics',
              phone: ls.phone || '+91 98765 00000',
              basic_salary: ls.basic_salary || ls.salary || 50000,
              campus: activeCampus
            });
            syncedAny = true;
          } catch (postErr) {
            console.warn('Auto-sync unsaved staff to DB:', postErr);
          }
        }
      }
      if (syncedAny) {
        const refreshed = await api.get('/staff', { campus: activeCampus });
        if (Array.isArray(refreshed?.data)) staffMembers = refreshed.data;
        else if (Array.isArray(refreshed)) staffMembers = refreshed;
      }
    } catch (syncErr) {
      console.warn('Staff auto-sync check error:', syncErr);
    }
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
            ${staffMembers.length === 0 ? `
              <tr><td colspan="6" class="text-center p-8 text-secondary">
                <div style="padding: 24px 12px;">
                  <span style="font-size: 2.2rem; display: block; margin-bottom: 8px;">🏛️</span>
                  <strong style="color: var(--text-primary); font-size: 1.05rem;">No staff or faculty members registered for ${activeCampus} (0 data)</strong>
                  <p class="text-xs text-secondary mt-1">Click <strong>"Add Staff Member"</strong> above to register faculty for this school.</p>
                </div>
              </td></tr>
            ` : staffMembers.map(s => {
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

          if (Array.isArray(staffMembers)) {
            const nameDup = staffMembers.find(s => (s.name || '').trim().toLowerCase() === name.toLowerCase());
            if (nameDup) {
              if (window.showToast) window.showToast(`Duplicate entry: Staff member "${name}" already exists!`, 'error');
              return false;
            }
            if (phone && phone !== '+91 98765 00000') {
              const phoneDup = staffMembers.find(s => (s.phone || '').trim() === phone);
              if (phoneDup) {
                if (window.showToast) window.showToast(`Duplicate entry: Phone number "${phone}" is already registered to another staff member!`, 'error');
                return false;
              }
            }
          }

          const dept = document.getElementById('modal-staff-dept').value;
          const salary = parseFloat(document.getElementById('modal-staff-salary').value) || 50000;
          const genEmpId = `EMP${Math.floor(1000 + Math.random() * 9000)}`;

          const activeCampus = (typeof window.getActiveCampus === 'function') ? window.getActiveCampus() : 'Kolkata Main Campus (Salt Lake Sector V)';

          const newStaff = {
            id: Date.now(),
            campus: activeCampus,
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
            const saveRes = await api.post('/staff', newStaff);
            if (saveRes?.data?.data?.id) {
              newStaff.id = saveRes.data.data.id;
            } else if (saveRes?.data?.id) {
              newStaff.id = saveRes.data.id;
            }
            const sRes = await api.get('/staff', { campus: activeCampus });
            if (Array.isArray(sRes?.data)) {
              staffMembers = sRes.data;
            } else if (Array.isArray(sRes)) {
              staffMembers = sRes;
            }
          } catch (err) {
            console.error('Staff backend save error:', err);
            if (err.status === 409 || (err.message && /duplicate/i.test(err.message))) {
              if (window.showToast) window.showToast(err.message || `Duplicate entry: Staff member "${name}" already exists.`, 'error');
              return false;
            }
            if (window.showToast) window.showToast(`Failed to register staff in database: ${err.message || 'Server error'}`, 'error');
            return false;
          }

          if (window.SS_STORE) {
            window.SS_STORE.add('staff', newStaff);
          }

          if (window.showToast) window.showToast(`Staff member "${name}" registered in database`, 'success');
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

let staffAttendanceData = [];

async function renderStaffAttendance() {
  const activeCampus = (typeof window.getActiveCampus === 'function') ? window.getActiveCampus() : 'Kolkata Main Campus (Salt Lake Sector V)';
  const todayStr = new Date().toISOString().split('T')[0];

  try {
    const [sRes, attRes] = await Promise.all([
      api.get('/staff', { campus: activeCampus }).catch(() => ({ data: [] })),
      api.get('/staff/attendance', { date: todayStr }).catch(() => ({ data: [] })),
    ]);

    const sList = Array.isArray(sRes?.data) ? sRes.data : (Array.isArray(sRes) ? sRes : staffMembers);
    const attList = Array.isArray(attRes?.data) ? attRes.data : (Array.isArray(attRes) ? attRes : []);

    staffAttendanceData = sList.map(s => {
      const existing = attList.find(a => String(a.staff_id) === String(s.id));
      return {
        id: s.id,
        name: s.name,
        role: s.role || s.designation || 'Teacher',
        emp_id: s.emp_id || `EMP${s.id}`,
        status: existing?.status || 'Present',
        in_time: existing?.time_in || '08:30:00',
        out_time: existing?.time_out || '—',
      };
    });
  } catch (err) {
    console.warn('Error loading staff attendance:', err);
    staffAttendanceData = staffMembers.map(s => ({
      id: s.id,
      name: s.name,
      role: s.role || s.designation || 'Teacher',
      emp_id: s.emp_id || `EMP${s.id}`,
      status: 'Present',
      in_time: '08:30:00',
      out_time: '—',
    }));
  }

  const activeCount = staffAttendanceData.filter(s => s.status === 'Present').length;
  const leaveCount = staffAttendanceData.filter(s => s.status === 'On Leave' || s.status === 'Leave').length;

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
            ${icon('checkCircle', 18)} Quick Check-In All
          </button>
        </div>
      </div>

      <div class="grid-3 mb-6">
        <div class="stat-card stat-success">
          <div class="stat-icon">${icon('checkCircle', 24)}</div>
          <div class="stat-value" id="staff-active-count">${activeCount} / ${staffAttendanceData.length}</div>
          <div class="stat-label">Faculty On Campus Today</div>
        </div>
        <div class="stat-card stat-warning">
          <div class="stat-icon">${icon('calendar', 24)}</div>
          <div class="stat-value" id="staff-leave-count">${leaveCount} Staff</div>
          <div class="stat-label">Approved Medical / Casual Leave</div>
        </div>
        <div class="stat-card stat-primary">
          <div class="stat-icon">${icon('qr', 24)}</div>
          <div class="stat-value">Biometric</div>
          <div class="stat-label">Database Sync Active</div>
        </div>
      </div>

      <div class="card">
        <table class="table">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Designation</th>
              <th>Punch In Time</th>
              <th>Daily Status</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody id="staff-att-tbody">
            ${staffAttendanceData.length === 0 ? `
              <tr><td colspan="5" class="text-center p-8 text-secondary">
                <div style="padding: 24px 12px;">
                  <span style="font-size: 2rem; display: block; margin-bottom: 8px;">🏛️</span>
                  <strong style="color: var(--text-primary);">No staff members enrolled in ${activeCampus} to record attendance.</strong>
                </div>
              </td></tr>
            ` : staffAttendanceData.map(s => `
              <tr id="staff-att-row-${s.id}">
                <td>
                  <strong>${s.name}</strong>
                  <div class="text-xs text-secondary"><code>${s.emp_id}</code></div>
                </td>
                <td class="text-secondary">${s.role}</td>
                <td><strong style="color: var(--primary-600);">${s.in_time || '08:30:00'}</strong></td>
                <td>
                  <span class="badge ${s.status === 'Present' ? 'badge-success' : s.status === 'Late' ? 'badge-warning' : s.status === 'Absent' ? 'badge-danger' : 'badge-info'}" id="staff-status-badge-${s.id}">
                    ${s.status}
                  </span>
                </td>
                <td style="text-align: right;">
                  <div class="flex justify-end gap-1">
                    <button type="button" class="btn ${s.status === 'Present' ? 'btn-success' : 'btn-secondary'} btn-sm toggle-staff-att-btn" data-id="${s.id}" data-status="Present">Present</button>
                    <button type="button" class="btn ${s.status === 'Late' ? 'btn-primary' : 'btn-secondary'} btn-sm toggle-staff-att-btn" data-id="${s.id}" data-status="Late">Late</button>
                    <button type="button" class="btn ${s.status === 'Absent' ? 'btn-danger' : 'btn-secondary'} btn-sm toggle-staff-att-btn" data-id="${s.id}" data-status="Absent">Absent</button>
                    <button type="button" class="btn ${s.status === 'Leave' || s.status === 'On Leave' ? 'btn-warning' : 'btn-secondary'} btn-sm toggle-staff-att-btn" data-id="${s.id}" data-status="Leave">Leave</button>
                  </div>
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
  const todayStr = new Date().toISOString().split('T')[0];

  async function persistStaffAtt(staffId, newStatus) {
    const st = staffAttendanceData.find(s => s.id === staffId);
    if (!st) return;
    st.status = newStatus;

    try {
      await api.post('/staff/attendance/bulk', {
        date: todayStr,
        records: [{
          staff_id: staffId,
          status: newStatus === 'On Leave' ? 'Leave' : newStatus,
          time_in: '08:30:00'
        }]
      });
      if (window.showToast) {
        window.showToast(`${st.name} marked ${newStatus} in database`, newStatus === 'Absent' ? 'warning' : 'success');
      }
    } catch (err) {
      console.error('Failed to save staff attendance to DB:', err);
      if (window.showToast) {
        window.showToast(`Failed to sync staff attendance: ${err.message || 'Server error'}`, 'error');
      }
    }

    const badge = document.getElementById(`staff-status-badge-${staffId}`);
    if (badge) {
      badge.textContent = newStatus;
      badge.className = `badge ${newStatus === 'Present' ? 'badge-success' : newStatus === 'Late' ? 'badge-warning' : newStatus === 'Absent' ? 'badge-danger' : 'badge-info'}`;
    }

    const row = document.getElementById(`staff-att-row-${staffId}`);
    if (row) {
      row.querySelectorAll('.toggle-staff-att-btn').forEach(btn => {
        const bStatus = btn.getAttribute('data-status');
        btn.className = `btn ${bStatus === newStatus ? (bStatus === 'Present' ? 'btn-success' : bStatus === 'Late' ? 'btn-primary' : bStatus === 'Absent' ? 'btn-danger' : 'btn-warning') : 'btn-secondary'} btn-sm toggle-staff-att-btn`;
      });
    }

    const activeEl = document.getElementById('staff-active-count');
    const leaveEl = document.getElementById('staff-leave-count');
    if (activeEl) activeEl.textContent = `${staffAttendanceData.filter(s => s.status === 'Present').length} / ${staffAttendanceData.length}`;
    if (leaveEl) leaveEl.textContent = `${staffAttendanceData.filter(s => s.status === 'Leave' || s.status === 'On Leave').length} Staff`;
  }

  document.querySelectorAll('.toggle-staff-att-btn').forEach(btn => {
    btn.onclick = () => {
      const id = parseInt(btn.getAttribute('data-id'));
      const status = btn.getAttribute('data-status');
      persistStaffAtt(id, status);
    };
  });

  const checkinAllBtn = document.getElementById('mark-staff-checkin-btn');
  if (checkinAllBtn) {
    checkinAllBtn.onclick = async () => {
      if (staffAttendanceData.length === 0) return;
      const records = staffAttendanceData.map(s => ({
        staff_id: s.id,
        status: 'Present',
        time_in: '08:30:00'
      }));
      try {
        await api.post('/staff/attendance/bulk', {
          date: todayStr,
          records
        });
        staffAttendanceData.forEach(s => { s.status = 'Present'; });
        const tbody = document.getElementById('staff-att-tbody');
        if (tbody) {
          const container = document.getElementById('app');
          if (container) {
            renderStaffAttendance().then(html => {
              container.innerHTML = html;
              bindStaffAttendanceEvents();
            });
          }
        }
        if (window.showToast) {
          window.showToast('All faculty marked Present for today & stored in MySQL database', 'success');
        }
      } catch (err) {
        if (window.showToast) {
          window.showToast(`Error recording check-in: ${err.message || 'Server error'}`, 'error');
        }
      }
    };
  }
}
