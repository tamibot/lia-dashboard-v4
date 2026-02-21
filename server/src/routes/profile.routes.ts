import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();
router.use(authenticate);

// GET /api/profile - Get org profile
router.get('/', async (req: Request, res: Response) => {
    try {
        const org = await prisma.organization.findUnique({
            where: { id: req.user!.orgId },
        });
        if (!org) { res.status(404).json({ error: 'Organization not found' }); return; }
        res.json(org);
    } catch (err) {
        console.error('Get profile error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/profile - Update org profile
router.put('/', async (req: Request, res: Response) => {
    try {
        const org = await prisma.organization.update({
            where: { id: req.user!.orgId },
            data: req.body,
        });
        res.json(org);
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
