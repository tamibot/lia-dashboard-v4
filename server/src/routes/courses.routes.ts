import { Router } from 'express';
import type { Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { generateCode } from '../utils/codeGenerator.js';
import { param } from '../utils/helpers.js';

const prisma = new PrismaClient();
const router = Router();


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

        const commonData = {
            ...data,
            orgId,
            code,
            price: data.price !== undefined ? Number(data.price) || 0 : undefined,
            pricePerHour: data.pricePerHour !== undefined ? Number(data.pricePerHour) || 0 : undefined,
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
                data: { ...commonData, programCourses: courses?.length ? { create: courses } : undefined },
                include: { programCourses: true, attachments: true, faqs: true }
            });
        } else if (type === 'webinar') {
            result = await prisma.webinar.create({ data: commonData, include: { attachments: true, faqs: true } });
        } else if (type === 'taller') {
            result = await prisma.taller.create({ data: commonData, include: { attachments: true, faqs: true } });
        } else if (type === 'subscripcion') {
            result = await prisma.subscription.create({ data: commonData, include: { attachments: true, faqs: true } });
        } else if (type === 'asesoria') {
            result = await prisma.asesoria.create({ data: commonData, include: { attachments: true, faqs: true } });
        } else if (type === 'postulacion') {
            result = await prisma.application.create({ data: commonData, include: { attachments: true, faqs: true } });
        } else {
            result = await prisma.course.create({
                data: { ...commonData, syllabusModules: syllabus?.length ? { create: syllabus } : undefined },
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

            return txModel.update({
                where: { id },
                data,
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
