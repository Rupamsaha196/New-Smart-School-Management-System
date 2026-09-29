const DEFAULT_FEE_TYPES = [
  { id: 1, name: 'Tuition Fee (Quarterly)', code: 'TUIT_QTR', applicable: 'All Classes (Nursery to 12)', frequency: 'Quarterly', due_day: '10th of Term', amount: '₹12,500' },
  { id: 2, name: 'Annual Development & IT Charges', code: 'DEV_ANN', applicable: 'All Classes', frequency: 'Annual', due_day: '15th April', amount: '₹8,500' },
  { id: 3, name: 'Science Laboratory & STEM Fee', code: 'SCI_LAB', applicable: 'Classes 9 to 12', frequency: 'Per Term', due_day: '10th of Term', amount: '₹3,200' },
  { id: 4, name: 'Transport Fleet Facility Fee', code: 'TRANS_MON', applicable: 'Bus Commuters', frequency: 'Monthly', due_day: '7th of Month', amount: '₹2,500' },
  { id: 5, name: 'Hostel Accommodation & Boarding', code: 'HOST_TRM', applicable: 'Resident Boarders', frequency: 'Per Term', due_day: '1st of Quarter', amount: '₹28,000' },
  { id: 6, name: 'CBSE Examination & Board Charges', code: 'EXAM_CBSE', applicable: 'Classes 10 & 12', frequency: 'Annual', due_day: '1st Nov', amount: '₹2,200' },
];

const DEFAULT_FINE_RULES = [
  { id: 1, fee_head: 'Tuition Fee (Quarterly)', due_day: '10th of Month', grace_period: '5 Days', rule_type: 'Per-Day Rule', fine_amount: '₹20 / Day after due date', status: 'Active', applies_to: 'All Classes' },
  { id: 2, fee_head: 'Annual Charges & Activity', due_day: '15th April', grace_period: '7 Days', rule_type: 'Fixed Fine', fine_amount: '₹250 Flat Fine', status: 'Active', applies_to: 'All Classes' },
  { id: 3, fee_head: 'Transport Route Fee', due_day: '7th of Month', grace_period: '3 Days', rule_type: 'Per-Day Rule', fine_amount: '₹15 / Day after due date', status: 'Active', applies_to: 'Bus Commuters' },
];

const DEFAULT_DISCOUNTS = [
  { id: 1, name: 'Sibling Concession', code: 'DISC_SIB20', type: 'Percentage', value: '20%', expiry: '2027-03-31', repeats: 'Every Term', applies_to: 'Students with active enrolled brother/sister' },
  { id: 2, name: 'Right to Education (RTE) Full Waiver', code: 'DISC_RTE100', type: 'Full Waiver', value: '100%', expiry: '2027-03-31', repeats: 'Annual', applies_to: 'Verified RTE quota admitted students' },
  { id: 3, name: 'Merit Academic Scholarship', code: 'DISC_MERIT25', type: 'Percentage', value: '25%', expiry: '2026-12-31', repeats: 'Per Term', applies_to: 'Score > 90% in previous annual board exam' },
  { id: 4, name: 'Staff Child Educational Benefit', code: 'DISC_STAFF50', type: 'Percentage', value: '50%', expiry: '2027-03-31', repeats: 'Every Term', applies_to: 'Children of full-time teachers & staff' },
];

function getStoredFeeTypes() {
  try {
    const s = localStorage.getItem('smart_school_fee_heads');
    if (s) {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [...DEFAULT_FEE_TYPES];
}

function saveFeeTypes(list) {
  feeTypes = list;
  try { localStorage.setItem('smart_school_fee_heads', JSON.stringify(list)); } catch {}
}

function getStoredFineRules() {
  try {
    const s = localStorage.getItem('smart_school_fine_rules');
    if (s) {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [...DEFAULT_FINE_RULES];
}

function saveFineRules(list) {
  fineRulesList = list;
  try { localStorage.setItem('smart_school_fine_rules', JSON.stringify(list)); } catch {}
}

function getStoredDiscounts() {
  try {
    const s = localStorage.getItem('smart_school_fee_discounts');
    if (s) {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [...DEFAULT_DISCOUNTS];
}

function saveDiscounts(list) {
  feeDiscountsList = list;
  try { localStorage.setItem('smart_school_fee_discounts', JSON.stringify(list)); } catch {}
}

let feeTypes = getStoredFeeTypes();
let fineRulesList = getStoredFineRules();
let feeDiscountsList = getStoredDiscounts();

window.getFeeHeadOptions = function() {
  return feeTypes.map(f => f.name);
};

function renderFeeMastersRows() {
  return feeTypes.map(f => `
    <tr>
      <td><strong>${f.name}</strong></td>
      <td><code>${f.code}</code></td>
      <td>${f.applicable || 'All Classes'}</td>
      <td><span class="badge badge-info">${f.frequency || 'Quarterly'}</span></td>
      <td class="text-secondary">${f.due_day || '10th of Term'}</td>
      <td><strong style="color: var(--primary-600); font-size: 1rem;">${f.amount}</strong></td>
      <td>
        <button type="button" class="btn btn-secondary btn-xs" style="color: var(--danger-500); padding: 4px 8px; font-size: 0.75rem;" onclick="window.deleteFeeHead(${f.id})" title="Remove Fee Head">
          ✕ Remove
        </button>
      </td>
    </tr>
  `).join('');
}

function renderFineRulesRows() {
  return fineRulesList.map(r => `
    <tr>
      <td><strong>${r.fee_head}</strong></td>
      <td>${r.due_day}</td>
      <td><span class="badge badge-secondary">${r.grace_period}</span></td>
      <td>${r.rule_type}</td>
      <td><strong style="color: var(--danger-500);">${r.fine_amount}</strong></td>
      <td>
        <span class="badge ${r.status === 'Active' ? 'badge-success' : 'badge-danger'}" style="cursor: pointer;" onclick="window.toggleFineRuleStatus(${r.id})" title="Click to toggle status">
          ${r.status}
        </span>
      </td>
      <td>
        <button type="button" class="btn btn-secondary btn-xs" style="color: var(--danger-500); padding: 4px 8px; font-size: 0.75rem;" onclick="window.deleteFineRule(${r.id})" title="Remove Fine Rule">
          ✕ Remove
        </button>
      </td>
    </tr>
  `).join('');
}

function renderDiscountsRows() {
  return feeDiscountsList.map(d => `
    <tr>
      <td><strong>${d.name}</strong></td>
      <td><code>${d.code}</code></td>
      <td><span class="badge badge-success" style="font-size: 0.9rem;">${d.value}</span></td>
      <td>${d.repeats}</td>
      <td class="text-secondary">${d.expiry}</td>
      <td class="text-sm">${d.applies_to}</td>
      <td>
        <button type="button" class="btn btn-secondary btn-xs" style="color: var(--danger-500); padding: 4px 8px; font-size: 0.75rem;" onclick="window.deleteFeeDiscount(${d.id})" title="Remove Discount">
          ✕ Remove
        </button>
      </td>
    </tr>
  `).join('');
}

window.deleteFeeHead = function(id) {
  if (!confirm('Are you sure you want to remove this fee head?')) return;
  const filtered = feeTypes.filter(f => f.id != id);
  saveFeeTypes(filtered);
  const tbody = document.getElementById('fee-structure-tbody');
  if (tbody) tbody.innerHTML = renderFeeMastersRows();
  if (window.showToast) window.showToast('Fee head removed successfully', 'info');
};

window.deleteFineRule = function(id) {
  if (!confirm('Are you sure you want to remove this fine rule?')) return;
  const filtered = fineRulesList.filter(r => r.id != id);
  saveFineRules(filtered);
  const tbody = document.getElementById('fine-rules-tbody');
  if (tbody) tbody.innerHTML = renderFineRulesRows();
  if (window.showToast) window.showToast('Fine rule removed successfully', 'info');
};

window.toggleFineRuleStatus = function(id) {
  const item = fineRulesList.find(r => r.id == id);
  if (item) {
    item.status = (item.status === 'Active') ? 'Inactive' : 'Active';
    saveFineRules([...fineRulesList]);
    const tbody = document.getElementById('fine-rules-tbody');
    if (tbody) tbody.innerHTML = renderFineRulesRows();
    if (window.showToast) window.showToast(`Fine rule marked as ${item.status}`, 'success');
  }
};

window.deleteFeeDiscount = function(id) {
  if (!confirm('Are you sure you want to remove this discount?')) return;
  const filtered = feeDiscountsList.filter(d => d.id != id);
  saveDiscounts(filtered);
  const tbody = document.getElementById('fee-discounts-tbody');
  if (tbody) tbody.innerHTML = renderDiscountsRows();
  if (window.showToast) window.showToast('Discount removed successfully', 'info');
};

window.openAddFeeHeadModal = function() {
  window.openAppModal({
    title: 'Define New Fee Category / Head',
    subtitle: 'Configure institutional tuition, development, lab, or extracurricular fee head',
    saveLabel: 'Save Fee Head',
    saveIcon: 'plus',
    contentHtml: `
      <div class="form-grid">
        <div class="form-group" style="grid-column: span 2;">
          <label class="form-label font-semibold">Fee Head Name *</label>
          <input type="text" class="form-input" id="modal-fee-name" placeholder="e.g. STEM Robotics & AI Lab Deposit" required />
        </div>
        <div class="form-group">
          <label class="form-label font-semibold">Fee Head Code *</label>
          <input type="text" class="form-input" id="modal-fee-code" value="FEE-${Math.floor(100 + Math.random() * 900)}" required />
        </div>
        <div class="form-group">
          <label class="form-label font-semibold">Applicable Classes / Grades</label>
          <input type="text" class="form-input" id="modal-fee-app" value="All Classes (Nursery to 12)" />
        </div>
        <div class="form-group">
          <label class="form-label font-semibold">Billing Frequency</label>
          <select class="form-select" id="modal-fee-freq">
            <option value="Quarterly" selected>Quarterly (Per Term)</option>
            <option value="Annual">Annual (Once per Academic Year)</option>
            <option value="Monthly">Monthly Recurring</option>
            <option value="Per Term">Per Academic Term</option>
            <option value="One-Time">One-Time at Admission</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label font-semibold">Scheduled Due Day</label>
          <input type="text" class="form-input" id="modal-fee-due" value="10th of Term" />
        </div>
        <div class="form-group" style="grid-column: span 2;">
          <label class="form-label font-semibold">Fee Amount (₹) *</label>
          <input type="number" class="form-input" id="modal-fee-amt" value="3500" required min="1" />
        </div>
      </div>
    `,
    onSave: async () => {
      const name = document.getElementById('modal-fee-name')?.value.trim();
      const amt = parseFloat(document.getElementById('modal-fee-amt')?.value) || 0;
      if (!name || amt <= 0) {
        if (window.showToast) window.showToast('Please enter a valid Fee Head Name and Amount', 'warning');
        return false;
      }
      const code = document.getElementById('modal-fee-code')?.value.trim() || `FEE-${Date.now().toString().slice(-4)}`;
      const app = document.getElementById('modal-fee-app')?.value.trim() || 'All Classes';
      const freq = document.getElementById('modal-fee-freq')?.value || 'Quarterly';
      const due = document.getElementById('modal-fee-due')?.value.trim() || '10th of Term';

      const newHead = {
        id: Date.now(),
        name,
        code,
        applicable: app,
        frequency: freq,
        due_day: due,
        amount: `₹${amt.toLocaleString()}`,
      };

      feeTypes.unshift(newHead);
      saveFeeTypes(feeTypes);

      const tbody = document.getElementById('fee-structure-tbody');
      if (tbody) tbody.innerHTML = renderFeeMastersRows();

      if (window.showToast) window.showToast(`✅ Fee Head "${name}" added successfully!`, 'success');
      return true;
    }
  });
};

window.openAllotFineRuleModal = function() {
  const optionsHtml = [
    ...feeTypes.map(f => `<option value="${f.name}">${f.name}</option>`),
    `<option value="All Scheduled Fee Heads">All Scheduled Fee Heads</option>`
  ].join('');

  window.openAppModal({
    title: 'Allot Automated Late Fine & Penalty Rule',
    subtitle: 'Configure grace period, fine calculation formula, and enforcement policy',
    saveLabel: 'Allot Fine Rule',
    saveIcon: 'plus',
    contentHtml: `
      <div class="form-grid">
        <div class="form-group" style="grid-column: span 2;">
          <label class="form-label font-semibold">Applicable Fee Head *</label>
          <select class="form-select" id="modal-fine-head">
            ${optionsHtml}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label font-semibold">Scheduled Due Day</label>
          <input type="text" class="form-input" id="modal-fine-due" value="10th of Month" />
        </div>
        <div class="form-group">
          <label class="form-label font-semibold">Grace Period Window</label>
          <select class="form-select" id="modal-fine-grace">
            <option value="3 Days">3 Days Grace</option>
            <option value="5 Days" selected>5 Days Grace</option>
            <option value="7 Days">7 Days Grace</option>
            <option value="10 Days">10 Days Grace</option>
            <option value="15 Days">15 Days Grace</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label font-semibold">Fine Calculation Rule Type</label>
          <select class="form-select" id="modal-fine-type">
            <option value="Per-Day Rule" selected>Per-Day Rule (Daily Incremental)</option>
            <option value="Fixed Fine">Fixed Flat Surcharge</option>
            <option value="Percentage Surcharge">Percentage Penalty (%)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label font-semibold">Status</label>
          <select class="form-select" id="modal-fine-status">
            <option value="Active" selected>Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div class="form-group" style="grid-column: span 2;">
          <label class="form-label font-semibold">Fine Formula / Penalty Amount *</label>
          <input type="text" class="form-input" id="modal-fine-amt" value="₹25 / Day after due date" placeholder="e.g. ₹20 / Day after due date or ₹250 Flat Fine" required />
        </div>
      </div>
    `,
    onSave: async () => {
      const feeHead = document.getElementById('modal-fine-head')?.value || 'Tuition Fee';
      const dueDay = document.getElementById('modal-fine-due')?.value.trim() || '10th of Month';
      const grace = document.getElementById('modal-fine-grace')?.value || '5 Days';
      const ruleType = document.getElementById('modal-fine-type')?.value || 'Per-Day Rule';
      const fineAmt = document.getElementById('modal-fine-amt')?.value.trim();
      const status = document.getElementById('modal-fine-status')?.value || 'Active';

      if (!fineAmt) {
        if (window.showToast) window.showToast('Please enter a fine amount or formula', 'warning');
        return false;
      }

      const newRule = {
        id: Date.now(),
        fee_head: feeHead,
        due_day: dueDay,
        grace_period: grace,
        rule_type: ruleType,
        fine_amount: fineAmt,
        status: status,
        applies_to: 'All Classes'
      };

      fineRulesList.unshift(newRule);
      saveFineRules(fineRulesList);

      const tbody = document.getElementById('fine-rules-tbody');
      if (tbody) tbody.innerHTML = renderFineRulesRows();

      if (window.showToast) window.showToast(`✅ Fine Rule allotted for ${feeHead}!`, 'success');
      return true;
    }
  });
};

window.openAllotDiscountModal = function() {
  window.openAppModal({
    title: 'Allot Fee Discount & Concession Voucher',
    subtitle: 'Configure institutional scholarships, sibling waivers, or merit concessions',
    saveLabel: 'Allot Discount',
    saveIcon: 'plus',
    contentHtml: `
      <div class="form-grid">
        <div class="form-group" style="grid-column: span 2;">
          <label class="form-label font-semibold">Discount / Concession Name *</label>
          <input type="text" class="form-input" id="modal-disc-name" placeholder="e.g. Sports Excellence Scholarship" required />
        </div>
        <div class="form-group">
          <label class="form-label font-semibold">Voucher / Concession Code *</label>
          <input type="text" class="form-input" id="modal-disc-code" value="DISC_${Math.floor(100 + Math.random() * 900)}" required />
        </div>
        <div class="form-group">
          <label class="form-label font-semibold">Concession Type</label>
          <select class="form-select" id="modal-disc-type">
            <option value="Percentage" selected>Percentage Concession (%)</option>
            <option value="Full Waiver">Full Fee Waiver (100%)</option>
            <option value="Fixed Amount">Fixed Flat Deduction (₹)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label font-semibold">Benefit Value *</label>
          <input type="text" class="form-input" id="modal-disc-val" value="25%" placeholder="e.g. 25% or ₹3,000" required />
        </div>
        <div class="form-group">
          <label class="form-label font-semibold">Recurrence Cycle</label>
          <select class="form-select" id="modal-disc-repeat">
            <option value="Every Term" selected>Every Term (Quarterly)</option>
            <option value="Annual">Annual (Once per Academic Year)</option>
            <option value="Per Month">Monthly</option>
            <option value="One-Time">One-Time Voucher</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label font-semibold">Validity Expiry Date</label>
          <input type="date" class="form-input" id="modal-disc-expiry" value="2027-03-31" />
        </div>
        <div class="form-group" style="grid-column: span 2;">
          <label class="form-label font-semibold">Eligible Students / Criteria *</label>
          <input type="text" class="form-input" id="modal-disc-criteria" value="National or State level sports champions" placeholder="e.g. Score > 90% in Board Exams or Sibling of active student" required />
        </div>
      </div>
    `,
    onSave: async () => {
      const name = document.getElementById('modal-disc-name')?.value.trim();
      const code = document.getElementById('modal-disc-code')?.value.trim() || `DISC_${Date.now().toString().slice(-4)}`;
      const type = document.getElementById('modal-disc-type')?.value || 'Percentage';
      const val = document.getElementById('modal-disc-val')?.value.trim();
      const repeat = document.getElementById('modal-disc-repeat')?.value || 'Every Term';
      const expiry = document.getElementById('modal-disc-expiry')?.value || '2027-03-31';
      const criteria = document.getElementById('modal-disc-criteria')?.value.trim() || 'Eligible students';

      if (!name || !val) {
        if (window.showToast) window.showToast('Please enter both Concession Name and Benefit Value', 'warning');
        return false;
      }

      const newDisc = {
        id: Date.now(),
        name,
        code,
        type,
        value: val,
        expiry,
        repeats: repeat,
        applies_to: criteria
      };

      feeDiscountsList.unshift(newDisc);
      saveDiscounts(feeDiscountsList);

      const tbody = document.getElementById('fee-discounts-tbody');
      if (tbody) tbody.innerHTML = renderDiscountsRows();

      if (window.showToast) window.showToast(`✅ Discount "${name}" (${val}) allotted successfully!`, 'success');
      return true;
    }
  });
};

function switchFeeTab(tabName) {
  const tabBtns = document.querySelectorAll('.fee-tab-btn');
  tabBtns.forEach(b => {
    b.className = b.getAttribute('data-tab') === tabName ? 'btn btn-primary btn-sm fee-tab-btn' : 'btn btn-secondary btn-sm fee-tab-btn';
  });
  ['masters', 'fines', 'discounts', 'razorpay'].forEach(t => {
    const sec = document.getElementById(`fee-tab-${t}`);
    if (sec) sec.style.display = (t === tabName) ? 'block' : 'none';
  });
}

async function renderFeeStructure() {
  let rzpConfig = { key_id: 'rzp_test_YOUR_KEY_ID_HERE', configured: false, mode: 'test', enabled: true, is_placeholder: true };
  try {
    const rzpRes = await api.get('/razorpay/config');
    if (rzpRes.data) rzpConfig = rzpRes.data;
  } catch {}

  return `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h1>Fees & Accounts Architecture</h1>
          <p class="subtitle">Complete fee masters, fine rules, automated discounts, and online payment channels</p>
        </div>
        <div class="flex gap-2" style="flex-wrap: wrap;">
          <a href="#/fees/collection" class="btn btn-primary">
            ${icon('banknotes', 18)} Go to Cashier Desk
          </a>
          <button class="btn btn-secondary" id="add-fee-head-btn">
            ${icon('plus', 18)} Add Fee Head
          </button>
          <button class="btn btn-secondary" id="allot-fine-top-btn">
            ${icon('plus', 18)} Allot Fine Rule
          </button>
          <button class="btn btn-secondary" id="allot-discount-top-btn">
            ${icon('plus', 18)} Allot Discount
          </button>
        </div>
      </div>

      <!-- Module Navigation Tabs -->
      <div class="flex gap-3 mb-6" style="border-bottom: 1px solid var(--border-secondary); padding-bottom: 12px; flex-wrap: wrap;">
        <button class="btn btn-primary btn-sm fee-tab-btn" data-tab="masters" id="tab-btn-masters">Fee Masters & Heads (Point 8)</button>
        <button class="btn btn-secondary btn-sm fee-tab-btn" data-tab="fines" id="tab-btn-fines">Fine Management (Point 33)</button>
        <button class="btn btn-secondary btn-sm fee-tab-btn" data-tab="discounts" id="tab-btn-discounts">Fee Discounts & Concessions (Point 34)</button>
        <button class="btn btn-secondary btn-sm fee-tab-btn" data-tab="razorpay" id="tab-btn-razorpay">⚡ Razorpay Gateway (Point 35)</button>
      </div>

      <!-- Tab 1: Fee Masters & Heads -->
      <div class="fee-tab-content" id="fee-tab-masters">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Scheduled Fee Heads & Masters</span>
            <span class="badge badge-info">Session 2026-2027 Schedule</span>
          </div>
          <table class="table">
            <thead>
              <tr>
                <th>Fee Category Head</th>
                <th>Fee Code</th>
                <th>Applicable Grades</th>
                <th>Frequency</th>
                <th>Due Day</th>
                <th>Amount</th>
                <th style="width: 100px;">Action</th>
              </tr>
            </thead>
            <tbody id="fee-structure-tbody">
              ${renderFeeMastersRows()}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab 2: Fine Management (Point 33) -->
      <div class="fee-tab-content" id="fee-tab-fines" style="display: none;">
        <div class="card mb-6">
          <div class="card-header">
            <span class="card-title">Automated Late Fee & Fine Calculation Rules</span>
            <button class="btn btn-primary btn-sm" id="add-fine-rule-btn">${icon('plus', 14)} Allot Fine Rule</button>
          </div>
          <p class="text-sm text-secondary mb-4">
            Rule-based fine automatically calculates per-day late fees or fixed surcharges once the due date passes the grace period.
          </p>
          <table class="table">
            <thead>
              <tr>
                <th>Applicable Fee Head</th>
                <th>Scheduled Due Day</th>
                <th>Grace Window</th>
                <th>Fine Type</th>
                <th>Fine Formula / Surcharge</th>
                <th>Status</th>
                <th style="width: 100px;">Action</th>
              </tr>
            </thead>
            <tbody id="fine-rules-tbody">
              ${renderFineRulesRows()}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab 3: Fee Discounts & Concessions (Point 34) -->
      <div class="fee-tab-content" id="fee-tab-discounts" style="display: none;">
        <div class="card mb-6">
          <div class="card-header">
            <span class="card-title">Fee Discounts & Concession Allotments</span>
            <button class="btn btn-primary btn-sm" id="add-discount-btn">${icon('plus', 14)} Allot Discount</button>
          </div>
          <p class="text-sm text-secondary mb-4">
            Configurable discounts apply automatically at cashier desk and are visible in parent & student portal statements.
          </p>
          <table class="table">
            <thead>
              <tr>
                <th>Discount Concession Name</th>
                <th>Voucher Code</th>
                <th>Benefit Value</th>
                <th>Recurrence Cycle</th>
                <th>Validity Expiry</th>
                <th>Eligible Students / Criteria</th>
                <th style="width: 100px;">Action</th>
              </tr>
            </thead>
            <tbody id="fee-discounts-tbody">
              ${renderDiscountsRows()}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Tab 4: Razorpay Payment Gateway (Point 35) -->
      <div class="fee-tab-content" id="fee-tab-razorpay" style="display: none;">
        <div class="grid-2 mb-6">
          <div class="card">
            <div class="card-header">
              <span class="card-title flex items-center gap-2">
                <img src="https://razorpay.com/favicon.ico" style="width:18px;height:18px;border-radius:3px;" onerror="this.style.display='none'"/>
                Razorpay Payment Gateway Configuration
              </span>
              <span class="badge ${rzpConfig.configured ? 'badge-success' : 'badge-warning'}" id="rzp-status-badge">
                ${rzpConfig.configured ? '● Gateway Active (' + (rzpConfig.mode || 'TEST').toUpperCase() + ')' : '● Sandbox Mode Active'}
              </span>
            </div>

            <form id="rzp-settings-form">
              <div class="form-group mb-3">
                <label class="form-label font-semibold">Razorpay Key ID</label>
                <input type="text" class="form-input" id="rzp-input-key-id" value="${rzpConfig.key_id || ''}" placeholder="rzp_test_... or rzp_live_..." required />
                <div class="text-xs text-secondary mt-1">Get this from your Razorpay Dashboard &gt; Settings &gt; API Keys</div>
              </div>

              <div class="form-group mb-3">
                <label class="form-label font-semibold">Razorpay Key Secret</label>
                <input type="password" class="form-input" id="rzp-input-key-secret" placeholder="Enter key secret (e.g. ••••••••••••••••)" />
                <div class="text-xs text-secondary mt-1">Used server-side for cryptographic HMAC-SHA256 signature verification</div>
              </div>

              <div class="form-row mb-4">
                <div class="form-group">
                  <label class="form-label font-semibold">Gateway Environment</label>
                  <select class="form-select" id="rzp-input-mode">
                    <option value="test" ${rzpConfig.mode === 'test' ? 'selected' : ''}>Test Mode (Sandbox / Testing)</option>
                    <option value="live" ${rzpConfig.mode === 'live' ? 'selected' : ''}>Live Mode (Real Bank Transactions)</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label font-semibold">Online Payment Gateway</label>
                  <select class="form-select" id="rzp-input-enabled">
                    <option value="1" ${rzpConfig.enabled ? 'selected' : ''}>Enabled (Active on Fee Collection)</option>
                    <option value="0" ${!rzpConfig.enabled ? 'selected' : ''}>Disabled (Cash Only)</option>
                  </select>
                </div>
              </div>

              <div class="flex gap-2" style="flex-wrap: wrap;">
                <button type="submit" class="btn btn-primary" id="rzp-save-btn">
                  ${icon('checkCircle', 16)} Save Gateway Credentials
                </button>
                <button type="button" class="btn btn-secondary" id="rzp-test-btn">
                  🔄 Test API Connection
                </button>
                <button type="button" class="btn btn-success" id="rzp-quick-pay-btn" style="background: linear-gradient(135deg, #2D6A4F, #1B4332);">
                  ⚡ Test Checkout (₹500)
                </button>
              </div>
            </form>
          </div>

          <div class="card">
            <div class="card-header">
              <span class="card-title">Razorpay Integration Architecture</span>
              <span class="badge badge-info">End-to-End Ready</span>
            </div>
            <div style="font-size: 0.85rem; line-height: 1.7; color: var(--text-secondary);">
              <p class="mb-3">
                <strong style="color: var(--text-primary);">⚡ How Razorpay Works in Smart School:</strong><br>
                1. <strong>Order Generation:</strong> Student dues are converted to smallest currency units (paise) and signed via server-side API.<br>
                2. <strong>Multi-Channel Checkout:</strong> Supports Instant UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards, NetBanking (50+ banks), and Mobile Wallets.<br>
                3. <strong>Cryptographic Verification:</strong> Webhook / Return payload verifies HMAC-SHA256 signature to guarantee zero fraud.<br>
                4. <strong>Automated Ledger Entry:</strong> Immediately updates <code>student_fees</code> to <strong>Paid</strong>, writes to financial income transactions, and issues an 80mm printable thermal receipt.
              </p>
              <div style="background: var(--bg-input); border-radius: var(--radius-md); padding: 12px; margin-top: 12px; border: 1px dashed var(--border-secondary);">
                <div class="font-semibold text-primary mb-1">🔗 Razorpay Dashboard Links</div>
                <div>• Dashboard: <a href="https://dashboard.razorpay.com/" target="_blank" style="color: var(--primary-500); text-decoration: underline;">https://dashboard.razorpay.com/</a></div>
                <div>• Generate API Keys: <a href="https://dashboard.razorpay.com/app/keys" target="_blank" style="color: var(--primary-500); text-decoration: underline;">Settings &gt; API Keys</a></div>
                <div>• Webhooks: <code>http://127.0.0.1:8000/api/razorpay/verify</code></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function bindFeeStructureEvents() {
  const addBtn = document.getElementById('add-fee-head-btn');
  if (addBtn) {
    addBtn.onclick = () => window.openAddFeeHeadModal();
  }

  const allotFineTopBtn = document.getElementById('allot-fine-top-btn');
  if (allotFineTopBtn) {
    allotFineTopBtn.onclick = () => {
      switchFeeTab('fines');
      window.openAllotFineRuleModal();
    };
  }

  const addFineRuleBtn = document.getElementById('add-fine-rule-btn');
  if (addFineRuleBtn) {
    addFineRuleBtn.onclick = () => window.openAllotFineRuleModal();
  }

  const allotDiscTopBtn = document.getElementById('allot-discount-top-btn');
  if (allotDiscTopBtn) {
    allotDiscTopBtn.onclick = () => {
      switchFeeTab('discounts');
      window.openAllotDiscountModal();
    };
  }

  const addDiscBtn = document.getElementById('add-discount-btn');
  if (addDiscBtn) {
    addDiscBtn.onclick = () => window.openAllotDiscountModal();
  }

  const tabBtns = document.querySelectorAll('.fee-tab-btn');
  tabBtns.forEach(btn => {
    btn.onclick = () => {
      const target = btn.getAttribute('data-tab');
      switchFeeTab(target);
    };
  });

  const rzpForm = document.getElementById('rzp-settings-form');
  if (rzpForm) {
    rzpForm.onsubmit = async (e) => {
      e.preventDefault();
      const key_id = document.getElementById('rzp-input-key-id').value.trim();
      const key_secret = document.getElementById('rzp-input-key-secret').value.trim();
      const mode = document.getElementById('rzp-input-mode').value;
      const enabled = parseInt(document.getElementById('rzp-input-enabled').value, 10);

      try {
        const res = await api.post('/razorpay/save-keys', {
          razorpay_key_id: key_id,
          razorpay_key_secret: key_secret,
          razorpay_mode: mode,
          razorpay_enabled: enabled,
        });
        if (res.data?.success) {
          if (window.showToast) window.showToast(res.data.message || 'Razorpay credentials saved successfully!', 'success');
          const badge = document.getElementById('rzp-status-badge');
          if (badge) {
            badge.className = 'badge badge-success';
            badge.textContent = `● Gateway Active (${mode.toUpperCase()})`;
          }
        } else {
          if (window.showToast) window.showToast(res.data?.error || 'Failed to save credentials', 'error');
        }
      } catch (err) {
        if (window.showToast) window.showToast('Error saving credentials: ' + (err.message || 'Server error'), 'error');
      }
    };
  }

  const rzpTestBtn = document.getElementById('rzp-test-btn');
  if (rzpTestBtn) {
    rzpTestBtn.onclick = async () => {
      try {
        const res = await api.get('/razorpay/config');
        if (res.data) {
          const isSand = res.data.is_placeholder;
          if (window.showToast) window.showToast(`Razorpay API OK: Key ${res.data.key_id} (${res.data.mode.toUpperCase()}) ${isSand ? '[Sandbox Ready]' : '[Live Credentials Active]'}`, 'success');
        }
      } catch (err) {
        if (window.showToast) window.showToast('Connection failed: ' + (err.message || 'Network error'), 'error');
      }
    };
  }

  const rzpQuickPayBtn = document.getElementById('rzp-quick-pay-btn');
  if (rzpQuickPayBtn) {
    rzpQuickPayBtn.onclick = () => {
      openOnlinePaymentModal('Aarav Sharma', 'SS2025001', 500, 'Test Gateway Integration Fee', 1);
    };
  }
}

/* ==========================================================================
   Module 35 – Razorpay Online Payment Gateway (Real Integration)
   ========================================================================== */

/**
 * Load the Razorpay checkout SDK on demand (lazy-load to keep app fast).
 */
function _loadRazorpaySDK() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) { resolve(); return; }
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = resolve;
    s.onerror = () => reject(new Error('Failed to load Razorpay SDK. Check your network connection.'));
    document.head.appendChild(s);
  });
}

/**
 * Open Razorpay checkout for a fee payment.
 *
 * @param {string} studentName - Display name
 * @param {string} admNo       - Admission number
 * @param {number|string} amount - Fee amount in Rupees (numeric)
 * @param {string} headName    - Fee head / description
 * @param {number} feeId       - DB fee row ID (0 if not applicable)
 * @param {string} email       - Payer email (optional)
 * @param {string} mobile      - Payer mobile (optional)
 */
async function openOnlinePaymentModal(studentName, admNo, amount, headName, feeId = 0, email = '', mobile = '') {
  const numericAmt = parseFloat(String(amount).replace(/[^0-9.]/g, '')) || 12500;
  const surcharge  = Math.round(numericAmt * 0.015);
  const total      = numericAmt + surcharge;

  // Show a pre-checkout summary modal
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  modalRoot.innerHTML = `
    <div class="modal-backdrop" id="rzp-pre-modal">
      <div class="modal-dialog modal-md">
        <div class="modal-header" style="background: linear-gradient(135deg, #2D6A4F, #1B4332);">
          <span class="modal-title" style="display:flex;align-items:center;gap:10px;">
            <img src="https://razorpay.com/favicon.ico" style="width:20px;height:20px;border-radius:4px;" onerror="this.style.display='none'"/>
            Razorpay Secure Checkout
          </span>
          <button class="modal-close" id="rzp-close-modal" style="color:#fff;">&times;</button>
        </div>
        <div class="modal-body" style="padding: 24px;">

          <!-- Razorpay branding bar -->
          <div style="background:linear-gradient(135deg,#2D6A4F,#1B4332);border-radius:10px;padding:14px 18px;margin-bottom:18px;color:#fff;">
            <div style="font-size:0.7rem;opacity:0.8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Secure Payment via</div>
            <div style="font-size:1.2rem;font-weight:800;letter-spacing:0.5px;">⚡ Razorpay Gateway</div>
            <div style="font-size:0.75rem;opacity:0.75;margin-top:2px;">UPI · Cards · NetBanking · Wallets</div>
          </div>

          <!-- Payment summary -->
          <div class="p-4 rounded-md mb-4" style="background:var(--bg-input);border:1px solid var(--border-secondary);">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-secondary">Student:</span>
              <strong>${studentName || 'Student'} &nbsp;<code style="font-size:0.78rem;">${admNo || '--'}</code></strong>
            </div>
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-secondary">Fee Head:</span>
              <span>${headName || 'School Fee'}</span>
            </div>
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-secondary">Base Amount:</span>
              <strong>₹${numericAmt.toLocaleString()}</strong>
            </div>
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-secondary">Gateway Surcharge (1.5%):</span>
              <span class="text-secondary">+ ₹${surcharge.toLocaleString()}</span>
            </div>
            <hr style="margin:10px 0;border:none;border-top:1px dashed var(--border-secondary);" />
            <div class="flex justify-between items-center" style="font-size:1.1rem;font-weight:800;">
              <span>Total Payable:</span>
              <span style="color:#2D6A4F;">₹${total.toLocaleString()}</span>
            </div>
          </div>

          <div class="flex gap-2 mb-3" style="flex-wrap:wrap;">
            <img src="https://cdn.razorpay.com/static/assets/pay_methods_branding/upi.png"
                 style="height:22px;border-radius:3px;" alt="UPI" onerror="this.remove()"/>
            <img src="https://cdn.razorpay.com/static/assets/pay_methods_branding/visa.png"
                 style="height:22px;border-radius:3px;" alt="Visa" onerror="this.remove()"/>
            <img src="https://cdn.razorpay.com/static/assets/pay_methods_branding/mastercard.png"
                 style="height:22px;border-radius:3px;" alt="Mastercard" onerror="this.remove()"/>
            <img src="https://cdn.razorpay.com/static/assets/pay_methods_branding/netbanking.png"
                 style="height:22px;border-radius:3px;" alt="NetBanking" onerror="this.remove()"/>
          </div>

          <div style="font-size:0.78rem;color:var(--text-muted);display:flex;align-items:center;gap:5px;">
            🔒 256-bit SSL encrypted · PCI-DSS compliant · Bank-grade security
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="rzp-cancel-btn">Cancel</button>
          <button class="btn btn-success" id="rzp-pay-btn" style="background:linear-gradient(135deg,#2D6A4F,#1B4332);min-width:180px;">
            <span id="rzp-pay-btn-label">⚡ Pay ₹${total.toLocaleString()} Securely</span>
          </button>
        </div>
      </div>
    </div>
  `;

  const closeModal = () => { modalRoot.innerHTML = ''; };
  document.getElementById('rzp-close-modal').onclick = closeModal;
  document.getElementById('rzp-cancel-btn').onclick  = closeModal;

  document.getElementById('rzp-pay-btn').onclick = async () => {
    const payBtn      = document.getElementById('rzp-pay-btn');
    const payBtnLabel = document.getElementById('rzp-pay-btn-label');
    payBtn.disabled   = true;
    payBtnLabel.innerHTML = '<span class="spinner spinner-sm"></span> Creating order...';

    try {
      // Step 1: Create order via our backend
      const orderRes = await api.post('/razorpay/create-order', {
        fee_id:       feeId,
        amount:       total,           // Rupees — backend converts to paise
        student_name: studentName,
        admission_no: admNo,
        email:        email || 'parent@school.edu',
        mobile:       mobile || '9999999999',
      });

      if (!orderRes.data?.order_id) {
        throw new Error(orderRes.data?.error || 'Failed to create Razorpay order');
      }

      const { order_id, key_id, amount: paise, is_sandbox } = orderRes.data;
      const isPlaceholder = !key_id || key_id.includes('YOUR_KEY') || is_sandbox;

      const onPaymentSuccess = async (response) => {
        closeModal();
        if (window.showToast) window.showToast('Verifying payment with server...', 'info');

        try {
          const verifyRes = await api.post('/razorpay/verify', {
            razorpay_order_id:   response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature:  response.razorpay_signature || '',
            fee_id:              feeId,
            amount:              total,
            student_name:        studentName,
            admission_no:        admNo,
          });

          if (verifyRes.data?.success) {
            const { receipt_no, payment_id } = verifyRes.data;
            if (window.showToast) window.showToast(`✅ Payment of ₹${total.toLocaleString()} Verified! Receipt: ${receipt_no}`, 'success');
            _showRazorpayReceiptModal({ studentName, admNo, amount: total, headName, receipt_no, payment_id, order_id });

            // Refresh view
            window.dispatchEvent(new Event('hashchange'));
          } else {
            throw new Error(verifyRes.data?.error || 'Verification failed');
          }
        } catch (verifyErr) {
          console.error('Razorpay verify error:', verifyErr);
          if (window.showToast) window.showToast('⚠️ Payment received but verification failed. Contact admin with Payment ID: ' + response.razorpay_payment_id, 'warning');
        }
      };

      const onPaymentFailure = (err) => {
        console.error('Razorpay payment failed:', err);
        if (window.showToast) window.showToast('❌ Payment cancelled or failed: ' + (err.error?.description || 'Cancelled'), 'error');
      };

      // Close pre-summary modal before opening checkout
      closeModal();

      if (isPlaceholder) {
        // High-fidelity Razorpay sandbox simulation checkout modal
        _openRazorpaySimulatorCheckout({
          order_id,
          key_id,
          amount: paise,
          total,
          studentName,
          admNo,
          headName,
          feeId,
        }, onPaymentSuccess, onPaymentFailure);
      } else {
        // Real Razorpay Checkout SDK
        try {
          await _loadRazorpaySDK();
          const rzpOptions = {
            key:         key_id,
            amount:      paise,
            currency:    'INR',
            name:        'Smart School Management',
            description: headName || 'School Fee Payment',
            order_id:    order_id,
            prefill: {
              name:    studentName || '',
              email:   email || '',
              contact: mobile || '',
            },
            notes: {
              fee_id:       String(feeId),
              admission_no: admNo || '',
            },
            theme: { color: '#2D6A4F' },
            modal: { escape: false },
            handler: onPaymentSuccess,
          };
          const rzp = new window.Razorpay(rzpOptions);
          rzp.on('payment.failed', onPaymentFailure);
          rzp.open();
        } catch (sdkErr) {
          console.warn('Real Razorpay SDK failed to open, falling back to simulator:', sdkErr);
          _openRazorpaySimulatorCheckout({
            order_id,
            key_id,
            amount: paise,
            total,
            studentName,
            admNo,
            headName,
            feeId,
          }, onPaymentSuccess, onPaymentFailure);
        }
      }

    } catch (err) {
      console.error('Razorpay checkout error:', err);
      payBtn.disabled   = false;
      payBtnLabel.innerHTML = '⚡ Pay ₹' + total.toLocaleString() + ' Securely';
      if (window.showToast) window.showToast('Gateway error: ' + (err.message || 'Please try again'), 'error');
    }
  };
}

/**
 * High-fidelity Razorpay Checkout Simulator for sandbox testing
 */
function _openRazorpaySimulatorCheckout(orderData, onSuccess, onFailure) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  const totalRupees = orderData.total;

  modalRoot.innerHTML = `
    <div class="modal-backdrop" id="rzp-sim-backdrop" style="z-index: 99999;">
      <div class="modal-dialog" style="max-width: 520px; border-radius: 12px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);">
        <!-- Razorpay Header -->
        <div style="background: linear-gradient(135deg, #0c2340 0%, #1e3a8a 60%, #0d9488 100%); padding: 18px 22px; color: #fff; position: relative;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-size:1.3rem; font-weight:800; letter-spacing:0.5px;">Razorpay</span>
                <span style="font-size:0.65rem; background:rgba(255,255,255,0.2); padding:2px 8px; border-radius:12px; text-transform:uppercase; font-weight:700;">Sandbox Checkout</span>
              </div>
              <div style="font-size:0.8rem; opacity:0.85; margin-top:2px;">Smart School Management System</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:0.75rem; opacity:0.8;">Total Amount</div>
              <div style="font-size:1.4rem; font-weight:800; color:#5eead4;">₹${totalRupees.toLocaleString()}</div>
            </div>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px; font-size:0.75rem; opacity:0.8; border-top:1px solid rgba(255,255,255,0.15); padding-top:8px;">
            <span>Student: <strong>${orderData.studentName}</strong> (<code>${orderData.admNo}</code>)</span>
            <span>Order: <code style="color:#5eead4;">${orderData.order_id.substring(0, 16)}</code></span>
          </div>
          <button id="rzp-sim-close" style="position:absolute; top:12px; right:12px; background:none; border:none; color:#fff; font-size:1.4rem; cursor:pointer; opacity:0.7;">&times;</button>
        </div>

        <!-- Payment Mode Navigation -->
        <div style="display:flex; border-bottom:1px solid var(--border-secondary); background:var(--bg-secondary);">
          <button type="button" class="rzp-sim-tab-btn" data-target="upi" id="rzp-tab-btn-upi" style="flex:1; padding:12px 8px; border:none; background:var(--bg-primary); border-bottom:2px solid #0d9488; font-weight:700; font-size:0.85rem; color:#0d9488; cursor:pointer;">
            ⚡ UPI / QR
          </button>
          <button type="button" class="rzp-sim-tab-btn" data-target="card" id="rzp-tab-btn-card" style="flex:1; padding:12px 8px; border:none; background:transparent; border-bottom:2px solid transparent; font-weight:600; font-size:0.85rem; color:var(--text-secondary); cursor:pointer;">
            💳 Card
          </button>
          <button type="button" class="rzp-sim-tab-btn" data-target="netbanking" id="rzp-tab-btn-netbanking" style="flex:1; padding:12px 8px; border:none; background:transparent; border-bottom:2px solid transparent; font-weight:600; font-size:0.85rem; color:var(--text-secondary); cursor:pointer;">
            🏦 NetBanking
          </button>
        </div>

        <!-- Body content -->
        <div class="modal-body" style="padding: 20px; background: var(--bg-primary);">
          <!-- UPI Tab -->
          <div id="rzp-sim-tab-upi">
            <div style="text-align:center; padding:6px 0 14px;">
              <div style="display:inline-block; padding:10px; background:#fff; border-radius:10px; border:2px solid #e2e8f0; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1); margin-bottom:10px;">
                <!-- QR Code SVG -->
                <svg width="130" height="130" viewBox="0 0 100 100" style="display:block;">
                  <rect width="100" height="100" fill="#fff" />
                  <rect x="10" y="10" width="25" height="25" fill="#0c2340" />
                  <rect x="15" y="15" width="15" height="15" fill="#fff" />
                  <rect x="18" y="18" width="9" height="9" fill="#0c2340" />
                  <rect x="65" y="10" width="25" height="25" fill="#0c2340" />
                  <rect x="70" y="15" width="15" height="15" fill="#fff" />
                  <rect x="73" y="18" width="9" height="9" fill="#0c2340" />
                  <rect x="10" y="65" width="25" height="25" fill="#0c2340" />
                  <rect x="15" y="70" width="15" height="15" fill="#fff" />
                  <rect x="18" y="73" width="9" height="9" fill="#0c2340" />
                  <circle cx="50" cy="50" r="14" fill="#0d9488" />
                  <text x="50" y="55" font-size="12" fill="#fff" text-anchor="middle" font-weight="bold">₹</text>
                  <rect x="42" y="12" width="6" height="6" fill="#0c2340" />
                  <rect x="52" y="18" width="6" height="6" fill="#0c2340" />
                  <rect x="45" y="28" width="6" height="6" fill="#0c2340" />
                  <rect x="12" y="45" width="6" height="6" fill="#0c2340" />
                  <rect x="24" y="48" width="6" height="6" fill="#0c2340" />
                  <rect x="75" y="45" width="6" height="6" fill="#0c2340" />
                  <rect x="85" y="52" width="6" height="6" fill="#0c2340" />
                  <rect x="42" y="72" width="6" height="6" fill="#0c2340" />
                  <rect x="52" y="68" width="6" height="6" fill="#0c2340" />
                  <rect x="68" y="75" width="6" height="6" fill="#0c2340" />
                  <rect x="78" y="82" width="6" height="6" fill="#0c2340" />
                </svg>
              </div>
              <div class="text-xs text-secondary mb-2">Scan with Google Pay, PhonePe, Paytm, BHIM or any UPI App</div>
              <div style="display:flex; justify-content:center; gap:8px; margin-bottom:12px;">
                <span class="badge" style="background:#e0f2fe; color:#0369a1; font-weight:700;">GPay</span>
                <span class="badge" style="background:#ede9fe; color:#6d28d9; font-weight:700;">PhonePe</span>
                <span class="badge" style="background:#e0f2fe; color:#0284c7; font-weight:700;">Paytm UPI</span>
                <span class="badge" style="background:#fef3c7; color:#b45309; font-weight:700;">BHIM</span>
              </div>
            </div>
            <div class="form-group mb-2">
              <label class="form-label text-xs">Virtual Payment Address (VPA)</label>
              <input type="text" class="form-input text-sm" id="rzp-sim-vpa" value="parent@oksbi" />
            </div>
          </div>

          <!-- Card Tab -->
          <div id="rzp-sim-tab-card" style="display:none;">
            <div style="background:linear-gradient(135deg,#1e293b,#0f172a); border-radius:10px; padding:16px; color:#fff; margin-bottom:16px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.2);">
              <div style="display:flex; justify-content:space-between; margin-bottom:14px;">
                <span style="font-size:0.75rem; opacity:0.8;">TEST CARD</span>
                <span style="font-size:0.8rem; font-weight:700; color:#38bdf8;">VISA</span>
              </div>
              <div style="font-family:monospace; font-size:1.15rem; letter-spacing:2px; margin-bottom:12px;">
                4111 •••• •••• 4444
              </div>
              <div style="display:flex; justify-content:space-between; font-size:0.75rem;">
                <div>
                  <span style="opacity:0.6; display:block; font-size:0.65rem;">CARD HOLDER</span>
                  <span>${orderData.studentName || 'Smart Student'}</span>
                </div>
                <div>
                  <span style="opacity:0.6; display:block; font-size:0.65rem;">EXPIRES</span>
                  <span>12/28</span>
                </div>
              </div>
            </div>

            <div class="form-group mb-2">
              <label class="form-label text-xs">Card Number</label>
              <input type="text" class="form-input text-sm" value="4111 2222 3333 4444" readonly />
            </div>
            <div class="form-row mb-2">
              <div class="form-group">
                <label class="form-label text-xs">Expiry</label>
                <input type="text" class="form-input text-sm" value="12 / 28" readonly />
              </div>
              <div class="form-group">
                <label class="form-label text-xs">CVV</label>
                <input type="password" class="form-input text-sm" value="123" readonly />
              </div>
            </div>
          </div>

          <!-- NetBanking Tab -->
          <div id="rzp-sim-tab-netbanking" style="display:none;">
            <div class="text-xs text-secondary mb-3">Select your bank for NetBanking transaction:</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:14px;">
              <label style="display:flex; align-items:center; gap:8px; padding:10px; border:1px solid var(--border-secondary); border-radius:6px; cursor:pointer; background:var(--bg-input);">
                <input type="radio" name="sim_bank" value="HDFC" checked />
                <span class="text-sm font-semibold">HDFC Bank</span>
              </label>
              <label style="display:flex; align-items:center; gap:8px; padding:10px; border:1px solid var(--border-secondary); border-radius:6px; cursor:pointer; background:var(--bg-input);">
                <input type="radio" name="sim_bank" value="SBI" />
                <span class="text-sm font-semibold">State Bank of India</span>
              </label>
              <label style="display:flex; align-items:center; gap:8px; padding:10px; border:1px solid var(--border-secondary); border-radius:6px; cursor:pointer; background:var(--bg-input);">
                <input type="radio" name="sim_bank" value="ICICI" />
                <span class="text-sm font-semibold">ICICI Bank</span>
              </label>
              <label style="display:flex; align-items:center; gap:8px; padding:10px; border:1px solid var(--border-secondary); border-radius:6px; cursor:pointer; background:var(--bg-input);">
                <input type="radio" name="sim_bank" value="AXIS" />
                <span class="text-sm font-semibold">Axis Bank</span>
              </label>
            </div>
          </div>

          <!-- Security note -->
          <div style="display:flex; align-items:center; justify-content:center; gap:6px; font-size:0.72rem; color:var(--text-muted); margin-top:8px;">
            🔒 256-bit SSL encrypted · PCI-DSS Level 1 · Powered by Razorpay
          </div>
        </div>

        <!-- Footer / Action Buttons -->
        <div class="modal-footer" style="background:var(--bg-secondary); padding:14px 20px; display:flex; justify-content:space-between; align-items:center;">
          <button type="button" class="btn btn-secondary btn-sm" id="rzp-sim-fail-btn" style="color:var(--danger-500);">
            Cancel / Decline
          </button>
          <button type="button" class="btn btn-success btn-md" id="rzp-sim-success-btn" style="background:linear-gradient(135deg,#059669,#047857); min-width:180px; font-weight:700;">
            <span id="rzp-sim-success-label">⚡ Authorize &amp; Pay ₹${totalRupees.toLocaleString()}</span>
          </button>
        </div>
      </div>
    </div>
  `;

  const closeSim = () => { modalRoot.innerHTML = ''; };
  document.getElementById('rzp-sim-close').onclick = () => {
    closeSim();
    onFailure({ error: { description: 'Checkout window closed by user' } });
  };

  document.getElementById('rzp-sim-fail-btn').onclick = () => {
    closeSim();
    onFailure({ error: { description: 'Payment declined in test simulator' } });
  };

  // Tab switching inside simulator
  const simTabs = ['upi', 'card', 'netbanking'];
  simTabs.forEach(tab => {
    const btn = document.getElementById(`rzp-tab-btn-${tab}`);
    if (btn) {
      btn.onclick = () => {
        simTabs.forEach(t => {
          const b = document.getElementById(`rzp-tab-btn-${t}`);
          const c = document.getElementById(`rzp-sim-tab-${t}`);
          if (b) {
            b.style.background = (t === tab) ? 'var(--bg-primary)' : 'transparent';
            b.style.borderBottom = (t === tab) ? '2px solid #0d9488' : '2px solid transparent';
            b.style.color = (t === tab) ? '#0d9488' : 'var(--text-secondary)';
          }
          if (c) c.style.display = (t === tab) ? 'block' : 'none';
        });
      };
    }
  });

  // Successful payment simulation
  document.getElementById('rzp-sim-success-btn').onclick = () => {
    const btn = document.getElementById('rzp-sim-success-btn');
    const label = document.getElementById('rzp-sim-success-label');
    btn.disabled = true;
    label.innerHTML = '<span class="spinner spinner-sm"></span> Processing...';

    setTimeout(() => {
      closeSim();
      const mockPaymentId = 'pay_sim_' + Math.random().toString(36).substring(2, 14);
      onSuccess({
        razorpay_order_id:   orderData.order_id,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature:  'sim_sig_' + Math.random().toString(36).substring(2, 10),
      });
    }, 700);
  };
}

/**
 * Show a beautiful receipt modal after successful Razorpay payment.
 */
function _showRazorpayReceiptModal({ studentName, admNo, amount, headName, receipt_no, payment_id, order_id }) {
  const modalRoot = document.getElementById('modal-root');
  if (!modalRoot) return;

  const now = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

  modalRoot.innerHTML = `
    <div class="modal-backdrop">
      <div class="modal-dialog modal-md">
        <div class="modal-header" style="background:linear-gradient(135deg,#059669,#047857);">
          <span class="modal-title" style="color:#fff;">✅ Payment Successful</span>
          <button class="modal-close" id="rzp-receipt-close" style="color:#fff;">&times;</button>
        </div>
        <div class="modal-body" style="padding:24px;text-align:center;">
          <div style="width:64px;height:64px;background:linear-gradient(135deg,#059669,#047857);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2rem;margin:0 auto 16px;">✓</div>
          <h2 style="color:var(--success-600);margin-bottom:4px;">₹${amount.toLocaleString()} Paid</h2>
          <p class="text-secondary" style="margin-bottom:20px;">Transaction verified and recorded in database</p>

          <div style="background:var(--bg-input);border-radius:10px;padding:16px;text-align:left;margin-bottom:16px;">
            <div class="flex justify-between items-center mb-2 text-sm">
              <span class="text-secondary">Student</span>
              <strong>${studentName} (${admNo})</strong>
            </div>
            <div class="flex justify-between items-center mb-2 text-sm">
              <span class="text-secondary">Fee Head</span>
              <span>${headName}</span>
            </div>
            <div class="flex justify-between items-center mb-2 text-sm">
              <span class="text-secondary">Receipt No</span>
              <code style="color:var(--success-600);font-weight:700;">${receipt_no}</code>
            </div>
            <div class="flex justify-between items-center mb-2 text-sm">
              <span class="text-secondary">Razorpay Payment ID</span>
              <code style="font-size:0.7rem;">${payment_id}</code>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span class="text-secondary">Date & Time</span>
              <span>${now}</span>
            </div>
          </div>

          <div style="font-size:0.75rem;color:var(--text-muted);">
            This transaction has been recorded in the school's financial ledger.
          </div>
        </div>
        <div class="modal-footer" style="justify-content:center;">
          <button class="btn btn-success" id="rzp-receipt-close-btn">Done</button>
          <button class="btn btn-secondary" onclick="window.print()">🖨️ Print Receipt</button>
        </div>
      </div>
    </div>
  `;

  const close = () => { modalRoot.innerHTML = ''; };
  document.getElementById('rzp-receipt-close').onclick     = close;
  document.getElementById('rzp-receipt-close-btn').onclick = close;
}

/* ==========================================================================
   Income & Expense Financial Ledger View
   ========================================================================== */

let transactions = [
  { id: 1, voucher_no: 'VCH-9021', type: 'Income', category: 'Tuition Fee Collection', description: 'Term 1 Fees received from students', amount: 142500, date: '2026-09-25' },
  { id: 2, voucher_no: 'VCH-9022', type: 'Expense', category: 'Staff Payroll', description: 'September salary advance', amount: 85000, date: '2026-09-24' },
  { id: 3, voucher_no: 'VCH-9023', type: 'Expense', category: 'Campus Electricity & Water', description: 'Monthly utility billing', amount: 14200, date: '2026-09-22' },
  { id: 4, voucher_no: 'VCH-9024', type: 'Income', category: 'Transport Bus Fees', description: 'Bus route fees Q2', amount: 38400, date: '2026-09-20' },
  { id: 5, voucher_no: 'VCH-9025', type: 'Expense', category: 'Science Lab Equipment', description: 'Microscopes and chemistry glassware', amount: 22000, date: '2026-09-18' },
];

async function renderIncomeExpense() {
  try {
    const res = await api.get('/transactions');
    if (Array.isArray(res.data) && res.data.length > 0) {
      transactions = res.data.map(t => ({
        id: t.id,
        voucher_no: t.voucher_no || `VCH-${String(t.id).padStart(4, '0')}`,
        type: t.type,
        category: t.head || t.category || 'General',
        head: t.head || t.category || 'General',
        description: t.description || 'Transaction record',
        amount: parseFloat(t.amount) || 0,
        date: t.date || (t.created_at ? t.created_at.split(' ')[0] : '2026-09-28'),
      }));
    }
  } catch (e) {
    console.warn('Transactions API sync fallback:', e);
  }

  const totalIncome = transactions.filter(t => t.type === 'Income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'Expense').reduce((acc, t) => acc + t.amount, 0);
  const netBalance = totalIncome - totalExpense;

  return `
    <div class="animate-fadeIn">
      <div class="page-header">
        <div>
          <h1>Financial Accounts & Ledger</h1>
          <p class="subtitle">Institutional balance sheet, income tracking, and operational expenses</p>
        </div>
        <button class="btn btn-primary" id="add-transaction-btn">
          ${icon('plus', 18)} Record Transaction
        </button>
      </div>

      <!-- Financial Metrics -->
      <div class="grid-3 mb-6">
        <div class="stat-card stat-success">
          <div class="stat-icon">${icon('banknotes', 24)}</div>
          <div class="stat-value" id="tot-income">₹${totalIncome.toLocaleString()}</div>
          <div class="stat-label">Total Monthly Inflow (Income)</div>
        </div>
        <div class="stat-card stat-danger">
          <div class="stat-icon">${icon('banknotes', 24)}</div>
          <div class="stat-value" id="tot-expense">₹${totalExpense.toLocaleString()}</div>
          <div class="stat-label">Total Monthly Outflow (Expenses)</div>
        </div>
        <div class="stat-card stat-primary">
          <div class="stat-icon">${icon('chart', 24)}</div>
          <div class="stat-value" id="tot-balance">₹${netBalance.toLocaleString()}</div>
          <div class="stat-label">Net Surplus / Cash Balance</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <span class="card-title">Transaction Ledger</span>
        </div>
        <table class="table">
          <thead>
            <tr>
              <th>Voucher #</th>
              <th>Category</th>
              <th>Description</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody id="transactions-tbody">
            ${renderTransactionRows(transactions)}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderTransactionRows(items) {
  return items.map(t => `
    <tr>
      <td><code>${t.voucher_no}</code></td>
      <td><strong>${t.category}</strong></td>
      <td class="text-secondary">${t.description}</td>
      <td>
        <span class="badge ${t.type === 'Income' ? 'badge-success' : 'badge-danger'}">
          ${t.type}
        </span>
      </td>
      <td>
        <strong style="color: ${t.type === 'Income' ? 'var(--success-600)' : 'var(--danger-500)'}; font-size: 0.95rem;">
          ${t.type === 'Income' ? '+' : '-'} ₹${t.amount.toLocaleString()}
        </strong>
      </td>
      <td class="text-secondary">${t.date}</td>
    </tr>
  `).join('');
}

function bindIncomeExpenseEvents() {
  const addBtn = document.getElementById('add-transaction-btn');
  if (addBtn) {
    addBtn.onclick = () => {
      window.openAppModal({
        title: 'Record Financial Transaction / Voucher',
        subtitle: 'Log institutional fee collection, administrative purchase, or facility expense',
        saveLabel: 'Record Transaction',
        saveIcon: 'banknotes',
        contentHtml: `
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Transaction Type *</label>
              <select class="form-select" id="modal-txn-type">
                <option value="Income">Revenue / Income (+)</option>
                <option value="Expense">Expenditure / Expense (-)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Amount (₹) *</label>
              <input type="number" class="form-input" id="modal-txn-amount" placeholder="e.g. 25000" required />
            </div>
            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label">Ledger Head / Category *</label>
              <input type="text" class="form-input" id="modal-txn-head" placeholder="e.g. Tuition Fee Collection or Science Lab Consumables" required />
            </div>
            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label">Transaction Narrative / Description *</label>
              <input type="text" class="form-input" id="modal-txn-desc" placeholder="e.g. Term 1 student fees batch deposit" required />
            </div>
          </div>
        `,
        onSave: async () => {
          const type = document.getElementById('modal-txn-type').value;
          const amount = parseFloat(document.getElementById('modal-txn-amount').value) || 0;
          const head = document.getElementById('modal-txn-head').value.trim();
          const desc = document.getElementById('modal-txn-desc').value.trim();

          if (amount <= 0 || !head || !desc) {
            if (window.showToast) window.showToast('Please fill out all transaction fields with a valid amount', 'warning');
            return false;
          }

          const newTxn = {
            id: Date.now(),
            voucher_no: `VCH-${Math.floor(1000 + Math.random() * 9000)}`,
            ref_no: `TXN-${type.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`,
            type,
            head,
            category: head,
            description: desc,
            amount,
            date: new Date().toISOString().split('T')[0],
          };

          try {
            await api.post('/transactions', {
              type,
              head,
              amount,
              description: desc,
              payment_mode: 'Cash',
            });
            const tRes = await api.get('/transactions');
            if (Array.isArray(tRes.data) && tRes.data.length > 0) {
              transactions = tRes.data.map(t => ({
                id: t.id,
                voucher_no: t.voucher_no || `VCH-${String(t.id).padStart(4, '0')}`,
                type: t.type,
                category: t.head || t.category || 'General',
                head: t.head || t.category || 'General',
                description: t.description || 'Transaction record',
                amount: parseFloat(t.amount) || 0,
                date: t.date || (t.created_at ? t.created_at.split(' ')[0] : '2026-09-28'),
              }));
            }
          } catch (e) {
            console.warn('Transaction API sync fallback:', e);
          }

          if (window.SS_STORE) {
            window.SS_STORE.add('transactions', newTxn);
          } else if (!transactions.some(t => t.voucher_no === newTxn.voucher_no)) {
            transactions.unshift(newTxn);
          }

          if (window.showToast) window.showToast(`Transaction of ₹${amount.toLocaleString()} logged`, 'success');
          window.dispatchEvent(new Event('hashchange'));
          return true;
        }
      });
    };
  }
}

// Global export for online payments across all modules
window.openOnlinePaymentModal = openOnlinePaymentModal;

