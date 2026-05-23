import { guardarHorarios, initHorarios } from '../pages/horarios.js';

describe('Lógica de Negocio - Módulo Horarios', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="daysListContainer"></div>
      <div id="row-lunes">
        <input type="checkbox" id="check-lunes" checked>
        <input type="time" id="desde-lunes" value="08:00">
        <input type="time" id="hasta-lunes" value="16:00">
      </div>
      <div id="toast"></div>
    `;
    localStorage.clear();
  });

  //3
  test('HU-1 (Criterio 1): Guardar configuración de horarios "Desde" y "Hasta" en el almacenamiento local', () => {
    guardarHorarios();

    const guardado = JSON.parse(localStorage.getItem('psicoya_horarios'));
    expect(guardado.lunes.desde).toBe('08:00');
    expect(guardado.lunes.hasta).toBe('16:00');
    expect(guardado.lunes.enabled).toBe(true);
  });
});