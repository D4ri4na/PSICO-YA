jest.mock('../config/supabase.js', () => ({
  supabase: {
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    order: jest.fn().mockResolvedValue({ data: [], error: null }),
    eq: jest.fn().mockResolvedValue({ error: null })
  }
}));

import { insertPatient, updatePatient } from '../pages/pacientes.js';
import { supabase as mockSupabase } from '../config/supabase.js';

describe('Lógica de Negocio - Módulo Pacientes', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input id="pId"><input id="pNombre"><input id="pCi"><input id="pTelefono">
      <div id="tableLoading"></div><table><tbody id="listaPacientes"></tbody></table>
      <div id="modalPaciente"></div><div id="toast"></div>
    `;
    jest.clearAllMocks();
  });

  // 1
  test('HU-4 (Criterio 1): Sincronizar nuevo paciente con la base de datos en la nube', async () => {
    document.getElementById('pId').value = ''; 
    document.getElementById('pNombre').value = 'Juan Perez';
    
    await insertPatient({ nombre: 'Juan Perez' });

    expect(mockSupabase.insert).toHaveBeenCalled();
  });

  // 2
  test('HU-4 (Criterio 2): Actualizar datos (teléfono/notas) de un paciente registrado', async () => {
    document.getElementById('pId').value = '1'; 
    document.getElementById('pTelefono').value = '77712345';
    
    await updatePatient(1, { telefono: '77712345' });

    expect(mockSupabase.update).toHaveBeenCalled();
  });
});