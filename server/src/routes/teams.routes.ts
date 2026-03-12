import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { param } from '../utils/helpers.js';

const prisma = new PrismaClient();
const router = Router();
router.use(authenticate);

// Fields to persist for each team member
const memberFields = (m: any) => ({
    name: m.name || '',
    email: m.email || '',
    phone: m.phone || null,
    whatsapp: m.whatsapp || null,
    role: m.role || null,
    availability: m.availability || null,
    vacationStart: m.vacationStart ? new Date(m.vacationStart) : null,
    vacationEnd: m.vacationEnd ? new Date(m.vacationEnd) : null,
    isAvailable: m.isAvailable ?? true,
    specialties: m.specialties || [],
    maxLeads: m.maxLeads || null,
    userId: m.userId || null,
});

// GET /api/teams
router.get('/', async (req: Request, res: Response) => {
    try {
        const teams = await prisma.team.findMany({
            where: { orgId: req.user!.orgId },
            include: {
                members: true,
                productAssignments: true,
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
        const { members, productAssignments, ...data } = req.body;

        const team = await prisma.team.create({
            data: {
                name: data.name,
                description: data.description || null,
                orgId,
                members: members?.length ? {
                    create: members.map((m: any) => memberFields(m)),
                } : undefined,
                productAssignments: productAssignments?.length ? {
                    create: productAssignments.map((pa: any) => ({
                        entityType: pa.entityType,
                        entityId: pa.entityId,
                    })),
                } : undefined,
            },
            include: { members: true, productAssignments: true },
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

        const { members, productAssignments, ...data } = req.body;

        const team = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Replace members
            if (members) {
                await tx.teamMember.deleteMany({ where: { teamId: id } });
                if (members.length > 0) {
                    await tx.teamMember.createMany({
                        data: members.map((m: any) => ({
                            teamId: id,
                            ...memberFields(m),
                        })),
                    });
                }
            }
            // Replace product assignments
            if (productAssignments) {
                await tx.teamProductAssignment.deleteMany({ where: { teamId: id } });
                if (productAssignments.length > 0) {
                    await tx.teamProductAssignment.createMany({
                        data: productAssignments.map((pa: any) => ({
                            teamId: id,
                            entityType: pa.entityType,
                            entityId: pa.entityId,
                        })),
                    });
                }
            }
            return tx.team.update({
                where: { id },
                data: { name: data.name, description: data.description || null },
                include: { members: true, productAssignments: true },
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
