import { supabase } from '../config/supabase.js';
import { UI } from '../utils/ui.js';

let formState = {
  id: null,
  nombre: '',
  ci: '',
  telefono: '',
  notas: ''
};

export async function savePaciente() {
  const id = document.getElementById('pId')?.value;
  const nombre = document.getElementById('pNombre')?.value;
  const ci = document.getElementById('pCi')?.value;
  const telefono = document.getElementById('pTelefono')?.value;

  if (!nombre || !ci) {
    UI.showToast('⚠️ Nombre y CI son requeridos');
    return;
  }

  if (id) {
    return updatePatient(id, { nombre, ci, telefono });
  } else {
    return insertPatient({ nombre, ci, telefono });
  }
}

export async function insertPatient(data) {
  try {
    const { data: insertedData, error } = await supabase
      .from('pacientes')
      .insert([data])
      .select()
      .single();
    
    if (error) throw error;
    UI.showToast('✅ Paciente registrado correctamente');
    await loadAndRenderPacientes();
    return { success: true, data: insertedData };
  } catch (error) {
    console.error('Error inserting patient:', error);
    UI.showToast('❌ Error al registrar paciente');
    return { success: false, error };
  }
}

export async function updatePatient(id, data) {
  try {
    const { data: updatedData, error } = await supabase
      .from('pacientes')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    UI.showToast('✅ Paciente actualizado correctamente');
    await loadAndRenderPacientes();
    return { success: true, data: updatedData };
  } catch (error) {
    console.error('Error updating patient:', error);
    UI.showToast('❌ Error al actualizar paciente');
    return { success: false, error };
  }
}

export async function loadPatients() {
  try {
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .order('nombre', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading patients:', error);
    UI.showToast('❌ Error al cargar pacientes');
    return [];
  }
}

export async function loadAndRenderPacientes() {
  const pacientes = await loadPatients();
  renderPacientes(pacientes);
}

export function renderPacientes(pacientes) {
  const tbody = document.getElementById('listaPacientes');
  if (!tbody) return;

  if (pacientes.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; color: #999;">No hay pacientes registrados</td></tr>';
    return;
  }

  tbody.innerHTML = pacientes.map(p => `
    <tr>
      <td>${p.nombre}</td>
      <td>${p.ci}</td>
      <td>${p.telefono || '-'}</td>
      <td>
        <button class="btn btn--small" onclick="editarPaciente(${p.id})">Editar</button>
        <button class="btn btn--small btn--danger" onclick="eliminarPaciente(${p.id})">Eliminar</button>
      </td>
    </tr>
  `).join('');
}

export function openDelete(id) {
  return id;
}

export async function confirmDelete(id) {
  try {
    const { error } = await supabase
      .from('pacientes')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    UI.showToast('✅ Paciente eliminado correctamente');
    await loadAndRenderPacientes();
    return true;
  } catch (error) {
    console.error('Error deleting patient:', error);
    UI.showToast('❌ Error al eliminar paciente');
    return false;
  }
}

// Funciones auxiliares para el HTML
window.editarPaciente = async function(id) {
  const pacientes = await loadPatients();
  const paciente = pacientes.find(p => p.id === id);
  
  if (paciente) {
    document.getElementById('pId').value = paciente.id;
    document.getElementById('pNombre').value = paciente.nombre;
    document.getElementById('pCi').value = paciente.ci;
    document.getElementById('pTelefono').value = paciente.telefono || '';
    document.getElementById('modalPacienteTitle').textContent = 'Editar Paciente';
    UI.openModal('modalPaciente');
  }
};

window.eliminarPaciente = function(id) {
  if (confirm('¿Estás seguro de que deseas eliminar este paciente?')) {
    confirmDelete(id);
  }
};

export function initPacientes() {
  const btnNuevoPaciente = document.getElementById('btnNuevoPaciente');
  const btnGuardarPaciente = document.getElementById('btnGuardarPaciente');
  const btnCancelarPaciente = document.getElementById('btnCancelarPaciente');

  formState = {
    id: null,
    nombre: '',
    ci: '',
    telefono: '',
    notas: ''
  };

  // Event listeners
  btnNuevoPaciente?.addEventListener('click', () => {
    formState = { id: null, nombre: '', ci: '', telefono: '', notas: '' };
    document.getElementById('pId').value = '';
    document.getElementById('pNombre').value = '';
    document.getElementById('pCi').value = '';
    document.getElementById('pTelefono').value = '';
    document.getElementById('modalPacienteTitle').textContent = 'Registrar Nuevo Paciente';
    UI.openModal('modalPaciente');
  });

  btnGuardarPaciente?.addEventListener('click', async () => {
    await savePaciente();
    UI.closeModal('modalPaciente');
  });

  btnCancelarPaciente?.addEventListener('click', () => {
    UI.closeModal('modalPaciente');
  });

  // Cargar pacientes al inicializar
  loadAndRenderPacientes();
}

// Exportación a prueba de fallos para Jest
if (typeof window !== 'undefined') {
  window._test_init = typeof initApp !== 'undefined' ? initApp : null;
  window._test_load = typeof loadPatients !== 'undefined' ? loadPatients : null;
  window._test_save = typeof savePaciente !== 'undefined' ? savePaciente : null;
  window._test_insert = typeof insertPatient !== 'undefined' ? insertPatient : null;
  window._test_update = typeof updatePatient !== 'undefined' ? updatePatient : null;
  window._test_openDel = typeof openDelete !== 'undefined' ? openDelete : null;
  window._test_confirmDel = typeof confirmDelete !== 'undefined' ? confirmDelete : null;
}