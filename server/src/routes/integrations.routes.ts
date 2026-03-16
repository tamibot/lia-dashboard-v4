import { Router } from 'express';
import type { Request, Response } from 'express';
import { authenticate } from '../middleware/auth.js';
import { env } from '../config/env.js';
import db from '../lib/db.js';
const router = Router();

const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const GHL_AUTH_URL = 'https://marketplace.gohighlevel.com/oauth/chooselocation';

// ===== Helper: refresh access token if expired =====
async function getValidToken(orgId: string): Promise<string> {
    const conn = await db.ghlConnection.findUnique({ where: { orgId } });
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
        await db.ghlConnection.update({ where: { orgId }, data: { isActive: false } });
        throw new Error('GHL token refresh failed — reconnection required');
    }

    const tokens = await resp.json() as {
        access_token: string;
        refresh_token: string;
        expires_in: number;
        token_type: string;
    };

    await db.ghlConnection.update({
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

// ===== Helper: fetch with timeout =====
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 15000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

// ===== Helper: GHL API call with auto-refresh =====
async function ghlFetch(orgId: string, path: string, options: RequestInit = {}): Promise<any> {
    const token = await getValidToken(orgId);
    const resp = await fetchWithTimeout(`${GHL_API_BASE}${path}`, {
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

// ===== Helper: GHL API call with Private Integration key =====
async function ghlPrivateFetch(apiKey: string, path: string, options: RequestInit = {}): Promise<any> {
    const resp = await fetchWithTimeout(`${GHL_API_BASE}${path}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!resp.ok) {
        const errText = await resp.text();
        console.error(`GHL Private API error (${path}):`, resp.status, errText);
        throw new Error(`GHL API error: ${resp.status} - ${errText}`);
    }

    return resp.json();
}

// ===== Helper: Smart GHL fetch — private key first, OAuth fallback =====
async function ghlSmartFetch(conn: { orgId: string; privateApiKey: string | null }, path: string, options: RequestInit = {}): Promise<any> {
    // Private Integration Key never expires — always prefer it
    if (conn.privateApiKey) {
        try {
            return await ghlPrivateFetch(conn.privateApiKey, path, options);
        } catch (pkErr: any) {
            console.warn(`Private key failed for ${path} (${pkErr.message}), trying OAuth...`);
        }
    }
    // OAuth fallback (auto-refreshes if needed)
    return await ghlFetch(conn.orgId, path, options);
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
        const org = await db.organization.findUnique({ where: { id: orgId } });
        if (!org) {
            res.redirect(`${env.FRONTEND_URL}/settings?ghl=error&reason=invalid_org`);
            return;
        }

        // Upsert GHL connection
        await db.ghlConnection.upsert({
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
        const conn = await db.ghlConnection.findUnique({
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
            hasPrivateKey: !!conn.privateApiKey,
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
        await db.ghlConnection.deleteMany({ where: { orgId } });
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
        const conn = await db.ghlConnection.findUnique({ where: { orgId } });
        if (!conn || !conn.isActive) {
            res.status(400).json({ error: 'GHL not connected' });
            return;
        }

        // Fetch contacts from GHL (paginated) — private key first, OAuth fallback
        let allContacts: any[] = [];
        let nextPageUrl: string | null = `/contacts/?locationId=${conn.locationId}&limit=100`;

        while (nextPageUrl) {
            const data = await ghlSmartFetch(conn, nextPageUrl);
            if (data.contacts && Array.isArray(data.contacts)) {
                allContacts = allContacts.concat(data.contacts);
            }
            // GHL pagination
            nextPageUrl = data.meta?.nextPageUrl || null;
            // Safety: max 1000 contacts per sync
            if (allContacts.length >= 1000) break;
        }

        // Upsert contacts into our database
        let synced = 0;
        let failed = 0;

        for (const c of allContacts) {
            if (!c.id) { failed++; continue; } // skip contacts without GHL ID
            const contactName = (`${c.firstName || ''} ${c.lastName || ''}`).trim() || c.contactName || c.name || 'Sin nombre';
            try {
                await db.contact.upsert({
                    where: { ghlContactId: c.id },
                    update: {
                        name: contactName,
                        email: c.email || null,
                        phone: c.phone || null,
                        city: c.city || null,
                        country: c.country || null,
                        tags: c.tags || [],
                        ghlData: c,
                        ghlLastSyncAt: new Date(),
                    },
                    create: {
                        orgId,
                        ghlContactId: c.id,
                        name: contactName,
                        email: c.email || null,
                        phone: c.phone || null,
                        city: c.city || null,
                        country: c.country || null,
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
        await db.ghlConnection.update({
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
        const conn = await db.ghlConnection.findUnique({ where: { orgId } });
        if (!conn || !conn.isActive) {
            res.status(400).json({ error: 'GHL not connected' });
            return;
        }

        const limit = parseInt(req.query.limit as string) || 20;
        const data = await ghlSmartFetch(conn, `/contacts/?locationId=${conn.locationId}&limit=${limit}`);

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
        const conn = await db.ghlConnection.findUnique({ where: { orgId } });
        if (!conn || !conn.isActive) {
            res.status(400).json({ error: 'GHL not connected' });
            return;
        }

        const data = await ghlSmartFetch(conn, `/opportunities/pipelines?locationId=${conn.locationId}`);
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
        const conn = await db.ghlConnection.findUnique({ where: { orgId } });
        if (!conn || !conn.isActive) {
            res.status(400).json({ error: 'GHL not connected' });
            return;
        }

        const data = await ghlSmartFetch(conn, `/opportunities/search?location_id=${conn.locationId}&limit=50`);
        res.json(data);
    } catch (err: any) {
        console.error('GHL opportunities error:', err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

// ===================================================================
// SETUP — Private API Key & Create pipeline/fields in GHL
// ===================================================================

// PUT /api/integrations/ghl/private-key — Save Private Integration API key
router.put('/ghl/private-key', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const { apiKey } = req.body;
        if (!apiKey) {
            res.status(400).json({ error: 'API key is required' });
            return;
        }

        const conn = await db.ghlConnection.findUnique({ where: { orgId } });
        if (!conn) {
            res.status(400).json({ error: 'GHL not connected. Connect via OAuth first.' });
            return;
        }

        await db.ghlConnection.update({
            where: { orgId },
            data: { privateApiKey: apiKey },
        });

        res.json({ message: 'Private API key guardada exitosamente' });
    } catch (err: any) {
        console.error('GHL save private key error:', err);
        res.status(500).json({ error: err.message || 'Error al guardar API key' });
    }
});

// POST /api/integrations/ghl/setup-pipeline — Create sales pipeline in GHL
router.post('/ghl/setup-pipeline', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const conn = await db.ghlConnection.findUnique({ where: { orgId } });
        if (!conn || !conn.isActive) {
            res.status(400).json({ error: 'GHL not connected' });
            return;
        }

        const apiKey = conn.privateApiKey;
        if (!apiKey) {
            res.status(400).json({ error: 'Private Integration API Key requerida. Configurala en la seccion de integraciones.' });
            return;
        }

        const pipeline = await ghlPrivateFetch(apiKey, '/opportunities/pipelines', {
            method: 'POST',
            body: JSON.stringify({
                locationId: conn.locationId,
                name: 'Embudo Educativo LIA',
                stages: [
                    { name: 'Nuevo Lead', position: 0 },
                    { name: 'Primer Contacto', position: 1 },
                    { name: 'Calificado', position: 2 },
                    { name: 'Presentacion Realizada', position: 3 },
                    { name: 'Propuesta Enviada', position: 4 },
                    { name: 'Negociacion', position: 5 },
                    { name: 'Inscrito', position: 6 },
                    { name: 'Perdido', position: 7 },
                ],
            }),
        });

        res.json({ message: 'Pipeline "Embudo Educativo LIA" creado en GHL', pipeline });
    } catch (err: any) {
        console.error('GHL setup pipeline error:', err);
        res.status(500).json({ error: err.message || 'Error al crear pipeline' });
    }
});

// POST /api/integrations/ghl/setup-fields — Create custom contact fields in GHL
router.post('/ghl/setup-fields', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const conn = await db.ghlConnection.findUnique({ where: { orgId } });
        if (!conn || !conn.isActive) {
            res.status(400).json({ error: 'GHL not connected' });
            return;
        }

        const apiKey = conn.privateApiKey;
        if (!apiKey) {
            res.status(400).json({ error: 'Private Integration API Key requerida. Configurala en la seccion de integraciones.' });
            return;
        }

        const fieldsToCreate = [
            { name: 'Producto de Interes', dataType: 'TEXT', placeholder: 'Ej: Curso de IA para Arquitectos' },
            { name: 'Tipo de Producto', dataType: 'SINGLE_OPTIONS', options: ['Curso', 'Programa', 'Webinar', 'Taller', 'Suscripcion', 'Asesoria', 'Postulacion'] },
            { name: 'Presupuesto', dataType: 'MONETORY', placeholder: '0.00' },
            { name: 'Modalidad Preferida', dataType: 'SINGLE_OPTIONS', options: ['Online', 'Presencial', 'Hibrido'] },
            { name: 'Nivel Educativo', dataType: 'SINGLE_OPTIONS', options: ['Secundaria', 'Universitario', 'Postgrado', 'Profesional', 'Otro'] },
            { name: 'Ocupacion Actual', dataType: 'TEXT', placeholder: 'Ej: Arquitecto, Estudiante, etc.' },
            { name: 'Horario Preferido', dataType: 'SINGLE_OPTIONS', options: ['Manana', 'Tarde', 'Noche', 'Fines de semana'] },
            { name: 'Fuente de Referencia', dataType: 'SINGLE_OPTIONS', options: ['Meta Ads', 'Google Ads', 'TikTok Ads', 'Referido', 'Organico', 'Webinar', 'Evento', 'LinkedIn', 'WhatsApp'] },
            { name: 'Fecha de Interes', dataType: 'DATE' },
            { name: 'Notas del Asesor', dataType: 'LARGE_TEXT', placeholder: 'Notas internas sobre el prospecto...' },
        ];

        // Fetch existing fields to update or skip
        let existingFields: { id: string; name: string; picklistOptions?: string[]; placeholder?: string }[] = [];
        try {
            const existingData = await ghlPrivateFetch(apiKey, `/locations/${conn.locationId}/customFields?model=contact`);
            const rawFields = existingData.customFields || existingData.data || [];
            existingFields = rawFields.map((f: any) => ({
                id: f.id,
                name: (f.name || '').toLowerCase().trim(),
                picklistOptions: f.picklistOptions || f.options || [],
                placeholder: f.placeholder || '',
            }));
        } catch {
            // If we can't fetch, proceed to create all
        }

        const results: { field: string; status: string; id?: string; error?: string }[] = [];

        for (const field of fieldsToCreate) {
            const existing = existingFields.find(e => e.name === field.name.toLowerCase().trim());

            if (existing) {
                // Check if options or placeholder need updating
                const needsUpdate =
                    ((field as any).options && JSON.stringify((field as any).options) !== JSON.stringify(existing.picklistOptions))
                    || ((field as any).placeholder && (field as any).placeholder !== existing.placeholder);

                if (needsUpdate) {
                    try {
                        const updateData: any = { name: field.name };
                        if ((field as any).options) updateData.options = (field as any).options;
                        if ((field as any).placeholder) updateData.placeholder = (field as any).placeholder;
                        await ghlPrivateFetch(apiKey, `/locations/${conn.locationId}/customFields/${existing.id}`, {
                            method: 'PUT',
                            body: JSON.stringify(updateData),
                        });
                        results.push({ field: field.name, status: 'updated', id: existing.id });
                    } catch (err: any) {
                        results.push({ field: field.name, status: 'error', error: err.message });
                    }
                } else {
                    results.push({ field: field.name, status: 'exists', id: existing.id });
                }
            } else {
                try {
                    const created = await ghlPrivateFetch(apiKey, `/locations/${conn.locationId}/customFields`, {
                        method: 'POST',
                        body: JSON.stringify({
                            name: field.name,
                            dataType: field.dataType,
                            placeholder: (field as any).placeholder,
                            options: (field as any).options,
                            model: 'contact',
                        }),
                    });
                    results.push({ field: field.name, status: 'created', id: created.customField?.id || created.id });
                } catch (err: any) {
                    results.push({ field: field.name, status: 'error', error: err.message });
                }
            }
        }

        const created = results.filter(r => r.status === 'created').length;
        const updated = results.filter(r => r.status === 'updated').length;
        const existing = results.filter(r => r.status === 'exists').length;
        const errors = results.filter(r => r.status === 'error').length;

        const parts: string[] = [];
        if (created) parts.push(`${created} creados`);
        if (updated) parts.push(`${updated} actualizados`);
        if (existing) parts.push(`${existing} sin cambios`);
        if (errors) parts.push(`${errors} errores`);

        res.json({
            message: parts.join(', ') || 'Operacion completada',
            results,
        });
    } catch (err: any) {
        console.error('GHL setup fields error:', err);
        res.status(500).json({ error: err.message || 'Error al crear campos' });
    }
});

// GET /api/integrations/ghl/custom-fields — List custom fields from GHL
router.get('/ghl/custom-fields', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const conn = await db.ghlConnection.findUnique({ where: { orgId } });
        if (!conn || !conn.isActive) {
            res.status(400).json({ error: 'GHL not connected' });
            return;
        }

        const data = await ghlSmartFetch(conn, `/locations/${conn.locationId}/customFields?model=contact`);
        console.log('GHL customFields response keys:', Object.keys(data || {}), 'count:', (data?.customFields || data?.data || []).length);
        res.json(data);
    } catch (err: any) {
        console.error('GHL custom fields error:', err);
        res.status(500).json({ error: err.message || 'Internal server error' });
    }
});

// PUT /api/integrations/ghl/custom-fields/:fieldId — Update a custom field in GHL
router.put('/ghl/custom-fields/:fieldId', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const conn = await db.ghlConnection.findUnique({ where: { orgId } });
        if (!conn || !conn.isActive) {
            res.status(400).json({ error: 'GHL not connected' });
            return;
        }

        const apiKey = conn.privateApiKey;
        if (!apiKey) {
            res.status(400).json({ error: 'Private Integration API Key requerida' });
            return;
        }

        const { fieldId } = req.params;
        const { name, placeholder, options } = req.body;

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (placeholder !== undefined) updateData.placeholder = placeholder;
        if (options !== undefined) updateData.options = options;

        const data = await ghlPrivateFetch(apiKey, `/locations/${conn.locationId}/customFields/${fieldId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData),
        });

        res.json(data);
    } catch (err: any) {
        console.error('GHL update custom field error:', err);
        res.status(500).json({ error: err.message || 'Error al actualizar campo' });
    }
});

// DELETE /api/integrations/ghl/custom-fields/:fieldId — Delete a custom field from GHL
router.delete('/ghl/custom-fields/:fieldId', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const conn = await db.ghlConnection.findUnique({ where: { orgId } });
        if (!conn || !conn.isActive) {
            res.status(400).json({ error: 'GHL not connected' });
            return;
        }

        const apiKey = conn.privateApiKey;
        if (!apiKey) {
            res.status(400).json({ error: 'Private Integration API Key requerida' });
            return;
        }

        const { fieldId } = req.params;
        const data = await ghlPrivateFetch(apiKey, `/locations/${conn.locationId}/customFields/${fieldId}`, {
            method: 'DELETE',
        });

        res.json(data);
    } catch (err: any) {
        console.error('GHL delete custom field error:', err);
        res.status(500).json({ error: err.message || 'Error al eliminar campo' });
    }
});

export default router;
