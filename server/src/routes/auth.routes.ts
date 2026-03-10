import { Router } from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { signToken } from '../utils/jwt.js';
import { authenticate } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { email, password, name, orgName, orgType } = req.body;

        if (!email || !password || !name) {
            res.status(400).json({ error: 'Email, password, and name are required' });
            return;
        }

        // Check if user exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            res.status(409).json({ error: 'Email already registered' });
            return;
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create org + user in transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create or find organization
            const slug = (orgName || name).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);

            const org = await tx.organization.create({
                data: {
                    slug: `${slug}-${Date.now().toString(36)}`,
                    name: orgName || `Organización de ${name}`,
                    type: orgType || 'infoproductor',
                    branding: {
                        colors: { primary: '#2563EB', secondary: '#3B82F6', accent: '#F59E0B' },
                        typography: { headings: 'Inter', body: 'Inter' },
                        voice: { tone: 'profesional', style: 'Clear and direct' },
                    },
                },
            });

            const user = await tx.user.create({
                data: {
                    email,
                    passwordHash,
                    name,
                    role: 'admin', // First user is admin
                    orgId: org.id,
                },
            });

            return { user, org };
        });

        const token = signToken({
            userId: result.user.id,
            orgId: result.org.id,
            role: result.user.role,
            email: result.user.email,
        });

        res.status(201).json({
            token,
            user: {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
                phone: result.user.phone,
                role: result.user.role,
                orgId: result.org.id,
                orgName: result.org.name,
            },
        });
    } catch (err: any) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Internal server error', details: err?.message || err });
    }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }

        const user = await prisma.user.findUnique({
            where: { email },
            include: { org: { select: { id: true, name: true, slug: true } } },
        });

        if (!user || !user.isActive) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });

        const token = signToken({
            userId: user.id,
            orgId: user.orgId,
            role: user.role,
            email: user.email,
        });

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                role: user.role,
                orgId: user.org.id,
                orgName: user.org.name,
            },
        });
    } catch (err: any) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error', details: err?.message || err });
    }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: Request, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            include: { org: true },
        });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            role: user.role,
            orgId: user.orgId,
            org: {
                id: user.org.id,
                name: user.org.name,
                slug: user.org.slug,
                type: user.org.type,
                onboardingComplete: user.org.onboardingComplete,
            },
        });
    } catch (err) {
        console.error('Me error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
