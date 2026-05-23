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