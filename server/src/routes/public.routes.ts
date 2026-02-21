import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { param } from '../utils/helpers.js';

const prisma = new PrismaClient();
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
    const orgSlug = param(req, 'orgSlug');
    const org = await prisma.organization.findUnique({
        where: { slug: orgSlug },
        select: { id: true, name: true, slug: true },
    });

    if (!org) {
        res.status(404).json({ error: 'Organization not found' });
        return;
    }

    // Attach org to request for downstream routes
    (req as any).org = org;
    next();
});

// GET /api/public/:orgSlug/catalog
// Full catalog: all active courses, programs, and webinars
router.get('/:orgSlug/catalog', async (req: Request, res: Response) => {
    try {
        const orgId = (req as any).org.id;

        const [courses, programs, webinars] = await Promise.all([
            prisma.course.findMany({
                where: { orgId, status: 'activo' },
                include: {
                    syllabusModules: { orderBy: { sortOrder: 'asc' } },
                    faqs: { orderBy: { sortOrder: 'asc' } },
                },
                orderBy: { title: 'asc' },
            }),
            prisma.program.findMany({
                where: { orgId, status: 'activo' },
                include: {
                    programCourses: { orderBy: { sortOrder: 'asc' } },
                    faqs: { orderBy: { sortOrder: 'asc' } },
                },
                orderBy: { title: 'asc' },
            }),
            prisma.webinar.findMany({
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

        const courses = await prisma.course.findMany({
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

        const course = await prisma.course.findFirst({
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
        const programs = await prisma.program.findMany({
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
        const webinars = await prisma.webinar.findMany({
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
        const agents = await prisma.aiAgent.findMany({
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
                            },
                        },
                    },
                },
            },
        });
        res.json(agents);
    } catch (err) {
        console.error('Public agents error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/public/:orgSlug/org
// Get public org profile info (for agent context)
router.get('/:orgSlug/org', async (req: Request, res: Response) => {
    try {
        const org = await prisma.organization.findUnique({
            where: { id: (req as any).org.id },
            select: {
                name: true,
                slug: true,
                type: true,
                description: true,
                tagline: true,
                website: true,
                contactEmail: true,
                branding: true,
                socialMedia: true,
                courseCategories: true,
            },
        });
        res.json(org);
    } catch (err) {
        console.error('Public org error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
