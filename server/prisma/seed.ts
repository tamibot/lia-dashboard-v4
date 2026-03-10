import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Seed the database with a demo organization, admin user, and sample courses.
 */
async function main() {
    console.log('🌱 Seeding database...\n');

    // 1. Create demo organization
    const org = await prisma.organization.upsert({
        where: { slug: 'innovation-institute' },
        update: {},
        create: {
            slug: 'innovation-institute',
            name: 'Innovation Institute',
            type: 'instituto',
            description: 'Leading educational technology institute focused on AI, business strategy, and digital transformation.',
            tagline: 'Transformando el futuro a través de la educación',
            website: 'https://innovation-institute.edu',
            contactEmail: 'info@innovation-institute.edu',
            branding: {
                colors: { primary: '#2563EB', secondary: '#3B82F6', accent: '#F59E0B', neutral: '#6B7280' },
                typography: { headings: 'Inter', body: 'Inter' },
                voice: { tone: 'profesional', style: 'Experto, claro y cercano', keywords: ['innovación', 'IA', 'transformación digital'] },
                visualIdentity: { mood: 'Moderno y tecnológico', shapes: 'rounded' },
            },
            socialMedia: {
                instagram: '@innovationinst',
                linkedin: 'innovation-institute',
                youtube: '@innovationinstitute',
            },
            courseCategories: ['Inteligencia Artificial', 'Marketing Digital', 'Liderazgo', 'Data Science', 'UX/UI Design'],
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

    // 3. Create sample courses
    const courses = [
        {
            code: 'CRS-AI2024-001',
            title: 'Inteligencia Artificial Aplicada a los Negocios',
            description: 'Domina las herramientas de IA que están transformando las empresas.',
            category: 'Inteligencia Artificial',
            instructor: 'Dr. Carlos Méndez',
            price: 497,
            currency: 'USD',
            modality: 'online' as const,
            duration: '8 semanas',
            totalHours: 40,
            objectives: ['Implementar soluciones de IA en procesos empresariales', 'Evaluar herramientas de IA', 'Diseñar estrategias de transformación'],
            targetAudience: 'Directivos y gerentes que buscan liderar la transformación digital de su organización',
            status: 'activo' as const,
            tags: ['IA', 'Negocios', 'Transformación Digital'],
            tools: ['ChatGPT', 'Gemini', 'Midjourney', 'Make'],
            benefits: ['Certificado avalado', 'Acceso a comunidad exclusiva', 'Mentoría personalizada'],
            requirements: ['Laptop con internet', 'Conocimientos básicos de ofimática'],
        },
        {
            code: 'CRS-MKT2024-002',
            title: 'Marketing Digital con IA Generativa',
            description: 'Revoluciona tu marketing usando inteligencia artificial para crear contenido.',
            category: 'Marketing Digital',
            instructor: 'Ana Rodríguez',
            price: 397,
            currency: 'USD',
            modality: 'online' as const,
            duration: '6 semanas',
            totalHours: 30,
            objectives: ['Crear campañas con IA', 'Automatizar contenido', 'Analizar métricas con herramientas de IA'],
            targetAudience: 'Profesionales de marketing y emprendedores',
            status: 'activo' as const,
            tags: ['Marketing', 'IA', 'Contenido'],
            tools: ['ChatGPT', 'Canva AI', 'Meta Ads'],
            benefits: ['Portfolio de campañas reales', 'Playbooks descargables'],
            requirements: ['Cuenta de redes sociales activa'],
        },
        {
            code: 'CRS-LID2024-003',
            title: 'Liderazgo Estratégico en la Era Digital',
            description: 'Desarrolla habilidades de liderazgo para equipos remotos y entornos tecnológicos.',
            category: 'Liderazgo',
            instructor: 'Roberto Sánchez',
            price: 350,
            currency: 'USD',
            modality: 'hibrido' as const,
            duration: '5 semanas',
            totalHours: 25,
            objectives: ['Liderar equipos remotos', 'Gestionar cambio organizacional', 'Tomar decisiones data-driven'],
            targetAudience: 'Líderes de equipo, gerentes y directores',
            status: 'activo' as const,
            tags: ['Liderazgo', 'Management', 'Soft Skills'],
            tools: ['Notion', 'Slack', 'Miro'],
            benefits: ['Evaluación 360° gratuita', 'Sesiones de coaching grupal'],
            requirements: ['Experiencia mínima de 2 años en gestión'],
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

    // 4. Create sample program
    const program = await prisma.program.upsert({
        where: { code: 'PRG-MBA2024-001' },
        update: {},
        create: {
            orgId: org.id,
            code: 'PRG-MBA2024-001',
            title: 'Diplomado Ejecutivo en Inteligencia Artificial para Negocios',
            description: 'Programa integral de 6 meses para líderes que quieren dominar la IA empresarial.',
            category: 'Inteligencia Artificial',
            modality: 'online',
            totalDuration: '6 meses',
            totalHours: 120,
            price: 2497,
            currency: 'USD',
            certification: 'Diplomado en IA para Negocios',
            objectives: ['Visión estratégica de IA', 'Implementación práctica', 'Liderazgo en transformación digital'],
            targetAudience: 'C-Level y directores funcionales',
            status: 'activo',
            tags: ['IA', 'Diplomado', 'Ejecutivo'],
            tools: ['ChatGPT', 'Python', 'Power BI'],
        },
    });
    console.log(`✅ Program: ${program.title} (${program.code})`);

    // 5. Create sample webinar
    const webinar = await prisma.webinar.upsert({
        where: { code: 'WBN-AI2024-001' },
        update: {},
        create: {
            orgId: org.id,
            code: 'WBN-AI2024-001',
            title: 'Masterclass: El Fin de las Páginas Web Tradicionales',
            description: 'Descubre cómo los Agentes de Venta y las interfaces conversacionales están cambiando el juego.',
            type: 'masterclass',
            speaker: 'Ing. Miguel Torres',
            eventDate: new Date('2025-03-15'),
            eventTime: '19:00',
            duration: '90 minutos',
            price: 0,
            currency: 'USD',
            category: 'Tecnología',
            targetAudience: 'Emprendedores digitales y marketers',
            status: 'activo',
            topics: ['Agentes IA', 'Chatbots', 'Conversional Commerce'],
            tags: ['Webinar', 'IA', 'Gratis'],
        },
    });
    console.log(`✅ Webinar: ${webinar.title} (${webinar.code})`);

    // 6. Create sample team
    const team = await prisma.team.create({
        data: {
            orgId: org.id,
            name: 'Equipo de Ventas IA',
            description: 'Equipo especializado en vender cursos de inteligencia artificial',
            members: {
                create: [
                    { name: 'Juan Pérez', email: 'juan@innovation-institute.edu', role: 'Closer' },
                    { name: 'María López', email: 'maria@innovation-institute.edu', role: 'SDR' },
                ],
            },
        },
    });
    console.log(`✅ Team: ${team.name}`);

    // 7. Create default CRM Funnel and Stages
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

    // Delete existing stages for the default funnel to ensure clean update
    await prisma.funnelStage.deleteMany({ where: { funnelId: defaultFunnel.id } });

    await prisma.funnel.update({
        where: { id: defaultFunnel.id },
        data: {
            stages: {
                create: [
                    { name: 'BBDD', key: 'bbdd', sortOrder: 1, isDefault: true, description: 'Base de datos inicial', rules: 'Entrada inicial de leads.' },
                    { name: 'Interesado', key: 'interesado', sortOrder: 2, isDefault: true, description: 'Interés detectado (curso, subscripción, programa, etc.)', rules: 'Cuando el bot detecta una intención clara de compra o consulta específica.' },
                    { name: 'Informado', key: 'informado', sortOrder: 3, isDefault: true, description: 'Se le ha pasado la información pertinente', rules: 'Al entregar el temario, precios o detalles del servicio.' },
                    { name: 'Filtrado', key: 'filtrado', sortOrder: 4, isDefault: true, description: 'Se aplican las preguntas filtro', rules: 'Después de obtener respuestas a las preguntas de calificación.' },
                    { name: 'Cualificado a asesor', key: 'cualificado', sortOrder: 5, isDefault: true, description: 'Completó la información y pasa a asesor', rules: 'Cuando el lead cumple con el perfil ideal y solicita profundizar.' },
                    { name: 'Asesor manual', key: 'asesor_manual', sortOrder: 6, isDefault: true, description: 'Solicita hablar directamente o asignación manual', rules: 'Si el usuario escribe "quiero hablar con un humano" o por intervención administrativa.' },
                    { name: 'Seguimiento', key: 'seguimiento', sortOrder: 7, isDefault: true, description: 'Secuencia de seguimiento', rules: 'Si después de 15 min no responde, el sistema lo mueve aquí e inicia secuencia.' },
                    { name: 'Descartado', key: 'descartado', sortOrder: 8, isDefault: true, description: 'No le interesa o no aplica', rules: 'Cuando el lead indica desinterés o no supera los filtros mínimos.' },
                    { name: 'Caso especial', key: 'caso_especial', sortOrder: 9, isDefault: true, description: 'Contingencia', rules: 'Leads que el bot no puede procesar o que caen en bucle de error.' },
                ],
            },
        },
    });

    console.log(`✅ Default Funnel: ${defaultFunnel.name}`);

    // 8. Create default Extraction Fields
    const defaultFields = [
        { name: 'Nombre', key: 'cliente_nombre', dataType: 'string', isDefault: true, isRequired: true, description: 'Nombre completo del prospecto' },
        { name: 'Teléfono', key: 'cliente_telefono', dataType: 'string', isDefault: true, isRequired: true, description: 'Número de contacto (whatsapp)' },
        { name: 'Correo', key: 'cliente_correo', dataType: 'string', isDefault: true, isRequired: true, description: 'Email de contacto' },
        { name: 'Interés', key: 'interes_tipo', dataType: 'string', isDefault: true, options: ['Curso', 'Suscripción', 'Programa', 'Webinar'], description: 'Producto o servicio de interés' },
        { name: 'Detalle Interés', key: 'interes_detalle', dataType: 'string', isDefault: true, description: 'Especifique el curso o programa' },
        { name: 'Caso Especial', key: 'caso_especial_motivo', dataType: 'string', isDefault: true, description: 'Detalle de por qué falló el bot' },
        { name: 'Resumen Solicitud', key: 'solicitud_resumen', dataType: 'string', isDefault: true, description: 'Breve resumen de lo que busca' },
        { name: 'Filtrado', key: 'es_filtrado', dataType: 'boolean', isDefault: true, description: 'Si pasó los filtros de calificación' },
        { name: 'Derivado Asesor', key: 'es_derivado', dataType: 'boolean', isDefault: true, description: 'Si fue enviado a un humano' },
    ];

    // Delete existing fields to avoid duplicates if re-seeding
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
