import { initAgenda } from './pages/agenda.js';
import { initPacientes } from './pages/pacientes.js';
import { initHorarios } from './pages/horarios.js';

document.addEventListener('DOMContentLoaded', () => {
  const navLinks = document.querySelectorAll('.nav__link');
  const views = document.querySelectorAll('.view-block');

  // Inicializar los subsistemas de forma aislada e independiente (S de SOLID)
  initAgenda();
  initPacientes();
  initHorarios();

  // Enrutador de Vistas SPA
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetViewId = link.getAttribute('data-target');

      // 1. Alternar Clases de visibilidad
      views.forEach(view => {
        if (view.id === targetViewId) {
          view.classList.remove('view-block--hidden');
        } else {
          view.classList.add('view-block--hidden');
        }
      });

      // 2. Cambiar clase en la barra navegadora
      navLinks.forEach(lnk => lnk.classList.remove('nav__link--active'));
      link.classList.add('nav__link--active');
    });
  });
});