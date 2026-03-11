/**
 * Pre-migration script: cleans up old Software model data and WebinarType enum
 * so that prisma db push can apply the new schema without conflicts.
 * Safe to run multiple times (idempotent).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Running pre-migration cleanup...');

    const queries = [
        // Delete data referencing removed 'software' entity type
        `DELETE FROM "attachments" WHERE "entity_type" = 'software'`,
        `DELETE FROM "faqs" WHERE "entity_type" = 'software'`,
        `DELETE FROM "generated_content" WHERE "source_type" = 'software'`,

        // Drop the software table
        `DROP TABLE IF EXISTS "software" CASCADE`,

        // Remove software_id columns from polymorphic tables
        `ALTER TABLE "attachments" DROP COLUMN IF EXISTS "software_id"`,
        `ALTER TABLE "faqs" DROP COLUMN IF EXISTS "software_id"`,
        `ALTER TABLE "generated_content" DROP COLUMN IF EXISTS "software_id"`,

        // Drop old WebinarType enum and type column from webinars
        `ALTER TABLE "webinars" DROP COLUMN IF EXISTS "type"`,
        `DROP TYPE IF EXISTS "WebinarType"`,

        // Remove old Contact interest field
        `ALTER TABLE "contacts" DROP COLUMN IF EXISTS "software_interest"`,
    ];

    for (const sql of queries) {
        try {
            await prisma.$executeRawUnsafe(sql);
            console.log(`  ✅ ${sql.substring(0, 60)}...`);
        } catch (err: any) {
            // Ignore errors (table/column might not exist)
            console.log(`  ⏭️  Skipped: ${sql.substring(0, 60)}... (${err.message?.substring(0, 50)})`);
        }
    }

    console.log('✅ Pre-migration cleanup complete.\n');
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error('Pre-migration error:', e);
        prisma.$disconnect();
        // Don't exit with error — let prisma db push handle remaining issues
    });
