/* ════════════════════════════════════════════════════════════
   pacientes.js  —  CRUD de pacientes con Supabase
   ════════════════════════════════════════════════════════════ */

let patients         = [];
let editingPatientId = null;
let deletingPatientId = null;

/* ─── SUPABASE: LOAD ──────────────────────────────────────── */
async function loadPatients() {
  showTableLoading(true);
  const { data, error } = await supabase
    .from('pacientes')
    .select('*')
    .order('nombre');

  showTableLoading(false);

  if (error) {
    console.error('Error cargando pacientes:', error);
    showToast('❌ Error al cargar pacientes');
    return;
  }
  patients = data || [];
  renderTable();
}

/* ─── SUPABASE: INSERT ────────────────────────────────────── */
async function insertPatient(payload) {
  const { data, error } = await supabase
    .from('pacientes')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.error('Error insertando paciente:', error);
    showToast('❌ Error al guardar el paciente');
    return null;
  }
  return data;
}

/* ─── SUPABASE: UPDATE ────────────────────────────────────── */
async function updatePatient(id, payload) {
  const { error } = await supabase
    .from('pacientes')
    .update(payload)
    .eq('id', id);

  if (error) {
    console.error('Error actualizando paciente:', error);
    showToast('❌ Error al actualizar el paciente');
    return false;
  }
  return true;
}

/* ─── SUPABASE: DELETE ────────────────────────────────────── */
async function deletePatient(id) {
  const { error } = await supabase
    .from('pacientes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error eliminando paciente:', error);
    showToast('❌ Error al eliminar el paciente');
    return false;
  }
  return true;
}

/* ─── TABLE ───────────────────────────────────────────────── */
function showTableLoading(on) {
  const tbody = document.getElementById('patientsTable');
  const empty = document.getElementById('pEmpty');
  if (on) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;padding:24px;
      color:var(--purple-mid);font-weight:700;">⏳ Cargando pacientes…</td></tr>`;
    empty.style.display = 'none';
  }
}

function renderTable() {
  const q     = (document.getElementById('searchInput')?.value || '').toLowerCase();
  const rows  = patients.filter(p =>
    p.nombre.toLowerCase().includes(q) ||
    (p.ci || '').toLowerCase().includes(q)
  );
  const tbody = document.getElementById('patientsTable');
  const empty = document.getElementById('pEmpty');

  if (!rows.length) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  tbody.innerHTML = rows.map(p => {
    const initials = p.nombre.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
    return `<tr>
      <td class="td-name">
        <div class="p-avatar">${initials}</div>
        ${p.nombre}
      </td>
      <td class="p-ci">${p.ci || '—'}</td>
      <td>${p.telefono || '—'}</td>
      <td>
        <div class="p-actions">
          <button class="btn-edit-p" onclick="openEdit('${p.id}')">✏️ Editar</button>
          <button class="btn-del-p"  onclick="openDelete('${p.id}')">🗑️ Eliminar</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

/* ─── MODAL: NUEVO / EDITAR ───────────────────────────────── */
function openModalPaciente(id = null) {
  editingPatientId = id;
  const titleEl = document.getElementById('modalPacienteTitle');

  if (id) {
    const p = patients.find(x => x.id === id);
    if (!p) return;
    titleEl.textContent                        = 'Editar Paciente';
    document.getElementById('pNombre').value   = p.nombre   || '';
    document.getElementById('pCI').value       = p.ci       || '';
    document.getElementById('pTelefono').value = p.telefono || '';
    document.getElementById('pNotas').value    = p.notas    || '';
  } else {
    titleEl.textContent                        = 'Nuevo Paciente';
    document.getElementById('pNombre').value   = '';
    document.getElementById('pCI').value       = '';
    document.getElementById('pTelefono').value = '';
    document.getElementById('pNotas').value    = '';
  }
  document.getElementById('modalPaciente').classList.add('open');
}

function openEdit(id) { openModalPaciente(id); }

function closeModalPaciente() {
  document.getElementById('modalPaciente').classList.remove('open');
  editingPatientId = null;
}

async function savePaciente() {
  const nombre   = document.getElementById('pNombre').value.trim();
  const ci       = document.getElementById('pCI').value.trim();
  const telefono = document.getElementById('pTelefono').value.trim();
  const notas    = document.getElementById('pNotas').value.trim();

  if (!nombre) { document.getElementById('pNombre').focus(); return; }
  if (!ci)     { document.getElementById('pCI').focus(); return; }

  const btn = document.querySelector('#modalPaciente .btn-save');
  if (btn) { btn.disabled = true; btn.textContent = 'Guardando…'; }

  const payload = { nombre, ci, telefono, notas };

  if (editingPatientId) {
    const ok = await updatePatient(editingPatientId, payload);
    if (btn) { btn.disabled = false; btn.textContent = 'Guardar'; }
    if (!ok) return;

    // Update local list
    const p = patients.find(x => x.id === editingPatientId);
    if (p) Object.assign(p, payload);
    showToast('✅ Paciente actualizado');
  } else {
    const newP = await insertPatient(payload);
    if (btn) { btn.disabled = false; btn.textContent = 'Guardar'; }
    if (!newP) return;

    patients.push(newP);
    showToast('✅ Paciente agregado');
  }

  closeModalPaciente();
  renderTable();
}

/* ─── DELETE ──────────────────────────────────────────────── */
function openDelete(id) {
  deletingPatientId = id;
  document.getElementById('modalConfirm').classList.add('open');
}
function closeConfirm() {
  document.getElementById('modalConfirm').classList.remove('open');
  deletingPatientId = null;
}

async function confirmDelete() {
  const btn = document.querySelector('#modalConfirm .btn-save');
  if (btn) { btn.disabled = true; btn.textContent = 'Eliminando…'; }

  const ok = await deletePatient(deletingPatientId);

  if (btn) { btn.disabled = false; btn.textContent = 'Eliminar'; }
  if (!ok) return;

  patients = patients.filter(p => p.id !== deletingPatientId);
  closeConfirm();
  renderTable();
  showToast('🗑️ Paciente eliminado');
}

/* ─── TOAST ───────────────────────────────────────────────── */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

/* ─── INIT ────────────────────────────────────────────────── */
async function initApp() {
  ['modalPaciente','modalConfirm'].forEach(id => {
    document.getElementById(id).addEventListener('click', function(e) {
      if (e.target === this) {
        if (id === 'modalPaciente') closeModalPaciente();
        else closeConfirm();
      }
    });
  });

  await loadPatients();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}