# LIA Atlas V2 — Dashboard de Gestion Educativa

> Version: 2.2 | Ultima actualizacion: 2026-03-12
> Basado en: LIA Atlas PREMIUM (V1)

---

## Vision General

LIA Education Dashboard es una plataforma SaaS multi-tenant para instituciones educativas que centraliza la gestion de catalogo (7 tipos de productos), agentes de ventas IA, CRM con embudo comercial, equipos comerciales y perfil institucional. Los agentes IA se alimentan del catalogo real para vender de forma conversacional sin hallucinar.

### Principio Guia
> "Primero la base solida: datos, agentes de ventas y embudo. Despues el contenido."

---

## Modulos Activos (V2.2)

| Modulo | Ruta | Descripcion | Estado |
|--------|------|-------------|--------|
| Dashboard | `/` | Vista general con KPIs y accesos rapidos | Activo |
| Mis Agentes | `/agentes` | Creacion, config y testing de agentes IA de ventas | Activo |
| Mi Catalogo | `/courses` | Gestion de toda la oferta educativa (7 tipos) | Activo |
| Subir & Analizar | `/courses/upload` | Ingesta de informacion con asistencia IA + indicador de completitud | Activo |
| Embudo & Campos | `/crm` | Gestion de embudos de ventas y campos de extraccion | Activo |
| Mi Equipo | `/team` | Equipos comerciales multi-producto con disponibilidad | Activo |
| Perfil Institucion | `/profile` | Configuracion organizacional, branding, sedes, pagos | Activo |
| API & Sistema | `/settings` | Gestion de API keys (Gemini/OpenAI) | Activo |
| Mi Cuenta | `/account` | Perfil personal del usuario | Activo |

## Modulos Proximamente

| Modulo | Descripcion | Dependencia |
|--------|-------------|-------------|
| Mi Pagina de Venta | Landing pages generadas por IA | Content Engine |
| Content IA | Generacion de ads, secuencias, landing pages | Vertex AI / RAG |
| Educational IA | Analisis de video, PPT, examenes, tutor IA | Vertex AI |
| KPIs & Reportes | Dashboard analitico con metricas de conversion | InferenceLog + Charts |
| Pagos (Stripe) | Procesamiento de pagos y suscripciones | Stripe API |
| Notificaciones | Emails transaccionales | SendGrid / Resend |
| Cloud Storage | Subida de archivos a S3/GCS | AWS S3 / GCS |

---

## Stack Tecnico

| Capa | Tecnologia |
|------|-----------|
| Frontend | React 19 + Vite 7 + Tailwind CSS + React Router v7 |
| Backend | Express 5 + TypeScript |
| ORM | Prisma 6.8 |
| Base de Datos | PostgreSQL (Railway) |
| IA | Gemini 1.5 Flash/Pro + OpenAI GPT-4o (fallback) |
| Deploy | Docker multi-stage -> Railway |
| Dominio | app.liabotedu.com |
| Repo | github.com/tamibot/lia-dashboard-v4 |

---

## Datos de Acceso Demo

| Campo | Valor |
|-------|-------|
| URL | https://app.liabotedu.com |
| Email | admin@innovation-institute.edu |
| Password | admin123 |
| Organizacion | Instituto de Innovacion para Arquitectos |
| Slug | innovation-institute |

---

## Catalogo Educativo — 7 Tipos

Todos los tipos implementados end-to-end (DB -> API -> Frontend -> AI):

| # | Tipo | Prefix | Modelo Prisma | Tabla DB | Descripcion |
|---|------|--------|--------------|----------|-------------|
| 1 | Curso | `CRS-` | `Course` | `courses` | Cursos independientes con temario, modulos, certificacion |
| 2 | Programa | `PRG-` | `Program` | `programs` | Diplomados/Maestrias con cursos vinculados |
| 3 | Webinar | `WBN-` | `Webinar` | `webinars` | Eventos en vivo (webinar/masterclass/charla) |
| 4 | Taller | `TLR-` | `Taller` | `talleres` | Workshops presenciales con venue y materiales |
| 5 | Suscripcion | `SUB-` | `Subscription` | `subscriptions` | Membresias recurrentes con horas de asesoria |
| 6 | Asesoria | `ASE-` | `Asesoria` | `asesorias` | Consultoria individual con booking y especialidades |
| 7 | Postulacion | `ADM-` | `Application` | `applications` | Procesos de admision con pasos y documentos |

### Campos Comunes a los 7 Tipos

Todos los modelos de producto comparten estos campos:

**Informativos:**
- `code` (unique), `title`, `subtitle`, `description`, `objectives[]`, `targetAudience`
- `price`/`pricePerHour`, `currency`, `promotions`, `requirements[]`
- `contactInfo` (JSON: name, email, phone)
- `category`, `tags[]`, `tools[]`, `location`
- `status` (borrador/activo/archivado), `aiSummary`

**Comerciales (para agentes de ventas):**
- `benefits[]` — Beneficios clave del producto
- `painPoints[]` — Dolores que resuelve
- `guarantee` — Garantia ofrecida
- `socialProof[]` — Testimonios y prueba social
- `bonuses[]` — Bonus incluidos
- `callToAction` — Frase de accion persuasiva
- `idealStudentProfile` — Perfil del estudiante ideal
- `competitiveAdvantage` — Ventaja competitiva vs competencia
- `urgencyTriggers[]` — Gatillos de urgencia ("Solo 5 cupos")
- `objectionHandlers` (JSON) — [{objection, response}] Manejo de objeciones
- `successStories` (JSON) — [{name, quote, result}] Casos de exito

**Relaciones compartidas:**
- `attachments[]` — Archivos adjuntos (PDF, video, imagen, link)
- `faqs[]` — Preguntas frecuentes
- `generatedContent[]` — Contenido generado por IA

### Campos Unicos por Tipo

**Curso**: `syllabusModules[]` (modulos del temario), `instructor`, `instructorBio`, `totalHours`, `schedule`, `earlyBirdPrice`, `maxStudents`, `prerequisites`, `certification`, `registrationLink`, `paymentMethods[]`

**Programa**: `programCourses[]` (cursos del programa), `coordinator`, `totalDuration`, `certification`, `certifyingEntity`, `whatsappGroup`, `includesProject`, `earlyBirdPrice`, `maxStudents`, `registrationLink`, `paymentMethods[]`

**Webinar**: `speaker`, `speakerBio`, `speakerTitle`, `eventDate`, `eventTime`, `webinarFormat` (webinar/masterclass/charla), `maxAttendees`, `keyTopics[]`, `platform`, `registrationLink`, `paymentMethods[]`

**Taller**: `venue`, `venueAddress`, `venueCapacity`, `maxParticipants`, `availableSpots`, `waitlistEnabled`, `materials[]`, `deliverables[]`, `certification`, `earlyBirdPrice`, `earlyBirdDeadline`, `registrationLink`, `paymentMethods[]`

**Suscripcion**: `period` (mensual/anual/trimestral), `features[]`, `maxUsers`, `advisoryHours`, `whatsappGroup`, `communityAccess`, `registrationLink`, `paymentMethods[]`

**Asesoria**: `pricePerHour`, `minimumHours`, `packageHours`, `packagePrice`, `advisor`, `advisorBio`, `advisorTitle`, `specialties[]`, `bookingLink`, `minAdvanceBooking`, `availableSchedule`, `sessionDuration`, `topicsCovered[]`, `deliverables[]`, `needsDescription`, `registrationLink`, `paymentMethods[]`

**Postulacion**: `deadline`, `availableSlots`, `examRequired`, `examDescription`, `applicationFee`, `steps[]`, `documentsNeeded[]`, `selectionCriteria[]`, `registrationLink`, `paymentMethods[]`

---

## Agentes IA

### Agentes Pre-configurados

| Agente | Rol | Personalidad | Proposito |
|--------|-----|-------------|-----------|
| Asistente de Ventas | Sales Closer | Profesional | Cierre consultivo, manejo de objeciones, casos de exito |
| Recolector de Informacion | BDR Agent | Amigable | Captura datos de prospectos de forma conversacional |
| Asistente de Catalogo | Catalog Expert | Entusiasta | Exploracion y comparacion de oferta educativa |

### Configuracion de un Agente

Cada agente tiene:
- **Identidad**: nombre, rol, personalidad, tono, idioma, avatar
- **Expertise**: areas de conocimiento (array)
- **System prompt**: instrucciones personalizadas
- **Cursos asignados**: productos que puede vender (via AgentCourse)
- **Embudo asignado** (`funnelId`): embudo que sigue el agente
- **Campos de extraccion** (`extractionFieldIds[]`): datos que debe capturar
- **Equipo** (`teamId`): equipo al que escala leads cualificados

### Anti-hallucination (Grounding)

Los agentes reciben como contexto:
1. Catalogo REAL de la base de datos (productos asignados)
2. Perfil completo de la organizacion (nombre, sedes, pagos, horarios)
3. Campos comerciales (objeciones, casos de exito, ventaja competitiva)
4. Etapas del embudo asignado
5. Campos de extraccion a capturar

### Multi-model Failover
```
Gemini 1.5 Flash -> (error) -> Gemini 1.5 Pro -> (error) -> OpenAI GPT-4o-mini
```

---

## CRM — Embudo Comercial

### Embudo de Ventas (Pipeline)

9 etapas **por defecto** que representan el journey del lead. El cliente puede agregar, editar o eliminar etapas desde `/crm`:

| # | Etapa | Key | Descripcion | Regla de Avance |
|---|-------|-----|-------------|-----------------|
| 1 | BBDD | `bbdd` | Base de datos inicial | Entrada automatica de leads |
| 2 | Interesado | `interesado` | Interes detectado | Bot detecta intencion clara de compra o consulta especifica |
| 3 | Informado | `informado` | Se le paso informacion | Al entregar temario, precios o detalles del servicio |
| 4 | Filtrado | `filtrado` | Preguntas filtro aplicadas | Despues de obtener respuestas a las preguntas de calificacion |
| 5 | Cualificado a asesor | `cualificado` | Perfil ideal confirmado | Lead cumple con perfil ideal -> pasa a humano |
| 6 | Asesor manual | `asesor_manual` | Solicita hablar con humano | Si el usuario escribe "quiero hablar con un humano" |
| 7 | Seguimiento | `seguimiento` | Secuencia de follow-up | Si despues de 15 min no responde |
| 8 | Descartado | `descartado` | No le interesa o no aplica | Lead indica desinteres o no cumple requisitos |
| 9 | Caso especial | `caso_especial` | Contingencia | Leads que el bot no puede procesar |

```
Flujo visual (default):
BBDD -> Interesado -> Informado -> Filtrado -> Cualificado -> Asesor Manual
                                                                   |
                                           Seguimiento <- (sin respuesta 15min)
                                           Descartado <- (no le interesa)
                                           Caso Especial <- (bot no puede procesar)
```

> Las etapas son **personalizables**: el admin puede crear embudos adicionales con sus propias etapas, renombrar etapas existentes, o reordenarlas segun su proceso comercial.

### Campos de Extraccion de Conversacion

Datos **por defecto** que los agentes IA capturan durante cada conversacion. El cliente puede agregar campos personalizados desde `/crm`:

| Campo | Key | Tipo | Obligatorio | Opciones / Default | Descripcion |
|-------|-----|------|-------------|-------------------|-------------|
| Nombre | `cliente_nombre` | string | Si | — | Nombre completo del prospecto |
| Telefono | `cliente_telefono` | string | Si | — | Numero de contacto (WhatsApp) |
| Correo | `cliente_correo` | string | Si | — | Email de contacto |
| Interes | `interes_tipo` | string | No | Curso, Programa, Webinar, Taller, Suscripcion, Asesoria, Postulacion | Tipo de producto de interes |
| Detalle Interes | `interes_detalle` | string | No | — | Curso o programa especifico |
| Preguntas Filtro | `preguntas_filtro` | array | No | (ver abajo) | Preguntas de calificacion |
| Respuestas Filtro | `respuestas_filtro` | array | No | — | Respuestas del prospecto |
| Resumen Solicitud | `solicitud_resumen` | string | No | — | Breve resumen de lo que busca |
| Filtrado | `es_filtrado` | boolean | No | — | Si paso los filtros de calificacion |
| Derivado Asesor | `es_derivado` | boolean | No | — | Si fue enviado a un asesor humano |
| Caso Especial | `caso_especial_motivo` | string | No | — | Motivo por el cual el bot no pudo procesar |

**Preguntas Filtro por defecto** (personalizables por el admin):
1. Cual es tu presupuesto aproximado?
2. Cuando te gustaria empezar?
3. Tienes experiencia previa en el tema?
4. Cual es tu disponibilidad horaria?
5. Buscas certificacion?

---

## Equipos Comerciales

### Estructura
```
Organizacion -> Equipos -> Miembros
                   |
                   +-> Productos Asignados (cualquier tipo, no solo cursos)
```

### Campos de un Miembro de Equipo

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| name | string | Nombre completo |
| email | string | Email de contacto |
| phone | string? | Telefono |
| whatsapp | string? | WhatsApp directo |
| role | string? | Rol: SDR, Closer, Account Executive, etc. |
| availability | string? | Horario: "L-V 9am-6pm" |
| vacationStart/End | DateTime? | Periodo de vacaciones |
| isAvailable | boolean | Disponible para recibir leads |
| specialties | string[] | Areas de expertise |
| maxLeads | int? | Maximo de leads simultaneos |
| userId | string? | Link al usuario autenticado (opcional) |

### Asignacion de Productos (TeamProductAssignment)

A diferencia de la version anterior (solo cursos), ahora se puede asignar **cualquier tipo de producto** a un equipo:

| Campo | Tipo | Descripcion |
|-------|------|-------------|
| teamId | string | ID del equipo |
| entityType | EntityType | course, program, webinar, taller, subscription, asesoria, application |
| entityId | string | ID del producto |

---

## Perfil de Institucion (Organization)

### Campos Generales
| Campo | Tipo | Descripcion |
|-------|------|-------------|
| name | string | Nombre de la organizacion |
| slug | string (unique) | URL-friendly: "innovation-institute" |
| type | OrgType | universidad, instituto, infoproductor |
| description | string | Descripcion general |
| tagline | string? | Eslogan |
| website | string? | Sitio web |
| contactEmail | string? | Email de contacto |
| contactPhone | string? | Telefono de contacto |
| whatsapp | string? | WhatsApp institucional |
| targetAudience | string? | Publico objetivo |
| history | string? | Historia de la institucion |

### Campos por Tipo de Organizacion
| Campo | Aplica a | Descripcion |
|-------|----------|-------------|
| accreditations | universidad | Acreditaciones |
| specialty | instituto | Especialidad |
| personalBrand | infoproductor | Marca personal |
| niche | infoproductor | Nicho de mercado |

### Datos Complejos (JSONB)
| Campo | Estructura | Descripcion |
|-------|-----------|-------------|
| branding | `{colors, typography, voice, visualIdentity}` | Identidad visual y tono |
| socialMedia | `{instagram, facebook, linkedin, tiktok, youtube, website}` | Redes sociales |
| operatingHours | `[{days, hours}]` | Horarios de atencion |
| locations | `[{id, name, address, phone, schedule}]` | Sedes fisicas |
| paymentMethods | `[{type, name, details, currency}]` | Metodos de pago aceptados |
| certificates | `string[]` | Acreditaciones, certificaciones, licencias |
| modalities | `string[]` | "Online", "Presencial", "Hibrido" |
| courseCategories | `string[]` | Categorias de cursos ofrecidos |

---

## Documentos Relacionados

- [01_CHANGELOG.md](./01_CHANGELOG.md) — Log detallado de cambios
- [02_ARQUITECTURA_ACTIVA.md](./02_ARQUITECTURA_ACTIVA.md) — Modelo de datos, API y deploy
- [PREMIUM/00_MASTER_INDEX.md](../PREMIUM/00_MASTER_INDEX.md) — Arquitectura original del sistema
- [PREMIUM/04_DICCIONARIO_DATOS_Y_ER.md](../PREMIUM/04_DICCIONARIO_DATOS_Y_ER.md) — Diccionario de datos completo
