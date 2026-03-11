# LIA Atlas V2.1 — Arquitectura Activa

> Documentación de los componentes activos en producción
> Última actualización: 2026-03-11

---

## 1. Flujo Principal del Sistema

```
Usuario → app.liabotedu.com → Express (SPA) → React Frontend
                                    ↓
                              /api/* → Express API
                                    ↓
                              Prisma ORM → PostgreSQL
                                    ↓
                              Gemini/OpenAI (para agentes)
```

## 2. Módulos Activos — Detalle

### 2.1 Catálogo Educativo (7 Tipos)

**Propósito**: Centralizar toda la oferta educativa de la institución en un solo lugar.

**Tipos soportados:**

| Tipo | Modelo Prisma | Prefix | Tabla | Campos Únicos |
|------|--------------|--------|-------|---------------|
| Curso | `Course` | CRS- | `courses` | `syllabusModules[]`, `instructor`, `instructorBio`, `totalHours`, `schedule`, `earlyBirdPrice`, `maxStudents`, `prerequisites`, `certification`, `registrationLink`, `paymentMethods[]` |
| Programa | `Program` | PRG- | `programs` | `programCourses[]`, `certification`, `certifyingEntity`, `totalDuration`, `coordinator`, `earlyBirdPrice`, `maxStudents`, `whatsappGroup`, `includesProject`, `registrationLink`, `paymentMethods[]` |
| Webinar | `Webinar` | WBN- | `webinars` | `speaker`, `speakerBio`, `speakerTitle`, `eventDate`, `eventTime`, `webinarFormat` (webinar/masterclass/charla), `maxAttendees`, `callToAction`, `keyTopics[]`, `registrationLink`, `paymentMethods[]` |
| Taller | `Taller` | TLR- | `talleres` | `venue`, `venueAddress`, `venueCapacity`, `maxParticipants`, `availableSpots`, `waitlistEnabled`, `materials[]`, `deliverables[]`, `certification`, `earlyBirdPrice`, `earlyBirdDeadline`, `registrationLink`, `paymentMethods[]` |
| Suscripción | `Subscription` | SUB- | `subscriptions` | `period`, `features[]`, `maxUsers`, `advisoryHours`, `whatsappGroup`, `communityAccess`, `registrationLink`, `paymentMethods[]` |
| Asesoría | `Asesoria` | ASE- | `asesorias` | `pricePerHour`, `minimumHours`, `packageHours`, `packagePrice`, `advisor`, `advisorBio`, `advisorTitle`, `specialties[]`, `bookingLink`, `minAdvanceBooking`, `availableSchedule`, `sessionDuration`, `topicsCovered[]`, `deliverables[]`, `needsDescription`, `registrationLink`, `paymentMethods[]` |
| Postulación | `Application` | ADM- | `applications` | `deadline`, `availableSlots`, `examRequired`, `examDescription`, `applicationFee`, `steps[]`, `documentsNeeded[]`, `selectionCriteria[]`, `registrationLink`, `paymentMethods[]` |

**Campos comunes a todos los 7 tipos**: `code`, `title`, `subtitle`, `description`, `category`, `price`/`pricePerHour`, `currency`, `status` (borrador/activo/archivado), `tags[]`, `targetAudience`, `objectives[]`, `benefits[]`, `painPoints[]`, `socialProof[]`, `bonuses[]`, `guarantee`, `tools[]`, `requirements[]`, `contactInfo`, `promotions`, `location`, `aiSummary`, `attachments[]`, `faqs[]`

**Flujo de datos:**
1. Usuario sube información (PDF, texto, temario) en `/courses/upload`
2. Selecciona tipo: Curso, Programa, Webinar, Taller, Suscripción, Asesoría o Postulación
3. Agente IA analiza y estructura los datos
4. Se crea el registro en la tabla correspondiente con prefix de código automático
5. Aparece en Mi Catálogo en su tab correspondiente

### 2.2 Agentes IA

**Propósito**: Automatizar la venta y análisis de información educativa.

**Agentes activos:**

| Agente | Función | Cómo Funciona |
|--------|---------|---------------|
| **Sales Closer** | Cierre consultivo de ventas | Recibe datos del catálogo + perfil de org. Responde preguntas de prospectos, maneja objeciones, recomienda programas. |
| **BDR Agent** | Recolección de datos de prospecto | Captura nombre, teléfono, correo, interés de forma conversacional. Clasifica el lead. |
| **Catalog Expert** | Exploración de oferta | Ayuda a usuarios a comparar programas, entender beneficios y encontrar el curso ideal. |

**Anti-hallucination (Grounding):**
- Cada agente recibe el catálogo REAL de la base de datos como contexto (los 7 tipos)
- Solo puede responder con información verificada
- Si no tiene datos, indica que no puede confirmar

**Multi-model failover:**
```
Gemini 1.5 Flash → (error) → Gemini 1.5 Pro → (error) → OpenAI GPT-4o-mini
```

### 2.3 CRM — Embudo Comercial y Campos de Extracción

**Propósito**: Definir el pipeline de ventas y los datos que los agentes deben extraer de cada conversación.

#### 2.3.1 Embudo de Ventas (Pipeline)

El embudo define las etapas por las que pasa un lead desde el primer contacto hasta el cierre o descarte. Es completamente configurable desde `/crm`.

**Embudo Default — 9 etapas:**

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO PRINCIPAL                            │
│                                                              │
│  ① BBDD → ② Interesado → ③ Informado → ④ Filtrado          │
│                                            ↓                 │
│                                    ⑤ Cualificado             │
│                                            ↓                 │
│                                    ⑥ Asesor Manual           │
│                                                              │
├──────────────── FLUJOS ALTERNATIVOS ────────────────────────┤
│                                                              │
│  ⑦ Seguimiento ← (sin respuesta 15 min)                     │
│  ⑧ Descartado  ← (no le interesa / no aplica)               │
│  ⑨ Caso Especial ← (bot no puede procesar)                  │
└─────────────────────────────────────────────────────────────┘
```

**Detalle de cada etapa (default — personalizable por el admin):**

| # | Etapa | Key | Descripción | Regla de Avance |
|---|-------|-----|-------------|-----------------|
| 1 | BBDD | `bbdd` | Base de datos inicial | Entrada automática de leads nuevos |
| 2 | Interesado | `interesado` | Interés detectado | Bot detecta intención clara de compra o consulta sobre un producto específico |
| 3 | Informado | `informado` | Info entregada | Al entregar temario, precios, horarios o detalles del servicio solicitado |
| 4 | Filtrado | `filtrado` | Preguntas filtro aplicadas | Después de obtener respuestas a las preguntas de calificación |
| 5 | Cualificado a asesor | `cualificado` | Perfil ideal confirmado | Lead cumple perfil → se transfiere a asesor humano |
| 6 | Asesor manual | `asesor_manual` | Solicita humano | Si el usuario escribe "quiero hablar con un humano" o similar |
| 7 | Seguimiento | `seguimiento` | Secuencia follow-up | Si después de 15 min no responde el mensaje |
| 8 | Descartado | `descartado` | No aplica | Lead indica desinterés, no tiene presupuesto, o no cumple requisitos |
| 9 | Caso especial | `caso_especial` | Contingencia | Leads con requerimientos que el bot no puede procesar (reclamos, temas legales, etc.) |

**Configuración (todo personalizable):**
- Las etapas son **por defecto** — el admin puede agregar, editar, eliminar o reordenar etapas
- Cada etapa tiene: `name`, `key`, `description`, `rules`, `color`, `sortOrder`
- Se pueden crear **múltiples embudos** (uno default + embudos especializados por producto/campaña)
- Cada embudo tiene sus propias etapas y campos de extracción independientes

#### 2.3.2 Campos de Extracción de Conversación

Los campos de extracción definen qué datos debe capturar el agente IA durante cada conversación con un prospecto. Estos datos se almacenan como metadata del contacto y alimentan el CRM. Todos los campos son **por defecto** y el admin puede personalizarlos.

**Campos Default (11 campos):**

| Campo | Key | Tipo | Obligatorio | Opciones / Default | Para qué sirve |
|-------|-----|------|-------------|-------------------|----------------|
| Nombre | `cliente_nombre` | string | Si | — | Identificar al prospecto |
| Teléfono | `cliente_telefono` | string | Si | — | WhatsApp para follow-up |
| Correo | `cliente_correo` | string | Si | — | Email marketing y comunicación |
| Interés | `interes_tipo` | string | No | Curso, Programa, Webinar, Taller, Suscripción, Asesoría, Postulación | Clasificar qué tipo de producto busca |
| Detalle Interés | `interes_detalle` | string | No | — | Producto específico (ej: "Curso de IA para Arquitectos") |
| **Preguntas Filtro** | `preguntas_filtro` | **array** | No | (ver abajo) | Preguntas de calificación para determinar si es lead cualificado |
| **Respuestas Filtro** | `respuestas_filtro` | **array** | No | — | Respuestas del prospecto a las preguntas filtro |
| Resumen Solicitud | `solicitud_resumen` | string | No | — | Contexto de la conversación para el asesor |
| Filtrado | `es_filtrado` | boolean | No | — | Indica si pasó las preguntas de calificación |
| Derivado Asesor | `es_derivado` | boolean | No | — | Tracking de leads transferidos a humano |
| Caso Especial | `caso_especial_motivo` | string | No | — | Razón por la cual el bot no pudo cerrar |

**Preguntas Filtro por defecto** (el admin las personaliza según su negocio):
1. ¿Cuál es tu presupuesto aproximado?
2. ¿Cuándo te gustaría empezar?
3. ¿Tienes experiencia previa en el tema?
4. ¿Cuál es tu disponibilidad horaria?
5. ¿Buscas certificación?

**Cómo funcionan:**
1. El admin configura los campos y preguntas filtro desde `/crm` → pestaña "Campos de Extracción"
2. Los agentes IA reciben la lista de campos + preguntas filtro como parte de su system prompt
3. Durante la conversación, el agente extrae los datos y hace las preguntas filtro de forma natural (sin formulario)
4. Los datos extraídos y respuestas se guardan en el contacto del CRM
5. Si el prospecto pasa las preguntas filtro → `es_filtrado = true` → avanza a etapa "Cualificado"
6. El asesor humano recibe el resumen completo + respuestas filtro al momento del handoff

**Personalización de campos:**
- El admin puede **agregar campos** adicionales (ej: "Presupuesto", "Empresa", "Cargo", "Ciudad")
- Puede **modificar las preguntas filtro** para adaptarlas a su proceso de ventas
- Cada campo tiene: `name`, `key`, `dataType` (string/boolean/number/array), `isRequired`, `options[]`
- Los campos se vinculan a un embudo específico o son globales para toda la organización
- Tipos de datos soportados: `string`, `boolean`, `number`, `array`

### 2.4 Equipos Comerciales

**Propósito**: Organizar al equipo humano de ventas para escalamiento desde los agentes.

**Estructura:**
```
Organización → Equipos → Miembros
                  ↓
            Cursos Asignados (especialización)
```

**Campos de miembro**: nombre, email, rol (Closer/SDR/Tutor), disponibilidad, vacaciones

### 2.5 Perfil de Institución

**Propósito**: Configurar la identidad de la organización que los agentes IA usarán como contexto.

**Secciones:**
- **General**: Tipo, nombre, tagline, descripción, audiencia, website, historia
- **Branding**: Logo, colores (primary/secondary/accent), tipografía, tono de voz, identidad visual
- **Social Media**: Instagram, Facebook, LinkedIn, TikTok, YouTube
- **Operacional**: Modalidades de estudio, sedes, métodos de pago, horarios

---

## 3. Modelo de Datos (Entidades Principales)

```
Organization (multi-tenant root)
├── User (auth + RBAC)
├── Course / Program / Webinar / Taller / Subscription / Asesoria / Application
│   ├── Attachment (archivos polimórficos)
│   ├── FAQ (preguntas frecuentes polimórficas)
│   ├── GeneratedContent (tracking de IA polimórfico)
│   ├── SyllabusModule (solo Course)
│   └── ProgramCourse (solo Program)
├── Team
│   ├── TeamMember
│   └── TeamCourseAssignment
├── AiAgent (configuración de agentes)
│   └── AgentCourse (cursos asignados)
├── Contact (leads del CRM)
├── Funnel
│   ├── FunnelStage (etapas del embudo)
│   └── ExtractionField (campos a extraer)
└── ApiKey (Gemini/OpenAI keys encriptadas)
```

**EntityType enum** (usado por Attachment, Faq, GeneratedContent):
`course | program | webinar | taller | subscription | asesoria | application`

---

## 4. Endpoints API

### Públicos (sin auth)
- `GET /api/health` — Health check
- `GET /api/public/courses` — Catálogo público

### Auth
- `POST /api/auth/login` — Login
- `POST /api/auth/register` — Registro
- `GET /api/auth/me` — Usuario actual

### Catálogo (auth required)
- `GET /api/courses?type=curso|programa|webinar|taller|subscripcion|asesoria|postulacion`
- `GET /api/courses/:id?type=...`
- `POST /api/courses` — Crear (body incluye `type`, auto-genera `code` con prefix)
- `PUT /api/courses/:id` — Actualizar
- `DELETE /api/courses/:id?type=...`

### CRM
- `GET/POST /api/crm/funnels` — Listar/crear embudos
- `GET/PUT/DELETE /api/crm/funnels/:id` — CRUD de embudo individual
- `GET/POST /api/crm/fields` — Listar/crear campos de extracción
- `PUT/DELETE /api/crm/fields/:id` — CRUD de campo individual

### Equipos
- `GET/POST /api/teams`
- `PUT/DELETE /api/teams/:id`

### Agentes
- `GET/POST /api/agents`
- `PUT/DELETE /api/agents/:id`

### Otros
- `GET/PUT /api/profile` — Perfil de organización
- `GET/POST /api/settings/keys` — API Keys
- `POST /api/ai/chat` — Chat con agente (grounding con catálogo real)
- `POST /api/contacts/ghl-sync` — Sync con GoHighLevel

---

## 5. Deploy (Docker + Railway)

### Dockerfile Multi-Stage
```
Stage 1: frontend-builder (node:20-alpine)
  → npm ci + npm run build (Vite SPA)

Stage 2: backend-builder (node:20-alpine)
  → npm install + prisma generate + npm run build (Express TS)

Stage 3: production (node:20-alpine)
  → Copy dist/, node_modules/, prisma/, public/
  → CMD: pre-migrate.ts → prisma db push → seed.ts → node dist/index.js
```

### Startup Sequence
1. `npx tsx prisma/pre-migrate.ts` — Limpia datos/tablas obsoletas (idempotente)
2. `npx prisma db push --skip-generate --accept-data-loss` — Sincroniza schema con DB
3. `npx tsx prisma/seed.ts` — Asegura datos demo (upsert, idempotente)
4. `node dist/index.js` — Inicia Express en puerto 3001
