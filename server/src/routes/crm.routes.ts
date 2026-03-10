import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();

// All routes require authentication
router.use(authenticate);

// --- Funnels ---

// GET /api/crm/funnels - List all funnels
router.get('/funnels', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const funnels = await prisma.funnel.findMany({
            where: { orgId },
            include: { stages: { orderBy: { sortOrder: 'asc' } } },
            orderBy: { createdAt: 'desc' },
        });
        res.json(funnels);
    } catch (err) {
        console.error('List funnels error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/crm/funnels/:id - Get single funnel
router.get('/funnels/:id', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const orgId = req.user!.orgId;
        const funnel = await prisma.funnel.findFirst({
            where: { id, orgId },
            include: { stages: { orderBy: { sortOrder: 'asc' } } },
        });
        if (!funnel) return res.status(404).json({ error: 'Funnel not found' });
        res.json(funnel);
    } catch (err) {
        console.error('Get funnel error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/crm/funnels - Create funnel
router.post('/funnels', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const { name, description, isDefault, stages } = req.body;

        const funnel = await prisma.funnel.create({
            data: {
                orgId,
                name,
                description,
                isDefault: isDefault || false,
                stages: {
                    create: (stages || []).map((s: any, i: number) => ({
                        name: s.name,
                        description: s.description,
                        rules: s.rules,
                        sortOrder: s.sortOrder ?? i,
                        color: s.color,
                    })),
                },
            },
            include: { stages: true },
        });
        res.status(201).json(funnel);
    } catch (err) {
        console.error('Create funnel error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/crm/funnels/:id - Update funnel
router.put('/funnels/:id', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const orgId = req.user!.orgId;
        const { name, description, isDefault, stages } = req.body;

        const funnel = await prisma.$transaction(async (tx) => {
            // Update stages if provided
            if (stages) {
                await tx.funnelStage.deleteMany({ where: { funnelId: id } });
                await tx.funnelStage.createMany({
                    data: stages.map((s: any, i: number) => ({
                        funnelId: id,
                        name: s.name,
                        description: s.description,
                        rules: s.rules,
                        sortOrder: s.sortOrder ?? i,
                        color: s.color,
                    })),
                });
            }

            return tx.funnel.update({
                where: { id },
                data: { name, description, isDefault },
                include: { stages: { orderBy: { sortOrder: 'asc' } } },
            });
        });
        res.json(funnel);
    } catch (err) {
        console.error('Update funnel error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/crm/funnels/:id
router.delete('/funnels/:id', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const orgId = req.user!.orgId;
        await prisma.funnel.delete({ where: { id, orgId } });
        res.json({ message: 'Funnel deleted' });
    } catch (err) {
        console.error('Delete funnel error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// --- Extraction Fields ---

// GET /api/crm/fields - List all fields
router.get('/fields', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const fields = await prisma.extractionField.findMany({
            where: { orgId },
            orderBy: { isDefault: 'desc' },
        });
        res.json(fields);
    } catch (err) {
        console.error('List fields error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/crm/fields - Create field
router.post('/fields', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const data = req.body;

        const field = await prisma.extractionField.create({
            data: {
                ...data,
                orgId,
            },
        });
        res.status(201).json(field);
    } catch (err) {
        console.error('Create field error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/crm/fields/:id - Update field
router.put('/fields/:id', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const orgId = req.user!.orgId;
        const data = req.body;

        const field = await prisma.extractionField.update({
            where: { id, orgId },
            data,
        });
        res.json(field);
    } catch (err) {
        console.error('Update field error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/crm/fields/:id
router.delete('/fields/:id', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const orgId = req.user!.orgId;
        await prisma.extractionField.delete({ where: { id, orgId } });
        res.json({ message: 'Field deleted' });
    } catch (err) {
        console.error('Delete field error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
