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

        // === V3: TeamCourseAssignment → TeamProductAssignment ===
        // Drop old team_course_assignments table (replaced by team_product_assignments)
        `DROP TABLE IF EXISTS "team_course_assignments" CASCADE`,

        // Remove old subscription parent columns
        `ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "parent_id"`,
        `ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "parent_type"`,

        // Remove duplicate team_members unique constraint on user_id if it exists
        `ALTER TABLE "team_members" DROP CONSTRAINT IF EXISTS "team_members_user_id_key"`,

        // Create team_product_assignments table stub so prisma db push can introspect it
        `CREATE TABLE IF NOT EXISTS "team_product_assignments" (
            "id" TEXT NOT NULL,
            "team_id" TEXT NOT NULL,
            "entity_type" TEXT NOT NULL,
            "entity_id" TEXT NOT NULL,
            CONSTRAINT "team_product_assignments_pkey" PRIMARY KEY ("id")
        )`,
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
