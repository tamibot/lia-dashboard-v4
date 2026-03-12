# LIA Atlas V2.2 — Arquitectura Activa

> Documentacion completa del modelo de datos, API, relaciones y deploy
> Ultima actualizacion: 2026-03-12

---

## 1. Flujo Principal del Sistema

```
Usuario -> app.liabotedu.com -> Express (SPA static files) -> React Frontend
                                       |
                                 /api/* -> Express API -> Prisma ORM -> PostgreSQL
                                       |
                                 /api/ai/* -> Gemini / OpenAI (IA)
                                       |
                                 /api/public/:orgSlug/* -> API publica (n8n, agentes externos)
```

---

## 2. Modelo de Datos Completo

### 2.1 Diagrama de Entidades y Relaciones

```
Organization (multi-tenant root)
|
+-- User (auth + RBAC)
|   +-- TeamMember? (link opcional a miembro de equipo)
|
+-- Course / Program / Webinar / Taller / Subscription / Asesoria / Application
|   +-- Attachment[] (archivos polimorficos via entityType)
|   +-- Faq[] (preguntas frecuentes polimorficas)
|   +-- GeneratedContent[] (tracking de IA polimorficas)
|   +-- SyllabusModule[] (solo Course)
|   +-- ProgramCourse[] (solo Program)
|   +-- AgentCourse[] (solo Course - vincula agente<->curso)
|
+-- Team
|   +-- TeamMember[]
|   +-- TeamProductAssignment[] (asigna cualquier producto al equipo)
|   +-- Course[] (FK directo), Program[], Webinar[], Taller[], Asesoria[] (FK directo)
|   +-- AiAgent[] (agentes asignados al equipo)
|
+-- AiAgent
|   +-- AgentCourse[] (productos que el agente puede vender)
|   +-- Funnel? (embudo asignado)
|   +-- Team? (equipo al que escala)
|
+-- Contact (leads del CRM)
|
+-- Funnel
|   +-- FunnelStage[] (etapas del embudo)
|   +-- ExtractionField[] (campos vinculados)
|   +-- AiAgent[] (agentes que usan este embudo)
|
+-- ExtractionField (campos de extraccion, globales o por embudo)
|
+-- ApiKey (Gemini/OpenAI keys, por org)
+-- GeneratedContent (contenido generado por IA)
```

### 2.2 Tablas y Campos Detallados

#### organizations
| Campo | Tipo | Default | Descripcion |
|-------|------|---------|-------------|
| id | uuid | auto | PK |
| slug | string | unique | URL-friendly identifier |
| name | string | — | Nombre |
| type | OrgType | infoproductor | universidad, instituto, infoproductor |
| description | string | "" | Descripcion |
| tagline | string? | null | Eslogan |
| website | string? | null | Sitio web |
| contactEmail | string? | null | Email institucional |
| contactPhone | string? | null | Telefono |
| whatsapp | string? | null | WhatsApp institucional |
| accreditations | string? | null | Solo universidad |
| specialty | string? | null | Solo instituto |
| personalBrand | string? | null | Solo infoproductor |
| niche | string? | null | Solo infoproductor |
| targetAudience | string? | null | Publico objetivo |
| history | string? | null | Historia |
| branding | JSON | {} | {colors, typography, voice, visualIdentity} |
| socialMedia | JSON? | null | {instagram, facebook, linkedin, tiktok, youtube} |
| operatingHours | JSON? | null | [{days, hours}] |
| locations | JSON | [] | [{id, name, address, phone, schedule}] |
| paymentMethods | JSON | [] | [{type, name, details, currency}] |
| certificates | string[] | [] | Acreditaciones, licencias |
| modalities | string[] | [] | "Online", "Presencial", "Hibrido" |
| courseCategories | string[] | — | Categorias |
| onboardingComplete | boolean | false | Onboarding completado |

#### users
| Campo | Tipo | Default | Descripcion |
|-------|------|---------|-------------|
| id | uuid | auto | PK |
| orgId | uuid | FK | -> organizations.id (CASCADE) |
| email | string | unique | Login |
| passwordHash | string | — | bcrypt hash |
| name | string | — | Nombre |
| role | UserRole | editor | admin, editor, viewer |
| phone | string? | null | Telefono |
| avatarUrl | string? | null | Avatar |
| isActive | boolean | true | Activo |
| lastLogin | DateTime? | null | Ultimo login |

#### courses (y otros 6 modelos de producto)

Los campos comunes se documentan en 00_INDEX_V2.md. Aqui se listan las diferencias clave:

**Course-specific:** `syllabusModules[]` relation, `instructor`, `instructorBio`, `totalHours`, `schedule`, `earlyBirdPrice`, `earlyBirdDeadline`, `maxStudents`, `prerequisites`, `certification`, `registrationLink`, `paymentMethods[]`, `agentCourses[]` relation

**Program-specific:** `programCourses[]` relation, `coordinator`, `totalDuration`, `certification`, `certifyingEntity`, `whatsappGroup`, `includesProject`, `earlyBirdPrice`, `maxStudents`, `registrationLink`, `paymentMethods[]`

**Webinar-specific:** `speaker`, `speakerBio`, `speakerTitle`, `eventDate`, `eventTime`, `webinarFormat`, `maxAttendees`, `keyTopics[]`, `platform`, `callToAction` (campo propio del modelo), `registrationLink`, `paymentMethods[]`

**Taller-specific:** `venue`, `venueAddress`, `venueCapacity`, `maxParticipants`, `availableSpots`, `waitlistEnabled`, `materials[]`, `deliverables[]`, `certification`, `earlyBirdPrice`, `earlyBirdDeadline`, `registrationLink`, `paymentMethods[]`

**Subscription-specific:** `period`, `features[]`, `maxUsers`, `advisoryHours`, `whatsappGroup`, `communityAccess`, `registrationLink`, `paymentMethods[]`

**Asesoria-specific:** `pricePerHour`, `minimumHours`, `packageHours`, `packagePrice`, `advisor`, `advisorBio`, `advisorTitle`, `specialties[]`, `bookingLink`, `minAdvanceBooking`, `availableSchedule`, `sessionDuration`, `topicsCovered[]`, `deliverables[]`, `needsDescription`, `registrationLink`, `paymentMethods[]`

**Application-specific:** `deadline`, `availableSlots`, `examRequired`, `examDescription`, `applicationFee`, `steps[]`, `documentsNeeded[]`, `selectionCriteria[]`, `registrationLink`, `paymentMethods[]`

#### teams
| Campo | Tipo | Default | Descripcion |
|-------|------|---------|-------------|
| id | uuid | auto | PK |
| orgId | uuid | FK | -> organizations.id (CASCADE) |
| name | string | — | Nombre del equipo |
| description | string? | null | Descripcion |

**Relaciones:** members[], courses[], programs[], webinars[], talleres[], asesorias[], agents[], productAssignments[]

#### team_members
| Campo | Tipo | Default | Descripcion |
|-------|------|---------|-------------|
| id | uuid | auto | PK |
| teamId | uuid | FK | -> teams.id (CASCADE) |
| name | string | — | Nombre |
| email | string | — | Email |
| phone | string? | null | Telefono |
| whatsapp | string? | null | WhatsApp |
| role | string? | null | SDR, Closer, Account Executive |
| availability | string? | null | "L-V 9am-6pm" |
| vacationStart | DateTime? | null | Inicio vacaciones |
| vacationEnd | DateTime? | null | Fin vacaciones |
| isAvailable | boolean | true | Disponible para leads |
| specialties | string[] | [] | Areas de expertise |
| maxLeads | int? | null | Max leads simultaneos |
| userId | string? | unique, null | -> users.id (SET NULL) |

#### team_product_assignments
| Campo | Tipo | Default | Descripcion |
|-------|------|---------|-------------|
| id | uuid | auto | PK |
| teamId | uuid | FK | -> teams.id (CASCADE) |
| entityType | EntityType | — | course, program, webinar, taller, subscription, asesoria, application |
| entityId | uuid | — | ID del producto |

**Unique constraint:** (teamId, entityType, entityId)

#### ai_agents
| Campo | Tipo | Default | Descripcion |
|-------|------|---------|-------------|
| id | uuid | auto | PK |
| orgId | uuid | FK | -> organizations.id (CASCADE) |
| name | string | — | Nombre del agente |
| role | string | "" | Rol (Sales Closer, BDR, etc.) |
| personality | AgentPersonality | professional | professional, friendly, empathetic, strict, enthusiastic |
| tone | string | "" | Tono personalizado |
| language | string | "es" | Idioma |
| expertise | string[] | [] | Areas de expertise |
| systemPrompt | string? | null | System prompt personalizado |
| avatar | string? | null | Emoji o URL |
| isActive | boolean | true | Activo |
| funnelId | uuid? | null | -> crm_funnels.id (SET NULL) |
| extractionFieldIds | string[] | [] | IDs de ExtractionFields a extraer |
| teamId | uuid? | null | -> teams.id (SET NULL) |

**Relaciones:** agentCourses[] (cursos asignados), funnel? (embudo), team? (equipo)

#### agent_courses
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | uuid | PK |
| agentId | uuid | -> ai_agents.id (CASCADE) |
| courseId | uuid | -> courses.id (CASCADE) |

**Unique constraint:** (agentId, courseId)

#### contacts
| Campo | Tipo | Default | Descripcion |
|-------|------|---------|-------------|
| id | uuid | auto | PK |
| orgId | uuid | FK | -> organizations.id (CASCADE) |
| ghlContactId | string? | unique | ID de GoHighLevel |
| name | string | — | Nombre |
| email | string? | null | Email |
| phone | string? | null | Telefono |
| phoneCountry | string? | null | Pais del telefono |
| stage | ContactStage | nuevo | nuevo, contactado, interesado, propuesta, negociacion, ganado, perdido, inactivo |
| origin | ContactOrigin | organico | organico, meta_ads, google_ads, tiktok_ads, referido, webinar, evento, linkedin, whatsapp, email, otro |
| customOrigin | string? | null | Origen personalizado |
| courseInterest | string? | null | Interes en curso |
| programInterest | string? | null | Interes en programa |
| webinarInterest | string? | null | Interes en webinar |
| tallerInterest | string? | null | Interes en taller |
| subscriptionInterest | string? | null | Interes en suscripcion |
| asesoriaInterest | string? | null | Interes en asesoria |
| applicationInterest | string? | null | Interes en postulacion |
| budget | Decimal? | 0 | Presupuesto |
| currency | string | "USD" | Moneda |
| city | string? | null | Ciudad |
| country | string? | null | Pais |
| timezone | string? | null | Zona horaria |
| utmSource/Medium/Campaign | string? | null | UTM tracking |
| adPlatform | string? | null | Plataforma de ads |
| landingPage | string? | null | Landing page |
| isActive | boolean | true | Activo (soft delete) |
| notes | string? | null | Notas |
| tags | string[] | [] | Etiquetas |
| ghlLastSyncAt | DateTime? | null | Ultima sync GHL |
| ghlData | JSON? | null | Data raw de GHL |

#### crm_funnels
| Campo | Tipo | Default | Descripcion |
|-------|------|---------|-------------|
| id | uuid | auto | PK |
| orgId | uuid | FK | -> organizations.id (CASCADE) |
| name | string | — | Nombre del embudo |
| description | string? | null | Descripcion |
| isDefault | boolean | false | Embudo por defecto |

**Relaciones:** stages[], fields[], agents[]

#### crm_funnel_stages
| Campo | Tipo | Default | Descripcion |
|-------|------|---------|-------------|
| id | uuid | auto | PK |
| funnelId | uuid | FK | -> crm_funnels.id (CASCADE) |
| name | string | — | Nombre de la etapa |
| key | string? | null | Key unico (bbdd, interesado, etc.) |
| description | string? | null | Descripcion |
| rules | string? | null | Reglas de avance |
| isDefault | boolean | false | Etapa por defecto |
| sortOrder | int | 0 | Orden |
| color | string? | null | Color hex |

#### crm_extraction_fields
| Campo | Tipo | Default | Descripcion |
|-------|------|---------|-------------|
| id | uuid | auto | PK |
| orgId | uuid | FK | -> organizations.id (CASCADE) |
| funnelId | uuid? | null | -> crm_funnels.id (SET NULL) |
| name | string | — | Nombre visible |
| key | string | — | Key para codigo |
| description | string? | null | Descripcion |
| dataType | string | "string" | string, boolean, number, array |
| isRequired | boolean | false | Obligatorio |
| isDefault | boolean | false | Campo por defecto |
| options | string[] | [] | Opciones para dropdowns/selects |

#### Tablas polimorficas (Attachment, Faq, GeneratedContent)

Estas tablas usan `entityType` + FK nullable para vincularse a cualquiera de los 7 tipos de producto:

```
entityType: course | program | webinar | taller | subscription | asesoria | application
courseId?, programId?, webinarId?, tallerId?, subscriptionId?, asesoriaId?, applicationId?
```

#### api_keys
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| id | uuid | PK |
| orgId | uuid | -> organizations.id (CASCADE) |
| provider | AiProvider | gemini, openai |
| encryptedKey | string | Key encriptada |

**Unique constraint:** (orgId, provider)

### 2.3 Enums

| Enum | Valores |
|------|---------|
| OrgType | universidad, instituto, infoproductor |
| UserRole | admin, editor, viewer |
| EntityType | course, program, webinar, taller, subscription, asesoria, application |
| Modality | online, presencial, hibrido |
| ItemStatus | borrador, activo, archivado |
| AgentPersonality | professional, friendly, empathetic, strict, enthusiastic |
| ContactStage | nuevo, contactado, interesado, propuesta, negociacion, ganado, perdido, inactivo |
| ContactOrigin | organico, meta_ads, google_ads, tiktok_ads, referido, webinar, evento, linkedin, whatsapp, email, otro |
| AiProvider | gemini, openai |
| FileType | pdf, video, image, link |

---

## 3. API Completa

### 3.1 Endpoints Publicos (sin auth)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/health` | Health check (`{status: "ok"}`) |
| GET | `/api/public/:orgSlug/catalog` | Catalogo completo (courses + programs + webinars) |
| GET | `/api/public/:orgSlug/courses` | Cursos con filtros (category, search) |
| GET | `/api/public/:orgSlug/courses/:code` | Curso por codigo unico |
| GET | `/api/public/:orgSlug/programs` | Programas |
| GET | `/api/public/:orgSlug/webinars` | Webinars |
| GET | `/api/public/:orgSlug/agents` | Agentes activos con contexto completo (cursos, embudo, equipo, campos) |
| GET | `/api/public/:orgSlug/agents/:agentId` | Agente individual con extraction fields |
| GET | `/api/public/:orgSlug/funnels` | Embudos con etapas |
| GET | `/api/public/:orgSlug/fields` | Campos de extraccion |
| GET | `/api/public/:orgSlug/org` | Perfil publico (nombre, branding, sedes, pagos, horarios) |
| GET | `/api/public/:orgSlug/teams` | Equipos con miembros disponibles |

> Estos endpoints estan disenados para ser consumidos por **n8n**, agentes externos, o cualquier integracion que necesite datos de la organizacion.

### 3.2 Auth

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/api/auth/register` | Registro (crea usuario + organizacion) |
| POST | `/api/auth/login` | Login (retorna JWT) |
| GET | `/api/auth/me` | Usuario autenticado actual |

### 3.3 Catalogo (auth required)

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/courses?type=curso\|programa\|webinar\|taller\|subscripcion\|asesoria\|postulacion` | Listar items por tipo |
| GET | `/api/courses/:id?type=...` | Detalle de un item |
| POST | `/api/courses` | Crear item (body incluye `type`, auto-genera `code` con prefix) |
| PUT | `/api/courses/:id` | Actualizar item (reemplaza syllabus, attachments, FAQs) |
| DELETE | `/api/courses/:id?type=...` | Eliminar item |

> Nota: Programa y Webinar tambien tienen rutas dedicadas `/api/programs` y `/api/webinars` con CRUD completo.

### 3.4 CRM

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/crm/funnels` | Listar embudos con etapas |
| GET | `/api/crm/funnels/:id` | Embudo individual |
| POST | `/api/crm/funnels` | Crear embudo con etapas |
| PUT | `/api/crm/funnels/:id` | Actualizar embudo (reemplaza etapas) |
| DELETE | `/api/crm/funnels/:id` | Eliminar embudo |
| GET | `/api/crm/fields` | Listar campos de extraccion |
| POST | `/api/crm/fields` | Crear campo |
| PUT | `/api/crm/fields/:id` | Actualizar campo |
| DELETE | `/api/crm/fields/:id` | Eliminar campo |

### 3.5 Contactos

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/contacts` | Listar contactos (filtros: stage, origin, search) |
| GET | `/api/contacts/stats` | Stats del pipeline por etapa |
| GET | `/api/contacts/:id` | Contacto individual |
| POST | `/api/contacts` | Crear contacto |
| POST | `/api/contacts/ghl-sync` | Bulk upsert desde GoHighLevel webhook |
| PUT | `/api/contacts/:id` | Actualizar contacto |
| DELETE | `/api/contacts/:id` | Soft delete (isActive=false) |

### 3.6 Equipos

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/teams` | Listar equipos con miembros y product assignments |
| POST | `/api/teams` | Crear equipo con miembros y asignaciones |
| PUT | `/api/teams/:id` | Actualizar (reemplaza miembros y asignaciones en transaction) |
| DELETE | `/api/teams/:id` | Eliminar equipo |

### 3.7 Agentes IA

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/agents` | Listar agentes con cursos, equipo y embudo |
| GET | `/api/agents/:id` | Agente individual con todo el contexto |
| POST | `/api/agents` | Crear agente con cursos asignados |
| PUT | `/api/agents/:id` | Actualizar (reemplaza cursos asignados) |
| DELETE | `/api/agents/:id` | Eliminar agente |

### 3.8 IA

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/api/ai/ask` | Proxy a Gemini/OpenAI (soporta param `provider`) |
| POST | `/api/ai/keys` | Guardar API key (gemini u openai) |
| DELETE | `/api/ai/keys/:provider` | Eliminar API key |

### 3.9 Perfil

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/profile` | Perfil de la organizacion |
| PUT | `/api/profile` | Actualizar (whitelist de campos permitidos) |

> Seguridad: el PUT usa una whitelist de campos (`PROFILE_UPDATABLE_FIELDS`) para prevenir inyeccion de `id`, `slug`, etc.

### 3.10 Settings

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/settings/keys` | API keys (masked) |
| POST | `/api/settings/keys/gemini` | Guardar key Gemini |
| POST | `/api/settings/keys/openai` | Guardar key OpenAI |
| DELETE | `/api/settings/keys/gemini` | Eliminar key Gemini |
| DELETE | `/api/settings/keys/openai` | Eliminar key OpenAI |

---

## 4. Autenticacion y Seguridad

### JWT Auth
- Login retorna JWT con `{userId, orgId, role}`
- Token se almacena en `localStorage`
- Middleware `authenticate` valida en cada request protegido
- Multi-tenant: todas las queries filtran por `orgId` del token

### Roles
| Rol | Permisos |
|-----|----------|
| admin | CRUD completo, gestion de equipo, settings, CRM |
| editor | CRUD de catalogo, uso de agentes |
| viewer | Solo lectura |

### Seguridad implementada
- Password hashing con bcrypt (12 rounds)
- Whitelist de campos en PUT /api/profile
- Cascade deletes (eliminar org elimina todo)
- Demo fallback solo en NODE_ENV=development

### Seguridad pendiente
- Encriptacion real de API keys (marcado pero no implementado)
- Verificacion de firma del webhook GHL
- Rate limiting en endpoints publicos
- Paginacion para listas grandes

---

## 5. Deploy (Docker + Railway)

### Dockerfile Multi-Stage
```
Stage 1: frontend-builder (node:20-alpine)
  -> npm ci + npm run build (Vite SPA -> /dist)

Stage 2: backend-builder (node:20-alpine)
  -> npm install + prisma generate + npm run build (Express TS -> /dist)

Stage 3: production (node:20-alpine)
  -> Copy dist/, node_modules/, prisma/, public/ (frontend build)
  -> CMD: pre-migrate.ts -> prisma db push -> seed.ts -> node dist/index.js
```

### Startup Sequence
1. `npx tsx prisma/pre-migrate.ts` — Limpia datos/tablas obsoletas (SQL raw, idempotente)
2. `npx prisma db push --skip-generate --accept-data-loss` — Sincroniza schema con DB
3. `npx tsx prisma/seed.ts` — Asegura datos demo (upsert, idempotente)
4. `node dist/index.js` — Inicia Express en puerto 3001

### Static File Serving
```
/assets/*  -> max-age: 1 year, immutable (hashed filenames)
/*         -> max-age: 1 hour (favicon, etc.)
/*path     -> no-cache, no-store (index.html SPA fallback)
```

### Infraestructura
| Componente | Servicio |
|-----------|----------|
| App | Railway (Docker) |
| DB | PostgreSQL (Railway addon) |
| DNS | SiteGround (CNAME -> Railway) |
| Dominio | app.liabotedu.com |
| Repo | github.com/tamibot/lia-dashboard-v4 |
| CI/CD | Push to main -> Railway auto-deploy |

---

## 6. Seed Data (Demo)

La organizacion demo "Instituto de Innovacion para Arquitectos" incluye:

| Tipo | Cantidad | Ejemplos |
|------|----------|---------|
| Cursos | 10 | IA para Arquitectos, Renderizado con IA, Marketing Digital |
| Programas | 3 | IA y Programacion para Arquitectos |
| Webinars | 4 | Tendencias de IA para Arquitectos |
| Talleres | 2 | Aprende a usar IA, BIM + IA |
| Suscripciones | 3 | Asesor IA, Plan Enterprise |
| Asesorias | 2 | Consulta IA, Asesoria para Estudios |
| Postulaciones | 2 | Beca de Innovacion en IA |
| Equipos | 3 | Con miembros y productos asignados |
| Agentes | 4 | Ventas, BDR, Catalogo + personalizado |
| Embudos | 1 | Embudo General (9 etapas default) |
| Campos extraccion | 11 | Incluye preguntas filtro y respuestas |
