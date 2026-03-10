# Integración de Base de Datos PostgreSQL

Esta aplicación ha sido migrada de SQLite a una instancia local de **PostgreSQL** para garantizar la escalabilidad, el soporte multi-tenant y la integridad de los datos en un entorno robusto.

## Detalles Técnicos

### Conexión Local

- **Motor**: PostgreSQL 14+
- **Host**: `localhost`
- **Puerto**: `5432`
- **Base de Datos**: `lia_dashboard`
- **Esquema**: `public`
- **Usuario**: `macbookair` (Administrador del sistema)

### Configuración de Prisma

El archivo `prisma/schema.prisma` ha sido actualizado para usar el proveedor `postgresql`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Variables de Entorno

La URL de conexión se gestiona en `server/.env`:

```env
DATABASE_URL="postgresql://macbookair@localhost:5432/lia_dashboard?schema=public"
```

## Beneficios de la Migración

1. **Robustez**: Mayor concurrencia y mejor manejo de tipos de datos complejos (JSONB para branding y detalles de cursos).
2. **Escalabilidad**: Preparado para entornos de producción (AWS RDS, Google Cloud SQL, Railway).
3. **Migraciones**: Uso de Prisma Migrate para gestionar cambios en el esquema de forma segura y versionada.
4. **Relaciones**: Integridad referencial nativa superior a SQLite.

## Procedimiento de Actualización

Para aplicar cambios en el esquema:

1. Modificar `prisma/schema.prisma`.
2. Ejecutar `npx prisma db push` o `npx prisma migrate dev`.
3. Regenerar el cliente con `npx prisma generate`.

---
*Documento creado por Antigravity para el equipo de LIA Educación.*
