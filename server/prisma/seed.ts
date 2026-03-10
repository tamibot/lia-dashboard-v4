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

    // 5b. Create sample software items
    const softwareItems = [
        {
            code: 'SW-CHATBOT2024-001',
            title: 'LIA Chatbot Builder',
            description: 'Plataforma para crear chatbots educativos. Permite a instituciones diseñar, entrenar y desplegar asistentes conversacionales sin necesidad de código.',
            price: 99,
            currency: 'USD',
            category: 'Software Educativo',
            platform: 'Web',
            version: '2.1.0',
            licenseType: 'freemium',
            targetAudience: 'Instituciones educativas y emprendedores digitales que buscan automatizar la atención al estudiante',
            objectives: ['Crear chatbots educativos sin código', 'Automatizar respuestas frecuentes', 'Integrar con plataformas de aprendizaje'],
            benefits: ['Reducción de 80% en consultas repetitivas', 'Atención 24/7 a estudiantes', 'Setup en menos de 1 hora', 'Integración con WhatsApp y web'],
            painPoints: ['Atención manual saturada', 'Estudiantes sin respuesta fuera de horario', 'Costos altos de soporte'],
            features: ['Editor visual drag & drop', 'Plantillas educativas pre-diseñadas', 'Analíticas de conversación', 'Multi-idioma'],
            tools: ['WhatsApp API', 'Web Widget', 'Zapier'],
            requirements: ['Navegador moderno', 'Cuenta de correo electrónico'],
            status: 'activo' as const,
            tags: ['Chatbot', 'IA', 'Educación', 'No-Code'],
        },
        {
            code: 'SW-ANALYTICS2024-002',
            title: 'EduMetrics Pro',
            description: 'Dashboard de analíticas para engagement estudiantil. Monitorea métricas de participación, retención y satisfacción estudiantil en tiempo real.',
            price: 149,
            currency: 'USD',
            category: 'Analytics',
            platform: 'Web',
            version: '1.5.0',
            licenseType: 'paid',
            targetAudience: 'Directores académicos y coordinadores de programas educativos',
            objectives: ['Monitorear engagement estudiantil en tiempo real', 'Identificar alumnos en riesgo de deserción', 'Optimizar contenido educativo con datos'],
            benefits: ['Dashboards en tiempo real', 'Alertas automáticas de deserción', 'Reportes exportables', 'Comparativas entre cohortes'],
            painPoints: ['Deserción estudiantil sin detección temprana', 'Falta de métricas para decisiones académicas', 'Reportes manuales que toman días'],
            features: ['Dashboard interactivo', 'Alertas personalizables', 'Exportación a PDF/Excel', 'API REST'],
            tools: ['Google Sheets', 'LMS Integration', 'Slack'],
            requirements: ['Navegador moderno', 'Base de datos de estudiantes'],
            status: 'activo' as const,
            tags: ['Analytics', 'Dashboard', 'Engagement', 'Métricas'],
        },
    ];

    for (const swData of softwareItems) {
        const sw = await prisma.software.upsert({
            where: { code: swData.code },
            update: {},
            create: { orgId: org.id, ...swData },
        });
        console.log(`✅ Software: ${sw.title} (${sw.code})`);
    }

    // 5c. Create sample subscriptions
    const subscriptionItems = [
        {
            code: 'SUB-PREMIUM2024-001',
            title: 'Membresía Premium Educador',
            description: 'Acceso ilimitado a todos los cursos y masterclasses mensuales. Incluye contenido exclusivo, comunidad privada y sesiones de mentoría grupales.',
            benefits: ['Acceso ilimitado a cursos', 'Masterclass mensual en vivo', 'Comunidad privada', 'Certificados incluidos', 'Mentoría grupal'],
            features: ['Acceso a +50 cursos', 'Descargas ilimitadas', 'Soporte por chat', 'Certificados digitales'],
            price: 49,
            currency: 'USD',
            period: 'mensual',
            maxUsers: 1,
            targetAudience: 'Educadores independientes y profesionales en formación continua',
            objectives: ['Mantenerse actualizado en tendencias educativas', 'Acceder a formación continua de calidad', 'Obtener certificaciones profesionales'],
            painPoints: ['Cursos individuales demasiado caros', 'Contenido desactualizado', 'Falta de comunidad profesional'],
            socialProof: ['Más de 500 educadores suscritos', '4.8/5 satisfacción promedio'],
            category: 'Membresía',
            status: 'activo' as const,
            tags: ['Premium', 'Membresía', 'All-Access'],
        },
        {
            code: 'SUB-ENTERPRISE2024-002',
            title: 'Plan Enterprise Institucional',
            description: 'Licencia institucional con acceso completo a la plataforma, reportes avanzados y soporte dedicado para toda tu organización.',
            benefits: ['Usuarios ilimitados', 'Panel administrativo', 'Reportes avanzados', 'Soporte prioritario 24/7', 'Personalización de marca', 'API access'],
            features: ['Dashboard administrativo', 'Gestión de usuarios', 'Reportes personalizados', 'SSO / SAML', 'API REST', 'White-label'],
            price: 299,
            currency: 'USD',
            period: 'mensual',
            maxUsers: 100,
            targetAudience: 'Instituciones educativas, universidades corporativas y empresas de capacitación',
            objectives: ['Centralizar la capacitación organizacional', 'Monitorear progreso de colaboradores', 'Reducir costos de formación'],
            painPoints: ['Licencias individuales costosas a escala', 'Sin visibilidad del progreso formativo', 'Plataformas dispersas'],
            socialProof: ['Usado por 15+ instituciones en LATAM', 'Reducción promedio de 40% en costos de capacitación'],
            category: 'Institucional',
            status: 'activo' as const,
            tags: ['Enterprise', 'Institucional', 'B2B'],
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

    // 5d. Create sample applications (postulaciones)
    const applicationItems = [
        {
            code: 'ADM-BECA2024-001',
            title: 'Beca de Innovación en IA',
            description: 'Beca completa para profesionales destacados que deseen especializarse en inteligencia artificial aplicada a los negocios.',
            price: 0,
            currency: 'USD',
            category: 'Becas',
            modality: 'online' as const,
            duration: '6 meses',
            availableSlots: 10,
            targetAudience: 'Profesionales con 2+ años de experiencia que demuestren potencial de innovación',
            objectives: ['Formar líderes en IA aplicada', 'Impulsar proyectos de innovación en LATAM', 'Crear una red de profesionales en IA'],
            benefits: ['Beca 100% del programa', 'Mentoría 1:1 con expertos', 'Acceso a red de alumni', 'Certificación internacional'],
            painPoints: ['Alto costo de programas de IA', 'Falta de oportunidades de especialización', 'Brechas de talento en IA en la región'],
            requirements: ['CV actualizado', 'Carta de motivación', 'Portfolio de proyectos', 'Mínimo 2 años de experiencia profesional'],
            deadline: new Date('2026-06-30'),
            status: 'activo' as const,
            tags: ['Beca', 'IA', 'Innovación', 'Gratuito'],
        },
        {
            code: 'ADM-MBA2024-002',
            title: 'Admisión MBA Digital',
            description: 'Proceso de admisión para el programa de MBA en Transformación Digital y Gestión de la Innovación.',
            price: 50,
            currency: 'USD',
            category: 'Admisiones',
            modality: 'hibrido' as const,
            duration: '18 meses',
            availableSlots: 30,
            targetAudience: 'Profesionales con título universitario y experiencia laboral que buscan posiciones de liderazgo',
            objectives: ['Evaluar candidatos para el MBA Digital', 'Seleccionar perfiles de alto potencial', 'Conformar una cohorte diversa y complementaria'],
            benefits: ['Acceso al MBA más innovador de la región', 'Red de contactos C-Level', 'Doble titulación disponible', 'Prácticas en empresas partner'],
            painPoints: ['Incertidumbre sobre el proceso de admisión', 'Competencia por plazas limitadas', 'Falta de orientación vocacional ejecutiva'],
            requirements: ['Título universitario', 'Mínimo 3 años de experiencia laboral', 'Ensayo de admisión', 'Entrevista personal'],
            deadline: new Date('2026-08-15'),
            status: 'activo' as const,
            tags: ['MBA', 'Admisión', 'Digital'],
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

    // 6. Create sample team (skip if already exists)
    const existingTeam = await prisma.team.findFirst({
        where: { orgId: org.id, name: 'Equipo de Ventas IA' },
    });
    if (!existingTeam) {
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
    } else {
        console.log(`✅ Team already exists: ${existingTeam.name}`);
    }

    // 6b. Create AI Agents (skip if already exists)
    const agentDefinitions = [
        {
            name: 'Asistente de Ventas',
            role: 'Sales Closer',
            personality: 'professional' as const,
            avatar: '💼',
            tone: 'Profesional, consultivo y orientado a resolver dudas de forma empática',
            systemPrompt: 'Eres un asesor educativo experto. Tu objetivo es ayudar a los prospectos a encontrar el programa educativo ideal para sus necesidades. Usa los datos reales del catálogo para hacer recomendaciones personalizadas. Maneja objeciones con empatía y ofrece soluciones concretas. Siempre verifica la información contra el catálogo antes de responder.',
            expertise: ['ventas consultivas', 'educación', 'manejo de objeciones'],
            isActive: true,
        },
        {
            name: 'Recolector de Información',
            role: 'BDR Agent',
            personality: 'friendly' as const,
            avatar: '📋',
            tone: 'Amigable, curioso y eficiente en recopilar datos del prospecto',
            systemPrompt: 'Eres un asistente amigable que ayuda a recopilar información de prospectos interesados en programas educativos. Tu objetivo es obtener: nombre completo, teléfono/WhatsApp, correo electrónico, programa de interés y nivel de urgencia. Hazlo de forma conversacional y natural, sin que parezca un formulario.',
            expertise: ['recopilación de datos', 'clasificación de leads', 'cualificación'],
            isActive: true,
        },
        {
            name: 'Asistente de Catálogo',
            role: 'Catalog Expert',
            personality: 'enthusiastic' as const,
            avatar: '🎓',
            tone: 'Entusiasta, conocedor y detallado al presentar la oferta educativa',
            systemPrompt: 'Eres un experto en la oferta educativa de la institución. Conoces cada curso, programa, webinar y servicio en detalle. Ayudas a los usuarios a explorar el catálogo, comparar opciones y encontrar exactamente lo que necesitan. Siempre fundamenta tus respuestas en datos reales del catálogo.',
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
