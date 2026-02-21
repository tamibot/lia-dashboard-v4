import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { param } from '../utils/helpers.js';

const prisma = new PrismaClient();
const router = Router();
router.use(authenticate);

// GET /api/contacts - List contacts for the org
router.get('/', async (req: Request, res: Response) => {
    try {
        const { stage, origin, search, limit = '100' } = req.query;
        const orgId = req.user!.orgId;
        const where: any = { orgId, isActive: true };

        if (stage) where.stage = stage;
        if (origin) where.origin = origin;
        if (search) {
            where.OR = [
                { name: { contains: search as string, mode: 'insensitive' } },
                { phone: { contains: search as string } },
                { email: { contains: search as string, mode: 'insensitive' } },
                { courseInterest: { contains: search as string, mode: 'insensitive' } },
            ];
        }

        const contacts = await prisma.contact.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit as string),
        });

        res.json(contacts);
    } catch (err) {
        console.error('List contacts error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/contacts/stats - Pipeline stats
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const stats = await prisma.contact.groupBy({
            by: ['stage'],
            where: { orgId, isActive: true },
            _count: { id: true },
        });
        const total = await prisma.contact.count({ where: { orgId, isActive: true } });
        res.json({ stages: stats, total });
    } catch (err) {
        console.error('Contact stats error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/contacts/:id
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const contact = await prisma.contact.findFirst({
            where: { id: param(req, 'id'), orgId: req.user!.orgId },
        });
        if (!contact) { res.status(404).json({ error: 'Contact not found' }); return; }
        res.json(contact);
    } catch (err) {
        console.error('Get contact error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/contacts - Create contact
router.post('/', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const data = req.body;
        const contact = await prisma.contact.create({
            data: {
                orgId,
                name: data.name,
                email: data.email,
                phone: data.phone,
                phoneCountry: data.phoneCountry,
                stage: data.stage || 'nuevo',
                origin: data.origin || 'organico',
                customOrigin: data.customOrigin,
                courseInterest: data.courseInterest,
                programInterest: data.programInterest,
                budget: data.budget,
                currency: data.currency || 'USD',
                city: data.city,
                country: data.country,
                timezone: data.timezone,
                utmSource: data.utmSource,
                utmMedium: data.utmMedium,
                utmCampaign: data.utmCampaign,
                adPlatform: data.adPlatform,
                landingPage: data.landingPage,
                notes: data.notes,
                tags: data.tags || [],
                ghlContactId: data.ghlContactId,
                ghlData: data.ghlData,
            },
        });
        res.status(201).json(contact);
    } catch (err: any) {
        console.error('Create contact error:', err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

// POST /api/contacts/ghl-sync - Bulk upsert from GHL webhook
router.post('/ghl-sync', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const { contacts } = req.body as { contacts: any[] };
        if (!contacts || !Array.isArray(contacts)) {
            res.status(400).json({ error: 'contacts array is required' });
            return;
        }

        const results = await Promise.allSettled(
            contacts.map(c =>
                prisma.contact.upsert({
                    where: { ghlContactId: c.id || c.ghlContactId },
                    update: {
                        name: c.name || c.fullName,
                        email: c.email,
                        phone: c.phone,
                        city: c.city,
                        country: c.country,
                        courseInterest: c.customField?.courseInterest || c.courseInterest,
                        stage: c.stage || 'nuevo',
                        ghlData: c,
                        ghlLastSyncAt: new Date(),
                    },
                    create: {
                        orgId,
                        ghlContactId: c.id || c.ghlContactId,
                        name: c.name || c.fullName || 'Sin nombre',
                        email: c.email,
                        phone: c.phone,
                        city: c.city,
                        country: c.country,
                        courseInterest: c.customField?.courseInterest || c.courseInterest,
                        stage: c.stage || 'nuevo',
                        origin: c.source?.includes('meta') ? 'meta_ads'
                            : c.source?.includes('google') ? 'google_ads'
                                : 'otro',
                        ghlData: c,
                        ghlLastSyncAt: new Date(),
                    },
                })
            )
        );

        const synced = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;

        res.json({ message: `GHL sync completado: ${synced} sincronizados, ${failed} errores`, synced, failed });
    } catch (err) {
        console.error('GHL sync error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/contacts/:id - Update contact
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const id = param(req, 'id');
        const orgId = req.user!.orgId;
        const existing = await prisma.contact.findFirst({ where: { id, orgId } });
        if (!existing) { res.status(404).json({ error: 'Contact not found' }); return; }

        const { orgId: _o, id: _i, createdAt: _c, ...data } = req.body;
        const contact = await prisma.contact.update({ where: { id }, data });
        res.json(contact);
    } catch (err) {
        console.error('Update contact error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/contacts/:id - Soft delete
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const id = param(req, 'id');
        const orgId = req.user!.orgId;
        const existing = await prisma.contact.findFirst({ where: { id, orgId } });
        if (!existing) { res.status(404).json({ error: 'Contact not found' }); return; }

        await prisma.contact.update({ where: { id }, data: { isActive: false } });
        res.json({ message: 'Contact deactivated' });
    } catch (err) {
        console.error('Delete contact error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
