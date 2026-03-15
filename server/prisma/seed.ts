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

    // 1b. Cleanup test/demo items — delete anything that looks like a test entry
    const looksLikeTest = (title: string) => {
        const t = title.trim();
        return (
            /^test\b/i.test(t) ||           // starts with "Test"
            /\[test\]/i.test(t) ||          // contains [TEST]
            /\[sub-gen/i.test(t) ||         // internal code prefixes
            t.length <= 2 ||               // single-char or 2-char titles like "T"
            /^prueba\b/i.test(t) ||        // "prueba"
            /^demo\b/i.test(t)             // "demo"
        );
    };
    const cleanupModel = async (model: any, label: string) => {
        const items = await model.findMany({ where: { orgId: org.id }, select: { id: true, title: true } });
        const toDelete = items.filter((i: any) => looksLikeTest(i.title)).map((i: any) => i.id);
        if (toDelete.length) {
            await model.deleteMany({ where: { id: { in: toDelete } } });
            console.log(`🗑️  Deleted ${toDelete.length} test ${label}: ${items.filter((i: any) => looksLikeTest(i.title)).map((i: any) => i.title).join(', ')}`);
        }
    };
    await cleanupModel(prisma.course, 'cursos');
    await cleanupModel(prisma.program, 'programas');
    await cleanupModel(prisma.webinar, 'webinars');
    await cleanupModel(prisma.taller, 'talleres');
    await cleanupModel(prisma.subscription, 'suscripciones');
    await cleanupModel(prisma.asesoria, 'asesorias');
    await cleanupModel(prisma.application, 'postulaciones');

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
            title: 'IA para Arquitectos: De Cero a Experto',
            description: 'Domina las mejores herramientas de inteligencia artificial aplicadas a la arquitectura. En 6 semanas pasarás de no saber nada de IA a usarla diariamente para acelerar tu trabajo: renders en minutos, presentaciones impactantes y diseño optimizado. El curso más completo del mercado hispanohablante para arquitectos.',
            category: 'Inteligencia Artificial',
            instructor: 'Arq. Carlos Méndez',
            instructorBio: 'Arquitecto con 15 años de experiencia, pionero en IA para arquitectura en Latinoamérica. Ha capacitado a más de 2.000 arquitectos en 12 países.',
            price: 497,
            currency: 'USD',
            modality: 'online' as const,
            duration: '6 semanas',
            totalHours: 36,
            maxStudents: 150,
            objectives: [
                'Usar Midjourney y Stable Diffusion para renders de nivel profesional',
                'Automatizar presentaciones y memorias descriptivas con ChatGPT',
                'Integrar IA en tu flujo de trabajo diario de diseño',
                'Crear imágenes conceptuales y renders en minutos, no días',
                'Optimizar planos y detalles con herramientas de IA especializadas',
            ],
            targetAudience: 'Arquitectos, estudiantes de arquitectura y diseñadores de interiores que quieren multiplicar su productividad con IA',
            status: 'activo' as const,
            tags: ['IA', 'Arquitectura', 'Midjourney', 'ChatGPT', 'Renders', 'Productividad'],
            tools: ['Midjourney', 'Stable Diffusion', 'ChatGPT', 'SketchUp AI', 'Adobe Firefly', 'Canva AI'],
            benefits: [
                'Certificado avalado por el Instituto de Innovación',
                'Acceso de por vida al material y actualizaciones',
                'Comunidad privada de alumni en WhatsApp',
                'Pack de 50+ prompts probados para arquitectura',
                'Sesión de preguntas en vivo mensual',
            ],
            requirements: ['Laptop con internet estable', 'Conocimientos básicos de arquitectura o diseño', 'No se requiere experiencia previa en IA'],
            certification: 'Certificado en IA Aplicada a la Arquitectura',
            registrationLink: 'https://innovation-institute.edu/cursos/ia-arquitectos',
            paymentMethods: ['Tarjeta de crédito', 'Transferencia bancaria', 'Yape/Plin', 'PayPal'],
        },
        {
            code: 'CRS-RENDER2024-002',
            title: 'Masterclass de Renders Fotorrealistas con IA',
            description: 'Aprende a crear renders fotorrealistas de nivel arquitectónico usando inteligencia artificial generativa. Lograrás imágenes que impresionan a cualquier cliente en una fracción del tiempo tradicional. Incluye técnicas avanzadas de Midjourney, Stable Diffusion y Adobe Firefly para exteriores, interiores y detalles constructivos.',
            category: 'Diseño',
            instructor: 'Arq. Ana Torres',
            instructorBio: 'Arquitecta y especialista en visualización arquitectónica. Ganadora de 3 premios internacionales de renders. Colaboradora de estudios en Madrid, Ciudad de México y Bogotá.',
            price: 297,
            currency: 'USD',
            modality: 'online' as const,
            duration: '4 semanas',
            totalHours: 24,
            maxStudents: 80,
            objectives: [
                'Generar renders exteriores e interiores fotorrealistas con IA',
                'Dominar Midjourney para arquitectura al nivel de estudio profesional',
                'Hacer post-producción inteligente con Adobe Firefly y Photoshop AI',
                'Crear un portfolio de renders con IA para captar nuevos clientes',
                'Automatizar tu proceso de visualización y reducir tiempos en 80%',
            ],
            targetAudience: 'Arquitectos y diseñadores de interiores que quieren elevar la calidad de sus presentaciones visuales',
            status: 'activo' as const,
            tags: ['Renders', 'IA Generativa', 'Midjourney', 'Visualización', 'Portfolio'],
            tools: ['Midjourney V6', 'Stable Diffusion XL', 'Adobe Firefly', 'Photoshop AI', 'Canva AI'],
            benefits: [
                'Portfolio de 10 renders de nivel profesional al terminar',
                'Acceso de por vida al material y nuevas versiones del curso',
                'Grupo privado de feedback con la instructora',
                'Pack de 30+ prompts especializados para exteriores e interiores',
            ],
            requirements: ['Laptop con buena tarjeta gráfica recomendada', 'Conocimientos básicos de arquitectura o diseño de interiores'],
            certification: 'Certificado en Visualización Arquitectónica con IA',
            paymentMethods: ['Tarjeta de crédito', 'Transferencia bancaria', 'PayPal'],
        },
        {
            code: 'CRS-BIM2025-003',
            title: 'BIM + Inteligencia Artificial: El Futuro del Diseño',
            description: 'Integra IA directamente en tus flujos de trabajo BIM con Revit, Dynamo y herramientas de IA específicas para el sector AEC (Architecture, Engineering, Construction). Automatiza la documentación, detecta colisiones con IA y genera planos técnicos más rápido que nunca.',
            category: 'Arquitectura',
            instructor: 'Arq. Luis García',
            instructorBio: 'Arquitecto BIM Manager con certificación Autodesk. 10 años implementando BIM en proyectos de más de $50M USD en Latinoamérica.',
            price: 397,
            currency: 'USD',
            modality: 'hibrido' as const,
            duration: '8 semanas',
            totalHours: 48,
            maxStudents: 40,
            objectives: [
                'Integrar IA en Revit con plugins y herramientas especializadas',
                'Automatizar documentación y planos técnicos con Dynamo + IA',
                'Usar IA para detección de colisiones y coordinación de modelos',
                'Generar renders desde BIM usando IA directamente',
                'Implementar flujos de trabajo BIM+IA en tu estudio o empresa',
            ],
            targetAudience: 'Arquitectos e ingenieros con experiencia en BIM que quieren dar el salto a la automatización con IA',
            status: 'activo' as const,
            tags: ['BIM', 'Revit', 'IA', 'AEC', 'Automatización', 'Dynamo'],
            tools: ['Revit', 'Dynamo', 'Autodesk AI', 'ChatGPT para AEC', 'Speckle'],
            benefits: [
                'Certificado avalado por el Instituto y Autodesk Partner',
                'Proyecto BIM+IA completo para tu portfolio',
                'Acceso a templates y scripts de Dynamo desarrollados en el curso',
                'Comunidad de BIM Managers hispanohablantes',
            ],
            requirements: ['Revit instalado (versión 2023 o superior)', 'Experiencia básica-intermedia en BIM/Revit'],
            certification: 'Certificado BIM + Inteligencia Artificial',
            paymentMethods: ['Tarjeta de crédito', 'Transferencia bancaria', 'Pago en cuotas disponible'],
        },
    ];

    for (const courseData of courses) {
        const { code, ...rest } = courseData;
        const course = await prisma.course.upsert({
            where: { code },
            update: rest,
            create: { orgId: org.id, ...courseData },
        });
        console.log(`✅ Course: ${course.title} (${course.code})`);

        // Seed syllabus for the main IA course
        if (code === 'CRS-IA2024-001') {
            await prisma.syllabusModule.deleteMany({ where: { courseId: course.id } });
            await prisma.syllabusModule.createMany({
                data: [
                    { courseId: course.id, title: 'Semana 1: Fundamentos de IA Generativa', description: 'Qué es la IA, cómo funciona y herramientas para arquitectos', order: 1, topics: ['Introducción a IA Generativa', 'Midjourney: primeros pasos', 'Prompt Engineering básico'] },
                    { courseId: course.id, title: 'Semana 2: Renders Conceptuales con IA', description: 'Renders impactantes a partir de bocetos y referencias', order: 2, topics: ['Renders exteriores con Midjourney', 'Interiores fotorrealistas', 'Blend de renders con planos reales'] },
                    { courseId: course.id, title: 'Semana 3: Renders Técnicos y de Presentación', description: 'Renders para entregar a clientes y concursos', order: 3, topics: ['Stable Diffusion aplicado', 'Post-producción con Adobe Firefly', 'Integración con SketchUp'] },
                    { courseId: course.id, title: 'Semana 4: IA para Diseño y Planificación', description: 'ChatGPT para memorias, normativa y optimización de espacios', order: 4, topics: ['ChatGPT para arquitectos', 'Automatización de documentos', 'Análisis de proyectos con IA'] },
                    { courseId: course.id, title: 'Semana 5: Flujos de Trabajo Avanzados', description: 'Integra todas las herramientas en tu flujo profesional', order: 5, topics: ['Pipeline de IA completo', 'Gestión de proyectos con IA', 'Presentaciones automatizadas'] },
                    { courseId: course.id, title: 'Semana 6: Proyecto Final + Certificación', description: 'Presenta tu proyecto integrando todo lo aprendido', order: 6, topics: ['Proyecto integrador', 'Revisión grupal', 'Entrega de certificados'] },
                ],
            });
        }
    }

    // 4. Create sample programs (Programas)
    const programData1 = {
        code: 'PRG-IAPROG2024-001',
        title: 'Diplomado: Arquitecto del Futuro con IA',
        description: 'El programa más completo de Latinoamérica para arquitectos que quieren liderar la transformación digital del sector. En 12 semanas dominarás IA generativa, programación paramétrica, BIM avanzado y visualización de última generación. Terminarás con un proyecto real en tu portfolio y una red de contactos internacional.',
        category: 'Inteligencia Artificial',
        modality: 'online',
        totalDuration: '12 semanas',
        totalHours: 180,
        price: 1497,
        currency: 'USD',
        certification: 'Diplomado en Arquitectura + Inteligencia Artificial',
        certifyingEntity: 'Instituto de Innovación para Arquitectos',
        objectives: [
            'Dominar todas las herramientas de IA relevantes para arquitectura',
            'Aprender programación paramétrica con Grasshopper y Python',
            'Integrar IA en flujos BIM y de gestión de proyectos',
            'Desarrollar un proyecto arquitectónico completo con IA',
            'Construir un portfolio diferenciado para el mercado actual',
        ],
        targetAudience: 'Arquitectos profesionales y recién egresados que quieren posicionarse como referentes en tecnología e IA',
        status: 'activo',
        tags: ['Diplomado', 'IA', 'Programación', 'BIM', 'Certificación'],
        tools: ['Python', 'Grasshopper', 'Revit', 'ChatGPT', 'Midjourney', 'Stable Diffusion', 'Adobe Firefly'],
        benefits: [
            'Diploma avalado por el Instituto con sello internacional',
            'Grupo de WhatsApp privado con instructores y alumni',
            'Proyecto arquitectónico completo para portfolio',
            'Acceso de por vida al material y actualizaciones',
            '3 sesiones de mentoría 1:1 con expertos',
            'Red de contactos con +500 egresados en 15 países',
        ],
        whatsappGroup: 'https://chat.whatsapp.com/diplomado-ia-arq',
        includesProject: true,
        registrationLink: 'https://innovation-institute.edu/programas/diplomado-ia',
        paymentMethods: ['Tarjeta de crédito', 'Transferencia bancaria', '3 cuotas sin interés', 'PayPal'],
        requirements: ['Título de arquitecto o estudiante de último año', 'Laptop con internet estable', 'Dedicación de 15 horas semanales'],
    };
    const program = await prisma.program.upsert({
        where: { code: programData1.code },
        update: programData1,
        create: { orgId: org.id, ...programData1 },
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

    // 5. Create sample webinars
    const webinarItems = [
        {
            code: 'WBN-TEND2024-001',
            title: '¿Cómo está transformando la IA a la Arquitectura? Panel Internacional 2026',
            description: 'Webinar gratuito con 4 ponentes internacionales de España, México, Colombia y Perú. Descubre cómo la IA está cambiando el diseño, la construcción y la gestión de proyectos arquitectónicos. Caso reales de estudios que ya usan IA en su operación diaria. Incluye sesión de preguntas en vivo.',
            webinarFormat: 'webinar',
            speaker: 'Panel Internacional: Arq. María Vega (Madrid), Arq. Roberto Cruz (CDMX), Arq. Daniela Ospina (Bogotá), Arq. Carlos Méndez (Lima)',
            speakerBio: 'Cuatro arquitectos líderes en innovación y tecnología en sus respectivos países, con proyectos premiados internacionalmente.',
            eventDate: new Date('2026-04-22'),
            eventTime: '18:00 (GMT-5)',
            duration: '2 horas',
            price: 0,
            currency: 'USD',
            category: 'Inteligencia Artificial',
            targetAudience: 'Arquitectos, estudiantes de arquitectura e ingeniería, diseñadores de interiores y profesionales del sector AEC',
            status: 'activo',
            topics: ['IA Generativa en Arquitectura', 'Casos reales de estudios con IA', 'Futuro del sector AEC', 'Cómo empezar con IA sin experiencia técnica'],
            keyTopics: ['Midjourney para arquitectura', 'Diseño paramétrico con IA', 'BIM + IA', 'Gestión de proyectos con IA'],
            tags: ['Webinar', 'IA', 'Gratis', 'Internacional', 'Panel'],
            registrationLink: 'https://innovation-institute.edu/webinars/panel-ia-2026',
            benefits: ['Acceso 100% gratuito', 'Grabación disponible por 30 días', 'Certificado de asistencia digital', 'Material de apoyo descargable'],
            maxAttendees: 1000,
        },
        {
            code: 'WBN-MIDJ2025-002',
            title: 'Masterclass Gratuita: Midjourney para Arquitectos en 60 Minutos',
            description: 'En esta masterclass práctica aprenderás a usar Midjourney específicamente para arquitectura desde cero. Verás en vivo cómo generar renders de exteriores, interiores y conceptos en minutos. Al final tendrás tus primeros renders y los prompts que los generaron.',
            webinarFormat: 'masterclass',
            speaker: 'Arq. Ana Torres',
            speakerBio: 'Arquitecta especialista en visualización con IA. Ha generado más de 50.000 renders con IA y es la referente hispana más seguida en el tema.',
            eventDate: new Date('2026-05-08'),
            eventTime: '19:00 (GMT-5)',
            duration: '1 hora',
            price: 0,
            currency: 'USD',
            category: 'Diseño',
            targetAudience: 'Arquitectos y diseñadores que quieren aprender Midjourney desde cero',
            status: 'activo',
            topics: ['Primeros pasos en Midjourney', 'Prompts para renders arquitectónicos', 'Casos prácticos en vivo'],
            keyTopics: ['Renders exteriores', 'Interiores con IA', 'Prompt engineering para arquitectura'],
            tags: ['Masterclass', 'Midjourney', 'Gratis', 'Renders', 'Práctica'],
            registrationLink: 'https://innovation-institute.edu/webinars/midjourney-arquitectos',
            benefits: ['Totalmente gratuita', 'Práctica en tiempo real', 'Pack de 20 prompts de regalo', 'Grabación disponible'],
            maxAttendees: 500,
        },
    ];
    for (const wd of webinarItems) {
        const { code: wCode, ...wRest } = wd;
        const webinar = await prisma.webinar.upsert({
            where: { code: wCode },
            update: wRest,
            create: { orgId: org.id, ...wd },
        });
        console.log(`✅ Webinar: ${webinar.title} (${webinar.code})`);
    }

    // 6. Create sample talleres (Workshops)
    const tallerItems = [
        {
            code: 'TLR-IAUSO2024-001',
            title: 'Taller Intensivo: IA para Arquitectura desde Cero',
            description: 'Taller presencial intensivo de 3 horas donde en una sola tarde aprenderás a usar las principales herramientas de IA para arquitectura. Saldrás con renders reales hechos por ti, un certificado y el kit de herramientas completo. Grupos reducidos de máximo 25 personas para atención personalizada.',
            modality: 'presencial' as const,
            duration: '3 horas',
            totalHours: 3,
            instructor: 'Arq. Carlos Méndez',
            instructorBio: 'Arquitecto con 15 años de experiencia, especialista en IA.',
            venue: 'Sala de Innovación - Miraflores',
            venueAddress: 'Av. Larco 1250, Miraflores, Lima',
            venueCapacity: 30,
            location: 'Lima, Perú',
            price: 49,
            currency: 'USD',
            maxParticipants: 25,
            availableSpots: 10,
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
            title: 'Taller Práctico: BIM + IA en un Día',
            description: 'Taller presencial de 4 horas para integrar inteligencia artificial directamente en tus flujos de trabajo BIM. Trabajarás con Revit real y plugins de IA, generarás renders desde el modelo y automatizarás tareas de documentación. Cupos muy limitados para garantizar práctica individual.',
            modality: 'presencial' as const,
            duration: '4 horas',
            totalHours: 4,
            instructor: 'Arq. Luis García',
            venue: 'Centro de Convenciones Lima',
            venueAddress: 'Jirón de la Unión 800, Lima',
            location: 'Lima, Perú',
            price: 79,
            currency: 'USD',
            maxParticipants: 20,
            availableSpots: 5,
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
        const { code: tCode, ...tRest } = tallerData;
        const taller = await prisma.taller.upsert({
            where: { code: tCode },
            update: tRest,
            create: { orgId: org.id, ...tallerData },
        });
        console.log(`✅ Taller: ${taller.title} (${taller.code})`);
    }

    // 7. Create sample subscriptions
    const subscriptionItems = [
        {
            code: 'SUB-ASESOR2024-001',
            title: 'Membresía Arquitecto IA — Plan Individual',
            description: 'Suscripción mensual diseñada para arquitectos que quieren mantenerse al día con la IA y tener apoyo continuo en su implementación. Incluye 2 horas de asesoría personalizada al mes, acceso a la biblioteca de recursos actualizada semanalmente y grupo de WhatsApp con expertos disponibles de lunes a viernes.',
            benefits: ['2 horas de asesoría personalizada al mes', 'Acceso a grupo de WhatsApp 24/7', 'Material exclusivo mensual', 'Descuentos en cursos y talleres'],
            features: ['Sesiones 1:1 con experto', 'Grupo WhatsApp exclusivo', 'Recursos actualizados', 'Prioridad en eventos'],
            price: 49,
            currency: 'USD',
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
            title: 'Membresía Arquitecto IA — Plan Estudio',
            description: 'Plan corporativo para estudios de arquitectura que quieren capacitar a todo su equipo en IA. Incluye hasta 10 usuarios, asesoría grupal mensual de 2 horas, soporte prioritario y acceso completo a todos los recursos. El plan más completo para estudios que quieren liderar la adopción de IA en su mercado.',
            benefits: ['Hasta 10 usuarios', 'Asesoría grupal mensual', 'Soporte prioritario', 'Reportes de uso'],
            features: ['Multi-usuario', 'Panel administrativo', 'Asesoría grupal', 'Soporte 24/7'],
            price: 199,
            currency: 'USD',
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
        const { code: sCode, ...sRest } = subData;
        const sub = await prisma.subscription.upsert({
            where: { code: sCode },
            update: sRest,
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
        const { code: aCode, ...aRest } = aseData;
        const ase = await prisma.asesoria.upsert({
            where: { code: aCode },
            update: aRest,
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
        const { code: apCode, ...apRest } = appData;
        const app = await prisma.application.upsert({
            where: { code: apCode },
            update: apRest,
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
            name: 'LIA Sales',
            role: 'Sales Closer',
            personality: 'enthusiastic' as const,
            avatar: '💼',
            tone: 'Cálida, entusiasta y orientada al cierre de manera consultiva',
            systemPrompt: 'Eres LIA, asesora de ventas educativa. Tu objetivo es ayudar a los prospectos a encontrar el programa ideal para sus necesidades y acompañarlos hasta la inscripción. Usa los datos reales del catálogo para hacer recomendaciones personalizadas.',
            expertise: ['ventas consultivas', 'educación', 'manejo de objeciones'],
            isActive: true,
        },
        {
            name: 'LIA BDR',
            role: 'BDR Agent',
            personality: 'friendly' as const,
            avatar: '📋',
            tone: 'Amigable, curioso y eficiente en recopilar datos del prospecto',
            systemPrompt: 'Eres LIA, una asistente amigable que ayuda a recopilar información de prospectos interesados en la oferta educativa.',
            expertise: ['recopilación de datos', 'clasificación de leads', 'cualificación'],
            isActive: true,
        },
        {
            name: 'LIA',
            role: 'Catalog Expert',
            personality: 'enthusiastic' as const,
            avatar: '🎓',
            tone: 'Entusiasta, conocedora y detallada al presentar la oferta educativa. Siempre orientada a la solución.',
            systemPrompt: 'Eres LIA, experta en la oferta educativa de la institución. Conoces cada curso, programa, webinar, taller, suscripción y asesoría en detalle. Ayudas a los prospectos a encontrar la opción perfecta para ellos.',
            expertise: ['catálogo educativo', 'asesoría académica', 'comparación de programas'],
            isActive: true,
        },
    ];

    // Migrate old agent names → new ones before upserting
    const oldNameMap: Record<string, string> = {
        'Asistente de Catálogo': 'LIA',
        'Asistente de Ventas': 'LIA Sales',
        'Recolector de Información': 'LIA BDR',
    };
    for (const [oldName, newName] of Object.entries(oldNameMap)) {
        const old = await prisma.aiAgent.findFirst({ where: { orgId: org.id, name: oldName } });
        if (old) {
            await prisma.aiAgent.update({ where: { id: old.id }, data: { name: newName } });
            console.log(`✅ Renamed AI Agent: "${oldName}" → "${newName}"`);
        }
    }

    for (const agentData of agentDefinitions) {
        const existingAgent = await prisma.aiAgent.findFirst({
            where: { orgId: org.id, role: agentData.role },
        });
        if (!existingAgent) {
            const agent = await prisma.aiAgent.create({
                data: { orgId: org.id, ...agentData },
            });
            console.log(`✅ AI Agent: ${agent.name} (${agent.role})`);
        } else {
            console.log(`✅ AI Agent already exists: ${existingAgent.name} (${existingAgent.role})`);
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
