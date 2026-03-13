import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { generateCode } from '../utils/codeGenerator.js';
import { param } from '../utils/helpers.js';

const prisma = new PrismaClient();
const router = Router();

// ── Per-model allowed fields (prevents Prisma crash from unknown fields) ──
const ALLOWED_FIELDS: Record<string, Set<string>> = {
    course: new Set([
        'title', 'subtitle', 'description', 'objectives', 'targetAudience', 'modality',
        'startDate', 'endDate', 'duration', 'totalHours', 'schedule',
        'instructor', 'instructorBio', 'price', 'currency', 'earlyBirdPrice', 'earlyBirdDeadline',
        'promotions', 'requirements', 'contactInfo',
        'benefits', 'painPoints', 'guarantee', 'socialProof', 'bonuses',
        'maxStudents', 'prerequisites', 'certification', 'registrationLink', 'paymentMethods',
        'location', 'category', 'tags', 'tools', 'status', 'aiSummary',
        'callToAction', 'idealStudentProfile', 'competitiveAdvantage', 'urgencyTriggers',
        'objectionHandlers', 'successStories',
    ]),
    program: new Set([
        'title', 'subtitle', 'description', 'objectives', 'targetAudience', 'modality',
        'startDate', 'endDate', 'totalDuration', 'totalHours', 'coordinator', 'schedule',
        'price', 'currency', 'earlyBirdPrice', 'promotions', 'requirements', 'contactInfo',
        'benefits', 'painPoints', 'guarantee', 'socialProof', 'bonuses',
        'maxStudents', 'prerequisites', 'certification', 'certifyingEntity',
        'registrationLink', 'paymentMethods', 'whatsappGroup', 'includesProject',
        'location', 'category', 'tags', 'tools', 'status', 'aiSummary',
        'callToAction', 'idealStudentProfile', 'competitiveAdvantage', 'urgencyTriggers',
        'objectionHandlers', 'successStories',
    ]),
    webinar: new Set([
        'title', 'subtitle', 'description', 'webinarFormat',
        'speaker', 'speakerBio', 'speakerTitle',
        'eventDate', 'eventTime', 'duration', 'modality', 'platform',
        'price', 'currency', 'maxAttendees', 'topics', 'keyTopics',
        'targetAudience', 'callToAction', 'requirements', 'contactInfo',
        'benefits', 'painPoints', 'guarantee', 'socialProof', 'bonuses',
        'registrationLink', 'paymentMethods', 'promotions',
        'location', 'category', 'tags', 'tools', 'status', 'aiSummary',
        'idealStudentProfile', 'competitiveAdvantage', 'urgencyTriggers',
        'objectionHandlers', 'successStories',
    ]),
    taller: new Set([
        'title', 'subtitle', 'description', 'objectives', 'targetAudience', 'modality',
        'eventDate', 'eventTime', 'duration', 'totalHours', 'schedule',
        'instructor', 'instructorBio',
        'venue', 'venueAddress', 'venueCapacity', 'location',
        'price', 'currency', 'earlyBirdPrice', 'earlyBirdDeadline',
        'promotions', 'registrationLink', 'paymentMethods',
        'maxParticipants', 'availableSpots', 'waitlistEnabled',
        'materials', 'deliverables', 'certification', 'requirements', 'contactInfo',
        'benefits', 'painPoints', 'guarantee', 'socialProof', 'bonuses',
        'tools', 'category', 'tags', 'status', 'aiSummary',
        'callToAction', 'idealStudentProfile', 'competitiveAdvantage', 'urgencyTriggers',
        'objectionHandlers', 'successStories',
    ]),
    subscription: new Set([
        'title', 'subtitle', 'description', 'benefits', 'features',
        'price', 'currency', 'period', 'maxUsers', 'promotions',
        'targetAudience', 'objectives', 'requirements', 'contactInfo',
        'advisoryHours', 'whatsappGroup', 'communityAccess',
        'registrationLink', 'paymentMethods',
        'painPoints', 'guarantee', 'socialProof', 'bonuses',
        'tools', 'location', 'category', 'tags', 'status', 'aiSummary',
        'callToAction', 'idealStudentProfile', 'competitiveAdvantage', 'urgencyTriggers',
        'objectionHandlers', 'successStories',
    ]),
    asesoria: new Set([
        'title', 'subtitle', 'description', 'objectives', 'targetAudience', 'modality',
        'pricePerHour', 'currency', 'minimumHours', 'packageHours', 'packagePrice',
        'promotions', 'paymentMethods',
        'advisor', 'advisorBio', 'advisorTitle', 'specialties',
        'bookingLink', 'registrationLink', 'minAdvanceBooking',
        'availableSchedule', 'sessionDuration',
        'topicsCovered', 'deliverables', 'requirements', 'contactInfo', 'needsDescription',
        'benefits', 'painPoints', 'guarantee', 'socialProof', 'bonuses',
        'tools', 'location', 'category', 'tags', 'status', 'aiSummary',
        'callToAction', 'idealStudentProfile', 'competitiveAdvantage', 'urgencyTriggers',
        'objectionHandlers', 'successStories',
    ]),
    application: new Set([
        'title', 'subtitle', 'description', 'price', 'currency',
        'requirements', 'deadline', 'availableSlots', 'modality',
        'startDate', 'duration', 'promotions', 'targetAudience', 'objectives', 'contactInfo',
        'examRequired', 'examDescription', 'applicationFee',
        'steps', 'documentsNeeded', 'selectionCriteria',
        'registrationLink', 'paymentMethods',
        'benefits', 'painPoints', 'guarantee', 'socialProof', 'bonuses',
        'tools', 'location', 'category', 'tags', 'status', 'aiSummary',
        'callToAction', 'idealStudentProfile', 'competitiveAdvantage', 'urgencyTriggers',
        'objectionHandlers', 'successStories',
    ]),
};

/** Filter object to only include fields valid for the given Prisma model */
function filterByModel(data: Record<string, any>, modelName: string): Record<string, any> {
    const allowed = ALLOWED_FIELDS[modelName];
    if (!allowed) return data;
    const filtered: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
        if (allowed.has(key)) filtered[key] = value;
    }
    return filtered;
}


// All routes require authentication
router.use(authenticate);

// GET /api/courses - List all items based on type
router.get('/', async (req: Request, res: Response) => {
    try {
        const { status, category, search, type, orgId: queryOrgId } = req.query;
        const orgId = req.user!.orgId;

        const where: any = { orgId };
        if (status) where.status = status;
        if (category) where.category = category;
        if (search) {
            where.OR = [
                { title: { contains: search as string, mode: 'insensitive' } },
                { code: { contains: search as string, mode: 'insensitive' } },
                { description: { contains: search as string, mode: 'insensitive' } },
            ];
        }

        switch (type) {
            case 'programa':
                return res.json(await prisma.program.findMany({
                    where,
                    include: { programCourses: { orderBy: { sortOrder: 'asc' } }, attachments: true, faqs: { orderBy: { sortOrder: 'asc' } } },
                    orderBy: { updatedAt: 'desc' },
                }));
            case 'webinar':
                return res.json(await prisma.webinar.findMany({
                    where,
                    include: { attachments: true, faqs: { orderBy: { sortOrder: 'asc' } } },
                    orderBy: { updatedAt: 'desc' },
                }));
            case 'taller':
                return res.json(await prisma.taller.findMany({
                    where,
                    include: { attachments: true, faqs: { orderBy: { sortOrder: 'asc' } } },
                    orderBy: { updatedAt: 'desc' },
                }));
            case 'subscripcion':
                return res.json(await prisma.subscription.findMany({
                    where,
                    include: { attachments: true, faqs: { orderBy: { sortOrder: 'asc' } } },
                    orderBy: { updatedAt: 'desc' },
                }));
            case 'asesoria':
                return res.json(await prisma.asesoria.findMany({
                    where,
                    include: { attachments: true, faqs: { orderBy: { sortOrder: 'asc' } } },
                    orderBy: { updatedAt: 'desc' },
                }));
            case 'postulacion':
                return res.json(await prisma.application.findMany({
                    where,
                    include: { attachments: true, faqs: { orderBy: { sortOrder: 'asc' } } },
                    orderBy: { updatedAt: 'desc' },
                }));
            case 'curso':
            default:
                return res.json(await prisma.course.findMany({
                    where,
                    include: { syllabusModules: { orderBy: { sortOrder: 'asc' } }, attachments: true, faqs: { orderBy: { sortOrder: 'asc' } } },
                    orderBy: { updatedAt: 'desc' },
                }));
        }
    } catch (err) {
        console.error('List courses error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// GET /api/courses/:id - Get single item
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string as string;
        const type = req.query.type as string;
        const orgId = req.user!.orgId;

        const include = { attachments: true, faqs: { orderBy: { sortOrder: 'asc' as const } } };

        switch (type) {
            case 'programa':
                const program = await prisma.program.findFirst({ where: { id, orgId }, include: { ...include, programCourses: { orderBy: { sortOrder: 'asc' } } } });
                return program ? res.json({ ...program, type: 'programa' }) : res.status(404).json({ error: 'Program not found' });
            case 'webinar':
                const webinar = await prisma.webinar.findFirst({ where: { id, orgId }, include });
                return webinar ? res.json({ ...webinar, type: 'webinar' }) : res.status(404).json({ error: 'Webinar not found' });
            case 'taller':
                const taller = await prisma.taller.findFirst({ where: { id, orgId }, include });
                return taller ? res.json({ ...taller, type: 'taller' }) : res.status(404).json({ error: 'Taller not found' });
            case 'subscripcion':
                const subscription = await prisma.subscription.findFirst({ where: { id, orgId }, include });
                return subscription ? res.json({ ...subscription, type: 'subscripcion' }) : res.status(404).json({ error: 'Subscription not found' });
            case 'asesoria':
                const asesoria = await prisma.asesoria.findFirst({ where: { id, orgId }, include });
                return asesoria ? res.json({ ...asesoria, type: 'asesoria' }) : res.status(404).json({ error: 'Asesoria not found' });
            case 'postulacion':
                const application = await prisma.application.findFirst({ where: { id, orgId }, include });
                return application ? res.json({ ...application, type: 'postulacion' }) : res.status(404).json({ error: 'Application not found' });
            case 'curso':
            default:
                const course = await prisma.course.findFirst({ where: { id, orgId }, include: { ...include, syllabusModules: { orderBy: { sortOrder: 'asc' } }, team: true } });
                return course ? res.json({ ...course, type: 'curso' }) : res.status(404).json({ error: 'Course not found' });
        }
    } catch (err) {
        console.error('Get course error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/courses - Create a new item
router.post('/', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const { type, syllabus, attachments, faqs, courses, ...data } = req.body;

        // Code Generation
        const prefixMap: any = { curso: 'CRS', programa: 'PRG', webinar: 'WBN', taller: 'TLR', subscripcion: 'SUB', asesoria: 'ASE', postulacion: 'ADM' };
        const prefix = prefixMap[type] || 'ITEM';
        const modelMap: any = { curso: 'course', programa: 'program', webinar: 'webinar', taller: 'taller', subscripcion: 'subscription', asesoria: 'asesoria', postulacion: 'application' };
        const modelName = modelMap[type] || 'course';

        const count = await (prisma[modelName as keyof PrismaClient] as any).count({ where: { orgId } });
        const code = data.code || generateCode(prefix, data.category || '', count);

        // Filter fields to only those valid for this model (prevents Prisma crash)
        const filteredData = filterByModel(data, modelName);

        // Coerce numeric fields
        if (filteredData.price !== undefined) filteredData.price = Number(filteredData.price) || 0;
        if (filteredData.pricePerHour !== undefined) filteredData.pricePerHour = Number(filteredData.pricePerHour) || 0;
        if (filteredData.totalHours !== undefined) filteredData.totalHours = parseInt(filteredData.totalHours) || 0;
        if (filteredData.maxStudents !== undefined) filteredData.maxStudents = parseInt(filteredData.maxStudents) || null;
        if (filteredData.maxParticipants !== undefined) filteredData.maxParticipants = parseInt(filteredData.maxParticipants) || null;
        if (filteredData.maxAttendees !== undefined) filteredData.maxAttendees = parseInt(filteredData.maxAttendees) || null;
        if (filteredData.maxUsers !== undefined) filteredData.maxUsers = parseInt(filteredData.maxUsers) || null;
        if (filteredData.availableSlots !== undefined) filteredData.availableSlots = parseInt(filteredData.availableSlots) || null;
        if (filteredData.minimumHours !== undefined) filteredData.minimumHours = parseInt(filteredData.minimumHours) || 1;
        if (filteredData.packageHours !== undefined) filteredData.packageHours = parseInt(filteredData.packageHours) || null;
        if (filteredData.packagePrice !== undefined) filteredData.packagePrice = Number(filteredData.packagePrice) || null;
        if (filteredData.earlyBirdPrice !== undefined) filteredData.earlyBirdPrice = Number(filteredData.earlyBirdPrice) || null;
        if (filteredData.applicationFee !== undefined) filteredData.applicationFee = Number(filteredData.applicationFee) || null;
        if (filteredData.advisoryHours !== undefined) filteredData.advisoryHours = parseInt(filteredData.advisoryHours) || null;

        // Normalize enum fields (Gemini may return English or capitalized variants)
        if (filteredData.modality !== undefined) {
            const m = String(filteredData.modality).toLowerCase();
            const modalityMap: Record<string, string> = {
                virtual: 'online', remoto: 'online', remote: 'online', 'en linea': 'online', 'en línea': 'online', online: 'online',
                presencial: 'presencial', 'in-person': 'presencial', inperson: 'presencial', 'on-site': 'presencial',
                hibrido: 'hibrido', híbrido: 'hibrido', hybrid: 'hibrido', híbrida: 'hibrido',
            };
            filteredData.modality = modalityMap[m] ?? 'online';
        }
        if (filteredData.status !== undefined) {
            const s = String(filteredData.status).toLowerCase();
            const statusMap: Record<string, string> = {
                borrador: 'borrador', draft: 'borrador', borrrador: 'borrador',
                activo: 'activo', active: 'activo', published: 'activo', publicado: 'activo',
                archivado: 'archivado', archived: 'archivado', inactive: 'archivado',
            };
            filteredData.status = statusMap[s] ?? 'borrador';
        }

        // Coerce DateTime fields (Prisma needs ISO 8601, not bare date strings)
        const dateFields = ['startDate', 'endDate', 'eventDate', 'deadline', 'earlyBirdDeadline'];
        for (const field of dateFields) {
            if (filteredData[field] && typeof filteredData[field] === 'string') {
                const d = new Date(filteredData[field]);
                filteredData[field] = isNaN(d.getTime()) ? undefined : d.toISOString();
            }
        }

        // Ensure string arrays are actually string arrays (Gemini sometimes returns objects)
        const stringArrayFields = ['objectives', 'requirements', 'benefits', 'painPoints', 'socialProof',
            'bonuses', 'urgencyTriggers', 'tags', 'tools', 'paymentMethods', 'features',
            'specialties', 'topicsCovered', 'deliverables', 'materials', 'steps',
            'documentsNeeded', 'selectionCriteria', 'topics', 'keyTopics'];
        for (const field of stringArrayFields) {
            if (Array.isArray(filteredData[field])) {
                filteredData[field] = filteredData[field].map((item: any) =>
                    typeof item === 'string' ? item
                    : typeof item === 'object' ? Object.values(item).filter(Boolean).join(' - ')
                    : String(item)
                );
            }
        }

        // Ensure string fields are actually strings (Gemini sometimes returns objects)
        const stringFields = ['title', 'subtitle', 'description', 'targetAudience', 'duration',
            'totalDuration', 'instructor', 'instructorBio', 'speaker', 'speakerBio', 'speakerTitle',
            'advisor', 'advisorBio', 'advisorTitle', 'coordinator', 'venue', 'venueAddress',
            'certification', 'guarantee', 'callToAction', 'idealStudentProfile',
            'competitiveAdvantage', 'sessionDuration', 'availableSchedule', 'schedule',
            'category', 'aiSummary', 'location', 'promotions', 'prerequisites',
            'communityAccess', 'whatsappGroup', 'bookingLink', 'registrationLink'];
        for (const field of stringFields) {
            if (filteredData[field] !== undefined && typeof filteredData[field] === 'object' && filteredData[field] !== null) {
                filteredData[field] = Object.entries(filteredData[field])
                    .filter(([, v]) => v)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join('. ');
            }
        }

        const commonData = {
            ...filteredData,
            orgId,
            code,
            attachments: attachments?.length ? {
                create: attachments.map((att: any) => ({
                    entityType: modelName,
                    name: att.name,
                    url: att.url,
                    fileType: att.type || 'pdf',
                    fileSize: att.size,
                })),
            } : undefined,
            faqs: faqs?.length ? {
                create: faqs.map((faq: any, i: number) => ({
                    entityType: modelName,
                    question: faq.question,
                    answer: faq.answer,
                    sortOrder: i,
                })),
            } : undefined,
        };

        let result;
        if (type === 'programa') {
            result = await prisma.program.create({
                data: { ...commonData, programCourses: courses?.length ? { create: courses } : undefined } as any,
                include: { programCourses: true, attachments: true, faqs: true }
            });
        } else if (type === 'webinar') {
            result = await prisma.webinar.create({ data: commonData as any, include: { attachments: true, faqs: true } });
        } else if (type === 'taller') {
            result = await prisma.taller.create({ data: commonData as any, include: { attachments: true, faqs: true } });
        } else if (type === 'subscripcion') {
            result = await prisma.subscription.create({ data: commonData as any, include: { attachments: true, faqs: true } });
        } else if (type === 'asesoria') {
            result = await prisma.asesoria.create({ data: commonData as any, include: { attachments: true, faqs: true } });
        } else if (type === 'postulacion') {
            result = await prisma.application.create({ data: commonData as any, include: { attachments: true, faqs: true } });
        } else {
            result = await prisma.course.create({
                data: { ...commonData, syllabusModules: syllabus?.length ? { create: syllabus } : undefined } as any,
                include: { syllabusModules: true, attachments: true, faqs: true }
            });
        }

        res.status(201).json(result);
    } catch (err) {
        console.error('Create course error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/courses/:id - Update an item
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const id = req.params.id as string;
        const { type, syllabus, attachments, faqs, courses, ...data } = req.body;

        const modelMap: any = { curso: 'course', programa: 'program', webinar: 'webinar', taller: 'taller', subscripcion: 'subscription', asesoria: 'asesoria', postulacion: 'application' };
        const modelName = modelMap[type] || 'course';
        const prismaModel = prisma[modelName as keyof PrismaClient] as any;

        const existing = await prismaModel.findFirst({ where: { id, orgId } });
        if (!existing) return res.status(404).json({ error: 'Item not found' });

        const result = await prisma.$transaction(async (tx: any) => {
            const txModel = tx[modelName];

            if (syllabus && modelName === 'course') {
                await tx.syllabusModule.deleteMany({ where: { courseId: id } });
                await tx.syllabusModule.createMany({ data: syllabus.map((m: any, i: number) => ({ ...m, courseId: id, sortOrder: i })) });
            }
            if (courses && modelName === 'program') {
                await tx.programCourse.deleteMany({ where: { programId: id } });
                await tx.programCourse.createMany({ data: courses.map((c: any, i: number) => ({ ...c, programId: id, sortOrder: i })) });
            }
            if (attachments) {
                await tx.attachment.deleteMany({ where: { [`${modelName}Id`]: id } });
                await tx.attachment.createMany({ data: attachments.map((a: any) => ({ ...a, [`${modelName}Id`]: id, entityType: modelName })) });
            }
            if (faqs) {
                await tx.faq.deleteMany({ where: { [`${modelName}Id`]: id } });
                await tx.faq.createMany({ data: faqs.map((f: any, i: number) => ({ ...f, [`${modelName}Id`]: id, entityType: modelName, sortOrder: i })) });
            }

            // Filter to valid fields for this model
            const safeData = filterByModel(data, modelName);

            // Normalize enum fields
            if (safeData.modality !== undefined) {
                const m = String(safeData.modality).toLowerCase();
                const modalityMap: Record<string, string> = {
                    virtual: 'online', remoto: 'online', remote: 'online', online: 'online',
                    presencial: 'presencial', 'in-person': 'presencial', inperson: 'presencial',
                    hibrido: 'hibrido', híbrido: 'hibrido', hybrid: 'hibrido',
                };
                safeData.modality = modalityMap[m] ?? 'online';
            }
            if (safeData.status !== undefined) {
                const s = String(safeData.status).toLowerCase();
                const statusMap: Record<string, string> = {
                    borrador: 'borrador', draft: 'borrador',
                    activo: 'activo', active: 'activo', published: 'activo', publicado: 'activo',
                    archivado: 'archivado', archived: 'archivado',
                };
                safeData.status = statusMap[s] ?? 'borrador';
            }

            return txModel.update({
                where: { id },
                data: safeData,
                include: {
                    attachments: true,
                    faqs: { orderBy: { sortOrder: 'asc' } },
                    ...(modelName === 'course' ? { syllabusModules: { orderBy: { sortOrder: 'asc' } } } : {}),
                    ...(modelName === 'program' ? { programCourses: { orderBy: { sortOrder: 'asc' } } } : {}),
                }
            });
        });

        res.json(result);
    } catch (err) {
        console.error('Update course error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/courses/:id
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const orgId = req.user!.orgId;
        const id = req.params.id as string;
        const type = req.query.type as string;

        const modelMap: any = { curso: 'course', programa: 'program', webinar: 'webinar', taller: 'taller', subscripcion: 'subscription', asesoria: 'asesoria', postulacion: 'application' };
        const modelName = modelMap[type] || 'course';
        const prismaModel = prisma[modelName as keyof PrismaClient] as any;

        const existing = await prismaModel.findFirst({ where: { id, orgId } });
        if (!existing) return res.status(404).json({ error: 'Item not found' });

        await prismaModel.delete({ where: { id } });
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        console.error('Delete course error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
