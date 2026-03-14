import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { env } from '../config/env.js';

const prisma = new PrismaClient();
const router = Router();

const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const GHL_AUTH_URL = 'https://marketplace.gohighlevel.com/oauth/chooselocation';

// ===== Helper: refresh access token if expired =====
async function getValidToken(orgId: string): Promise<string> {
    const conn = await prisma.ghlConnection.findUnique({ where: { orgId } });
    if (!conn || !conn.isActive) throw new Error('No GHL connection found');

    // If token still valid (with 5min buffer), return it
    if (conn.expiresAt > new Date(Date.now() + 5 * 60 * 1000)) {
        return conn.accessToken;
    }

    // Refresh the token
    const resp = await fetch(`${GHL_API_BASE}/oauth/token`, {
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

    if (!resp.ok) {
        const err = await resp.text();
        console.error('GHL token refresh failed:', err);
        await prisma.ghlConnection.update({ where: { orgId }, data: { isActive: false } });
        throw new Error('GHL token refresh failed — reconnection required');
    }

    const tokens = await resp.json() as {
        access_token: string;
        refresh_token: string;
        expires_in: number;
        token_type: string;
    };

    await prisma.ghlConnection.update({
        where: { orgId },
        data: {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
            tokenType: tokens.token_type || 'Bearer',
        },
    });

    return tokens.access_token;
}

// ===== Helper: GHL API call with auto-refresh =====
async function ghlFetch(orgId: string, path: string, options: RequestInit = {}): Promise<any> {
    const token = await getValidToken(orgId);
    const resp = await fetch(`${GHL_API_BASE}${path}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!resp.ok) {
        const errText = await resp.text();
        console.error(`GHL API error (${path}):`, resp.status, errText);
        throw new Error(`GHL API error: ${resp.status}`);
    }

    return resp.json();
}

// ===================================================================
// PUBLIC (no auth) — OAuth callback (GHL redirects browser here)
// ===================================================================

// GET /api/integrations/oauth/callback?code=XXX
router.get('/oauth/callback', async (req: Request, res: Response) => {
    try {
        const { code } = req.query;
        if (!code) {
            res.status(400).send('Missing authorization code');
            return;
        }

        // Exchange code for tokens
        const tokenResp = await fetch(`${GHL_API_BASE}/oauth/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: env.GHL_CLIENT_ID,
                client_secret: env.GHL_CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code as string,
                redirect_uri: env.GHL_REDIRECT_URI,
                user_type: 'Location',
            }),
        });

        if (!tokenResp.ok) {
            const errText = await tokenResp.text();
            console.error('GHL token exchange failed:', errText);
            res.redirect(`${env.FRONTEND_URL}/settings?ghl=error&reason=token_exchange`);
            return;
        }

        const tokens = await tokenResp.json() as {
            access_token: string;
            refresh_token: string;
            expires_in: number;
            token_type: string;
            locationId: string;
            companyId: string;
            userId: string;
            userType: string;
        };

        // We need to figure out which org this belongs to.
        // The state parameter carries the orgId (set during auth redirect).
        const orgId = req.query.state as string;
        if (!orgId) {
            res.redirect(`${env.FRONTEND_URL}/settings?ghl=error&reason=missing_state`);
            return;
        }

        // Verify org exists
        const org = await prisma.organization.findUnique({ where: { id: orgId } });
        if (!org) {
            res.redirect(`${env.FRONTEND_URL}/settings?ghl=error&reason=invalid_org`);
            return;
        }

        // Upsert GHL connection
        await prisma.ghlConnection.upsert({
            where: { orgId },
            update: {
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
                tokenType: tokens.token_type || 'Bearer',
                locationId: tokens.locationId,
                companyId: tokens.companyId,
                userId: tokens.userId,
                userType: tokens.userType || 'Location',
                isActive: true,
            },
            create: {
                orgId,
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token,
                expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
                tokenType: tokens.token_type || 'Bearer',
                locationId: tokens.locationId,
                companyId: tokens.companyId,
                userId: tokens.userId,
                userType: tokens.userType || 'Location',
            },
        });

        console.log(`GHL connected for org ${orgId} (location: ${tokens.locationId})`);
        res.redirect(`${env.FRONTEND_URL}/settings?ghl=success`);
    } catch (err) {
        console.error('GHL OAuth callback error:', err);
        res.redirect(`${env.FRONTEND_URL}/settings?ghl=error&reason=server`);
    }
});

// ===================================================================
// AUTHENTICATED ENDPOINTS
// ===================================================================
router.use(authenticate);

// GET /api/integrations/ghl/status — Connection status
router.get('/ghl/status', async (req: Request, res: Response) => {
    try {
        const conn = await prisma.ghlConnection.findUnique({
            where: { orgId: req.user!.orgId },
        });

        if (!conn) {
            res.json({ connected: false });
            return;
        }

        res.json({
            connected: conn.isActive,
            locationId: conn.locationId,
            companyId: conn.companyId,
            userType: conn.userType,
            lastSyncAt: conn.lastSyncAt,
            contactsSynced: conn.contactsSynced,
            tokenExpired: conn.expiresAt < new Date(),
            connectedAt: conn.createdAt,
        });
    } catch (err) {
        console.error('GHL status error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/integrations/ghl/auth-url — Generate OAuth authorization URL
router.get('/ghl/auth-url', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const scopes = [
            'contacts.readonly',
            'contacts.write',
            'opportunities.readonly',
            'locations.readonly',
            'users.readonly',
        ];

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: env.GHL_CLIENT_ID,
            redirect_uri: env.GHL_REDIRECT_URI,
            scope: scopes.join(' '),
            state: orgId,
        });

        res.json({ url: `${GHL_AUTH_URL}?${params.toString()}` });
    } catch (err) {
        console.error('GHL auth URL error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/integrations/ghl/disconnect — Remove GHL connection
router.post('/ghl/disconnect', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        await prisma.ghlConnection.deleteMany({ where: { orgId } });
        res.json({ message: 'GHL disconnected' });
    } catch (err) {
        console.error('GHL disconnect error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ===================================================================
// DATA SYNC — Pull data from GHL
// ===================================================================

// POST /api/integrations/ghl/sync-contacts — Pull contacts from GHL
router.post('/ghl/sync-contacts', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const conn = await prisma.ghlConnection.findUnique({ where: { orgId } });
        if (!conn || !conn.isActive) {
            res.status(400).json({ error: 'GHL not connected' });
            return;
        }

        // Fetch contacts from GHL (paginated)
        let allContacts: any[] = [];
        let nextPageUrl: string | null = `/contacts/?locationId=${conn.locationId}&limit=100`;

        while (nextPageUrl) {
            const data = await ghlFetch(orgId, nextPageUrl);
            if (data.contacts && Array.isArray(data.contacts)) {
                allContacts = allContacts.concat(data.contacts);
            }
            // GHL uses meta.nextPageUrl or meta.nextPage for pagination
            nextPageUrl = data.meta?.nextPageUrl || null;
            // Safety: max 1000 contacts per sync
            if (allContacts.length >= 1000) break;
        }

        // Upsert contacts into our database
        let synced = 0;
        let failed = 0;

        for (const c of allContacts) {
            try {
                await prisma.contact.upsert({
                    where: { ghlContactId: c.id },
                    update: {
                        name: c.contactName || c.name || c.firstName ? `${c.firstName || ''} ${c.lastName || ''}`.trim() : 'Sin nombre',
                        email: c.email,
                        phone: c.phone,
                        city: c.city,
                        country: c.country,
                        tags: c.tags || [],
                        ghlData: c,
                        ghlLastSyncAt: new Date(),
                    },
                    create: {
                        orgId,
                        ghlContactId: c.id,
                        name: c.contactName || c.name || c.firstName ? `${c.firstName || ''} ${c.lastName || ''}`.trim() : 'Sin nombre',
                        email: c.email,
                        phone: c.phone,
                        city: c.city,
                        country: c.country,
                        stage: 'nuevo',
                        origin: 'otro',
                        tags: c.tags || [],
                        ghlData: c,
                        ghlLastSyncAt: new Date(),
                    },
                });
                synced++;
            } catch (err) {
                console.error(`Failed to sync contact ${c.id}:`, err);
                failed++;
            }
        }

        // Update sync metadata
        await prisma.ghlConnection.update({
            where: { orgId },
            data: {
                lastSyncAt: new Date(),
                contactsSynced: synced,
            },
        });

        res.json({
            message: `Sincronizacion completada: ${synced} contactos sincronizados, ${failed} errores`,
            synced,
            failed,
            total: allContacts.length,
        });
    } catch (err: any) {
        console.error('GHL sync contacts error:', err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

// GET /api/integrations/ghl/contacts — Preview contacts from GHL (without saving)
router.get('/ghl/contacts', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const conn = await prisma.ghlConnection.findUnique({ where: { orgId } });
        if (!conn || !conn.isActive) {
            res.status(400).json({ error: 'GHL not connected' });
            return;
        }

        const limit = parseInt(req.query.limit as string) || 20;
        const data = await ghlFetch(orgId, `/contacts/?locationId=${conn.locationId}&limit=${limit}`);

        res.json({
            contacts: data.contacts || [],
            meta: data.meta || {},
        });
    } catch (err: any) {
        console.error('GHL contacts preview error:', err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

// GET /api/integrations/ghl/pipelines — Get pipelines/opportunities from GHL
router.get('/ghl/pipelines', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const conn = await prisma.ghlConnection.findUnique({ where: { orgId } });
        if (!conn || !conn.isActive) {
            res.status(400).json({ error: 'GHL not connected' });
            return;
        }

        const data = await ghlFetch(orgId, `/opportunities/pipelines?locationId=${conn.locationId}`);
        res.json(data);
    } catch (err: any) {
        console.error('GHL pipelines error:', err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

// GET /api/integrations/ghl/opportunities — Get opportunities from GHL
router.get('/ghl/opportunities', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const conn = await prisma.ghlConnection.findUnique({ where: { orgId } });
        if (!conn || !conn.isActive) {
            res.status(400).json({ error: 'GHL not connected' });
            return;
        }

        const data = await ghlFetch(orgId, `/opportunities/search?location_id=${conn.locationId}&limit=50`);
        res.json(data);
    } catch (err: any) {
        console.error('GHL opportunities error:', err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

export default router;
