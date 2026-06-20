const mockSupabaseQueryBuilder = {
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  then: jest.fn((resolve) => resolve({ data: [], error: null })) 
};

jest.mock('../config/supabase.js', () => ({
  supabase: {
    from: jest.fn(() => mockSupabaseQueryBuilder)
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

    expect(mockSupabase.from().insert).toHaveBeenCalled();
  });

  // 2
  test('HU-4 (Criterio 2): Actualizar datos (teléfono/notas) de un paciente registrado', async () => {
    document.getElementById('pId').value = '1'; 
    document.getElementById('pTelefono').value = '77712345';
    
    await updatePatient(1, { telefono: '77712345' });

    expect(mockSupabase.from().update).toHaveBeenCalled();
  });

//EF
test('HU-5 (Criterio 1): Eliminación lógica de un paciente', async () => {
    const { confirmDelete } = await import('../pages/pacientes.js');
    await confirmDelete(99);

    expect(mockSupabase.from().update).toHaveBeenCalledWith({ eliminado: true });
  });
});

test('HU-6: Rechazar citas en fechas pasadas', async () => {
    const { saveCita } = await import('../pages/agenda.js');
    
    const pastDate = '2020-01-01'; 
    const result = await saveCita(1, pastDate, '10:00');

    expect(result.success).toBe(false);
    expect(result.error).toBe('No se pueden agendar citas en fechas pasadas');
  });

test('HU-7: Rechazar horario si hora inicio es >= hora fin', async () => {
    const { saveSchedule } = await import('../pages/horarios.js');
    
    const result = await saveSchedule('18:00', '14:00');

    expect(result.success).toBe(false);
    expect(result.error).toBe('La hora de inicio debe ser menor a la hora de fin');
  });  