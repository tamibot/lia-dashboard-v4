# LIA Atlas V2 — Changelog

> Registro detallado de todos los cambios realizados en la transicion V1 -> V2

---

## [2026-03-12] — V2.2: Sales Intelligence + Equipos Generalizados + API Publica

### Schema — Campos Comerciales para Agentes de Ventas
- **Nuevo en 7 modelos de producto** (Course, Program, Webinar, Taller, Subscription, Asesoria, Application):
  `callToAction`, `idealStudentProfile`, `competitiveAdvantage`, `urgencyTriggers[]`, `objectionHandlers` (JSON), `successStories` (JSON)
- **Organization expandida**: `contactPhone`, `whatsapp`, `locations` (JSON array), `paymentMethods` (JSON array), `certificates[]`, `modalities[]`
- **Eliminados de Organization**: `address`, `certifications`, `location` (reemplazados por campos mas estructurados)

### Schema — Equipos Generalizados
- **Renombrado**: `TeamCourseAssignment` -> `TeamProductAssignment` (soporta cualquier tipo de producto via `entityType` + `entityId`)
- **TeamMember expandido**: `whatsapp`, `vacationStart`, `vacationEnd`, `isAvailable`, `specialties[]`, `maxLeads`, `userId` (link a User)
- **User**: nueva relacion `teamMember?` (link opcional a TeamMember)

### Schema — Agentes + CRM
- **AiAgent**: nuevos campos `funnelId` (relacion directa con Funnel), `extractionFieldIds[]` (IDs de campos a extraer)
- **Funnel**: nueva relacion `agents[]`

### Backend
- **profile.routes.ts**: whitelist de campos permitidos en PUT (seguridad: previene inyeccion de id/slug)
- **agents.routes.ts**: incluye `funnel` en queries
- **teams.routes.ts**: adaptado a TeamProductAssignment y nuevos campos de TeamMember
- **public.routes.ts** — 4 endpoints nuevos:
  - `GET /:orgSlug/agents/:agentId` — agente individual con contexto completo
  - `GET /:orgSlug/funnels` — embudos con etapas
  - `GET /:orgSlug/fields` — campos de extraccion
  - `GET /:orgSlug/teams` — equipos con miembros disponibles
- **public.routes.ts** — endpoints existentes enriquecidos con campos comerciales + funnel + team members

### Frontend
- **AiAgentsPage.tsx**: selectores de embudo y campos de extraccion por agente
- **CourseUpload.tsx**: indicador de completitud (%), secciones de Call to Action, Perfil Estudiante Ideal, Ventaja Competitiva, Manejo de Objeciones (CRUD inline), Casos de Exito (CRUD inline), urgencyTriggers como array
- **Profile.tsx**: campos nuevos (telefono, WhatsApp, modalidades, certificaciones)
- **TeamManagement.tsx**: reescrito para multi-producto, campos expandidos de miembros

### IA (gemini.ts)
- Prompts de extraccion actualizados con campos comerciales (objectionHandlers, successStories)
- Agent chat usa manejo de objeciones, casos de exito, ventaja competitiva como contexto
- Org info incluye telefono, WhatsApp, sedes con detalle, metodos de pago

### Documentacion
- Documentacion V2 reescrita completamente (00_INDEX, 01_CHANGELOG, 02_ARQUITECTURA)
- Tablas detalladas de todas las entidades con campos, tipos, defaults y relaciones
- API completa documentada (50+ endpoints)

### Commits
| Hash | Mensaje |
|------|---------|
| `8ec5ea9` | feat: add sales intelligence fields, generalize teams, and enrich public API |
| `0b89ee3` | fix: add no-cache headers for index.html to prevent stale CDN cache |

---

## [2026-03-11] — V2.1: Reestructuracion de Catalogo (7 Tipos)

### Catálogo: Software → Taller + Asesoría
- **Eliminado**: Modelo `Software` y enum `WebinarType`
- **Nuevo**: Modelo `Taller` (Workshop) con campos: `venue`, `venueAddress`, `venueCapacity`, `maxParticipants`, `availableSpots`, `waitlistEnabled`, `materials[]`, `deliverables[]`, `certification`, `earlyBirdPrice`, `earlyBirdDeadline`
- **Nuevo**: Modelo `Asesoria` (Consulting) con campos: `pricePerHour`, `minimumHours`, `packageHours`, `packagePrice`, `advisor`, `advisorBio`, `advisorTitle`, `specialties[]`, `bookingLink`, `minAdvanceBooking`, `availableSchedule`, `sessionDuration`, `topicsCovered[]`, `deliverables[]`, `needsDescription`
- **Modificado**: `Webinar` — `type: WebinarType` reemplazado por `webinarFormat: String @default("webinar")`
- **Modificado**: `Course`, `Program` — Nuevos campos: `registrationLink`, `paymentMethods[]`
- **Modificado**: `Program` — Nuevos campos: `whatsappGroup`, `includesProject`
- **Modificado**: `Subscription` — Nuevos campos: `advisoryHours`, `whatsappGroup`, `communityAccess`, `registrationLink`, `paymentMethods[]`
- **Modificado**: `Application` — Nuevos campos: `examRequired`, `examDescription`, `applicationFee`, `steps[]`, `documentsNeeded[]`, `selectionCriteria[]`, `registrationLink`, `paymentMethods[]`
- **Modificado**: `EntityType` enum — Ahora: `course | program | webinar | taller | subscription | asesoria | application`
- **Modificado**: `Contact` — Reemplazado `softwareInterest` con `tallerInterest` + `asesoriaInterest`
- **Modificado**: Prefijos de código: `CRS`, `PRG`, `WBN`, `TLR` (nuevo), `ASE` (nuevo), `SUB`, `ADM`

### Frontend
- **Modificado**: `Dashboard.tsx` — 7 stat cards (antes 6), grid `grid-cols-2 md:grid-cols-4`
- **Modificado**: `Courses.tsx` — 7 tabs con iconos (Wrench para taller, MessageCircle para asesoría), manejo de `pricePerHour`, `maxParticipants`
- **Modificado**: `CourseDetail.tsx` — Secciones para taller (venue, spots) y asesoría (advisor, booking)
- **Modificado**: `CourseUpload.tsx` — Dropdown incluye `taller` y `asesoría`
- **Modificado**: `types.ts` — Interfaces `Taller` y `Asesoria`, actualizado `CourseData` union type

### Backend
- **Modificado**: `courses.routes.ts` — Nuevos cases para `taller` (prefix `TLR`) y `asesoria` (prefix `ASE`), manejo de `pricePerHour`
- **Modificado**: `course.service.ts` — Union type actualizado a 7 tipos

### Deploy
- **Nuevo**: `server/prisma/pre-migrate.ts` — Script de limpieza idempotente que ejecuta SQL raw para eliminar datos del modelo Software, columnas software_id, enum WebinarType
- **Nuevo**: `server/prisma/migrate-v2.sql` — Referencia SQL de la migración
- **Modificado**: `Dockerfile` CMD — Ejecuta `pre-migrate.ts` → `prisma db push --accept-data-loss` → `seed.ts` → `node dist/index.js`

### Seed Data (Tema: Arquitectura + IA)
- Organización: "Instituto de Innovación para Arquitectos"
- 2 cursos: IA para Arquitectos, Renderizado con IA Generativa (PEN)
- 1 programa: IA y Programación para Arquitectos (3 módulos, whatsappGroup, includesProject)
- 1 webinar: Tendencias de IA para Arquitectos (webinarFormat: 'webinar')
- 2 talleres: Aprende a usar IA, BIM + IA (venue, maxParticipants, materials, deliverables)
- 2 suscripciones: Asesor IA, Plan Estudio (advisoryHours, whatsappGroup)
- 2 asesorías: Consulta individual, Asesoría para Estudios (pricePerHour, bookingLink, specialties)
- 1 postulación: Programa de Becas (examRequired, steps, documentsNeeded)
- Campos de extracción actualizados con opciones: Curso, Programa, Webinar, Taller, Suscripción, Asesoría, Postulación

### Commits
| Hash | Mensaje |
|------|---------|
| `b5233fb` | feat: restructure catalog from 6 to 7 types — replace Software with Taller + Asesoría |
| `0acf323` | fix(deploy): add pre-migration script to clean up Software model before db push |

---

## [2026-03-10] — Lanzamiento V2

### Deploy Unificado
- **Nuevo**: `Dockerfile` en raíz con multi-stage build (frontend-builder + backend-builder + production)
- **Nuevo**: `railway.toml` en raíz apuntando al Dockerfile
- **Nuevo**: `.dockerignore` para optimizar builds
- **Eliminado**: `server/Dockerfile` (backend-only, obsoleto)
- **Eliminado**: `server/railway.toml` (obsoleto)
- **Modificado**: `server/src/index.ts` — Express sirve archivos estáticos desde `/public` con SPA fallback
- **Modificado**: `src/config/api.config.ts` — API URL cambia de hardcoded a `/api` (same-origin)
- **Modificado**: `index.html` — lang="es", título "LIA Education", meta description

### Base de Datos
- **Modificado**: Dockerfile CMD ejecuta `prisma db push` al iniciar (sincroniza schema automáticamente)
- **Modificado**: Seed se ejecuta al iniciar para asegurar datos demo
- **Corregido**: Columna `phone` faltante en tabla `users` (schema vs DB desincronizados)

### Catálogo Educativo
- **Ya existente**: Los 6 tipos de catálogo estaban implementados en frontend y backend
- **Nuevo seed data**:
  - 3 Cursos (IA Aplicada, Marketing Digital con IA, Liderazgo Estratégico)
  - 1 Programa (Diplomado Ejecutivo en IA)
  - 1 Webinar (Masterclass: Fin de Páginas Web Tradicionales)
  - 2 Software (LIA Chatbot Builder, EduMetrics Pro)
  - 2 Subscripciones (Premium Educador, Enterprise Institucional)
  - 2 Postulaciones (Beca de Innovación, Admisión MBA)

### Agentes IA
- **Nuevo seed**: 3 agentes pre-configurados:
  - Asistente de Ventas (Sales Closer) — cierre consultivo
  - Recolector de Información (BDR Agent) — captura de datos
  - Asistente de Catálogo (Catalog Expert) — exploración de oferta

### CRM & Embudo
- **Restaurado**: Página CRM (`src/pages/CRM.tsx`) con gestión de embudos y campos
- **Restaurado**: Servicio CRM (`src/lib/services/crm.service.ts`)
- **Activado**: Ruta `/crm` en App.tsx y enlace en Sidebar
- **Seed**: Embudo default con 9 etapas + 9 campos de extracción predeterminados

### Sidebar & Navegación
- **Reorganizado**: Nueva sección "Ventas" con Embudo & Campos y Mi Equipo
- **Activado**: CRM (antes marcado "Soon", ahora activo)
- **Mantenido "Próximamente"**: Content IA, Educational IA, Mi Página de Venta, KPIs & Reportes
- **Refactorizado**: Componente `SoonItem` reutilizable, `navClass` extraído como función

### Seguridad
- **Modificado**: `server/src/middleware/auth.ts` — Demo fallback solo en NODE_ENV=development
- **Corregido**: Express 5 route params (`as string` casts para `string | string[]`)
- **Corregido**: Express 5 catch-all syntax (`{*path}` en lugar de `*`)

### Archivos Eliminados (Limpieza)
**Frontend:**
- `src/pages/TrendAnalysis.tsx`
- `src/pages/AITools.tsx`
- `src/pages/SalesPage.tsx`
- `src/pages/KPIReports.tsx`
- `src/lib/services/crm.service.ts` (eliminado y restaurado)
- `src/components/crm/FieldManager.tsx`
- `src/components/crm/FunnelManager.tsx`
- `src/lib/demoData.ts`

**Backend:**
- `server/check-demo.ts`
- `server/check-keys.ts`
- `server/patch_schema.js`
- `server/test-crm.ts`
- `server/test-db.ts`
- `server/prisma/check-db.ts`
- `server/prisma/verify-orgs.ts`
- `server/prisma/seed-complete.ts`
- `server/prisma/seed-enriched.ts`
- `server/prisma/seed-innovation.ts`
- `server/prisma/seed-innovation-v2.ts`

**Root:**
- `.vite_logs`
- `push_to_github.sh`

---

## Commits

| Hash | Mensaje |
|------|---------|
| `1f887db` | refactor: clean up codebase for production |
| `f076f9d` | feat: unify frontend + backend deploy |
| `c3be220` | fix: remove start.sh COPY from Dockerfile |
| `c612187` | fix: remove old server/Dockerfile, fix Express 5 routes |
| `271b5ec` | fix: sync DB schema on startup and seed demo data |
| `a4b738b` | feat: restore CRM page, expand seed data, activate all catalog types |
