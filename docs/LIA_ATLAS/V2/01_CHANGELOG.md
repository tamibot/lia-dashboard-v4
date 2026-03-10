# LIA Atlas V2 — Changelog

> Registro detallado de todos los cambios realizados en la transición V1 → V2

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
