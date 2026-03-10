# LIA Atlas V2 — Dashboard de Gestión Educativa

> Versión: 2.0 | Última actualización: 2026-03-10
> Basado en: LIA Atlas PREMIUM (V1)

---

## Visión General

LIA Education Dashboard V2 es la evolución enfocada del sistema original. Se priorizaron las funcionalidades core de **gestión de catálogo educativo**, **agentes de ventas/análisis**, y **embudo CRM**, dejando las herramientas de generación de contenido IA para una fase posterior.

### Principio Guía
> "Primero la base sólida: datos, agentes de ventas y embudo. Después el contenido."

---

## Módulos Activos (V2)

| Módulo | Ruta | Descripción | Estado |
|--------|------|-------------|--------|
| Dashboard | `/` | Vista general con KPIs y accesos rápidos | Activo |
| Mis Agentes | `/agentes` | Creación y testing de agentes IA | Activo |
| Mi Catálogo | `/courses` | Gestión de toda la oferta educativa (6 tipos) | Activo |
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

## Cambios V1 → V2

### Arquitectura
- **Unified Deploy**: Frontend (Vite) + Backend (Express) en un solo contenedor Docker
- **SPA Serving**: Express sirve los archivos estáticos del frontend + fallback para SPA
- **Railway Config**: Dockerfile en raíz del repo, sin subdirectorio server/
- **DB Sync**: `prisma db push` + seed automático al iniciar el contenedor

### Catálogo Educativo (6 Tipos)
Todos los tipos están implementados end-to-end (DB → API → Frontend):

1. **Curso** — Cursos independientes con temario, módulos, precio
2. **Programa** — Diplomados/Maestrías con cursos vinculados
3. **Webinar** — Eventos en vivo (webinar, taller, masterclass, charla)
4. **Software** — Licencias y herramientas educativas
5. **Subscripción** — Membresías recurrentes con beneficios
6. **Postulación** — Procesos de admisión y becas

### Agentes IA Pre-configurados
| Agente | Rol | Personalidad | Propósito |
|--------|-----|-------------|-----------|
| Asistente de Ventas | Sales Closer | Profesional | Cierre consultivo, manejo de objeciones |
| Recolector de Información | BDR Agent | Amigable | Captura datos de prospectos de forma conversacional |
| Asistente de Catálogo | Catalog Expert | Entusiasta | Exploración y comparación de oferta educativa |

### CRM & Embudo de Ventas
- **Embudos**: Configuración de pipelines con etapas personalizables
- **Campos de Extracción**: Definición de datos a capturar por los agentes
- **Embudo Default**: 9 etapas (BBDD → Interesado → Informado → Filtrado → Cualificado → Asesor Manual → Seguimiento → Descartado → Caso Especial)

### Limpieza de Código
- Eliminados 22+ archivos no utilizados (demo data hardcodeada, scripts de prueba)
- Removidas rutas y componentes de features desactivadas
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
| Organización | Innovation Institute |

---

## Documentos Relacionados

- [PREMIUM/00_MASTER_INDEX.md](../PREMIUM/00_MASTER_INDEX.md) — Arquitectura original del sistema
- [PREMIUM/04_DICCIONARIO_DATOS_Y_ER.md](../PREMIUM/04_DICCIONARIO_DATOS_Y_ER.md) — Diccionario de datos completo
- [PREMIUM/05_INTEGRACIONES_GHL_Y_CRM.md](../PREMIUM/05_INTEGRACIONES_GHL_Y_CRM.md) — Integración CRM/GHL
- [01_CHANGELOG.md](./01_CHANGELOG.md) — Log detallado de cambios
