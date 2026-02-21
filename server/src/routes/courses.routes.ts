import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { generateCode } from '../utils/codeGenerator.js';
import { param } from '../utils/helpers.js';

const prisma = new PrismaClient();
const router = Router();


// All routes require authentication
router.use(authenticate);

// GET /api/courses - List all courses for the org
router.get('/', async (req: Request, res: Response) => {
    try {
        const { status, category, search, page = '1', limit = '50' } = req.query;
        const orgId = req.user!.orgId;

        const where: any = { orgId };
        if (status) where.status = status;
        if (category) where.category = category;
        if (search) {
            where.OR = [
                { title: { contains: search as string, mode: 'insensitive' } },
                { code: { contains: search as string, mode: 'insensitive' } },
                { description: { contains: search as string, mode: 'insensitive' } },
            ];
        }

        const courses = await prisma.course.findMany({
            where,
            include: {
                syllabusModules: { orderBy: { sortOrder: 'asc' } },
                attachments: true,
                faqs: { orderBy: { sortOrder: 'asc' } },
            },
            orderBy: { updatedAt: 'desc' },
        });

        res.json(courses);
    } catch (err) {
        console.error('List courses error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/courses/:id - Get single course
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const course = await prisma.course.findFirst({
            where: { id: param(req, 'id'), orgId: req.user!.orgId },
            include: {
                syllabusModules: { orderBy: { sortOrder: 'asc' } },
                attachments: true,
                faqs: { orderBy: { sortOrder: 'asc' } },
                team: true,
            },
        });

        if (!course) {
            res.status(404).json({ error: 'Course not found' });
            return;
        }

        res.json(course);
    } catch (err) {
        console.error('Get course error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/courses - Create a new course
router.post('/', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const data = req.body;

        // Generate unique code
        const count = await prisma.course.count({ where: { orgId } });
        const code = generateCode('CRS', data.category || '', count);

        // Extract nested data
        const { syllabus, attachments, faqs, ...courseData } = data;

        const course = await prisma.course.create({
            data: {
                ...courseData,
                orgId,
                code,
                price: data.price || 0,
                objectives: data.objectives || [],
                requirements: data.requirements || [],
                benefits: data.benefits || [],
                painPoints: data.painPoints || [],
                socialProof: data.socialProof || [],
                bonuses: data.bonuses || [],
                tags: data.tags || [],
                tools: data.tools || [],
                // Create nested syllabus modules
                syllabusModules: syllabus?.length ? {
                    create: syllabus.map((mod: any, i: number) => ({
                        week: mod.week,
                        title: mod.title,
                        description: mod.description || '',
                        topics: mod.topics || [],
                        hours: mod.hours || 0,
                        sortOrder: i,
                    })),
                } : undefined,
                // Create nested attachments
                attachments: attachments?.length ? {
                    create: attachments.map((att: any) => ({
                        entityType: 'course' as const,
                        name: att.name,
                        url: att.url,
                        fileType: att.type || 'pdf',
                        fileSize: att.size,
                    })),
                } : undefined,
                // Create nested FAQs
                faqs: faqs?.length ? {
                    create: faqs.map((faq: any, i: number) => ({
                        entityType: 'course' as const,
                        question: faq.question,
                        answer: faq.answer,
                        sortOrder: i,
                    })),
                } : undefined,
            },
            include: {
                syllabusModules: true,
                attachments: true,
                faqs: true,
            },
        });

        res.status(201).json(course);
    } catch (err) {
        console.error('Create course error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/courses/:id - Update a course
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const id = param(req, 'id');
        const { syllabus, attachments, faqs, ...data } = req.body;

        // Verify ownership
        const existing = await prisma.course.findFirst({ where: { id, orgId } });
        if (!existing) {
            res.status(404).json({ error: 'Course not found' });
            return;
        }

        // Update with transaction for nested data
        const course = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Update nested data if provided
            if (syllabus) {
                await tx.syllabusModule.deleteMany({ where: { courseId: id } });
                await tx.syllabusModule.createMany({
                    data: syllabus.map((mod: any, i: number) => ({
                        courseId: id,
                        week: mod.week,
                        title: mod.title,
                        description: mod.description || '',
                        topics: mod.topics || [],
                        hours: mod.hours || 0,
                        sortOrder: i,
                    })),
                });
            }

            if (attachments) {
                await tx.attachment.deleteMany({ where: { courseId: id } });
                await tx.attachment.createMany({
                    data: attachments.map((att: any) => ({
                        courseId: id,
                        entityType: 'course' as const,
                        name: att.name,
                        url: att.url,
                        fileType: att.type || 'pdf',
                        fileSize: att.size,
                    })),
                });
            }

            if (faqs) {
                await tx.faq.deleteMany({ where: { courseId: id } });
                await tx.faq.createMany({
                    data: faqs.map((faq: any, i: number) => ({
                        courseId: id,
                        entityType: 'course' as const,
                        question: faq.question,
                        answer: faq.answer,
                        sortOrder: i,
                    })),
                });
            }

            return tx.course.update({
                where: { id },
                data,
                include: {
                    syllabusModules: { orderBy: { sortOrder: 'asc' } },
                    attachments: true,
                    faqs: { orderBy: { sortOrder: 'asc' } },
                },
            });
        });

        res.json(course);
    } catch (err) {
        console.error('Update course error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/courses/:id
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const id = param(req, 'id');

        const existing = await prisma.course.findFirst({ where: { id, orgId } });
        if (!existing) {
            res.status(404).json({ error: 'Course not found' });
            return;
        }

        await prisma.course.delete({ where: { id } });
        res.json({ message: 'Course deleted' });
    } catch (err) {
        console.error('Delete course error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
