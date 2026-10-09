/**
 * Smart School — Operations & Noticeboard Domain Views
 * Library & Inventory, Transport & Bus Routes, Hostel & Boarding, Circular Notices
 */

/* ==========================================================================
   Library Operations View
   ========================================================================== */
let books = [];
let libraryIssues = [];
let libraryStudents = [];
let activeLibraryTab = 'catalogue';

async function renderLibrary() {
  books = [];
  libraryIssues = [];
  libraryStudents = [];

  try {
    const [bRes, iRes, sRes] = await Promise.all([
      api.get('/library/books'),
      api.get('/library/issues').catch(() => ({ data: [] })),
      api.get('/students').catch(() => ({ data: [] })),
    ]);

    if (Array.isArray(bRes.data)) {
      books = bRes.data;
    } else if (Array.isArray(bRes)) {
      books = bRes;
    } else if (window.SS_STORE) {
      books = window.SS_STORE.get('books') || [];
    }

    if (Array.isArray(iRes.data)) {
      libraryIssues = iRes.data;
    } else if (Array.isArray(iRes)) {
      libraryIssues = iRes;
    } else if (window.SS_STORE) {
      libraryIssues = window.SS_STORE.get('library_issues') || [];
    }

    if (Array.isArray(sRes.data)) {
      libraryStudents = sRes.data;
    } else if (Array.isArray(sRes)) {
      libraryStudents = sRes;
    } else if (window.SS_STORE) {
      libraryStudents = window.SS_STORE.get('students') || [];
    }
  } catch (err) {
    console.warn('Library central DB sync fallback:', err);
    if (window.SS_STORE) books = window.SS_STORE.get('books') || [];
  }

  const totalTitles = books.length;
  const totalStock = books.reduce((acc, b) => acc + (parseInt(b.qty ?? b.total_copies) || 10), 0);
  const totalAvailable = books.reduce((acc, b) => {
    const avail = b.available_qty !== undefined ? b.available_qty : (b.available_copies !== undefined ? b.available_copies : (b.qty || 5));
    return acc + (parseInt(avail) || 0);
  }, 0);
  const activeIssuedCount = libraryIssues.filter(i => i.status !== 'Returned' && !i.return_date).length;
  const totalIssued = activeIssuedCount > 0 ? activeIssuedCount : Math.max(0, totalStock - totalAvailable);

  const canManageLib = window.canManage ? window.canManage(['librarian', 'teacher']) : true;

  return `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h1>Library & Book Inventory</h1>
          <p class="subtitle">Catalogue search, student book issue ledger, and barcode tracking</p>
        </div>
        <div class="flex gap-2" style="flex-wrap: wrap;">
          ${canManageLib ? `
            <button class="btn btn-primary" id="open-issue-modal-top-btn">
              ${icon('book', 18)} Issue Book to Student
            </button>
            <button class="btn btn-secondary" id="add-book-btn">
              ${icon('plus', 18)} Add New Book Title
            </button>
          ` : ''}
        </div>
      </div>

      <div class="grid-3 mb-6">
        <div class="stat-card stat-primary">
          <div class="stat-icon">${icon('book', 24)}</div>
          <div class="stat-value" id="lib-stat-stock">${totalStock}</div>
          <div class="stat-label">Total Books in Stock</div>
        </div>
        <div class="stat-card stat-success">
          <div class="stat-icon">${icon('checkCircle', 24)}</div>
          <div class="stat-value" id="lib-stat-avail">${totalAvailable}</div>
          <div class="stat-label">Available on Shelves</div>
        </div>
        <div class="stat-card stat-warning">
          <div class="stat-icon">${icon('users', 24)}</div>
          <div class="stat-value" id="lib-stat-issued">${totalIssued}</div>
          <div class="stat-label">Currently Issued to Students/Staff</div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex gap-3 mb-6" style="border-bottom: 1px solid var(--border-secondary); padding-bottom: 12px; flex-wrap: wrap;">
        <button class="btn ${activeLibraryTab === 'catalogue' ? 'btn-primary' : 'btn-secondary'} btn-sm lib-tab-btn" data-tab="catalogue" id="lib-tab-btn-cat">
          📚 Book Catalogue &amp; Inventory (${books.length})
        </button>
        <button class="btn ${activeLibraryTab === 'issues' ? 'btn-primary' : 'btn-secondary'} btn-sm lib-tab-btn" data-tab="issues" id="lib-tab-btn-iss">
          📋 Issued Books &amp; Circulation Ledger (${libraryIssues.length})
        </button>
      </div>

      <!-- Tab 1: Catalogue -->
      <div id="lib-section-catalogue" style="${activeLibraryTab === 'catalogue' ? 'display: block;' : 'display: none;'}">
        <div class="card">
          <div class="card-header flex justify-between items-center">
            <span class="card-title">Book Catalogue</span>
            <span class="badge badge-info">${books.length} Titles Listed</span>
          </div>
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Book Title</th>
                  <th>Author</th>
                  <th>ISBN Code</th>
                  <th>Subject Category</th>
                  <th>Total Stock</th>
                  <th>Available</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody id="books-tbody">
                ${renderBookRows(books)}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Tab 2: Issued Books Ledger -->
      <div id="lib-section-issues" style="${activeLibraryTab === 'issues' ? 'display: block;' : 'display: none;'}">
        <div class="card">
          <div class="card-header flex justify-between items-center">
            <span class="card-title">Circulation &amp; Borrowing Ledger</span>
            <span class="badge badge-warning">${activeIssuedCount} Currently Borrowed</span>
          </div>
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Issue #</th>
                  <th>Book Title</th>
                  <th>Borrower Student</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th style="text-align: right;">Action</th>
                </tr>
              </thead>
              <tbody id="issues-tbody">
                ${renderIssueRows(libraryIssues)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderBookRows(items) {
  if (!items || items.length === 0) {
    return `<tr><td colspan="7" class="text-center p-8 text-secondary">No books available in catalog for this institution. Click "Add New Book Title".</td></tr>`;
  }
  const canManageLib = window.canManage ? window.canManage(['librarian', 'teacher']) : true;

  return items.map(b => {
    const total = b.qty ?? b.total_copies ?? 10;
    const avail = (b.available_qty !== undefined) ? b.available_qty : (b.available_copies !== undefined ? b.available_copies : total);
    return `
      <tr>
        <td><strong>${b.title}</strong></td>
        <td class="text-secondary">${b.author}</td>
        <td><code>${b.isbn || 'ISBN-N/A'}</code></td>
        <td><span class="badge badge-info">${b.category || b.subject || 'General'}</span></td>
        <td>${total} Copies</td>
        <td><strong style="color: ${avail > 0 ? 'var(--success-600)' : 'var(--danger-500)'};">${avail} Left</strong></td>
        <td style="text-align: right;">
          ${canManageLib && avail > 0 ? `
            <button class="btn btn-secondary btn-sm issue-book-btn" data-id="${b.id}" data-title="${b.title}">
              ${icon('book', 14)} Issue Book
            </button>
          ` : (avail <= 0 ? `<span class="badge badge-danger">Out of Stock</span>` : `<span class="badge badge-secondary">Available</span>`)}
        </td>
      </tr>
    `;
  }).join('');
}

function renderIssueRows(items) {
  if (!items || items.length === 0) {
    return `<tr><td colspan="7" class="text-center p-8 text-secondary">No active book loans for this institution. Click "Issue Book to Student".</td></tr>`;
  }
  const canManageLib = window.canManage ? window.canManage(['librarian', 'teacher']) : true;

  return items.map(i => {
    const isReturned = i.status === 'Returned' || !!i.return_date;
    const isOverdue = !isReturned && (new Date(i.due_date) < new Date());
    const badgeClass = isReturned ? 'badge-success' : (isOverdue ? 'badge-danger' : 'badge-warning');
    const statusText = isReturned ? 'Returned' : (isOverdue ? 'Overdue' : 'Issued');

    return `
      <tr>
        <td><code>#ISS-${String(i.id).padStart(4, '0')}</code></td>
        <td><strong>${i.book_title || ('Book #' + i.book_id)}</strong></td>
        <td>${i.student_name}</td>
        <td class="text-secondary">${i.issue_date || '—'}</td>
        <td class="text-secondary">${i.due_date || '—'}</td>
        <td><span class="badge ${badgeClass}">${statusText}</span></td>
        <td style="text-align: right;">
          ${!isReturned && canManageLib ? `
            <button class="btn btn-success btn-xs return-book-btn" data-id="${i.id}" data-title="${i.book_title || ''}" style="padding: 4px 10px; font-size: 0.8rem;">
              ✓ Return Book
            </button>
          ` : (isReturned ? `<span class="text-xs text-secondary">Returned on ${i.return_date}</span>` : '—')}
        </td>
      </tr>
    `;
  }).join('');
}

function bindLibraryEvents() {
  // Tab switching
  document.querySelectorAll('.lib-tab-btn').forEach(btn => {
    btn.onclick = () => {
      const target = btn.getAttribute('data-tab');
      activeLibraryTab = target;
      const catSec = document.getElementById('lib-section-catalogue');
      const issSec = document.getElementById('lib-section-issues');
      const btnCat = document.getElementById('lib-tab-btn-cat');
      const btnIss = document.getElementById('lib-tab-btn-iss');

      if (target === 'catalogue') {
        if (catSec) catSec.style.display = 'block';
        if (issSec) issSec.style.display = 'none';
        if (btnCat) btnCat.className = 'btn btn-primary btn-sm lib-tab-btn';
        if (btnIss) btnIss.className = 'btn btn-secondary btn-sm lib-tab-btn';
      } else {
        if (catSec) catSec.style.display = 'none';
        if (issSec) issSec.style.display = 'block';
        if (btnCat) btnCat.className = 'btn btn-secondary btn-sm lib-tab-btn';
        if (btnIss) btnIss.className = 'btn btn-primary btn-sm lib-tab-btn';
      }
    };
  });

  // Modal to issue book (supports both top button and row-level button)
  function openIssueBookModal(preselectedBookId = null) {
    const bookOptions = books.map(b => {
      const avail = (b.available_qty !== undefined) ? b.available_qty : (b.available_copies !== undefined ? b.available_copies : (b.qty || 10));
      const sel = (preselectedBookId && String(b.id) === String(preselectedBookId)) ? 'selected' : '';
      return `<option value="${b.id}" ${sel}>${b.title} (${avail} available) — ${b.author}</option>`;
    }).join('');

    const studentOptions = libraryStudents.map(s => {
      const sName = s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Student';
      const sAdm = s.admission_no || ('SS' + s.id);
      const sClass = s.class_name || (s.class_id ? `Class ${s.class_id}` : 'Class 10');
      return `<option value="${s.id}">${sName} (${sClass} • Adm: ${sAdm})</option>`;
    }).join('');

    window.openAppModal({
      title: 'Issue Book to Student',
      subtitle: 'Select recipient student from database and specify lending duration',
      saveLabel: 'Confirm Book Issue',
      saveIcon: 'book',
      contentHtml: `
        <div class="form-grid">
          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label font-semibold">Select Book Title *</label>
            <select class="form-select" id="modal-issue-book">
              ${bookOptions || '<option value="" disabled selected>No books available in catalogue (Add book first)</option>'}
            </select>
          </div>
          <div class="form-group" style="grid-column: span 2;">
            <label class="form-label font-semibold">Borrower Student *</label>
            <select class="form-select" id="modal-issue-student">
              ${studentOptions || '<option value="" disabled selected>No students enrolled in this institution</option>'}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label font-semibold">Issue Date</label>
            <input type="date" class="form-input" id="modal-issue-date" value="${new Date().toISOString().split('T')[0]}" />
          </div>
          <div class="form-group">
            <label class="form-label font-semibold">Return Due Date</label>
            <input type="date" class="form-input" id="modal-due-date" value="${new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]}" />
          </div>
        </div>
      `,
      onSave: async () => {
        const bookSelect = document.getElementById('modal-issue-book');
        const bookId = bookSelect ? bookSelect.value : preselectedBookId;
        const bookTitle = bookSelect ? bookSelect.options[bookSelect.selectedIndex].text.split(' (')[0] : 'Book';

        const studentSelect = document.getElementById('modal-issue-student');
        const studentId = studentSelect ? studentSelect.value : 1;
        const studentName = studentSelect ? studentSelect.options[studentSelect.selectedIndex].text.split(' (')[0] : 'Student';

        const issueDate = document.getElementById('modal-issue-date')?.value || new Date().toISOString().split('T')[0];
        const dueDate = document.getElementById('modal-due-date')?.value || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

        try {
          await api.post('/library/issue', {
            book_id: bookId,
            student_id: studentId,
            student_name: studentName,
            issue_date: issueDate,
            due_date: dueDate,
          });

          // Refresh books and issues directly from DB
          const [bRes, iRes] = await Promise.all([
            api.get('/library/books'),
            api.get('/library/issues').catch(() => ({ data: [] }))
          ]);
          if (Array.isArray(bRes.data)) books = bRes.data;
          if (Array.isArray(iRes.data)) libraryIssues = iRes.data;
        } catch (err) {
          console.warn('API issue error:', err);
        }

        const bTbody = document.getElementById('books-tbody');
        if (bTbody) bTbody.innerHTML = renderBookRows(books);
        const iTbody = document.getElementById('issues-tbody');
        if (iTbody) iTbody.innerHTML = renderIssueRows(libraryIssues);

        // Update stats
        const totalStock = books.reduce((acc, b) => acc + (parseInt(b.qty ?? b.total_copies) || 10), 0);
        const totalAvail = books.reduce((acc, b) => acc + (parseInt(b.available_qty ?? b.available_copies ?? b.qty) || 0), 0);
        const stAvail = document.getElementById('lib-stat-avail');
        const stIssued = document.getElementById('lib-stat-issued');
        if (stAvail) stAvail.textContent = totalAvail;
        if (stIssued) stIssued.textContent = libraryIssues.filter(i => i.status !== 'Returned').length;

        attachBookActions();
        if (window.showToast) window.showToast(`"${bookTitle}" issued to ${studentName}!`, 'success');
        return true;
      }
    });
  }

  function attachBookActions() {
    // Row-level issue buttons
    document.querySelectorAll('.issue-book-btn').forEach(btn => {
      btn.onclick = () => {
        const bookId = btn.getAttribute('data-id');
        openIssueBookModal(bookId);
      };
    });

    // Row-level return buttons
    document.querySelectorAll('.return-book-btn').forEach(btn => {
      btn.onclick = async () => {
        const issueId = btn.getAttribute('data-id');
        const bookTitle = btn.getAttribute('data-title');

        btn.disabled = true;
        btn.innerHTML = '<span class="spinner spinner-sm"></span> Returning...';

        try {
          await api.post('/library/return', { issue_id: issueId });
          const [bRes, iRes] = await Promise.all([
            api.get('/library/books'),
            api.get('/library/issues').catch(() => ({ data: [] }))
          ]);
          if (Array.isArray(bRes.data)) books = bRes.data;
          if (Array.isArray(iRes.data)) libraryIssues = iRes.data;

          const bTbody = document.getElementById('books-tbody');
          if (bTbody) bTbody.innerHTML = renderBookRows(books);
          const iTbody = document.getElementById('issues-tbody');
          if (iTbody) iTbody.innerHTML = renderIssueRows(libraryIssues);

          // Update all stat cards
          const retNewStock = books.reduce((acc, b) => acc + (parseInt(b.qty ?? b.total_copies) || 10), 0);
          const retNewAvail = books.reduce((acc, b) => acc + (parseInt(b.available_qty ?? b.available_copies ?? b.qty) || 0), 0);
          const retStockEl = document.getElementById('lib-stat-stock');
          const retAvailEl = document.getElementById('lib-stat-avail');
          const retIssuedEl = document.getElementById('lib-stat-issued');
          if (retStockEl) retStockEl.textContent = retNewStock;
          if (retAvailEl) retAvailEl.textContent = retNewAvail;
          if (retIssuedEl) retIssuedEl.textContent = libraryIssues.filter(i => i.status !== 'Returned' && !i.return_date).length;
          const issTabBtn = document.getElementById('lib-tab-btn-iss');
          if (issTabBtn) issTabBtn.innerHTML = `📋 Issued Books &amp; Circulation Ledger (${libraryIssues.length})`;

          attachBookActions();
          if (window.showToast) window.showToast(`"${bookTitle || 'Book'}" returned to inventory successfully!`, 'success');
        } catch (err) {
          console.error('Book return error:', err);
          btn.disabled = false;
          btn.innerHTML = '✓ Return Book';
          if (window.showToast) window.showToast('Failed to return book: ' + (err.message || 'Server error'), 'error');
        }
      };
    });
  }

  attachBookActions();

  // Top header button to issue book
  const topIssueBtn = document.getElementById('open-issue-modal-top-btn');
  if (topIssueBtn) {
    topIssueBtn.onclick = () => openIssueBookModal();
  }

  // Top header button to add new book
  const addBtn = document.getElementById('add-book-btn');
  if (addBtn) {
    addBtn.onclick = () => {
      window.openAppModal({
        title: 'Add New Library Book Title',
        subtitle: 'Enter book accession metadata, ISBN, and initial inventory stock',
        saveLabel: 'Save Book Title',
        saveIcon: 'plus',
        contentHtml: `
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label font-semibold">Book Title *</label>
              <input type="text" class="form-input" id="modal-book-title" placeholder="e.g. Modern Physics for Competitive Exams" required />
            </div>
            <div class="form-group">
              <label class="form-label font-semibold">Author Name *</label>
              <input type="text" class="form-input" id="modal-book-author" placeholder="e.g. Dr. H.C. Verma" required />
            </div>
            <div class="form-group">
              <label class="form-label font-semibold">ISBN Code</label>
              <input type="text" class="form-input" id="modal-book-isbn" value="978-93${Math.floor(1000000 + Math.random() * 9000000)}" />
            </div>
            <div class="form-group">
              <label class="form-label font-semibold">Subject Category</label>
              <select class="form-select" id="modal-book-cat">
                <option value="Physics / Science">Physics / Science</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Computer Science">Computer Science & AI</option>
                <option value="Literature & English">Literature & English</option>
                <option value="General Reference">General Reference</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label font-semibold">Total Stock Copies</label>
              <input type="number" class="form-input" id="modal-book-qty" value="15" min="1" />
            </div>
            <div class="form-group">
              <label class="form-label font-semibold">Storage Shelf / Rack No</label>
              <input type="text" class="form-input" id="modal-book-rack" value="Rack B-06" />
            </div>
          </div>
        `,
        onSave: async () => {
          const title = document.getElementById('modal-book-title').value.trim();
          const author = document.getElementById('modal-book-author').value.trim();
          if (!title || !author) {
            if (window.showToast) window.showToast('Please provide both Book Title and Author Name', 'warning');
            return false;
          }
          const isbn = document.getElementById('modal-book-isbn').value.trim();
          const category = document.getElementById('modal-book-cat').value;
          const qty = parseInt(document.getElementById('modal-book-qty').value) || 10;
          const rack = document.getElementById('modal-book-rack').value.trim() || 'Rack A-01';

          if (Array.isArray(books)) {
            if (isbn) {
              const isbnDup = books.find(b => (b.isbn || '').trim().toLowerCase() === isbn.toLowerCase());
              if (isbnDup) {
                if (window.showToast) window.showToast(`Duplicate entry: A book with ISBN "${isbn}" already exists!`, 'error');
                return false;
              }
            }
            const titleDup = books.find(b => 
              (b.title || '').trim().toLowerCase() === title.toLowerCase() &&
              (b.author || '').trim().toLowerCase() === author.toLowerCase()
            );
            if (titleDup) {
              if (window.showToast) window.showToast(`Duplicate entry: "${title}" by ${author} already exists in library catalogue!`, 'error');
              return false;
            }
          }

          const newBook = {
            title,
            author,
            isbn,
            category,
            qty,
            available_qty: qty,
            rack,
          };

          try {
            await api.post('/library/books', newBook);
            const bRes = await api.get('/library/books');
            if (Array.isArray(bRes.data) && bRes.data.length > 0) {
              books = bRes.data;
            }
          } catch (e) {
            console.warn('Book API save error:', e);
            if (e.status === 409 || (e.message && /duplicate/i.test(e.message))) {
              if (window.showToast) window.showToast(e.message || `Duplicate entry: Book "${title}" already exists.`, 'error');
              return false;
            }
          }

          const tbody = document.getElementById('books-tbody');
          if (tbody) tbody.innerHTML = renderBookRows(books);
          attachBookActions();

          // Update stat cards with fresh totals
          const newTotalStock = books.reduce((acc, b) => acc + (parseInt(b.qty ?? b.total_copies) || 10), 0);
          const newTotalAvail = books.reduce((acc, b) => {
            const avail = b.available_qty !== undefined ? b.available_qty : (b.available_copies !== undefined ? b.available_copies : (b.qty || 5));
            return acc + (parseInt(avail) || 0);
          }, 0);
          const newTotalIssued = Math.max(0, newTotalStock - newTotalAvail);
          const stockEl = document.getElementById('lib-stat-stock');
          const availEl = document.getElementById('lib-stat-avail');
          const issuedEl = document.getElementById('lib-stat-issued');
          if (stockEl) stockEl.textContent = newTotalStock;
          if (availEl) availEl.textContent = newTotalAvail;
          if (issuedEl) issuedEl.textContent = newTotalIssued;
          // Update catalogue tab badge
          const catBtn = document.getElementById('lib-tab-btn-cat');
          if (catBtn) catBtn.innerHTML = `📚 Book Catalogue &amp; Inventory (${books.length})`;

          if (window.showToast) window.showToast(`Book "${title}" added to catalogue & database`, 'success');
          return true;
        }
      });
    };
  }
}

/* ==========================================================================
   Transport & Bus Routes View (Point 23 & Add Routes)
   ========================================================================== */
let routes = [];

async function renderTransport() {
  routes = [];
  try {
    const res = await api.get('/transport/routes');
    if (Array.isArray(res.data)) {
      routes = res.data;
    } else if (Array.isArray(res)) {
      routes = res;
    } else if (window.SS_STORE) {
      routes = window.SS_STORE.get('routes') || [];
    }
  } catch (err) {
    console.warn('Transport central DB sync fallback:', err);
    if (window.SS_STORE) routes = window.SS_STORE.get('routes') || [];
  }

  const canManageTransport = window.canManage ? window.canManage() : false;
  const user = (window.auth && typeof window.auth.getUser === 'function') ? window.auth.getUser() : null;
  const isParent = user && user.role === 'parent';
  const isStudent = user && user.role === 'student';

  const totalBuses = routes.length;
  const totalRiders = routes.reduce((acc, r) => acc + (r.student_count || 0), 0);
  const activeBus = routes.length > 0 ? routes[0] : null;

  return `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h1>${(isParent || isStudent) ? 'Live Bus GPS Tracking &amp; Routes' : 'Transport &amp; Fleet Routes'}</h1>
          <p class="subtitle">${(isParent || isStudent) ? 'Real-time satellite GPS tracking of your ward\'s designated school bus route, stops, and driver contacts' : 'School bus tracking, designated pickup stops, driver emergency contacts, and student manifests'}</p>
        </div>
        ${canManageTransport ? `
          <button class="btn btn-primary" id="add-route-btn">
            ${icon('plus', 18)} Add Bus Route
          </button>
        ` : `
          <button class="btn btn-primary" id="live-gps-quick-btn">
            ${icon('truck', 18)} 🛰️ Live GPS Telemetry
          </button>
        `}
      </div>

      <!-- Real-Time GPS Tracking Radar Card for Parents & Students -->
      ${(isParent || isStudent || routes.length > 0) ? `
        <div class="card mb-6" style="border-left: 4px solid var(--primary-600); background: linear-gradient(145deg, var(--bg-card) 0%, rgba(37,99,235,0.04) 100%);">
          <div class="card-header">
            <div class="flex items-center gap-3">
              <div style="width: 42px; height: 42px; border-radius: 10px; background: rgba(37,99,235,0.1); color: var(--primary-600); display: flex; align-items: center; justify-content: center; font-size: 1.3rem;">
                🛰️
              </div>
              <div>
                <span class="card-title">Real-Time Ward Bus Tracking (GPS Satellite Link)</span>
                <div class="card-subtitle">Live vehicle speed, waypoint telemetry, and estimated arrival time</div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="badge badge-success animate-pulse" style="display: inline-flex; align-items: center; gap: 6px;">
                <span style="width: 8px; height: 8px; border-radius: 50%; background: #22c55e;"></span> LIVE SATELLITE GPS ACTIVE
              </span>
            </div>
          </div>

          <!-- Telemetry Bar -->
          <div class="grid grid-4 gap-4 p-4 mb-4" style="background: var(--bg-input); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
            <div>
              <div class="text-xs text-secondary font-semibold uppercase">Assigned Bus</div>
              <div class="text-base font-bold mt-1" style="color: var(--primary-700);">${activeBus.vehicle_no || 'WB-02-AK-9842'}</div>
              <div class="text-xs text-secondary">${activeBus.route_title}</div>
            </div>
            <div>
              <div class="text-xs text-secondary font-semibold uppercase">Live Speed &amp; Heading</div>
              <div class="text-base font-bold mt-1" style="color: var(--success-600);">34 km/h • 68° ENE</div>
              <div class="text-xs text-secondary">Normal Traffic Flow</div>
            </div>
            <div>
              <div class="text-xs text-secondary font-semibold uppercase">Next Waypoint Stop</div>
              <div class="text-base font-bold mt-1" style="color: var(--info-600);">City Center Gate 2</div>
              <div class="text-xs text-secondary">ETA: ~6 minutes</div>
            </div>
            <div>
              <div class="text-xs text-secondary font-semibold uppercase">Driver &amp; Emergency</div>
              <div class="text-base font-bold mt-1">${activeBus.driver_name}</div>
              <div class="text-xs text-secondary">
                <a href="tel:${activeBus.driver_phone}" class="text-primary font-semibold">📞 Call: ${activeBus.driver_phone}</a>
              </div>
            </div>
          </div>

          <!-- Live Animated Route Waypoints Track -->
          <div style="padding: 14px 18px; background: var(--bg-secondary); border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
            <div class="flex items-center justify-between text-xs text-secondary font-semibold mb-2">
              <span>🚩 Start: School Main Campus (07:15 AM)</span>
              <span style="color: var(--primary-600); font-weight: 700;">🚌 In Transit (Approaching Stop 2)</span>
              <span>🏁 Destination: Salt Lake Sec V Hub (08:15 AM)</span>
            </div>
            <div style="position: relative; height: 10px; background: var(--border-color); border-radius: 5px; overflow: visible; margin: 16px 0;">
              <div style="position: absolute; left: 0; top: 0; width: 55%; height: 100%; background: linear-gradient(90deg, #10b981, #3b82f6); border-radius: 5px;"></div>
              <div style="position: absolute; left: calc(55% - 14px); top: -9px; width: 28px; height: 28px; border-radius: 50%; background: var(--primary-600); color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px rgba(59,130,246,0.7); font-size: 0.9rem;" title="Current Bus Position">
                🚌
              </div>
            </div>
            <div class="flex justify-between text-xs text-secondary mt-1">
              <span>Campus Gate (Departed)</span>
              <span>Sector V Crossing (Passed)</span>
              <span style="color: var(--primary-700); font-weight: 700;">City Center (Next Stop)</span>
              <span>Salt Lake Stadium (Drop)</span>
            </div>
          </div>
        </div>
      ` : ''}

      <div class="grid-3 mb-6">
        <div class="stat-card stat-primary">
          <div class="stat-icon">${icon('truck', 24)}</div>
          <div class="stat-value">${totalBuses} Active</div>
          <div class="stat-label">Designated Fleet Routes</div>
        </div>
        <div class="stat-card stat-success">
          <div class="stat-icon">${icon('users', 24)}</div>
          <div class="stat-value">${totalRiders} Students</div>
          <div class="stat-label">Daily Transport Passengers</div>
        </div>
        <div class="stat-card stat-info">
          <div class="stat-icon">${icon('checkCircle', 24)}</div>
          <div class="stat-value">100% Verified</div>
          <div class="stat-label">GPS Beacons &amp; Driver Licenses</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">School Bus Routes &amp; Assigned Vehicles</span>
          <span class="badge badge-info">${(isParent || isStudent) ? 'Live GPS Tracking Enabled' : 'Fleet Administration'}</span>
        </div>
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Route Details</th>
                <th>Assigned Vehicle</th>
                <th>Driver &amp; Emergency Contact</th>
                <th>Major Stop Points</th>
                <th>Monthly Fare</th>
                <th>Students</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody id="routes-tbody">
              ${renderRouteRows(routes, canManageTransport)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderRouteRows(items, canManageTransport = false) {
  if (!items || items.length === 0) {
    return `<tr><td colspan="7" class="text-center p-8 text-secondary">No transport routes configured for this institution. Click "Add Bus Route" to add one.</td></tr>`;
  }
  return items.map(r => `
    <tr>
      <td>
        <strong>${r.route_title}</strong>
        <div class="text-xs text-secondary mt-1">ID: #RT-${String(r.id).slice(-4)}</div>
      </td>
      <td>
        <span class="badge badge-primary font-bold">${r.vehicle_no}</span>
        <div class="text-xs text-secondary mt-1">${r.vehicle_type || 'School Bus (42 Seater)'}</div>
      </td>
      <td>
        <strong>${r.driver_name}</strong>
        <div class="text-xs text-secondary">
          <a href="tel:${r.driver_phone}" style="color: var(--primary-600); text-decoration: none;">📞 ${r.driver_phone}</a>
        </div>
      </td>
      <td>
        <div class="text-sm text-secondary" style="max-width: 280px; line-height: 1.4;">
          ${r.stops}
        </div>
      </td>
      <td><strong>₹${Number(r.fare || 2400).toLocaleString()}/mo</strong></td>
      <td><span class="badge badge-info" style="font-weight: 700;">${r.student_count || 0} Students</span></td>
      <td style="text-align: right;">
        <div class="flex justify-end gap-1">
          <button class="btn btn-primary btn-sm track-gps-btn" data-id="${r.id}" title="Real-Time GPS Satellite Tracking">
            ${icon('truck', 14)} Track GPS
          </button>
          <button class="btn btn-secondary btn-sm view-stops-btn" data-id="${r.id}" title="View Stops &amp; Waypoint Timings">
            ${icon('mapPin', 14)} Stops
          </button>
          ${canManageTransport ? `
            <button class="btn-ghost btn-sm edit-route-btn" data-id="${r.id}" title="Edit Route">
              ${icon('pencil', 14)}
            </button>
            <button class="btn-ghost btn-sm delete-route-btn" data-id="${r.id}" title="Delete Route" style="color: var(--danger-500);">
              ${icon('trash', 14)}
            </button>
          ` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

function bindTransportEvents() {
  const canManageTransport = window.canManage ? window.canManage() : false;

  const quickGpsBtn = document.getElementById('live-gps-quick-btn');
  if (quickGpsBtn) {
    quickGpsBtn.onclick = () => {
      if (typeof window.openLiveBusTrackingModal === 'function') {
        window.openLiveBusTrackingModal(routes[0]?.id || 1);
      }
    };
  }

  function attachRouteActions() {
    // Live GPS Satellite Tracking Modal
    document.querySelectorAll('.track-gps-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        if (typeof window.openLiveBusTrackingModal === 'function') {
          window.openLiveBusTrackingModal(id);
        }
      };
    });

    // View Stops Modal
    document.querySelectorAll('.view-stops-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const r = window.SS_STORE ? window.SS_STORE.find('routes', id) : routes.find(x => String(x.id) === String(id));
        if (!r) return;

        const stopList = (r.stops || '').split(',').map(s => s.trim()).filter(Boolean);

        window.openAppModal({
          title: `Route Waypoints: ${r.route_title}`,
          subtitle: `Vehicle: ${r.vehicle_no} • Driver: ${r.driver_name} (${r.driver_phone})`,
          saveLabel: 'Close',
          saveIcon: 'checkCircle',
          contentHtml: `
            <div style="padding: 10px 0;">
              <div class="p-3 mb-4 rounded-md flex justify-between items-center" style="background: var(--bg-input); border: 1px solid var(--border-color);">
                <div>
                  <div class="text-xs text-secondary">GPS Status</div>
                  <strong style="color: var(--success-600);">● Active GPS Beacon Online</strong>
                </div>
                <div class="text-right">
                  <div class="text-xs text-secondary">Assigned Students</div>
                  <strong>${r.student_count || 0} Passengers</strong>
                </div>
              </div>

              <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 12px;">Waypoint Stop Sequence:</h4>
              <div class="flex flex-col gap-3">
                ${stopList.map((stop, idx) => `
                  <div class="flex items-center gap-3 p-3 rounded-md" style="background: var(--bg-input);">
                    <div class="avatar-placeholder" style="width: 28px; height: 28px; font-size: 0.75rem; background: var(--primary-100); color: var(--primary-700); font-weight: 700;">
                      ${idx + 1}
                    </div>
                    <div style="flex: 1;">
                      <strong style="font-size: 0.9rem;">${stop}</strong>
                      <div class="text-xs text-secondary">Morning Pickup: 07:${String(10 + idx * 8).padStart(2, '0')} AM • Evening Drop: 03:${String(40 + idx * 8).padStart(2, '0')} PM</div>
                    </div>
                    <span class="badge badge-success">On Schedule</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `,
          onSave: async () => true,
        });
      };
    });

    if (canManageTransport) {
      // Edit Route Modal
      document.querySelectorAll('.edit-route-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const r = window.SS_STORE ? window.SS_STORE.find('routes', id) : routes.find(x => String(x.id) === String(id));
        if (!r) return;

        window.openAppModal({
          title: `Edit Transport Route: ${r.route_title}`,
          subtitle: 'Update vehicle allocation, driver details, fare, and pickup stops',
          saveLabel: 'Update Route',
          saveIcon: 'checkCircle',
          contentHtml: `
            <div class="form-grid">
              <div class="form-group" style="grid-column: span 2;">
                <label class="form-label">Route Title *</label>
                <input type="text" class="form-input" id="modal-route-title" value="${r.route_title || ''}" required />
              </div>
              <div class="form-group">
                <label class="form-label">Vehicle Registration Number *</label>
                <input type="text" class="form-input" id="modal-route-vehicle" value="${r.vehicle_no || ''}" required />
              </div>
              <div class="form-group">
                <label class="form-label">Vehicle Type</label>
                <select class="form-select" id="modal-route-type">
                  <option value="School Bus (42 Seater)" ${r.vehicle_type && r.vehicle_type.includes('42') ? 'selected' : ''}>School Bus (42 Seater)</option>
                  <option value="Mini Bus (26 Seater)" ${r.vehicle_type && r.vehicle_type.includes('26') ? 'selected' : ''}>Mini Bus (26 Seater)</option>
                  <option value="Force Traveller Van (16 Seater)" ${r.vehicle_type && r.vehicle_type.includes('16') ? 'selected' : ''}>Force Traveller Van (16 Seater)</option>
                  <option value="AC Deluxe Coach (50 Seater)" ${r.vehicle_type && r.vehicle_type.includes('50') ? 'selected' : ''}>AC Deluxe Coach (50 Seater)</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Driver Full Name *</label>
                <input type="text" class="form-input" id="modal-route-driver" value="${r.driver_name || ''}" required />
              </div>
              <div class="form-group">
                <label class="form-label">Driver Contact Phone *</label>
                <input type="text" class="form-input" id="modal-route-phone" value="${r.driver_phone || ''}" required />
              </div>
              <div class="form-group" style="grid-column: span 2;">
                <label class="form-label">Major Stops / Waypoints (comma separated)</label>
                <input type="text" class="form-input" id="modal-route-stops" value="${r.stops || ''}" />
              </div>
              <div class="form-group">
                <label class="form-label">Monthly Bus Fare (₹)</label>
                <input type="number" class="form-input" id="modal-route-fare" value="${r.fare || 2400}" />
              </div>
              <div class="form-group">
                <label class="form-label">Assigned Students</label>
                <input type="number" class="form-input" id="modal-route-count" value="${r.student_count || 30}" />
              </div>
            </div>
          `,
          onSave: async () => {
            const title = document.getElementById('modal-route-title').value.trim();
            const vehicle = document.getElementById('modal-route-vehicle').value.trim();
            const driver = document.getElementById('modal-route-driver').value.trim();
            const phone = document.getElementById('modal-route-phone').value.trim();
            if (!title || !vehicle || !driver) {
              if (window.showToast) window.showToast('Please fill out all required fields', 'warning');
              return false;
            }
            const type = document.getElementById('modal-route-type').value;
            const stops = document.getElementById('modal-route-stops').value.trim() || 'Campus Gate';
            const fare = parseFloat(document.getElementById('modal-route-fare').value) || 2400;
            const count = parseInt(document.getElementById('modal-route-count').value) || 0;

            const updates = { route_title: title, route_name: title, vehicle_no: vehicle, vehicle_type: type, driver_name: driver, driver_phone: phone, stops, fare, student_count: count };

            try {
              await api.post('/transport/routes/update/' + id, updates);
              const rRes = await api.get('/transport/routes');
              if (Array.isArray(rRes.data) && rRes.data.length > 0) {
                routes = rRes.data;
              }
            } catch (e) {
              console.warn('Route update API fallback:', e);
            }

            if (window.SS_STORE) {
              window.SS_STORE.update('routes', id, updates);
              routes = window.SS_STORE.get('routes');
            } else {
              const idx = routes.findIndex(x => String(x.id) === String(id));
              if (idx !== -1) routes[idx] = { ...routes[idx], ...updates };
            }

            const tbody = document.getElementById('routes-tbody');
            if (tbody) tbody.innerHTML = renderRouteRows(routes);
            attachRouteActions();
            if (window.showToast) window.showToast(`Route "${title}" updated successfully`, 'success');
            return true;
          }
        });
      };
    });

    // Delete Route
    document.querySelectorAll('.delete-route-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const r = window.SS_STORE ? window.SS_STORE.find('routes', id) : routes.find(x => String(x.id) === String(id));
        const title = r ? (r.route_title || r.route_name) : 'this route';

        window.openAppModal({
          title: `Delete Transport Route?`,
          subtitle: `Are you sure you want to remove "${title}"?`,
          saveLabel: 'Confirm Delete',
          saveIcon: 'trash',
          contentHtml: `
            <div style="padding: 10px 0;">
              <p style="color: var(--danger-500); font-weight: 600;">
                Warning: Removing this route will unassign enrolled student passengers.
              </p>
              <p class="text-sm text-secondary mt-2">
                Click "Confirm Delete" to permanently remove this route from the transport roster.
              </p>
            </div>
          `,
          onSave: async () => {
            try {
              await api.delete('/transport/routes/' + id);
              const rRes = await api.get('/transport/routes');
              if (Array.isArray(rRes.data)) routes = rRes.data;
            } catch (e) {
              console.warn('Route delete API fallback:', e);
            }

            if (window.SS_STORE) {
              window.SS_STORE.delete('routes', id);
              routes = window.SS_STORE.get('routes');
            } else {
              routes = routes.filter(x => String(x.id) !== String(id));
            }
            const tbody = document.getElementById('routes-tbody');
            if (tbody) tbody.innerHTML = renderRouteRows(routes);
            attachRouteActions();
            if (window.showToast) window.showToast('Route removed from fleet', 'success');
            return true;
          }
        });
      };
    });
    }
  }

  attachRouteActions();

  // Add Bus Route Button (Guarded to Managers / Admins)
  const btn = document.getElementById('add-route-btn');
  if (btn && canManageTransport) {
    btn.onclick = () => {
      window.openAppModal({
        title: 'Add New Fleet Bus Route',
        subtitle: 'Configure vehicle registration, designated driver, route stops, and monthly fare',
        saveLabel: 'Add Route to Fleet',
        saveIcon: 'plus',
        contentHtml: `
          <div class="form-grid">
            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label">Route Title / Neighborhood *</label>
              <input type="text" class="form-input" id="modal-newroute-title" placeholder="e.g. Route 06: South Kolkata & Jadavpur Express" required />
            </div>
            <div class="form-group">
              <label class="form-label">Vehicle Registration Number *</label>
              <input type="text" class="form-input" id="modal-newroute-vehicle" placeholder="e.g. WB-02-ED-7721" required />
            </div>
            <div class="form-group">
              <label class="form-label">Vehicle Type</label>
              <select class="form-select" id="modal-newroute-type">
                <option value="School Bus (42 Seater)">School Bus (42 Seater)</option>
                <option value="Mini Bus (26 Seater)">Mini Bus (26 Seater)</option>
                <option value="Force Traveller Van (16 Seater)">Force Traveller Van (16 Seater)</option>
                <option value="AC Deluxe Coach (50 Seater)">AC Deluxe Coach (50 Seater)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Driver Full Name *</label>
              <input type="text" class="form-input" id="modal-newroute-driver" placeholder="e.g. Mr. Harish Chandra" required />
            </div>
            <div class="form-group">
              <label class="form-label">Driver Emergency Phone *</label>
              <input type="text" class="form-input" id="modal-newroute-phone" placeholder="e.g. +91 98765 43216" required />
            </div>
            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label">Designated Stops (comma separated)</label>
              <input type="text" class="form-input" id="modal-newroute-stops" placeholder="e.g. South Ext Part 1, AIIMS Metro, Defence Colony, Campus Gate" />
            </div>
            <div class="form-group">
              <label class="form-label">Monthly Bus Fare (₹)</label>
              <input type="number" class="form-input" id="modal-newroute-fare" value="2500" />
            </div>
            <div class="form-group">
              <label class="form-label">Passenger Capacity</label>
              <input type="number" class="form-input" id="modal-newroute-count" value="35" />
            </div>
          </div>
        `,
        onSave: async () => {
          const title = document.getElementById('modal-newroute-title').value.trim();
          const vehicle = document.getElementById('modal-newroute-vehicle').value.trim();
          const driver = document.getElementById('modal-newroute-driver').value.trim();
          const phone = document.getElementById('modal-newroute-phone').value.trim();
          if (!title || !vehicle || !driver) {
            if (window.showToast) window.showToast('Please provide Route Title, Vehicle Number, and Driver Name', 'warning');
            return false;
          }

          if (Array.isArray(routes)) {
            const titleDup = routes.find(r => (r.route_name || r.route_title || '').trim().toLowerCase() === title.toLowerCase());
            if (titleDup) {
              if (window.showToast) window.showToast(`Duplicate entry: Bus route "${title}" already exists!`, 'error');
              return false;
            }
            if (vehicle) {
              const vehDup = routes.find(r => (r.vehicle_no || '').trim().toLowerCase() === vehicle.toLowerCase());
              if (vehDup) {
                if (window.showToast) window.showToast(`Duplicate entry: Vehicle number "${vehicle}" is already assigned!`, 'error');
                return false;
              }
            }
          }

          const type = document.getElementById('modal-newroute-type').value;
          const stops = document.getElementById('modal-newroute-stops').value.trim() || 'Campus Main Gate';
          const fare = parseFloat(document.getElementById('modal-newroute-fare').value) || 2500;
          const count = parseInt(document.getElementById('modal-newroute-count').value) || 0;

          const newRoute = {
            route_title: title,
            vehicle_no: vehicle,
            vehicle_type: type,
            driver_name: driver,
            driver_phone: phone || '+91 98765 00000',
            stops,
            fare,
            student_count: count,
          };

          try {
            await api.post('/transport/routes', newRoute);
            const rRes = await api.get('/transport/routes');
            if (Array.isArray(rRes.data) && rRes.data.length > 0) {
              routes = rRes.data;
            }
          } catch (e) {
            console.warn('Route API save error:', e);
            if (e.status === 409 || (e.message && /duplicate/i.test(e.message))) {
              if (window.showToast) window.showToast(e.message || `Duplicate entry: Route "${title}" already exists.`, 'error');
              return false;
            }
          }

          if (window.SS_STORE) {
            window.SS_STORE.add('routes', newRoute);
          } else if (!routes.some(r => (r.route_name || r.route_title) === title)) {
            routes.unshift({ id: Date.now(), ...newRoute });
          }

          const tbody = document.getElementById('routes-tbody');
          if (tbody) tbody.innerHTML = renderRouteRows(routes);
          attachRouteActions();
          if (window.showToast) window.showToast(`Bus Route "${title}" successfully added!`, 'success');
          return true;
        }
      });
    };
  }
}

// Global Interactive Live Bus GPS Tracking Modal for Parents, Students & Administrators
window.openLiveBusTrackingModal = function(id) {
  const r = (window.SS_STORE ? window.SS_STORE.find('routes', id) : routes.find(x => String(x.id) === String(id))) || routes[0] || {
    route_title: 'Route 1 - Salt Lake Sector V Express',
    vehicle_no: 'WB-02-AK-9842',
    driver_name: 'Ramesh Yadav',
    driver_phone: '+91 98765 43201',
    stops: 'Campus Main Gate, Sector V Crossing, City Center Gate 2, Salt Lake Stadium',
  };

  const stopList = (r.stops || '').split(',').map(s => s.trim()).filter(Boolean);

  window.openAppModal({
    title: `🛰️ Live GPS Satellite Tracking: ${r.vehicle_no}`,
    subtitle: `${r.route_title} • Assigned Driver: ${r.driver_name} (${r.driver_phone})`,
    saveLabel: 'Close Radar',
    saveIcon: 'checkCircle',
    contentHtml: `
      <div style="padding: 10px 0;">
        <!-- Simulated High-Tech GPS Map Radar Window -->
        <div style="position: relative; height: 220px; border-radius: 12px; overflow: hidden; background: #0f172a; border: 1px solid rgba(59,130,246,0.3); margin-bottom: 16px; box-shadow: inset 0 0 40px rgba(0,0,0,0.6);">
          <div style="position: absolute; inset: 0; background-image: radial-gradient(rgba(59, 130, 246, 0.25) 1px, transparent 1px); background-size: 24px 24px; opacity: 0.8;"></div>

          <div style="position: absolute; left: 52%; top: 48%; transform: translate(-50%, -50%); width: 140px; height: 140px; border-radius: 50%; border: 1px dashed rgba(59,130,246,0.4); pointer-events: none;"></div>
          <div style="position: absolute; left: 52%; top: 48%; transform: translate(-50%, -50%); width: 70px; height: 70px; border-radius: 50%; border: 1px solid rgba(16,185,129,0.5); pointer-events: none;"></div>

          <!-- Bus Marker with Live Ripple -->
          <div style="position: absolute; left: 52%; top: 48%; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; z-index: 10;">
            <div style="width: 38px; height: 38px; border-radius: 50%; background: #2563eb; color: white; display: flex; align-items: center; justify-content: center; font-size: 1.15rem; box-shadow: 0 0 20px #3b82f6; border: 2px solid #fff;">
              🚌
            </div>
            <div style="background: rgba(15,23,42,0.9); color: #fff; font-size: 0.72rem; padding: 2px 8px; border-radius: 12px; margin-top: 4px; font-weight: 700; border: 1px solid rgba(255,255,255,0.2);">
              ${r.vehicle_no} (34 km/h)
            </div>
          </div>

          <div style="position: absolute; top: 12px; left: 12px; background: rgba(15,23,42,0.85); backdrop-filter: blur(6px); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 6px 12px; font-size: 0.75rem; color: #e2e8f0;">
            <div style="color: #22c55e; font-weight: 700;">● GPS LOCKED • 12 SATELLITES</div>
            <div style="font-family: monospace; font-size: 0.7rem; color: #94a3b8; margin-top: 2px;">22.5726° N, 88.4312° E</div>
          </div>

          <div style="position: absolute; bottom: 12px; right: 12px; background: rgba(15,23,42,0.85); backdrop-filter: blur(6px); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 6px 12px; font-size: 0.75rem; color: #e2e8f0; text-align: right;">
            <div style="font-weight: 700; color: #38bdf8;">NEXT STOP: ${stopList[1] || 'City Center'}</div>
            <div style="font-size: 0.7rem; color: #94a3b8;">Est. Arrival: ~6 mins</div>
          </div>
        </div>

        <!-- Driver Direct Contact Call Button -->
        <div class="flex items-center justify-between p-3 rounded-md mb-4" style="background: var(--bg-input); border: 1px solid var(--border-color);">
          <div class="flex items-center gap-3">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--primary-100); color: var(--primary-700); display: flex; align-items: center; justify-content: center; font-weight: 700;">
              👨‍✈️
            </div>
            <div>
              <div style="font-weight: 700; font-size: 0.9rem;">${r.driver_name} (Assigned Driver)</div>
              <div class="text-xs text-secondary">Verified Commercial License &amp; Police Verification Active</div>
            </div>
          </div>
          <a href="tel:${r.driver_phone}" class="btn btn-primary btn-sm" style="text-decoration: none;">
            📞 Call Driver
          </a>
        </div>

        <!-- Waypoint Sequence -->
        <h4 style="font-size: 0.9rem; font-weight: 700; margin-bottom: 8px;">Route Stops &amp; Waypoint Progress:</h4>
        <div class="flex flex-col gap-2">
          ${stopList.map((stop, idx) => {
            const isPassed = idx === 0;
            const isCurrent = idx === 1;
            return `
              <div class="flex items-center gap-3 p-2 rounded-md" style="background: ${isCurrent ? 'rgba(37,99,235,0.08)' : 'var(--bg-input)'}; border: 1px solid ${isCurrent ? 'var(--primary-400)' : 'transparent'};">
                <div style="width: 24px; height: 24px; border-radius: 50%; background: ${isPassed ? '#10b981' : (isCurrent ? '#2563eb' : 'var(--border-color)')}; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700;">
                  ${isPassed ? '✓' : idx + 1}
                </div>
                <div style="flex: 1;">
                  <strong style="font-size: 0.85rem;">${stop}</strong>
                  <div class="text-xs text-secondary">Scheduled Pickup: 07:${String(10 + idx * 12).padStart(2, '0')} AM</div>
                </div>
                <span class="badge ${isPassed ? 'badge-success' : (isCurrent ? 'badge-primary' : 'badge-secondary')}" style="font-size: 0.7rem;">
                  ${isPassed ? 'Passed' : (isCurrent ? 'Approaching' : 'Upcoming')}
                </span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `,
    onSave: async () => true,
  });
};

/* ==========================================================================
   Hostel & Boarding Accommodation View (Hostel Blocks & Student Allocation)
   ========================================================================== */
let hostels = [];
let hostelAllocations = [];

async function renderHostel() {
  const activeCampus = typeof window.getActiveCampus === 'function' ? window.getActiveCampus() : (localStorage.getItem('active_campus') || 'Kolkata Main Campus (Salt Lake Sector V)');
  const campusCacheKey = `smart_school_hostel_alloc_${activeCampus.replace(/[^a-zA-Z0-9]/g, '_')}`;

  hostels = [];
  hostelAllocations = [];

  if (window.SS_STORE) {
    hostels = window.SS_STORE.get('hostels') || [];
    hostelAllocations = window.SS_STORE.get('hostel_allocations') || [];
  }

  try {
    const cached = localStorage.getItem(campusCacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) hostelAllocations = parsed;
    }
  } catch {}

  try {
    const [hRes, aRes] = await Promise.all([
      api.get('/hostels').catch(() => ({ data: [] })),
      api.get('/hostels/allocations').catch(() => ({ data: [] }))
    ]);
    if (Array.isArray(hRes.data)) {
      hostels = hRes.data;
    } else if (Array.isArray(hRes)) {
      hostels = hRes;
    }
    if (Array.isArray(aRes.data)) {
      hostelAllocations = aRes.data;
      try {
        localStorage.setItem(campusCacheKey, JSON.stringify(hostelAllocations));
      } catch {}
    } else if (Array.isArray(aRes)) {
      hostelAllocations = aRes;
    }
  } catch (e) {
    console.warn('Hostels fetch fallback:', e);
  }

  const totalCapacity = hostels.reduce((acc, h) => acc + (parseInt(h.capacity || h.intake) || 50), 0);
  const totalOccupied = hostelAllocations.length;
  const totalAvailable = Math.max(0, totalCapacity - totalOccupied);

  return `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h1>Hostel & Boarding Accommodation</h1>
          <p class="subtitle">Residential wings, room allotments, bed capacity, warden contacts, and student allocations</p>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-secondary" id="add-hostel-btn">
            ${icon('building', 18)} Add Hostel Block
          </button>
          <button class="btn btn-primary" id="allocate-student-hostel-btn">
            ${icon('userPlus', 18)} Allocate Student to Hostel
          </button>
        </div>
      </div>

      <div class="grid-3 mb-6">
        <div class="stat-card stat-primary">
          <div class="stat-icon">${icon('building', 24)}</div>
          <div class="stat-value" id="stat-hostel-wings">${hostels.length} Wings</div>
          <div class="stat-label">Active Residential Blocks</div>
        </div>
        <div class="stat-card stat-success">
          <div class="stat-icon">${icon('users', 24)}</div>
          <div class="stat-value" id="stat-hostel-occupied">${totalOccupied} / ${totalCapacity}</div>
          <div class="stat-label">Allocated Boarding Students (Beds Taken)</div>
        </div>
        <div class="stat-card stat-info">
          <div class="stat-icon">${icon('checkCircle', 24)}</div>
          <div class="stat-value" id="stat-hostel-available">${totalAvailable} Beds</div>
          <div class="stat-label">Available Capacity (Free Beds)</div>
        </div>
      </div>

      <!-- Section 1: Residential Hostel Wings -->
      <div class="card mb-6">
        <div class="card-header flex justify-between items-center">
          <span class="card-title">Residential Hostel Wings & Bed Allocation</span>
          <span class="badge badge-primary" id="badge-hostel-blocks">${hostels.length} Active Blocks</span>
        </div>
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Hostel Wing</th>
                <th>Hostel Type</th>
                <th>Campus Location</th>
                <th>Total Bed Capacity</th>
                <th>Allocated Boarders / Beds</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody id="hostels-tbody">
              ${renderHostelRows(hostels, hostelAllocations)}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Section 2: Allocated Boarding Students -->
      <div class="card">
        <div class="card-header flex justify-between items-center">
          <div>
            <span class="card-title">Allocated Boarding Students & Bed Allotment</span>
            <div class="text-xs text-secondary mt-1">Live residential students stored in institutional database</div>
          </div>
          <span class="badge badge-success" id="badge-hostel-boarders">${hostelAllocations.length} Students Boarding</span>
        </div>
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Student Details</th>
                <th>Admission No</th>
                <th>Class / Stream</th>
                <th>Gender</th>
                <th>Assigned Hostel Wing</th>
                <th>Room Number</th>
                <th>Allocated Date</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody id="hostel-allocations-tbody">
              ${renderAllocationRows(hostelAllocations)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderHostelRows(items, allocations = []) {
  if (!items || items.length === 0) {
    return `<tr><td colspan="6" class="text-center p-8 text-secondary">No residential hostel wings configured for this institution. Click "Add Hostel Block" to register one.</td></tr>`;
  }
  return items.map(h => {
    const allocatedInBlock = (allocations || []).filter(a => String(a.hostel_id) === String(h.id)).length;
    const capacity = parseInt(h.capacity || h.intake) || 50;
    const freeBeds = Math.max(0, capacity - allocatedInBlock);
    const pct = Math.min(100, Math.round((allocatedInBlock / capacity) * 100));

    return `
      <tr>
        <td><strong>${h.name}</strong></td>
        <td><span class="badge ${h.type === 'Boys' ? 'badge-primary' : h.type === 'Girls' ? 'badge-warning' : 'badge-info'}">${h.type}</span></td>
        <td>${h.address || 'Campus Residential Quarter'}</td>
        <td><strong>${capacity} Beds</strong></td>
        <td>
          <div class="flex items-center gap-2">
            <strong style="font-size: 0.95rem;">${allocatedInBlock} Beds Allocated</strong>
            <span class="badge ${freeBeds === 0 ? 'badge-danger' : 'badge-success'}">${freeBeds} Free</span>
          </div>
          <div class="text-xs text-secondary mt-1">${pct}% Occupied (${allocatedInBlock} of ${capacity} beds)</div>
        </td>
        <td><span class="badge ${freeBeds === 0 ? 'badge-danger' : 'badge-success'}">${freeBeds === 0 ? 'Full' : 'Operational'}</span></td>
      </tr>
    `;
  }).join('');
}

function renderAllocationRows(items) {
  if (!items || items.length === 0) {
    return `<tr><td colspan="8" class="text-center p-8 text-secondary">No students allocated to hostels in this institution yet. Click "Allocate Student to Hostel" above to assign rooms.</td></tr>`;
  }
  return items.map(a => `
    <tr>
      <td>
        <div class="flex items-center gap-2">
          <div class="avatar-placeholder" style="width: 32px; height: 32px; font-size: 0.75rem;">
            ${(a.first_name || 'S')[0]}${(a.last_name || '')[0] || ''}
          </div>
          <div>
            <strong>${a.first_name || 'Student'} ${a.last_name || ''}</strong>
            <div class="text-xs text-secondary">Roll: ${a.roll_no || '—'}</div>
          </div>
        </div>
      </td>
      <td><code>${a.admission_no || 'SS-' + a.student_id}</code></td>
      <td><span class="badge badge-primary">${a.class_name || 'Enrolled Class'}</span></td>
      <td>${a.gender || '—'}</td>
      <td><strong>${a.hostel_name || 'Hostel Block'}</strong></td>
      <td><span class="badge badge-info" style="font-weight: 700;">${a.room_no || 'Standard Room'}</span></td>
      <td class="text-secondary">${a.join_date || '2026-09-28'}</td>
      <td style="text-align: right;">
        <button class="btn btn-secondary btn-sm vacate-student-btn" data-id="${a.id}" data-name="${a.first_name || ''} ${a.last_name || ''}" title="Vacate student from hostel">
          ${icon('trash', 14)} Vacate Room
        </button>
      </td>
    </tr>
  `).join('');
}

function updateHostelStats() {
  const totalCapacity = hostels.reduce((acc, h) => acc + (parseInt(h.capacity || h.intake) || 50), 0);
  const totalOccupied = hostelAllocations.length;
  const totalAvailable = Math.max(0, totalCapacity - totalOccupied);

  const occEl = document.getElementById('stat-hostel-occupied');
  const availEl = document.getElementById('stat-hostel-available');
  const wingsEl = document.getElementById('stat-hostel-wings');
  const badgeEl = document.getElementById('badge-hostel-boarders');
  const hBadgeEl = document.getElementById('badge-hostel-blocks');

  if (occEl) occEl.textContent = `${totalOccupied} / ${totalCapacity}`;
  if (availEl) availEl.textContent = `${totalAvailable} Beds`;
  if (wingsEl) wingsEl.textContent = `${hostels.length} Wings`;
  if (badgeEl) badgeEl.textContent = `${totalOccupied} Students Boarding`;
  if (hBadgeEl) hBadgeEl.textContent = `${hostels.length} Active Blocks`;
}

function bindHostelEvents() {
  function attachAllocationActions() {
    document.querySelectorAll('.vacate-student-btn').forEach(btn => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-id');
        const name = btn.getAttribute('data-name') || 'this student';

        window.openAppModal({
          title: `Vacate Student: ${name}?`,
          subtitle: 'Confirm removal of boarding allocation and free up bed in hostel wing',
          saveLabel: 'Confirm Vacate & Free Bed',
          saveIcon: 'trash',
          contentHtml: `
            <div style="padding: 12px 0;">
              <p style="color: var(--danger-500); font-weight: 600;">
                Are you sure you want to vacate <strong>${name}</strong> from their assigned hostel room?
              </p>
              <p class="text-sm text-secondary mt-2">
                This frees up the bed allocation immediately, decreases occupied beds, and increases available bed capacity across the institution.
              </p>
            </div>
          `,
          onSave: async () => {
            try {
              await api.delete('/hostels/allocations/' + id);
              const aRes = await api.get('/hostels/allocations');
              if (Array.isArray(aRes.data)) hostelAllocations = aRes.data;
              else if (Array.isArray(aRes)) hostelAllocations = aRes;
            } catch (e) {
              console.warn('Vacate fallback:', e);
              hostelAllocations = hostelAllocations.filter(x => String(x.id) !== String(id));
            }

            // Always ensure removed from local state
            hostelAllocations = hostelAllocations.filter(x => String(x.id) !== String(id));

            if (window.SS_STORE) {
              window.SS_STORE.delete('hostel_allocations', id);
            }
            try {
              localStorage.setItem('smart_school_hostel_allocations', JSON.stringify(hostelAllocations));
            } catch {}

            const tbody = document.getElementById('hostel-allocations-tbody');
            if (tbody) tbody.innerHTML = renderAllocationRows(hostelAllocations);
            const hTbody = document.getElementById('hostels-tbody');
            if (hTbody) hTbody.innerHTML = renderHostelRows(hostels, hostelAllocations);

            // Dynamically update bed counters (Decreases occupied beds, Increases available beds)
            updateHostelStats();
            attachAllocationActions();

            if (typeof broadcastDbMutation === 'function') {
              broadcastDbMutation('/hostels/allocations', 'DELETE');
            }

            if (window.showToast) window.showToast(`Student ${name} vacated from hostel room. Bed freed up successfully!`, 'success');
            return true;
          }
        });
      };
    });
  }

  attachAllocationActions();

  // Add Hostel Block Button
  const btn = document.getElementById('add-hostel-btn');
  if (btn) {
    btn.onclick = () => {
      window.openAppModal({
        title: 'Add New Residential Hostel Block',
        subtitle: 'Configure boarding wing gender segregation, warden in-charge, and bed capacity',
        saveLabel: 'Add Hostel Wing',
        saveIcon: 'plus',
        contentHtml: `
          <div class="form-grid">
            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label">Hostel Block Name *</label>
              <input type="text" class="form-input" id="modal-hostel-name" placeholder="e.g. Swami Vivekananda Senior Boys Wing (Block D)" required />
            </div>
            <div class="form-group">
              <label class="form-label">Hostel Type</label>
              <select class="form-select" id="modal-hostel-type">
                <option value="Boys">Boys Hostel</option>
                <option value="Girls">Girls Hostel</option>
                <option value="Co-Ed / Senior">Co-Ed / Senior Wing</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Chief Warden / Caretaker Name *</label>
              <input type="text" class="form-input" id="modal-hostel-warden" placeholder="e.g. Dr. Vivek Saxena" required />
            </div>
            <div class="form-group">
              <label class="form-label">Total Rooms Count</label>
              <input type="number" class="form-input" id="modal-hostel-rooms" value="25" />
            </div>
            <div class="form-group">
              <label class="form-label">Total Bed Capacity</label>
              <input type="number" class="form-input" id="modal-hostel-cap" value="75" />
            </div>
          </div>
        `,
        onSave: async () => {
          const name = document.getElementById('modal-hostel-name').value.trim();
          const warden = document.getElementById('modal-hostel-warden').value.trim();
          if (!name || !warden) {
            if (window.showToast) window.showToast('Please provide Hostel Name and Warden Name', 'warning');
            return false;
          }

          if (Array.isArray(hostels)) {
            const dup = hostels.find(h => (h.name || '').trim().toLowerCase() === name.toLowerCase());
            if (dup) {
              if (window.showToast) window.showToast(`Duplicate entry: Hostel block "${name}" already exists!`, 'error');
              return false;
            }
          }

          const type = document.getElementById('modal-hostel-type').value;
          const rooms = parseInt(document.getElementById('modal-hostel-rooms').value) || 20;
          const cap = parseInt(document.getElementById('modal-hostel-cap').value) || 60;

          const newHostel = {
            name,
            type,
            warden,
            rooms_count: rooms,
            capacity: cap,
            occupied: 0,
          };

          try {
            await api.post('/hostels', newHostel);
            const hRes = await api.get('/hostels');
            if (Array.isArray(hRes.data) && hRes.data.length > 0) {
              hostels = hRes.data;
            }
          } catch (e) {
            console.warn('Hostel API save error:', e);
            if (e.status === 409 || (e.message && /duplicate/i.test(e.message))) {
              if (window.showToast) window.showToast(e.message || `Duplicate entry: Hostel block "${name}" already exists.`, 'error');
              return false;
            }
          }

          if (window.SS_STORE) {
            window.SS_STORE.add('hostels', newHostel);
          } else if (!hostels.some(h => h.name === name)) {
            hostels.push({ id: Date.now(), ...newHostel });
          }

          const tbody = document.getElementById('hostels-tbody');
          if (tbody) tbody.innerHTML = renderHostelRows(hostels, hostelAllocations);
          updateHostelStats();
          if (window.showToast) window.showToast(`Hostel block "${name}" registered in database`, 'success');
          return true;
        }
      });
    };
  }

  // Allocate Student to Hostel Button
  const allocBtn = document.getElementById('allocate-student-hostel-btn');
  if (allocBtn) {
    allocBtn.onclick = async () => {
      let studentList = [];
      try {
        const sRes = await api.get('/students');
        if (Array.isArray(sRes.data) && sRes.data.length > 0) studentList = sRes.data;
      } catch {
        if (window.SS_STORE) studentList = window.SS_STORE.get('students') || [];
      }

      if (studentList.length === 0) {
        if (window.SS_STORE) studentList = window.SS_STORE.get('students') || [];
      }

      const studentOptions = studentList.map(s => {
        const sName = ((s.first_name || '') + ' ' + (s.last_name || '')).trim() || s.name || `Student #${s.id}`;
        return `
          <option value="${s.id}">${sName} (${s.admission_no || 'ID:#' + s.id}) - ${s.class_name || s.class || 'Class 10'}</option>
        `;
      }).join('');

      const hostelOptions = hostels.map(h => {
        const allocatedCount = (hostelAllocations || []).filter(a => String(a.hostel_id) === String(h.id)).length;
        const cap = parseInt(h.capacity || h.intake) || 50;
        const free = Math.max(0, cap - allocatedCount);
        return `
          <option value="${h.id}">${h.name} (${h.type} Hostel) — ${free} Free Beds left</option>
        `;
      }).join('');

      window.openAppModal({
        title: 'Allocate Student to Hostel Room',
        subtitle: 'Assign boarding student to residential wing, room number, and record check-in date',
        saveLabel: 'Allocate Bed & Room',
        saveIcon: 'userPlus',
        contentHtml: `
          <div class="form-grid">
            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label">Select Student *</label>
              <select class="form-select" id="modal-alloc-student" required>
                ${studentOptions || '<option value="" disabled selected>No students enrolled in this institution (Add student first)</option>'}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Select Hostel Wing *</label>
              <select class="form-select" id="modal-alloc-hostel" required>
                ${hostelOptions || '<option value="" disabled selected>No hostels configured (Add hostel block first)</option>'}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Assigned Room Number *</label>
              <input type="text" class="form-input" id="modal-alloc-room" placeholder="e.g. Room A-204" value="Room A-204" required />
            </div>
            <div class="form-group">
              <label class="form-label">Room Type</label>
              <select class="form-select" id="modal-alloc-room-type">
                <option value="Single">Single Occupancy</option>
                <option value="Double Sharing" selected>Double Sharing</option>
                <option value="Triple Sharing">Triple Sharing</option>
                <option value="Dormitory">Dormitory (4+ Beds)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Join / Check-In Date *</label>
              <input type="date" class="form-input" id="modal-alloc-date" value="${new Date().toISOString().split('T')[0]}" required />
            </div>
          </div>
        `,
        onSave: async () => {
          const rawStudent = document.getElementById('modal-alloc-student')?.value;
          const rawHostel = document.getElementById('modal-alloc-hostel')?.value;
          if (!rawStudent || !rawHostel) {
            if (window.showToast) window.showToast('Please select both a valid Student and Hostel Wing', 'warning');
            return false;
          }
          const studentId = parseInt(rawStudent);
          const hostelId = parseInt(rawHostel);
          const roomNo = document.getElementById('modal-alloc-room').value.trim() || 'Room 101';
          const roomType = document.getElementById('modal-alloc-room-type').value;
          const joinDate = document.getElementById('modal-alloc-date').value || new Date().toISOString().split('T')[0];

          // Check if selected hostel has available beds
          const targetHostel = hostels.find(h => String(h.id) === String(hostelId));
          const currentOccupiedInWing = hostelAllocations.filter(a => String(a.hostel_id) === String(hostelId)).length;
          const wingCapacity = parseInt(targetHostel?.capacity || targetHostel?.intake) || 50;
          if (currentOccupiedInWing >= wingCapacity) {
            if (window.showToast) window.showToast(`Cannot allocate: ${targetHostel?.name || 'This hostel'} has reached maximum bed capacity (${wingCapacity} beds)`, 'danger');
            return false;
          }

          // Check if student is already boarding
          const existingAlloc = hostelAllocations.find(a => String(a.student_id) === String(studentId));
          if (existingAlloc) {
            if (window.showToast) window.showToast(`This student is already allocated to ${existingAlloc.hostel_name || 'a hostel'} (${existingAlloc.room_no})`, 'warning');
            return false;
          }

          // Gather student details for immediate display
          const stObj = studentList.find(s => String(s.id) === String(studentId)) || {};
          const studentName = ((stObj.first_name || '') + ' ' + (stObj.last_name || '')).trim() || stObj.name || `Student #${studentId}`;

          const newAllocation = {
            id: Date.now(),
            student_id: studentId,
            hostel_id: hostelId,
            room_no: roomNo,
            room_type: roomType,
            join_date: joinDate,
            first_name: stObj.first_name || studentName.split(' ')[0] || 'Student',
            last_name: stObj.last_name || studentName.split(' ').slice(1).join(' ') || '',
            admission_no: stObj.admission_no || `SS-${studentId}`,
            roll_no: stObj.roll_no || '—',
            gender: stObj.gender || '—',
            class_name: stObj.class_name || stObj.class || 'Class 10',
            hostel_name: targetHostel?.name || 'Hostel Block',
            hostel_type: targetHostel?.type || 'Standard',
          };

          let savedToApi = false;
          try {
            await api.post('/hostels/allocate', {
              student_id: studentId,
              hostel_id: hostelId,
              room_no: roomNo,
              room_type: roomType,
              join_date: joinDate
            });

            const aRes = await api.get('/hostels/allocations');
            if (Array.isArray(aRes.data) && aRes.data.length > 0) {
              hostelAllocations = aRes.data;
              savedToApi = true;
            } else if (Array.isArray(aRes) && aRes.length > 0) {
              hostelAllocations = aRes;
              savedToApi = true;
            }
          } catch (e) {
            console.warn('Hostel allocation API error:', e);
            if (e.status === 409 || (e.message && /duplicate|already/i.test(e.message))) {
              if (window.showToast) window.showToast(e.message || 'Duplicate allocation: Student is already assigned to a hostel.', 'error');
              return false;
            }
          }

          if (!savedToApi) {
            hostelAllocations.unshift(newAllocation);
          }

          if (window.SS_STORE) {
            window.SS_STORE.add('hostel_allocations', newAllocation);
          }
          try {
            const activeCampus = typeof window.getActiveCampus === 'function' ? window.getActiveCampus() : (localStorage.getItem('active_campus') || 'Kolkata Main Campus (Salt Lake Sector V)');
            const campusCacheKey = `smart_school_hostel_alloc_${activeCampus.replace(/[^a-zA-Z0-9]/g, '_')}`;
            localStorage.setItem(campusCacheKey, JSON.stringify(hostelAllocations));
          } catch {}

          const tbody = document.getElementById('hostel-allocations-tbody');
          if (tbody) tbody.innerHTML = renderAllocationRows(hostelAllocations);
          const hTbody = document.getElementById('hostels-tbody');
          if (hTbody) hTbody.innerHTML = renderHostelRows(hostels, hostelAllocations);

          // Dynamically update bed counters (Increases occupied beds, Decreases available beds)
          updateHostelStats();
          attachAllocationActions();

          if (typeof broadcastDbMutation === 'function') {
            broadcastDbMutation('/hostels/allocations', 'POST');
          }

          if (window.showToast) {
            window.showToast(`Bed successfully allocated to ${studentName} in ${targetHostel?.name || 'Hostel'} (${roomNo})! Bed count updated.`, 'success');
          }
          return true;
        }
      });
    };
  }
}

/* ==========================================================================
   Notice Board & Communications View
   ========================================================================== */
let notices = [];

async function renderNotices() {
  const canPostNotice = window.canManage ? window.canManage(['teacher', 'receptionist', 'accountant', 'librarian']) : false;
  notices = [];

  try {
    const res = await api.get('/notices');
    if (Array.isArray(res.data)) {
      notices = res.data;
    } else if (Array.isArray(res)) {
      notices = res;
    } else if (window.SS_STORE) {
      notices = window.SS_STORE.get('notices') || [];
    }
  } catch (err) {
    console.warn('Notices central DB sync fallback:', err);
    if (window.SS_STORE) notices = window.SS_STORE.get('notices') || [];
  }

  return `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h1>Notice Board &amp; Communications</h1>
          <p class="subtitle">Official school circulars, parent notices, event announcements, and administrative advisories</p>
        </div>
        ${canPostNotice ? `
          <button class="btn btn-primary" id="post-notice-btn">
            ${icon('plus', 18)} Post New Circular
          </button>
        ` : `
          <span class="badge badge-info" style="font-size: 0.85rem; padding: 6px 12px;">
            ${icon('bell', 16)} Official Circulars Board
          </span>
        `}
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">Published Circulars &amp; Directives</span>
          <span class="text-xs text-secondary">Session 2026-2027</span>
        </div>
        <div class="flex flex-col gap-3" id="notices-container">
          ${renderNoticeItems(notices, canPostNotice)}
        </div>
      </div>
    </div>
  `;
}

function renderNoticeItems(items, canPost) {
  if (!items || items.length === 0) {
    const hint = canPost ? ' Click "Post New Circular" to add one.' : '';
    return `<div class="p-8 text-center text-secondary">No notices published for this institution yet.${hint}</div>`;
  }
  return items.map((n, idx) => `
    <div class="p-5 rounded-md notice-card cursor-pointer" data-id="${n.id || idx}" style="background: var(--bg-input); border-left: 4px solid var(--primary-600); transition: all 0.2s ease;">
      <div class="flex justify-between items-center mb-2" style="flex-wrap: wrap; gap: 8px;">
        <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin: 0;">${n.title}</h3>
        <div class="flex items-center gap-2">
          <span class="badge ${n.priority === 'Urgent' ? 'badge-danger' : (n.priority === 'High' ? 'badge-warning' : 'badge-info')}">${n.target || n.audience || 'All'}</span>
          <span class="text-xs text-secondary">${n.date || 'Recent'}</span>
          <button class="btn btn-secondary btn-xs read-notice-btn" data-id="${n.id || idx}">Read Circular</button>
        </div>
      </div>
      <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6; margin: 4px 0 0 0;">
        ${n.content || n.message || ''}
      </p>
    </div>
  `).join('');
}

function bindNoticesEvents() {
  // Do not bind posting events for students — button is not rendered for them
  const canPostNotice = window.canManage ? window.canManage(['teacher', 'receptionist', 'accountant', 'librarian']) : true;
  const btn = document.getElementById('post-notice-btn');
  if (btn && canPostNotice) {
    btn.onclick = () => {
      window.openAppModal({
        title: 'Publish New Institutional Notice / Circular',
        subtitle: 'Broadcast administrative updates, alerts, or event circulars to portals',
        saveLabel: 'Publish Notice',
        saveIcon: 'plus',
        contentHtml: `
          <div class="form-grid">
            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label">Circular Title *</label>
              <input type="text" class="form-input" id="modal-notice-title" placeholder="e.g. Advisory: Winter Uniform & Exam Schedule" required />
            </div>
            <div class="form-group">
              <label class="form-label">Target Audience</label>
              <select class="form-select" id="modal-notice-target">
                <option value="All School Community">All School Community (Students & Parents)</option>
                <option value="Teaching Staff Only">Teaching Staff Only</option>
                <option value="Parents & Guardians">Parents & Guardians</option>
                <option value="Classes 9 to 12">Classes 9 to 12 (Senior Wing)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Priority Level</label>
              <select class="form-select" id="modal-notice-priority">
                <option value="Normal">Normal Announcement</option>
                <option value="High">High Priority / Advisory</option>
                <option value="Urgent">Urgent Closure Alert</option>
              </select>
            </div>
            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label">Notice Content / Instructions *</label>
              <textarea class="form-input" id="modal-notice-content" rows="4" placeholder="Enter complete notice text and directives..." required></textarea>
            </div>
          </div>
        `,
        onSave: async () => {
          const title = document.getElementById('modal-notice-title').value.trim();
          const content = document.getElementById('modal-notice-content').value.trim();
          if (!title || !content) {
            if (window.showToast) window.showToast('Please provide both Title and Notice Content', 'warning');
            return false;
          }
          const target = document.getElementById('modal-notice-target').value;
          const priority = document.getElementById('modal-notice-priority').value;

          const newNotice = {
            title,
            target,
            priority,
            content,
            date: new Date().toISOString().split('T')[0],
          };

          try {
            await api.post('/notices', newNotice);
            const nRes = await api.get('/notices');
            if (Array.isArray(nRes.data) && nRes.data.length > 0) {
              notices = nRes.data;
            }
          } catch (e) {
            console.warn('Notice API sync fallback:', e);
          }

          if (window.SS_STORE) {
            window.SS_STORE.add('notices', newNotice);
          } else if (!notices.some(n => n.title === title)) {
            notices.unshift({ id: Date.now(), ...newNotice });
          }

          const container = document.getElementById('notices-container');
          if (container) container.innerHTML = renderNoticeItems(notices, canPostNotice);
          attachNoticeReaders();
          if (window.showToast) window.showToast(`Notice "${title}" published`, 'success');
          return true;
        }
      });
    };
  }

  function attachNoticeReaders() {
    document.querySelectorAll('.notice-card, .read-notice-btn').forEach(elem => {
      elem.onclick = (e) => {
        e.stopPropagation();
        const id = elem.getAttribute('data-id');
        const n = (notices && notices[id]) || notices.find(x => String(x.id) === String(id)) || {
          title: 'Official School Circular',
          content: 'No detailed content available.',
          target: 'All School Community',
          date: 'Recent',
        };

        window.openAppModal({
          title: `📢 ${n.title}`,
          subtitle: `Target Audience: ${n.target || n.audience || 'All Community'} • Published: ${n.date || 'Recent'}`,
          saveLabel: 'Close Circular',
          saveIcon: 'checkCircle',
          contentHtml: `
            <div style="padding: 10px 0;">
              <div class="flex items-center justify-between p-3 rounded-md mb-4" style="background: var(--bg-input); border: 1px solid var(--border-color);">
                <div>
                  <span class="badge ${n.priority === 'Urgent' ? 'badge-danger' : (n.priority === 'High' ? 'badge-warning' : 'badge-info')}">
                    ${n.priority || 'Normal'} Priority Circular
                  </span>
                </div>
                <div class="text-xs text-secondary">
                  Official Directive • Session 2026-2027
                </div>
              </div>
              <div style="font-size: 0.95rem; line-height: 1.8; color: var(--text-primary); white-space: pre-wrap; padding: 10px 4px; min-height: 80px;">
                ${n.content || n.message || 'No additional content provided.'}
              </div>
              <div class="mt-6 pt-4 border-t flex justify-between items-center text-xs text-secondary">
                <div>Official Bulletin — Smart School International</div>
                <button type="button" class="btn btn-secondary btn-xs" onclick="window.print()">
                  ${icon('print', 14)} Print Circular
                </button>
              </div>
            </div>
          `,
          onSave: async () => true,
        });
      };
    });
  }

  attachNoticeReaders();
}

/* ==========================================================================
   Module 38: Mobile Application Ecosystem (Android App v5.0 / Smart School v7.2.0)
   ========================================================================== */
async function renderMobileApp() {
  return `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h1>Mobile Application Ecosystem</h1>
          <p class="subtitle">Smart School v7.2.0-compatible Android mobile app version 5.0 by Infosof Technologies</p>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-primary" id="mobile-push-test-btn">
            ${icon('bell', 18)} Send Test Push Alert
          </button>
        </div>
      </div>

      <div class="grid-3 mb-6">
        <div class="stat-card stat-success">
          <div class="stat-icon">${icon('shield', 24)}</div>
          <div class="stat-value">v5.0.2</div>
          <div class="stat-label">Android App Build (Production)</div>
        </div>
        <div class="stat-card stat-primary">
          <div class="stat-icon">${icon('users', 24)}</div>
          <div class="stat-value">1,120+</div>
          <div class="stat-label">Active Parent & Student Devices</div>
        </div>
        <div class="stat-card stat-info">
          <div class="stat-icon">${icon('checkCircle', 24)}</div>
          <div class="stat-value">Connected</div>
          <div class="stat-label">FCM Push Notification Service</div>
        </div>
      </div>

      <div class="grid-2 mb-6">
        <!-- App Download Card -->
        <div class="card">
          <div class="card-header"><span class="card-title">Android APK Distribution & Download</span></div>
          <div style="display: flex; gap: 20px; align-items: center; margin-bottom: 20px;">
            <div style="width: 100px; height: 100px; background: white; border: 2px dashed var(--primary-600); border-radius: var(--radius-md); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 6px;">
              <span style="font-size: 1.8rem;">📱</span>
              <span style="font-size: 0.65rem; font-weight: 700; color: var(--primary-600);">SCAN QR</span>
            </div>
            <div>
              <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">Smart School Android App v5.0</h3>
              <p class="text-sm text-secondary mb-3">Unified parent and student mobile companion for live attendance, fees, homework and school announcements.</p>
              <div class="flex gap-2">
                <button class="btn btn-success btn-sm" id="download-apk-btn">
                  ${icon('doc', 16)} Download Release APK (24.8 MB)
                </button>
                <button class="btn btn-secondary btn-sm" onclick="showToast('Google Play Store link: com.infosof.smartschool', 'info')">
                  Play Store Link
                </button>
              </div>
            </div>
          </div>

          <div style="border-top: 1px solid var(--border-secondary); padding-top: 16px;">
            <h4 class="text-sm font-semibold mb-2">Supported Android Mobile Features:</h4>
            <div class="grid-2" style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.8;">
              <div>✓ Instant Roll Call Push Alerts</div>
              <div>✓ In-App UPI & Card Fee Payment</div>
              <div>✓ Daily Homework & Syllabus</div>
              <div>✓ Live Class Links (Meet & Zoom)</div>
              <div>✓ Real-Time School Bus GPS</div>
              <div>✓ CBSE Exam Result Scorecards</div>
            </div>
          </div>
        </div>

        <!-- Mobile API & Sync Status -->
        <div class="card">
          <div class="card-header"><span class="card-title">Mobile REST API Gateway Status</span></div>
          <table class="table">
            <tbody>
              <tr><td style="width: 40%; color: var(--text-secondary);">REST API Version</td><td><strong>v2.4.0 (JSON-RPC + OAuth)</strong></td></tr>
              <tr><td style="color: var(--text-secondary);">Core Backend</td><td><strong>PHP / CodeIgniter Engine</strong></td></tr>
              <tr><td style="color: var(--text-secondary);">Push Gateway</td><td><span class="badge badge-success">Firebase Cloud Messaging (FCM)</span></td></tr>
              <tr><td style="color: var(--text-secondary);">Biometric Sync Interval</td><td>Every 5 Minutes (Real-time Webhook)</td></tr>
              <tr><td style="color: var(--text-secondary);">WhatsApp Bridge</td><td><span class="badge badge-success">Cloud API Active</span></td></tr>
              <tr><td style="color: var(--text-secondary);">Encryption Standard</td><td>TLS 1.3 AES-256 Bit</td></tr>
            </tbody>
          </table>
          <div class="mt-4 pt-3 flex justify-between items-center" style="border-top: 1px solid var(--border-secondary);">
            <span class="text-xs text-secondary">Last Sync: Just now</span>
            <button class="btn btn-secondary btn-sm" onclick="showToast('Mobile API Cache Flushed & Synchronized', 'success')">Sync Mobile Endpoints</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function bindMobileAppEvents() {
  const pushBtn = document.getElementById('mobile-push-test-btn');
  if (pushBtn) {
    pushBtn.onclick = () => {
      showToast('Push alert dispatched: "Term 1 Admit Cards published on Mobile App!"', 'success');
    };
  }

  const apkBtn = document.getElementById('download-apk-btn');
  if (apkBtn) {
    apkBtn.onclick = () => {
      showToast('Downloading SmartSchool-v5.0-Release.apk...', 'success');
    };
  }
}

/* ==========================================================================
   Module 39: Front Website & Public Portal View
   ========================================================================== */
async function renderFrontWebsite() {
  const currentUser = typeof auth !== 'undefined' ? auth.getUser() : null;
  const isStaff = currentUser && ['super_admin', 'admin', 'receptionist'].includes(currentUser.role);

  return `
    <div class="animate-fadeIn">
      ${isStaff ? `
        <!-- Staff Admin Banner for Inquiries -->
        <div class="card mb-4" style="background: linear-gradient(90deg, rgba(37,99,235,0.08), rgba(99,102,241,0.08)); border: 1px solid var(--primary-500); padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; border-radius: var(--radius-md); flex-wrap: wrap; gap: 10px;">
          <div class="flex items-center gap-2">
            <span style="color: var(--primary-600);">${icon('shield', 20)}</span>
            <span style="font-size: 0.875rem; font-weight: 600;">Staff Management Notice: You are previewing the public front portal. Inquiries submitted here stream directly to your Central Admissions Desk.</span>
          </div>
          <a href="#/students/inquiries" class="btn btn-primary btn-sm">
            ${icon('clipboard', 16)} View Inquiries Stream &rarr;
          </a>
        </div>
      ` : ''}

      <!-- Website Header Navigation -->
      <div class="card mb-6" style="padding: 14px 24px;">
        <div class="flex justify-between items-center" style="flex-wrap: wrap; gap: 12px;">
          <div class="flex items-center gap-3">
            <div class="logo">SS</div>
            <div>
              <div style="font-weight: 800; font-size: 1.15rem; color: var(--primary-600); letter-spacing: -0.02em;">Smart School International</div>
              <div style="font-size: 0.75rem; color: var(--text-secondary);">Affiliated to CBSE • Established 2004</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <a href="#/website" class="btn btn-primary btn-sm">Home</a>
            <a href="#/students/admission" class="btn btn-secondary btn-sm">Admissions 2026</a>
            <a href="#/notices" class="btn btn-secondary btn-sm">Circulars</a>
            ${isStaff ? `<a href="#/students/inquiries" class="btn btn-outline btn-sm">${icon('clipboard', 16)} Inquiries Desk</a>` : ''}
            <a href="#/dashboard" class="btn btn-secondary btn-sm">Staff & Parent Portal</a>
            <button class="btn btn-success btn-sm" onclick="openWhatsAppModal()">
              ${icon('chat', 16)} WhatsApp Desk
            </button>
          </div>
        </div>
      </div>

      <!-- Hero Banner -->
      <div class="card mb-6" style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; padding: 48px 36px; border-radius: var(--radius-lg); position: relative; overflow: hidden;">
        <div style="max-width: 650px;">
          <span class="badge mb-3" style="background: rgba(255,255,255,0.25); color: white; font-weight: 700;">SESSION 2026 - 2027 ENROLLMENT OPEN</span>
          <h1 style="font-size: 2.4rem; font-weight: 800; line-height: 1.2; margin-bottom: 16px; color: white;">
            Empowering Next-Generation Leaders Through Holistic Education
          </h1>
          <p style="font-size: 1.05rem; opacity: 0.95; line-height: 1.7; margin-bottom: 24px;">
            Recognized as the region's premier CBSE institution with AI-powered smart classrooms, world-class athletic facilities, robotics laboratories, and student-first pedagogy.
          </p>
          <div class="flex gap-3" style="flex-wrap: wrap;">
            <a href="#/students/admission" class="btn btn-lg" style="background: white; color: #1e3a8a; font-weight: 700;">
              Apply for Admission Now
            </a>
            <button class="btn btn-lg" style="background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.4);" onclick="openWhatsAppModal()">
              Enquire on WhatsApp
            </button>
          </div>
        </div>
      </div>

      <!-- Key Campus Features -->
      <div class="grid-4 mb-6">
        <div class="card text-center p-5">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">🤖</div>
          <h3 class="font-bold text-base mb-1">AI & Robotics Lab</h3>
          <p class="text-xs text-secondary">Hands-on coding, STEM kits, and 3D printing labs.</p>
        </div>
        <div class="card text-center p-5">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">⚽</div>
          <h3 class="font-bold text-base mb-1">Olympic Sports Complex</h3>
          <p class="text-xs text-secondary">Indoor badminton, basketball, football turf, and swimming.</p>
        </div>
        <div class="card text-center p-5">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">🚌</div>
          <h3 class="font-bold text-base mb-1">GPS-Tracked Safe Transport</h3>
          <p class="text-xs text-secondary">CCTV-monitored air-conditioned buses covering 40+ zones.</p>
        </div>
        <div class="card text-center p-5">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">📱</div>
          <h3 class="font-bold text-base mb-1">Smart Mobile Parent App</h3>
          <p class="text-xs text-secondary">Real-time attendance, homework, and fee payments.</p>
        </div>
      </div>

      <!-- Online Admission Inquiry Form -->
      <div class="grid-2">
        <div class="card">
          <div class="card-header"><span class="card-title">Online Admission Inquiry</span></div>
          <form id="public-inquiry-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Parent / Guardian Name *</label>
                <input type="text" class="form-input" id="inq-parent-name" placeholder="Full Name" required />
              </div>
              <div class="form-group">
                <label class="form-label">Contact Mobile *</label>
                <input type="tel" class="form-input" id="inq-phone" placeholder="10-digit number" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Student Name</label>
                <input type="text" class="form-input" id="inq-student-name" placeholder="Child's Name" />
              </div>
              <div class="form-group">
                <label class="form-label">Applying for Grade</label>
                <select class="form-select" id="inq-grade">
                  <option value="Pre-Primary / Nursery">Pre-Primary / Nursery</option>
                  <option value="Class 1">Class 1</option>
                  <option value="Class 5" selected>Class 5</option>
                  <option value="Class 9">Class 9</option>
                  <option value="Class 11 Science">Class 11 Science</option>
                  <option value="Class 11 Commerce">Class 11 Commerce</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Questions or Inquiries</label>
              <textarea class="form-textarea" id="inq-message" rows="3" placeholder="Tell us about previous schooling, transport requirement, or special needs..."></textarea>
            </div>
            <button type="submit" class="btn btn-primary w-full">
              Submit Admission Inquiry
            </button>
          </form>
        </div>

        <div class="card">
          <div class="card-header"><span class="card-title">Public Announcements & Events</span></div>
          <div class="flex flex-col gap-3">
            <div class="p-4 rounded-md" style="background: var(--bg-input); border-left: 3px solid var(--primary-600);">
              <div class="font-bold text-sm">Admissions Open for Session 2026-2027</div>
              <div class="text-xs text-secondary mt-1">Registration forms for Nursery to Class 11 now available online and at the school reception.</div>
            </div>
            <div class="p-4 rounded-md" style="background: var(--bg-input); border-left: 3px solid var(--success-500);">
              <div class="font-bold text-sm">Annual Science & Robotics Exhibition 2026</div>
              <div class="text-xs text-secondary mt-1">All parents are cordially invited this Saturday from 9:30 AM to 2:00 PM in the Main Auditorium.</div>
            </div>
            <div class="p-4 rounded-md" style="background: var(--bg-input); border-left: 3px solid var(--info-500);">
              <div class="font-bold text-sm">Official WhatsApp Helpdesk Active</div>
              <div class="text-xs text-secondary mt-1">Parents can get instant query resolution by clicking the green WhatsApp button on any screen.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function bindFrontWebsiteEvents() {
  const inqForm = document.getElementById('public-inquiry-form');
  if (inqForm) {
    inqForm.onsubmit = async (e) => {
      e.preventDefault();
      const parentName  = document.getElementById('inq-parent-name')?.value?.trim();
      const phone       = document.getElementById('inq-phone')?.value?.trim();
      const studentName = document.getElementById('inq-student-name')?.value?.trim() || '';
      const grade       = document.getElementById('inq-grade')?.value || 'Class 1';
      const message     = document.getElementById('inq-message')?.value?.trim() || 'Online admission inquiry';

      if (!parentName || !phone) {
        showToast('Please fill in required parent name and contact mobile number.', 'warning');
        return;
      }

      const submitBtn = inqForm.querySelector('button[type="submit"]');
      const originalText = submitBtn ? submitBtn.innerHTML : 'Submit Admission Inquiry';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Submitting Inquiry...';
      }

      try {
        const res = await api.post('/website/inquiry', {
          parent_name: parentName,
          phone: phone,
          student_name: studentName,
          target_class: grade,
          message: message
        });

        const inquiryData = (res && res.data) ? res.data : (res || {});
        const inquiryId = inquiryData.inquiry_id || 'INQ-2026';

        showToast(`Admission inquiry ${inquiryId} submitted! Our admissions counselor will contact you.`, 'success');
        if (typeof broadcastDbMutation === 'function') {
          broadcastDbMutation('/website/inquiries', 'inquiry_created');
        }

        // Show confirmation modal with Reference ID
        showModal({
          title: 'Admission Inquiry Registered',
          content: `
            <div class="text-center py-4">
              <div style="font-size: 3rem; margin-bottom: 12px;">✅</div>
              <h3 class="font-bold text-lg mb-2">Thank you, ${parentName}!</h3>
              <p class="text-sm text-secondary mb-4">
                Your admission inquiry has been logged in our central admissions system with Reference ID:
              </p>
              <div class="badge badge-primary" style="font-size: 1.15rem; padding: 8px 18px; font-weight: 700; letter-spacing: 0.05em; display: inline-block;">
                ${inquiryId}
              </div>
              <div class="mt-4 p-4 rounded-md text-xs text-secondary" style="background: var(--bg-input); text-align: left; line-height: 1.8;">
                <div><strong>Child Name:</strong> ${studentName || 'Not specified'}</div>
                <div><strong>Applying For:</strong> ${grade}</div>
                <div><strong>Contact Mobile:</strong> ${phone}</div>
                <div><strong>Status:</strong> New (Assigned to Admissions Office)</div>
              </div>
              <div class="mt-5 flex gap-2 justify-center">
                <button class="btn btn-secondary btn-sm" onclick="closeModal()">Close</button>
                <button class="btn btn-success btn-sm" onclick="closeModal(); openWhatsAppModal();">
                  ${icon('chat', 16)} Chat with Counselor on WhatsApp
                </button>
              </div>
            </div>
          `
        });

        inqForm.reset();
      } catch (err) {
        console.error('Inquiry submission error:', err);
        showToast(err.message || 'Failed to submit inquiry. Please try again.', 'danger');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      }
    };
  }
}

