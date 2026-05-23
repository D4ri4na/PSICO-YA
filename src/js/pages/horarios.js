import { UI } from '../utils/ui.js';

const CONFIG_DIAS = [
  { key: 'lunes', label: 'Lunes' },
  { key: 'martes', label: 'Martes' },
  { key: 'miercoles', label: 'Miércoles' },
  { key: 'jueves', label: 'Jueves' },
  { key: 'viernes', label: 'Viernes' },
  { key: 'sabado', label: 'Sábado' },
  { key: 'domingo', label: 'Domingo' }
];

export function guardarHorarios() {
  const outData = {};
  let isValido = true;

  CONFIG_DIAS.forEach(d => {
    const enabled = document.getElementById(`check-${d.key}`)?.checked ?? false;
    const desde = document.getElementById(`desde-${d.key}`)?.value || '08:00';
    const hasta = document.getElementById(`hasta-${d.key}`)?.value || '17:00';

    if (enabled && desde >= hasta) {
      UI.showToast?.(`⚠️ En ${d.label}, el horario de inicio debe preceder al de cierre`);
      isValido = false;
    }
    outData[d.key] = { enabled, desde, hasta };
  });

  if (!isValido) return;

  localStorage.setItem('psicoya_horarios', JSON.stringify(outData));
  UI.showToast?.('✅ Esquema operativo actualizado localmente');
}

export function initHorarios() {
  const container = document.getElementById('daysListContainer');
  const btnGuardar = document.getElementById('btnGuardarHorarios');

  function renderConfig() {
    if (!container) return;
    
    // Obtener datos salvados o defaults rápidos
    const localData = JSON.parse(localStorage.getItem('psicoya_horarios')) || {};

    container.innerHTML = CONFIG_DIAS.map(d => {
      const settings = localData[d.key] || { enabled: d.key !== 'sabado' && d.key !== 'domingo', desde: '08:00', hasta: '17:00' };
      const disabledClass = !settings.enabled ? 'schedule-row--disabled' : '';
      
      return `
        <div class="schedule-row ${disabledClass}" id="row-${d.key}">
          <div class="schedule-row__day-info">
            <input type="checkbox" id="check-${d.key}" ${settings.enabled ? 'checked' : ''} data-day="${d.key}" class="day-toggle">
            <label for="check-${d.key}">${d.label}</label>
          </div>
          <div class="schedule-row__times">
            <input type="time" class="schedule-row__input" id="desde-${d.key}" value="${settings.desde || '08:00'}" ${!settings.enabled ? 'disabled' : ''}>
            <span>a</span>
            <input type="time" class="schedule-row__input" id="hasta-${d.key}" value="${settings.hasta || '17:00'}" ${!settings.enabled ? 'disabled' : ''}>
          </div>
        </div>
      `;
    }).join('');

    // Manejar lógica visual de deshabilitar inputs en vivo
    container.querySelectorAll('.day-toggle').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const day = e.target.dataset.day;
        const row = document.getElementById(`row-${day}`);
        const inputs = row.querySelectorAll('.schedule-row__input');
        
        if (e.target.checked) {
          row.classList.remove('schedule-row--disabled');
          inputs.forEach(i => i.disabled = false);
        } else {
          row.classList.add('schedule-row--disabled');
          inputs.forEach(i => i.disabled = true);
        }
      });
    });
  }

  btnGuardar?.addEventListener('click', () => {
    guardarHorarios();
  });

  renderConfig();
}