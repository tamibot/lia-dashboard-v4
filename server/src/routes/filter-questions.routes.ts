import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();

router.use(authenticate);

// GET /api/filter-questions
router.get('/', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const questions = await prisma.filterQuestion.findMany({
            where: { orgId },
            orderBy: [{ productType: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }],
        });
        res.json(questions);
    } catch (err) {
        console.error('List filter questions error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/filter-questions
router.post('/', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const { question, fieldKey, type, options, isRequired, isActive, productType, sortOrder, placeholder } = req.body;
        const q = await prisma.filterQuestion.create({
            data: {
                orgId,
                question,
                fieldKey: fieldKey || question.toLowerCase().replace(/\s+/g, '_').slice(0, 30),
                type: type || 'text',
                options: options || [],
                isRequired: isRequired ?? false,
                isActive: isActive ?? true,
                productType: productType || 'all',
                sortOrder: sortOrder || 0,
                placeholder: placeholder || null,
            },
        });
        res.status(201).json(q);
    } catch (err) {
        console.error('Create filter question error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/filter-questions/:id
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const id = req.params.id as string;
        const existing = await prisma.filterQuestion.findFirst({ where: { id, orgId } });
        if (!existing) return res.status(404).json({ error: 'Not found' });

        const { question, fieldKey, type, options, isRequired, isActive, productType, sortOrder, placeholder } = req.body;
        const q = await prisma.filterQuestion.update({
            where: { id },
            data: {
                ...(question !== undefined && { question }),
                ...(fieldKey !== undefined && { fieldKey }),
                ...(type !== undefined && { type }),
                ...(options !== undefined && { options }),
                ...(isRequired !== undefined && { isRequired }),
                ...(isActive !== undefined && { isActive }),
                ...(productType !== undefined && { productType }),
                ...(sortOrder !== undefined && { sortOrder }),
                ...(placeholder !== undefined && { placeholder }),
            },
        });
        res.json(q);
    } catch (err) {
        console.error('Update filter question error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/filter-questions/:id
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const id = req.params.id as string;
        const existing = await prisma.filterQuestion.findFirst({ where: { id, orgId } });
        if (!existing) return res.status(404).json({ error: 'Not found' });
        await prisma.filterQuestion.delete({ where: { id } });
        res.json({ success: true });
    } catch (err) {
        console.error('Delete filter question error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
