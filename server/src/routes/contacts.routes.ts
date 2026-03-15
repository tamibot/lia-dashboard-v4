import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { param } from '../utils/helpers.js';

const prisma = new PrismaClient();
const router = Router();
router.use(authenticate);

// Build shared where clause from query params
function buildContactWhere(orgId: string, query: any) {
    const { stage, origin, search, dateFrom, dateTo } = query;
    const where: any = { orgId, isActive: true };

    if (stage) where.stage = stage;
    if (origin) where.origin = origin;
    if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = new Date(dateFrom as string);
        if (dateTo) {
            const end = new Date(dateTo as string);
            end.setHours(23, 59, 59, 999);
            where.createdAt.lte = end;
        }
    }
    if (search) {
        where.OR = [
            { name: { contains: search as string, mode: 'insensitive' } },
            { phone: { contains: search as string } },
            { email: { contains: search as string, mode: 'insensitive' } },
            { courseInterest: { contains: search as string, mode: 'insensitive' } },
        ];
    }

    return where;
}

// GET /api/contacts - List contacts for the org (cursor-based pagination)
router.get('/', async (req: Request, res: Response) => {
    try {
        const { cursor, limit = '50' } = req.query;
        const orgId = req.user!.orgId;
        const where = buildContactWhere(orgId, req.query);
        const take = Math.min(parseInt(limit as string) || 50, 200);

        const findArgs: any = {
            where,
            orderBy: { createdAt: 'desc' },
            take,
        };

        if (cursor) {
            findArgs.cursor = { id: cursor as string };
            findArgs.skip = 1; // skip the cursor item itself
        }

        const [contacts, total] = await Promise.all([
            prisma.contact.findMany(findArgs),
            prisma.contact.count({ where }),
        ]);

        const nextCursor = contacts.length === take
            ? contacts[contacts.length - 1].id
            : null;

        res.json({ contacts, nextCursor, total });
    } catch (err) {
        console.error('List contacts error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/contacts/export - Export contacts as CSV
router.get('/export', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const where = buildContactWhere(orgId, req.query);

        const contacts = await prisma.contact.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        // CSV escape helper: wraps value in quotes if it contains commas, quotes, or newlines
        const csvEscape = (val: string): string => {
            if (val.includes(',') || val.includes('"') || val.includes('\n') || val.includes('\r')) {
                return '"' + val.replace(/"/g, '""') + '"';
            }
            return val;
        };

        const header = 'Nombre,Email,Telefono,Ciudad,Pais,Etapa,Origen,Etiquetas,Fecha';
        const rows = contacts.map(c => {
            const tags = Array.isArray(c.tags) ? (c.tags as string[]).join('; ') : '';
            const fecha = c.createdAt
                ? new Date(c.createdAt).toISOString().split('T')[0]
                : '';
            return [
                csvEscape(c.name || ''),
                csvEscape(c.email || ''),
                csvEscape(c.phone || ''),
                csvEscape(c.city || ''),
                csvEscape(c.country || ''),
                csvEscape(c.stage || ''),
                csvEscape(c.origin || ''),
                csvEscape(tags),
                csvEscape(fecha),
            ].join(',');
        });

        const csv = [header, ...rows].join('\r\n');

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename=contactos.csv');
        // BOM for Excel UTF-8 compatibility
        res.send('\uFEFF' + csv);
    } catch (err) {
        console.error('Export contacts error:', err);
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

// POST /api/contacts/auto-assign - Round-robin assignment of a contact to a team member
router.post('/auto-assign/:id', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const contactId = param(req, 'id');

        const contact = await prisma.contact.findFirst({ where: { id: contactId, orgId } });
        if (!contact) { res.status(404).json({ error: 'Contact not found' }); return; }

        // Get all active team members through the org's teams
        const teams = await prisma.team.findMany({
            where: { orgId },
            select: { id: true },
        });
        const teamIds = teams.map(t => t.id);
        const teamMembers = await prisma.teamMember.findMany({
            where: { teamId: { in: teamIds }, isAvailable: true },
        });

        if (teamMembers.length === 0) {
            res.status(400).json({ error: 'No team members available for assignment' });
            return;
        }

        // Filter out members on vacation
        const available = teamMembers.filter((m: any) => m.availability !== 'vacation');
        const pool = available.length > 0 ? available : teamMembers;

        // Round-robin: count contacts per advisor using raw SQL, assign to least loaded
        const assignmentCounts = await prisma.$queryRaw<{ assigned_to: string; cnt: bigint }[]>`
            SELECT assigned_to, COUNT(*) as cnt FROM contacts
            WHERE org_id = ${orgId} AND is_active = true AND assigned_to IS NOT NULL
            GROUP BY assigned_to
        `;

        const countMap: Record<string, number> = {};
        for (const a of assignmentCounts) {
            if (a.assigned_to) countMap[a.assigned_to] = Number(a.cnt);
        }

        // Find the team member with fewest assignments
        let minCount = Infinity;
        let selectedMember = pool[0];
        for (const member of pool) {
            const count = countMap[member.id] || 0;
            if (count < minCount) {
                minCount = count;
                selectedMember = member;
            }
        }

        // Assign the contact
        const updated = await prisma.$executeRaw`
            UPDATE contacts SET assigned_to = ${selectedMember.id},
            stage = ${contact.stage === 'nuevo' ? 'contactado' : contact.stage}
            WHERE id = ${contactId}
        `;
        const updatedContact = await prisma.contact.findUnique({ where: { id: contactId } });

        res.json({
            contact: updatedContact,
            assignedTo: {
                id: selectedMember.id,
                name: selectedMember.name,
                email: selectedMember.email,
                phone: (selectedMember as any).phone,
            },
        });
    } catch (err) {
        console.error('Auto-assign error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/contacts/transfer - Create contact from agent transfer + notify advisor
router.post('/transfer', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const { name, email, phone, courseInterest, notes, advisorId, conversationSummary } = req.body;

        // Create the contact
        const contactNotes = conversationSummary
            ? `[Transferencia LIA] ${conversationSummary}${notes ? '\n\n' + notes : ''}`
            : notes || null;

        const contact = await prisma.contact.create({
            data: {
                orgId,
                name: name || 'Lead de LIA',
                email: email || null,
                phone: phone || null,
                courseInterest: courseInterest || null,
                stage: 'interesado',
                origin: 'agente_lia' as any,
                notes: contactNotes,
                tags: ['transfer_lia'],
            },
        });

        // Assign advisor via raw SQL (assignedTo field added via migration)
        if (advisorId) {
            await prisma.$executeRaw`UPDATE contacts SET assigned_to = ${advisorId} WHERE id = ${contact.id}`;
        }

        // If advisor is assigned, try to notify via webhook (if GHL is connected)
        if (advisorId) {
            try {
                const conn = await prisma.ghlConnection.findUnique({ where: { orgId } });
                if (conn?.isActive && conn.locationId) {
                    const token = conn.privateApiKey || conn.accessToken;
                    const GHL_API = 'https://services.leadconnectorhq.com';

                    // Create task in GHL for the advisor
                    await fetch(`${GHL_API}/contacts/`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Version': '2021-07-28',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            locationId: conn.locationId,
                            name: name || 'Lead de LIA',
                            email,
                            phone,
                            tags: ['transfer_lia', 'agente_automatico'],
                            customFields: courseInterest ? [{ key: 'course_interest', value: courseInterest }] : [],
                        }),
                    });
                }
            } catch (webhookErr) {
                console.warn('GHL notification failed (non-blocking):', webhookErr);
            }
        }

        res.status(201).json({ contact, message: 'Transfer registered successfully' });
    } catch (err) {
        console.error('Transfer error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
