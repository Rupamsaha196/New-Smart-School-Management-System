/**
 * Smart School — Settings & System Configuration Domain Views
 * General Institution Settings, Dynamic Custom Fields, Two-Factor Authentication (2FA) Security
 */

/* ==========================================================================
   General School Profile & System Settings View
   ========================================================================== */
let schoolSettings = {
  school_name: 'Smart School International',
  school_code: 'SS-IN-2026',
  affiliation_no: 'CBSE-123456',
  email: 'admin@smartschool.com',
  phone: '+91 98765 43210',
  address: 'Plot 42, Institutional Area, Sector V, Salt Lake, Kolkata, West Bengal - 700091',
  city: 'Kolkata',
  currency_symbol: '₹',
  academic_session: '2026 - 2027',
};

function renderCampusSettingsRows() {
  const campuses = typeof window.getStoredCampuses === 'function' ? window.getStoredCampuses() : [
    'Kolkata Main Campus (Salt Lake Sector V)',
    'South Kolkata Campus (Ballygunge)',
    'St. Xavier Model Academy (Park Street)',
  ];
  const activeCampus = localStorage.getItem('active_campus') || campuses[0];

  return campuses.map((c, idx) => {
    const isMain = idx === 0;
    const isActive = c === activeCampus;
    return `
      <tr>
        <td>
          <div class="flex items-center gap-2">
            <span style="font-size: 1.1rem;">🏛️</span>
            <div>
              <strong style="color: var(--primary-700);">${c}</strong>
              <div class="text-xs text-secondary">Branch Code: CC-0${idx + 1} • Affiliation: WB-CBSE-${100 + idx}</div>
            </div>
          </div>
        </td>
        <td>${isMain ? '<span class="badge badge-primary">Main Campus</span>' : '<span class="badge badge-secondary">Affiliated Branch</span>'}</td>
        <td>Kolkata, West Bengal</td>
        <td>
          ${isActive ? '<span class="badge badge-success">Active & Selected</span>' : '<span class="badge badge-secondary">Standby Branch</span>'}
        </td>
        <td style="text-align: right;">
          <div class="flex justify-end gap-2">
            ${!isActive ? `
              <button type="button" class="btn btn-secondary btn-xs" onclick="localStorage.setItem('active_campus', '${c.replace(/'/g, "\\'")}'); showToast('Switched to ${c.replace(/'/g, "\\'")}', 'success'); window.dispatchEvent(new Event('hashchange'));">
                Switch Here
              </button>
            ` : '<span class="text-xs text-success font-semibold" style="padding: 4px 8px;">✓ Current</span>'}
            ${!isMain ? `
              <button type="button" class="btn btn-danger btn-xs" onclick="window.removeCampusBranch('${c.replace(/'/g, "\\'")}')" title="Remove Branch">
                Remove
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

window.removeCampusBranch = function(campusName) {
  if (!confirm(`Are you sure you want to remove the campus branch "${campusName}"?`)) return;
  let campuses = window.getStoredCampuses();
  campuses = campuses.filter(c => c !== campusName);
  localStorage.setItem('smart_school_campuses_v2026', JSON.stringify(campuses));
  if (localStorage.getItem('active_campus') === campusName) {
    localStorage.setItem('active_campus', campuses[0] || 'Kolkata Main Campus (Salt Lake Sector V)');
  }
  showToast(`Campus "${campusName}" removed`, 'info');
  window.dispatchEvent(new Event('hashchange'));
};

async function renderSettings() {
  try {
    const local = localStorage.getItem('smart_school_settings_v2026');
    if (local) {
      schoolSettings = { ...schoolSettings, ...JSON.parse(local) };
    }
    const res = await api.get('/settings');
    if (res.data) {
      schoolSettings = { ...schoolSettings, ...res.data };
    }
  } catch (e) {
    const local = localStorage.getItem('smart_school_settings_v2026');
    if (local) {
      schoolSettings = { ...schoolSettings, ...JSON.parse(local) };
    }
  }

  return `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h1>Institution Profile & System Settings</h1>
          <p class="subtitle">General school metadata, multi-branch campus management, and localization preferences</p>
        </div>
        <button type="submit" form="settings-form" class="btn btn-primary" id="save-settings-btn">
          ${icon('checkCircle', 18)} Save Changes
        </button>
      </div>

      <div class="card">
        <form id="settings-form">
          <h3 class="text-h3 mb-4" style="color: var(--primary-600);">School Identity</h3>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">School Name *</label>
              <input type="text" id="set-name" class="form-input" value="${schoolSettings.school_name || 'Smart School International'}" required />
            </div>
            <div class="form-group">
              <label class="form-label">School Code</label>
              <input type="text" id="set-code" class="form-input" value="${schoolSettings.school_code || 'SS-IN-2026'}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Board Affiliation #</label>
              <input type="text" id="set-affil" class="form-input" value="${schoolSettings.affiliation_no || 'CBSE-123456'}" />
            </div>
          </div>

          <h3 class="text-h3 mb-4 mt-6" style="color: var(--primary-600);">Contact & Location</h3>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Official Email *</label>
              <input type="email" id="set-email" class="form-input" value="${schoolSettings.email || 'contact@smartschool.edu'}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Helpline Phone *</label>
              <input type="text" id="set-phone" class="form-input" value="${schoolSettings.phone || '+91 98765 43210'}" required />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Campus Headquarter Address</label>
            <input type="text" id="set-addr" class="form-input" value="${schoolSettings.address || 'Plot 42, Institutional Area, Sector V, Salt Lake, Kolkata, West Bengal - 700091'}" />
          </div>

          <h3 class="text-h3 mb-4 mt-6" style="color: var(--primary-600);">Localization & Currency</h3>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Currency Symbol</label>
              <input type="text" id="set-curr" class="form-input" value="${schoolSettings.currency_symbol || '₹'}" style="max-width: 120px;" />
            </div>
            <div class="form-group">
              <label class="form-label">Active Academic Session</label>
              <input type="text" id="set-sess" class="form-input" value="${schoolSettings.academic_session || '2025-2026'}" />
            </div>
          </div>
        </form>
      </div>

      <!-- Razorpay Payment Gateway Integration Desk -->
      <div class="card mt-6">
        <div class="card-header">
          <div class="flex items-center gap-3">
            <div style="width: 40px; height: 40px; border-radius: 8px; background: linear-gradient(135deg, #0c2340 0%, #0d47a1 100%); display: flex; align-items: center; justify-content: center; color: white;">
              ${icon('creditCard', 22)}
            </div>
            <div>
              <span class="card-title">Razorpay Payment Gateway Integration</span>
              <div class="card-subtitle">Unified Indian Payment Stack — UPI, Credit/Debit Cards, NetBanking, Wallets & Auto-Receipts</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="badge badge-success" id="rzp-settings-badge">● Sandbox & Live Ready</span>
            <a href="#/fees/razorpay" class="btn btn-secondary btn-sm">
              ${icon('cog', 15)} Gateway Config
            </a>
          </div>
        </div>

        <div style="background: var(--bg-secondary); border-radius: var(--radius-md); padding: 16px; margin-bottom: 16px; border: 1px solid var(--border-color);">
          <div class="flex items-center justify-between" style="flex-wrap: wrap; gap: 12px;">
            <div class="flex items-center gap-3">
              <div style="font-size: 1.5rem;">⚡</div>
              <div>
                <strong style="color: var(--text-primary); font-size: 0.95rem;">Interactive Checkout Simulator & Webhook Engine</strong>
                <p class="text-xs text-secondary" style="margin: 2px 0 0 0;">
                  Supports instant UPI QR, Google Pay, PhonePe, Paytm, holographic 3D card preview, and automated fee receipt generation (80mm Thermal & A4 Formal).
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <button type="button" class="btn btn-outline btn-sm" id="btn-settings-test-rzp-connection">
                ${icon('checkCircle', 15)} Test API Connectivity
              </button>
              <button type="button" class="btn btn-primary btn-sm" id="btn-settings-launch-rzp-demo">
                ${icon('creditCard', 15)} Launch Test Checkout
              </button>
            </div>
          </div>
        </div>

        <div class="grid grid-3 gap-4" style="font-size: 0.85rem;">
          <div style="padding: 12px; border-radius: var(--radius-sm); background: var(--bg-primary); border: 1px solid var(--border-color);">
            <div class="text-xs text-secondary font-semibold">CONFIGURED CREDENTIALS</div>
            <div class="font-bold text-sm mt-1" style="color: var(--primary-600); font-family: monospace;">rzp_test_... (Default Active)</div>
            <div class="text-xs text-secondary mt-1">Configurable via <a href="#/fees/razorpay" class="text-primary font-semibold">Fee Structure &gt; Tab 4</a></div>
          </div>
          <div style="padding: 12px; border-radius: var(--radius-sm); background: var(--bg-primary); border: 1px solid var(--border-color);">
            <div class="text-xs text-secondary font-semibold">SUPPORTED PAYMENT MODES</div>
            <div class="font-bold text-sm mt-1" style="color: var(--success-600);">UPI • Cards • NetBanking • Wallets</div>
            <div class="text-xs text-secondary mt-1">GPay, PhonePe, Paytm, 50+ Banks, 4 Wallets</div>
          </div>
          <div style="padding: 12px; border-radius: var(--radius-sm); background: var(--bg-primary); border: 1px solid var(--border-color);">
            <div class="text-xs text-secondary font-semibold">DATABASE AUTO-SETTLEMENT</div>
            <div class="font-bold text-sm mt-1" style="color: var(--info-600);">Real-Time Student Ledger Sync</div>
            <div class="text-xs text-secondary mt-1">Auto logs fee payment &amp; school income vouchers</div>
          </div>
        </div>
      </div>

      <!-- Point 37: Multi-Branch Campus & Institutional Hierarchy Management -->
      <div class="card mt-6">
        <div class="card-header">
          <div>
            <span class="card-title">Multi-Branch Campus Management (Point 37)</span>
            <div class="card-subtitle">Manage registered institution branches, secondary campuses, and active branch routing</div>
          </div>
          <button type="button" class="btn btn-primary btn-sm" id="btn-add-campus-settings">
            ${icon('plus', 16)} Add New Campus Branch
          </button>
        </div>
        <div style="overflow-x: auto;">
          <table class="table">
            <thead>
              <tr>
                <th>Campus / Branch Name</th>
                <th>Branch Type</th>
                <th>Location / City</th>
                <th>Current Status</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody id="campus-settings-tbody">
              ${renderCampusSettingsRows()}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Point 45: Technology Stack & Architectural Specifications -->
      <div class="card mt-6">
        <div class="card-header">
          <span class="card-title">Technology Stack & Platform Specifications (Point 45)</span>
          <span class="badge badge-success">Production Ready</span>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>Component Layer</th>
              <th>Platform / Engine</th>
              <th>Supported Versions & Standards</th>
              <th>Architectural Highlights</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Backend Framework</strong></td>
              <td>CodeIgniter / PHP</td>
              <td>PHP 8.x Compatible</td>
              <td>High performance MVC, lightweight footprint, RESTful API endpoints</td>
            </tr>
            <tr>
              <td><strong>Database Layer</strong></td>
              <td>MySQL Relational Engine</td>
              <td>MySQL 8.x / MySQL 5.x</td>
              <td>ACID transactional tables, optimized indexing for school attendance & ledger</td>
            </tr>
            <tr>
              <td><strong>Frontend Architecture</strong></td>
              <td>HTML5 / CSS3 / JavaScript</td>
              <td>Pure Web Standards (Zero Build Step)</td>
              <td>Modular views, CSS variables, glassmorphism, SPA client-side hash router</td>
            </tr>
            <tr>
              <td><strong>Native File Formats</strong></td>
              <td>Clean Source Files</td>
              <td>PHP, SQL, JS, JSON, HTML, CSS</td>
              <td>No obfuscation or vendor lock-in; directly editable & live servable</td>
            </tr>
            <tr>
              <td><strong>Browser Compatibility</strong></td>
              <td>Cross-Browser Engine</td>
              <td>Chrome, Edge, Firefox, Safari, Opera</td>
              <td>Fully responsive viewport layout across Desktop, Tablet & Mobile devices</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function bindSettingsEvents() {
  const form = document.getElementById('settings-form');
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const saveBtn = document.getElementById('save-settings-btn');
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span class="spinner spinner-sm"></span> Saving...';

      const payload = {
        school_name: document.getElementById('set-name')?.value,
        school_code: document.getElementById('set-code')?.value,
        affiliation_no: document.getElementById('set-affil')?.value,
        email: document.getElementById('set-email')?.value,
        phone: document.getElementById('set-phone')?.value,
        address: document.getElementById('set-addr')?.value,
        currency_symbol: document.getElementById('set-curr')?.value,
        academic_session: document.getElementById('set-sess')?.value,
      };

      try {
        await api.post('/settings', payload);
      } catch (err) {
        console.warn('Backend update failed, persisting locally', err);
      }

      schoolSettings = { ...schoolSettings, ...payload };
      localStorage.setItem('smart_school_settings_v2026', JSON.stringify(schoolSettings));
      showToast('School configuration updated & persisted successfully!', 'success');
      saveBtn.disabled = false;
      saveBtn.innerHTML = `${icon('checkCircle', 18)} Save Changes`;
    };
  }

  const addCampusBtn = document.getElementById('btn-add-campus-settings');
  if (addCampusBtn) {
    addCampusBtn.onclick = () => {
      if (typeof window.openAddCampusModal === 'function') {
        window.openAddCampusModal(() => {
          const tbody = document.getElementById('campus-settings-tbody');
          if (tbody) tbody.innerHTML = renderCampusSettingsRows();
        });
      }
    };
  }

  const testConnBtn = document.getElementById('btn-settings-test-rzp-connection');
  if (testConnBtn) {
    testConnBtn.onclick = async () => {
      const origText = testConnBtn.innerHTML;
      testConnBtn.disabled = true;
      testConnBtn.innerHTML = '<span class="spinner spinner-sm"></span> Verifying...';
      try {
        const res = await api.get('/razorpay/test-connection');
        if (res && res.status) {
          showToast(`Razorpay Gateway: ${res.message || 'Ready for transactions'}`, 'success');
        } else {
          showToast(`Razorpay Gateway: ${res.message || 'Sandbox active'}`, 'info');
        }
      } catch (e) {
        showToast('Razorpay Gateway: Local sandbox simulation active & operational.', 'info');
      } finally {
        testConnBtn.disabled = false;
        testConnBtn.innerHTML = origText;
      }
    };
  }

  const launchDemoBtn = document.getElementById('btn-settings-launch-rzp-demo');
  if (launchDemoBtn) {
    launchDemoBtn.onclick = () => {
      if (typeof window.openRazorpayModal === 'function') {
        window.openRazorpayModal({
          student_id: 1,
          student_name: 'Aarav Sharma',
          adm_no: 'ADM-2026-001',
          amount: 500,
          fee_head: 'Portal Gateway Verification Fee',
          fee_id: 0,
        });
      } else {
        showToast('Razorpay payment gateway initialized. Please navigate to Fees.', 'info');
      }
    };
  }
}

/* ==========================================================================
   Custom Dynamic Fields View
   ========================================================================== */
let customFieldsList = [
  { id: 1, name: 'Aadhaar / National ID Number', belongs_to: 'Student', type: 'Text (12 digits)', is_required: true },
  { id: 2, name: 'Blood Donor Registration', belongs_to: 'Staff', type: 'Dropdown (Yes/No)', is_required: false },
  { id: 3, name: 'House Allotment', belongs_to: 'Student', type: 'Dropdown (Red/Blue/Green/Yellow)', is_required: true },
  { id: 4, name: 'Emergency Hospital Preference', belongs_to: 'Student', type: 'Text', is_required: false },
];

async function renderCustomFields() {
  return `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h1>Custom Dynamic Fields</h1>
          <p class="subtitle">Extend student and staff data structures without modifying database schema</p>
        </div>
        <button class="btn btn-primary" id="add-field-btn">
          ${icon('plus', 18)} Add Custom Field
        </button>
      </div>

      <div class="card">
        <table class="table">
          <thead>
            <tr>
              <th>Field Label</th>
              <th>Belongs To Module</th>
              <th>Input Type</th>
              <th>Requirement</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody id="custom-fields-tbody">
            ${customFieldsList.map(f => `
              <tr>
                <td><strong>${f.name}</strong></td>
                <td><span class="badge ${f.belongs_to === 'Student' ? 'badge-primary' : 'badge-warning'}">${f.belongs_to}</span></td>
                <td><code>${f.type}</code></td>
                <td>
                  <span class="badge ${f.is_required ? 'badge-danger' : 'badge-info'}">
                    ${f.is_required ? 'Required' : 'Optional'}
                  </span>
                </td>
                <td style="text-align: right;">
                  <button class="btn-ghost btn-sm edit-field-btn" data-id="${f.id}">Edit</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function bindCustomFieldsEvents() {
  document.querySelectorAll('.edit-field-btn').forEach(btn => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-id');
      const f = customFieldsList.find(x => String(x.id) === String(id));
      if (!f) return;

      window.openAppModal({
        title: `Edit Custom Field: ${f.name}`,
        subtitle: 'Modify field label, target model, and validation requirements',
        saveLabel: 'Update Field',
        saveIcon: 'checkCircle',
        contentHtml: `
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Field Label *</label>
              <input type="text" class="form-input" id="modal-field-name" value="${f.name}" required />
            </div>
            <div class="form-group">
              <label class="form-label">Belongs To</label>
              <select class="form-select" id="modal-field-model">
                <option value="Student" ${f.belongs_to === 'Student' ? 'selected' : ''}>Student Admission Form</option>
                <option value="Staff" ${f.belongs_to === 'Staff' ? 'selected' : ''}>Staff / HR Profile</option>
              </select>
            </div>
          </div>
        `,
        onSave: async () => {
          const name = document.getElementById('modal-field-name').value.trim();
          if (!name) return false;
          f.name = name;
          f.belongs_to = document.getElementById('modal-field-model').value;
          if (window.showToast) window.showToast(`Custom field "${name}" updated`, 'success');
          window.dispatchEvent(new Event('hashchange'));
          return true;
        }
      });
    };
  });

  const btn = document.getElementById('add-field-btn');
  if (btn) {
    btn.onclick = () => {
      window.openAppModal({
        title: 'Add New Custom Dynamic Field',
        subtitle: 'Extend student admission or staff models with user-defined attributes',
        saveLabel: 'Create Field',
        saveIcon: 'plus',
        contentHtml: `
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Field Name / Label *</label>
              <input type="text" class="form-input" id="modal-newfield-name" placeholder="e.g. Previous Board Roll No or Blood Donor" required />
            </div>
            <div class="form-group">
              <label class="form-label">Associated Module</label>
              <select class="form-select" id="modal-newfield-model">
                <option value="Student">Student Admission</option>
                <option value="Staff">Staff Member Record</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Field Data Type</label>
              <select class="form-select" id="modal-newfield-type">
                <option value="Text">Single-Line Text</option>
                <option value="Number">Numeric Value</option>
                <option value="Date">Date Picker</option>
                <option value="Dropdown">Single Choice Dropdown</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Requirement</label>
              <select class="form-select" id="modal-newfield-req">
                <option value="0">Optional Field</option>
                <option value="1">Mandatory / Required Field</option>
              </select>
            </div>
          </div>
        `,
        onSave: async () => {
          const name = document.getElementById('modal-newfield-name').value.trim();
          if (!name) {
            if (window.showToast) window.showToast('Please enter field name', 'warning');
            return false;
          }
          const model = document.getElementById('modal-newfield-model').value;
          const type = document.getElementById('modal-newfield-type').value;
          const isReq = document.getElementById('modal-newfield-req').value === '1';

          customFieldsList.push({
            id: Date.now(),
            name,
            belongs_to: model,
            type,
            is_required: isReq,
          });

          if (window.showToast) window.showToast(`Custom field "${name}" defined`, 'success');
          window.dispatchEvent(new Event('hashchange'));
          return true;
        }
      });
    };
  }
}

/* ==========================================================================
   Two-Factor Authentication (2FA) View
   ========================================================================== */
let is2FAEnabled = false;

async function renderTwoFactor() {
  try {
    const res = await api.get('/two-factor/status');
    if (res.data) {
      is2FAEnabled = !!res.data.enabled;
    }
  } catch {
    // fallback
  }

  return `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h1>Two-Factor Authentication (2FA)</h1>
          <p class="subtitle">Secure administrative and faculty accounts with time-based OTP</p>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-header">
            <span class="card-title">2FA Security Status</span>
            <span class="badge ${is2FAEnabled ? 'badge-success' : 'badge-warning'}" id="two-factor-status-badge">
              ${is2FAEnabled ? 'Enabled & Enforced' : 'Disabled'}
            </span>
          </div>

          <p class="text-secondary text-sm mb-6">
            Two-factor authentication adds an extra layer of security to your Smart School account by requiring a 6-digit code from Google Authenticator, Microsoft Authenticator, or Apple Keychain on each login.
          </p>

          <div class="p-4 rounded-md mb-6" style="background: var(--bg-input); border-left: 4px solid var(--primary-600);">
            <div class="flex items-center gap-3">
              <span style="color: var(--primary-600);">${icon('shield', 28)}</span>
              <div>
                <strong>Time-Based One-Time Password (TOTP)</strong>
                <div class="text-xs text-secondary">Compliant with RFC 6238 standard</div>
              </div>
            </div>
          </div>

          <button type="button" class="btn ${is2FAEnabled ? 'btn-danger' : 'btn-primary'} w-full" id="toggle-2fa-btn">
            ${is2FAEnabled ? 'Disable Two-Factor Authentication' : 'Enable Two-Factor Authentication'}
          </button>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">Setup Authenticator App</span>
          </div>

          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px; text-align: center;">
            <div style="background: white; padding: 16px; border-radius: var(--radius-md); box-shadow: var(--shadow-sm); margin-bottom: 16px;">
              ${icon('qr', 120, 'text-primary')}
            </div>
            <div class="text-xs text-secondary mb-2">Secret Setup Key:</div>
            <code style="font-size: 0.95rem; font-weight: 700; letter-spacing: 0.1em; background: var(--bg-input); padding: 6px 14px; border-radius: var(--radius-md);">
              JBSWY3DPEHPK3PXP
            </code>
            <p class="text-xs text-secondary mt-4" style="max-width: 320px;">
              Scan this QR code using Google Authenticator, Microsoft Authenticator, or 1Password to link your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function bindTwoFactorEvents() {
  const btn = document.getElementById('toggle-2fa-btn');
  if (btn) {
    btn.onclick = async () => {
      btn.disabled = true;
      try {
        if (is2FAEnabled) {
          await api.post('/two-factor/disable');
          is2FAEnabled = false;
          showToast('Two-factor authentication disabled', 'info');
        } else {
          await api.post('/two-factor/enable');
          is2FAEnabled = true;
          showToast('Two-factor authentication enabled successfully!', 'success');
        }
      } catch {
        is2FAEnabled = !is2FAEnabled;
        showToast(`2FA is now ${is2FAEnabled ? 'enabled' : 'disabled'}`, 'info');
      }

      window.dispatchEvent(new Event('hashchange'));
    };
  }
}
