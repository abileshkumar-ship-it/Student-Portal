/* ============================================================
   THE MA FOI FOUNDATION — app.js
   Student registration form only.
   Admin dashboard → admin.html
   ============================================================ */

const CFG = {
  SUPABASE_URL:      'https://sybbmwncglqzwnruzyuf.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5YmJtd25jZ2xxenducnV6eXVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzOTQ4MTgsImV4cCI6MjEwMDk3MDgxOH0.QSSKWVf_w0VFwl0FKvK8UWWWMVhPYdzdxGWeLoS2AjY',
  TABLE: 'student_interest',
};

/* ── SUPABASE HELPERS ── */
const sbHeaders = () => ({
  'Content-Type':  'application/json',
  'apikey':        CFG.SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${CFG.SUPABASE_ANON_KEY}`,
  'Prefer':        'return=representation',
});

async function sbInsert(row) {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const url = isLocal
    ? `${CFG.SUPABASE_URL}/rest/v1/${CFG.TABLE}`
    : '/api/register';
  const options = isLocal ? {
    method: 'POST',
    headers: sbHeaders(),
    body: JSON.stringify(row),
  } : {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(row),
  };
  const res = await fetch(url, options);
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
  t._timer = setTimeout(() => { t.classList.remove('show'); }, 4500);
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

/* ── LOCATION & BRANCH MAPPINGS ── */
const COURSE_CITIES = {
  'Gold Loan':               ['Chennai'],
  'Artificial Intelligence': ['Chennai'],
  'Cyber Security':          ['Chennai'],
  'BFSI':                    ['Bangalore'],
  'Micro Finance':           ['Bangalore'],
  'Data Analytics':          ['Chennai', 'Bangalore'],
};
// Branches now depend on BOTH the course and the city (not city alone)
const COURSE_CITY_BRANCHES = {
  'Gold Loan':               { 'Chennai':   ['Broadway', 'Egmore'] },
  'Micro Finance':           { 'Bangalore': ['Chamrajpet', 'Yeshwanthpur'] },
  'Data Analytics':          { 'Chennai': ['Egmore'], 'Bangalore': ['Chamrajpet'] },
  'BFSI':                    { 'Bangalore': ['Chamrajpet'] },
  'Artificial Intelligence': { 'Chennai':   ['Egmore'] },
  'Cyber Security':          { 'Chennai':   [] }, // no branch for this course
};

/* ── RESET LOCATION & BRANCH ── */
function resetLocationBranch() {
  $('cityGroup').classList.add('hidden');
  $('branchGroup').classList.add('hidden');
  $('preferredLocation').innerHTML = '<option value="">-- Select City --</option>';
  $('preferredBranch').innerHTML   = '<option value="">-- Select Branch --</option>';
  clearErr('preferredLocation', 'errLocation');
  clearErr('preferredBranch', 'errBranch');
}

/* ── POPULATE BRANCHES BASED ON COURSE + CITY ── */
function populateBranches(course, city) {
  const branches = (COURSE_CITY_BRANCHES[course] && COURSE_CITY_BRANCHES[course][city]) || [];
  if (!branches.length) {
    // e.g. Cyber Security → no branch field at all
    $('branchGroup').classList.add('hidden');
    $('preferredBranch').innerHTML = '<option value="">-- Select Branch --</option>';
    clearErr('preferredBranch', 'errBranch');
    return;
  }
  $('preferredBranch').innerHTML = '<option value="">-- Select Branch --</option>' +
    branches.map(b => `<option value="${b}">${b}</option>`).join('');
  $('branchGroup').classList.remove('hidden');
}

/* ── TRAINING CHANGE → UPDATE CITIES ── */
$('training')?.addEventListener('change', function () {
  resetLocationBranch();
  const course = this.value;
  if (!course) return;
  const cities = COURSE_CITIES[course] || [];
  const citySelect = $('preferredLocation');
  if (cities.length === 1) {
    citySelect.innerHTML = `<option value="${cities[0]}">${cities[0]}</option>`;
    $('cityGroup').classList.remove('hidden');
    populateBranches(course, cities[0]);
  } else {
    citySelect.innerHTML = '<option value="">-- Select City --</option>' +
      cities.map(c => `<option value="${c}">${c}</option>`).join('');
    $('cityGroup').classList.remove('hidden');
  }
});
/* ── CITY CHANGE → UPDATE BRANCHES ── */
$('preferredLocation')?.addEventListener('change', function () {
  $('branchGroup').classList.add('hidden');
  $('preferredBranch').innerHTML = '<option value="">-- Select Branch --</option>';
  clearErr('preferredBranch', 'errBranch');
  if (!this.value) return;
  populateBranches($('training').value, this.value);
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
  $('cityGroup')?.classList.add('hidden');
  $('branchGroup')?.classList.add('hidden');
  if ($('preferredLocation')) $('preferredLocation').innerHTML = '<option value="">-- Select City --</option>';
  if ($('preferredBranch'))   $('preferredBranch').innerHTML  = '<option value="">-- Select Branch --</option>';
}

function validateForm() {
  let ok = true;

  const name = $('fullName').value.trim();
  if (!name || name.length < 2) { showErr('fullName', 'errName'); ok = false; } else clearErr('fullName', 'errName');

  const email = $('email').value.replace(/\s+/g, '').toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { showErr('email', 'errEmail'); ok = false; }
  else { clearErr('email', 'errEmail'); $('email').value = email; }

  if (!$('currentEducation').value) { showErr('currentEducation', 'errEdu'); ok = false; } else clearErr('currentEducation', 'errEdu');

  if (!$('currentYear').value) { showErr('currentYear', 'errYear'); ok = false; } else clearErr('currentYear', 'errYear');

  if (!$('higherStudies').value) { showErr('higherStudies', 'errHigher'); ok = false; } else clearErr('higherStudies', 'errHigher');

  if (!$('training').value) { showErr('training', 'errTraining'); ok = false; } else clearErr('training', 'errTraining');

  if (!$('preferredLocation').value) { showErr('preferredLocation', 'errLocation'); ok = false; } else clearErr('preferredLocation', 'errLocation');
  // Branch is only required when the branch field is actually shown (e.g. not for Cyber Security)
  const branchRequired = !$('branchGroup').classList.contains('hidden');
  if (branchRequired && !$('preferredBranch').value) { showErr('preferredBranch', 'errBranch'); ok = false; } else clearErr('preferredBranch', 'errBranch');

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
    education_status:  $('currentYear').value,
    preference:        $('higherStudies').value,
    training:          $('training').value,
    preferred_city:    $('preferredLocation').value,
    preferred_branch:  $('preferredBranch').value || null,
    whatsapp_number:   $('whatsappNumber').value.trim(),
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
    $('summaryLocation').textContent = payload.preferred_city;
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
  $('successCard').classList.add('hidden');
  $('formCard').classList.remove('hidden');
  document.querySelector('#register')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

/* ── HERO IMAGE FALLBACK ── */
const heroBgImg = document.querySelector('.hero-bg-img');
if (heroBgImg) {
  heroBgImg.addEventListener('error', () => {
    heroBgImg.style.display = 'none';
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
      heroSection.style.background =
        'linear-gradient(135deg, #0D1B2A 0%, #084298 50%, #0D6EFD 100%)';
    }
  });
}