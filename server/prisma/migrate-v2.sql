-- Migration: Remove Software model, add Taller + Asesoria
-- This script cleans up data that would prevent prisma db push from succeeding

-- Delete data referencing the 'software' entity type
DELETE FROM "attachments" WHERE "entity_type" = 'software';
DELETE FROM "faqs" WHERE "entity_type" = 'software';
DELETE FROM "generated_content" WHERE "source_type" = 'software';

-- Drop the software table if it exists
DROP TABLE IF EXISTS "software" CASCADE;

-- Remove software_id columns from polymorphic tables
ALTER TABLE "attachments" DROP COLUMN IF EXISTS "software_id";
ALTER TABLE "faqs" DROP COLUMN IF EXISTS "software_id";
ALTER TABLE "generated_content" DROP COLUMN IF EXISTS "software_id";

-- Drop old WebinarType enum and type column from webinars
ALTER TABLE "webinars" DROP COLUMN IF EXISTS "type";
DROP TYPE IF EXISTS "WebinarType";

-- Remove old Contact interest field
ALTER TABLE "contacts" DROP COLUMN IF EXISTS "software_interest";

-- Drop indexes that reference software_id
DROP INDEX IF EXISTS "attachments_software_id_idx";
DROP INDEX IF EXISTS "faqs_software_id_idx";
