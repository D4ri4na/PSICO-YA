import { supabase } from '../config/supabase.js';

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
    console.warn('Nombre y CI son requeridos');
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
    const { error } = await supabase
      .insert(data)
      .select()
      .eq('ci', data.ci);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error inserting patient:', error);
    return { success: false, error };
  }
}

export async function updatePatient(id, data) {
  try {
    const { error } = await supabase
      .update(data)
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error updating patient:', error);
    return { success: false, error };
  }
}

export async function loadPatients() {
  try {
    const { data, error } = await supabase
      .select()
      .order('nombre', { ascending: true });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error loading patients:', error);
    return [];
  }
}

export function initPacientes() {
  formState = {
    id: null,
    nombre: '',
    ci: '',
    telefono: '',
    notas: ''
  };
}

export function openDelete(id) {
  return id;
}

export async function confirmDelete(id) {
  try {
    const { error } = await supabase
      .update({ eliminado: true })
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting patient:', error);
    return false;
  }
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