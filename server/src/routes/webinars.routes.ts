import { Router } from 'express';
import type { Request, Response } from 'express';
import type { Prisma } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { generateCode } from '../utils/codeGenerator.js';
import { param } from '../utils/helpers.js';
import db from '../lib/db.js';
const router = Router();
router.use(authenticate);

// GET /api/webinars
router.get('/', async (req: Request, res: Response) => {
    try {
        const { status, page = '1', limit = '50' } = req.query;
        const orgId = req.user!.orgId;
        const where: any = { orgId };
        if (status) where.status = status;

        const webinars = await db.webinar.findMany({
            where,
            include: { attachments: true, faqs: { orderBy: { sortOrder: 'asc' } } },
            orderBy: { updatedAt: 'desc' },
        });
        res.json(webinars);
    } catch (err) {
        console.error('List webinars error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/webinars/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const webinar = await db.webinar.findFirst({
            where: { id: param(req, 'id'), orgId: req.user!.orgId },
            include: { attachments: true, faqs: { orderBy: { sortOrder: 'asc' } }, team: true },
        });
        if (!webinar) { res.status(404).json({ error: 'Webinar not found' }); return; }
        res.json(webinar);
    } catch (err) {
        console.error('Get webinar error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/webinars
router.post('/', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const { attachments, faqs, ...data } = req.body;
        const count = await db.webinar.count({ where: { orgId } });
        const code = generateCode('WBN', data.category || '', count);

        const webinar = await db.webinar.create({
            data: {
                ...data, orgId, code,
                price: data.price || 0,
                topics: data.topics || [],
                keyTopics: data.keyTopics || [],
                requirements: data.requirements || [],
                benefits: data.benefits || [],
                painPoints: data.painPoints || [],
                socialProof: data.socialProof || [],
                bonuses: data.bonuses || [],
                tags: data.tags || [],
                tools: data.tools || [],
                attachments: attachments?.length ? {
                    create: attachments.map((a: any) => ({
                        entityType: 'webinar' as const,
                        name: a.name, url: a.url,
                        fileType: a.type || 'pdf', fileSize: a.size,
                    })),
                } : undefined,
                faqs: faqs?.length ? {
                    create: faqs.map((f: any, i: number) => ({
                        entityType: 'webinar' as const,
                        question: f.question, answer: f.answer, sortOrder: i,
                    })),
                } : undefined,
            },
            include: { attachments: true, faqs: true },
        });
        res.status(201).json(webinar);
    } catch (err) {
        console.error('Create webinar error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/webinars/:id
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const id = param(req, 'id');
        const { attachments, faqs, ...data } = req.body;

        const existing = await db.webinar.findFirst({ where: { id, orgId } });
        if (!existing) { res.status(404).json({ error: 'Webinar not found' }); return; }

        const webinar = await db.$transaction(async (tx: Prisma.TransactionClient) => {
            if (attachments) {
                await tx.attachment.deleteMany({ where: { webinarId: id } });
                await tx.attachment.createMany({
                    data: attachments.map((a: any) => ({
                        webinarId: id, entityType: 'webinar' as const,
                        name: a.name, url: a.url, fileType: a.type || 'pdf', fileSize: a.size,
                    })),
                });
            }
            if (faqs) {
                await tx.faq.deleteMany({ where: { webinarId: id } });
                await tx.faq.createMany({
                    data: faqs.map((f: any, i: number) => ({
                        webinarId: id, entityType: 'webinar' as const,
                        question: f.question, answer: f.answer, sortOrder: i,
                    })),
                });
            }
            return tx.webinar.update({
                where: { id }, data,
                include: { attachments: true, faqs: true },
            });
        });
        res.json(webinar);
    } catch (err) {
        console.error('Update webinar error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/webinars/:id
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const existing = await db.webinar.findFirst({ where: { id: param(req, 'id'), orgId: req.user!.orgId } });
        if (!existing) { res.status(404).json({ error: 'Webinar not found' }); return; }
        await db.webinar.delete({ where: { id: param(req, 'id'), orgId: req.user!.orgId } });
        res.json({ message: 'Webinar deleted' });
    } catch (err) {
        console.error('Delete webinar error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
