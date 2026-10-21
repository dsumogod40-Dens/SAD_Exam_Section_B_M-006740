const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sb = supabase.createClient(CONFIG.url, CONFIG.anonKey);
let me = null, editing = null, mine = [], sel = null;

const say = (t, bad) => { const m = $('#msg'); m.textContent = t || ''; m.className = t ? (bad ? 'err' : 'ok') : ''; };
const run = async f => { try { say(''); await f(); } catch (e) { say(e.message || String(e), true); } };
const rpc = async (fn, args) => { const { data, error } = await sb.rpc(fn, args); if (error) throw error; return data; };
const ok = r => { if (r.error) throw r.error; return r.data; };
const chip = v => `<span class="chip c-${esc(v).toLowerCase().replace(/ /g, '-')}">${esc(v)}</span>`;
const fmt = d => d ? new Date(d).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' }) : '';
const num = id => { const v = $(id).value.trim(); return v === '' ? null : Number(v); };
const show = v => { ['login', 'scholar', 'staff'].forEach(x => $('#v-' + x).hidden = x !== v); document.body.classList.toggle('in', v !== 'login'); };
const NAV = { scholar: [['p-dash', 'Dashboard'], ['p-submit', 'Submit grades'], ['p-mine', 'My submissions'], ['p-access', 'Access check']],
              staff: [['p-sdash', 'Dashboard'], ['p-list', 'Submissions'], ['p-reg', 'Register scholar']] };
const go = id => { document.querySelectorAll('.pane').forEach(p => p.hidden = p.id !== id);
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.go === id)); $('#side').classList.remove('open'); };
const ttl = () => { $('#ttl').textContent = `AY: ${$('#f-ay').value}, ${$('#f-sem').value === '1' ? 'First' : 'Second'} Semester`; };
const fillAY = el => { el.innerHTML = ['2024-2025', '2025-2026', '2026-2027', '2027-2028'].map(y => `<option ${y === '2026-2027' ? 'selected' : ''}>${y}</option>`).join(''); };

async function boot() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return show('login');
  $('#out').hidden = false;
  const { data: p } = await sb.from('profiles').select('*').eq('auth_user_id', session.user.id).maybeSingle();
  if (!p) { say('This login has no scholarship profile yet. Ask the Scholarship Office to register you.', true); return show('login'); }
  me = p; $('#who').textContent = `${p.full_name} (${p.role})`;
  show(p.role);
  $('#nav').innerHTML = NAV[p.role].map(([id, t]) => `<button data-go="${id}">${t}</button>`).join('');
  go(NAV[p.role][0][0]); $('#bf').hidden = p.role !== 'staff';
  if (p.role === 'scholar') $('#ttl').textContent = 'Scholar portal';
  p.role === 'staff' ? initStaff() : initScholar();
}

$('#login').onsubmit = e => { e.preventDefault(); run(async () => {
  const { error } = await sb.auth.signInWithPassword({ email: $('#email').value.trim(), password: $('#pw').value });
  if (error) throw error;
  $('#pw').value = ''; await boot();
}); };
$('#out').onclick = async () => { await sb.auth.signOut(); me = null; $('#who').textContent = ''; $('#out').hidden = true; say(''); show('login'); };

/* ---------------- Scholar ---------------- */
function initScholar() { fillAY($('#s-ay')); run(loadMine); }

async function loadMine() {
  mine = ok(await sb.from('submissions').select('*').order('academic_year', { ascending: false }).order('semester', { ascending: false }));
  const c = f => mine.filter(f).length;
  $('#s-stats').innerHTML = [['Submissions', mine.length], ['Pending verification', c(s => s.verification_status === 'Pending')],
    ['Compliant', c(s => s.compliance_result === 'Compliant')], ['Renewals approved', c(s => s.renewal_decision === 'Approved')]]
    .map(([k, v]) => `<div class="stat"><b>${v}</b>${k}</div>`).join('');
  const ids = mine.map(s => s.id);
  const logs = ids.length ? ok(await sb.from('history_log').select('*').in('submission_id', ids).order('created_at')) : [];
  $('#mine').innerHTML = mine.length ? mine.map(s => `
    <div style="border-top:1px solid var(--line);padding:12px 0">
      <b>AY ${esc(s.academic_year)}, Semester ${s.semester}</b> <span class="muted">submitted ${fmt(s.submitted_at)}</span>
      <div class="row">Submission ${chip(s.verification_status)} Compliance ${chip(s.compliance_result)} Renewal ${chip(s.renewal_decision)}</div>
      <div class="muted">GWA ${Number(s.gwa).toFixed(2)} | ${s.enrolled_units} units | failed ${s.failed_count} | incomplete ${s.incomplete_count} | dropped ${s.dropped_count}</div>
      ${s.verification_status === 'Returned' ? `<p class="fail">Returned: ${esc(s.return_reason)}</p><button data-edit="${s.id}">Correct and resubmit</button>` : ''}
      ${s.deficiency_reasons.length ? `<ul class="fail">${s.deficiency_reasons.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
      ${s.decision_note ? `<p>Decision note: ${esc(s.decision_note)}</p>` : ''}
      <details><summary>History</summary>${histTable(logs.filter(l => l.submission_id === s.id))}</details>
    </div>`).join('') : '<p class="muted">No submissions yet. Submit your first semester above.</p>';
}

const histTable = logs => logs.length ? `<table><tr><th>When</th><th>Action</th><th>Change</th><th>Note</th></tr>${logs.map(l =>
  `<tr><td>${fmt(l.created_at)}</td><td>${esc(l.action_type)}${l.actor ? ' by ' + esc(l.actor.full_name) : ''}</td><td>${esc(l.old_value || '')} to ${esc(l.new_value || '')}</td><td>${esc(l.note || '')}</td></tr>`).join('')}</table>` : '<p class="muted">No history.</p>';

function resetForm() {
  editing = null; $('#sform').reset(); $('#s-title').textContent = 'Submit semester grades';
  $('#s-go').textContent = 'Submit grades'; $('#s-cancel').hidden = true;
  $('#s-ay').disabled = $('#s-sem').disabled = false; fillAY($('#s-ay'));
}
$('#s-cancel').onclick = resetForm;

$('#mine').onclick = e => {
  const s = mine.find(x => x.id === e.target.dataset.edit); if (!s) return;
  editing = s; $('#s-title').textContent = `Correct and resubmit: AY ${s.academic_year}, Semester ${s.semester}`;
  $('#s-ay').innerHTML = `<option>${s.academic_year}</option>`; $('#s-sem').value = s.semester;
  $('#s-ay').disabled = $('#s-sem').disabled = true;
  $('#s-gwa').value = s.gwa; $('#s-units').value = s.enrolled_units; $('#s-failed').value = s.failed_count;
  $('#s-inc').value = s.incomplete_count; $('#s-drop').value = s.dropped_count; $('#s-ev').value = s.evidence_ref;
  $('#s-go').textContent = 'Resubmit'; $('#s-cancel').hidden = false; $('#sform').scrollIntoView();
};

$('#sform').onsubmit = e => { e.preventDefault(); run(async () => {
  const f = { p_gwa: num('#s-gwa'), p_units: num('#s-units'), p_failed: num('#s-failed'),
              p_incomplete: num('#s-inc'), p_dropped: num('#s-drop'), p_evidence: $('#s-ev').value };
  if (editing) await rpc('resubmit_grades', { p_submission_id: editing.id, ...f });
  else await rpc('submit_grades', { p_academic_year: $('#s-ay').value, p_semester: Number($('#s-sem').value), ...f });
  say(editing ? 'Resubmitted. Your record is back to Pending verification.' : 'Submitted. Your record is Pending verification.');
  resetForm(); await loadMine();
}); };

$('#acc').onclick = () => run(async () => {
  const r = await sb.from('submission_overview').select('id').eq('student_id', 'B02');
  let v; try { await rpc('verify_submission', { p_submission_id: '00000000-0000-0000-0000-000000000000', p_status: 'Verified' }); v = 'ALLOWED (defect)'; }
  catch (e) { v = 'denied: ' + e.message; }
  $('#acc-out').textContent = `Read B02: ${r.error ? r.error.message : r.data.length + ' row(s) returned'}. Verify as scholar: ${v}`;
});

/* ---------------- Staff ---------------- */
async function initStaff() {
  fillAY($('#f-ay'));
  const progs = ok(await sb.from('programs').select('*').order('name'));
  const opts = progs.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  $('#r-prog').innerHTML = opts;
  $('#f-prog').innerHTML = '<option value="">All programs</option>' + progs.map(p => `<option>${esc(p.name)}</option>`).join('');
  run(refresh);
}
const ay = () => $('#f-ay').value, sem = () => Number($('#f-sem').value);

async function refresh() { ttl(); await Promise.all([stats(), list()]); if (sel) await detail(sel); }

async function stats() {
  const c = await rpc('dashboard_counts', { p_academic_year: ay(), p_semester: sem() });
  $('#stats').innerHTML = [['Assigned scholars', c.assigned], ['Pending verification', c.pending], ['Compliant', c.compliant], ['With deficiency', c.deficiency]]
    .map(([k, v]) => `<div class="stat"><b>${v}</b>${k}</div>`).join('');
}

async function list() {
  let q = sb.from('submission_overview').select('*').eq('academic_year', ay()).eq('semester', sem()).order('student_id');
  const t = $('#f-q').value.trim().replace(/[,()%*]/g, '');
  if (t) q = q.or(`student_id.ilike.%${t}%,full_name.ilike.%${t}%`);
  if ($('#f-prog').value) q = q.eq('program_name', $('#f-prog').value);
  if ($('#f-comp').value) q = q.eq('compliance_result', $('#f-comp').value);
  const rows = ok(await q);
  $('#rows').innerHTML = rows.length ? rows.map(s => `<tr data-id="${s.id}" class="${s.id === sel ? 'on' : ''}">
    <td>${esc(s.student_id)}</td><td>${esc(s.full_name)}</td><td>${esc(s.program_name)}</td>
    <td>${chip(s.verification_status)}</td><td>${chip(s.compliance_result)}</td><td>${chip(s.renewal_decision)}</td></tr>`).join('')
    : '<tr><td colspan="6" class="muted">No submissions match. Change the semester or clear the filters.</td></tr>';
}

['#f-ay', '#f-sem'].forEach(i => $(i).onchange = () => { sel = null; $('#detail').innerHTML = '<p class="muted">Select a submission to review.</p>'; run(refresh); });
['#f-prog', '#f-comp'].forEach(i => $(i).onchange = () => run(list));
$('#f-q').oninput = () => run(list);
$('#rows').onclick = e => { const tr = e.target.closest('tr[data-id]'); if (tr) run(async () => { await detail(tr.dataset.id); await list(); }); };

async function detail(id) {
  sel = id;
  const s = ok(await sb.from('submission_overview').select('*').eq('id', id).single());
  const logs = ok(await sb.from('history_log').select('*, actor:profiles!history_log_actor_id_fkey(full_name)').eq('submission_id', id).order('created_at'));
  const kv = (k, v) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`;
  $('#detail').innerHTML = `
    <h2>${esc(s.full_name)} (${esc(s.student_id)})</h2>
    <div class="muted">${esc(s.program_name)} | AY ${esc(s.academic_year)}, Semester ${s.semester}</div>
    <div class="row">Submission ${chip(s.verification_status)} Compliance ${chip(s.compliance_result)} Renewal ${chip(s.renewal_decision)}</div>
    <dl>${kv('GWA', Number(s.gwa).toFixed(2))}${kv('Units', s.enrolled_units)}${kv('Failed', s.failed_count)}${kv('Incomplete', s.incomplete_count)}${kv('Dropped', s.dropped_count)}${kv('Submitted', fmt(s.submitted_at))}</dl>
    <p>Evidence: ${esc(s.evidence_ref)}</p>
    ${s.return_reason ? `<p class="fail">Return reason: ${esc(s.return_reason)}</p>` : ''}
    ${s.evaluation_checks ? `<table><tr><th>Check</th><th>Rule</th><th>Actual</th><th></th></tr>${s.evaluation_checks.map(c =>
      `<tr><td>${esc(c.check)}</td><td>${esc(c.rule)}</td><td>${esc(c.actual)}</td><td class="${c.passed ? 'pass' : 'fail'}">${c.passed ? 'Pass' : 'Fail'}</td></tr>`).join('')}</table>
      ${s.deficiency_reasons.length ? `<ul class="fail">${s.deficiency_reasons.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}` : ''}
    ${s.decision_note ? `<p>Decision note: ${esc(s.decision_note)}</p>` : ''}
    <h2 style="margin-top:14px">Actions</h2>
    <div class="row"><button data-act="verify">Mark Verified</button></div>
    <div class="row"><input id="d-reason" placeholder="Reason for returning"><button data-act="return" class="warn">Return</button></div>
    <div class="row"><button data-act="eval" class="alt">Evaluate compliance</button></div>
    <div class="row"><input id="d-note" placeholder="Decision note"><button data-act="approve">Approve</button><button data-act="hold" class="warn">Hold</button></div>
    <h2 style="margin-top:14px">History</h2>${histTable(logs)}`;
}

$('#detail').onclick = e => { const a = e.target.dataset.act; if (!a) return; run(async () => {
  const id = sel;
  if (a === 'verify') await rpc('verify_submission', { p_submission_id: id, p_status: 'Verified' });
  if (a === 'return') await rpc('verify_submission', { p_submission_id: id, p_status: 'Returned', p_reason: $('#d-reason').value });
  if (a === 'eval') await rpc('evaluate_submission', { p_submission_id: id });
  if (a === 'approve' || a === 'hold') await rpc('decide_renewal', { p_submission_id: id, p_decision: a === 'approve' ? 'Approved' : 'Held', p_note: $('#d-note').value });
  say('Saved.'); await refresh();
}); };

$('#rform').onsubmit = e => { e.preventDefault(); run(async () => {
  await rpc('register_scholar', { p_student_id: $('#r-id').value, p_full_name: $('#r-name').value, p_program_id: $('#r-prog').value, p_email: $('#r-email').value || null });
  $('#rform').reset(); say('Scholar registered and assigned.'); await refresh();
}); };

$('#nav').onclick = e => { if (e.target.dataset.go) go(e.target.dataset.go); };
$('#burger').onclick = () => matchMedia('(max-width:800px)').matches ? $('#side').classList.toggle('open') : document.body.classList.toggle('nosb');
boot();