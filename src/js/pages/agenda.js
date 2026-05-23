import { UI } from '../utils/ui.js';

export function initAgenda() {
  const btnNuevaCita = document.getElementById('btnNuevaCita');
  const grid = document.getElementById('calendarGrid');

  btnNuevaCita?.addEventListener('click', () => {
    UI.showToast('📅 Próximamente: Apertura de formulario de cita.');
  });

  // Render dummy inicial del calendario estructurado
  if (grid) {
    const dias = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
    let html = dias.map(d => `<div class="calendar-widget__day-label">${d}</div>`).join('');
    
    for (let i = 1; i <= 31; i++) {
      html += `<div class="calendar-widget__cell">${i}</div>`;
    }
    grid.innerHTML = html;
  }
}