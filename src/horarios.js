const DAYS_CONFIG = [
  { key: 'lunes',     label: 'Lunes',     defaultOn: true,  desde: '08:00', hasta: '17:00' },
  { key: 'martes',    label: 'Martes',    defaultOn: true,  desde: '08:00', hasta: '17:00' },
  { key: 'miercoles', label: 'Miércoles', defaultOn: true,  desde: '08:00', hasta: '17:00' },
  { key: 'jueves',    label: 'Jueves',    defaultOn: true,  desde: '08:00', hasta: '17:00' },
  { key: 'viernes',   label: 'Viernes',   defaultOn: true,  desde: '08:00', hasta: '17:00' },
  { key: 'sabado',    label: 'Sábado',    defaultOn: false, desde: '',      hasta: ''      },
  { key: 'domingo',   label: 'Domingo',   defaultOn: false, desde: '',      hasta: ''      },
];

function loadSchedule() {
  try {
    const s = localStorage.getItem('psicoya_horarios');
    if (s) return JSON.parse(s);
  } catch(e) {}
  const def = {};
  DAYS_CONFIG.forEach(d => {
    def[d.key] = { enabled: d.defaultOn, desde: d.desde, hasta: d.hasta };
  });
  return def;
}

function renderDays() {
  const schedule  = loadSchedule();
  const container = document.getElementById('daysList');
  container.innerHTML = '';

  DAYS_CONFIG.forEach(d => {
    const s       = schedule[d.key];
    const enabled = s.enabled;
    const row     = document.createElement('div');
    row.className = `day-row${enabled ? '' : ' disabled'}`;
    row.id        = `row-${d.key}`;

    row.innerHTML = `
      <div class="toggle-wrap">
        <label class="toggle">
          <input type="checkbox" id="toggle-${d.key}" ${enabled ? 'checked' : ''}
            onchange="onToggle('${d.key}')">
          <div class="toggle-track"></div>
          <div class="toggle-thumb"></div>
        </label>
      </div>
      <span class="day-name">${d.label}</span>
      <div class="day-times">
        <div class="time-field">
          <label>Desde</label>
          <input type="time" id="desde-${d.key}" value="${s.desde}" ${enabled ? '' : 'disabled'}>
        </div>
        <div class="time-field">
          <label>Hasta</label>
          <input type="time" id="hasta-${d.key}" value="${s.hasta}" ${enabled ? '' : 'disabled'}>
        </div>
      </div>
      <span class="no-disponible">No disponible</span>`;

    container.appendChild(row);
  });
}

function onToggle(key) {
  const checked = document.getElementById(`toggle-${key}`).checked;
  const row     = document.getElementById(`row-${key}`);
  const desdeEl = document.getElementById(`desde-${key}`);
  const hastaEl = document.getElementById(`hasta-${key}`);
  if (checked) {
    row.classList.remove('disabled');
    desdeEl.disabled = hastaEl.disabled = false;
    if (!desdeEl.value) desdeEl.value = '08:00';
    if (!hastaEl.value) hastaEl.value = '17:00';
  } else {
    row.classList.add('disabled');
    desdeEl.disabled = hastaEl.disabled = true;
  }
}

function guardarHorarios() {
  const schedule = {};
  let valid = true;
  DAYS_CONFIG.forEach(d => {
    const enabled = document.getElementById(`toggle-${d.key}`).checked;
    const desde   = document.getElementById(`desde-${d.key}`).value;
    const hasta   = document.getElementById(`hasta-${d.key}`).value;
    if (enabled && desde && hasta && desde >= hasta) {
      showToast(`⚠️ ${d.label}: "Desde" debe ser anterior a "Hasta"`);
      valid = false;
    }
    schedule[d.key] = { enabled, desde, hasta };
  });
  if (!valid) return;
  localStorage.setItem('psicoya_horarios', JSON.stringify(schedule));
  showToast('✅ Horarios guardados correctamente');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

document.addEventListener('DOMContentLoaded', renderDays);