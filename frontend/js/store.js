/**
 * Smart School — Reactive Local Storage & Data Store Engine
 * Infosof Technologies 2026
 * Provides robust CRUD persistence, modal utilities, and dynamic real-time reporting.
 */

window.canManage = function (allowedRoles = ['super_admin', 'admin']) {
  const user = (window.auth && typeof window.auth.getUser === 'function')
    ? window.auth.getUser()
    : (function () {
        try {
          const s = localStorage.getItem('user');
          if (s) return JSON.parse(s);
        } catch {}
        return { role: 'super_admin' };
      })();

  if (!user || !user.role) return false;
  const role = String(user.role).toLowerCase();
  // Super Admin and Admin always have unrestricted master access
  if (role === 'super_admin' || role === 'admin') return true;
  if (Array.isArray(allowedRoles)) {
    return allowedRoles.map(r => String(r).toLowerCase()).includes(role);
  }
  return role === String(allowedRoles).toLowerCase();
};

(function () {
  const STORAGE_KEY = 'smart_school_store_v2026';

  const defaultData = {
    classes: [
      { id: 1, name: 'Class 1', numeric: 1, section: 'A, B', class_teacher: 'Ms. Pooja Sen', students_count: 52, tuition_fee: 10500 },
      { id: 2, name: 'Class 2', numeric: 2, section: 'A, B', class_teacher: 'Mr. Arvind Roy', students_count: 48, tuition_fee: 11000 },
      { id: 3, name: 'Class 3', numeric: 3, section: 'A, B, C', class_teacher: 'Mrs. Neha Kapoor', students_count: 65, tuition_fee: 11500 },
      { id: 4, name: 'Class 4', numeric: 4, section: 'A, B', class_teacher: 'Mr. Suresh Kumar', students_count: 50, tuition_fee: 12000 },
      { id: 5, name: 'Class 5', numeric: 5, section: 'A, B', class_teacher: 'Mrs. Anjali Deshmukh', students_count: 56, tuition_fee: 12500 },
      { id: 6, name: 'Class 6', numeric: 6, section: 'A, B, C', class_teacher: 'Mr. Manoj Verma', students_count: 72, tuition_fee: 13000 },
      { id: 7, name: 'Class 7', numeric: 7, section: 'A, B', class_teacher: 'Ms. Rekha Rao', students_count: 54, tuition_fee: 13500 },
      { id: 8, name: 'Class 8', numeric: 8, section: 'A, B', class_teacher: 'Mr. Deepak Sharma', students_count: 50, tuition_fee: 14000 },
      { id: 9, name: 'Class 9', numeric: 9, section: 'A, B, C', class_teacher: 'Mr. Rajesh Pandey', students_count: 68, tuition_fee: 15000 },
      { id: 10, name: 'Class 10', numeric: 10, section: 'A, B', class_teacher: 'Mrs. Suman Ghosh', students_count: 60, tuition_fee: 16500 },
      { id: 11, name: 'Class 11', numeric: 11, section: 'Science, Commerce, Arts', class_teacher: 'Dr. Vivek Saxena', students_count: 85, tuition_fee: 18500 },
      { id: 12, name: 'Class 12', numeric: 12, section: 'Science, Commerce, Arts', class_teacher: 'Dr. Meenakshi Iyer', students_count: 80, tuition_fee: 20000 },
    ],

    subjects: [
      { id: 1, name: 'Mathematics', code: 'MATH101', type: 'Theory', class_name: 'Class 1 to 10', teacher_name: 'Mr. Rajesh Pandey' },
      { id: 2, name: 'Physics', code: 'PHY201', type: 'Theory + Practical', class_name: 'Class 9 to 12', teacher_name: 'Dr. Vivek Saxena' },
      { id: 3, name: 'Chemistry', code: 'CHEM201', type: 'Theory + Practical', class_name: 'Class 9 to 12', teacher_name: 'Dr. Meenakshi Iyer' },
      { id: 4, name: 'Computer Science & AI', code: 'CS301', type: 'Practical & Lab', class_name: 'Class 6 to 12', teacher_name: 'Mr. Deepak Sharma' },
      { id: 5, name: 'English Literature', code: 'ENG101', type: 'Theory', class_name: 'All Classes', teacher_name: 'Mrs. Suman Ghosh' },
      { id: 6, name: 'Social Studies', code: 'SST101', type: 'Theory', class_name: 'Class 6 to 10', teacher_name: 'Mrs. Anjali Deshmukh' },
      { id: 7, name: 'Biology', code: 'BIO201', type: 'Theory + Practical', class_name: 'Class 9 to 12', teacher_name: 'Ms. Rekha Rao' },
      { id: 8, name: 'Robotics & Innovation', code: 'ROB401', type: 'STEM Lab', class_name: 'Class 4 to 10', teacher_name: 'Mr. Arvind Roy' },
    ],

    routes: [
      {
        id: 1,
        route_title: 'Route 01: North Kolkata — Shyambazar & Dum Dum Express',
        vehicle_no: 'WB-02-EA-4521',
        vehicle_type: 'School Bus (42 Seater)',
        driver_name: 'Mr. Ramesh Ghosh',
        driver_phone: '+91 98765 43211',
        stops: 'Shyambazar Five Point, Dum Dum Metro, Nagerbazar, School Campus Gate 1',
        fare: 2200,
        student_count: 38,
      },
      {
        id: 2,
        route_title: 'Route 02: South Kolkata — Ballygunge & Gariahat Loop',
        vehicle_no: 'WB-02-EA-6890',
        vehicle_type: 'School Bus (42 Seater)',
        driver_name: 'Mr. Subhash Mondal',
        driver_phone: '+91 98765 43212',
        stops: 'Gariahat Crossing, Ballygunge Phari, Golpark, Jodhpur Park, School Campus Gate 2',
        fare: 2600,
        student_count: 40,
      },
      {
        id: 3,
        route_title: 'Route 03: East Corridor — Salt Lake Sector V & New Town Express',
        vehicle_no: 'WB-04-EB-1204',
        vehicle_type: 'Mini Bus (26 Seater)',
        driver_name: 'Mr. Gurpreet Sandhu',
        driver_phone: '+91 98765 43213',
        stops: 'Karunamoyee, Salt Lake Sector V, City Centre 1, New Town Action Area 1, Campus Gate 1',
        fare: 2400,
        student_count: 24,
      },
      {
        id: 4,
        route_title: 'Route 04: Central & South-West — Alipore & Behala Chowrasta',
        vehicle_no: 'WB-01-EB-3310',
        vehicle_type: 'School Bus (42 Seater)',
        driver_name: 'Mr. Sanjoy Chatterjee',
        driver_phone: '+91 98765 43214',
        stops: 'Behala Chowrasta, Taratala, Alipore Zoo Crossing, Park Street, Campus',
        fare: 2500,
        student_count: 36,
      },
      {
        id: 5,
        route_title: 'Route 05: Howrah Link — Mandirtala & Shibpur Express',
        vehicle_no: 'WB-12-EC-8842',
        vehicle_type: 'Force Traveller Van (16 Seater)',
        driver_name: 'Mr. Mohan Lal Roy',
        driver_phone: '+91 98765 43215',
        stops: 'Howrah Station, Nabanna Mandirtala, Shibpur Tram Depot, Vidyasagar Setu, Campus',
        fare: 2800,
        student_count: 15,
      },
    ],

    hostels: [
      { id: 1, name: 'Tagore Boys Hostel (Block A)', type: 'Boys', warden: 'Mr. Arvind Roy', rooms_count: 30, capacity: 90, occupied: 2 },
      { id: 2, name: 'Sarojini Girls Hostel (Block B)', type: 'Girls', warden: 'Mrs. Suman Ghosh', rooms_count: 25, capacity: 75, occupied: 1 },
      { id: 3, name: 'Vidyasagar Scholars House (Block C)', type: 'Co-Ed / Senior', warden: 'Dr. Vivek Saxena', rooms_count: 20, capacity: 40, occupied: 0 },
    ],

    hostel_allocations: [
      { id: 1, student_id: 1, hostel_id: 1, room_no: 'Room A-101', room_type: 'Double Sharing', join_date: '2026-08-01', first_name: 'Aarav', last_name: 'Sharma', admission_no: 'SS2025001', roll_no: '101', class_name: 'Class 10', gender: 'Male', hostel_name: 'Tagore Boys Hostel (Block A)', hostel_type: 'Boys' },
      { id: 2, student_id: 3, hostel_id: 1, room_no: 'Room A-102', room_type: 'Double Sharing', join_date: '2026-08-05', first_name: 'Rohan', last_name: 'Verma', admission_no: 'SS2025003', roll_no: '903', class_name: 'Class 9', gender: 'Male', hostel_name: 'Tagore Boys Hostel (Block A)', hostel_type: 'Boys' },
      { id: 3, student_id: 2, hostel_id: 2, room_no: 'Room B-201', room_type: 'Single Occupancy', join_date: '2026-08-10', first_name: 'Ananya', last_name: 'Sharma', admission_no: 'SS2025002', roll_no: '802', class_name: 'Class 8', gender: 'Female', hostel_name: 'Sarojini Girls Hostel (Block B)', hostel_type: 'Girls' },
    ],

    books: [
      { id: 1, title: 'Concepts of Physics (Vol 1 & 2)', author: 'Dr. H.C. Verma', isbn: '978-8177091878', category: 'Science / Physics', qty: 25, available: 18, rack: 'Rack B-04' },
      { id: 2, title: 'Mathematics for Class 10 (CBSE)', author: 'R.D. Sharma', isbn: '978-9389975000', category: 'Mathematics', qty: 30, available: 22, rack: 'Rack A-01' },
      { id: 3, title: 'Oxford Advanced Learner Dictionary (10th Ed)', author: 'A.S. Hornby', isbn: '978-0194798488', category: 'Language & Reference', qty: 15, available: 12, rack: 'Rack C-02' },
      { id: 4, title: 'Computer Science with Python', author: 'Sumita Arora', isbn: '978-9389189285', category: 'Computer Science', qty: 20, available: 16, rack: 'Rack D-05' },
      { id: 5, title: 'NCERT Exemplar Problems in Biology', author: 'NCERT Editorial Board', isbn: '978-8174507000', category: 'Science / Biology', qty: 18, available: 14, rack: 'Rack B-08' },
    ],

    staff: [
      { id: 1, name: 'Dr. Vivek Saxena', role: 'Head of Senior Wing & Physics', department: 'Science', email: 'v.saxena@smartschool.edu', phone: '+91 98110 22331', salary: 78000, status: 'Active' },
      { id: 2, name: 'Mrs. Suman Ghosh', role: 'Senior English Faculty', department: 'Languages', email: 's.ghosh@smartschool.edu', phone: '+91 98110 22332', salary: 65000, status: 'Active' },
      { id: 3, name: 'Mr. Deepak Sharma', role: 'Lead Computer & AI Instructor', department: 'Computer Science', email: 'd.sharma@smartschool.edu', phone: '+91 98110 22333', salary: 62000, status: 'Active' },
      { id: 4, name: 'Mr. Arvind Roy', role: 'Mathematics & Activity Head', department: 'Mathematics', email: 'a.roy@smartschool.edu', phone: '+91 98110 22334', salary: 60000, status: 'Active' },
      { id: 5, name: 'Mrs. Sunita Verma', role: 'Chief Accounts Officer', department: 'Accounts & Finance', email: 'accounts@smartschool.edu', phone: '+91 98110 22335', salary: 55000, status: 'Active' },
    ],

    students: [
      { id: 1, name: 'Aarav Sharma', admission_no: 'SS2025001', roll_no: '101', class_name: 'Class 10', section: 'A', gender: 'Male', dob: '2010-05-15', category: 'General', rte: 'No', phone: '+91 98765 43210', fee_status: 'Paid', attendance_pct: 94.8 },
      { id: 2, name: 'Ananya Sharma', admission_no: 'SS2025002', roll_no: '802', class_name: 'Class 8', section: 'B', gender: 'Female', dob: '2012-09-21', category: 'General', rte: 'No', phone: '+91 98765 43210', fee_status: 'Paid', attendance_pct: 96.2, sibling_id: 1 },
      { id: 3, name: 'Rohan Verma', admission_no: 'SS2025003', roll_no: '903', class_name: 'Class 9', section: 'C', gender: 'Male', dob: '2011-03-11', category: 'OBC', rte: 'No', phone: '+91 98765 88990', fee_status: 'Pending', attendance_pct: 88.5 },
      { id: 4, name: 'Priya Kumari', admission_no: 'SS2025004', roll_no: '104', class_name: 'Class 1', section: 'A', gender: 'Female', dob: '2019-07-04', category: 'SC', rte: 'Yes', phone: '+91 98765 11223', fee_status: 'Paid', attendance_pct: 98.0 },
      { id: 5, name: 'Kabir Patel', admission_no: 'SS2025005', roll_no: '1105', class_name: 'Class 11', section: 'Science', gender: 'Male', dob: '2009-12-18', category: 'General', rte: 'No', phone: '+91 98765 99881', fee_status: 'Paid', attendance_pct: 92.4 },
      { id: 6, name: 'Sneha Deshmukh', admission_no: 'SS2025006', roll_no: '606', class_name: 'Class 6', section: 'B', gender: 'Female', dob: '2014-04-29', category: 'OBC', rte: 'No', phone: '+91 98765 44556', fee_status: 'Pending', attendance_pct: 91.0 },
    ],

    transactions: [
      { id: 1, type: 'Income', head: 'Tuition Fee Collection (Term 1)', amount: 485000, date: '2026-09-15', ref_no: 'TXN-INC-20260901', description: 'Batch quarterly tuition fee collections' },
      { id: 2, type: 'Income', head: 'School Transport Route Fees', amount: 125000, date: '2026-09-18', ref_no: 'TXN-INC-20260902', description: 'Transport subscription charges Term 1' },
      { id: 3, type: 'Expense', head: 'Faculty & Administrative Payroll', amount: 320000, date: '2026-09-01', ref_no: 'TXN-EXP-20260901', description: 'Monthly staff remuneration & allowances' },
      { id: 4, type: 'Expense', head: 'Laboratory Consumables & STEM Kits', amount: 45000, date: '2026-09-10', ref_no: 'TXN-EXP-20260902', description: 'Robotics kits and Chemistry lab supplies' },
      { id: 5, type: 'Expense', head: 'Campus Electricity & Water Utilities', amount: 38500, date: '2026-09-20', ref_no: 'TXN-EXP-20260903', description: 'Solar grid maintenance & power utility bills' },
    ],

    notices: [
      { id: 1, title: 'Annual Inter-School STEM & Robotics Exhibition 2026', category: 'Academic Event', target: 'All Students & Parents', content: 'We are pleased to invite all students and parents to the Annual STEM Showcase on Saturday, 10th October.', date: '2026-09-25', priority: 'High' },
      { id: 2, title: 'Advisory on Monsoon School Bus Route Timings', category: 'Transport', target: 'Parents & Drivers', content: 'Due to ongoing road maintenance near EM Bypass, Routes 01 and 04 will commence 10 minutes earlier than scheduled.', date: '2026-09-24', priority: 'Medium' },
      { id: 3, title: 'CBSE Term 1 Examination Admit Cards Released', category: 'Examinations', target: 'Class 9 to 12', content: 'Admit cards for upcoming term assessments are now live on the student and parent portals.', date: '2026-09-22', priority: 'High' },
    ],

    calendar_events: [
      { id: 1, title: 'Mid-Term Board Assessment Week', date: '12 Oct – 19 Oct 2026', type: 'Examination', description: 'Comprehensive CBSE curriculum evaluations' },
      { id: 2, title: 'Diwali Festive Holiday & Break', date: '30 Oct – 04 Nov 2026', type: 'Holiday', description: 'School administrative and academic closure' },
      { id: 3, title: 'Parent-Teacher Conference (PTM Term 1)', date: '15 Nov 2026', type: 'PTM', description: 'Individual academic report card review meetings' },
      { id: 4, title: 'Annual Athletics & Sports Meet', date: '05 Dec – 07 Dec 2026', type: 'Sports', description: 'Inter-house athletic track events and trophy presentation' },
    ],

    downloads: [
      { id: 1, title: 'CBSE Class 10 Board Curriculum & Blueprint 2026-27', type: 'Syllabus', class_name: 'Class 10', file_size: '2.4 MB', date: '2026-09-10' },
      { id: 2, title: 'Physics Senior Laboratory Manual & Experiment Records', type: 'Study Material', class_name: 'Class 11 & 12', file_size: '4.8 MB', date: '2026-09-12' },
      { id: 3, title: 'Mathematics Weekly Problem Set & Revision Worksheet #04', type: 'Assignment', class_name: 'Class 9', file_size: '1.1 MB', date: '2026-09-20' },
      { id: 4, title: 'Python Programming Primer & Algorithm Guide for Students', type: 'Resource', class_name: 'Class 8 to 12', file_size: '3.2 MB', date: '2026-09-18' },
    ],

    live_classes: [
      { id: 1, title: 'Electromagnetism & Wave Optics — Advanced Theory', subject: 'Physics', class_name: 'Class 12-A', time: '10:00 AM – 11:15 AM', platform: 'Google Meet', link: 'https://meet.google.com/xyz-smart-school', status: 'Live Now', teacher: 'Dr. Vivek Saxena' },
      { id: 2, title: 'Quadratic Equations & Polynomial Proofs Workshop', subject: 'Mathematics', class_name: 'Class 10-B', time: '02:00 PM – 03:00 PM', platform: 'Zoom Live', link: 'https://zoom.us/j/9876543210', status: 'Scheduled', teacher: 'Mr. Rajesh Pandey' },
      { id: 3, title: 'Python Object-Oriented Structures & Machine Learning', subject: 'Computer Science', class_name: 'Class 11-Sci', time: '04:00 PM – 05:00 PM', platform: 'Google Meet', link: 'https://meet.google.com/abc-py-class', status: 'Scheduled', teacher: 'Mr. Deepak Sharma' },
    ],
  };

  class Store {
    constructor() {
      this.listeners = [];
      this.data = this.load();
    }

    load() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Auto-migrate any legacy Delhi dummy routes/hostels to Kolkata
          if (parsed && parsed.routes && parsed.routes[0] && String(parsed.routes[0].vehicle_no).includes('DL-')) {
            parsed.routes = defaultData.routes;
            parsed.hostels = defaultData.hostels;
            this.save({ ...defaultData, ...parsed });
          }
          if (!parsed.hostel_allocations || !Array.isArray(parsed.hostel_allocations) || parsed.hostel_allocations.length === 0) {
            parsed.hostel_allocations = defaultData.hostel_allocations;
            this.save({ ...defaultData, ...parsed });
          }
          return { ...defaultData, ...parsed };
        }
      } catch (e) {
        console.warn('Store load failed, using defaults', e);
      }
      this.save(defaultData);
      return JSON.parse(JSON.stringify(defaultData));
    }

    save(customData = null) {
      try {
        const payload = customData || this.data;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        this.notify();
      } catch (e) {
        console.error('Failed to save to localStorage', e);
      }
    }

    get(collection) {
      return this.data[collection] || [];
    }

    find(collection, id) {
      const list = this.get(collection);
      return list.find((item) => String(item.id) === String(id)) || null;
    }

    add(collection, item) {
      if (!this.data[collection]) {
        this.data[collection] = [];
      }
      const newItem = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        ...item,
      };
      this.data[collection].unshift(newItem);
      this.save();
      return newItem;
    }

    update(collection, id, updates) {
      const list = this.get(collection);
      const index = list.findIndex((item) => String(item.id) === String(id));
      if (index !== -1) {
        this.data[collection][index] = { ...this.data[collection][index], ...updates };
        this.save();
        return this.data[collection][index];
      }
      return null;
    }

    delete(collection, id) {
      const list = this.get(collection);
      this.data[collection] = list.filter((item) => String(item.id) !== String(id));
      this.save();
      return true;
    }

    subscribe(fn) {
      this.listeners.push(fn);
    }

    notify() {
      this.listeners.forEach((fn) => {
        try {
          fn(this.data);
        } catch (e) {
          console.error('Listener error', e);
        }
      });
    }

    reset() {
      this.data = JSON.parse(JSON.stringify(defaultData));
      this.save();
    }
  }

  // Global Store Instance
  window.SS_STORE = new Store();

  /**
   * Modal Utility: Replaces prompt() and alert() with rich, modern modals
   */
  window.openAppModal = function ({
    title,
    subtitle = '',
    contentHtml = '',
    onSave = null,
    saveLabel = 'Save Changes',
    saveIcon = 'checkCircle',
    size = 'md',
  }) {
    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) return;

    modalRoot.innerHTML = `
      <div class="modal-backdrop" id="app-modal-backdrop">
        <div class="modal-dialog modal-${size}" style="animation: scaleUp 0.18s cubic-bezier(0.16, 1, 0.3, 1);">
          <div class="modal-header">
            <div>
              <span class="modal-title">${title}</span>
              ${subtitle ? `<div class="text-xs text-secondary mt-1">${subtitle}</div>` : ''}
            </div>
            <button class="modal-close" id="app-modal-close-x">&times;</button>
          </div>
          <div class="modal-body" style="padding: 24px; max-height: 75vh; overflow-y: auto;">
            ${contentHtml}
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="app-modal-cancel-btn">Cancel</button>
            ${onSave ? `
              <button class="btn btn-primary" id="app-modal-save-btn">
                ${window.icon ? window.icon(saveIcon, 16) : ''} ${saveLabel}
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    const closeModal = () => {
      modalRoot.innerHTML = '';
    };

    document.getElementById('app-modal-close-x').onclick = closeModal;
    document.getElementById('app-modal-cancel-btn').onclick = closeModal;

    const backdrop = document.getElementById('app-modal-backdrop');
    if (backdrop) {
      backdrop.onclick = (e) => {
        if (e.target === backdrop) closeModal();
      };
    }

    const saveBtn = document.getElementById('app-modal-save-btn');
    if (saveBtn && onSave) {
      saveBtn.onclick = async () => {
        saveBtn.disabled = true;
        saveBtn.innerHTML = 'Saving...';
        try {
          const res = await onSave(closeModal);
          if (res !== false) {
            closeModal();
          }
        } catch (err) {
          console.error(err);
          if (window.showToast) window.showToast(err.message || 'Operation failed', 'error');
        } finally {
          if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = `${window.icon ? window.icon(saveIcon, 16) : ''} ${saveLabel}`;
          }
        }
      };
    }
  };

  /**
   * Real Working CSV File Exporter: Downloads genuine .csv files
   */
  window.downloadCsvReport = function (filename, headers, rows) {
    if (!rows || rows.length === 0) {
      if (window.showToast) window.showToast('No records available to export', 'warning');
      return;
    }

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headerLine = headers.map(escapeCsv).join(',');
    const dataLines = rows.map((row) => row.map(escapeCsv).join(','));
    const csvContent = [headerLine, ...dataLines].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (window.showToast) {
      window.showToast(`CSV file "${filename}.csv" downloaded successfully!`, 'success');
    }
  };

  window.closeModal = function() {
    const modalRoot = document.getElementById('modal-root');
    if (modalRoot) modalRoot.innerHTML = '';
  };

  window.showModal = function({ title, content, subtitle = '', size = 'md' }) {
    const modalRoot = document.getElementById('modal-root');
    if (!modalRoot) return;
    modalRoot.innerHTML = `
      <div class="modal-backdrop" id="app-dynamic-modal-backdrop" style="position:fixed; inset:0; z-index:9999; background:rgba(15,23,42,0.65); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; padding:16px;">
        <div class="modal-dialog modal-${size}" style="background:var(--bg-card, #ffffff); color:var(--text-primary, #1e293b); border:1px solid var(--border-secondary, #e2e8f0); border-radius:var(--radius-lg, 12px); box-shadow:var(--shadow-xl, 0 20px 25px -5px rgba(0,0,0,0.1)); max-width:600px; width:100%; overflow:hidden; animation:scaleUp 0.18s cubic-bezier(0.16,1,0.3,1);">
          <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; padding:18px 24px; border-bottom:1px solid var(--border-secondary, #e2e8f0);">
            <div>
              <span class="modal-title" style="font-weight:700; font-size:1.1rem; color:var(--text-primary);">${title}</span>
              ${subtitle ? `<div class="text-xs text-secondary mt-1">${subtitle}</div>` : ''}
            </div>
            <button class="modal-close" id="app-dynamic-modal-close-x" style="background:none; border:none; font-size:1.6rem; cursor:pointer; color:var(--text-secondary); line-height:1;" title="Close">&times;</button>
          </div>
          <div class="modal-body" style="padding:24px; max-height:75vh; overflow-y:auto;">
            ${content}
          </div>
        </div>
      </div>
    `;
    const closeBtn = document.getElementById('app-dynamic-modal-close-x');
    if (closeBtn) closeBtn.onclick = window.closeModal;
    const backdrop = document.getElementById('app-dynamic-modal-backdrop');
    if (backdrop) {
      backdrop.onclick = (e) => {
        if (e.target === backdrop) window.closeModal();
      };
    }
  };
})();

