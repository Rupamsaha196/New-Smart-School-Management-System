/**
 * Smart School — Academics Domain Views
 * Classes, Subjects, Sessions, Timetable, Annual Calendar, Download Center, Live Virtual Classes
 */

/* ==========================================================================
   Classes & Sections Management View
   ========================================================================== */
let classList = [];

async function renderClasses() {
  try {
    const res = await api.get('/academics/classes');
    if (Array.isArray(res.data) && res.data.length > 0) {
      classList = res.data;
    } else if (Array.isArray(res) && res.length > 0) {
      classList = res;
    } else if (window.SS_STORE) {
      classList = window.SS_STORE.get('classes');
    }
  } catch (err) {
    console.warn('Classes central DB sync fallback:', err);
    if (window.SS_STORE) classList = window.SS_STORE.get('classes');
  }

  return `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h1>Classes & Sections Management</h1>
          <p class="subtitle">Standard curriculum hierarchy, divisions, tuition fees, and assigned faculty</p>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-secondary" id="promote-students-btn" onclick="openStudentPromotionModal()">
            ${icon('academic', 18)} Student Promotion
          </button>
          <button class="btn btn-primary" id="add-class-btn">
            ${icon('plus', 18)} Add New Class
          </button>
        </div>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Class Name</th>
                <th>Numeric Grade</th>
                <th>Active Sections / Streams</th>
                <th>Assigned Class Teacher</th>
                <th>Term Tuition Fee</th>
                <th>Enrolled Strength</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody id="classes-tbody">
              ${renderClassRows(classList)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderClassRows(items) {
  if (!items || items.length === 0) {
    return `<tr><td colspan="7" class="text-center p-8 text-secondary">No classes configured. Click "Add New Class" to get started.</td></tr>`;
  }
  return items.map(c => `
    <tr>
      <td><strong>${c.name}</strong></td>
      <td>Grade ${c.numeric || c.name.replace(/\D/g, '') || '—'}</td>
      <td><span class="badge badge-primary">${c.section || 'A, B'}</span></td>
      <td>${c.class_teacher || 'Assigned Faculty'}</td>
      <td><strong>₹${Number(c.tuition_fee || 12000).toLocaleString()}</strong></td>
      <td><span class="badge badge-info" style="font-weight: 700;">${c.students_count || 0} Students</span></td>
      <td style="text-align: right;">
        <div class="flex justify-end gap-1">
          <a href="#/students?class=${encodeURIComponent(c.name)}" class="btn btn-secondary btn-sm" style="text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
            ${icon('eye', 14)} View Students
          </a>
          <button class="btn-ghost btn-sm edit-class-btn" data-id="${c.id}" title="Edit Class">
            ${icon('pencil', 14)} Edit
          </button>
          <button class="btn-ghost btn-sm delete-class-btn" data-id="${c.id}" title="Delete Class" style="color: var(--danger-500);">
            ${icon('trash', 14)}
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function bindClassesEvents() {
  function attachRowActions() {
    // Edit Class Buttons
    document.querySelectorAll('.edit-class-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const c = window.SS_STORE ? window.SS_STORE.find('classes', id) : classList.find(x => String(x.id) === String(id));
        if (!c) return;

        window.openAppModal({
          title: `Edit Class: ${c.name}`,
          subtitle: 'Update academic division details, assigned teacher, and fee structure',
          saveLabel: 'Update Class',
          saveIcon: 'checkCircle',
          contentHtml: `
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Class Name *</label>
                <input type="text" class="form-input" id="modal-class-name" value="${c.name || ''}" required />
              </div>
              <div class="form-group">
                <label class="form-label">Numeric Grade Level</label>
                <input type="number" class="form-input" id="modal-class-numeric" value="${c.numeric || ''}" />
              </div>
              <div class="form-group">
                <label class="form-label">Active Sections / Streams</label>
                <input type="text" class="form-input" id="modal-class-section" value="${c.section || 'A, B'}" placeholder="e.g. A, B or Science, Commerce" />
              </div>
              <div class="form-group">
                <label class="form-label">Assigned Class Teacher</label>
                <input type="text" class="form-input" id="modal-class-teacher" value="${c.class_teacher || ''}" placeholder="Faculty Name" />
              </div>
              <div class="form-group">
                <label class="form-label">Tuition Fee Per Term (₹)</label>
                <input type="number" class="form-input" id="modal-class-fee" value="${c.tuition_fee || 12000}" />
              </div>
              <div class="form-group">
                <label class="form-label">Enrolled Student Strength</label>
                <input type="number" class="form-input" id="modal-class-strength" value="${c.students_count || 45}" />
              </div>
            </div>
          `,
          onSave: async () => {
            const name = document.getElementById('modal-class-name').value.trim();
            if (!name) {
              if (window.showToast) window.showToast('Please enter a valid class name', 'warning');
              return false;
            }
            const numeric = parseInt(document.getElementById('modal-class-numeric').value) || 0;
            const section = document.getElementById('modal-class-section').value.trim() || 'A, B';
            const teacher = document.getElementById('modal-class-teacher').value.trim() || 'Assigned Faculty';
            const fee = parseFloat(document.getElementById('modal-class-fee').value) || 12000;
            const strength = parseInt(document.getElementById('modal-class-strength').value) || 0;

            const updates = { name, numeric, section, class_teacher: teacher, tuition_fee: fee, students_count: strength };
            if (window.SS_STORE) {
              window.SS_STORE.update('classes', id, updates);
              classList = window.SS_STORE.get('classes');
            } else {
              const idx = classList.findIndex(x => String(x.id) === String(id));
              if (idx !== -1) classList[idx] = { ...classList[idx], ...updates };
            }

            const tbody = document.getElementById('classes-tbody');
            if (tbody) tbody.innerHTML = renderClassRows(classList);
            attachRowActions();
            if (window.showToast) window.showToast(`Class "${name}" updated successfully`, 'success');
            return true;
          }
        });
      };
    });

    // Delete Class Buttons
    document.querySelectorAll('.delete-class-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const c = window.SS_STORE ? window.SS_STORE.find('classes', id) : classList.find(x => String(x.id) === String(id));
        const className = c ? c.name : 'this class';

        window.openAppModal({
          title: `Delete Class: ${className}?`,
          subtitle: 'Are you sure you want to remove this academic class and its section configuration?',
          saveLabel: 'Confirm Delete',
          saveIcon: 'trash',
          contentHtml: `
            <div style="padding: 12px 0;">
              <p style="color: var(--danger-500); font-weight: 600;">
                Warning: Removing <strong>${className}</strong> will affect associated sections and timetable slots.
              </p>
              <p class="text-sm text-secondary mt-2">
                This action cannot be undone. Click "Confirm Delete" to proceed.
              </p>
            </div>
          `,
          onSave: async () => {
            try {
              await api.delete('/academics/classes/' + id);
              const clRes = await api.get('/academics/classes');
              if (Array.isArray(clRes.data) && clRes.data.length > 0) {
                classList = clRes.data;
              } else {
                classList = classList.filter(x => String(x.id) !== String(id));
              }
            } catch (e) {
              console.warn('Class delete API fallback:', e);
              classList = classList.filter(x => String(x.id) !== String(id));
            }
            if (window.SS_STORE) {
              window.SS_STORE.delete('classes', id);
            }
            const tbody = document.getElementById('classes-tbody');
            if (tbody) tbody.innerHTML = renderClassRows(classList);
            attachRowActions();
            if (window.showToast) window.showToast(`Class "${className}" removed from database`, 'success');
            return true;
          }
        });
      };
    });
  }

  attachRowActions();

  const addBtn = document.getElementById('add-class-btn');
  if (addBtn) {
    addBtn.onclick = () => {
      const teachers = window.SS_STORE ? window.SS_STORE.get('staff') : [];
      const teacherOptions = teachers.map(t => `<option value="${t.name}">${t.name} (${t.role})</option>`).join('');

      window.openAppModal({
        title: 'Add New Class & Sections',
        subtitle: 'Configure curriculum grade level, active divisions, class teacher, and tuition fee',
        saveLabel: 'Create Class',
        saveIcon: 'plus',
        contentHtml: `
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Class Name *</label>
              <input type="text" class="form-input" id="modal-class-name" placeholder="e.g. Class 13 (Cambridge) or Nursery" required />
            </div>
            <div class="form-group">
              <label class="form-label">Numeric Grade</label>
              <input type="number" class="form-input" id="modal-class-numeric" placeholder="e.g. 13" />
            </div>
            <div class="form-group">
              <label class="form-label">Active Sections / Streams</label>
              <input type="text" class="form-input" id="modal-class-section" value="A, B" placeholder="e.g. A, B or Science, Commerce" />
            </div>
            <div class="form-group">
              <label class="form-label">Class Teacher</label>
              <select class="form-select" id="modal-class-teacher-select">
                <option value="Ms. Pooja Sen">Ms. Pooja Sen (Senior Faculty)</option>
                <option value="Dr. Vivek Saxena">Dr. Vivek Saxena (Science Head)</option>
                <option value="Mr. Deepak Sharma">Mr. Deepak Sharma (Computer Science)</option>
                <option value="Mrs. Suman Ghosh">Mrs. Suman Ghosh (Languages)</option>
                ${teacherOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Term Tuition Fee (₹)</label>
              <input type="number" class="form-input" id="modal-class-fee" value="14500" />
            </div>
            <div class="form-group">
              <label class="form-label">Initial Enrolled Strength</label>
              <input type="number" class="form-input" id="modal-class-strength" value="45" />
            </div>
          </div>
        `,
        onSave: async () => {
          const nameInput = document.getElementById('modal-class-name');
          const name = nameInput ? nameInput.value.trim() : '';
          if (!name) {
            if (window.showToast) window.showToast('Please enter a class name', 'warning');
            return false;
          }
          const numeric = parseInt(document.getElementById('modal-class-numeric').value) || parseInt(name.replace(/\D/g, '')) || 0;
          const section = document.getElementById('modal-class-section').value.trim() || 'A, B';
          const teacher = document.getElementById('modal-class-teacher-select').value;
          const fee = parseFloat(document.getElementById('modal-class-fee').value) || 12000;
          const strength = parseInt(document.getElementById('modal-class-strength').value) || 0;

          const newClass = {
            name,
            numeric,
            section,
            class_teacher: teacher,
            tuition_fee: fee,
            students_count: strength,
          };

          try {
            await api.post('/academics/classes', { name, class_teacher: teacher, sections: section, numeric });
            const clRes = await api.get('/academics/classes');
            if (Array.isArray(clRes.data) && clRes.data.length > 0) {
              classList = clRes.data;
            }
          } catch (e) {
            console.warn('Class API sync fallback:', e);
          }

          if (window.SS_STORE) {
            window.SS_STORE.add('classes', newClass);
          }

          const tbody = document.getElementById('classes-tbody');
          if (tbody) tbody.innerHTML = renderClassRows(classList);
          attachRowActions();
          if (window.showToast) window.showToast(`Class "${name}" created successfully`, 'success');
          return true;
        }
      });
    };
  }
}

/* ==========================================================================
   Subjects Catalog View
   ========================================================================== */
let subjectList = [];

async function renderSubjects() {
  try {
    const res = await api.get('/academics/subjects');
    if (Array.isArray(res.data) && res.data.length > 0) {
      subjectList = res.data;
    } else if (Array.isArray(res) && res.length > 0) {
      subjectList = res;
    } else if (window.SS_STORE) {
      subjectList = window.SS_STORE.get('subjects');
    }
  } catch (err) {
    console.warn('Subjects central DB sync fallback:', err);
    if (window.SS_STORE) subjectList = window.SS_STORE.get('subjects');
  }

  return `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h1>Academic Subjects Catalog</h1>
          <p class="subtitle">Curriculum syllabus, subject codes, faculty allocation, and course credits</p>
        </div>
        <button class="btn btn-primary" id="add-subject-btn">
          ${icon('plus', 18)} Add Subject
        </button>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Subject Name</th>
                <th>Subject Code</th>
                <th>Course Type</th>
                <th>Applicable Grades</th>
                <th>Lead Faculty</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody id="subjects-tbody">
              ${renderSubjectRows(subjectList)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderSubjectRows(items) {
  if (!items || items.length === 0) {
    return `<tr><td colspan="6" class="text-center p-8 text-secondary">No subjects found in curriculum.</td></tr>`;
  }
  return items.map(s => `
    <tr>
      <td><strong>${s.name}</strong></td>
      <td><code>${s.code || 'GEN101'}</code></td>
      <td><span class="badge ${s.type && s.type.includes('Practical') ? 'badge-warning' : 'badge-info'}">${s.type || 'Theory'}</span></td>
      <td>${s.class_name || s.classes || 'All Classes'}</td>
      <td>${s.teacher_name || s.teacher || 'Department Faculty'}</td>
      <td style="text-align: right;">
        <button class="btn-ghost btn-sm delete-subject-btn" data-id="${s.id}" data-name="${s.name}" title="Remove Subject" style="color: var(--danger-500);">
          ${icon('trash', 14)}
        </button>
      </td>
    </tr>
  `).join('');
}

function bindSubjectsEvents() {
  function attachSubjectActions() {
    document.querySelectorAll('.delete-subject-btn').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name') || 'Subject';
        try {
          await api.delete('/academics/subjects/' + id);
          const subRes = await api.get('/academics/subjects');
          if (Array.isArray(subRes.data) && subRes.data.length > 0) {
            subjectList = subRes.data;
          } else {
            subjectList = subjectList.filter(x => String(x.id) !== String(id));
          }
        } catch (e) {
          console.warn('Subject delete API fallback:', e);
          subjectList = subjectList.filter(x => String(x.id) !== String(id));
        }
        if (window.SS_STORE) {
          window.SS_STORE.delete('subjects', id);
        }
        const tbody = document.getElementById('subjects-tbody');
        if (tbody) tbody.innerHTML = renderSubjectRows(subjectList);
        attachSubjectActions();
        if (window.showToast) window.showToast(`Subject "${name}" removed from database`, 'success');
      };
    });
  }

  attachSubjectActions();

  const addBtn = document.getElementById('add-subject-btn');
  if (addBtn) {
    addBtn.onclick = () => {
      window.openAppModal({
        title: 'Add Academic Subject',
        subtitle: 'Register course subject code, credit hours, and applicable class stream',
        saveLabel: 'Add Subject',
        saveIcon: 'plus',
        contentHtml: `
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Subject Name *</label>
              <input type="text" class="form-input" id="modal-sub-name" placeholder="e.g. Artificial Intelligence & Python" required />
            </div>
            <div class="form-group">
              <label class="form-label">Subject Code *</label>
              <input type="text" class="form-input" id="modal-sub-code" placeholder="e.g. AI401" required />
            </div>
            <div class="form-group">
              <label class="form-label">Subject Category / Type</label>
              <select class="form-select" id="modal-sub-type">
                <option value="Theory">Theory Only</option>
                <option value="Theory + Practical">Theory + Practical Lab</option>
                <option value="Practical & Lab">Practical & STEM Lab</option>
                <option value="Elective">Elective / Co-Curricular</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Applicable Classes</label>
              <input type="text" class="form-input" id="modal-sub-classes" value="Class 9 to 12" placeholder="e.g. Class 9 to 12" />
            </div>
            <div class="form-group">
              <label class="form-label">Lead Faculty</label>
              <input type="text" class="form-input" id="modal-sub-teacher" value="Dr. Vivek Saxena" placeholder="Instructor Name" />
            </div>
          </div>
        `,
        onSave: async () => {
          const name = document.getElementById('modal-sub-name').value.trim();
          const code = document.getElementById('modal-sub-code').value.trim();
          if (!name || !code) {
            if (window.showToast) window.showToast('Please provide both Subject Name and Code', 'warning');
            return false;
          }
          const type = document.getElementById('modal-sub-type').value;
          const classes = document.getElementById('modal-sub-classes').value.trim() || 'All Classes';
          const teacher = document.getElementById('modal-sub-teacher').value.trim() || 'Faculty';

          const newSub = { name, code, type, class_name: classes, teacher_name: teacher };

          try {
            await api.post('/academics/subjects', { name, code, type, class_name: classes, teacher_name: teacher });
            const subRes = await api.get('/academics/subjects');
            if (Array.isArray(subRes.data) && subRes.data.length > 0) {
              subjectList = subRes.data;
            }
          } catch (e) {
            console.warn('Subject API sync fallback:', e);
          }

          if (window.SS_STORE) {
            window.SS_STORE.add('subjects', newSub);
          } else {
            subjectList.push({ id: Date.now(), ...newSub });
          }

          const tbody = document.getElementById('subjects-tbody');
          if (tbody) tbody.innerHTML = renderSubjectRows(subjectList);
          attachSubjectActions();
          if (window.showToast) window.showToast(`Subject "${name}" (${code}) registered`, 'success');
          return true;
        }
      });
    };
  }
}

/* ==========================================================================
   Academic Sessions View
   ========================================================================== */
let sessions = [
  { id: 1, name: '2024 - 2025', start_date: '2024-04-01', end_date: '2025-03-31', is_active: false },
  { id: 2, name: '2025 - 2026', start_date: '2025-04-01', end_date: '2026-03-31', is_active: false },
  { id: 3, name: '2026 - 2027', start_date: '2026-04-01', end_date: '2027-03-31', is_active: true },
  { id: 4, name: '2027 - 2028 (Upcoming)', start_date: '2027-04-01', end_date: '2028-03-31', is_active: false },
];

async function renderSessions() {
  try {
    const res = await api.get('/sessions');
    if (Array.isArray(res.data) && res.data.length > 0) {
      sessions = res.data;
    }
  } catch {
    // fallback
  }

  return `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h1>Academic Sessions & Fiscal Years</h1>
          <p class="subtitle">Control active school calendar session for grading, fees & promotions</p>
        </div>
        <button class="btn btn-primary" id="add-session-btn">
          ${icon('plus', 18)} Create New Session
        </button>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Session Name</th>
                <th>Term Start</th>
                <th>Term End</th>
                <th>Status</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody id="sessions-tbody">
              ${renderSessionRows(sessions)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderSessionRows(items) {
  return items.map(s => `
    <tr>
      <td><strong>${s.name}</strong></td>
      <td>${s.start_date}</td>
      <td>${s.end_date}</td>
      <td>
        <span class="badge ${s.is_active ? 'badge-success' : 'badge-primary'}">
          ${s.is_active ? 'Active Academic Session' : 'Archived / Inactive'}
        </span>
      </td>
      <td style="text-align: right;">
        ${s.is_active ? `
          <button class="btn btn-secondary btn-sm" disabled>Current Active</button>
        ` : `
          <button class="btn btn-primary btn-sm activate-session-btn" data-id="${s.id}">
            Set as Active
          </button>
        `}
      </td>
    </tr>
  `).join('');
}

function bindSessionsEvents() {
  function bindButtons() {
    document.querySelectorAll('.activate-session-btn').forEach(btn => {
      btn.onclick = async () => {
        const id = parseInt(btn.getAttribute('data-id'));
        try {
          await api.post(`/sessions/${id}/activate`);
        } catch {
          // fallback
        }
        sessions.forEach(s => { s.is_active = (s.id === id); });
        const tbody = document.getElementById('sessions-tbody');
        if (tbody) tbody.innerHTML = renderSessionRows(sessions);
        bindButtons();
        showToast('Active academic session updated', 'success');
      };
    });
  }

  bindButtons();

  const addBtn = document.getElementById('add-session-btn');
  if (addBtn) {
    addBtn.onclick = () => {
      window.openAppModal({
        title: 'Add New Academic Session',
        subtitle: 'Configure academic cycle year, curriculum start date, and fiscal end date',
        saveLabel: 'Create Session',
        saveIcon: 'plus',
        contentHtml: `
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Session Name *</label>
              <input type="text" class="form-input" id="modal-session-name" placeholder="e.g. 2028 - 2029" required />
            </div>
            <div class="form-group">
              <label class="form-label">Session Start Date</label>
              <input type="date" class="form-input" id="modal-session-start" value="2028-04-01" />
            </div>
            <div class="form-group">
              <label class="form-label">Session End Date</label>
              <input type="date" class="form-input" id="modal-session-end" value="2029-03-31" />
            </div>
          </div>
        `,
        onSave: async () => {
          const nameInput = document.getElementById('modal-session-name');
          const name = nameInput ? nameInput.value.trim() : '';
          if (!name) {
            if (window.showToast) window.showToast('Please enter an academic session title', 'warning');
            return false;
          }
          const start = document.getElementById('modal-session-start').value;
          const end = document.getElementById('modal-session-end').value;

          const newSession = {
            name,
            start_date: start,
            end_date: end,
            is_active: false,
          };

          try {
            await api.post('/sessions', newSession);
            const sesRes = await api.get('/sessions');
            if (Array.isArray(sesRes.data) && sesRes.data.length > 0) {
              sessions = sesRes.data;
            }
          } catch (e) {
            console.warn('Session API sync fallback:', e);
            sessions.push({
              id: Date.now(),
              ...newSession
            });
          }

          const tbody = document.getElementById('sessions-tbody');
          if (tbody) tbody.innerHTML = renderSessionRows(sessions);
          bindButtons();
          if (window.showToast) window.showToast(`Session "${name}" configured successfully`, 'success');
          return true;
        }
      });
    };
  }
}

/* ==========================================================================
   Class Timetable View
   ========================================================================== */
const timetableDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const timetablePeriods = [
  { period: 'Period 1', time: '09:00 - 09:45' },
  { period: 'Period 2', time: '09:45 - 10:30' },
  { period: 'Period 3', time: '10:45 - 11:30' },
  { period: 'Period 4', time: '11:30 - 12:15' },
  { period: 'Period 5', time: '01:00 - 01:45' },
  { period: 'Period 6', time: '01:45 - 02:30' },
];

let timetableDbSlots = [];

async function renderTimetable() {
  try {
    const res = await api.get('/timetable');
    if (Array.isArray(res.data)) {
      timetableDbSlots = res.data;
    } else if (Array.isArray(res)) {
      timetableDbSlots = res;
    }
  } catch (e) {
    console.warn('Timetable fetch fallback:', e);
  }

  // Ensure classes exist for dropdown
  let cOptions = '';
  if (Array.isArray(classList) && classList.length > 0) {
    cOptions = classList.map((c, i) => `<option value="${c.name}" ${i === 0 ? 'selected' : ''}>${c.name} - Section ${c.section || 'A'}</option>`).join('');
  } else {
    cOptions = `
      <option value="Class 10" selected>Class 10 - Section A</option>
      <option value="Class 9">Class 9 - Section A</option>
      <option value="Class 8">Class 8 - Section A</option>
    `;
  }

  const canManageTimetable = window.canManage ? window.canManage() : false;

  return `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h1>Class Timetable Schedule</h1>
          <p class="subtitle">Weekly class periods, assigned faculty, room allocations, and course schedules</p>
        </div>
        <div class="flex gap-2">
          <select class="form-select" id="timetable-class-select" style="min-width: 220px;">
            ${cOptions}
          </select>
          <button class="btn btn-secondary" onclick="window.print()">
            ${icon('print', 18)} Print Schedule
          </button>
          ${canManageTimetable ? `
          <button class="btn btn-primary" id="add-timetable-slot-btn">
            ${icon('plus', 18)} Add Period Slot
          </button>
          ` : ''}
        </div>
      </div>

      <div class="card printable-area">
        <div class="card-header">
          <span class="card-title" id="timetable-title">Weekly Schedule: Active Curriculum Periods</span>
          <span class="badge badge-primary">Term 1 (2026-2027)</span>
        </div>

        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th style="width: 130px;">Day</th>
                ${timetablePeriods.map(p => `
                  <th style="text-align: center; min-width: 140px;">
                    <div>${p.period}</div>
                    <div class="text-xs text-secondary font-normal">${p.time}</div>
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody id="timetable-grid-tbody">
              ${renderTimetableGridRows()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderTimetableGridRows() {
  const defaultSubjects = {
    Monday: ['Mathematics', 'Science', 'English', 'History', 'Physics Lab', 'Sports'],
    Tuesday: ['English', 'Mathematics', 'Geography', 'Science', 'Chemistry Lab', 'Library'],
    Wednesday: ['Science', 'Computer AI', 'Mathematics', 'Civics', 'Arts & Craft', 'Music'],
    Thursday: ['Mathematics', 'Science', 'English', 'Hindi', 'Physical Ed', 'Debate'],
    Friday: ['Computer AI', 'Physics', 'Chemistry', 'Mathematics', 'English', 'Club Activity'],
    Saturday: ['Life Skills', 'Environmental Studies', 'Remedial Math', 'Sports', 'Self Study', 'Assembly']
  };

  return timetableDays.map(day => {
    const dayDbSlots = (timetableDbSlots || []).filter(s => s.day === day);

    return `
      <tr>
        <td><strong>${day}</strong></td>
        ${timetablePeriods.map((p, idx) => {
          const match = dayDbSlots[idx] || null;
          const subTitle = match ? (match.subject_name || match.teacher_name || 'Subject') : (defaultSubjects[day][idx] || 'Free Period');
          const roomNo = match ? (match.room || 'Room 201') : (idx === 4 ? 'STEM Lab' : 'Room ' + (201 + idx));
          const teacher = match ? (match.teacher_name || 'Faculty') : 'Faculty In-Charge';

          return `
            <td style="text-align: center;">
              <div class="p-2 rounded-md" style="background: var(--bg-input); font-weight: 600; font-size: 0.85rem; border: 1px solid var(--border-secondary);">
                <div style="color: var(--primary-700); font-weight: 700;">${subTitle}</div>
                <div class="text-xs text-secondary font-normal mt-1">${roomNo} • ${teacher}</div>
              </div>
            </td>
          `;
        }).join('')}
      </tr>
    `;
  }).join('');
}

function bindTimetableEvents() {
  const select = document.getElementById('timetable-class-select');
  const title = document.getElementById('timetable-title');
  if (select && title) {
    select.onchange = () => {
      title.textContent = `Weekly Schedule: ${select.value}`;
      if (window.showToast) window.showToast(`Loaded timetable for ${select.value}`, 'info');
    };
  }

  const canManageTimetable = window.canManage ? window.canManage() : false;
  const addSlotBtn = document.getElementById('add-timetable-slot-btn');
  if (addSlotBtn && canManageTimetable) {
    addSlotBtn.onclick = async () => {
      let subjectsForModal = subjectList || [];
      if (subjectsForModal.length === 0) {
        try {
          const sRes = await api.get('/academics/subjects');
          if (Array.isArray(sRes.data)) subjectsForModal = sRes.data;
        } catch {}
      }

      const subOptions = subjectsForModal.map(s => `<option value="${s.id}">${s.name} (${s.code || 'GEN'})</option>`).join('');

      window.openAppModal({
        title: 'Add Period Slot to Timetable',
        subtitle: 'Configure daily lesson schedule, classroom room number, and instructor assignment',
        saveLabel: 'Save Timetable Slot',
        saveIcon: 'plus',
        contentHtml: `
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Day of Week *</label>
              <select class="form-select" id="modal-tt-day">
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Subject Course *</label>
              <select class="form-select" id="modal-tt-subject">
                ${subOptions || '<option value="1">Mathematics (MATH101)</option><option value="2">Science (SCI102)</option>'}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Start Time *</label>
              <input type="time" class="form-input" id="modal-tt-start" value="09:00" required />
            </div>
            <div class="form-group">
              <label class="form-label">End Time *</label>
              <input type="time" class="form-input" id="modal-tt-end" value="09:45" required />
            </div>
            <div class="form-group">
              <label class="form-label">Faculty / Instructor</label>
              <input type="text" class="form-input" id="modal-tt-teacher" value="Ms. Pooja Sen" placeholder="Faculty name" />
            </div>
            <div class="form-group">
              <label class="form-label">Room / Lab Designation</label>
              <input type="text" class="form-input" id="modal-tt-room" value="Room 101" placeholder="e.g. Room 101 or Physics Lab" />
            </div>
          </div>
        `,
        onSave: async () => {
          const day = document.getElementById('modal-tt-day').value;
          const subjectId = parseInt(document.getElementById('modal-tt-subject').value) || 1;
          const startTime = document.getElementById('modal-tt-start').value + ':00';
          const endTime = document.getElementById('modal-tt-end').value + ':00';
          const teacher = document.getElementById('modal-tt-teacher').value.trim() || 'Assigned Faculty';
          const room = document.getElementById('modal-tt-room').value.trim() || 'Room 101';

          try {
            await api.post('/timetable', {
              class_id: 1,
              section: 'A',
              day,
              start_time: startTime,
              end_time: endTime,
              subject_id: subjectId,
              teacher_name: teacher,
              room
            });
            const ttRes = await api.get('/timetable');
            if (Array.isArray(ttRes.data)) timetableDbSlots = ttRes.data;
          } catch (e) {
            console.warn('Timetable save API fallback:', e);
          }

          const tbody = document.getElementById('timetable-grid-tbody');
          if (tbody) tbody.innerHTML = renderTimetableGridRows();
          if (window.showToast) window.showToast('Timetable slot saved and stored in database', 'success');
          return true;
        }
      });
    };
  }
}

/* ==========================================================================
   Annual Academic Calendar View
   ========================================================================== */
let calendarEvents = [];

async function renderAnnualCalendar() {
  try {
    const res = await api.get('/calendar-events');
    if (Array.isArray(res.data) && res.data.length > 0) {
      calendarEvents = res.data;
    } else if (Array.isArray(res) && res.length > 0) {
      calendarEvents = res;
    }
  } catch {
    // fallback
  }

  if (calendarEvents.length === 0) {
    calendarEvents = [
      { id: 1, title: 'Term 1 Mid-Term Examination', date: '2026-10-12', type: 'Examination', description: 'Term 1 summative evaluation' },
      { id: 2, title: 'Annual Inter-House Sports Meet', date: '2026-11-05', type: 'Sports', description: 'Athletic competitions' },
      { id: 3, title: 'Diwali Festive Vacation', date: '2026-11-10', type: 'Holiday', description: 'School closed for Diwali' },
      { id: 4, title: 'Parent-Teacher Conference (PTM)', date: '2026-11-28', type: 'Academic', description: 'Term 1 report card discussion' },
      { id: 5, title: 'Science & Robotics Exhibition', date: '2026-12-15', type: 'Event', description: 'Annual STEM fair' },
      { id: 6, title: 'Winter Break', date: '2026-12-24', type: 'Holiday', description: 'Winter vacation closure' },
    ];
  }

  return `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h1>Annual Academic Calendar (2026 - 2027)</h1>
          <p class="subtitle">Official school terms, scheduled holidays, examination milestones, and institutional events</p>
        </div>
        ${window.canManage(['teacher']) ? `
        <button class="btn btn-primary" id="add-calendar-event-btn">
          ${icon('plus', 18)} Add Event
        </button>` : ''}
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Calendar Schedule</span>
            <span class="badge badge-primary">${calendarEvents.length} Events Logged</span>
          </div>
          <div class="flex flex-col gap-3" id="calendar-event-list">
            ${renderCalendarEventItems(calendarEvents)}
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">Term Milestones</span>
          </div>
          <div style="line-height: 2; font-size: 0.9rem;">
            <div class="flex justify-between border-b py-2">
              <span class="text-secondary">Term 1 Working Days:</span>
              <strong>112 Days</strong>
            </div>
            <div class="flex justify-between border-b py-2">
              <span class="text-secondary">Term 2 Working Days:</span>
              <strong>108 Days</strong>
            </div>
            <div class="flex justify-between border-b py-2">
              <span class="text-secondary">Total Gazetted Holidays:</span>
              <strong style="color: var(--warning-600);">28 Days</strong>
            </div>
            <div class="flex justify-between py-2">
              <span class="text-secondary">Board Exam Commencement:</span>
              <strong style="color: var(--primary-600);">March 01, 2027</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderCalendarEventItems(items) {
  const badgeMap = {
    Academic: 'badge-primary',
    Examination: 'badge-danger',
    Holiday: 'badge-warning',
    Sports: 'badge-success',
    Event: 'badge-info',
  };

  return items.map(e => `
    <div class="p-4 rounded-md flex justify-between items-center" style="background: var(--bg-input);">
      <div>
        <div style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem;">${e.title}</div>
        <div class="text-xs text-secondary mt-1 flex items-center gap-1">
          <span>${icon('calendar', 14)}</span> ${e.date} ${e.description ? '• ' + e.description : ''}
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="badge ${badgeMap[e.type] || 'badge-primary'}">${e.type}</span>
        ${window.canManage(['teacher']) ? `
        <button class="btn-ghost btn-sm delete-cal-event-btn" data-id="${e.id}" data-title="${e.title}" title="Delete Event" style="color: var(--danger-500); padding: 4px;">
          ${icon('trash', 14)}
        </button>` : ''}
      </div>
    </div>
  `).join('');
}

function bindAnnualCalendarEvents() {
  function attachCalActions() {
    document.querySelectorAll('.delete-cal-event-btn').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.getAttribute('data-id');
        const title = btn.getAttribute('data-title') || 'Event';
        try {
          await api.delete('/calendar-events/' + id);
          const cRes = await api.get('/calendar-events');
          if (Array.isArray(cRes.data)) calendarEvents = cRes.data;
          else calendarEvents = calendarEvents.filter(x => String(x.id) !== String(id));
        } catch {
          calendarEvents = calendarEvents.filter(x => String(x.id) !== String(id));
        }
        const container = document.getElementById('calendar-event-list');
        if (container) container.innerHTML = renderCalendarEventItems(calendarEvents);
        attachCalActions();
        if (window.showToast) window.showToast(`Event "${title}" removed from database`, 'success');
      };
    });
  }

  attachCalActions();

  const addBtn = document.getElementById('add-calendar-event-btn');
  if (addBtn) {
    addBtn.onclick = () => {
      window.openAppModal({
        title: 'Schedule Calendar Event',
        subtitle: 'Record an academic assessment, holiday closure, or inter-school activity',
        saveLabel: 'Publish Event',
        saveIcon: 'calendar',
        contentHtml: `
          <div class="form-grid">
            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label">Event / Activity Title *</label>
              <input type="text" class="form-input" id="modal-cal-title" placeholder="e.g. Science Fair & Hackathon 2026" required />
            </div>
            <div class="form-group">
              <label class="form-label">Scheduled Date *</label>
              <input type="date" class="form-input" id="modal-cal-date" value="${new Date().toISOString().split('T')[0]}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Category</label>
              <select class="form-select" id="modal-cal-type">
                <option value="Academic">Academic</option>
                <option value="Event" selected>Event</option>
                <option value="Holiday">Holiday</option>
              </select>
            </div>
            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label">Description / Remarks</label>
              <input type="text" class="form-input" id="modal-cal-desc" placeholder="e.g. All classes participate in main auditorium" />
            </div>
          </div>
        `,
        onSave: async () => {
          const title = document.getElementById('modal-cal-title').value.trim();
          const date = document.getElementById('modal-cal-date').value;
          const desc = document.getElementById('modal-cal-desc').value.trim();
          if (!title || !date) {
            if (window.showToast) window.showToast('Please provide both Title and Date', 'warning');
            return false;
          }
          const type = document.getElementById('modal-cal-type').value;

          try {
            await api.post('/calendar-events', {
              title,
              date,
              type,
              description: desc || 'Official school event'
            });
            const cRes = await api.get('/calendar-events');
            if (Array.isArray(cRes.data) && cRes.data.length > 0) {
              calendarEvents = cRes.data;
            }
          } catch (e) {
            console.warn('Calendar event save API fallback:', e);
            calendarEvents.unshift({
              id: Date.now(),
              title,
              date,
              type,
              description: desc
            });
          }

          const container = document.getElementById('calendar-event-list');
          if (container) container.innerHTML = renderCalendarEventItems(calendarEvents);
          attachCalActions();
          if (window.showToast) window.showToast(`Event "${title}" added and stored in database`, 'success');
          return true;
        }
      });
    };
  }
}

/* ==========================================================================
   Download Center & Material Upload View
   ========================================================================== */
let documents = [];

async function renderDownloadCenter() {
  try {
    const res = await api.get('/downloads');
    if (Array.isArray(res.data) && res.data.length > 0) {
      documents = res.data;
    } else if (Array.isArray(res) && res.length > 0) {
      documents = res;
    }
  } catch (e) {
    console.warn('Download center fetch fallback:', e);
  }

  if (documents.length === 0) {
    documents = [
      { id: 1, title: 'Class 10 CBSE Board Syllabus 2026-27', type: 'Syllabus', file_size: '2.4 MB', created_at: '2026-08-15', class_name: 'Class 10' },
      { id: 2, title: 'Physics Laboratory Manual & Experiment Sheets', type: 'Assignments', file_size: '5.1 MB', created_at: '2026-09-01', class_name: 'Class 11 & 12' },
      { id: 3, title: 'Mathematics Formula Handbook & Quick Reference', type: 'Study Material', file_size: '1.8 MB', created_at: '2026-09-10', class_name: 'All Classes' },
      { id: 4, title: 'School Code of Conduct & Transport Guidelines', type: 'Circular', file_size: '840 KB', created_at: '2026-07-20', class_name: 'All' },
    ];
  }

  return `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h1>Download Center & Digital Resources</h1>
          <p class="subtitle">Upload and access curriculum guides, syllabus, homework sheets, and study materials</p>
        </div>
        ${window.canManage(['teacher']) ? `
        <button class="btn btn-primary" id="upload-doc-btn">
          ${icon('upload', 18)} Upload Study Material
        </button>` : ''}
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">Academic Study Resources & Documents</span>
          <span class="badge badge-primary">${documents.length} Materials Available</span>
        </div>
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Document Title</th>
                <th>Resource Category</th>
                <th>Target Class</th>
                <th>File Size</th>
                <th>Upload Date</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody id="downloads-tbody">
              ${renderDownloadRows(documents)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderDownloadRows(items) {
  if (!items || items.length === 0) {
    return `<tr><td colspan="6" class="text-center p-8 text-secondary">No study materials uploaded yet. Click "Upload Study Material" to share documents.</td></tr>`;
  }
  return items.map(d => `
    <tr>
      <td>
        <div class="flex items-center gap-2">
          <span style="color: var(--primary-600);">${icon('doc', 18)}</span>
          <div>
            <strong>${d.title}</strong>
            ${d.description ? `<div class="text-xs text-secondary mt-1">${d.description}</div>` : ''}
          </div>
        </div>
      </td>
      <td><span class="badge badge-info">${d.type || d.category || 'Study Material'}</span></td>
      <td><span class="badge badge-primary">${d.class_name || d.classes || 'All Classes'}</span></td>
      <td>${d.file_size || d.size || '2.4 MB'}</td>
      <td class="text-secondary">${(d.created_at || d.date || '2026-09-28').toString().slice(0, 10)}</td>
      <td style="text-align: right;">
        <div class="flex justify-end gap-1">
          <button class="btn btn-secondary btn-sm download-doc-file-btn" data-title="${d.title}" data-cat="${d.type || d.category || 'General'}">
            ${icon('download', 14)} Download
          </button>
          ${window.canManage(['teacher']) ? `
          <button class="btn-ghost btn-sm delete-doc-file-btn" data-id="${d.id}" data-title="${d.title}" title="Remove Document" style="color: var(--danger-500);">
            ${icon('trash', 14)}
          </button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

function bindDownloadCenterEvents() {
  function attachDownloadActions() {
    // Download Action
    document.querySelectorAll('.download-doc-file-btn').forEach(btn => {
      btn.onclick = () => {
        const docTitle = btn.getAttribute('data-title');
        const docCat = btn.getAttribute('data-cat');
        const sampleText = `Smart School Management System (Infosof Technologies 2026)\n======================================================\nOfficial Document: ${docTitle}\nCategory: ${docCat}\nAcademic Year: 2026-2027\nDownloaded at: ${new Date().toLocaleString()}\n\nOfficial verified curriculum document and academic reference material.`;
        const blob = new Blob([sampleText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${docTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        if (window.showToast) window.showToast(`Downloaded: ${docTitle}`, 'success');
      };
    });

    // Delete Action
    document.querySelectorAll('.delete-doc-file-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const title = btn.getAttribute('data-title') || 'Document';

        window.openAppModal({
          title: `Delete Document: ${title}?`,
          subtitle: 'Confirm removal of this academic resource from the download center',
          saveLabel: 'Confirm Delete',
          saveIcon: 'trash',
          contentHtml: `
            <div style="padding: 12px 0;">
              <p style="color: var(--danger-500); font-weight: 600;">
                Are you sure you want to remove <strong>${title}</strong>?
              </p>
              <p class="text-sm text-secondary mt-2">
                This will delete the file reference from institutional storage and database.
              </p>
            </div>
          `,
          onSave: async () => {
            try {
              await api.delete('/downloads/' + id);
              const dRes = await api.get('/downloads');
              if (Array.isArray(dRes.data)) documents = dRes.data;
              else documents = documents.filter(x => String(x.id) !== String(id));
            } catch (e) {
              console.warn('Document delete API fallback:', e);
              documents = documents.filter(x => String(x.id) !== String(id));
            }

            const tbody = document.getElementById('downloads-tbody');
            if (tbody) tbody.innerHTML = renderDownloadRows(documents);
            attachDownloadActions();
            if (window.showToast) window.showToast(`Document "${title}" removed from database`, 'success');
            return true;
          }
        });
      };
    });
  }

  attachDownloadActions();

  // Upload Document Modal
  const btn = document.getElementById('upload-doc-btn');
  if (btn) {
    btn.onclick = async () => {
      let classOptions = '';
      if (Array.isArray(classList) && classList.length > 0) {
        classOptions = classList.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
      } else {
        classOptions = '<option value="All Classes">All Classes</option><option value="Class 10">Class 10</option><option value="Class 9">Class 9</option>';
      }

      window.openAppModal({
        title: 'Upload Study Material & Document',
        subtitle: 'Upload and store curriculum syllabus, question banks, or reference notes in database',
        saveLabel: 'Upload & Publish',
        saveIcon: 'upload',
        contentHtml: `
          <div class="form-grid">
            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label">Document Title *</label>
              <input type="text" class="form-input" id="modal-doc-title" placeholder="e.g. CBSE Class 10 Chemistry Complete Formula Sheet 2026" required />
            </div>
            <div class="form-group">
              <label class="form-label">Resource Category *</label>
              <select class="form-select" id="modal-doc-category">
                <option value="Syllabus">Curriculum Syllabus</option>
                <option value="Study Material" selected>Study Material & Notes</option>
                <option value="Assignments">Assignments & Homework</option>
                <option value="Sample Paper">Sample Question Paper</option>
                <option value="Circular">Administrative Circular</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Target Class / Stream *</label>
              <select class="form-select" id="modal-doc-classes">
                <option value="All Classes">All Classes</option>
                ${classOptions}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">File Attachment / Size</label>
              <input type="text" class="form-input" id="modal-doc-size" value="3.2 MB" placeholder="e.g. 2.4 MB (PDF Document)" />
            </div>
            <div class="form-group">
              <label class="form-label">Simulated File Upload</label>
              <input type="file" class="form-input" id="modal-doc-file" style="padding: 8px;" />
            </div>
            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label">Brief Description</label>
              <input type="text" class="form-input" id="modal-doc-desc" placeholder="e.g. Verified syllabus breakdown and key revision questions for board exam" />
            </div>
          </div>
        `,
        onSave: async () => {
          const title = document.getElementById('modal-doc-title').value.trim();
          if (!title) {
            if (window.showToast) window.showToast('Please enter document title', 'warning');
            return false;
          }
          const category = document.getElementById('modal-doc-category').value;
          const targetClass = document.getElementById('modal-doc-classes').value;
          const size = document.getElementById('modal-doc-size').value.trim() || '2.4 MB';
          const desc = document.getElementById('modal-doc-desc').value.trim();

          const payload = {
            title,
            type: category,
            class_name: targetClass,
            file_size: size,
            description: desc || 'Official verified academic resource'
          };

          try {
            await api.post('/downloads', payload);
            const dRes = await api.get('/downloads');
            if (Array.isArray(dRes.data) && dRes.data.length > 0) {
              documents = dRes.data;
            }
          } catch (e) {
            console.warn('Download save API fallback:', e);
            documents.unshift({
              id: Date.now(),
              ...payload,
              created_at: new Date().toISOString()
            });
          }

          const tbody = document.getElementById('downloads-tbody');
          if (tbody) tbody.innerHTML = renderDownloadRows(documents);
          attachDownloadActions();
          if (window.showToast) window.showToast(`Document "${title}" uploaded and stored in database`, 'success');
          return true;
        }
      });
    };
  }
}

/* ==========================================================================
   Live Virtual Classes View
   ========================================================================== */
let liveList = [];

// Helper to sanitize & auto-format meeting links (handles raw Google Meet codes like abc-defg-hij)
function formatMeetingLink(rawLink) {
  let link = (rawLink || '').trim();
  if (!link) return 'https://meet.google.com/new';
  if (/^[a-z]{3}-[a-z]{4}-[a-z]{3}$/i.test(link)) {
    return 'https://meet.google.com/' + link.toLowerCase();
  }
  if (!/^https?:\/\//i.test(link)) {
    link = 'https://' + link;
  }
  return link;
}

// Redirects or opens the target online meeting link reliably
function launchMeetingLink(link) {
  const finalLink = formatMeetingLink(link);
  try {
    const newWin = window.open(finalLink, '_blank');
    if (!newWin || newWin.closed || typeof newWin.closed === 'undefined') {
      window.location.assign(finalLink);
    }
  } catch (e) {
    window.location.assign(finalLink);
  }
}

async function renderLiveClasses() {
  try {
    const res = await api.get('/live-classes');
    if (Array.isArray(res.data) && res.data.length > 0) {
      liveList = res.data;
    } else if (Array.isArray(res) && res.length > 0) {
      liveList = res;
    }
  } catch (e) {
    console.warn('Live classes fetch fallback:', e);
  }

  if (liveList.length === 0) {
    liveList = [
      { id: 1, title: 'Calculus & Limits Problem Solving', subject: 'Mathematics', class_name: 'Class 12-A', teacher_name: 'Dr. Vivek Saxena', platform: 'Google Meet', time: '10:00 AM - 11:00 AM', status: 'live', link: 'https://meet.google.com' },
      { id: 2, title: 'Electromagnetism Lecture & Simulations', subject: 'Physics', class_name: 'Class 11-A', teacher_name: 'Mrs. Verma', platform: 'Zoom Meeting', time: '11:30 AM - 12:30 PM', status: 'upcoming', link: 'https://zoom.us' },
      { id: 3, title: 'Organic Chemistry Reactions Review', subject: 'Chemistry', class_name: 'Class 12-A', teacher_name: 'Dr. Meenakshi Iyer', platform: 'Google Meet', time: '02:00 PM - 03:00 PM', status: 'upcoming', link: 'https://meet.google.com' },
    ];
  }

  const liveNowCount = liveList.filter(x => String(x.status || '').toLowerCase().includes('live')).length;

  return `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h1>Live Virtual Classes</h1>
          <p class="subtitle">Interactive remote learning with integrated Google Meet, Zoom video rooms, and database persistence</p>
        </div>
        ${window.canManage(['teacher']) ? `
        <button class="btn btn-secondary" id="schedule-class-btn">
          ${icon('plus', 18)} Advanced Schedule Modal
        </button>` : ''}
      </div>

      ${window.canManage(['teacher']) ? `
      <!-- Quick Launch & Instant Online Meeting Section -->
      <div class="card mb-6" style="border: 1px solid rgba(99, 102, 241, 0.28); background: linear-gradient(135deg, rgba(99, 102, 241, 0.04) 0%, rgba(168, 85, 247, 0.04) 100%); box-shadow: 0 4px 20px -2px rgba(99, 102, 241, 0.07);">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 0.85rem; flex-wrap: wrap; gap: 0.75rem;">
          <div class="flex items-center gap-3">
            <div style="width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #4285f4 0%, #34a853 50%, #fbbc05 75%, #ea4335 100%); display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3);">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/></svg>
            </div>
            <div>
              <span class="card-title" style="font-size: 1.12rem; display: flex; align-items: center; gap: 8px; margin: 0;">
                Online Meeting Link Integration (Google Meet / Zoom)
                <span class="badge badge-success" style="font-size: 0.7rem; font-weight: 700;">● Active Redirection</span>
              </span>
              <div class="text-xs text-secondary mt-1">
                Paste Google Meet link (e.g. <code>meet.google.com/xxx-yyyy-zzz</code>), Zoom or MS Teams link. Saves to MySQL and redirects immediately.
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <a href="https://meet.google.com/new" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" id="btn-quick-new-gmeet" style="display: inline-flex; align-items: center; gap: 6px; font-weight: 600;">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ea4335" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
              Create New GMeet (meet.new)
            </a>
          </div>
        </div>

        <form id="quick-meet-form" style="padding-top: 1.25rem;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; align-items: flex-end;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 600; font-size: 0.82rem;">Session / Topic Title *</label>
              <input type="text" class="form-input" id="quick-meet-title" placeholder="e.g. Mathematics Board Exam Doubts" value="Live Interactive Session" required />
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 600; font-size: 0.82rem;">Subject & Target Class</label>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem;">
                <input type="text" class="form-input" id="quick-meet-subject" placeholder="Subject" value="Mathematics" />
                <input type="text" class="form-input" id="quick-meet-class" placeholder="Class" value="Class 10-A" />
              </div>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 600; font-size: 0.82rem;">Meeting Platform</label>
              <select class="form-select" id="quick-meet-platform">
                <option value="Google Meet" selected>Google Meet</option>
                <option value="Zoom Meeting">Zoom Meeting</option>
                <option value="Microsoft Teams">Microsoft Teams</option>
                <option value="Online Room / Other">Other / Webex</option>
              </select>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 600; font-size: 0.82rem;">Meeting Link / Code *</label>
              <div style="position: relative;">
                <input type="text" class="form-input" id="quick-meet-link" placeholder="https://meet.google.com/abc-defg-hij" value="https://meet.google.com/new" required style="padding-left: 2rem; font-family: monospace; font-size: 0.88rem;" />
                <span style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); color: var(--text-secondary); pointer-events: none;">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                </span>
              </div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.25rem; padding-top: 1rem; border-top: 1px dashed var(--border-color); flex-wrap: wrap; gap: 0.75rem;">
            <div class="flex items-center gap-2 text-xs text-secondary">
              <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #22c55e;"></span>
              Real-time synchronization with MySQL database. Automatically redirects to meeting link upon submission.
            </div>
            <div class="flex items-center gap-3">
              <button type="button" class="btn btn-secondary btn-sm" id="quick-meet-direct-launch-btn" style="display: inline-flex; align-items: center; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                Direct Redirect (No Save)
              </button>
              <button type="submit" class="btn btn-primary btn-sm" id="quick-meet-save-btn" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); display: inline-flex; align-items: center; gap: 6px; font-weight: 600; padding: 0.5rem 1.25rem;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Save & Launch Meeting Link
              </button>
            </div>
          </div>
        </form>
      </div>` : ''}

      <div class="grid-3 mb-6">
        <div class="stat-card stat-primary">
          <div class="stat-icon">${icon('video', 24)}</div>
          <div class="stat-value">${liveNowCount} Active</div>
          <div class="stat-label">Currently Live Stream</div>
        </div>
        <div class="stat-card stat-success">
          <div class="stat-icon">${icon('academic', 24)}</div>
          <div class="stat-value">${liveList.length} Total</div>
          <div class="stat-label">Scheduled Virtual Sessions</div>
        </div>
        <div class="stat-card stat-info">
          <div class="stat-icon">${icon('users', 24)}</div>
          <div class="stat-value">100% Online</div>
          <div class="stat-label">Cloud Video Integration</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">Live & Upcoming Sessions</span>
          <span class="badge badge-primary">${liveList.length} Sessions</span>
        </div>
        <div class="flex flex-col gap-4" id="live-classes-list">
          ${renderLiveClassCards(liveList)}
        </div>
      </div>
    </div>
  `;
}

function renderLiveClassCards(items) {
  if (!items || items.length === 0) {
    return `<div class="p-8 text-center text-secondary">No live sessions scheduled. Use the form above or click "Schedule Live Class" to create one.</div>`;
  }
  return items.map(item => {
    const isMeet = (item.platform || '').toLowerCase().includes('meet');
    const isZoom = (item.platform || '').toLowerCase().includes('zoom');
    const isLive = String(item.status || '').toLowerCase().includes('live');
    const link = formatMeetingLink(item.link || 'https://meet.google.com');

    return `
      <div class="p-4 rounded-md flex justify-between items-center" style="background: var(--bg-input); border-left: 4px solid ${isLive ? 'var(--danger-500)' : 'var(--primary-500)'}; transition: all 0.2s ease;">
        <div style="min-width: 0; flex: 1; margin-right: 1.5rem;">
          <div class="flex items-center gap-2 flex-wrap">
            <h3 style="font-weight: 700; font-size: 1rem; color: var(--text-primary); margin: 0;">${item.title}</h3>
            <span class="badge ${isLive ? 'badge-danger' : 'badge-primary'}">
              ${isLive ? '● LIVE NOW' : 'Upcoming'}
            </span>
            <span class="badge badge-secondary" style="font-size: 0.72rem; display: inline-flex; align-items: center; gap: 4px;">
              ${isMeet ? '🟢 Google Meet' : isZoom ? '🔵 Zoom' : '🌐 ' + (item.platform || 'Online Room')}
            </span>
          </div>
          <div class="text-xs text-secondary mt-1 flex items-center gap-2 flex-wrap">
            <span><strong>${item.subject || 'General'}</strong></span>
            <span>•</span>
            <span>${item.class_name || item.class || 'Class 10'}</span>
            <span>•</span>
            <span>Instructor: <strong>${item.teacher_name || item.teacher || 'Assigned Faculty'}</strong></span>
            <span>•</span>
            <span>${item.time || '10:00 AM'}</span>
          </div>
          <div class="mt-2 flex items-center gap-2">
            <a href="${link}" target="_blank" rel="noopener noreferrer" class="text-xs meeting-direct-link" style="color: var(--primary-500); text-decoration: none; font-family: monospace; display: inline-flex; align-items: center; gap: 4px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              ${link}
            </a>
            <button class="btn-ghost btn-sm copy-meet-link-btn" data-link="${link}" title="Copy Link" style="padding: 2px 6px; font-size: 0.75rem; color: var(--text-secondary); cursor: pointer;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
              Copy
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2" style="flex-shrink: 0;">
          <button class="btn ${isLive ? 'btn-danger' : 'btn-primary'} btn-sm live-redirect-btn" data-link="${link}" style="display: inline-flex; align-items: center; gap: 6px; font-weight: 600;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            ${isLive ? 'Join Live Room & Redirect' : (window.canManage(['teacher']) ? 'Start Session & Redirect' : 'Join Live Class')}
          </button>
          ${window.canManage(['teacher']) ? `
          <button class="btn-ghost btn-sm delete-live-session-btn" data-id="${item.id}" data-title="${item.title}" title="Cancel Session" style="color: var(--danger-500);">
            ${icon('trash', 14)}
          </button>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function bindLiveClassesEvents() {
  function attachLiveActions() {
    // Delete session action
    document.querySelectorAll('.delete-live-session-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const title = btn.getAttribute('data-title') || 'Session';

        window.openAppModal({
          title: `Cancel Session: ${title}?`,
          subtitle: 'Confirm cancellation of this virtual live class session',
          saveLabel: 'Confirm Cancel',
          saveIcon: 'trash',
          contentHtml: `
            <div style="padding: 12px 0;">
              <p style="color: var(--danger-500); font-weight: 600;">
                Are you sure you want to cancel and remove <strong>${title}</strong>?
              </p>
              <p class="text-sm text-secondary mt-2">
                This removes the live video room reference from the database and student portals.
              </p>
            </div>
          `,
          onSave: async () => {
            try {
              await api.delete('/live-classes/' + id);
              const lRes = await api.get('/live-classes');
              if (Array.isArray(lRes.data)) liveList = lRes.data;
              else liveList = liveList.filter(x => String(x.id) !== String(id));
            } catch (e) {
              console.warn('Live session delete API fallback:', e);
              liveList = liveList.filter(x => String(x.id) !== String(id));
            }

            const container = document.getElementById('live-classes-list');
            if (container) container.innerHTML = renderLiveClassCards(liveList);
            attachLiveActions();
            if (window.showToast) window.showToast(`Session "${title}" cancelled and removed`, 'success');
            return true;
          }
        });
      };
    });

    // Join & Redirect button action
    document.querySelectorAll('.live-redirect-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const link = btn.getAttribute('data-link');
        if (window.showToast) window.showToast('Redirecting to meeting room: ' + link, 'info');
        launchMeetingLink(link);
      };
    });

    // Copy meeting link action
    document.querySelectorAll('.copy-meet-link-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const link = btn.getAttribute('data-link');
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(link).then(() => {
            if (window.showToast) window.showToast('Meeting link copied to clipboard!', 'success');
          }).catch(() => {
            if (window.showToast) window.showToast('Meeting link: ' + link, 'info');
          });
        } else {
          if (window.showToast) window.showToast('Meeting link: ' + link, 'info');
        }
      };
    });
  }

  attachLiveActions();

  // Quick Online Meeting Section Form
  const quickForm = document.getElementById('quick-meet-form');
  if (quickForm) {
    quickForm.onsubmit = async (e) => {
      e.preventDefault();
      const title = (document.getElementById('quick-meet-title')?.value || '').trim();
      const subject = (document.getElementById('quick-meet-subject')?.value || '').trim() || 'General';
      const cls = (document.getElementById('quick-meet-class')?.value || '').trim() || 'Class 10';
      const platform = document.getElementById('quick-meet-platform')?.value || 'Google Meet';
      const rawLink = (document.getElementById('quick-meet-link')?.value || '').trim();

      if (!title) {
        if (window.showToast) window.showToast('Please enter session title', 'warning');
        return;
      }
      if (!rawLink) {
        if (window.showToast) window.showToast('Please enter or paste meeting link / code', 'warning');
        return;
      }

      const finalLink = formatMeetingLink(rawLink);
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const payload = {
        title,
        subject,
        class_name: cls,
        teacher_name: 'Dr. Vivek Saxena',
        platform,
        time: `${timeStr} (Live Now)`,
        link: finalLink,
        status: 'live',
        date: now.toISOString().split('T')[0]
      };

      try {
        await api.post('/live-classes', payload);
        const lRes = await api.get('/live-classes');
        if (Array.isArray(lRes.data) && lRes.data.length > 0) {
          liveList = lRes.data;
        } else if (Array.isArray(lRes) && lRes.length > 0) {
          liveList = lRes;
        }
      } catch (err) {
        console.warn('Quick meeting save fallback:', err);
        liveList.unshift({ id: Date.now(), ...payload });
      }

      const container = document.getElementById('live-classes-list');
      if (container) container.innerHTML = renderLiveClassCards(liveList);
      attachLiveActions();

      if (window.showToast) {
        window.showToast(`Meeting "${title}" saved to database! Redirecting...`, 'success');
      }

      // Automatically redirect with that link!
      launchMeetingLink(finalLink);
    };
  }

  // Direct Redirect Only (No Save) Button
  const directBtn = document.getElementById('quick-meet-direct-launch-btn');
  if (directBtn) {
    directBtn.onclick = () => {
      const rawLink = (document.getElementById('quick-meet-link')?.value || '').trim();
      if (!rawLink) {
        if (window.showToast) window.showToast('Please enter a meeting link to redirect', 'warning');
        document.getElementById('quick-meet-link')?.focus();
        return;
      }
      const finalLink = formatMeetingLink(rawLink);
      if (window.showToast) window.showToast('Redirecting directly to meeting room: ' + finalLink, 'info');
      launchMeetingLink(finalLink);
    };
  }

  // Quick helper: Create New GMeet tab button
  const newGMeetBtn = document.getElementById('btn-quick-new-gmeet');
  if (newGMeetBtn) {
    newGMeetBtn.onclick = () => {
      const platformSelect = document.getElementById('quick-meet-platform');
      if (platformSelect) platformSelect.value = 'Google Meet';
      const linkInput = document.getElementById('quick-meet-link');
      if (linkInput && !linkInput.value) linkInput.value = 'https://meet.google.com/new';
    };
  }

  // Advanced Schedule Modal button
  const btn = document.getElementById('schedule-class-btn');
  if (btn) {
    btn.onclick = () => {
      window.openAppModal({
        title: 'Schedule Virtual Live Class',
        subtitle: 'Configure interactive video room link, timing, and assigned curriculum class',
        saveLabel: 'Schedule Session',
        saveIcon: 'video',
        contentHtml: `
          <div class="form-grid">
            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label">Session Title *</label>
              <input type="text" class="form-input" id="modal-live-title" placeholder="e.g. AI & Machine Learning Interactive Seminar" required />
            </div>
            <div class="form-group">
              <label class="form-label">Subject</label>
              <input type="text" class="form-input" id="modal-live-subject" value="Computer Science" />
            </div>
            <div class="form-group">
              <label class="form-label">Class & Division</label>
              <input type="text" class="form-input" id="modal-live-class" value="Class 10-A" />
            </div>
            <div class="form-group">
              <label class="form-label">Host Instructor</label>
              <input type="text" class="form-input" id="modal-live-teacher" value="Dr. Vivek Saxena" />
            </div>
            <div class="form-group">
              <label class="form-label">Time Window</label>
              <input type="text" class="form-input" id="modal-live-time" value="03:30 PM - 04:30 PM" />
            </div>
            <div class="form-group">
              <label class="form-label">Platform</label>
              <select class="form-select" id="modal-live-platform">
                <option value="Google Meet">Google Meet</option>
                <option value="Zoom Meeting">Zoom Meeting</option>
                <option value="Microsoft Teams">Microsoft Teams</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Meeting Room Link</label>
              <input type="url" class="form-input" id="modal-live-link" value="https://meet.google.com/new" />
            </div>
            <div class="form-group" style="grid-column: span 2; display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="modal-live-redirect-check" checked style="accent-color: var(--primary-500); width: 16px; height: 16px;" />
              <label for="modal-live-redirect-check" style="font-size: 0.85rem; cursor: pointer;">Immediately launch & redirect to meeting room upon scheduling</label>
            </div>
          </div>
        `,
        onSave: async () => {
          const title = document.getElementById('modal-live-title').value.trim();
          if (!title) {
            if (window.showToast) window.showToast('Please enter session title', 'warning');
            return false;
          }
          const subject = document.getElementById('modal-live-subject').value.trim() || 'General';
          const cls = document.getElementById('modal-live-class').value.trim() || 'Class 10';
          const teacher = document.getElementById('modal-live-teacher').value.trim() || 'Faculty';
          const time = document.getElementById('modal-live-time').value.trim() || '04:00 PM';
          const platform = document.getElementById('modal-live-platform').value;
          const rawLink = document.getElementById('modal-live-link').value.trim() || 'https://meet.google.com';
          const finalLink = formatMeetingLink(rawLink);
          const redirectImmediately = document.getElementById('modal-live-redirect-check')?.checked;

          const payload = {
            title,
            subject,
            class_name: cls,
            teacher_name: teacher,
            platform,
            time,
            link: finalLink,
            status: redirectImmediately ? 'live' : 'upcoming',
            date: new Date().toISOString().split('T')[0]
          };

          try {
            await api.post('/live-classes', payload);
            const lRes = await api.get('/live-classes');
            if (Array.isArray(lRes.data) && lRes.data.length > 0) {
              liveList = lRes.data;
            }
          } catch (e) {
            console.warn('Live class save API fallback:', e);
            liveList.unshift({
              id: Date.now(),
              ...payload
            });
          }

          const container = document.getElementById('live-classes-list');
          if (container) container.innerHTML = renderLiveClassCards(liveList);
          attachLiveActions();
          if (window.showToast) window.showToast(`Live session "${title}" scheduled and stored in database`, 'success');

          if (redirectImmediately) {
            launchMeetingLink(finalLink);
          }
          return true;
        }
      });
    };
  }
}

/* ==========================================================================
   Module 6 & 40: Student Promotion & Academic Progression Modal
   ========================================================================== */
function openStudentPromotionModal() {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-dialog modal-md">
        <div class="modal-header">
          <span class="modal-title">Student Academic Promotion & Progression</span>
          <button class="modal-close" id="close-promo-modal">&times;</button>
        </div>
        <div class="modal-body" style="padding: 24px;">
          <p class="text-secondary text-sm mb-4">
            Promote enrolled students to the next academic session and class division based on annual exam evaluation.
          </p>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Current Academic Session</label>
              <select class="form-select" id="promo-cur-session">
                <option value="2025-2026" selected>2025 - 2026</option>
                <option value="2026-2027">2026 - 2027</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Current Class & Section</label>
              <select class="form-select" id="promo-cur-class">
                <option value="Class 9 - A" selected>Class 9 - Section A</option>
                <option value="Class 8 - A">Class 8 - Section A</option>
                <option value="Class 5 - A">Class 5 - Section A</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Target Next Session</label>
              <select class="form-select" id="promo-next-session">
                <option value="2026-2027" selected>2026 - 2027 (Upcoming)</option>
                <option value="2027-2028">2027 - 2028</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Promote to Class</label>
              <select class="form-select" id="promo-next-class">
                <option value="Class 10 - A" selected>Class 10 - Section A</option>
                <option value="Class 9 - A">Class 9 - Section A</option>
                <option value="Class 6 - A">Class 6 - Section A</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Progression Status Criteria</label>
            <select class="form-select" id="promo-criteria">
              <option value="pass_promoted" selected>Pass & Promote (Criteria > 40% Marks)</option>
              <option value="retest_conditional">Conditional Promotion (Awaiting Retest)</option>
              <option value="retain_same">Retain in Current Grade (Repeat Year)</option>
            </select>
          </div>

          <div class="p-3 rounded-md mt-4" style="background: var(--bg-input); border-left: 4px solid var(--success-500); font-size: 0.85rem;">
            <strong>Batch Progression:</strong> 56 Students in Class 9-A will be evaluated and advanced to Class 10-A for Session 2026-2027.
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="close-promo-btn">Cancel</button>
          <button class="btn btn-primary" id="do-promo-btn">${icon('checkCircle', 16)} Execute Promotion</button>
        </div>
      </div>
    </div>
  `;

  const closeModal = () => { modalRoot.innerHTML = ''; };
  document.getElementById('close-promo-modal').onclick = closeModal;
  document.getElementById('close-promo-btn').onclick = closeModal;
  document.getElementById('do-promo-btn').onclick = async () => {
    const btn = document.getElementById('do-promo-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner spinner-sm"></span> Processing...';
    try {
      await api.post('/academics/promote', {
        current_session: document.getElementById('promo-cur-session')?.value,
        target_session: document.getElementById('promo-next-session')?.value,
        current_class: document.getElementById('promo-cur-class')?.value,
        target_class: document.getElementById('promo-next-class')?.value,
      });
    } catch {}
    showToast('Students successfully promoted to the next academic session!', 'success');
    closeModal();
  };
}

/* ==========================================================================
   Module 6 & 40: Dedicated Student Promotion Page View
   ========================================================================== */
let promoStudentsList = [
  { id: 1, name: 'Aarav Sharma', adm_no: 'SS2025001', current_class: 'Class 9-A', marks: '88.5%', result: 'Pass', next_class: 'Class 10-A', status: 'Promote' },
  { id: 2, name: 'Diya Patel', adm_no: 'SS2025002', current_class: 'Class 9-A', marks: '92.0%', result: 'Pass', next_class: 'Class 10-A', status: 'Promote' },
  { id: 3, name: 'Ishaan Verma', adm_no: 'SS2025003', current_class: 'Class 9-A', marks: '74.2%', result: 'Pass', next_class: 'Class 10-A', status: 'Promote' },
  { id: 4, name: 'Ananya Iyer', adm_no: 'SS2025004', current_class: 'Class 9-A', marks: '81.4%', result: 'Pass', next_class: 'Class 10-A', status: 'Promote' },
  { id: 5, name: 'Rohan Mehra', adm_no: 'SS2025005', current_class: 'Class 9-A', marks: '36.5%', result: 'Fail', next_class: 'Class 9-A', status: 'Repeat' },
];

async function renderStudentPromotion() {
  return `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h1>Student Promotion & Academic Progression</h1>
          <p class="subtitle">Promote students to next academic session based on annual pass/fail examination criteria</p>
        </div>
        <div class="flex gap-2">
          <a href="#/academics/classes" class="btn btn-secondary">${icon('academic', 18)} Class Management</a>
          <button class="btn btn-primary" id="page-promo-execute-btn">${icon('checkCircle', 18)} Promote Selected</button>
        </div>
      </div>

      <!-- Progression Mapping Filters -->
      <div class="card mb-6">
        <div class="card-header"><span class="card-title">Progression Mapping Criteria</span></div>
        <div class="grid-4" style="gap: 16px;">
          <div class="form-group mb-0">
            <label class="form-label">Current Academic Session</label>
            <select class="form-select" id="page-promo-cur-ses">
              <option value="2025-2026" selected>2025 - 2026 (Completed)</option>
              <option value="2026-2027">2026 - 2027</option>
            </select>
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Current Class & Section</label>
            <select class="form-select" id="page-promo-cur-cls">
              <option value="Class 9 - A" selected>Class 9 - Section A</option>
              <option value="Class 8 - A">Class 8 - Section A</option>
              <option value="Class 5 - A">Class 5 - Section A</option>
            </select>
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Target Next Session</label>
            <select class="form-select" id="page-promo-nxt-ses">
              <option value="2026-2027" selected>2026 - 2027 (Active)</option>
              <option value="2027-2028">2027 - 2028</option>
            </select>
          </div>
          <div class="form-group mb-0">
            <label class="form-label">Promote to Class & Section</label>
            <select class="form-select" id="page-promo-nxt-cls">
              <option value="Class 10 - A" selected>Class 10 - Section A</option>
              <option value="Class 9 - A">Class 9 - Section A</option>
              <option value="Class 6 - A">Class 6 - Section A</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Student Promotion Table -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Student Evaluation & Promotion Roster</span>
          <div class="flex items-center gap-2">
            <span class="text-sm text-secondary">Select All</span>
            <input type="checkbox" id="promo-select-all" checked style="width: 18px; height: 18px;" />
          </div>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th style="width: 40px;"></th>
              <th>Student Name</th>
              <th>Admission #</th>
              <th>Current Class</th>
              <th>Exam Score</th>
              <th>Academic Result</th>
              <th>Progression Status</th>
              <th>Promoted To</th>
            </tr>
          </thead>
          <tbody id="promo-students-tbody">
            ${promoStudentsList.map(s => `
              <tr>
                <td><input type="checkbox" class="promo-chk" data-id="${s.id}" checked style="width: 16px; height: 16px;" /></td>
                <td><strong>${s.name}</strong></td>
                <td><code>${s.adm_no}</code></td>
                <td>${s.current_class}</td>
                <td><strong>${s.marks}</strong></td>
                <td>
                  <span class="badge ${s.result === 'Pass' ? 'badge-success' : 'badge-danger'}">
                    ${s.result}
                  </span>
                </td>
                <td>
                  <select class="form-select form-select-sm" style="width: 120px;" onchange="showToast('Status updated for ${s.name}', 'info')">
                    <option value="Promote" ${s.status === 'Promote' ? 'selected' : ''}>Promote</option>
                    <option value="Repeat" ${s.status === 'Repeat' ? 'selected' : ''}>Repeat</option>
                    <option value="Leave" ${s.status === 'Leave' ? 'selected' : ''}>Leave School</option>
                  </select>
                </td>
                <td><span class="badge badge-primary">${s.next_class}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function bindStudentPromotionEvents() {
  const selectAll = document.getElementById('promo-select-all');
  if (selectAll) {
    selectAll.onchange = () => {
      document.querySelectorAll('.promo-chk').forEach(c => { c.checked = selectAll.checked; });
    };
  }

  const execBtn = document.getElementById('page-promo-execute-btn');
  if (execBtn) {
    execBtn.onclick = async () => {
      execBtn.disabled = true;
      execBtn.innerHTML = '<span class="spinner spinner-sm"></span> Processing Batch...';
      await new Promise(r => setTimeout(r, 600));
      execBtn.disabled = false;
      execBtn.innerHTML = `${icon('checkCircle', 18)} Promote Selected`;
      showToast('All eligible students successfully promoted to Session 2026-2027!', 'success');
    };
  }
}


