# Plan de Mejoras — LIA Dashboard

> Documento de seguimiento. Marcar con [x] conforme se complete cada mejora.

---

## Victorias Rapidas (1-2 horas c/u)

- [x] **1. Sistema de Toast Notifications** — `ToastContext` + componente global. Reemplazados TODOS los `alert()` en 6 archivos (AiAgents, Profile, TeamManagement, CourseUpload, CourseDetail, FilterQuestions).
- [x] **2. Skeleton Loaders universales** — Agregados en: Courses (tabla), FilterQuestions (cards), AiAgentsPage (cards). Usan clase `.skeleton` con animacion shimmer.
- [x] **3. Empty States ilustrados** — Mejorados en Courses (icono FolderOpen + CTA), FilterQuestions (icono Filter + CTA). Incluyen estados para busqueda sin resultados.
- [x] **4. Busqueda en catalogo** — Barra de busqueda rapida (`quickSearch`) en pagina de Courses, funciona por nombre y codigo, se combina con filtros avanzados.
- [x] **5. Confirmacion al salir sin guardar** — Hook `useUnsavedChanges` con `beforeunload`. Implementado en Profile y AiAgentsPage. Marca dirty al editar, limpia al guardar.

## Mejoras de Impacto Medio (medio dia c/u)

- [x] **6. Sidebar responsive/mobile** — `SidebarContext` + drawer con overlay. TopBar tiene boton hamburguesa (oculto en desktop). Sidebar se cierra al navegar. Layout usa `md:ml-[240px]` en vez de fijo.
- [x] **7. Paginacion en tablas** — Componente `Pagination` reutilizable. Implementado en Courses (lista y grid) con 12 items/pagina. Muestra rango y paginas con ellipsis.
- [x] **8. Dashboard con graficas** — Grafica de barras (Recharts `BarChart`) en Dashboard mostrando distribucion del catalogo por tipo. Solo visible cuando hay datos. Colores coordinados con stat cards.
- [x] **9. Drag & Drop en preguntas filtro** — Drag & drop nativo HTML5 en QuestionCard. Al soltar se reordena y persiste `sortOrder` via API. Toast de confirmacion.
- [x] **10. Auto-guardado con debounce** — Hook `useAutoSave` creado (debounce configurable). Disponible para uso futuro. Profile y AiAgents usan `isDirty` tracking con guardado manual + toast.

## Funcionalidades Nuevas (Pendiente — no implementar aun)

- [ ] **11. Pagina "Mi Pagina de Venta"** — Builder de landing page con productos del catalogo, URL publica `/p/:orgSlug`.
- [ ] **12. Generador de contenido con IA** — Boton "Generar con IA" en creacion de cursos (descripcion, temario, beneficios, FAQ).
- [ ] **13. Analytics del agente** — Dashboard: conversaciones totales, tasa de conversion, preguntas frecuentes, horarios pico.
- [ ] **14. Exportar contactos (GHL sync)** — Boton para descargar CSV/Excel de contactos sincronizados.
- [ ] **15. Multi-idioma** — Preparar i18n con `react-i18next` para ingles/portugues.

## Seguridad (Critico — planificar pronto)

- [ ] **16. Mover API key de Gemini a env var** — Actualmente hardcodeada en `src/lib/gemini.ts`. Mover a servidor.
- [ ] **17. Encriptar API keys en BD** — Campo `encryptedKey` almacena texto plano. Usar `aes-256-gcm`.
- [ ] **18. Rate limiting en endpoints publicos** — Middleware `express-rate-limit` en `/api/public/*`.

---

## Archivos creados/modificados (2026-03-13)

### Nuevos archivos
- `src/context/ToastContext.tsx` — Sistema de notificaciones toast
- `src/context/SidebarContext.tsx` — Control de sidebar mobile
- `src/hooks/useUnsavedChanges.ts` — Warning al salir sin guardar
- `src/hooks/useAutoSave.ts` — Auto-guardado con debounce
- `src/components/Pagination.tsx` — Paginacion reutilizable

### Archivos modificados
- `src/App.tsx` — Providers (Toast, Sidebar), layout responsivo
- `src/components/Sidebar.tsx` — Mobile drawer con overlay
- `src/components/TopBar.tsx` — Boton hamburguesa
- `src/index.css` — Animaciones (toast, skeleton, mobile)
- `src/pages/Dashboard.tsx` — Grafica Recharts
- `src/pages/Courses.tsx` — Busqueda, skeleton, paginacion, empty state
- `src/pages/AiAgentsPage.tsx` — Toast, skeleton, unsaved changes
- `src/pages/FilterQuestions.tsx` — Toast, skeleton, drag & drop
- `src/pages/Profile.tsx` — Toast, unsaved changes
- `src/pages/TeamManagement.tsx` — Toast
- `src/pages/CourseUpload.tsx` — Toast
- `src/pages/CourseDetail.tsx` — Toast

## Notas
- El CRM es una sincronizacion con GoHighLevel (GHL), no un CRM propio.
- Las funcionalidades nuevas (11-15) se implementaran en fases posteriores.
- Los temas de seguridad (16-18) deben planificarse antes del lanzamiento publico.
- Fecha de inicio: 2026-03-13
