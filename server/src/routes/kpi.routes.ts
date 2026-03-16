import { Router } from 'express';
import type { Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import db from '../lib/db.js';
const router = Router();

router.use(authenticate);

// GET /api/kpi/overview — Local DB contact analytics
router.get('/overview', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;

        // Total contacts
        const totalContacts = await db.contact.count({ where: { orgId } });

        // Contacts by stage
        const byStage = await db.contact.groupBy({
            by: ['stage'],
            where: { orgId },
            _count: { id: true },
        });

        // Contacts by origin
        const byOrigin = await db.contact.groupBy({
            by: ['origin'],
            where: { orgId },
            _count: { id: true },
        });

        // Contacts over time (last 12 weeks)
        const twelveWeeksAgo = new Date();
        twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

        const recentContacts = await db.contact.findMany({
            where: {
                orgId,
                createdAt: { gte: twelveWeeksAgo },
            },
            select: { createdAt: true },
            orderBy: { createdAt: 'asc' },
        });

        // Group by week
        const weeklyData: Record<string, number> = {};
        for (const c of recentContacts) {
            const d = new Date(c.createdAt);
            // Get Monday of the week
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(d.setDate(diff));
            const key = monday.toISOString().split('T')[0];
            weeklyData[key] = (weeklyData[key] || 0) + 1;
        }

        const contactsOverTime = Object.entries(weeklyData).map(([week, count]) => ({
            week,
            count,
        }));

        // Won/Lost counts
        const won = byStage.find(s => s.stage === 'ganado')?._count.id || 0;
        const lost = byStage.find(s => s.stage === 'perdido')?._count.id || 0;
        const active = totalContacts - won - lost;
        const conversionRate = totalContacts > 0 ? Math.round((won / totalContacts) * 100) : 0;

        // Recent contacts
        const latest = await db.contact.findMany({
            where: { orgId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                name: true,
                email: true,
                stage: true,
                origin: true,
                createdAt: true,
            },
        });

        res.json({
            totalContacts,
            activeContacts: active,
            won,
            lost,
            conversionRate,
            byStage: byStage.map(s => ({ stage: s.stage, count: s._count.id })),
            byOrigin: byOrigin.map(o => ({ origin: o.origin, count: o._count.id })),
            contactsOverTime,
            recentContacts: latest,
        });
    } catch (err: any) {
        console.error('KPI overview error:', err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

// GET /api/kpi/funnel — GHL pipeline opportunities by stage
router.get('/funnel', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const conn = await db.ghlConnection.findUnique({ where: { orgId } });

        if (!conn || !conn.isActive) {
            res.json({ connected: false, stages: [] });
            return;
        }

        const GHL_API_BASE = 'https://services.leadconnectorhq.com';

        // Determine auth token — prefer OAuth (auto-refreshes), fall back to private key
        let token: string | null = null;

        // Try OAuth first (has auto-refresh)
        if (conn.accessToken) {
            if (conn.expiresAt < new Date(Date.now() + 5 * 60 * 1000)) {
                // Token expired or about to expire, try to refresh
                try {
                    const { env } = await import('../config/env.js');
                    const refreshResp = await fetch(`${GHL_API_BASE}/oauth/token`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams({
                            client_id: env.GHL_CLIENT_ID,
                            client_secret: env.GHL_CLIENT_SECRET,
                            grant_type: 'refresh_token',
                            refresh_token: conn.refreshToken,
                            user_type: conn.userType,
                            redirect_uri: env.GHL_REDIRECT_URI,
                        }),
                    });

                    if (refreshResp.ok) {
                        const tokens = await refreshResp.json() as any;
                        await db.ghlConnection.update({
                            where: { orgId },
                            data: {
                                accessToken: tokens.access_token,
                                refreshToken: tokens.refresh_token,
                                expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
                            },
                        });
                        token = tokens.access_token;
                    }
                } catch {
                    // Refresh failed, will fall back to private key
                }
            } else {
                token = conn.accessToken;
            }
        }

        // Fall back to private key if OAuth unavailable
        if (!token && conn.privateApiKey) {
            token = conn.privateApiKey;
        }

        if (!token) {
            res.json({ connected: true, stages: [], error: 'No valid auth token available' });
            return;
        }

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json',
        };

        // Get pipelines
        const pipelinesResp = await fetch(
            `${GHL_API_BASE}/opportunities/pipelines?locationId=${conn.locationId}`,
            { headers }
        );

        if (!pipelinesResp.ok) {
            res.json({ connected: true, stages: [], error: 'Could not fetch pipelines' });
            return;
        }

        const pipelinesData = await pipelinesResp.json() as any;
        const pipelines = pipelinesData.pipelines || [];

        if (pipelines.length === 0) {
            res.json({ connected: true, stages: [], pipelines: [] });
            return;
        }

        // Use first pipeline (or find "Embudo Educativo LIA")
        const targetPipeline = pipelines.find((p: any) =>
            p.name.toLowerCase().includes('embudo') || p.name.toLowerCase().includes('lia')
        ) || pipelines[0];

        // Get opportunities for this pipeline
        const oppsResp = await fetch(
            `${GHL_API_BASE}/opportunities/search?location_id=${conn.locationId}&pipeline_id=${targetPipeline.id}&limit=100`,
            { headers }
        );

        let opportunities: any[] = [];
        if (oppsResp.ok) {
            const oppsData = await oppsResp.json() as any;
            opportunities = oppsData.opportunities || [];
        }

        // Map stages with opportunity counts and values
        const stageMap: Record<string, { name: string; count: number; value: number; position: number }> = {};
        for (const stage of targetPipeline.stages || []) {
            stageMap[stage.id] = {
                name: stage.name,
                count: 0,
                value: 0,
                position: stage.position ?? 0,
            };
        }

        let totalValue = 0;
        for (const opp of opportunities) {
            const stageId = opp.pipelineStageId;
            if (stageMap[stageId]) {
                stageMap[stageId].count++;
                stageMap[stageId].value += opp.monetaryValue || 0;
            }
            totalValue += opp.monetaryValue || 0;
        }

        const stages = Object.entries(stageMap)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => a.position - b.position);

        res.json({
            connected: true,
            pipeline: {
                id: targetPipeline.id,
                name: targetPipeline.name,
            },
            stages,
            totalOpportunities: opportunities.length,
            totalValue,
            wonCount: opportunities.filter(o => o.status === 'won').length,
            lostCount: opportunities.filter(o => o.status === 'lost').length,
            openCount: opportunities.filter(o => o.status === 'open').length,
        });
    } catch (err: any) {
        console.error('KPI funnel error:', err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

export default router;
