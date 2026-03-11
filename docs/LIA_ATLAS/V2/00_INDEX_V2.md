# LIA Atlas V2 — Dashboard de Gestión Educativa

> Versión: 2.1 | Última actualización: 2026-03-11
> Basado en: LIA Atlas PREMIUM (V1)

---

## Visión General

LIA Education Dashboard V2 es la evolución enfocada del sistema original. Se priorizaron las funcionalidades core de **gestión de catálogo educativo (7 tipos)**, **agentes de ventas/análisis**, y **embudo CRM con campos de extracción**, dejando las herramientas de generación de contenido IA para una fase posterior.

### Principio Guía
> "Primero la base sólida: datos, agentes de ventas y embudo. Después el contenido."

---

## Módulos Activos (V2.1)

| Módulo | Ruta | Descripción | Estado |
|--------|------|-------------|--------|
| Dashboard | `/` | Vista general con 7 KPIs y accesos rápidos | Activo |
| Mis Agentes | `/agentes` | Creación y testing de agentes IA | Activo |
| Mi Catálogo | `/courses` | Gestión de toda la oferta educativa (7 tipos) | Activo |
| Subir & Analizar | `/courses/upload` | Ingesta de información con asistencia IA | Activo |
| Embudo & Campos | `/crm` | Gestión de embudos de ventas y campos de extracción | Activo |
| Mi Equipo | `/team` | Equipos comerciales y asignación de cursos | Activo |
| Perfil Institución | `/profile` | Configuración organizacional y branding | Activo |
| API & Sistema | `/settings` | Gestión de API keys (Gemini/OpenAI) | Activo |
| Mi Cuenta | `/account` | Perfil personal del usuario | Activo |

## Módulos Próximamente

| Módulo | Descripción | Dependencia |
|--------|-------------|-------------|
| Mi Página de Venta | Landing pages generadas por IA | Content Engine |
| Content IA | Generación de ads, secuencias, landing pages | Vertex AI / RAG |
| Educational IA | Análisis de video, PPT, exámenes | Vertex AI |
| KPIs & Reportes | Dashboard analítico con métricas | InferenceLog + Charts |

---

## Cambios V1 → V2.1

### Arquitectura
- **Unified Deploy**: Frontend (Vite) + Backend (Express) en un solo contenedor Docker
- **SPA Serving**: Express sirve los archivos estáticos del frontend + fallback para SPA
- **Railway Config**: Dockerfile en raíz del repo, sin subdirectorio server/
- **DB Sync**: Pre-migration cleanup + `prisma db push --accept-data-loss` + seed automático al iniciar el contenedor
- **Pre-migration Pattern**: Script idempotente (`pre-migrate.ts`) para limpiar datos/tablas obsoletas antes de `db push`

### Catálogo Educativo (7 Tipos)
Todos los tipos están implementados end-to-end (DB → API → Frontend):

1. **Curso** (`CRS-`) — Cursos independientes con temario, módulos, precio, registrationLink, paymentMethods
2. **Programa** (`PRG-`) — Diplomados/Maestrías con cursos vinculados, whatsappGroup, includesProject
3. **Webinar** (`WBN-`) — Eventos en vivo con webinarFormat (webinar/masterclass/charla), speaker
4. **Taller** (`TLR-`) — Workshops presenciales con venue, maxParticipants, materials, deliverables, certification
5. **Suscripción** (`SUB-`) — Membresías recurrentes con advisoryHours, whatsappGroup, communityAccess
6. **Asesoría** (`ASE-`) — Consultoría con pricePerHour, bookingLink, specialties, sessionDuration
7. **Postulación** (`ADM-`) — Procesos de admisión con examRequired, steps, documentsNeeded, selectionCriteria

### Agentes IA Pre-configurados
| Agente | Rol | Personalidad | Propósito |
|--------|-----|-------------|-----------|
| Asistente de Ventas | Sales Closer | Profesional | Cierre consultivo, manejo de objeciones |
| Recolector de Información | BDR Agent | Amigable | Captura datos de prospectos de forma conversacional |
| Asistente de Catálogo | Catalog Expert | Entusiasta | Exploración y comparación de oferta educativa |

### CRM — Embudo Comercial

#### Embudo de Ventas (Pipeline)
9 etapas **por defecto** que representan el journey del lead. El cliente puede agregar, editar o eliminar etapas desde `/crm`:

| # | Etapa | Key | Descripción | Regla de Avance |
|---|-------|-----|-------------|-----------------|
| 1 | BBDD | `bbdd` | Base de datos inicial | Entrada automática de leads |
| 2 | Interesado | `interesado` | Interés detectado | Bot detecta intención clara de compra o consulta específica |
| 3 | Informado | `informado` | Se le pasó información | Al entregar temario, precios o detalles del servicio |
| 4 | Filtrado | `filtrado` | Preguntas filtro aplicadas | Después de obtener respuestas a las preguntas de calificación |
| 5 | Cualificado a asesor | `cualificado` | Perfil ideal confirmado | Lead cumple con perfil ideal → pasa a humano |
| 6 | Asesor manual | `asesor_manual` | Solicita hablar con humano | Si el usuario escribe "quiero hablar con un humano" |
| 7 | Seguimiento | `seguimiento` | Secuencia de follow-up | Si después de 15 min no responde |
| 8 | Descartado | `descartado` | No le interesa o no aplica | Lead indica desinterés o no cumple requisitos |
| 9 | Caso especial | `caso_especial` | Contingencia | Leads que el bot no puede procesar |

> Las etapas son **personalizables**: el admin puede crear embudos adicionales con sus propias etapas, renombrar etapas existentes, o reordenarlas según su proceso comercial.

```
Flujo visual (default):
BBDD → Interesado → Informado → Filtrado → Cualificado → Asesor Manual
                                                              ↓
                                          Seguimiento ← (sin respuesta 15min)
                                          Descartado ← (no le interesa)
                                          Caso Especial ← (bot no puede procesar)
```

#### Campos de Extracción de Conversación
Datos **por defecto** que los agentes IA capturan durante cada conversación. El cliente puede agregar campos personalizados desde `/crm`:

| Campo | Key | Tipo | Obligatorio | Opciones / Default | Descripción |
|-------|-----|------|-------------|-------------------|-------------|
| Nombre | `cliente_nombre` | string | Si | — | Nombre completo del prospecto |
| Teléfono | `cliente_telefono` | string | Si | — | Número de contacto (WhatsApp) |
| Correo | `cliente_correo` | string | Si | — | Email de contacto |
| Interés | `interes_tipo` | string | No | Curso, Programa, Webinar, Taller, Suscripción, Asesoría, Postulación | Tipo de producto o servicio de interés |
| Detalle Interés | `interes_detalle` | string | No | — | Curso o programa específico que le interesa |
| Preguntas Filtro | `preguntas_filtro` | array | No | (ver abajo) | Preguntas de calificación que el agente hace para determinar si es lead cualificado |
| Respuestas Filtro | `respuestas_filtro` | array | No | — | Respuestas del prospecto a las preguntas filtro |
| Resumen Solicitud | `solicitud_resumen` | string | No | — | Breve resumen de lo que busca el prospecto |
| Filtrado | `es_filtrado` | boolean | No | — | Si pasó los filtros de calificación |
| Derivado Asesor | `es_derivado` | boolean | No | — | Si fue enviado a un asesor humano |
| Caso Especial | `caso_especial_motivo` | string | No | — | Motivo por el cual el bot no pudo procesar |

**Preguntas Filtro por defecto** (personalizables por el admin):
1. ¿Cuál es tu presupuesto aproximado?
2. ¿Cuándo te gustaría empezar?
3. ¿Tienes experiencia previa en el tema?
4. ¿Cuál es tu disponibilidad horaria?
5. ¿Buscas certificación?

> **Personalizable**: tanto los campos como las preguntas filtro son editables. El admin puede agregar nuevos campos (ej: "Empresa", "Cargo", "Ciudad"), modificar las preguntas filtro, o crear campos tipo dropdown con opciones predefinidas.

### Limpieza de Código
- Eliminados 22+ archivos no utilizados (demo data hardcodeada, scripts de prueba)
- Removidas rutas y componentes de features desactivadas
- Eliminado modelo Software y enum WebinarType (reemplazados por Taller + Asesoría + webinarFormat)
- Auth seguro en producción (demo fallback solo en development)
- Express 5 route syntax corregida (`{*path}`)

---

## Stack Técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + Vite 7 + Tailwind CSS |
| Backend | Express 5 + TypeScript |
| ORM | Prisma 6 |
| Base de Datos | PostgreSQL (Railway) |
| IA | Gemini 1.5 Flash/Pro + OpenAI GPT-4o (fallback) |
| Deploy | Docker multi-stage → Railway |
| Dominio | app.liabotedu.com |

## Datos de Acceso Demo

| Campo | Valor |
|-------|-------|
| URL | https://app.liabotedu.com |
| Email | admin@innovation-institute.edu |
| Password | admin123 |
| Organización | Instituto de Innovación para Arquitectos |

---

## Documentos Relacionados

- [PREMIUM/00_MASTER_INDEX.md](../PREMIUM/00_MASTER_INDEX.md) — Arquitectura original del sistema
- [PREMIUM/04_DICCIONARIO_DATOS_Y_ER.md](../PREMIUM/04_DICCIONARIO_DATOS_Y_ER.md) — Diccionario de datos completo
- [PREMIUM/05_INTEGRACIONES_GHL_Y_CRM.md](../PREMIUM/05_INTEGRACIONES_GHL_Y_CRM.md) — Integración CRM/GHL
- [01_CHANGELOG.md](./01_CHANGELOG.md) — Log detallado de cambios
- [02_ARQUITECTURA_ACTIVA.md](./02_ARQUITECTURA_ACTIVA.md) — Arquitectura y endpoints activos
