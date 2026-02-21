import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { generateCode } from '../utils/codeGenerator.js';
import { param } from '../utils/helpers.js';

const prisma = new PrismaClient();
const router = Router();
router.use(authenticate);

// GET /api/programs
router.get('/', async (req: Request, res: Response) => {
    try {
        const { status, page = '1', limit = '50' } = req.query;
        const orgId = req.user!.orgId;
        const where: any = { orgId };
        if (status) where.status = status;

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const [programs, total] = await Promise.all([
            prisma.program.findMany({
                where,
                include: {
                    programCourses: { orderBy: { sortOrder: 'asc' } },
                    attachments: true,
                    faqs: { orderBy: { sortOrder: 'asc' } },
                },
                orderBy: { updatedAt: 'desc' },
                skip,
                take: parseInt(limit as string),
            }),
            prisma.program.count({ where }),
        ]);

        res.json({ data: programs, total, page: parseInt(page as string) });
    } catch (err) {
        console.error('List programs error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/programs/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const program = await prisma.program.findFirst({
            where: { id: param(req, 'id'), orgId: req.user!.orgId },
            include: {
                programCourses: { orderBy: { sortOrder: 'asc' } },
                attachments: true,
                faqs: { orderBy: { sortOrder: 'asc' } },
                team: true,
            },
        });
        if (!program) { res.status(404).json({ error: 'Program not found' }); return; }
        res.json(program);
    } catch (err) {
        console.error('Get program error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/programs
router.post('/', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const { courses: programCourses, attachments, faqs, ...data } = req.body;
        const count = await prisma.program.count({ where: { orgId } });
        const code = generateCode('PRG', data.category || '', count);

        const program = await prisma.program.create({
            data: {
                ...data,
                orgId,
                code,
                price: data.price || 0,
                totalHours: data.totalHours || 0,
                objectives: data.objectives || [],
                requirements: data.requirements || [],
                benefits: data.benefits || [],
                painPoints: data.painPoints || [],
                socialProof: data.socialProof || [],
                bonuses: data.bonuses || [],
                tags: data.tags || [],
                tools: data.tools || [],
                programCourses: programCourses?.length ? {
                    create: programCourses.map((c: any, i: number) => ({
                        sortOrder: c.order || i,
                        title: c.title,
                        description: c.description,
                        hours: c.hours || 0,
                        instructor: c.instructor,
                        topics: c.topics || [],
                    })),
                } : undefined,
                attachments: attachments?.length ? {
                    create: attachments.map((att: any) => ({
                        entityType: 'program' as const,
                        name: att.name, url: att.url,
                        fileType: att.type || 'pdf', fileSize: att.size,
                    })),
                } : undefined,
                faqs: faqs?.length ? {
                    create: faqs.map((f: any, i: number) => ({
                        entityType: 'program' as const,
                        question: f.question, answer: f.answer, sortOrder: i,
                    })),
                } : undefined,
            },
            include: { programCourses: true, attachments: true, faqs: true },
        });
        res.status(201).json(program);
    } catch (err) {
        console.error('Create program error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/programs/:id
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const id = param(req, 'id');
        const { courses: programCourses, attachments, faqs, ...data } = req.body;

        const existing = await prisma.program.findFirst({ where: { id, orgId } });
        if (!existing) { res.status(404).json({ error: 'Program not found' }); return; }

        const program = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            if (programCourses) {
                await tx.programCourse.deleteMany({ where: { programId: id } });
                await tx.programCourse.createMany({
                    data: programCourses.map((c: any, i: number) => ({
                        programId: id, sortOrder: c.order || i,
                        title: c.title, description: c.description,
                        hours: c.hours || 0, instructor: c.instructor, topics: c.topics || [],
                    })),
                });
            }
            if (attachments) {
                await tx.attachment.deleteMany({ where: { programId: id } });
                await tx.attachment.createMany({
                    data: attachments.map((a: any) => ({
                        programId: id, entityType: 'program' as const,
                        name: a.name, url: a.url, fileType: a.type || 'pdf', fileSize: a.size,
                    })),
                });
            }
            if (faqs) {
                await tx.faq.deleteMany({ where: { programId: id } });
                await tx.faq.createMany({
                    data: faqs.map((f: any, i: number) => ({
                        programId: id, entityType: 'program' as const,
                        question: f.question, answer: f.answer, sortOrder: i,
                    })),
                });
            }
            return tx.program.update({
                where: { id }, data,
                include: { programCourses: { orderBy: { sortOrder: 'asc' } }, attachments: true, faqs: true },
            });
        });
        res.json(program);
    } catch (err) {
        console.error('Update program error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/programs/:id
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const existing = await prisma.program.findFirst({ where: { id: param(req, 'id'), orgId: req.user!.orgId } });
        if (!existing) { res.status(404).json({ error: 'Program not found' }); return; }
        await prisma.program.delete({ where: { id: param(req, 'id') } });
        res.json({ message: 'Program deleted' });
    } catch (err) {
        console.error('Delete program error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
