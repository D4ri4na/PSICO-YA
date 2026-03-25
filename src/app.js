/* ════════════════════════════════════════════════════════════
   app.js  —  PsicoYA! calendario  +  Supabase
   Schema real:
     citas:     id(int4), paciente_id(int4→pacientes.id),
                fecha(date), hora(time), duracion(int4),
                estado(text), notas(text), created_at
     pacientes: id(int4), nombre(text), ci(text),
                telefono(text), notas(text), created_at
   ════════════════════════════════════════════════════════════ */

/* ─── SCHEDULE (localStorage) ────────────────────────────── */
const DOW_KEY = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];

function getSchedule() {
  try {
    const s = localStorage.getItem('psicoya_horarios');
    if (s) return JSON.parse(s);
  } catch(e) {}
  const def = {};
  ['lunes','martes','miercoles','jueves','viernes'].forEach(k => {
    def[k] = { enabled: true, desde: '08:00', hasta: '17:00' };
  });
  def['sabado']  = { enabled: false, desde: '', hasta: '' };
  def['domingo'] = { enabled: false, desde: '', hasta: '' };
  return def;
}

function isSlotAllowed(dateStr, hour) {
  const d   = new Date(dateStr + 'T12:00:00');
  const key = DOW_KEY[d.getDay()];
  const day = getSchedule()[key];
  if (!day || !day.enabled || !day.desde || !day.hasta) return false;
  const desdeH = parseInt(day.desde.split(':')[0]);
  const hastaH = parseInt(day.hasta.split(':')[0]);
  return hour >= desdeH && hour < hastaH;
}

/* ─── MAPEO SUPABASE ↔ LOCAL ──────────────────────────────
   La tabla citas tiene paciente_id (FK), no el nombre directo.
   Al cargar las citas hacemos JOIN con pacientes para obtener
   nombre y ci.
   ────────────────────────────────────────────────────────── */
function rowToAppt(row) {
  // row viene con JOIN: row.pacientes = { nombre, ci }
  const [hr, mn] = (row.hora || '09:00').split(':').map(Number);
  return {
    id:          row.id,
    paciente_id: row.paciente_id,
    date:        row.fecha,
    hour:        hr,
    minuto:      mn,
    duracion:    row.duracion ?? 60,
    type:        row.estado === 'canceled' ? 'canceled' : 'scheduled',
    estado:      row.estado ?? 'scheduled',
    paciente:    row.pacientes?.nombre ?? '',
    ci:          row.pacientes?.ci ?? '',
    notas:       row.notas ?? '',
  };
}

function apptToRow(a) {
  return {
    paciente_id: a.paciente_id,
    fecha:       a.date,
    hora:        `${pad2(a.hour)}:${pad2(a.minuto || 0)}`,
    duracion:    a.duracion,
    estado:      a.type === 'canceled' ? 'canceled' : 'scheduled',
    notas:       a.notas || '',
  };
}

/* ─── PATIENTS CACHE ──────────────────────────────────────── */
let _cachedPatients = null;

async function loadPatientsCache() {
  if (_cachedPatients) return _cachedPatients;
  const { data, error } = await supabase
    .from('pacientes')
    .select('id, nombre, ci, telefono')
    .order('nombre');
  if (error) { console.error('Error cargando pacientes:', error); return []; }
  _cachedPatients = data;
  return data;
}

function invalidatePatientsCache() { _cachedPatients = null; }

/* ─── AUTOCOMPLETE ────────────────────────────────────────── */
async function filterPatients(prefix) {
  const input    = document.getElementById(`${prefix}Paciente`);
  const dropdown = document.getElementById(`${prefix}Dropdown`);
  const q        = input.value.toLowerCase().trim();

  const patients = await loadPatientsCache();
  const matches  = q
    ? patients.filter(p =>
        p.nombre.toLowerCase().includes(q) || (p.ci || '').includes(q))
    : patients;

  if (!matches.length) {
    dropdown.innerHTML = `<div class="pd-no-result">No se encontró el paciente</div>`;
  } else {
    dropdown.innerHTML = matches.map(p =>
      `<div class="pd-item"
        onclick="selectPatient('${prefix}',${p.id},'${p.nombre.replace(/'/g,"\\'")}','${p.ci||''}')">
        ${p.nombre}
        <span class="pd-ci">C.I.: ${p.ci || '—'}</span>
      </div>`
    ).join('');
  }
  dropdown.classList.add('open');
}

function selectPatient(prefix, id, nombre, ci) {
  document.getElementById(`${prefix}Paciente`).value    = nombre;
  document.getElementById(`${prefix}CI`).value          = ci;
  document.getElementById(`${prefix}PacienteId`).value  = id;
  document.getElementById(`${prefix}Dropdown`).classList.remove('open');
}

function closeAllDropdowns() {
  document.querySelectorAll('.patient-dropdown').forEach(d => d.classList.remove('open'));
}

/* ─── NOTIFICATIONS ───────────────────────────────────────── */
let notifications = [];

function toggleNotifications() {
  const panel    = document.getElementById('notifPanel');
  const backdrop = document.getElementById('notifBackdrop');
  const isOpen   = panel.classList.contains('open');
  if (isOpen) {
    panel.classList.remove('open');
    backdrop.classList.remove('open');
  } else {
    renderNotifications();
    panel.classList.add('open');
    backdrop.classList.add('open');
    const dot = document.getElementById('bellDot');
    if (dot) dot.style.display = 'none';
  }
}

function addNotification(msg) {
  notifications.unshift({ msg, time: new Date() });
  const dot = document.getElementById('bellDot');
  if (dot) dot.style.display = 'block';
}

function renderNotifications() {
  const body = document.getElementById('notifBody');
  if (!notifications.length) {
    body.innerHTML = `<p class="notif-empty">No hay notificaciones</p>`;
    return;
  }
  body.innerHTML = notifications.map(n => {
    const t  = n.time;
    const ts = `${pad2(t.getHours())}:${pad2(t.getMinutes())}`;
    return `<div class="notif-item">${n.msg}<div class="notif-item-time">${ts}</div></div>`;
  }).join('');
}

/* ─── CONSTANTS ───────────────────────────────────────────── */
const DAYS_ES   = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const MONTHS_ES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto',
                   'septiembre','octubre','noviembre','diciembre'];
const HOURS   = [8,9,10,11,12,13,14,15,16,17,18,19];
const FIRST_H = HOURS[0];
const LAST_H  = HOURS[HOURS.length - 1] + 1;
const CELL_H  = 60;

/* ─── STATE ───────────────────────────────────────────────── */
let currentView  = 'mes';
let currentDate  = new Date();
let pendingSlot  = null;
let editingId    = null;
let appointments = [];

/* ─── HELPERS ─────────────────────────────────────────────── */
function fmt(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
}
function pad2(n) { return String(n).padStart(2,'0'); }
function apptOnDate(dateStr) { return appointments.filter(a => a.date === dateStr); }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function getMonday(d) {
  const r = new Date(d);
  const day = r.getDay();
  r.setDate(r.getDate() + (day === 0 ? -6 : 1 - day));
  return r;
}
function timeToPx(hour, min) { return ((hour - FIRST_H) + min / 60) * CELL_H; }
function durationToPx(min)   { return (min / 60) * CELL_H; }

/* ─── ERROR BANNER ────────────────────────────────────────── */
function showErrorBanner(msg, detail) {
  let banner = document.getElementById('errorBanner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'errorBanner';
    banner.style.cssText = `position:fixed;top:46px;left:0;right:0;z-index:999;
      background:#fff0f0;border-bottom:2px solid #e53e3e;padding:12px 24px;
      font-family:'Nunito',sans-serif;font-size:0.85rem;font-weight:700;color:#c53030;
      display:flex;align-items:flex-start;gap:12px;`;
    document.body.appendChild(banner);
  }
  banner.innerHTML = `
    <span style="font-size:1.1rem">⚠️</span>
    <div>
      <div>${msg}</div>
      ${detail ? `<div style="font-size:0.75rem;opacity:0.8;margin-top:3px;font-family:monospace;white-space:pre-wrap">${detail}</div>` : ''}
    </div>
    <button onclick="this.parentElement.remove()" style="margin-left:auto;background:none;
      border:none;cursor:pointer;font-size:1rem;color:#c53030">✕</button>`;
}

/* ─── LOADING ─────────────────────────────────────────────── */
function setLoading(on) {
  let el = document.getElementById('calLoading');
  if (!el) {
    el = document.createElement('div');
    el.id = 'calLoading';
    el.style.cssText = `position:absolute;inset:0;background:rgba(255,255,255,0.75);
      display:flex;align-items:center;justify-content:center;
      font-weight:800;color:var(--purple-mid);font-size:0.9rem;
      border-radius:18px;z-index:10;`;
    el.innerHTML = `<span>⏳ Cargando citas…</span>`;
    document.querySelector('.cal-card')?.appendChild(el);
  }
  el.style.display = on ? 'flex' : 'none';
}

/* ─── SUPABASE: LOAD CITAS (con JOIN a pacientes) ─────────── */
async function loadAppointments() {
  setLoading(true);
  try {
    const { data, error } = await supabase
      .from('citas')
      .select(`
        id,
        paciente_id,
        fecha,
        hora,
        duracion,
        estado,
        notas,
        pacientes ( nombre, ci )
      `)
      .order('fecha')
      .order('hora');

    setLoading(false);

    if (error) {
      console.error('Supabase error:', error);
      showErrorBanner(
        `Error al cargar citas (${error.code}): ${error.message}`,
        error.hint ? `Hint: ${error.hint}` : error.details || ''
      );
      render();
      return;
    }

    appointments = (data || []).map(rowToAppt);
    console.log(`✅ ${appointments.length} citas cargadas`);
    render();

  } catch(e) {
    setLoading(false);
    console.error('Error de red:', e);
    showErrorBanner('No se pudo conectar con Supabase.', e.message);
    render();
  }
}

/* ─── SUPABASE: INSERT CITA ───────────────────────────────── */
async function insertAppointment(apptData) {
  const row = apptToRow(apptData);
  const { data, error } = await supabase
    .from('citas')
    .insert([row])
    .select(`id, paciente_id, fecha, hora, duracion, estado, notas, pacientes(nombre, ci)`)
    .single();

  if (error) {
    console.error('Insert error:', error);
    showErrorBanner(`No se pudo guardar la cita: ${error.message}`, error.details || '');
    return null;
  }
  return rowToAppt(data);
}

/* ─── SUPABASE: UPDATE CITA ───────────────────────────────── */
async function updateAppointment(id, apptData) {
  const row = apptToRow(apptData);
  const { error } = await supabase
    .from('citas')
    .update(row)
    .eq('id', id);

  if (error) {
    console.error('Update error:', error);
    showErrorBanner(`No se pudo actualizar la cita: ${error.message}`, error.details || '');
    return false;
  }
  return true;
}

/* ─── NAV ─────────────────────────────────────────────────── */
function setView(v) {
  currentView = v;
  ['btnSemana','btnDia','btnMes'].forEach(id =>
    document.getElementById(id).classList.remove('active'));
  document.getElementById({semana:'btnSemana', dia:'btnDia', mes:'btnMes'}[v]).classList.add('active');
  render();
}
function goToday() { currentDate = new Date(); render(); }
function navigate(dir) {
  if      (currentView === 'semana') currentDate = addDays(currentDate, dir * 7);
  else if (currentView === 'dia')    currentDate = addDays(currentDate, dir);
  else    currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + dir, 1);
  render();
}

/* ─── PERIOD LABEL ────────────────────────────────────────── */
function updatePeriodLabel() {
  const el = document.getElementById('periodLabel');
  if (currentView === 'mes') {
    el.textContent = `${MONTHS_ES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  } else if (currentView === 'semana') {
    const mon = getMonday(currentDate);
    const fri = addDays(mon, 4);
    el.textContent = mon.getMonth() === fri.getMonth()
      ? `${mon.getDate()}–${fri.getDate()} ${MONTHS_ES[mon.getMonth()]} ${mon.getFullYear()}`
      : `${mon.getDate()} ${MONTHS_ES[mon.getMonth()]} – ${fri.getDate()} ${MONTHS_ES[fri.getMonth()]} ${fri.getFullYear()}`;
  } else {
    el.textContent = `${DAYS_ES[currentDate.getDay()]} ${currentDate.getDate()} de ${MONTHS_ES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }
}

/* ─── RENDER ──────────────────────────────────────────────── */
function render() {
  updatePeriodLabel();
  const body = document.getElementById('calBody');
  if      (currentView === 'semana') body.innerHTML = renderWeek();
  else if (currentView === 'dia')    body.innerHTML = renderDay();
  else                               body.innerHTML = renderMonth();
  attachHourLineListeners();
}

/* ─── EVENT BLOCK ─────────────────────────────────────────── */
function eventBlockHtml(a) {
  const top      = timeToPx(a.hour, a.minuto || 0);
  const height   = Math.max(durationToPx(a.duracion || 60), 22);
  const startStr = `${pad2(a.hour)}:${pad2(a.minuto || 0)}`;
  const endMin   = a.hour * 60 + (a.minuto || 0) + (a.duracion || 60);
  const endStr   = `${pad2(Math.floor(endMin/60) % 24)}:${pad2(endMin % 60)}`;
  const icon     = a.type === 'scheduled' ? '✅' : '❌';

  return `<div class="event-block ${a.type}"
    style="top:${top}px;height:${height}px;"
    onclick="openDetalle(${a.id})"
    title="${a.paciente} · ${startStr}–${endStr}">
    <span class="ev-time">${icon} ${startStr}–${endStr}</span>
    <span class="ev-name">${a.paciente}</span>
    ${height >= 44 ? `<span class="ev-dur">${a.duracion} min</span>` : ''}
  </div>`;
}

/* ─── EVENTS AREA ─────────────────────────────────────────── */
function eventsAreaHtml(dateStr) {
  const totalH = (LAST_H - FIRST_H) * CELL_H;
  let lines = '';
  HOURS.forEach(hr => {
    const allowed = isSlotAllowed(dateStr, hr);
    lines += `<div class="tg-hour-line${allowed ? '' : ' blocked'}"
      data-date="${dateStr}" data-hour="${hr}">
      ${allowed ? `<button class="add-btn" onclick="openNueva('${dateStr}',${hr})">+</button>` : ''}
    </div>`;
  });
  let blocks = '';
  apptOnDate(dateStr).forEach(a => { blocks += eventBlockHtml(a); });

  return `<div class="tg-events-area" style="height:${totalH}px;position:relative;">
    ${lines}${blocks}
  </div>`;
}

/* ─── WEEK VIEW ───────────────────────────────────────────── */
function renderWeek() {
  const mon   = getMonday(currentDate);
  const days  = Array.from({length:5}, (_,i) => addDays(mon, i));
  const today = fmt(new Date());

  let timesHtml = `<div class="tg-times">`;
  HOURS.forEach(hr => { timesHtml += `<div class="tg-hour-label">${hr}:00</div>`; });
  timesHtml += `</div>`;

  let daysHtml = `<div class="tg-days">`;
  days.forEach(d => {
    const ds = fmt(d);
    daysHtml += `<div class="tg-day-col">
      <div class="day-header${ds === today ? ' today-col' : ''}">
        <span class="dname">${DAYS_ES[d.getDay()]}</span>
        <span class="dnum">${d.getDate()}</span>
      </div>
      ${eventsAreaHtml(ds)}
    </div>`;
  });
  daysHtml += `</div>`;
  return `<div class="grid-wrap"><div class="tg-outer">${timesHtml}${daysHtml}</div></div>`;
}

/* ─── DAY VIEW ────────────────────────────────────────────── */
function renderDay() {
  const d  = currentDate;
  const ds = fmt(d);
  let timesHtml = `<div class="tg-times">`;
  HOURS.forEach(hr => { timesHtml += `<div class="tg-hour-label">${hr}:00</div>`; });
  timesHtml += `</div>`;

  const dayHtml = `<div class="tg-days"><div class="tg-day-col">
    <div class="day-header${ds === fmt(new Date()) ? ' today-col' : ''}">
      <span class="dname">${DAYS_ES[d.getDay()]}</span>
      <span class="dnum">${d.getDate()}</span>
    </div>
    ${eventsAreaHtml(ds)}
  </div></div>`;
  return `<div class="grid-wrap"><div class="tg-outer">${timesHtml}${dayHtml}</div></div>`;
}

/* ─── MONTH VIEW ──────────────────────────────────────────── */
function renderMonth() {
  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const last  = new Date(year, month + 1, 0);
  const today = fmt(new Date());

  let h = `<div class="month-grid">`;
  ['Lun','Mar','Mié','Jue','Vie'].forEach(n => {
    h += `<div class="month-day-name">${n}</div>`;
  });

  const allDays = [];
  for (let d = 1; d <= last.getDate(); d++) {
    const dt = new Date(year, month, d);
    if (dt.getDay() !== 0 && dt.getDay() !== 6) allDays.push(dt);
  }
  const empties = allDays[0].getDay() - 1;
  for (let e = 0; e < empties; e++) h += `<div class="month-cell empty"></div>`;

  allDays.forEach(dt => {
    const ds      = fmt(dt);
    const apts    = apptOnDate(ds);
    const isToday = ds === today;
    h += `<div class="month-cell${isToday ? ' today-cell' : ''}" data-date="${ds}" data-month-cell>`;
    h += `<div class="month-dnum">${dt.getDate()}</div>`;
    if (apts.length) {
      h += `<div class="reserva-pill">${apts.length} reserva${apts.length > 1 ? 's' : ''}</div>`;
    }
    h += `<button class="add-btn" onclick="openNueva('${ds}',9)">+</button></div>`;
  });
  return h + `</div>`;
}

/* ─── HOVER LISTENERS ─────────────────────────────────────── */
function attachHourLineListeners() {
  document.querySelectorAll('.tg-hour-line:not(.blocked)').forEach(cell => {
    cell.addEventListener('mouseenter', () => cell.classList.add('hovered'));
    cell.addEventListener('mouseleave', () => cell.classList.remove('hovered'));
  });
  document.querySelectorAll('[data-month-cell]').forEach(cell => {
    cell.addEventListener('mouseenter', () => cell.classList.add('hovered'));
    cell.addEventListener('mouseleave', () => cell.classList.remove('hovered'));
  });
}

/* ─── MODAL: NUEVA CITA ───────────────────────────────────── */
function openNueva(dateStr, hour) {
  pendingSlot = { date: dateStr, hour };
  document.getElementById('nPaciente').value    = '';
  document.getElementById('nCI').value          = '';
  document.getElementById('nPacienteId').value  = '';
  document.getElementById('nFecha').value       = dateStr;
  document.getElementById('nHora').value        = `${pad2(hour)}:00`;
  document.getElementById('nDuracion').value    = 60;
  document.getElementById('nNotas').value       = '';
  closeAllDropdowns();
  document.getElementById('modalNueva').classList.add('open');
}

function closeModalNueva() {
  document.getElementById('modalNueva').classList.remove('open');
  closeAllDropdowns();
  pendingSlot = null;
}

async function saveNuevaCita() {
  const paciente    = document.getElementById('nPaciente').value.trim();
  const pacienteId  = parseInt(document.getElementById('nPacienteId').value);
  if (!paciente)    { document.getElementById('nPaciente').focus(); return; }
  if (!pacienteId)  { showToast('⚠️ Selecciona un paciente de la lista'); return; }

  const fechaVal    = document.getElementById('nFecha').value;
  const horaVal     = document.getElementById('nHora').value;
  const duracionVal = parseInt(document.getElementById('nDuracion').value) || 60;
  const notas       = document.getElementById('nNotas').value.trim();
  const ci          = document.getElementById('nCI').value.trim();
  const [hr, mn]    = horaVal.split(':').map(Number);

  if (!isSlotAllowed(fechaVal, hr)) {
    showToast('⚠️ Ese horario no está disponible. Revisa tu configuración de horarios.');
    return;
  }

  const btn = document.querySelector('#modalNueva .btn-save');
  if (btn) { btn.disabled = true; btn.textContent = 'Guardando…'; }

  const newAppt = await insertAppointment({
    paciente_id: pacienteId,
    paciente, ci,
    date: fechaVal,
    hour: hr, minuto: mn,
    duracion: duracionVal,
    type: 'scheduled', notas,
  });

  if (btn) { btn.disabled = false; btn.textContent = 'Crear Cita'; }
  if (!newAppt) return;

  appointments.push(newAppt);
  const d = new Date(fechaVal + 'T12:00:00');
  addNotification(`📅 Nueva cita: ${paciente} el ${d.getDate()} de ${MONTHS_ES[d.getMonth()]} a las ${horaVal}`);

  closeModalNueva();
  currentDate = new Date(fechaVal + 'T12:00:00');
  if (currentView === 'mes') setView('semana');
  else render();
  showToast('✅ Cita agendada correctamente');
}

/* ─── MODAL: DETALLE ──────────────────────────────────────── */
function openDetalle(id) {
  const a = appointments.find(x => x.id === id);
  if (!a) return;
  editingId = id;
  document.getElementById('dPaciente').value   = a.paciente || '';
  document.getElementById('dCI').value         = a.ci || '';
  document.getElementById('dPacienteId').value = a.paciente_id || '';
  document.getElementById('dFecha').value      = a.date;
  document.getElementById('dHora').value       = `${pad2(a.hour)}:${pad2(a.minuto || 0)}`;
  document.getElementById('dDuracion').value   = a.duracion || 60;
  document.getElementById('dNotas').value      = a.notas || '';
  closeAllDropdowns();
  document.getElementById('modalDetalle').classList.add('open');
}

function closeModalDetalle() {
  document.getElementById('modalDetalle').classList.remove('open');
  closeAllDropdowns();
  editingId = null;
}

async function guardarDetalle() {
  const a = appointments.find(x => x.id === editingId);
  if (!a) return;

  const horaVal    = document.getElementById('dHora').value;
  const [hr, mn]   = horaVal.split(':').map(Number);
  const pacienteId = parseInt(document.getElementById('dPacienteId').value) || a.paciente_id;

  const updated = {
    ...a,
    paciente_id: pacienteId,
    paciente:    document.getElementById('dPaciente').value.trim(),
    ci:          document.getElementById('dCI').value.trim(),
    date:        document.getElementById('dFecha').value,
    hour: hr, minuto: mn,
    duracion:    parseInt(document.getElementById('dDuracion').value) || 60,
    notas:       document.getElementById('dNotas').value.trim(),
  };

  const btn = document.querySelector('#modalDetalle .btn-save');
  if (btn) { btn.disabled = true; btn.textContent = 'Guardando…'; }

  const ok = await updateAppointment(a.id, updated);
  if (btn) { btn.disabled = false; btn.textContent = 'Guardar'; }
  if (!ok) return;

  Object.assign(a, updated);
  closeModalDetalle();
  render();
  showToast('✅ Cita actualizada correctamente');
}

async function cancelarCita() {
  const a = appointments.find(x => x.id === editingId);
  if (!a) return;

  const btn = document.querySelector('#modalDetalle .btn-cancel-appt');
  if (btn) { btn.disabled = true; btn.textContent = 'Cancelando…'; }

  const ok = await updateAppointment(a.id, { ...a, type: 'canceled' });
  if (btn) { btn.disabled = false; btn.textContent = 'Cancelar cita'; }
  if (!ok) return;

  a.type   = 'canceled';
  a.estado = 'canceled';
  addNotification(`❌ Cita cancelada: ${a.paciente} el ${a.date} a las ${pad2(a.hour)}:${pad2(a.minuto||0)}`);
  closeModalDetalle();
  render();
  showToast('❌ Cita cancelada');
}

/* ─── TOAST ───────────────────────────────────────────────── */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

/* ─── INIT ────────────────────────────────────────────────── */
async function initApp() {
  ['modalNueva','modalDetalle'].forEach(id => {
    document.getElementById(id).addEventListener('click', function(e) {
      if (e.target === this) {
        if (id === 'modalNueva') closeModalNueva();
        else closeModalDetalle();
      }
    });
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('.form-group')) closeAllDropdowns();
  });

  document.getElementById('btnMes').classList.add('active');

  if (typeof supabase === 'undefined' || typeof supabase.from !== 'function') {
    showErrorBanner('El cliente Supabase no está listo.', 'Verifica la key en index.html');
    render();
    return;
  }

  await loadAppointments();
}

// Si el DOM ya está listo (carga dinámica con script.onload), ejecutar de inmediato.
// Si no, esperar a DOMContentLoaded.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}