/* ============================================================
   THE MA FOI FOUNDATION — app.js
   Student registration form only.
   Admin dashboard → admin.html
   ============================================================ */

const CFG = {
  SUPABASE_URL:      'https://sybbmwncglqzwnruzyuf.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5YmJtd25jZ2xxenducnV6eXVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzOTQ4MTgsImV4cCI6MjEwMDk3MDgxOH0.QSSKWVf_w0VFwl0FKvK8UWWWMVhPYdzdxGWeLoS2AjY',
  ADMIN_PASSWORD:    'TMF@2026',
  TABLE:             'student_interest',
};

/* ── SUPABASE INSERT ── */
async function sbInsert(row) {
  const res = await fetch(`${CFG.SUPABASE_URL}/rest/v1/${CFG.TABLE}`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        CFG.SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${CFG.SUPABASE_ANON_KEY}`,
      'Prefer':        'return=representation',
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Insert failed (${res.status})`);
  }
  return res.json();
}

/* ── UTILS ── */
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

function sanitize(s) {
  return (s || '').trim().replace(/[<>"'%;()&+]/g, '').trim();
}

/* ── HEADER SCROLL ── */
window.addEventListener('scroll', () => {
  document.querySelector('.site-header')?.classList.toggle('scrolled', scrollY > 20);
}, { passive: true });

/* ── SMOOTH SCROLL ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});

/* ── DYNAMIC YEAR FIELD ── */
const UG_YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const PG_YEARS = ['1st Year', '2nd Year'];

const BRANCHES = {
  'Bengaluru': ['Chamrajpet', 'Yeshwanthpur'],
  'Chennai':   ['Egmore', 'Kodambakkam', 'Anna Nagar'],
};

$('preferredLocation')?.addEventListener('change', function () {
  const bg = $('branchGroup');
  const bs = $('preferredBranch');
  if (!this.value) { bg.classList.add('hidden'); bs.innerHTML = '<option value="">-- Select Branch --</option>'; return; }
  const branches = BRANCHES[this.value] || [];
  bs.innerHTML = '<option value="">-- Select Branch --</option>' +
    branches.map(b => `<option value="${b}">${b}</option>`).join('');
  bg.classList.remove('hidden');
});

$('currentEducation')?.addEventListener('change', function () {
  const yg = $('yearGroup');
  const ys = $('currentYear');
  if (!this.value) { yg.classList.add('hidden'); return; }
  const years = this.value.startsWith('UG') ? UG_YEARS : PG_YEARS;
  ys.innerHTML = '<option value="">-- Select Year --</option>' +
    years.map(y => `<option value="${y}">${y}</option>`).join('');
  yg.classList.remove('hidden');
});

/* ── VALIDATION ── */
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
  $('branchGroup')?.classList.add('hidden');
  if ($('preferredLocation')) $('preferredLocation').value = '';
  if ($('preferredBranch'))   $('preferredBranch').innerHTML = '<option value="">-- Select Branch --</option>';
}

function validateForm() {
  let ok = true;
  const name = $('fullName').value.trim();
  if (!name || name.length < 2) { showErr('fullName', 'errName'); ok = false; } else clearErr('fullName', 'errName');

  const email = $('email').value.replace(/\s+/g, '').toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { showErr('email', 'errEmail'); ok = false; }
  else { clearErr('email', 'errEmail'); $('email').value = email; }

  if (!$('currentEducation').value) { showErr('currentEducation', 'errEdu'); ok = false; } else clearErr('currentEducation', 'errEdu');

  const yg = $('yearGroup');
  if (!yg.classList.contains('hidden') && !$('currentYear').value) { showErr('currentYear', 'errYear'); ok = false; } else clearErr('currentYear', 'errYear');

  if (!$('higherStudies').value) { showErr('higherStudies', 'errHigher'); ok = false; } else clearErr('higherStudies', 'errHigher');
  if (!$('preferredLocation').value) { showErr('preferredLocation', 'errLocation'); ok = false; } else clearErr('preferredLocation', 'errLocation');
  const bg2 = $('branchGroup');
  if (!bg2.classList.contains('hidden') && !$('preferredBranch').value) { showErr('preferredBranch', 'errBranch'); ok = false; } else clearErr('preferredBranch', 'errBranch');
  if (!$('training').value)      { showErr('training', 'errTraining'); ok = false; } else clearErr('training', 'errTraining');

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

/* ── WHATSAPP DIGITS ONLY ── */
$('whatsappNumber')?.addEventListener('input', function () {
  this.value = this.value.replace(/\D/g, '').slice(0, 10);
});

/* ── FORM SUBMIT ── */
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
    preference:        $('higherStudies').value,
    training:          $('training').value,
    whatsapp_number:   $('whatsappNumber').value.trim(),
    preferred_location: $('preferredLocation').value,
    preferred_branch:   $('preferredBranch').value,
  };

  try {
    await sbInsert(payload);

    // Facebook Lead Event — fires ONLY after successful registration
    if (typeof fbq !== 'undefined') {
      fbq('track', 'Lead');
    }

    $('summaryName').textContent     = payload.full_name;
    $('summaryEmail').textContent    = payload.email;
    $('summaryTraining').textContent = payload.training;
    $('summaryLocation').textContent = payload.preferred_location;
    $('summaryBranch').textContent   = payload.preferred_branch;
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

/* ── SUBMIT ANOTHER ── */
$('anotherResponseBtn')?.addEventListener('click', () => {
  $('registrationForm').reset();
  clearAllErrors();
  $('yearGroup').classList.add('hidden');
  $('branchGroup').classList.add('hidden');
  $('successCard').classList.add('hidden');
  $('formCard').classList.remove('hidden');
  document.querySelector('#register')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});