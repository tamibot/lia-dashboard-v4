import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const GEMINI_KEY = 'GEMINI_KEY_FROM_ENV';
const OPENAI_KEY = 'OPENAI_KEY_FROM_ENV';

async function main() {
    console.log('🌱 Seeding full demo data...\n');

    // 1. Upsert demo organization
    const org = await prisma.organization.upsert({
        where: { slug: 'innovation-institute' },
        update: {
            name: 'Innovation Institute',
            type: 'instituto',
            description: 'Instituto líder en tecnología educativa enfocado en IA, estrategia empresarial y transformación digital. Formamos a los líderes del mañana con programas prácticos y actuales.',
            tagline: 'Transformando el futuro a través de la educación',
            website: 'https://innovation-institute.edu',
            contactEmail: 'info@innovation-institute.edu',
            location: 'Ciudad de México, México',
            specialty: 'Inteligencia Artificial y Transformación Digital',
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
                facebook: 'innovationinstitute',
            },
            courseCategories: ['Inteligencia Artificial', 'Marketing Digital', 'Liderazgo', 'Data Science', 'UX/UI Design', 'Negocios Digitales'],
            onboardingComplete: true,
        },
        create: {
            slug: 'innovation-institute',
            name: 'Innovation Institute',
            type: 'instituto',
            description: 'Instituto líder en tecnología educativa enfocado en IA, estrategia empresarial y transformación digital.',
            tagline: 'Transformando el futuro a través de la educación',
            website: 'https://innovation-institute.edu',
            contactEmail: 'info@innovation-institute.edu',
            location: 'Ciudad de México, México',
            specialty: 'Inteligencia Artificial y Transformación Digital',
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
                facebook: 'innovationinstitute',
            },
            courseCategories: ['Inteligencia Artificial', 'Marketing Digital', 'Liderazgo', 'Data Science', 'UX/UI Design', 'Negocios Digitales'],
            onboardingComplete: true,
        },
    });
    console.log(`✅ Organization: ${org.name} (${org.id})`);

    // 2. Create admin user
    const passwordHash = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@innovation-institute.edu' },
        update: { name: 'Admin Principal', role: 'admin', isActive: true },
        create: {
            orgId: org.id,
            email: 'admin@innovation-institute.edu',
            passwordHash,
            name: 'Admin Principal',
            role: 'admin',
        },
    });
    console.log(`✅ Admin user: ${admin.email}`);

    // 3. Save API keys for the organization
    await prisma.apiKey.upsert({
        where: { orgId_provider: { orgId: org.id, provider: 'gemini' } },
        update: { encryptedKey: GEMINI_KEY },
        create: { orgId: org.id, provider: 'gemini', encryptedKey: GEMINI_KEY },
    });
    console.log(`✅ Gemini API key saved`);

    await prisma.apiKey.upsert({
        where: { orgId_provider: { orgId: org.id, provider: 'openai' } },
        update: { encryptedKey: OPENAI_KEY },
        create: { orgId: org.id, provider: 'openai', encryptedKey: OPENAI_KEY },
    });
    console.log(`✅ OpenAI API key saved`);

    // 4. Courses
    const coursesData = [
        {
            code: 'CRS-AI2024-001',
            title: 'Inteligencia Artificial Aplicada a los Negocios',
            subtitle: 'Domina las herramientas de IA que están transformando las empresas modernas',
            description: 'Este curso te lleva de cero a experto en el uso estratégico de la Inteligencia Artificial en entornos empresariales. Aprenderás a implementar soluciones de IA, automatizar procesos, y tomar decisiones basadas en datos. Con un enfoque 100% práctico, trabajarás con las herramientas más demandadas del mercado.',
            category: 'Inteligencia Artificial',
            instructor: 'Dr. Carlos Méndez',
            instructorBio: 'Doctor en Ciencias Computacionales, ex-Google, con 15 años de experiencia implementando IA en Fortune 500.',
            price: 497,
            currency: 'USD',
            earlyBirdPrice: 397,
            modality: 'online' as const,
            duration: '8 semanas',
            totalHours: 40,
            objectives: [
                'Implementar soluciones de IA en procesos empresariales reales',
                'Evaluar y seleccionar herramientas de IA según necesidades específicas',
                'Diseñar estrategias de transformación digital basadas en IA',
                'Automatizar tareas repetitivas usando agentes de IA',
                'Crear prompts efectivos para maximizar el rendimiento de modelos LLM',
            ],
            targetAudience: 'Directivos, gerentes y profesionales que buscan liderar la transformación digital de su organización sin necesidad de conocimientos técnicos previos.',
            status: 'activo' as const,
            tags: ['IA', 'Negocios', 'Transformación Digital', 'ChatGPT', 'Automatización'],
            tools: ['ChatGPT', 'Gemini', 'Midjourney', 'Make.com', 'Notion AI', 'Copilot'],
            benefits: [
                'Certificado avalado por Innovation Institute',
                'Acceso a comunidad exclusiva de más de 2,000 alumni',
                'Mentoría personalizada 1:1 con el instructor',
                'Acceso de por vida a las actualizaciones del contenido',
                'Recursos descargables y plantillas listas para usar',
            ],
            requirements: ['Laptop con internet', 'Conocimientos básicos de ofimática', 'Actitud abierta al cambio'],
            painPoints: [
                'Miedo a quedar obsoleto ante el avance de la IA',
                'No saber por dónde empezar con las herramientas de IA',
                'Perder horas en tareas que la IA puede hacer en minutos',
            ],
            guarantee: '30 días de garantía de devolución sin preguntas',
            socialProof: [
                '"Aumenté mi productividad un 300% en el primer mes" - María López, CEO',
                '"El mejor curso de IA que he tomado. 100% aplicable." - Juan Torres, Gerente',
                'Más de 500 alumnos certificados con 4.9/5 de calificación promedio',
            ],
            bonuses: [
                'BONO 1: Taller en vivo de automatización con Make.com (valor: $200)',
                'BONO 2: Pack de 50 prompts profesionales para negocios',
                'BONO 3: Sesión de Q&A mensual con el instructor',
            ],
            syllabusModules: [
                { week: 1, title: 'Fundamentos de IA para Negocios', description: 'Conceptos clave, panorama del mercado y casos de uso empresariales', topics: ['¿Qué es la IA generativa?', 'LLMs y cómo funcionan', 'Panorama de herramientas 2024', 'Casos de éxito empresariales'], hours: 5, sortOrder: 1 },
                { week: 2, title: 'Prompt Engineering Avanzado', description: 'Técnicas para extraer el máximo valor de los modelos de IA', topics: ['Anatomía de un prompt efectivo', 'Chain-of-thought prompting', 'Prompts para marketing, ventas y operaciones', 'Evaluación de outputs'], hours: 5, sortOrder: 2 },
                { week: 3, title: 'Automatización con IA', description: 'Conecta herramientas y crea flujos de trabajo automatizados', topics: ['Introducción a Make.com y Zapier', 'Flujos de captura de leads con IA', 'Automatización de email marketing', 'Integración con CRM'], hours: 5, sortOrder: 3 },
                { week: 4, title: 'IA para Marketing y Contenidos', description: 'Escala tu producción de contenido sin perder calidad', topics: ['Copywriting con IA', 'Imagen y video con IA', 'SEO con IA', 'Estrategia de contenidos en piloto automático'], hours: 5, sortOrder: 4 },
                { week: 5, title: 'IA para Ventas y CX', description: 'Potencia tu proceso de ventas y mejora la experiencia del cliente', topics: ['Agentes de ventas con IA', 'Chatbots inteligentes para WhatsApp', 'Análisis predictivo de clientes', 'Personalización a escala'], hours: 5, sortOrder: 5 },
                { week: 6, title: 'IA para Operaciones y Finanzas', description: 'Optimiza procesos internos y toma decisiones basadas en datos', topics: ['Análisis de datos con IA', 'Dashboards inteligentes', 'Detección de fraude y anomalías', 'Forecasting con IA'], hours: 5, sortOrder: 6 },
                { week: 7, title: 'Estrategia de Transformación Digital con IA', description: 'Diseña el plan de transformación de tu organización', topics: ['Diagnóstico de madurez digital', 'Diseño de roadmap de IA', 'Gestión del cambio', 'Métricas de éxito en IA'], hours: 5, sortOrder: 7 },
                { week: 8, title: 'Proyecto Final y Certificación', description: 'Implementa un caso de uso real en tu empresa', topics: ['Presentación de proyectos', 'Feedback del instructor', 'Ceremonia de certificación', 'Plan de acción post-curso'], hours: 5, sortOrder: 8 },
            ],
            faqs: [
                { question: '¿Necesito saber programar?', answer: 'No, este curso está diseñado para profesionales de negocios. No se requiere ningún conocimiento técnico.', sortOrder: 1 },
                { question: '¿Cuándo inician las clases?', answer: 'El acceso es inmediato. Puedes empezar en el momento que quieras.', sortOrder: 2 },
                { question: '¿Las clases son en vivo o grabadas?', answer: 'Las clases son grabadas para que aprendas a tu ritmo. Hay mentoría en vivo semanal.', sortOrder: 3 },
                { question: '¿Qué incluye el certificado?', answer: 'Certificado digital verificable avalado por Innovation Institute, con tu nombre y las competencias adquiridas.', sortOrder: 4 },
            ],
        },
        {
            code: 'CRS-MKT2024-002',
            title: 'Marketing Digital con IA Generativa',
            subtitle: 'Crea campañas que convierten usando el poder de la inteligencia artificial',
            description: 'Aprende a revolucionar tu estrategia de marketing usando las herramientas de IA más avanzadas del mercado. Domina la creación de contenido, la automatización de campañas y el análisis predictivo para multiplicar tus resultados sin aumentar tu presupuesto.',
            category: 'Marketing Digital',
            instructor: 'Ana Rodríguez',
            instructorBio: 'Estratega de growth marketing y pionera en IA para marketing en América Latina. Ex-directora de marketing en startups con exits millonarios.',
            price: 397,
            currency: 'USD',
            earlyBirdPrice: 297,
            modality: 'online' as const,
            duration: '6 semanas',
            totalHours: 30,
            objectives: [
                'Crear campañas publicitarias completas con IA en horas, no días',
                'Automatizar la producción de contenido para redes sociales',
                'Analizar métricas y optimizar campañas con herramientas de IA',
                'Diseñar estrategias de contenido en piloto automático',
                'Aumentar el ROI de tus campañas digitales',
            ],
            targetAudience: 'Profesionales de marketing, community managers, emprendedores y dueños de negocio que quieren escalar su presencia digital.',
            status: 'activo' as const,
            tags: ['Marketing', 'IA', 'Contenido', 'Redes Sociales', 'SEO', 'Ads'],
            tools: ['ChatGPT', 'Canva AI', 'Meta Ads', 'Google Ads', 'Jasper', 'Midjourney'],
            benefits: [
                'Portfolio de campañas reales listas para mostrar',
                'Playbooks y plantillas descargables',
                'Comunidad de marketers con IA',
                'Actualizaciones de por vida',
            ],
            requirements: ['Cuenta de redes sociales activa', 'Conocimientos básicos de marketing digital'],
            painPoints: [
                'Pasar horas creando contenido que nadie ve',
                'Campañas que no convierten a pesar del gasto en ads',
                'No poder escalar por falta de tiempo y recursos',
            ],
            guarantee: '30 días de garantía de devolución',
            socialProof: [
                '"Reduje mi tiempo de producción de contenido un 80%" - Roberto Chen, Emprendedor',
                '"Mis campañas de Meta ahora tienen el doble de ROAS" - Sara Jiménez, Freelancer',
            ],
            bonuses: [
                'BONO 1: Pack de 100 copy templates para ads',
                'BONO 2: Masterclass de SEO con IA (valor: $150)',
            ],
            syllabusModules: [
                { week: 1, title: 'Fundamentos de Marketing con IA', description: 'Ecosistema de herramientas y estrategia de contenidos', topics: ['Panorama de IA en marketing', 'Copywriting con ChatGPT', 'Storytelling de marca con IA'], hours: 5, sortOrder: 1 },
                { week: 2, title: 'Creación de Contenido a Escala', description: 'Producción masiva de contenido de calidad', topics: ['Imagen y diseño con Midjourney y Canva AI', 'Video corto con IA', 'Estrategia de contenidos 30 días en 1 hora'], hours: 5, sortOrder: 2 },
                { week: 3, title: 'SEO y Tráfico Orgánico con IA', description: 'Posicionamiento orgánico acelerado', topics: ['Investigación de keywords con IA', 'Escritura de artículos optimizados', 'Link building con IA'], hours: 5, sortOrder: 3 },
                { week: 4, title: 'Publicidad Pagada con IA', description: 'Maximiza el ROI de tus campañas de ads', topics: ['Creación de copies para Meta e Instagram Ads', 'Segmentación avanzada', 'Optimización con IA'], hours: 5, sortOrder: 4 },
                { week: 5, title: 'Email Marketing y Automatización', description: 'Secuencias de email que venden en automático', topics: ['Redacción de emails con IA', 'Automatización de secuencias', 'Personalización a escala'], hours: 5, sortOrder: 5 },
                { week: 6, title: 'Analítica y Optimización', description: 'Decisiones basadas en datos con IA', topics: ['Dashboards de marketing con IA', 'A/B testing inteligente', 'Proyecto final: campaña completa'], hours: 5, sortOrder: 6 },
            ],
            faqs: [
                { question: '¿Es necesario tener un negocio propio?', answer: 'No, puedes aplicar lo aprendido en clientes o proyectos personales.', sortOrder: 1 },
                { question: '¿Incluye acceso a las herramientas de pago?', answer: 'El curso usa herramientas con plan gratuito. Te indicamos cómo aprovecharlas al máximo.', sortOrder: 2 },
            ],
        },
        {
            code: 'CRS-LID2024-003',
            title: 'Liderazgo Estratégico en la Era Digital',
            subtitle: 'Desarrolla las habilidades de liderazgo que demanda el siglo XXI',
            description: 'El liderazgo ha cambiado. Los líderes de hoy deben gestionar equipos híbridos, tomar decisiones basadas en datos y navegar la transformación tecnológica con agilidad. Este programa te da las herramientas para liderar con confianza en la era digital.',
            category: 'Liderazgo',
            instructor: 'Roberto Sánchez',
            instructorBio: 'Coach ejecutivo certificado, ex-CEO de empresa tecnológica y conferencista internacional en liderazgo y transformación digital.',
            price: 350,
            currency: 'USD',
            modality: 'hibrido' as const,
            duration: '5 semanas',
            totalHours: 25,
            objectives: [
                'Liderar equipos remotos e híbridos con alta efectividad',
                'Gestionar el cambio organizacional en contextos de incertidumbre',
                'Tomar decisiones estratégicas basadas en datos',
                'Desarrollar inteligencia emocional y comunicación asertiva',
                'Construir una cultura de innovación en tu organización',
            ],
            targetAudience: 'Líderes de equipo, gerentes, directores y profesionales en transición a roles de liderazgo.',
            status: 'activo' as const,
            tags: ['Liderazgo', 'Management', 'Soft Skills', 'Equipos Remotos', 'Cultura Organizacional'],
            tools: ['Notion', 'Slack', 'Miro', 'OKR tools', 'Loom'],
            benefits: [
                'Evaluación 360° gratuita incluida',
                'Sesiones de coaching grupal semanales',
                'Acceso a red de líderes de la región',
                'Plan de desarrollo personal personalizado',
            ],
            requirements: ['Experiencia mínima de 2 años en gestión de personas', 'Disposición para el autoconocimiento'],
            painPoints: [
                'Equipos desmotivados y con alta rotación',
                'Dificultad para comunicar la visión y alinear al equipo',
                'Sentirse abrumado por la velocidad del cambio tecnológico',
            ],
            guarantee: '14 días de garantía',
            socialProof: [
                '"Transformé la cultura de mi equipo en 90 días" - Patricia Morales, Directora',
                'NPS de 92 en las últimas 5 cohortes',
            ],
            bonuses: [
                'BONO: Evaluación DISC de personalidad (valor: $80)',
            ],
            syllabusModules: [
                { week: 1, title: 'El Líder del Siglo XXI', description: 'Nuevas competencias y mentalidad de liderazgo', topics: ['Liderazgo adaptativo', 'Growth mindset', 'Autoconocimiento y estilos de liderazgo'], hours: 5, sortOrder: 1 },
                { week: 2, title: 'Gestión de Equipos de Alto Desempeño', description: 'Construye y desarrolla equipos excepcionales', topics: ['Reclutamiento y onboarding', 'Feedback efectivo', 'Motivación y engagement', 'Delegación inteligente'], hours: 5, sortOrder: 2 },
                { week: 3, title: 'Comunicación y Negociación Estratégica', description: 'Influye con integridad y comunica con impacto', topics: ['Comunicación asertiva', 'Presentaciones de alto nivel', 'Negociación win-win', 'Manejo de conflictos'], hours: 5, sortOrder: 3 },
                { week: 4, title: 'Toma de Decisiones Estratégicas', description: 'Decisiones de calidad en contextos de incertidumbre', topics: ['Pensamiento sistémico', 'Análisis de datos para líderes', 'OKRs y métricas de equipo', 'Gestión del riesgo'], hours: 5, sortOrder: 4 },
                { week: 5, title: 'Liderando el Cambio y la Innovación', description: 'Construye una organización ágil e innovadora', topics: ['Gestión del cambio', 'Cultura de innovación', 'Transformación digital desde el liderazgo', 'Plan de acción personal'], hours: 5, sortOrder: 5 },
            ],
            faqs: [
                { question: '¿Está disponible en formato 100% online?', answer: 'Es formato híbrido: contenido grabado + encuentros en vivo semanales. Todas las sesiones en vivo quedan grabadas.', sortOrder: 1 },
            ],
        },
        {
            code: 'CRS-DS2024-004',
            title: 'Data Science para No Técnicos',
            subtitle: 'Convierte datos en decisiones de negocio sin saber programar',
            description: 'Aprende a leer, interpretar y comunicar datos para tomar mejores decisiones de negocio. Este curso te enseña data science desde una perspectiva estratégica, usando herramientas visuales y IA que no requieren programación.',
            category: 'Data Science',
            instructor: 'Ing. Patricia Flores',
            instructorBio: 'Data scientist con 10 años de experiencia en banca y retail. Especialista en democratización del dato y analytics de negocio.',
            price: 447,
            currency: 'USD',
            modality: 'online' as const,
            duration: '7 semanas',
            totalHours: 35,
            objectives: [
                'Leer e interpretar dashboards y reportes de datos',
                'Identificar oportunidades de negocio a partir de datos',
                'Crear visualizaciones impactantes sin programar',
                'Implementar análisis predictivo básico',
                'Comunicar insights de datos a audiencias no técnicas',
            ],
            targetAudience: 'Gerentes, directores y profesionales que trabajen con datos pero no sean programadores.',
            status: 'activo' as const,
            tags: ['Data Science', 'Analytics', 'Business Intelligence', 'Power BI', 'Excel'],
            tools: ['Power BI', 'Google Looker Studio', 'Excel + Copilot', 'ChatGPT para análisis', 'Tableau Public'],
            benefits: [
                'Proyectos reales con datos de industria',
                'Certificado en Data Analytics for Business',
                'Templates de dashboards descargables',
            ],
            requirements: ['Excel básico', 'Interés en datos y métricas'],
            painPoints: [
                'Tomar decisiones importantes sin datos sólidos',
                'Depender del equipo técnico para cada reporte',
                'No saber qué hacer con tanta información disponible',
            ],
            guarantee: '30 días de garantía',
            socialProof: [
                '"Por primera vez entiendo nuestros datos y tomo decisiones con confianza" - Luis García, Gerente Comercial',
            ],
            bonuses: ['BONO: Pack de 20 dashboards listos para usar en Power BI'],
            syllabusModules: [
                { week: 1, title: 'El Mundo de los Datos', description: 'Conceptos fundamentales y el ecosistema de datos empresarial', topics: ['¿Qué es data science?', 'Tipos de datos y métricas', 'El ciclo del dato', 'KPIs vs métricas vanidosas'], hours: 5, sortOrder: 1 },
                { week: 2, title: 'Análisis Exploratorio', description: 'Cómo "hablar con los datos" para encontrar patrones', topics: ['Estadística básica sin fórmulas', 'Excel para análisis', 'Encontrar outliers y anomalías'], hours: 5, sortOrder: 2 },
                { week: 3, title: 'Visualización de Datos', description: 'Cuenta historias con gráficos que impactan', topics: ['Principios de visualización', 'Power BI desde cero', 'Google Data Studio'], hours: 5, sortOrder: 3 },
                { week: 4, title: 'BI y Dashboards Ejecutivos', description: 'Diseña dashboards que toman decisiones', topics: ['Diseño de dashboards ejecutivos', 'KPIs en tiempo real', 'Automatización de reportes'], hours: 5, sortOrder: 4 },
                { week: 5, title: 'Análisis Predictivo', description: 'Anticipa el futuro con modelos simples', topics: ['Forecasting básico', 'Segmentación de clientes', 'IA para análisis predictivo'], hours: 5, sortOrder: 5 },
                { week: 6, title: 'Marketing Analytics', description: 'Optimiza tus campañas con datos', topics: ['Atribución de campañas', 'LTV y CAC', 'A/B testing'], hours: 5, sortOrder: 6 },
                { week: 7, title: 'Proyecto Final', description: 'Presenta tu análisis de datos real', topics: ['Caso de negocio real', 'Presentación ejecutiva', 'Retroalimentación'], hours: 5, sortOrder: 7 },
            ],
            faqs: [
                { question: '¿Necesito saber Python o R?', answer: 'No. Usamos herramientas visuales y IA que no requieren programación.', sortOrder: 1 },
            ],
        },
    ];

    for (const courseData of coursesData) {
        const { syllabusModules, faqs, ...courseFields } = courseData;

        const course = await prisma.course.upsert({
            where: { code: courseFields.code },
            update: { ...courseFields, orgId: org.id },
            create: { orgId: org.id, ...courseFields },
        });
        console.log(`✅ Course: ${course.title}`);

        // Create syllabus modules
        for (const module of syllabusModules) {
            await prisma.syllabusModule.create({ data: { courseId: course.id, ...module } }).catch(() => null);
        }

        // Create FAQs
        for (const faq of faqs) {
            await prisma.faq.create({ data: { courseId: course.id, entityType: 'course', ...faq } }).catch(() => null);
        }
    }

    // 5. Upsert Program (Diplomado)
    const program = await prisma.program.upsert({
        where: { code: 'PRG-MBA2024-001' },
        update: {
            title: 'Diplomado Ejecutivo en Inteligencia Artificial para Negocios',
            description: 'Programa integral de 6 meses diseñado para líderes y directivos que quieren dominar la IA empresarial. Combina fundamentos técnicos con aplicación estratégica, trabajo en proyectos reales y acceso a una red exclusiva de peers.',
            category: 'Inteligencia Artificial',
            modality: 'online',
            totalDuration: '6 meses',
            totalHours: 120,
            price: 2497,
            currency: 'USD',
            certification: 'Diplomado Ejecutivo en IA para Negocios',
            certifyingEntity: 'Innovation Institute',
            objectives: ['Visión estratégica de IA empresarial', 'Implementación práctica en tu organización', 'Liderazgo en transformación digital', 'Red de contactos de alto nivel'],
            targetAudience: 'C-Level, directores funcionales y gerentes senior que buscan liderar la transformación de sus organizaciones.',
            status: 'activo',
            tags: ['IA', 'Diplomado', 'Ejecutivo', 'Transformación Digital'],
            tools: ['ChatGPT', 'Power BI', 'Make.com', 'Notion', 'Python básico'],
            benefits: ['Red exclusiva de alumni ejecutivos', 'Certificado avalado internacionalmente', 'Acceso a mentores de C-level', 'Bolsa de trabajo exclusiva'],
            guarantee: '30 días de satisfacción garantizada',
        },
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
            certification: 'Diplomado Ejecutivo en IA para Negocios',
            certifyingEntity: 'Innovation Institute',
            objectives: ['Visión estratégica de IA', 'Implementación práctica', 'Liderazgo en transformación digital'],
            targetAudience: 'C-Level y directores funcionales',
            status: 'activo',
            tags: ['IA', 'Diplomado', 'Ejecutivo'],
            tools: ['ChatGPT', 'Python', 'Power BI'],
        },
    });
    console.log(`✅ Program: ${program.title}`);

    // Program courses (módulos)
    const programModules = [
        { title: 'Módulo 1: Fundamentos de IA para Ejecutivos', description: 'Introducción estratégica a la IA y su impacto empresarial', hours: 20, instructor: 'Dr. Carlos Méndez', topics: ['Historia y evolución de la IA', 'Tipos de IA y su aplicación', 'Casos de uso empresariales'], sortOrder: 1 },
        { title: 'Módulo 2: Estrategia de Datos y Analytics', description: 'Cómo convertir datos en ventajas competitivas', hours: 20, instructor: 'Ing. Patricia Flores', topics: ['Data strategy', 'Business intelligence', 'Modelos predictivos básicos'], sortOrder: 2 },
        { title: 'Módulo 3: IA para Marketing y Ventas', description: 'Automatización y personalización del proceso comercial', hours: 20, instructor: 'Ana Rodríguez', topics: ['Marketing automation con IA', 'Agentes de ventas', 'Customer journey con IA'], sortOrder: 3 },
        { title: 'Módulo 4: Operaciones y Procesos con IA', description: 'Optimización de la cadena de valor con inteligencia artificial', hours: 20, instructor: 'Dr. Carlos Méndez', topics: ['Automatización RPA', 'Supply chain con IA', 'Eficiencia operativa'], sortOrder: 4 },
        { title: 'Módulo 5: Liderazgo y Gestión del Cambio en IA', description: 'Cómo liderar la transformación digital de tu organización', hours: 20, instructor: 'Roberto Sánchez', topics: ['Cultura de innovación', 'Gestión del cambio', 'Ética en IA'], sortOrder: 5 },
        { title: 'Módulo 6: Proyecto de Transformación Digital', description: 'Implementa un caso de uso real de IA en tu empresa', hours: 20, instructor: 'Panel de instructores', topics: ['Diseño del proyecto', 'Implementación', 'Presentación ejecutiva'], sortOrder: 6 },
    ];

    for (const mod of programModules) {
        await prisma.programCourse.create({ data: { programId: program.id, ...mod } }).catch(() => null);
    }

    // 6. Webinar
    const webinar = await prisma.webinar.upsert({
        where: { code: 'WBN-AI2024-001' },
        update: {
            title: 'Masterclass: El Fin de las Páginas Web Tradicionales',
            description: 'Descubre cómo los Agentes de Venta con IA y las interfaces conversacionales están reemplazando las páginas web estáticas. Aprende a crear tu primer agente de ventas en esta sesión práctica.',
            type: 'masterclass',
            speaker: 'Ing. Miguel Torres',
            speakerBio: 'Pionero en agentes de ventas con IA en América Latina. Ha implementado más de 100 agentes para empresas en la región.',
            speakerTitle: 'CEO & Fundador, AI Agents Lab',
            eventDate: new Date('2025-03-15'),
            eventTime: '19:00 GMT-5',
            duration: '90 minutos',
            price: 0,
            currency: 'USD',
            maxAttendees: 500,
            category: 'Tecnología',
            targetAudience: 'Emprendedores digitales, marketers y dueños de negocio',
            topics: ['Agentes IA de ventas', 'Chatbots vs Agentes', 'Conversational Commerce', 'Demo en vivo'],
            tags: ['Webinar', 'IA', 'Gratis', 'Agentes', 'Ventas'],
            status: 'activo',
            registrationLink: 'https://innovation-institute.edu/webinar-agentes',
            benefits: ['Grabación disponible 48 horas después', 'Recursos descargables exclusivos', 'Q&A en vivo con el speaker'],
            callToAction: 'Regístrate gratis y asegura tu lugar',
        },
        create: {
            orgId: org.id,
            code: 'WBN-AI2024-001',
            title: 'Masterclass: El Fin de las Páginas Web Tradicionales',
            description: 'Descubre cómo los Agentes de Venta con IA están cambiando el juego.',
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
    console.log(`✅ Webinar: ${webinar.title}`);

    // 7. AI Agent demo
    const agent = await prisma.aiAgent.upsert({
        where: { id: (await prisma.aiAgent.findFirst({ where: { orgId: org.id } }))?.id || 'non-existent' },
        update: {},
        create: {
            orgId: org.id,
            name: 'LIA Asesora Académica',
            role: 'Asesora de ventas educativas y atención al estudiante',
            personality: 'friendly',
            tone: 'Cálido, profesional y motivador. Habla de tú con el prospecto.',
            language: 'es',
            expertise: ['Cursos de IA', 'Programas ejecutivos', 'Financiamiento educativo', 'Orientación vocacional'],
            systemPrompt: 'Eres LIA, la asesora académica de Innovation Institute. Tu objetivo es guiar a los prospectos hacia el programa educativo que mejor se adapte a sus necesidades. Siempre saluda con calidez, identifica las metas del prospecto y presenta las opciones más relevantes con sus beneficios clave. Invita siempre a agendar una llamada de orientación gratuita.',
            isActive: true,
        },
    }).catch(async () => prisma.aiAgent.findFirst({ where: { orgId: org.id } }));
    console.log(`✅ AI Agent: ${agent?.name ?? 'existing agent'}`);

    // 8. Team demo
    const team = await prisma.team.findFirst({ where: { orgId: org.id } });
    if (!team) {
        const newTeam = await prisma.team.create({
            data: {
                orgId: org.id,
                name: 'Equipo de Ventas IA',
                description: 'Equipo especializado en vender programas de inteligencia artificial',
                members: {
                    create: [
                        { name: 'Juan Pérez', email: 'juan@innovation-institute.edu', role: 'Closer Senior', phone: '+52 55 1234 5678' },
                        { name: 'María López', email: 'maria@innovation-institute.edu', role: 'SDR', phone: '+52 55 8765 4321' },
                        { name: 'Carlos Vega', email: 'carlos@innovation-institute.edu', role: 'Account Manager', phone: '+52 55 1111 2222' },
                    ],
                },
            },
        });
        console.log(`✅ Team: ${newTeam.name}`);
    } else {
        console.log(`✅ Team already exists: ${team.name}`);
    }

    console.log('\n✨ Full seed completado!\n');
    console.log('📋 Login credentials:');
    console.log('   Email: admin@innovation-institute.edu');
    console.log('   Password: admin123\n');
    console.log('🔑 API Keys registradas:');
    console.log('   Gemini: ✅');
    console.log('   OpenAI: ✅\n');
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => {
        console.error('Seed error:', e);
        prisma.$disconnect();
        process.exit(1);
    });
