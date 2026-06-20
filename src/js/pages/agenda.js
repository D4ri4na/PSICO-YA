import { supabase } from '../config/supabase.js';
import { UI } from '../utils/ui.js';
import { loadPatients } from './pacientes.js';

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

export async function loadCitas() {
  try {
    const { data, error } = await supabase
      .from('citas')
      .select(`
        *,
        pacientes (
          nombre
        )
      `)
      .order('fecha', { ascending: true })
      .order('hora', { ascending: true });
    
    if (error) {
      // Si la tabla no existe o hay un error de permisos, podríamos querer ignorarlo
      // o avisar, pero no romper todo.
      console.warn('Citas podrían no estar configuradas en DB:', error);
      return [];
    }
    return data || [];
  } catch (error) {
    console.error('Error loading citas:', error);
    return [];
  }
}

export async function saveCita(testPacienteId = null, testFecha = null, testHora = null) {
  const id = document.getElementById('cId')?.value || null;
  const paciente_id = testPacienteId || document.getElementById('cPacienteId')?.value;
  const fecha = testFecha || document.getElementById('cFecha')?.value;
  const hora = testHora || document.getElementById('cHora')?.value;
  const motivo = document.getElementById('cMotivo')?.value || null;

  if (!paciente_id || !fecha || !hora) {
    if (typeof UI !== 'undefined') UI.showToast('Paciente, fecha y hora son requeridos');
    return { success: false, error: 'Faltan campos requeridos' };
  }

  const hoy = new Date().toISOString().split('T')[0];
  if (fecha < hoy) {
    if (typeof UI !== 'undefined') UI.showToast('X No se pueden agendar citas en fechas pasadas');
    return { success: false, error: 'No se pueden agendar citas en fechas pasadas' };
  }

  const payload = { paciente_id, fecha, hora, motivo };

  try {
    if (id) {
      const { error } = await supabase.from('citas').update(payload).eq('id', id);
      if (error) throw error;
      if (typeof UI !== 'undefined') UI.showToast(':) Cita actualizada correctamente');
    } else {
      const { error } = await supabase.from('citas').insert([payload]);
      if (error) throw error;
      if (typeof UI !== 'undefined') UI.showToast(':) Cita registrada correctamente');
    }
    
    if (typeof UI !== 'undefined' && typeof renderCalendar === 'function') {
      UI.closeModal('modalCita');
      await renderCalendar();
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error al guardar la cita:', error);
    if (typeof UI !== 'undefined') UI.showToast('X Error al guardar la cita');
    return { success: false, error: error.message };
  }
}

export async function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  if (!grid) return;

  const dias = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
  let html = dias.map(d => `<div class="calendar-widget__day-label">${d}</div>`).join('');
  
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const citas = await loadCitas();

  for (let i = 0; i < firstDay; i++) {
    html += `<div class="calendar-widget__cell" style="background: transparent; box-shadow: none;"></div>`;
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    const dayCitas = citas.filter(c => c.fecha === dateStr);
    
    const citasHtml = dayCitas.map(c => `
      <div class="calendar-widget__event" onclick="editarCita('${c.id}')">
        ${c.hora.substring(0,5)} - ${c.pacientes?.nombre || 'Paciente'}
      </div>
    `).join('');

    html += `<div class="calendar-widget__cell">
      <span style="display:block; margin-bottom: 5px; opacity: 0.8;">${i}</span>
      ${citasHtml}
    </div>`;
  }

  grid.innerHTML = html;
}

window.editarCita = async function(id) {
  try {
    const { data: cita, error } = await supabase.from('citas').select('*').eq('id', id).single();
    if (error) throw error;
    
    if (cita) {
      const pacienteSelect = document.getElementById('cPacienteId');
      const pacientes = await loadPatients();
      pacienteSelect.innerHTML = '<option value="">Seleccione un paciente</option>' + 
        pacientes.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');

      document.getElementById('cId').value = cita.id;
      document.getElementById('cPacienteId').value = cita.paciente_id;
      document.getElementById('cFecha').value = cita.fecha;
      document.getElementById('cHora').value = cita.hora;
      document.getElementById('cMotivo').value = cita.motivo || '';
      document.getElementById('modalCitaTitle').textContent = 'Editar Cita';
      UI.openModal('modalCita');
    }
  } catch(e) {
    console.error(e);
    UI.showToast('❌ Error al cargar la cita');
  }
};

export async function initAgenda() {
  const btnNuevaCita = document.getElementById('btnNuevaCita');
  const btnGuardarCita = document.getElementById('btnGuardarCita');
  const btnCancelarCita = document.getElementById('btnCancelarCita');
  const pacienteSelect = document.getElementById('cPacienteId');

  btnNuevaCita?.addEventListener('click', async () => {
    document.getElementById('cId').value = '';
    document.getElementById('cFecha').value = '';
    document.getElementById('cHora').value = '';
    document.getElementById('cMotivo').value = '';
    document.getElementById('modalCitaTitle').textContent = 'Nueva Cita';
    
    const pacientes = await loadPatients();
    pacienteSelect.innerHTML = '<option value="">Seleccione un paciente</option>' + 
      pacientes.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
    document.getElementById('cPacienteId').value = '';

    UI.openModal('modalCita');
  });

  btnGuardarCita?.addEventListener('click', async () => {
    await saveCita();
  });

  btnCancelarCita?.addEventListener('click', () => {
    UI.closeModal('modalCita');
  });

  await renderCalendar();
}