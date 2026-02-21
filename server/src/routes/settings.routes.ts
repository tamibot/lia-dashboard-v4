import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();
router.use(authenticate);

// GET /api/settings/keys — return org's API keys (masked except for the client)
router.get('/keys', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const keys = await prisma.apiKey.findMany({ where: { orgId } });

        const geminiKey = keys.find(k => k.provider === 'gemini')?.encryptedKey ?? null;
        const openaiKey = keys.find(k => k.provider === 'openai')?.encryptedKey ?? null;

        res.json({
            gemini_key: geminiKey,
            openai_key: openaiKey,
            // masked versions for display
            gemini_masked: geminiKey ? geminiKey.slice(0, 6) + '...' : null,
            openai_masked: openaiKey ? openaiKey.slice(0, 8) + '...' : null,
        });
    } catch (err) {
        console.error('Get settings/keys error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/settings/keys/gemini
router.post('/keys/gemini', async (req: Request, res: Response) => {
    try {
        const { key } = req.body;
        if (!key) { res.status(400).json({ error: 'key is required' }); return; }
        await prisma.apiKey.upsert({
            where: { orgId_provider: { orgId: req.user!.orgId, provider: 'gemini' } },
            update: { encryptedKey: key },
            create: { orgId: req.user!.orgId, provider: 'gemini', encryptedKey: key },
        });
        res.json({ message: 'Gemini key saved' });
    } catch (err) {
        console.error('Save gemini key error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/settings/keys/openai
router.post('/keys/openai', async (req: Request, res: Response) => {
    try {
        const { key } = req.body;
        if (!key) { res.status(400).json({ error: 'key is required' }); return; }
        await prisma.apiKey.upsert({
            where: { orgId_provider: { orgId: req.user!.orgId, provider: 'openai' } },
            update: { encryptedKey: key },
            create: { orgId: req.user!.orgId, provider: 'openai', encryptedKey: key },
        });
        res.json({ message: 'OpenAI key saved' });
    } catch (err) {
        console.error('Save openai key error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/settings/keys/gemini
router.delete('/keys/gemini', async (req: Request, res: Response) => {
    try {
        await prisma.apiKey.deleteMany({ where: { orgId: req.user!.orgId, provider: 'gemini' } });
        res.json({ message: 'Gemini key removed' });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/settings/keys/openai
router.delete('/keys/openai', async (req: Request, res: Response) => {
    try {
        await prisma.apiKey.deleteMany({ where: { orgId: req.user!.orgId, provider: 'openai' } });
        res.json({ message: 'OpenAI key removed' });
    } catch (err) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/settings/reset-demo — trigger by the demo reset button
router.post('/reset-demo', async (_req: Request, res: Response) => {
    res.json({ message: 'Demo reset acknowledged (no-op in production)' });
});

export default router;
