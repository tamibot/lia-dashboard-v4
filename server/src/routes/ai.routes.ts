import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { env } from '../config/env.js';
import { param } from '../utils/helpers.js';

const prisma = new PrismaClient();
const router = Router();
router.use(authenticate);

/**
 * POST /api/ai/ask
 * Proxy to Gemini/OpenAI API.
 * Uses org-specific keys or fallback to central keys.
 */
router.post('/ask', async (req: Request, res: Response) => {
    try {
        const { prompt, systemPrompt, provider = 'gemini' } = req.body;

        if (!prompt) {
            res.status(400).json({ error: 'prompt is required' });
            return;
        }

        // Get API key: org-specific first, then central fallback
        let apiKey: string | null = null;

        const orgKey = await prisma.apiKey.findUnique({
            where: { orgId_provider: { orgId: req.user!.orgId, provider } },
        });

        if (orgKey) {
            apiKey = orgKey.encryptedKey; // In production, decrypt this
        } else {
            apiKey = provider === 'gemini' ? env.GEMINI_API_KEY : env.OPENAI_API_KEY;
        }

        if (!apiKey) {
            res.status(400).json({ error: `No ${provider} API key configured` });
            return;
        }

        let result: string;

        if (provider === 'gemini') {
            result = await callGemini(apiKey, prompt, systemPrompt);
        } else {
            result = await callOpenAI(apiKey, prompt, systemPrompt);
        }

        res.json({ content: result });
    } catch (err) {
        console.error('AI proxy error:', err);
        res.status(500).json({ error: 'AI request failed' });
    }
});

// POST /api/ai/keys - Save org-specific API key
router.post('/keys', async (req: Request, res: Response) => {
    try {
        const { provider, key } = req.body;
        if (!provider || !key) {
            res.status(400).json({ error: 'provider and key are required' });
            return;
        }

        const apiKey = await prisma.apiKey.upsert({
            where: { orgId_provider: { orgId: req.user!.orgId, provider } },
            update: { encryptedKey: key }, // In production, encrypt this
            create: { orgId: req.user!.orgId, provider, encryptedKey: key },
        });

        res.json({ message: 'API key saved', provider: apiKey.provider });
    } catch (err) {
        console.error('Save key error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/ai/keys/:provider
router.delete('/keys/:provider', async (req: Request, res: Response) => {
    try {
        const provider = param(req, 'provider') as 'gemini' | 'openai';
        await prisma.apiKey.deleteMany({
            where: { orgId: req.user!.orgId, provider },
        });
        res.json({ message: 'API key removed' });
    } catch (err) {
        console.error('Delete key error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// === Gemini API helper ===
async function callGemini(apiKey: string, prompt: string, systemPrompt?: string): Promise<string> {
    const MODELS = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-2.0-flash'];

    for (const model of MODELS) {
        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        ...(systemPrompt ? {
                            systemInstruction: { parts: [{ text: systemPrompt }] },
                        } : {}),
                    }),
                }
            );

            if (!response.ok) {
                console.warn(`Gemini model ${model} failed:`, response.status);
                continue;
            }

            const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
            return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } catch (err) {
            console.warn(`Gemini model ${model} error:`, err);
            continue;
        }
    }

    throw new Error('All Gemini models failed');
}

// === OpenAI API helper ===
async function callOpenAI(apiKey: string, prompt: string, systemPrompt?: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
                ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
                { role: 'user', content: prompt },
            ],
            max_tokens: 4000,
        }),
    });

    if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content || '';
}

export default router;
