import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { param } from '../utils/helpers.js';

const prisma = new PrismaClient();
const router = Router();
router.use(authenticate);

// GET /api/teams
router.get('/', async (req: Request, res: Response) => {
    try {
        const teams = await prisma.team.findMany({
            where: { orgId: req.user!.orgId },
            include: {
                members: true,
                courseAssignments: { include: { course: { select: { id: true, title: true, code: true } } } },
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(teams);
    } catch (err) {
        console.error('List teams error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/teams
router.post('/', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const { members, assignedCourses, ...data } = req.body;

        const team = await prisma.team.create({
            data: {
                ...data, orgId,
                members: members?.length ? {
                    create: members.map((m: any) => ({
                        name: m.name, email: m.email, phone: m.phone, role: m.role,
                    })),
                } : undefined,
                courseAssignments: assignedCourses?.length ? {
                    create: assignedCourses.map((courseId: string) => ({ courseId })),
                } : undefined,
            },
            include: { members: true, courseAssignments: true },
        });
        res.status(201).json(team);
    } catch (err) {
        console.error('Create team error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/teams/:id
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const id = param(req, 'id');
        const existing = await prisma.team.findFirst({ where: { id, orgId: req.user!.orgId } });
        if (!existing) { res.status(404).json({ error: 'Team not found' }); return; }

        const { members, assignedCourses, ...data } = req.body;

        const team = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            if (members) {
                await tx.teamMember.deleteMany({ where: { teamId: id } });
                await tx.teamMember.createMany({
                    data: members.map((m: any) => ({
                        teamId: id, name: m.name, email: m.email, phone: m.phone, role: m.role,
                    })),
                });
            }
            if (assignedCourses) {
                await tx.teamCourseAssignment.deleteMany({ where: { teamId: id } });
                await tx.teamCourseAssignment.createMany({
                    data: assignedCourses.map((courseId: string) => ({ teamId: id, courseId })),
                });
            }
            return tx.team.update({
                where: { id }, data,
                include: { members: true, courseAssignments: true },
            });
        });
        res.json(team);
    } catch (err) {
        console.error('Update team error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/teams/:id
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const existing = await prisma.team.findFirst({ where: { id: param(req, 'id'), orgId: req.user!.orgId } });
        if (!existing) { res.status(404).json({ error: 'Team not found' }); return; }
        await prisma.team.delete({ where: { id: param(req, 'id') } });
        res.json({ message: 'Team deleted' });
    } catch (err) {
        console.error('Delete team error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
