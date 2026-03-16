import { Router } from 'express';
import type { Request, Response } from 'express';
import { param } from '../utils/helpers.js';
import db from '../lib/db.js';
const router = Router();

/**
 * PUBLIC API — No authentication required.
 * Designed for n8n agents and external integrations.
 * These endpoints expose read-only data filtered by org slug.
 *
 * Base path: /api/public/:orgSlug/...
 */

// Middleware: resolve org by slug
router.use('/:orgSlug', async (req: Request, res: Response, next) => {
    try {
        const orgSlug = param(req, 'orgSlug');
        if (!orgSlug || orgSlug.length > 100) {
            res.status(400).json({ error: 'Invalid org slug' });
            return;
        }
        const org = await db.organization.findUnique({
            where: { slug: orgSlug },
            select: { id: true, name: true, slug: true },
        });
        if (!org) {
            res.status(404).json({ error: 'Organization not found' });
            return;
        }
        (req as any).org = org;
        next();
    } catch (err) {
        console.error('Public middleware error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/public/:orgSlug/catalog
// Full catalog: all active courses, programs, and webinars
router.get('/:orgSlug/catalog', async (req: Request, res: Response) => {
    try {
        const orgId = (req as any).org.id;

        const [courses, programs, webinars] = await Promise.all([
            db.course.findMany({
                where: { orgId, status: 'activo' },
                include: {
                    syllabusModules: { orderBy: { sortOrder: 'asc' } },
                    faqs: { orderBy: { sortOrder: 'asc' } },
                },
                orderBy: { title: 'asc' },
            }),
            db.program.findMany({
                where: { orgId, status: 'activo' },
                include: {
                    programCourses: { orderBy: { sortOrder: 'asc' } },
                    faqs: { orderBy: { sortOrder: 'asc' } },
                },
                orderBy: { title: 'asc' },
            }),
            db.webinar.findMany({
                where: { orgId, status: 'activo' },
                include: {
                    faqs: { orderBy: { sortOrder: 'asc' } },
                },
                orderBy: { title: 'asc' },
            }),
        ]);

        res.json({
            organization: (req as any).org.name,
            totalItems: courses.length + programs.length + webinars.length,
            courses,
            programs,
            webinars,
        });
    } catch (err) {
        console.error('Public catalog error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/public/:orgSlug/courses
router.get('/:orgSlug/courses', async (req: Request, res: Response) => {
    try {
        const orgId = (req as any).org.id;
        const { category, search } = req.query;

        const where: any = { orgId, status: 'activo' };
        if (category) where.category = category;
        if (search) {
            where.OR = [
                { title: { contains: search as string, mode: 'insensitive' } },
                { description: { contains: search as string, mode: 'insensitive' } },
                { category: { contains: search as string, mode: 'insensitive' } },
            ];
        }

        const courses = await db.course.findMany({
            where,
            include: {
                syllabusModules: { orderBy: { sortOrder: 'asc' } },
                faqs: { orderBy: { sortOrder: 'asc' } },
            },
            orderBy: { title: 'asc' },
        });

        res.json(courses);
    } catch (err) {
        console.error('Public courses error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/public/:orgSlug/courses/:code
// Find a course by its unique code (e.g. CRS-AI2024-001)
router.get('/:orgSlug/courses/:code', async (req: Request, res: Response) => {
    try {
        const orgId = (req as any).org.id;
        const code = param(req, 'code');

        const course = await db.course.findFirst({
            where: { orgId, code, status: 'activo' },
            include: {
                syllabusModules: { orderBy: { sortOrder: 'asc' } },
                attachments: true,
                faqs: { orderBy: { sortOrder: 'asc' } },
            },
        });

        if (!course) {
            res.status(404).json({ error: 'Course not found' });
            return;
        }

        res.json(course);
    } catch (err) {
        console.error('Public course detail error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/public/:orgSlug/programs
router.get('/:orgSlug/programs', async (req: Request, res: Response) => {
    try {
        const orgId = (req as any).org.id;
        const programs = await db.program.findMany({
            where: { orgId, status: 'activo' },
            include: {
                programCourses: { orderBy: { sortOrder: 'asc' } },
                faqs: { orderBy: { sortOrder: 'asc' } },
            },
            orderBy: { title: 'asc' },
        });
        res.json(programs);
    } catch (err) {
        console.error('Public programs error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/public/:orgSlug/webinars
router.get('/:orgSlug/webinars', async (req: Request, res: Response) => {
    try {
        const orgId = (req as any).org.id;
        const webinars = await db.webinar.findMany({
            where: { orgId, status: 'activo' },
            include: { faqs: { orderBy: { sortOrder: 'asc' } } },
            orderBy: { title: 'asc' },
        });
        res.json(webinars);
    } catch (err) {
        console.error('Public webinars error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/public/:orgSlug/agents
// Get active AI agent configs for the org (used by n8n to build agent prompts)
router.get('/:orgSlug/agents', async (req: Request, res: Response) => {
    try {
        const orgId = (req as any).org.id;
        const agents = await db.aiAgent.findMany({
            where: { orgId, isActive: true },
            include: {
                agentCourses: {
                    include: {
                        course: {
                            select: {
                                id: true, code: true, title: true, description: true,
                                price: true, currency: true, modality: true, duration: true,
                                objectives: true, targetAudience: true, benefits: true,
                                category: true, instructor: true,
                                callToAction: true, idealStudentProfile: true,
                                competitiveAdvantage: true, urgencyTriggers: true,
                                objectionHandlers: true, successStories: true,
                            },
                        },
                    },
                },
                funnel: {
                    include: {
                        stages: { orderBy: { sortOrder: 'asc' } },
                    },
                },
                team: {
                    include: {
                        members: {
                            where: { isAvailable: true },
                            select: { name: true, email: true, phone: true, whatsapp: true, role: true, specialties: true },
                        },
                    },
                },
            },
        });

        // Enrich agents with their extraction field details
        const allFieldIds = agents.flatMap((a: any) => a.extractionFieldIds || []);
        const uniqueFieldIds = [...new Set(allFieldIds)];
        const fields = uniqueFieldIds.length > 0
            ? await db.extractionField.findMany({ where: { id: { in: uniqueFieldIds } } })
            : [];

        const enrichedAgents = agents.map((agent: any) => ({
            ...agent,
            extractionFields: (agent.extractionFieldIds || [])
                .map((fid: string) => fields.find(f => f.id === fid))
                .filter(Boolean),
        }));

        res.json(enrichedAgents);
    } catch (err) {
        console.error('Public agents error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/public/:orgSlug/agents/:agentId
// Get a single agent with all context (for n8n to build system prompt)
router.get('/:orgSlug/agents/:agentId', async (req: Request, res: Response) => {
    try {
        const orgId = (req as any).org.id;
        const agentId = param(req, 'agentId');

        const agent = await db.aiAgent.findFirst({
            where: { id: agentId, orgId, isActive: true },
            include: {
                agentCourses: { include: { course: true } },
                funnel: { include: { stages: { orderBy: { sortOrder: 'asc' } } } },
                team: { include: { members: { where: { isAvailable: true } } } },
            },
        });

        if (!agent) {
            res.status(404).json({ error: 'Agent not found' });
            return;
        }

        // Fetch extraction fields
        const fieldIds = (agent as any).extractionFieldIds || [];
        const extractionFields = fieldIds.length > 0
            ? await db.extractionField.findMany({ where: { id: { in: fieldIds } } })
            : [];

        res.json({ ...agent, extractionFields });
    } catch (err) {
        console.error('Public agent detail error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/public/:orgSlug/funnels
// Get all funnels with stages (for n8n to determine conversation flow)
router.get('/:orgSlug/funnels', async (req: Request, res: Response) => {
    try {
        const orgId = (req as any).org.id;
        const funnels = await db.funnel.findMany({
            where: { orgId },
            include: {
                stages: { orderBy: { sortOrder: 'asc' } },
                fields: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(funnels);
    } catch (err) {
        console.error('Public funnels error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/public/:orgSlug/fields
// Get all extraction fields (for n8n to know what data to capture)
router.get('/:orgSlug/fields', async (req: Request, res: Response) => {
    try {
        const orgId = (req as any).org.id;
        const fields = await db.extractionField.findMany({
            where: { orgId },
            orderBy: { name: 'asc' },
        });
        res.json(fields);
    } catch (err) {
        console.error('Public fields error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/public/:orgSlug/org
// Get public org profile info (for agent context)
router.get('/:orgSlug/org', async (req: Request, res: Response) => {
    try {
        const org = await db.organization.findUnique({
            where: { id: (req as any).org.id },
            select: {
                name: true,
                slug: true,
                type: true,
                description: true,
                tagline: true,
                website: true,
                contactEmail: true,
                contactPhone: true,
                whatsapp: true,
                branding: true,
                socialMedia: true,
                locations: true,
                operatingHours: true,
                paymentMethods: true,
                courseCategories: true,
                certificates: true,
                modalities: true,
            },
        });
        res.json(org);
    } catch (err) {
        console.error('Public org error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/public/:orgSlug/teams
// Get teams and available members (for n8n lead routing)
router.get('/:orgSlug/teams', async (req: Request, res: Response) => {
    try {
        const orgId = (req as any).org.id;
        const teams = await db.team.findMany({
            where: { orgId },
            include: {
                members: {
                    where: { isAvailable: true },
                    select: {
                        id: true, name: true, email: true, phone: true, whatsapp: true,
                        role: true, availability: true, specialties: true, maxLeads: true,
                        vacationStart: true, vacationEnd: true,
                    },
                },
                productAssignments: true,
            },
            orderBy: { name: 'asc' },
        });
        res.json(teams);
    } catch (err) {
        console.error('Public teams error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
