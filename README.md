# PsicoYA! – Sistema de Gestión de Citas para Psicólogos 🧠📅

**Desarrollado por:** Dariana Pol Aramayo  
**Institución:** Universidad Católica Boliviana "San Pablo"  
**Materia:** Ingeniería de Software  

---

## 🚀 Descripción del Proyecto
PsicoYA! es una pagina web diseñada para profesionales de la psicología que buscan centralizar y automatizar la gestión de sus agendas. El sistema resuelve la problemática de la coordinación manual de turnos, permitiendo un control total sobre la disponibilidad, el registro de pacientes y la programación de citas en tiempo real.

## ✨ Características Principales
- **Gestión de Disponibilidad:** Configuración de rangos horarios por día de la semana (guardado local).
- **Control de Pacientes:** CRUD completo (Crear, Leer, Actualizar, Eliminar) con búsqueda inteligente por nombre o C.I.
- **Agenda Multivista:** Visualización por Día, Semana y Mes.
- **Validación de Slots:** El sistema impide agendar citas en horarios no habilitados por el profesional.
- **Sincronización en la Nube:** Integración total con **Supabase** para el almacenamiento seguro de datos.
- **Notificaciones Internas:** Sistema de alertas para confirmar nuevas acciones dentro de la app.

## 🛠️ Stack Tecnológico
- **Frontend:** HTML5, CSS3 (Variables modernas), JavaScript Vanilla (ES6+).
- **Backend/Base de Datos:** [Supabase](https://supabase.com/dashboard/project/badevyjmzybvordmsvbn)
- **Fuentes:** Google Fonts (Nunito).
- **Iconografía:** SVG nativos y Lucide-style icons.

## 📂 Estructura del Repositorio
```text
├── src/
│   ├── app.js            # Lógica principal del calendario y Supabase
│   ├── pacientes.js      # Gestión de CRUD de pacientes
│   ├── horarios.js       # Configuración de disponibilidad
│   ├── index.html        # Vista de la Agenda
│   ├── pacientes.html    # Vista de Gestión de Pacientes
│   ├── horarios.html     # Vista de Configuración
│   └── styles.css        # Estilos globales y componentes
├── docs/
│   ├── Alcance_Proyecto.pdf
│   ├── Historias_Usuario.pdf
│   └── Arquitectura.png
└── README.md
```
---

## Links importantes
Figma. https://www.figma.com/design/mpxDFEABPCfMSvji33Nri4/PsicoYa-?node-id=0-1&t=Lgs8jAlHg1cBPlv5-1
