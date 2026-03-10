-- CreateEnum
CREATE TYPE "OrgType" AS ENUM ('universidad', 'instituto', 'infoproductor');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('admin', 'editor', 'viewer');

-- CreateEnum
CREATE TYPE "WebinarType" AS ENUM ('webinar', 'taller', 'masterclass', 'charla');

-- CreateEnum
CREATE TYPE "AgentPersonality" AS ENUM ('professional', 'friendly', 'empathetic', 'strict', 'enthusiastic');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('course', 'program', 'webinar', 'software', 'subscription', 'application');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('pdf', 'video', 'image', 'link');

-- CreateEnum
CREATE TYPE "AiProvider" AS ENUM ('gemini', 'openai');

-- CreateEnum
CREATE TYPE "Modality" AS ENUM ('online', 'presencial', 'hibrido');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('borrador', 'activo', 'archivado');

-- CreateEnum
CREATE TYPE "ContactStage" AS ENUM ('nuevo', 'contactado', 'interesado', 'propuesta', 'negociacion', 'ganado', 'perdido', 'inactivo');

-- CreateEnum
CREATE TYPE "ContactOrigin" AS ENUM ('organico', 'meta_ads', 'google_ads', 'tiktok_ads', 'referido', 'webinar', 'evento', 'linkedin', 'whatsapp', 'email', 'otro');

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OrgType" NOT NULL DEFAULT 'infoproductor',
    "description" TEXT NOT NULL DEFAULT '',
    "tagline" TEXT,
    "website" TEXT,
    "contact_email" TEXT,
    "address" TEXT,
    "accreditations" TEXT,
    "specialty" TEXT,
    "certifications" TEXT,
    "personal_brand" TEXT,
    "niche" TEXT,
    "target_audience" TEXT,
    "location" TEXT,
    "history" TEXT,
    "branding" JSONB NOT NULL DEFAULT '{}',
    "social_media" JSONB,
    "operating_hours" JSONB,
    "course_categories" TEXT[],
    "onboarding_complete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'editor',
    "phone" TEXT,
    "avatar_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "objectives" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "target_audience" TEXT NOT NULL DEFAULT '',
    "modality" "Modality" NOT NULL DEFAULT 'online',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "duration" TEXT NOT NULL DEFAULT '',
    "total_hours" INTEGER,
    "schedule" TEXT,
    "instructor" TEXT NOT NULL DEFAULT '',
    "instructor_bio" TEXT,
    "price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "early_bird_price" DECIMAL(65,30),
    "early_bird_deadline" TIMESTAMP(3),
    "promotions" TEXT,
    "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contact_info" JSONB,
    "benefits" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pain_points" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "guarantee" TEXT,
    "social_proof" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bonuses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "max_students" INTEGER,
    "prerequisites" TEXT,
    "certification" TEXT,
    "location" TEXT DEFAULT 'Virtual',
    "category" TEXT NOT NULL DEFAULT '',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tools" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ItemStatus" NOT NULL DEFAULT 'borrador',
    "ai_summary" TEXT,
    "team_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "syllabus_modules" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "week" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hours" INTEGER NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "syllabus_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "objectives" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "target_audience" TEXT NOT NULL DEFAULT '',
    "modality" "Modality" NOT NULL DEFAULT 'online',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "total_duration" TEXT NOT NULL DEFAULT '',
    "total_hours" INTEGER NOT NULL DEFAULT 0,
    "coordinator" TEXT,
    "schedule" TEXT,
    "price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "early_bird_price" DECIMAL(65,30),
    "promotions" TEXT,
    "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contact_info" JSONB,
    "benefits" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pain_points" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "guarantee" TEXT,
    "social_proof" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bonuses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "max_students" INTEGER,
    "prerequisites" TEXT,
    "certification" TEXT NOT NULL DEFAULT '',
    "certifying_entity" TEXT,
    "location" TEXT DEFAULT 'Virtual',
    "category" TEXT NOT NULL DEFAULT '',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tools" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ItemStatus" NOT NULL DEFAULT 'borrador',
    "ai_summary" TEXT,
    "team_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "program_courses" (
    "id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "hours" INTEGER NOT NULL DEFAULT 0,
    "instructor" TEXT,
    "topics" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "program_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webinars" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "type" "WebinarType" NOT NULL DEFAULT 'webinar',
    "speaker" TEXT NOT NULL DEFAULT '',
    "speaker_bio" TEXT,
    "speaker_title" TEXT,
    "event_date" TIMESTAMP(3),
    "event_time" TEXT,
    "duration" TEXT NOT NULL DEFAULT '',
    "modality" "Modality" NOT NULL DEFAULT 'online',
    "platform" TEXT,
    "price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "max_attendees" INTEGER,
    "topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "key_topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "target_audience" TEXT NOT NULL DEFAULT '',
    "call_to_action" TEXT,
    "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contact_info" JSONB,
    "benefits" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pain_points" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "guarantee" TEXT,
    "social_proof" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bonuses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "registration_link" TEXT,
    "promotions" TEXT,
    "location" TEXT DEFAULT 'Virtual',
    "category" TEXT NOT NULL DEFAULT '',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tools" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "ItemStatus" NOT NULL DEFAULT 'borrador',
    "ai_summary" TEXT,
    "team_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webinars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "software" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "version" TEXT,
    "platform" TEXT,
    "download_url" TEXT,
    "price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "ItemStatus" NOT NULL DEFAULT 'borrador',
    "category" TEXT NOT NULL DEFAULT '',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "software_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "benefits" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "period" TEXT NOT NULL DEFAULT 'mensual',
    "status" "ItemStatus" NOT NULL DEFAULT 'borrador',
    "category" TEXT NOT NULL DEFAULT '',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "requirements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "deadline" TIMESTAMP(3),
    "status" "ItemStatus" NOT NULL DEFAULT 'borrador',
    "category" TEXT NOT NULL DEFAULT '',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT,
    "availability" TEXT,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_course_assignments" (
    "id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,

    CONSTRAINT "team_course_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_agents" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT '',
    "personality" "AgentPersonality" NOT NULL DEFAULT 'professional',
    "tone" TEXT NOT NULL DEFAULT '',
    "language" TEXT NOT NULL DEFAULT 'es',
    "expertise" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "system_prompt" TEXT,
    "avatar" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "team_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_courses" (
    "id" TEXT NOT NULL,
    "agent_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,

    CONSTRAINT "agent_courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "entity_type" "EntityType" NOT NULL,
    "course_id" TEXT,
    "program_id" TEXT,
    "webinar_id" TEXT,
    "software_id" TEXT,
    "subscription_id" TEXT,
    "application_id" TEXT,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "file_type" "FileType" NOT NULL DEFAULT 'pdf',
    "file_size" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faqs" (
    "id" TEXT NOT NULL,
    "entity_type" "EntityType" NOT NULL,
    "course_id" TEXT,
    "program_id" TEXT,
    "webinar_id" TEXT,
    "software_id" TEXT,
    "subscription_id" TEXT,
    "application_id" TEXT,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "provider" "AiProvider" NOT NULL,
    "encrypted_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_content" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "source_type" "EntityType" NOT NULL,
    "course_id" TEXT,
    "program_id" TEXT,
    "webinar_id" TEXT,
    "software_id" TEXT,
    "subscription_id" TEXT,
    "application_id" TEXT,
    "tool_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_content_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "ghl_contact_id" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "phone_country" TEXT,
    "stage" "ContactStage" NOT NULL DEFAULT 'nuevo',
    "origin" "ContactOrigin" NOT NULL DEFAULT 'organico',
    "custom_origin" TEXT,
    "course_interest" TEXT,
    "program_interest" TEXT,
    "webinar_interest" TEXT,
    "software_interest" TEXT,
    "subscription_interest" TEXT,
    "application_interest" TEXT,
    "budget" DECIMAL(65,30) DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "city" TEXT,
    "country" TEXT,
    "timezone" TEXT,
    "utm_source" TEXT,
    "utm_medium" TEXT,
    "utm_campaign" TEXT,
    "ad_platform" TEXT,
    "landing_page" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_contacted_at" TIMESTAMP(3),
    "next_follow_up_at" TIMESTAMP(3),
    "notes" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ghl_last_sync_at" TIMESTAMP(3),
    "ghl_data" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_funnels" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_funnels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_funnel_stages" (
    "id" TEXT NOT NULL,
    "funnel_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT,
    "description" TEXT,
    "rules" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT,

    CONSTRAINT "crm_funnel_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crm_extraction_fields" (
    "id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "funnel_id" TEXT,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "dataType" TEXT NOT NULL DEFAULT 'string',
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "crm_extraction_fields_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_org_id_idx" ON "users"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "courses_code_key" ON "courses"("code");

-- CreateIndex
CREATE INDEX "courses_org_id_idx" ON "courses"("org_id");

-- CreateIndex
CREATE INDEX "courses_org_id_status_idx" ON "courses"("org_id", "status");

-- CreateIndex
CREATE INDEX "courses_code_idx" ON "courses"("code");

-- CreateIndex
CREATE INDEX "syllabus_modules_course_id_idx" ON "syllabus_modules"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "programs_code_key" ON "programs"("code");

-- CreateIndex
CREATE INDEX "programs_org_id_idx" ON "programs"("org_id");

-- CreateIndex
CREATE INDEX "programs_org_id_status_idx" ON "programs"("org_id", "status");

-- CreateIndex
CREATE INDEX "program_courses_program_id_idx" ON "program_courses"("program_id");

-- CreateIndex
CREATE UNIQUE INDEX "webinars_code_key" ON "webinars"("code");

-- CreateIndex
CREATE INDEX "webinars_org_id_idx" ON "webinars"("org_id");

-- CreateIndex
CREATE INDEX "webinars_org_id_status_idx" ON "webinars"("org_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "software_code_key" ON "software"("code");

-- CreateIndex
CREATE INDEX "software_org_id_idx" ON "software"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_code_key" ON "subscriptions"("code");

-- CreateIndex
CREATE INDEX "subscriptions_org_id_idx" ON "subscriptions"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "applications_code_key" ON "applications"("code");

-- CreateIndex
CREATE INDEX "applications_org_id_idx" ON "applications"("org_id");

-- CreateIndex
CREATE INDEX "teams_org_id_idx" ON "teams"("org_id");

-- CreateIndex
CREATE INDEX "team_members_team_id_idx" ON "team_members"("team_id");

-- CreateIndex
CREATE UNIQUE INDEX "team_course_assignments_team_id_course_id_key" ON "team_course_assignments"("team_id", "course_id");

-- CreateIndex
CREATE INDEX "ai_agents_org_id_idx" ON "ai_agents"("org_id");

-- CreateIndex
CREATE UNIQUE INDEX "agent_courses_agent_id_course_id_key" ON "agent_courses"("agent_id", "course_id");

-- CreateIndex
CREATE INDEX "attachments_course_id_idx" ON "attachments"("course_id");

-- CreateIndex
CREATE INDEX "attachments_program_id_idx" ON "attachments"("program_id");

-- CreateIndex
CREATE INDEX "attachments_webinar_id_idx" ON "attachments"("webinar_id");

-- CreateIndex
CREATE INDEX "attachments_software_id_idx" ON "attachments"("software_id");

-- CreateIndex
CREATE INDEX "attachments_subscription_id_idx" ON "attachments"("subscription_id");

-- CreateIndex
CREATE INDEX "attachments_application_id_idx" ON "attachments"("application_id");

-- CreateIndex
CREATE INDEX "faqs_course_id_idx" ON "faqs"("course_id");

-- CreateIndex
CREATE INDEX "faqs_program_id_idx" ON "faqs"("program_id");

-- CreateIndex
CREATE INDEX "faqs_webinar_id_idx" ON "faqs"("webinar_id");

-- CreateIndex
CREATE INDEX "faqs_software_id_idx" ON "faqs"("software_id");

-- CreateIndex
CREATE INDEX "faqs_subscription_id_idx" ON "faqs"("subscription_id");

-- CreateIndex
CREATE INDEX "faqs_application_id_idx" ON "faqs"("application_id");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_org_id_provider_key" ON "api_keys"("org_id", "provider");

-- CreateIndex
CREATE INDEX "generated_content_org_id_idx" ON "generated_content"("org_id");

-- CreateIndex
CREATE INDEX "generated_content_course_id_idx" ON "generated_content"("course_id");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_ghl_contact_id_key" ON "contacts"("ghl_contact_id");

-- CreateIndex
CREATE INDEX "contacts_org_id_idx" ON "contacts"("org_id");

-- CreateIndex
CREATE INDEX "contacts_org_id_stage_idx" ON "contacts"("org_id", "stage");

-- CreateIndex
CREATE INDEX "contacts_ghl_contact_id_idx" ON "contacts"("ghl_contact_id");

-- CreateIndex
CREATE INDEX "contacts_phone_idx" ON "contacts"("phone");

-- CreateIndex
CREATE INDEX "crm_funnels_org_id_idx" ON "crm_funnels"("org_id");

-- CreateIndex
CREATE INDEX "crm_funnel_stages_funnel_id_idx" ON "crm_funnel_stages"("funnel_id");

-- CreateIndex
CREATE INDEX "crm_extraction_fields_org_id_idx" ON "crm_extraction_fields"("org_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "syllabus_modules" ADD CONSTRAINT "syllabus_modules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programs" ADD CONSTRAINT "programs_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "program_courses" ADD CONSTRAINT "program_courses_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webinars" ADD CONSTRAINT "webinars_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webinars" ADD CONSTRAINT "webinars_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "software" ADD CONSTRAINT "software_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teams" ADD CONSTRAINT "teams_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_course_assignments" ADD CONSTRAINT "team_course_assignments_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_course_assignments" ADD CONSTRAINT "team_course_assignments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_agents" ADD CONSTRAINT "ai_agents_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_agents" ADD CONSTRAINT "ai_agents_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_courses" ADD CONSTRAINT "agent_courses_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "ai_agents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_courses" ADD CONSTRAINT "agent_courses_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_webinar_id_fkey" FOREIGN KEY ("webinar_id") REFERENCES "webinars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_software_id_fkey" FOREIGN KEY ("software_id") REFERENCES "software"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_webinar_id_fkey" FOREIGN KEY ("webinar_id") REFERENCES "webinars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_software_id_fkey" FOREIGN KEY ("software_id") REFERENCES "software"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_content" ADD CONSTRAINT "generated_content_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_content" ADD CONSTRAINT "generated_content_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_content" ADD CONSTRAINT "generated_content_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_content" ADD CONSTRAINT "generated_content_webinar_id_fkey" FOREIGN KEY ("webinar_id") REFERENCES "webinars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_content" ADD CONSTRAINT "generated_content_software_id_fkey" FOREIGN KEY ("software_id") REFERENCES "software"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_content" ADD CONSTRAINT "generated_content_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_content" ADD CONSTRAINT "generated_content_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_funnels" ADD CONSTRAINT "crm_funnels_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_funnel_stages" ADD CONSTRAINT "crm_funnel_stages_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "crm_funnels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_extraction_fields" ADD CONSTRAINT "crm_extraction_fields_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crm_extraction_fields" ADD CONSTRAINT "crm_extraction_fields_funnel_id_fkey" FOREIGN KEY ("funnel_id") REFERENCES "crm_funnels"("id") ON DELETE SET NULL ON UPDATE CASCADE;
