/* ============================================================
   THE MA FOI FOUNDATION — app.js
   Direct Supabase connection · No backend required
   ============================================================ */

/* ----------------------------------------------------------------
   ⚙  CONFIGURATION  — fill these in before deploying
   ----------------------------------------------------------------
   1. SUPABASE_URL  : Project Settings → API → Project URL
   2. SUPABASE_ANON_KEY : Project Settings → API → anon public key
   3. ADMIN_PASSWORD    : plain-text password for the admin panel
      (change this to something strong!)
   ---------------------------------------------------------------- */
const CFG = {
  SUPABASE_URL:      'https://sybbmwncglqzwnruzyuf.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5YmJtd25jZ2xxenducnV6eXVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzOTQ4MTgsImV4cCI6MjEwMDk3MDgxOH0.QSSKWVf_w0VFwl0FKvK8UWWWMVhPYdzdxGWeLoS2AjY',   // ← paste your anon key here
  ADMIN_PASSWORD:    'MaFoi@2025!',               // ← change this
  TABLE:             'student_interest',
  PAGE_SIZE:         20,
};

/* ----------------------------------------------------------------
   SUPABASE MINI-CLIENT  (no npm required)
   ---------------------------------------------------------------- */
const SB = {
  headers: () => ({
    'Content-Type':  'application/json',
    'apikey':        CFG.SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${CFG.SUPABASE_ANON_KEY}`,
    'Prefer':        'return=representation',
  }),

  async insert(row) {
    const res = await fetch(
      `${CFG.SUPABASE_URL}/rest/v1/${CFG.TABLE}`,
      { method: 'POST', headers: SB.headers(), body: JSON.stringify(row) }
    );
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Insert failed (${res.status})`);
    }
    return res.json();
  },

  async select(params = {}) {
    const q = new URLSearchParams();
    if (params.search) {
      // PostgREST OR filter
      q.set('or', `(full_name.ilike.*${params.search}*,email.ilike.*${params.search}*,whatsapp_number.ilike.*${params.search}*)`);
    }
    if (params.training)  q.set('training', `eq.${params.training}`);
    if (params.education) q.set('current_education', `eq.${params.education}`);
    q.set('order', 'created_at.desc');

    const from = params.page * CFG.PAGE_SIZE;
    const to   = from + CFG.PAGE_SIZE - 1;

    const res = await fetch(
      `${CFG.SUPABASE_URL}/rest/v1/${CFG.TABLE}?${q.toString()}`,
      {
        headers: {
          ...SB.headers(),
          'Range': `${from}-${to}`,
          'Prefer': 'count=exact',
        }
      }
    );
    if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
    const total = parseInt(res.headers.get('Content-Range')?.split('/')[1] || '0', 10);
    const data  = await res.json();
    return { data, total };
  },

  async selectAll(params = {}) {
    const q = new URLSearchParams();
    if (params.search) {
      q.set('or', `(full_name.ilike.*${params.search}*,email.ilike.*${params.search}*,whatsapp_number.ilike.*${params.search}*)`);
    }
    if (params.training)  q.set('training', `eq.${params.training}`);
    if (params.education) q.set('current_education', `eq.${params.education}`);
    q.set('order', 'created_at.desc');

    const res = await fetch(
      `${CFG.SUPABASE_URL}/rest/v1/${CFG.TABLE}?${q.toString()}`,
      { headers: { ...SB.headers(), 'Prefer': 'count=exact', 'Range': '0-9999' } }
    );
    if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
    return res.json();
  },
};

/* ----------------------------------------------------------------
   UTILITIES
   ---------------------------------------------------------------- */
function $(id) { return document.getElementById(id); }

function showToast(msg, type = 'info') {
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.className = `toast t-${type}`;
  t.innerHTML = `<span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span><span>${msg}</span>`;
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('show')));
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.classList.remove('show'); }, 3800);
}

function debounce(fn, ms = 320) {
  let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
}

function sanitize(s) {
  return (s || '').trim().replace(/[<>"'%;()&+]/g, '').trim();
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
}

function trainingBadge(t) {
  const map = { 'Gold Loan': 'b-gold', 'Micro Finance': 'b-micro', 'Data Analytics': 'b-data', 'BFSI': 'b-bfsi' };
  return map[t] || 'b-bfsi';
}

/* ----------------------------------------------------------------
   HEADER SCROLL
   ---------------------------------------------------------------- */
window.addEventListener('scroll', () => {
  document.querySelector('.site-header')?.classList.toggle('scrolled', scrollY > 20);
}, { passive: true });

/* ----------------------------------------------------------------
   SMOOTH SCROLL
   ---------------------------------------------------------------- */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});

/* ----------------------------------------------------------------
   FORM — dynamic year field
   ---------------------------------------------------------------- */
const UG_YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const PG_YEARS = ['1st Year', '2nd Year'];

$('currentEducation')?.addEventListener('change', function () {
  const yg = $('yearGroup');
  const ys = $('currentYear');
  if (!this.value) { yg.classList.add('hidden'); return; }
  const years = this.value.startsWith('UG') ? UG_YEARS : PG_YEARS;
  ys.innerHTML = '<option value="">-- Select Year --</option>' +
    years.map(y => `<option value="${y}">${y}</option>`).join('');
  yg.classList.remove('hidden');
});

/* ----------------------------------------------------------------
   FORM — validation
   ---------------------------------------------------------------- */
function showErr(fieldId, errId) {
  $(fieldId)?.classList.add('error');
  const e = $(errId); if (e) e.classList.add('show');
}
function clearErr(fieldId, errId) {
  $(fieldId)?.classList.remove('error');
  const e = $(errId); if (e) e.classList.remove('show');
}
function clearAllErrors() {
  document.querySelectorAll('.field-error').forEach(e => e.classList.remove('show'));
  document.querySelectorAll('.form-input, .form-select').forEach(el => el.classList.remove('error'));
  document.querySelector('.phone-wrap')?.classList.remove('error');
}

function validateForm() {
  let ok = true;
  const name = $('fullName').value.trim();
  if (!name || name.length < 2) { showErr('fullName', 'errName'); ok = false; } else clearErr('fullName', 'errName');

  const email = $('email').value.replace(/\s+/g, '').toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { showErr('email', 'errEmail'); ok = false; } else { clearErr('email', 'errEmail'); $('email').value = email; }

  if (!$('currentEducation').value) { showErr('currentEducation', 'errEdu'); ok = false; } else clearErr('currentEducation', 'errEdu');

  const yg = $('yearGroup');
  if (!yg.classList.contains('hidden') && !$('currentYear').value) { showErr('currentYear', 'errYear'); ok = false; } else clearErr('currentYear', 'errYear');

  if (!$('higherStudies').value) { showErr('higherStudies', 'errHigher'); ok = false; } else clearErr('higherStudies', 'errHigher');
  if (!$('training').value)       { showErr('training', 'errTraining'); ok = false; } else clearErr('training', 'errTraining');

  const wa = $('whatsappNumber').value.trim();
  const pw = document.querySelector('.phone-wrap');
  if (!wa || !/^[6-9]\d{9}$/.test(wa)) {
    $('whatsappNumber').classList.add('error'); pw?.classList.add('error');
    $('errWa').classList.add('show'); ok = false;
  } else {
    $('whatsappNumber').classList.remove('error'); pw?.classList.remove('error');
    $('errWa').classList.remove('show');
  }
  return ok;
}

// WhatsApp digits only
$('whatsappNumber')?.addEventListener('input', function () {
  this.value = this.value.replace(/\D/g, '').slice(0, 10);
});

/* ----------------------------------------------------------------
   FORM — submit
   ---------------------------------------------------------------- */
$('registrationForm')?.addEventListener('submit', async function (e) {
  e.preventDefault();
  if (!validateForm()) {
    const firstErr = this.querySelector('.form-input.error, .form-select.error, .phone-wrap.error');
    firstErr?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  const btn = $('submitBtn');
  btn.disabled = true;
  $('submitBtnText').textContent = 'Submitting…';
  $('submitSpinner').classList.remove('hidden');

  const payload = {
    full_name:         sanitize($('fullName').value),
    email:             $('email').value.trim().toLowerCase(),
    current_education: $('currentEducation').value,
    current_year:      $('currentYear').value || '',
    higher_studies:    $('higherStudies').value,
    training:          $('training').value,
    whatsapp_number:   $('whatsappNumber').value.trim(),
  };

  try {
    await SB.insert(payload);
    $('formCard').classList.add('hidden');
    $('successCard').classList.remove('hidden');
    $('successCard').scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (err) {
    showToast(err.message || 'Registration failed. Please try again.', 'error');
  } finally {
    btn.disabled = false;
    $('submitBtnText').textContent = 'Register';
    $('submitSpinner').classList.add('hidden');
  }
});

$('anotherResponseBtn')?.addEventListener('click', () => {
  $('registrationForm').reset();
  clearAllErrors();
  $('yearGroup').classList.add('hidden');
  $('successCard').classList.add('hidden');
  $('formCard').classList.remove('hidden');
  document.querySelector('#register')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

/* ----------------------------------------------------------------
   ADMIN MODAL — open / close
   ---------------------------------------------------------------- */
$('adminNavBtn')?.addEventListener('click', () => openAdminLogin());

function openAdminLogin() {
  $('adminLoginModal').classList.remove('hidden');
  $('adminUsername').value = '';
  $('adminPassword').value = '';
  $('loginError').classList.remove('show');
  setTimeout(() => $('adminUsername').focus(), 100);
}

function closeModal(id) { $(id).classList.add('hidden'); }

$('closeLoginModal')?.addEventListener('click',   () => closeModal('adminLoginModal'));
$('closeDashModal')?.addEventListener('click',    () => closeModal('adminDashModal'));
$('adminLoginModal')?.addEventListener('click', e => { if (e.target === $('adminLoginModal')) closeModal('adminLoginModal'); });
$('adminDashModal')?.addEventListener('click',  e => { if (e.target === $('adminDashModal'))  closeModal('adminDashModal'); });

// Password toggle
$('toggleAdminPw')?.addEventListener('click', function () {
  const pw = $('adminPassword');
  const isText = pw.type === 'text';
  pw.type = isText ? 'password' : 'text';
  this.textContent = isText ? '👁' : '🙈';
});

/* ----------------------------------------------------------------
   ADMIN LOGIN
   ---------------------------------------------------------------- */
$('adminLoginForm')?.addEventListener('submit', async function (e) {
  e.preventDefault();
  const user = $('adminUsername').value.trim();
  const pass = $('adminPassword').value;
  const errEl = $('loginError');

  if (!user || !pass) { errEl.textContent = 'Please enter username and password.'; errEl.classList.add('show'); return; }

  // Simple local password check (username: admin, password from CFG)
  if (user !== 'admin' || pass !== CFG.ADMIN_PASSWORD) {
    errEl.textContent = 'Invalid username or password.';
    errEl.classList.add('show');
    return;
  }

  // Mark session
  sessionStorage.setItem('mafoi_admin', '1');
  closeModal('adminLoginModal');
  await openAdminDash();
});

/* ----------------------------------------------------------------
   ADMIN DASHBOARD
   ---------------------------------------------------------------- */
let dashState = { page: 0, search: '', training: '', education: '', total: 0, totalPages: 0 };

async function openAdminDash() {
  $('adminDashModal').classList.remove('hidden');
  dashState = { ...dashState, page: 0, search: '', training: '', education: '' };
  $('dashSearch').value = '';
  $('dashTraining').value = '';
  $('dashEducation').value = '';
  await loadStats();
  await loadTable();
}

async function loadStats() {
  try {
    const all = await SB.selectAll({});
    const total       = all.length;
    const goldLoan    = all.filter(r => r.training === 'Gold Loan').length;
    const micro       = all.filter(r => r.training === 'Micro Finance').length;
    const data        = all.filter(r => r.training === 'Data Analytics').length;
    const bfsi        = all.filter(r => r.training === 'BFSI').length;

    $('statTotal').textContent = total;
    $('statGold').textContent  = goldLoan;
    $('statMicro').textContent = micro;
    $('statData').textContent  = data;
    $('statBfsi').textContent  = bfsi;
  } catch { /* silently ignore stats error */ }
}

async function loadTable() {
  const tbody = $('dashTableBody');
  tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;padding:32px;color:var(--text-muted);">
    <div style="width:28px;height:28px;border:2.5px solid var(--border);border-top-color:var(--primary);border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 10px;"></div>Loading…</td></tr>`;

  try {
    const { data, total } = await SB.select({
      search:    dashState.search,
      training:  dashState.training,
      education: dashState.education,
      page:      dashState.page,
    });

    dashState.total      = total;
    dashState.totalPages = Math.ceil(total / CFG.PAGE_SIZE);

    $('tableInfo').textContent = `${total.toLocaleString()} registration${total !== 1 ? 's' : ''} found`;
    renderTable(data);
    renderPagination();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="9" class="table-empty"><div class="table-empty-icon">⚠️</div><p>${err.message}</p></td></tr>`;
  }
}

function renderTable(rows) {
  const tbody = $('dashTableBody');
  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="table-empty"><div class="table-empty-icon">📭</div><h4>No registrations found</h4><p>Try adjusting your search or filter.</p></div></td></tr>`;
    return;
  }
  const offset = dashState.page * CFG.PAGE_SIZE;
  tbody.innerHTML = rows.map((r, i) => `
    <tr>
      <td style="color:var(--text-muted);font-size:12px;">${offset + i + 1}</td>
      <td style="font-weight:600;">${r.full_name || '—'}</td>
      <td style="color:var(--primary);font-size:12px;">${r.email || '—'}</td>
      <td style="font-size:12px;">${r.current_education || '—'}</td>
      <td style="font-size:12px;">${r.current_year || '—'}</td>
      <td><span class="badge ${r.higher_studies === 'Yes' ? 'b-yes' : 'b-no'}">${r.higher_studies || '—'}</span></td>
      <td><span class="badge ${trainingBadge(r.training)}">${r.training || '—'}</span></td>
      <td style="font-family:monospace;font-size:12px;">${r.whatsapp_number || '—'}</td>
      <td style="font-size:11px;white-space:nowrap;color:var(--text-muted);">${formatDate(r.created_at)}</td>
    </tr>
  `).join('');
}

function renderPagination() {
  const { page, total, totalPages } = dashState;
  const start = page * CFG.PAGE_SIZE + 1;
  const end   = Math.min((page + 1) * CFG.PAGE_SIZE, total);
  $('pageInfo').textContent = total ? `Showing ${start}–${end} of ${total.toLocaleString()}` : '';

  const btns = $('pageBtns');
  btns.innerHTML = '';

  const prev = document.createElement('button');
  prev.className = 'page-btn'; prev.textContent = '‹'; prev.disabled = page === 0;
  prev.addEventListener('click', () => goPage(page - 1));
  btns.appendChild(prev);

  const maxBtn = 5;
  let pages = [];
  if (totalPages <= maxBtn) {
    pages = Array.from({ length: totalPages }, (_, i) => i);
  } else {
    pages = [0];
    if (page > 2) pages.push('…');
    for (let i = Math.max(1, page - 1); i <= Math.min(totalPages - 2, page + 1); i++) pages.push(i);
    if (page < totalPages - 3) pages.push('…');
    pages.push(totalPages - 1);
  }

  pages.forEach(p => {
    const b = document.createElement('button');
    b.className = 'page-btn' + (p === page ? ' active' : '');
    b.textContent = p === '…' ? '…' : p + 1;
    b.disabled = p === '…';
    if (p !== '…') b.addEventListener('click', () => goPage(p));
    btns.appendChild(b);
  });

  const next = document.createElement('button');
  next.className = 'page-btn'; next.textContent = '›'; next.disabled = page >= totalPages - 1;
  next.addEventListener('click', () => goPage(page + 1));
  btns.appendChild(next);
}

function goPage(p) {
  dashState.page = p;
  loadTable();
}

// Search & filter
const debouncedSearch = debounce(() => { dashState.page = 0; loadTable(); }, 400);
$('dashSearch')?.addEventListener('input', function () { dashState.search = this.value.trim(); debouncedSearch(); });
$('dashTraining')?.addEventListener('change', function () { dashState.training = this.value; dashState.page = 0; loadTable(); });
$('dashEducation')?.addEventListener('change', function () { dashState.education = this.value; dashState.page = 0; loadTable(); });

/* ----------------------------------------------------------------
   EXCEL EXPORT  (SheetJS via CDN)
   ---------------------------------------------------------------- */
$('exportExcelBtn')?.addEventListener('click', async function () {
  this.textContent = '⏳ Exporting…';
  this.disabled = true;

  try {
    const rows = await SB.selectAll({
      search:    dashState.search,
      training:  dashState.training,
      education: dashState.education,
    });

    if (!rows.length) { showToast('No data to export.', 'error'); return; }

    // Build worksheet data
    const headers = [
      'Registration ID', 'Full Name', 'Email ID', 'Current Education',
      'Year of Study', 'Higher Studies', 'Training', 'WhatsApp Number', 'Registered On'
    ];

    const wsData = [headers, ...rows.map(r => [
      r.id,
      r.full_name        || '',
      r.email            || '',
      r.current_education|| '',
      r.current_year     || '',
      r.higher_studies   || '',
      r.training         || '',
      r.whatsapp_number  || '',
      formatDate(r.created_at),
    ])];

    // SheetJS
    const XLSX = window.XLSX;
    if (!XLSX) { showToast('Excel library not loaded. Check internet connection.', 'error'); return; }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Column widths
    ws['!cols'] = [8, 22, 28, 22, 12, 14, 16, 16, 22].map(w => ({ wch: w }));

    // Bold header style (basic)
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c });
      if (!ws[addr]) continue;
      ws[addr].s = { font: { bold: true }, fill: { fgColor: { rgb: 'BBDEFB' } }, alignment: { horizontal: 'center' } };
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Student Registrations');

    const filename = `MaFoi_Registrations_${new Date().toISOString().slice(0,10)}.xlsx`;
    XLSX.writeFile(wb, filename);
    showToast(`Downloaded ${rows.length} records successfully!`, 'success');
  } catch (err) {
    showToast('Export failed: ' + err.message, 'error');
  } finally {
    this.textContent = '📥 Download Excel';
    this.disabled = false;
  }
});

/* ----------------------------------------------------------------
   LOGOUT
   ---------------------------------------------------------------- */
$('dashLogoutBtn')?.addEventListener('click', () => {
  sessionStorage.removeItem('mafoi_admin');
  closeModal('adminDashModal');
  showToast('Logged out successfully.', 'success');
});

/* ----------------------------------------------------------------
   AUTO-REOPEN DASHBOARD if session exists
   ---------------------------------------------------------------- */
if (sessionStorage.getItem('mafoi_admin') === '1') {
  // Re-open dashboard on page reload during same session
  window.addEventListener('DOMContentLoaded', () => openAdminDash(), { once: true });
}
