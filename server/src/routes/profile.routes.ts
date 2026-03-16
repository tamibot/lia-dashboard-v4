import { Router } from 'express';
import type { Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import db from '../lib/db.js';
const router = Router();
router.use(authenticate);

// GET /api/profile - Get org profile
router.get('/', async (req: Request, res: Response) => {
    try {
        const org = await db.organization.findUnique({
            where: { id: req.user!.orgId },
        });
        if (!org) { res.status(404).json({ error: 'Organization not found' }); return; }
        res.json(org);
    } catch (err) {
        console.error('Get profile error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Allowed fields for profile update (whitelist for safety)
const PROFILE_UPDATABLE_FIELDS = [
    'name', 'type', 'description', 'tagline', 'website',
    'contactEmail', 'contactPhone', 'whatsapp',
    'accreditations', 'specialty', 'personalBrand', 'niche',
    'targetAudience', 'history',
    'branding', 'socialMedia', 'operatingHours',
    'locations', 'paymentMethods', 'certificates', 'modalities',
    'courseCategories', 'onboardingComplete',
];

// PUT /api/profile - Update org profile
router.put('/', async (req: Request, res: Response) => {
    try {
        // Only allow whitelisted fields to prevent injection of id/slug/etc
        const data: Record<string, any> = {};
        for (const field of PROFILE_UPDATABLE_FIELDS) {
            if (req.body[field] !== undefined) {
                data[field] = req.body[field];
            }
        }

        const org = await db.organization.update({
            where: { id: req.user!.orgId },
            data,
        });
        res.json(org);
    } catch (err) {
        console.error('Update profile error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
