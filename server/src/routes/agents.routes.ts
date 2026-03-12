import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { param } from '../utils/helpers.js';

const prisma = new PrismaClient();
const router = Router();
router.use(authenticate);

// GET /api/agents
router.get('/', async (req: Request, res: Response) => {
    try {
        const agents = await prisma.aiAgent.findMany({
            where: { orgId: req.user!.orgId },
            include: {
                agentCourses: { include: { course: { select: { id: true, title: true, code: true } } } },
                team: { select: { id: true, name: true } },
                funnel: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(agents);
    } catch (err) {
        console.error('List agents error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/agents/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const agent = await prisma.aiAgent.findFirst({
            where: { id: param(req, 'id'), orgId: req.user!.orgId },
            include: { agentCourses: { include: { course: true } }, team: true, funnel: true },
        });
        if (!agent) { res.status(404).json({ error: 'Agent not found' }); return; }
        res.json(agent);
    } catch (err) {
        console.error('Get agent error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/agents
router.post('/', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const { specificCourses, ...data } = req.body;

        const agent = await prisma.aiAgent.create({
            data: {
                ...data, orgId,
                expertise: data.expertise || [],
                agentCourses: specificCourses?.length ? {
                    create: specificCourses.map((courseId: string) => ({ courseId })),
                } : undefined,
            },
            include: { agentCourses: true },
        });
        res.status(201).json(agent);
    } catch (err) {
        console.error('Create agent error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/agents/:id
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const id = param(req, 'id');
        const existing = await prisma.aiAgent.findFirst({ where: { id, orgId: req.user!.orgId } });
        if (!existing) { res.status(404).json({ error: 'Agent not found' }); return; }

        const { specificCourses, ...data } = req.body;

        const agent = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            if (specificCourses !== undefined) {
                await tx.agentCourse.deleteMany({ where: { agentId: id } });
                if (specificCourses?.length) {
                    await tx.agentCourse.createMany({
                        data: specificCourses.map((courseId: string) => ({ agentId: id, courseId })),
                    });
                }
            }
            return tx.aiAgent.update({
                where: { id }, data,
                include: { agentCourses: true, team: true },
            });
        });
        res.json(agent);
    } catch (err) {
        console.error('Update agent error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/agents/:id
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const existing = await prisma.aiAgent.findFirst({ where: { id: param(req, 'id'), orgId: req.user!.orgId } });
        if (!existing) { res.status(404).json({ error: 'Agent not found' }); return; }
        await prisma.aiAgent.delete({ where: { id: param(req, 'id') } });
        res.json({ message: 'Agent deleted' });
    } catch (err) {
        console.error('Delete agent error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
