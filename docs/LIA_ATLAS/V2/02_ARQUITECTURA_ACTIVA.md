# LIA Atlas V2 — Arquitectura Activa

> Documentación de los componentes activos en producción

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

### 2.1 Catálogo Educativo

**Propósito**: Centralizar toda la oferta educativa de la institución en un solo lugar.

**Tipos soportados:**

| Tipo | Modelo Prisma | Prefix Código | Campos Únicos |
|------|--------------|---------------|---------------|
| Curso | `Course` | CRS- | `syllabusModules`, `instructor`, `totalHours` |
| Programa | `Program` | PRG- | `programCourses`, `certification`, `totalDuration` |
| Webinar | `Webinar` | WBN- | `speaker`, `eventDate`, `eventTime`, `type` (webinar/taller/masterclass/charla) |
| Software | `Software` | SW- | `version`, `platform`, `downloadUrl`, `licenseType` |
| Subscripción | `Subscription` | SUB- | `period`, `benefits`, `features`, `maxUsers` |
| Postulación | `Application` | ADM- | `deadline`, `requirements`, `availableSlots` |

**Campos comunes a todos**: `code`, `title`, `description`, `category`, `price`, `currency`, `status`, `tags`, `targetAudience`, `objectives`, `attachments[]`, `faqs[]`

**Flujo de datos:**
1. Usuario sube información (PDF, texto, temario) en `/courses/upload`
2. Agente IA analiza y estructura los datos
3. Se crea el registro en la tabla correspondiente
4. Aparece en Mi Catálogo con su tipo y categoría

### 2.2 Agentes IA

**Propósito**: Automatizar la venta y análisis de información educativa.

**Agentes activos:**

| Agente | Función | Cómo Funciona |
|--------|---------|---------------|
| **Sales Closer** | Cierre consultivo de ventas | Recibe datos del catálogo + perfil de org. Responde preguntas de prospectos, maneja objeciones, recomienda programas. |
| **BDR Agent** | Recolección de datos de prospecto | Captura nombre, teléfono, correo, interés de forma conversacional. Clasifica el lead. |
| **Catalog Expert** | Exploración de oferta | Ayuda a usuarios a comparar programas, entender beneficios y encontrar el curso ideal. |

**Anti-hallucination (Grounding):**
- Cada agente recibe el catálogo REAL de la base de datos como contexto
- Solo puede responder con información verificada
- Si no tiene datos, indica que no puede confirmar

**Multi-model failover:**
```
Gemini 1.5 Flash → (error) → Gemini 1.5 Pro → (error) → OpenAI GPT-4o-mini
```

### 2.3 CRM — Embudo & Campos

**Propósito**: Definir el pipeline de ventas y los datos que los agentes deben extraer de cada conversación.

**Embudo de Ventas (Pipeline):**
```
BBDD → Interesado → Informado → Filtrado → Cualificado → Asesor Manual
                                                              ↓
                                          Seguimiento ← (sin respuesta 15min)
                                          Descartado ← (no le interesa)
                                          Caso Especial ← (bot no puede procesar)
```

**Campos de Extracción:**
Los campos que el agente debe capturar durante la conversación:

| Campo | Tipo | Obligatorio | Descripción |
|-------|------|-------------|-------------|
| Nombre | string | Sí | Nombre completo del prospecto |
| Teléfono | string | Sí | WhatsApp de contacto |
| Correo | string | Sí | Email de contacto |
| Interés | string | No | Tipo de producto (Curso, Programa, etc.) |
| Detalle Interés | string | No | Curso o programa específico |
| Resumen Solicitud | string | No | Breve resumen de lo que busca |
| Filtrado | boolean | No | Si pasó los filtros de calificación |
| Derivado Asesor | boolean | No | Si fue enviado a un humano |
| Caso Especial | string | No | Motivo si el bot no pudo procesar |

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
├── Course / Program / Webinar / Software / Subscription / Application
│   ├── Attachment (archivos)
│   ├── FAQ (preguntas frecuentes)
│   └── SyllabusModule (solo Course)
├── Team
│   ├── TeamMember
│   └── TeamCourseAssignment
├── AiAgent (configuración de agentes)
├── Contact (leads del CRM)
├── Funnel
│   ├── FunnelStage
│   └── ExtractionField
├── GeneratedContent (tracking de IA)
└── ApiKey (Gemini/OpenAI keys encriptadas)
```

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
- `GET /api/courses?type=curso|programa|webinar|software|subscripcion|postulacion`
- `GET /api/courses/:id?type=...`
- `POST /api/courses` — Crear
- `PUT /api/courses/:id` — Actualizar
- `DELETE /api/courses/:id?type=...`

### CRM
- `GET/POST /api/crm/funnels`
- `GET/PUT/DELETE /api/crm/funnels/:id`
- `GET/POST /api/crm/fields`
- `PUT/DELETE /api/crm/fields/:id`

### Equipos
- `GET/POST /api/teams`
- `PUT/DELETE /api/teams/:id`

### Agentes
- `GET/POST /api/agents`
- `PUT/DELETE /api/agents/:id`

### Otros
- `GET/PUT /api/profile` — Perfil de organización
- `GET/POST /api/settings/keys` — API Keys
- `POST /api/ai/chat` — Chat con agente
- `POST /api/contacts/ghl-sync` — Sync con GoHighLevel
