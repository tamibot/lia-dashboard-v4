import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Seed the database with a demo organization, admin user, and sample catalog items.
 */
async function main() {
    console.log('🌱 Seeding database...\n');

    // 1. Create demo organization
    const org = await prisma.organization.upsert({
        where: { slug: 'innovation-institute' },
        update: {},
        create: {
            slug: 'innovation-institute',
            name: 'Instituto de Innovación para Arquitectos',
            type: 'instituto',
            description: 'Instituto líder en formación de arquitectos con inteligencia artificial y tecnología.',
            tagline: 'Transformando la arquitectura con IA',
            website: 'https://innovation-institute.edu',
            contactEmail: 'info@innovation-institute.edu',
            branding: {
                colors: { primary: '#2563EB', secondary: '#3B82F6', accent: '#F59E0B', neutral: '#6B7280' },
                typography: { headings: 'Inter', body: 'Inter' },
                voice: { tone: 'profesional', style: 'Experto, claro y cercano', keywords: ['innovación', 'IA', 'arquitectura'] },
                visualIdentity: { mood: 'Moderno y tecnológico', shapes: 'rounded' },
            },
            socialMedia: {
                instagram: '@innovationinst',
                linkedin: 'innovation-institute',
                youtube: '@innovationinstitute',
            },
            courseCategories: ['Inteligencia Artificial', 'Arquitectura', 'Programación', 'Diseño', 'Consultoría'],
            onboardingComplete: true,
        },
    });
    console.log(`✅ Organization: ${org.name} (${org.id})`);

    // 2. Create admin user
    const passwordHash = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@innovation-institute.edu' },
        update: {},
        create: {
            orgId: org.id,
            email: 'admin@innovation-institute.edu',
            passwordHash,
            name: 'Admin Principal',
            role: 'admin',
        },
    });
    console.log(`✅ Admin user: ${admin.email} (password: admin123)`);

    // 3. Create sample courses (Cursos)
    const courses = [
        {
            code: 'CRS-IA2024-001',
            title: 'IA para Arquitectos',
            description: 'Domina las mejores herramientas de inteligencia artificial aplicadas a la arquitectura. Aprenderás a usar IA para diseño, renderizado, presentaciones y optimización de proyectos.',
            category: 'Inteligencia Artificial',
            instructor: 'Arq. Carlos Méndez',
            instructorBio: 'Arquitecto con 15 años de experiencia y especialista en IA aplicada al diseño.',
            price: 1500,
            currency: 'PEN',
            modality: 'online' as const,
            duration: '6 semanas',
            totalHours: 36,
            objectives: ['Dominar herramientas de IA para arquitectura', 'Crear renders con IA', 'Optimizar presentaciones con herramientas inteligentes'],
            targetAudience: 'Arquitectos y estudiantes de arquitectura que buscan integrar IA en su práctica profesional',
            status: 'activo' as const,
            tags: ['IA', 'Arquitectura', 'Herramientas'],
            tools: ['Midjourney', 'Stable Diffusion', 'ChatGPT', 'SketchUp AI'],
            benefits: ['Certificado virtual', 'Acceso a comunidad exclusiva', 'Plantillas y recursos descargables'],
            requirements: ['Laptop con internet', 'Conocimientos básicos de arquitectura'],
            certification: 'Certificado en IA para Arquitectura',
            registrationLink: 'https://innovation-institute.edu/cursos/ia-arquitectos',
            paymentMethods: ['Tarjeta de crédito', 'Transferencia bancaria', 'Yape/Plin'],
        },
        {
            code: 'CRS-RENDER2024-002',
            title: 'Renderizado con IA Generativa',
            description: 'Aprende a crear renders fotorrealistas usando inteligencia artificial generativa.',
            category: 'Diseño',
            instructor: 'Arq. Ana Torres',
            price: 1200,
            currency: 'PEN',
            modality: 'online' as const,
            duration: '4 semanas',
            totalHours: 24,
            objectives: ['Generar renders con IA', 'Post-producción inteligente', 'Integración con flujos de trabajo existentes'],
            targetAudience: 'Arquitectos y diseñadores de interiores',
            status: 'activo' as const,
            tags: ['Renders', 'IA Generativa', 'Diseño'],
            tools: ['Midjourney', 'DALL-E', 'Photoshop AI'],
            benefits: ['Portfolio de renders con IA', 'Acceso de por vida al material'],
            requirements: ['Conocimientos básicos de diseño'],
            certification: 'Certificado en Renderizado IA',
            paymentMethods: ['Tarjeta de crédito', 'Transferencia bancaria'],
        },
    ];

    for (const courseData of courses) {
        const course = await prisma.course.upsert({
            where: { code: courseData.code },
            update: {},
            create: { orgId: org.id, ...courseData },
        });
        console.log(`✅ Course: ${course.title} (${course.code})`);
    }

    // 4. Create sample program (Programa)
    const program = await prisma.program.upsert({
        where: { code: 'PRG-IAPROG2024-001' },
        update: {},
        create: {
            orgId: org.id,
            code: 'PRG-IAPROG2024-001',
            title: 'IA y Programación para Arquitectos',
            description: 'Programa completo de 3 meses donde aprenderás a integrar IA y programación en tu práctica arquitectónica. Incluye proyecto final práctico.',
            category: 'Inteligencia Artificial',
            modality: 'online',
            totalDuration: '3 meses',
            totalHours: 120,
            price: 4500,
            currency: 'PEN',
            certification: 'Diplomado en IA y Programación para Arquitectura',
            certifyingEntity: 'Instituto de Innovación para Arquitectos',
            objectives: ['Dominar IA aplicada a arquitectura', 'Aprender programación visual', 'Desarrollar un proyecto integrador'],
            targetAudience: 'Arquitectos profesionales que buscan especializarse en tecnología',
            status: 'activo',
            tags: ['IA', 'Programación', 'Diplomado'],
            tools: ['Python', 'Grasshopper', 'ChatGPT', 'Midjourney'],
            benefits: ['Certificado de diplomado', 'Grupo de WhatsApp 24/7', 'Proyecto práctico terminado', 'Acceso a comunidad de egresados'],
            whatsappGroup: 'https://chat.whatsapp.com/example-program',
            includesProject: true,
            registrationLink: 'https://innovation-institute.edu/programas/ia-programacion',
            paymentMethods: ['Tarjeta de crédito', 'Transferencia bancaria', 'Cuotas sin interés'],
            requirements: ['Título de arquitecto o estudiante avanzado'],
        },
    });
    console.log(`✅ Program: ${program.title} (${program.code})`);

    // Create program modules
    await prisma.programCourse.deleteMany({ where: { programId: program.id } });
    await prisma.programCourse.createMany({
        data: [
            { programId: program.id, sortOrder: 0, title: 'Módulo 1: Fundamentos de IA', description: 'Introducción a IA, machine learning y herramientas generativas', hours: 40, instructor: 'Dr. Carlos Méndez', topics: ['Machine Learning', 'IA Generativa', 'Prompt Engineering'] },
            { programId: program.id, sortOrder: 1, title: 'Módulo 2: Programación Visual', description: 'Grasshopper, Python para diseño paramétrico', hours: 40, instructor: 'Arq. Luis García', topics: ['Grasshopper', 'Python', 'Diseño Paramétrico'] },
            { programId: program.id, sortOrder: 2, title: 'Módulo 3: Proyecto Integrador', description: 'Desarrollo de proyecto real integrando IA y programación', hours: 40, instructor: 'Arq. Ana Torres', topics: ['Proyecto Real', 'Integración', 'Presentación Final'] },
        ],
    });

    // 5. Create sample webinar
    const webinar = await prisma.webinar.upsert({
        where: { code: 'WBN-TEND2024-001' },
        update: {},
        create: {
            orgId: org.id,
            code: 'WBN-TEND2024-001',
            title: 'Tendencias de IA para Arquitectos',
            description: 'Webinar gratuito con ponentes internacionales sobre las últimas tendencias en inteligencia artificial aplicada a la arquitectura.',
            webinarFormat: 'webinar',
            speaker: 'Panel Internacional',
            speakerBio: 'Expertos internacionales en IA y arquitectura de España, México y Perú.',
            eventDate: new Date('2026-04-15'),
            eventTime: '19:00',
            duration: '2 horas',
            price: 0,
            currency: 'PEN',
            category: 'Inteligencia Artificial',
            targetAudience: 'Arquitectos, estudiantes y profesionales interesados en IA',
            status: 'activo',
            topics: ['IA Generativa', 'Diseño Computacional', 'Futuro de la Arquitectura'],
            keyTopics: ['Midjourney para arquitectura', 'Diseño paramétrico con IA', 'BIM + IA'],
            tags: ['Webinar', 'IA', 'Gratis', 'Internacional'],
            registrationLink: 'https://innovation-institute.edu/webinars/tendencias-ia',
            benefits: ['Acceso gratuito', 'Grabación disponible', 'Certificado de asistencia'],
            maxAttendees: 500,
        },
    });
    console.log(`✅ Webinar: ${webinar.title} (${webinar.code})`);

    // 6. Create sample talleres (Workshops)
    const tallerItems = [
        {
            code: 'TLR-IAUSO2024-001',
            title: 'Aprende a usar IA para Arquitectura',
            description: 'Taller presencial intensivo donde aprenderás a usar las principales herramientas de IA aplicadas a la arquitectura. Saldrás con un proyecto terminado y certificado.',
            modality: 'presencial' as const,
            duration: '3 horas',
            totalHours: 3,
            instructor: 'Arq. Carlos Méndez',
            instructorBio: 'Arquitecto con 15 años de experiencia, especialista en IA.',
            venue: 'Sala de Innovación - Miraflores',
            venueAddress: 'Av. Larco 1250, Miraflores, Lima',
            venueCapacity: 30,
            location: 'Lima, Perú',
            price: 150,
            currency: 'PEN',
            maxParticipants: 25,
            availableSpots: 15,
            waitlistEnabled: true,
            category: 'Inteligencia Artificial',
            targetAudience: 'Arquitectos que quieren una introducción práctica a las herramientas de IA',
            objectives: ['Usar Midjourney para renders', 'Crear presentaciones con IA', 'Automatizar tareas repetitivas'],
            materials: ['Laptop personal', 'Cuenta de Midjourney (se proporcionará trial)'],
            deliverables: ['Proyecto de render con IA terminado', 'Guía de herramientas en PDF'],
            certification: 'Certificado de Taller en IA para Arquitectura',
            registrationLink: 'https://innovation-institute.edu/talleres/ia-arquitectura',
            paymentMethods: ['Yape/Plin', 'Transferencia', 'Efectivo en sede'],
            benefits: ['Práctica hands-on', 'Certificado incluido', 'Material descargable', 'Networking con otros arquitectos'],
            requirements: ['Laptop con internet', 'Ganas de aprender'],
            tools: ['Midjourney', 'ChatGPT', 'Canva AI'],
            tags: ['Taller', 'Presencial', 'IA', 'Práctico'],
            status: 'activo' as const,
        },
        {
            code: 'TLR-BIM2024-002',
            title: 'BIM + IA: Taller Práctico',
            description: 'Taller presencial para integrar inteligencia artificial en flujos de trabajo BIM.',
            modality: 'presencial' as const,
            duration: '4 horas',
            totalHours: 4,
            instructor: 'Arq. Luis García',
            venue: 'Centro de Convenciones Lima',
            venueAddress: 'Jirón de la Unión 800, Lima',
            location: 'Lima, Perú',
            price: 200,
            currency: 'PEN',
            maxParticipants: 20,
            availableSpots: 8,
            category: 'Arquitectura',
            targetAudience: 'Arquitectos con experiencia en BIM',
            objectives: ['Integrar IA en Revit', 'Automatizar documentación', 'Generar renders desde BIM'],
            materials: ['Laptop con Revit instalado'],
            deliverables: ['Flujo de trabajo BIM+IA configurado'],
            certification: 'Certificado de Taller BIM+IA',
            registrationLink: 'https://innovation-institute.edu/talleres/bim-ia',
            paymentMethods: ['Tarjeta de crédito', 'Transferencia'],
            benefits: ['Práctica en Revit+IA', 'Template de automatización'],
            requirements: ['Experiencia previa en BIM/Revit'],
            tools: ['Revit', 'Dynamo', 'ChatGPT'],
            tags: ['Taller', 'BIM', 'IA'],
            status: 'activo' as const,
        },
    ];

    for (const tallerData of tallerItems) {
        const taller = await prisma.taller.upsert({
            where: { code: tallerData.code },
            update: {},
            create: { orgId: org.id, ...tallerData },
        });
        console.log(`✅ Taller: ${taller.title} (${taller.code})`);
    }

    // 7. Create sample subscriptions
    const subscriptionItems = [
        {
            code: 'SUB-ASESOR2024-001',
            title: 'Asesor IA para Arquitectura',
            description: 'Suscripción mensual que incluye horas de asesoría personalizada en IA para arquitectura y acceso a grupo de WhatsApp exclusivo para consultas.',
            benefits: ['2 horas de asesoría personalizada al mes', 'Acceso a grupo de WhatsApp 24/7', 'Material exclusivo mensual', 'Descuentos en cursos y talleres'],
            features: ['Sesiones 1:1 con experto', 'Grupo WhatsApp exclusivo', 'Recursos actualizados', 'Prioridad en eventos'],
            price: 500,
            currency: 'PEN',
            period: 'mensual',
            maxUsers: 1,
            advisoryHours: 2,
            whatsappGroup: 'https://chat.whatsapp.com/example-sub',
            communityAccess: 'Grupo privado de WhatsApp con expertos y otros suscriptores',
            registrationLink: 'https://innovation-institute.edu/suscripciones/asesor-ia',
            paymentMethods: ['Tarjeta de crédito', 'Transferencia bancaria', 'PayPal'],
            targetAudience: 'Arquitectos que necesitan acompañamiento continuo en IA',
            objectives: ['Recibir asesoría personalizada', 'Mantenerse actualizado en IA', 'Resolver dudas en tiempo real'],
            painPoints: ['No tener a quién consultar sobre IA', 'Información desactualizada', 'Falta de guía personalizada'],
            socialProof: ['Más de 50 arquitectos suscritos', '4.9/5 satisfacción promedio'],
            category: 'Asesoría',
            status: 'activo' as const,
            tags: ['Suscripción', 'Asesoría', 'IA', 'Mensual'],
        },
        {
            code: 'SUB-ENTERPRISE2024-002',
            title: 'Plan Estudio de Arquitectura',
            description: 'Plan para estudios de arquitectura que incluye acceso para todo el equipo, asesorías grupales y soporte prioritario.',
            benefits: ['Hasta 10 usuarios', 'Asesoría grupal mensual', 'Soporte prioritario', 'Reportes de uso'],
            features: ['Multi-usuario', 'Panel administrativo', 'Asesoría grupal', 'Soporte 24/7'],
            price: 2000,
            currency: 'PEN',
            period: 'mensual',
            maxUsers: 10,
            advisoryHours: 4,
            whatsappGroup: 'https://chat.whatsapp.com/example-enterprise',
            registrationLink: 'https://innovation-institute.edu/suscripciones/enterprise',
            paymentMethods: ['Transferencia bancaria', 'Facturación mensual'],
            targetAudience: 'Estudios de arquitectura que buscan capacitar a su equipo en IA',
            objectives: ['Capacitar al equipo en IA', 'Implementar IA en procesos del estudio'],
            category: 'Institucional',
            status: 'activo' as const,
            tags: ['Enterprise', 'Estudio', 'B2B'],
        },
    ];

    for (const subData of subscriptionItems) {
        const sub = await prisma.subscription.upsert({
            where: { code: subData.code },
            update: {},
            create: { orgId: org.id, ...subData },
        });
        console.log(`✅ Subscription: ${sub.title} (${sub.code})`);
    }

    // 8. Create sample asesorías (Consulting)
    const asesoriaItems = [
        {
            code: 'ASE-CONSUL2024-001',
            title: 'Consulta sobre IA para Arquitectura',
            description: 'Sesión de asesoría personalizada donde resolverás tus dudas sobre cómo implementar IA en tu práctica arquitectónica. Debes programar tu cita con mínimo 1 hora de anticipación y describir lo que necesitas.',
            pricePerHour: 150,
            currency: 'PEN',
            minimumHours: 1,
            packageHours: 5,
            packagePrice: 600,
            advisor: 'Arq. Carlos Méndez',
            advisorBio: 'Arquitecto con 15 años de experiencia, pionero en IA aplicada a arquitectura en Perú.',
            advisorTitle: 'Director de Innovación',
            specialties: ['IA Generativa', 'Renders con IA', 'Automatización de procesos', 'Diseño paramétrico'],
            bookingLink: 'https://calendly.com/innovation-institute/asesoria-ia',
            registrationLink: 'https://innovation-institute.edu/asesorias/consulta-ia',
            minAdvanceBooking: '1 hora',
            availableSchedule: 'Lunes a viernes 9:00 - 18:00',
            sessionDuration: '1 hora',
            topicsCovered: ['Selección de herramientas IA', 'Implementación en proyectos', 'Renders y visualización', 'Automatización'],
            deliverables: ['Informe de recomendaciones', 'Plan de implementación personalizado'],
            needsDescription: true,
            modality: 'online' as const,
            category: 'Consultoría',
            targetAudience: 'Arquitectos que necesitan orientación específica sobre IA',
            objectives: ['Resolver dudas puntuales', 'Recibir recomendaciones personalizadas', 'Obtener un plan de acción'],
            benefits: ['Atención personalizada', 'Recomendaciones específicas para tu caso', 'Plan de acción concreto'],
            painPoints: ['No saber por dónde empezar con IA', 'Necesitar orientación específica', 'Invertir tiempo en herramientas equivocadas'],
            socialProof: ['Más de 200 consultas realizadas', '4.9/5 satisfacción'],
            paymentMethods: ['Yape/Plin', 'Transferencia', 'Tarjeta de crédito'],
            tools: ['Zoom', 'Google Meet'],
            tags: ['Asesoría', 'IA', 'Personalizada', '1:1'],
            status: 'activo' as const,
        },
        {
            code: 'ASE-ESTUDIO2024-002',
            title: 'Asesoría para Estudios de Arquitectura',
            description: 'Consultoría especializada para estudios de arquitectura que desean integrar IA en sus procesos de diseño, renderizado y gestión.',
            pricePerHour: 300,
            currency: 'PEN',
            minimumHours: 2,
            packageHours: 10,
            packagePrice: 2500,
            advisor: 'Arq. Carlos Méndez',
            advisorTitle: 'Director de Innovación',
            specialties: ['Transformación digital de estudios', 'BIM + IA', 'Automatización de procesos'],
            bookingLink: 'https://calendly.com/innovation-institute/asesoria-estudio',
            minAdvanceBooking: '24 horas',
            availableSchedule: 'Lunes a viernes 9:00 - 17:00',
            sessionDuration: '2 horas',
            topicsCovered: ['Diagnóstico tecnológico', 'Roadmap de implementación', 'Capacitación del equipo'],
            deliverables: ['Diagnóstico del estudio', 'Roadmap de implementación', 'Guía de herramientas recomendadas'],
            needsDescription: true,
            modality: 'hibrido' as const,
            category: 'Consultoría',
            targetAudience: 'Directores y socios de estudios de arquitectura',
            objectives: ['Diagnosticar madurez tecnológica', 'Definir estrategia de adopción de IA', 'Capacitar al equipo'],
            benefits: ['Diagnóstico completo', 'Roadmap personalizado', 'Acompañamiento post-consulta'],
            paymentMethods: ['Transferencia bancaria', 'Facturación'],
            tools: ['Zoom', 'Miro', 'Notion'],
            tags: ['Asesoría', 'Estudio', 'B2B', 'Transformación Digital'],
            status: 'activo' as const,
        },
    ];

    for (const aseData of asesoriaItems) {
        const ase = await prisma.asesoria.upsert({
            where: { code: aseData.code },
            update: {},
            create: { orgId: org.id, ...aseData },
        });
        console.log(`✅ Asesoría: ${ase.title} (${ase.code})`);
    }

    // 9. Create sample applications (Postulaciones)
    const applicationItems = [
        {
            code: 'ADM-BECA2024-001',
            title: 'Programa de Becas para Asesorías IA',
            description: 'Programa de becas para arquitectos que deseen recibir asesorías especializadas en IA. Los candidatos deben pasar un examen de aptitudes y cumplir con los requisitos.',
            price: 150,
            currency: 'PEN',
            category: 'Becas',
            modality: 'online' as const,
            duration: '3 meses',
            availableSlots: 10,
            targetAudience: 'Arquitectos con menos de 5 años de experiencia que demuestren interés en IA',
            objectives: ['Democratizar el acceso a asesorías de IA', 'Formar la próxima generación de arquitectos tech'],
            benefits: ['Beca del 80% en asesorías', 'Mentoría personalizada', 'Acceso a comunidad de becarios', 'Certificación al completar'],
            painPoints: ['Alto costo de asesorías especializadas', 'Falta de oportunidades para jóvenes arquitectos'],
            requirements: ['Título de arquitecto o estudiante de último año', 'CV actualizado', 'Carta de motivación', 'Portfolio de proyectos'],
            examRequired: true,
            examDescription: 'Examen de aptitudes que evalúa conocimientos básicos de tecnología y capacidad de aprendizaje',
            applicationFee: 150,
            steps: ['1. Registrarse en el enlace', '2. Completar el formulario de datos', '3. Pagar la cuota de postulación (S/150)', '4. Rendir el examen de aptitudes online', '5. Enviar documentación requerida', '6. Esperar resultados (máximo 2 semanas)'],
            documentsNeeded: ['CV actualizado', 'Carta de motivación', 'Portfolio digital', 'Copia de título o constancia de estudios'],
            selectionCriteria: ['Potencial de innovación', 'Necesidad económica', 'Calidad del portfolio', 'Resultado del examen'],
            registrationLink: 'https://innovation-institute.edu/becas/asesorias-ia',
            paymentMethods: ['Yape/Plin', 'Transferencia bancaria'],
            deadline: new Date('2026-06-30'),
            socialProof: ['15 becarios en la primera edición', '100% de satisfacción'],
            status: 'activo' as const,
            tags: ['Beca', 'IA', 'Postulación', 'Arquitectos'],
        },
    ];

    for (const appData of applicationItems) {
        const app = await prisma.application.upsert({
            where: { code: appData.code },
            update: {},
            create: { orgId: org.id, ...appData },
        });
        console.log(`✅ Application: ${app.title} (${app.code})`);
    }

    // 10. Create sample team
    const existingTeam = await prisma.team.findFirst({
        where: { orgId: org.id, name: 'Equipo de Ventas IA' },
    });
    if (!existingTeam) {
        const team = await prisma.team.create({
            data: {
                orgId: org.id,
                name: 'Equipo de Ventas IA',
                description: 'Equipo especializado en vender cursos y asesorías de inteligencia artificial',
                members: {
                    create: [
                        { name: 'Juan Pérez', email: 'juan@innovation-institute.edu', role: 'Closer' },
                        { name: 'María López', email: 'maria@innovation-institute.edu', role: 'SDR' },
                    ],
                },
            },
        });
        console.log(`✅ Team: ${team.name}`);
    } else {
        console.log(`✅ Team already exists: ${existingTeam.name}`);
    }

    // 11. Create AI Agents
    const agentDefinitions = [
        {
            name: 'Asistente de Ventas',
            role: 'Sales Closer',
            personality: 'professional' as const,
            avatar: '💼',
            tone: 'Profesional, consultivo y orientado a resolver dudas de forma empática',
            systemPrompt: 'Eres un asesor educativo experto del Instituto de Innovación para Arquitectos. Tu objetivo es ayudar a los prospectos a encontrar el curso, programa, taller, asesoría o suscripción ideal para sus necesidades. Usa los datos reales del catálogo para hacer recomendaciones personalizadas.',
            expertise: ['ventas consultivas', 'educación', 'manejo de objeciones'],
            isActive: true,
        },
        {
            name: 'Recolector de Información',
            role: 'BDR Agent',
            personality: 'friendly' as const,
            avatar: '📋',
            tone: 'Amigable, curioso y eficiente en recopilar datos del prospecto',
            systemPrompt: 'Eres un asistente amigable que ayuda a recopilar información de prospectos interesados en cursos, talleres, asesorías y programas de arquitectura con IA.',
            expertise: ['recopilación de datos', 'clasificación de leads', 'cualificación'],
            isActive: true,
        },
        {
            name: 'Asistente de Catálogo',
            role: 'Catalog Expert',
            personality: 'enthusiastic' as const,
            avatar: '🎓',
            tone: 'Entusiasta, conocedor y detallado al presentar la oferta educativa',
            systemPrompt: 'Eres un experto en la oferta educativa del Instituto de Innovación para Arquitectos. Conoces cada curso, programa, webinar, taller, suscripción y asesoría en detalle.',
            expertise: ['catálogo educativo', 'asesoría académica', 'comparación de programas'],
            isActive: true,
        },
    ];

    for (const agentData of agentDefinitions) {
        const existingAgent = await prisma.aiAgent.findFirst({
            where: { orgId: org.id, name: agentData.name },
        });
        if (!existingAgent) {
            const agent = await prisma.aiAgent.create({
                data: { orgId: org.id, ...agentData },
            });
            console.log(`✅ AI Agent: ${agent.name} (${agent.role})`);
        } else {
            console.log(`✅ AI Agent already exists: ${existingAgent.name}`);
        }
    }

    // 12. Create default CRM Funnel and Stages
    const defaultFunnel = await prisma.funnel.upsert({
        where: { id: 'default-funnel-1' },
        update: {
            name: 'Embudo General',
            description: 'Embudo de ventas estándar para todos los leads.',
            isDefault: true,
        },
        create: {
            id: 'default-funnel-1',
            orgId: org.id,
            name: 'Embudo General',
            description: 'Embudo de ventas estándar para todos los leads.',
            isDefault: true,
        },
    });

    await prisma.funnelStage.deleteMany({ where: { funnelId: defaultFunnel.id } });

    await prisma.funnel.update({
        where: { id: defaultFunnel.id },
        data: {
            stages: {
                create: [
                    { name: 'BBDD', key: 'bbdd', sortOrder: 1, isDefault: true, color: '#6B7280', description: 'Base de datos inicial', rules: 'Entrada inicial de leads.' },
                    { name: 'Interesado', key: 'interesado', sortOrder: 2, isDefault: true, color: '#3B82F6', description: 'Interés detectado', rules: 'Cuando el bot detecta una intención clara de compra o consulta específica.' },
                    { name: 'Informado', key: 'informado', sortOrder: 3, isDefault: true, color: '#0EA5E9', description: 'Se le ha pasado la información pertinente', rules: 'Al entregar el temario, precios o detalles del servicio.' },
                    { name: 'Filtrado', key: 'filtrado', sortOrder: 4, isDefault: true, color: '#F59E0B', description: 'Se aplican las preguntas filtro', rules: 'Después de obtener respuestas a las preguntas de calificación.' },
                    { name: 'Cualificado a asesor', key: 'cualificado', sortOrder: 5, isDefault: true, color: '#8B5CF6', description: 'Completó la información y pasa a asesor', rules: 'Cuando el lead cumple con el perfil ideal.' },
                    { name: 'Alumno Registrado', key: 'alumno_registrado', sortOrder: 6, isDefault: true, color: '#10B981', description: 'Alumno registrado en el sistema', rules: 'Cuando el lead completa su registro como alumno.' },
                    { name: 'Alumno Activo', key: 'alumno_activo', sortOrder: 7, isDefault: true, color: '#059669', description: 'Alumno activo en un programa', rules: 'Cuando el alumno comienza a participar activamente.' },
                    { name: 'Seguimiento', key: 'seguimiento', sortOrder: 100, isDefault: true, color: '#F97316', description: 'Secuencia de seguimiento', rules: 'Si después de 15 min no responde.' },
                    { name: 'Asesor manual', key: 'asesor_manual', sortOrder: 101, isDefault: true, color: '#6366F1', description: 'Solicita hablar directamente', rules: 'Si el usuario escribe "quiero hablar con un humano".' },
                    { name: 'Caso especial', key: 'caso_especial', sortOrder: 102, isDefault: true, color: '#EC4899', description: 'Contingencia', rules: 'Leads que el bot no puede procesar.' },
                    { name: 'Descartado', key: 'descartado', sortOrder: 103, isDefault: true, color: '#EF4444', description: 'No le interesa o no aplica', rules: 'Cuando el lead indica desinterés.' },
                ],
            },
        },
    });

    console.log(`✅ Default Funnel: ${defaultFunnel.name}`);

    // 13. Create default Extraction Fields
    const defaultFields = [
        { name: 'Nombre', key: 'cliente_nombre', dataType: 'string', isDefault: true, isRequired: true, description: 'Nombre completo del prospecto' },
        { name: 'Teléfono', key: 'cliente_telefono', dataType: 'string', isDefault: true, isRequired: true, description: 'Número de contacto (whatsapp)' },
        { name: 'Correo', key: 'cliente_correo', dataType: 'string', isDefault: true, isRequired: false, description: 'Email de contacto' },
        { name: 'Interés', key: 'interes_tipo', dataType: 'string', isDefault: true, options: ['Curso', 'Programa', 'Webinar', 'Taller', 'Suscripción', 'Asesoría', 'Postulación'], description: 'Producto o servicio de interés' },
        { name: 'Detalle Interés', key: 'interes_detalle', dataType: 'string', isDefault: true, description: 'Especifique el curso o programa' },
        { name: 'Preguntas Filtro', key: 'preguntas_filtro', dataType: 'array', isDefault: true, options: ['¿Cuál es tu presupuesto aproximado?', '¿Cuándo te gustaría empezar?', '¿Tienes experiencia previa en el tema?', '¿Cuál es tu disponibilidad horaria?', '¿Buscas certificación?'], description: 'Preguntas de calificación que el agente hace al prospecto para determinar si es un lead cualificado' },
        { name: 'Respuestas Filtro', key: 'respuestas_filtro', dataType: 'array', isDefault: true, description: 'Respuestas del prospecto a las preguntas filtro' },
        { name: 'Caso Especial', key: 'caso_especial_motivo', dataType: 'string', isDefault: true, description: 'Detalle de por qué falló el bot' },
        { name: 'Resumen Solicitud', key: 'solicitud_resumen', dataType: 'string', isDefault: true, description: 'Breve resumen de lo que busca' },
        { name: 'Filtrado', key: 'es_filtrado', dataType: 'boolean', isDefault: true, description: 'Si pasó los filtros de calificación' },
        { name: 'Derivado Asesor', key: 'es_derivado', dataType: 'boolean', isDefault: true, description: 'Si fue enviado a un humano' },
    ];

    await prisma.extractionField.deleteMany({
        where: { funnelId: defaultFunnel.id }
    });

    for (const fieldData of defaultFields) {
        await prisma.extractionField.create({
            data: {
                orgId: org.id,
                funnelId: defaultFunnel.id,
                ...fieldData,
            },
        });
    }
    console.log(`✅ Default Extraction Fields: ${defaultFields.length} created`);

    console.log('\n✨ Seed completed successfully!\n');
    console.log('📋 Login credentials:');
    console.log('   Email: admin@innovation-institute.edu');
    console.log('   Password: admin123\n');
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error('Seed error:', e);
        prisma.$disconnect();
        process.exit(1);
    });
