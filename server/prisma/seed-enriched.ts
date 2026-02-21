import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Enriched seed iniciando...\n');

    // Get existing org
    const org = await prisma.organization.findUnique({ where: { slug: 'innovation-institute' } });
    if (!org) { console.error('❌ Org not found. Run seed-full.ts first.'); return; }

    // 1. Update org with full profile: sedes, horarios, redes sociales
    await prisma.organization.update({
        where: { id: org.id },
        data: {
            name: 'Innovation Institute',
            type: 'instituto',
            description: 'Instituto de tecnología e innovación líder en América Latina. Formamos a los profesionales del futuro con programas de vanguardia en Inteligencia Artificial, Data Science, Ciberseguridad y Transformación Digital. Con más de 5,000 alumnos certificados en 12 países, somos el puente entre el conocimiento y la aplicación práctica.',
            tagline: 'Transformando el futuro a través de la tecnología y la innovación',
            website: 'https://innovation-institute.edu',
            contactEmail: 'info@innovation-institute.edu',
            location: 'Ciudad de México, México',
            specialty: 'Inteligencia Artificial · Data Science · Ciberseguridad · Transformación Digital',
            accreditations: 'ISO 9001:2015 | Reconocimiento SEP | Miembro AACSB | Partner Microsoft Education | Partner Google Cloud',
            history: 'Fundado en 2018 por un grupo de ingenieros y científicos de datos con experiencia en Silicon Valley, Innovation Institute nació con la misión de democratizar el acceso a la educación tecnológica de calidad en América Latina. En 6 años hemos certificado a más de 5,000 profesionales en 12 países y nos hemos consolidado como el instituto de referencia en IA y tecnología aplicada.',
            branding: {
                colors: { primary: '#2563EB', secondary: '#0EA5E9', accent: '#8B5CF6', neutral: '#6B7280', dark: '#0F172A' },
                typography: { headings: 'Inter', body: 'Inter' },
                voice: { tone: 'profesional y cercano', style: 'Experto, motivador, orientado a resultados', keywords: ['innovación', 'IA', 'transformación', 'futuro', 'tecnología', 'impacto'] },
                visualIdentity: { mood: 'Tecnológico, moderno, confiable', shapes: 'rounded', iconography: 'minimalista' },
            },
            socialMedia: {
                instagram: '@innovationinstitute_latam',
                linkedin: 'innovation-institute-mx',
                youtube: '@InnovationInstituteLATAM',
                facebook: 'InnovationInstituteMX',
                twitter: '@InnovationInst',
                tiktok: '@innovationinstitute',
                website: 'https://innovation-institute.edu',
            },
            operatingHours: [
                { days: 'Lunes a Viernes', hours: '09:00 - 19:00' },
                { days: 'Sábados', hours: '09:00 - 14:00' },
                { days: 'Domingos y Festivos', hours: 'Cerrado' },
            ],
            courseCategories: ['Inteligencia Artificial', 'Data Science', 'Ciberseguridad', 'Marketing Digital', 'Liderazgo', 'UX/UI Design', 'Negocios Digitales', 'Desarrollo de Software', 'Cloud Computing'],
            onboardingComplete: true,
        },
    });
    console.log('✅ Org profile updated with full details');

    // 2. Find or create teams
    let devTeam = await prisma.team.findFirst({ where: { orgId: org.id, name: 'Equipo de Tecnología e IA' } });
    if (!devTeam) {
        devTeam = await prisma.team.create({
            data: {
                orgId: org.id,
                name: 'Equipo de Tecnología e IA',
                description: 'Instructores especializados en inteligencia artificial, data science y desarrollo tecnológico',
                members: {
                    create: [
                        { name: 'Dr. Carlos Méndez', email: 'carlos.mendez@innovation-institute.edu', phone: '+52 55 1000 2001', role: 'Director Académico - IA', availability: 'Lunes a Viernes 09:00-17:00' },
                        { name: 'Ing. Patricia Flores', email: 'patricia.flores@innovation-institute.edu', phone: '+52 55 1000 2002', role: 'Instructora Senior - Data Science', availability: 'Lunes a Viernes 10:00-18:00' },
                        { name: 'Ing. Miguel Torres', email: 'miguel.torres@innovation-institute.edu', phone: '+52 55 1000 2003', role: 'Instructor - IA y Automatización', availability: 'Martes a Sábado 09:00-17:00' },
                        { name: 'Dra. Fernanda Castro', email: 'fernanda.castro@innovation-institute.edu', phone: '+52 55 1000 2004', role: 'Instructora - Ciberseguridad', availability: 'Lunes a Viernes 08:00-16:00' },
                        { name: 'Ing. Rodrigo Lima', email: 'rodrigo.lima@innovation-institute.edu', phone: '+52 55 1000 2005', role: 'Instructor - Cloud y DevOps', availability: 'Lunes a Viernes 11:00-19:00' },
                    ],
                },
            },
        });
    }
    console.log(`✅ Team: ${devTeam.name}`);

    let mktTeam = await prisma.team.findFirst({ where: { orgId: org.id, name: 'Equipo de Marketing y Negocios' } });
    if (!mktTeam) {
        mktTeam = await prisma.team.create({
            data: {
                orgId: org.id,
                name: 'Equipo de Marketing y Negocios',
                description: 'Instructores especializados en marketing digital, negocios y liderazgo',
                members: {
                    create: [
                        { name: 'Ana Rodríguez', email: 'ana.rodriguez@innovation-institute.edu', phone: '+52 55 1000 3001', role: 'Instructora Senior - Marketing Digital', availability: 'Lunes a Viernes 10:00-18:00' },
                        { name: 'Roberto Sánchez', email: 'roberto.sanchez@innovation-institute.edu', phone: '+52 55 1000 3002', role: 'Instructor - Liderazgo Estratégico', availability: 'Lunes a Sábado 09:00-17:00' },
                        { name: 'Lic. Valeria Mora', email: 'valeria.mora@innovation-institute.edu', phone: '+52 55 1000 3003', role: 'Instructora - UX/UI Design', availability: 'Lunes a Viernes 09:00-17:00' },
                        { name: 'MBA Diego Castillo', email: 'diego.castillo@innovation-institute.edu', phone: '+52 55 1000 3004', role: 'Instructor - Negocios Digitales', availability: 'Martes a Sábado 10:00-18:00' },
                    ],
                },
            },
        });
    }
    console.log(`✅ Team: ${mktTeam.name}`);

    let salesTeam = await prisma.team.findFirst({ where: { orgId: org.id, name: 'Equipo de Ventas IA' } });
    if (salesTeam) {
        // Add more members to existing sales team
        await prisma.teamMember.createMany({
            data: [
                { teamId: salesTeam.id, name: 'Laura Gutiérrez', email: 'laura.gutierrez@innovation-institute.edu', phone: '+52 55 1000 1001', role: 'Closers Senior', availability: 'Lunes a Viernes 09:00-18:00' },
                { teamId: salesTeam.id, name: 'Pedro Hernández', email: 'pedro.hernandez@innovation-institute.edu', phone: '+52 55 1000 1002', role: 'SDR - Prospección', availability: 'Lunes a Viernes 09:00-17:00' },
                { teamId: salesTeam.id, name: 'Sofía Ramírez', email: 'sofia.ramirez@innovation-institute.edu', phone: '+52 55 1000 1003', role: 'Account Manager', availability: 'Lunes a Sábado 10:00-18:00' },
            ],
            skipDuplicates: true,
        });
        console.log(`✅ Team Ventas updated with new members`);
    }

    // 3. Additional courses
    const newCourses = [
        {
            code: 'CRS-SEC2024-005',
            title: 'Ciberseguridad Empresarial desde Cero',
            subtitle: 'Protege tu empresa de las amenazas digitales del siglo XXI',
            description: 'La ciberseguridad ya no es solo para técnicos. Este curso te enseña a identificar vulnerabilidades, implementar políticas de seguridad y proteger los activos digitales de tu organización. Aprende con simulaciones reales de ataques y casos de empresas que sufrieron brechas de seguridad costosas.',
            category: 'Ciberseguridad',
            instructor: 'Dra. Fernanda Castro',
            instructorBio: 'PhD en Ciberseguridad, ex-analista de inteligencia del gobierno mexicano y consultora para bancos y empresas Fortune 500.',
            price: 527,
            currency: 'USD',
            earlyBirdPrice: 397,
            modality: 'online' as const,
            duration: '8 semanas',
            totalHours: 40,
            objectives: ['Identificar y evaluar vulnerabilidades en tu infraestructura digital', 'Implementar políticas de seguridad efectivas', 'Responder ante incidentes de seguridad', 'Proteger datos sensibles y cumplir normativas (GDPR, ISO 27001)', 'Entrenar a tu equipo en buenas prácticas de seguridad'],
            targetAudience: 'Directivos, gerentes de TI, encargados de sistemas y cualquier profesional responsable de la seguridad digital de una organización.',
            status: 'activo' as const,
            tags: ['Ciberseguridad', 'Seguridad Informática', 'GDPR', 'ISO 27001', 'Hacking Ético'],
            tools: ['Kali Linux (demo)', 'Wireshark', 'OWASP ZAP', 'Microsoft Defender', 'Cloudflare'],
            benefits: ['Certificado en Ciberseguridad Empresarial', 'Acceso a simuladores de ataques virtuales', 'Plantillas de políticas de seguridad listas para usar', 'Comunidad de CISOs y líderes de seguridad'],
            requirements: ['Conocimientos básicos de redes e internet', 'Acceso a una computadora con permisos de administrador'],
            painPoints: ['Miedo constante a sufrir un ciberataque y no saber cómo responder', 'Empleados que convierten en vulnerabilidades de seguridad sin saberlo', 'Incumplimiento de normativas que puede resultar en multas millonarias'],
            guarantee: '30 días de garantía de devolución',
            socialProof: ['"Detectamos y bloqueamos un intento de ransomware gracias a lo aprendido" - Ernesto Vidal, CTO', 'Calificación 4.9/5 en más de 200 reseñas'],
            bonuses: ['BONO 1: Auditoría de seguridad básica step-by-step (valor: $300)', 'BONO 2: Templates de política de contraseñas y accesos', 'BONO 3: Sesión de hacking ético en vivo con la instructora'],
            syllabusModules: [
                { week: 1, title: 'Fundamentos de Ciberseguridad', description: 'El panorama de amenazas actual y conceptos clave', topics: ['Tipos de ciberataques (ransomware, phishing, DDoS)', 'El modelo CIA (Confidencialidad, Integridad, Disponibilidad)', 'Marco NIST de ciberseguridad'], hours: 5, sortOrder: 1 },
                { week: 2, title: 'Seguridad de Redes', description: 'Protege tu infraestructura de red', topics: ['Firewalls y VPNs', 'Segmentación de red', 'Monitoreo de tráfico con Wireshark'], hours: 5, sortOrder: 2 },
                { week: 3, title: 'Seguridad en la Nube', description: 'Protege tus activos en AWS, Azure y Google Cloud', topics: ['Configuración segura de la nube', 'Control de acceso IAM', 'Encriptación de datos en reposo y tránsito'], hours: 5, sortOrder: 3 },
                { week: 4, title: 'Ingeniería Social y Phishing', description: 'El factor humano: la mayor vulnerabilidad', topics: ['Técnicas de phishing avanzado', 'Simulaciones de ataques de ingeniería social', 'Entrenamiento de empleados'], hours: 5, sortOrder: 4 },
                { week: 5, title: 'Seguridad de Aplicaciones Web', description: 'Protege tus aplicaciones y APIs', topics: ['OWASP Top 10', 'Pruebas de penetración básicas', 'Seguridad en APIs REST'], hours: 5, sortOrder: 5 },
                { week: 6, title: 'Normativas y Cumplimiento', description: 'GDPR, ISO 27001 y regulaciones locales', topics: ['Requisitos GDPR para empresas latinoamericanas', 'Certificación ISO 27001 paso a paso', 'Auditorías de seguridad'], hours: 5, sortOrder: 6 },
                { week: 7, title: 'Respuesta a Incidentes', description: 'Qué hacer cuando ocurre un ataque', topics: ['Plan de respuesta a incidentes', 'Análisis forense básico', 'Comunicación de crisis'], hours: 5, sortOrder: 7 },
                { week: 8, title: 'Proyecto Final: Auditoría de Seguridad', description: 'Aplica todo lo aprendido en un caso real', topics: ['Auditoría completa de una empresa ficticia', 'Presentación de hallazgos y recomendaciones', 'Plan de remediación'], hours: 5, sortOrder: 8 },
            ],
            faqs: [
                { question: '¿Es un curso de hacking?', answer: 'No exactamente. Es ciberseguridad defensiva orientada a negocios. Usamos conceptos de hacking ético para entender las amenazas, pero el enfoque es siempre proteger.', sortOrder: 1 },
                { question: '¿Necesito instalar software especial?', answer: 'Usaremos entornos virtuales seguros. No necesitas instalar nada en tu máquina principal.', sortOrder: 2 },
            ],
        },
        {
            code: 'CRS-CLOUD2024-006',
            title: 'Cloud Computing y AWS para Empresas',
            subtitle: 'Lleva tu empresa a la nube y reduce costos operativos hasta un 40%',
            description: 'La nube ya no es el futuro, es el presente. Este curso te enseña a migrar tu infraestructura a AWS, optimizar costos y escalar tu negocio sin límites. Aprende con laboratorios prácticos usando cuentas reales de AWS (se incluye crédito de $100 en AWS).',
            category: 'Cloud Computing',
            instructor: 'Ing. Rodrigo Lima',
            instructorBio: 'AWS Solutions Architect Professional con 12 años de experiencia. Ha liderado migraciones a la nube para empresas con más de 1 millón de usuarios.',
            price: 497,
            currency: 'USD',
            earlyBirdPrice: 377,
            modality: 'online' as const,
            duration: '7 semanas',
            totalHours: 35,
            objectives: ['Diseñar arquitecturas cloud escalables y seguras en AWS', 'Migrar aplicaciones y datos a la nube sin tiempo de inactividad', 'Optimizar costos usando las herramientas de AWS', 'Implementar alta disponibilidad y recuperación ante desastres', 'Obtener las bases para la certificación AWS Cloud Practitioner'],
            targetAudience: 'Directivos de IT, administradores de sistemas, desarrolladores y emprendedores que quieren aprovechar el poder de la nube.',
            status: 'activo' as const,
            tags: ['Cloud', 'AWS', 'DevOps', 'Infraestructura', 'Escalabilidad'],
            tools: ['AWS Console', 'AWS CLI', 'Terraform básico', 'Docker', 'GitHub Actions'],
            benefits: ['$100 USD en créditos de AWS incluidos', 'Bases para certificación AWS Cloud Practitioner', 'Acceso a laboratorios prácticos 24/7', 'Soporte técnico en Discord'],
            requirements: ['Conocimientos básicos de redes (IP, DNS, HTTP)', 'Computadora con 8GB de RAM mínimo', 'Cuenta de email para crear cuenta AWS'],
            painPoints: ['Servidores que se caen en los momentos más críticos', 'Costos de infraestructura fijos que no escalan con el negocio', 'Dependencia total del equipo técnico para cualquier cambio de infraestructura'],
            guarantee: '30 días de garantía',
            socialProof: ['"Redujimos nuestros costos de servidor un 45% en el primer trimestre" - Alejandro Vera, CTO Startup', 'Más de 300 alumnos con certificación AWS'],
            bonuses: ['BONO: $100 en créditos AWS para practicar', 'BONO: Guía de certificación AWS Cloud Practitioner'],
            syllabusModules: [
                { week: 1, title: 'Introducción a Cloud Computing y AWS', description: 'Fundamentos del cómputo en la nube', topics: ['¿Qué es el cloud computing?', 'Modelos IaaS, PaaS, SaaS', 'AWS Global Infrastructure', 'IAM: usuarios, roles y permisos'], hours: 5, sortOrder: 1 },
                { week: 2, title: 'Cómputo en la Nube', description: 'EC2, Lambda y contenedores', topics: ['Amazon EC2: tipos de instancias', 'AWS Lambda y serverless', 'Docker y ECS básico', 'Auto Scaling y Load Balancing'], hours: 5, sortOrder: 2 },
                { week: 3, title: 'Almacenamiento en AWS', description: 'S3, EBS, EFS y bases de datos', topics: ['Amazon S3: buckets y objetos', 'Amazon RDS y Aurora', 'DynamoDB para no-SQL', 'Estrategias de backup'], hours: 5, sortOrder: 3 },
                { week: 4, title: 'Redes en AWS: VPC', description: 'Diseña tu red privada en la nube', topics: ['Virtual Private Cloud (VPC)', 'Subnets públicas y privadas', 'Security Groups y NACLs', 'Route 53 y CloudFront (CDN)'], hours: 5, sortOrder: 4 },
                { week: 5, title: 'Seguridad y Cumplimiento', description: 'Protege tu infraestructura cloud', topics: ['AWS Security Hub', 'Encriptación con KMS', 'CloudTrail y auditoría', 'Well-Architected Framework'], hours: 5, sortOrder: 5 },
                { week: 6, title: 'Costos y Optimización', description: 'Maximiza el ROI de tu inversión en cloud', topics: ['AWS Cost Explorer', 'Reserved Instances vs Spot', 'Trusted Advisor', 'Arquitecturas para optimizar costos'], hours: 5, sortOrder: 6 },
                { week: 7, title: 'Proyecto Final: Migración a la Nube', description: 'Migra una aplicación real a AWS', topics: ['Diseño de arquitectura final', 'Migración paso a paso', 'Pruebas de carga y rendimiento', 'Presentación y revisión'], hours: 5, sortOrder: 7 },
            ],
            faqs: [
                { question: '¿Los créditos de AWS se incluyen en el precio?', answer: 'Sí, al inscribirte recibirás un código de $100 USD en créditos AWS para usar en los laboratorios.', sortOrder: 1 },
                { question: '¿Prepara para la certificación AWS?', answer: 'Cubre el 80% del temario de AWS Cloud Practitioner. Incluimos guía de estudio para el examen.', sortOrder: 2 },
            ],
        },
        {
            code: 'CRS-UX2024-007',
            title: 'UX/UI Design para Productos Digitales',
            subtitle: 'Diseña interfaces que los usuarios aman y que convierten más',
            description: 'El diseño de experiencia de usuario es uno de los campos más demandados del mundo digital. Este curso te lleva desde los fundamentos del UX hasta la entrega de prototipos de alta fidelidad con Figma. Aprende investigación de usuarios, diseño de interacción y evaluación de usabilidad.',
            category: 'UX/UI Design',
            instructor: 'Lic. Valeria Mora',
            instructorBio: 'UX Designer Senior con 8 años de experiencia en startups y agencias digitales. Ha diseñado productos con más de 2 millones de usuarios activos.',
            price: 377,
            currency: 'USD',
            earlyBirdPrice: 277,
            modality: 'online' as const,
            duration: '6 semanas',
            totalHours: 30,
            objectives: ['Realizar investigaciones de usuario con metodologías validadas', 'Diseñar wireframes, prototipos y sistemas de diseño en Figma', 'Evaluar la usabilidad de un producto con técnicas de testing', 'Crear un portfolio de UX profesional', 'Entender las métricas de UX más importantes'],
            targetAudience: 'Diseñadores gráficos que quieren evolucionar a UX, desarrolladores que quieren entender el diseño, y emprendedores digitales.',
            status: 'activo' as const,
            tags: ['UX', 'UI', 'Figma', 'Diseño', 'Usabilidad', 'Prototipado'],
            tools: ['Figma', 'Maze (testing)', 'Hotjar', 'Miro', 'Notion'],
            benefits: ['Portfolio de 3 proyectos UX completos', 'Acceso a la comunidad de diseñadores de LATAM', 'Plantillas de Figma profesionales', 'Sesiones de critique de portfolio'],
            requirements: ['No se requiere experiencia previa en diseño', 'Computadora con Figma instalado (gratuito)'],
            painPoints: ['Productos digitales con alta tasa de abandono y baja conversión', 'Diseños bonitos que los usuarios no entienden cómo usar', 'Perder tiempo y dinero rediseñando productos que nunca testeas con usuarios'],
            guarantee: '30 días de garantía',
            socialProof: ['"Conseguí mi primer trabajo como UX Designer al terminar el bootcamp" - Camila Torres', 'Portfolio de alumnos seleccionados en ferias de empleo digital'],
            bonuses: ['BONO: Kit de 50 componentes de Figma listos para usar', 'BONO: Sesión de revisión de portfolio 1:1'],
            syllabusModules: [
                { week: 1, title: 'Fundamentos de UX', description: 'Qué es la experiencia de usuario y por qué importa', topics: ['Pensamiento de diseño (Design Thinking)', 'Investigación de usuarios (entrevistas, encuestas)', 'Personas y mapas de empatía', 'Customer Journey Map'], hours: 5, sortOrder: 1 },
                { week: 2, title: 'Arquitectura de Información', description: 'Organiza el contenido para que sea fácil de encontrar', topics: ['Tree testing y card sorting', 'Jerarquía visual', 'Diseño de navegación', 'Sitemaps'], hours: 5, sortOrder: 2 },
                { week: 3, title: 'Diseño de Interacción', description: 'Wireframes y flujos de usuario', topics: ['Wireframes de baja fidelidad', 'Flujos de usuario', 'Principios de Gestalt', 'Introducción a Figma'], hours: 5, sortOrder: 3 },
                { week: 4, title: 'UI Design y Sistemas de Diseño', description: 'De los wireframes al diseño visual final', topics: ['Tipografía, color y espaciado', 'Componentes y variantes en Figma', 'Design System básico', 'Modo oscuro y accesibilidad'], hours: 5, sortOrder: 4 },
                { week: 5, title: 'Prototipado y Testing', description: 'Valida tus diseños con usuarios reales', topics: ['Prototipado de alta fidelidad en Figma', 'Pruebas de usabilidad moderadas', 'Herramientas de testing (Maze, Hotjar)', 'Métricas de UX (SUS, NPS)'], hours: 5, sortOrder: 5 },
                { week: 6, title: 'Portfolio y Carrera en UX', description: 'Presenta tu trabajo y consigue tu primer trabajo de diseño', topics: ['Presentación de caso de estudio', 'Cómo estructurar tu portfolio', 'Job hunting en diseño UX', 'Proyecto final: App completa'], hours: 5, sortOrder: 6 },
            ],
            faqs: [
                { question: '¿Necesito saber programar?', answer: 'No. UX Design se enfoca en la experiencia del usuario, no en el código. Usarás Figma, que es una herramienta visual.', sortOrder: 1 },
                { question: '¿Figma es de pago?', answer: 'Figma tiene un plan gratuito que es suficiente para el 100% del curso.', sortOrder: 2 },
            ],
        },
        {
            code: 'CRS-DEV2024-008',
            title: 'Desarrollo de Software con IA: GitHub Copilot & ChatGPT',
            subtitle: 'Programa 10x más rápido usando IA como tu copiloto de código',
            description: 'La IA ha revolucionado el desarrollo de software. Con herramientas como GitHub Copilot, ChatGPT Code Interpreter y Claude, puedes escribir código más rápido, corregir bugs en segundos y generar tests automáticos. Este curso práctico te enseña a integrar la IA en tu flujo de trabajo de desarrollo para multiplicar tu productividad.',
            category: 'Desarrollo de Software',
            instructor: 'Ing. Miguel Torres',
            instructorBio: 'Full Stack Developer con 10 años de experiencia y early adopter de GitHub Copilot desde su beta privada. Ha formado a más de 1,000 desarrolladores en IA.',
            price: 427,
            currency: 'USD',
            earlyBirdPrice: 327,
            modality: 'online' as const,
            duration: '6 semanas',
            totalHours: 30,
            objectives: ['Usar GitHub Copilot para acelerar tu desarrollo en un 200%', 'Generar, refactorizar y testear código con ChatGPT', 'Integrar IA en tu flujo CI/CD', 'Crear aplicaciones web completas con asistencia de IA', 'Revisar y depurar código usando modelos de lenguaje'],
            targetAudience: 'Desarrolladores junior y semi-senior que quieren multiplicar su productividad con IA.',
            status: 'activo' as const,
            tags: ['Desarrollo', 'GitHub Copilot', 'ChatGPT', 'Programación', 'IA para Devs'],
            tools: ['GitHub Copilot', 'ChatGPT', 'Claude', 'VS Code', 'Python', 'JavaScript'],
            benefits: ['3 meses de GitHub Copilot incluidos', 'Proyecto real en portafolio', 'Acceso a Discord de desarrolladores con IA', 'Revisión de código personalizada'],
            requirements: ['Conocimientos básicos de programación en cualquier lenguaje', 'VS Code instalado', 'Cuenta de GitHub'],
            painPoints: ['Pasar horas en Stack Overflow buscando soluciones que la IA puede darte en segundos', 'Escribir código repetitivo y aburrido que la IA puede autogenerar', 'Quedarse atrás mientras otros devs usan IA para entregar el doble en la mitad del tiempo'],
            guarantee: '30 días de garantía',
            socialProof: ['"Pasé de junior a semi-senior en 3 meses gracias a la productividad con IA" - Daniel Mora, Dev', 'El 94% de los alumnos reporta al menos 2x de mejora en velocidad de desarrollo'],
            bonuses: ['BONO: 3 meses de GitHub Copilot Individual incluidos', 'BONO: Pack de prompts avanzados para desarrollo'],
            syllabusModules: [
                { week: 1, title: 'IA para Desarrolladores: Overview', description: 'El ecosistema de IA para desarrollo y cómo aprovecharlo', topics: ['GitHub Copilot, ChatGPT, Claude y Cursor comparados', 'Configuración del entorno de desarrollo con IA', 'Primeros prompts para generación de código'], hours: 5, sortOrder: 1 },
                { week: 2, title: 'GitHub Copilot Avanzado', description: 'Domina el copiloto de código más popular', topics: ['Comandos de Copilot Chat en VS Code', 'Generación de funciones completas', 'Autocompletado inteligente de patrones', 'Copilot para múltiples lenguajes'], hours: 5, sortOrder: 2 },
                { week: 3, title: 'ChatGPT para Código', description: 'Usa el poder de GPT-4 para programar', topics: ['Prompts para arquitectura de software', 'Debugging con ChatGPT', 'Generación de tests unitarios automáticos', 'Code review con IA'], hours: 5, sortOrder: 3 },
                { week: 4, title: 'Refactorización y Optimización', description: 'Mejora código existente con IA', topics: ['Análisis de deuda técnica con IA', 'Refactorización segura asistida', 'Optimización de rendimiento', 'Migración de código legado'], hours: 5, sortOrder: 4 },
                { week: 5, title: 'IA en el Pipeline CI/CD', description: 'Automatiza tests y deploy con IA', topics: ['GitHub Actions con IA', 'Generación automática de tests E2E', 'Code scanning y seguridad con IA', 'Documentación automática con IA'], hours: 5, sortOrder: 5 },
                { week: 6, title: 'Proyecto Final: App Completa con IA', description: 'Construye una aplicación web de principio a fin usando IA', topics: ['Planificación del proyecto con IA', 'Desarrollo acelerado con Copilot', 'Testing y despliegue', 'Presentación del proyecto'], hours: 5, sortOrder: 6 },
            ],
            faqs: [
                { question: '¿GitHub Copilot es de pago?', answer: 'Sí, pero incluimos 3 meses gratuitos con tu inscripción ($30 USD de valor).', sortOrder: 1 },
                { question: '¿En qué lenguajes de programación se imparte?', answer: 'Python y JavaScript principalmente, pero las técnicas aplican a cualquier lenguaje soportado por Copilot.', sortOrder: 2 },
            ],
        },
    ];

    for (const courseData of newCourses) {
        const { syllabusModules, faqs, ...courseFields } = courseData;
        const existing = await prisma.course.findUnique({ where: { code: courseFields.code } });
        if (existing) {
            console.log(`⏭️  Course already exists: ${courseFields.title}`);
            continue;
        }
        const course = await prisma.course.create({
            data: { orgId: org.id, ...courseFields },
        });
        for (const mod of syllabusModules) {
            await prisma.syllabusModule.create({ data: { courseId: course.id, ...mod } });
        }
        for (const faq of faqs) {
            await prisma.faq.create({ data: { courseId: course.id, entityType: 'course', ...faq } });
        }
        console.log(`✅ Course created: ${course.title}`);
    }

    // 4. Additional webinars
    const newWebinars = [
        {
            code: 'WBN-DS2024-002',
            title: 'Cómo el Data Science está cambiando los Negocios',
            description: 'Una masterclass gratuita sobre cómo las empresas líderes usan el análisis de datos para tomar mejores decisiones, predecir el comportamiento del cliente y optimizar operaciones. Con casos reales de Netflix, Amazon, Mercado Libre y Rappi.',
            type: 'masterclass' as const,
            speaker: 'Ing. Patricia Flores',
            speakerBio: 'Data Scientist con 10 años de experiencia en banca, retail y tecnología.',
            speakerTitle: 'Instructora Senior, Innovation Institute',
            eventDate: new Date('2025-04-10'),
            eventTime: '18:00 GMT-5',
            duration: '75 minutos',
            category: 'Data Science',
            targetAudience: 'Directivos, gerentes y emprendedores interesados en datos',
            price: 0,
            currency: 'USD',
            status: 'activo' as const,
            topics: ['Data-driven decision making', 'Casos reales de Data Science en empresas LATAM', 'Herramientas que usa Netflix para sus recomendaciones', 'Cómo empezar con datos en tu empresa hoy'],
            tags: ['Data Science', 'Analytics', 'Negocios', 'Gratis'],
            benefits: ['Grabación disponible 72 horas', 'Plantillas de KPIs descargables', 'Q&A en vivo'],
            registrationLink: 'https://innovation-institute.edu/webinar-data-science',
            callToAction: 'Registra tu lugar gratis',
        },
        {
            code: 'WBN-CYB2024-003',
            title: 'Los 5 Ciberataques más peligrosos de 2025 y cómo evitarlos',
            description: 'Webinar especial donde la Dra. Fernanda Castro revela las amenazas cibernéticas que más han impactado a empresas en 2025, con demos en vivo de cómo funcionan los ataques y las medidas concretas para protegerte.',
            type: 'webinar' as const,
            speaker: 'Dra. Fernanda Castro',
            speakerBio: 'PhD en Ciberseguridad, ex-analista de inteligencia y consultora de seguridad empresarial.',
            speakerTitle: 'Directora de Ciberseguridad, Innovation Institute',
            eventDate: new Date('2025-04-24'),
            eventTime: '19:00 GMT-5',
            duration: '90 minutos',
            category: 'Ciberseguridad',
            targetAudience: 'Directivos, gerentes de IT y responsables de seguridad',
            price: 0,
            currency: 'USD',
            status: 'activo' as const,
            topics: ['Los 5 vectores de ataque más comunes en 2025', 'Demo en vivo: cómo funciona un ataque de phishing', 'Checklist de seguridad básica para empresas', 'Q&A sobre casos específicos'],
            tags: ['Ciberseguridad', 'Hacking', 'Seguridad', 'Gratis', 'Demo en vivo'],
            benefits: ['Checklist de seguridad descargable', 'Demo en vivo de ataques reales (entorno controlado)', 'Respuestas a preguntas de tu empresa'],
            registrationLink: 'https://innovation-institute.edu/webinar-ciberseguridad',
            callToAction: 'Regístrate gratis, cupos limitados a 300 personas',
        },
    ];

    for (const webinarData of newWebinars) {
        const existing = await prisma.webinar.findUnique({ where: { code: webinarData.code } });
        if (existing) { console.log(`⏭️  Webinar already exists: ${webinarData.title}`); continue; }
        const webinar = await prisma.webinar.create({ data: { orgId: org.id, ...webinarData } });
        console.log(`✅ Webinar: ${webinar.title}`);
    }

    // 5. Second program
    const prog2existing = await prisma.program.findUnique({ where: { code: 'PRG-CYB2024-002' } });
    if (!prog2existing) {
        const prog2 = await prisma.program.create({
            data: {
                orgId: org.id,
                code: 'PRG-CYB2024-002',
                title: 'Diplomado en Ciberseguridad y Protección Digital Empresarial',
                subtitle: 'Conviértete en el responsable de seguridad que tu empresa necesita',
                description: 'Programa integral de 4 meses que te convierte en especialista en ciberseguridad empresarial. Combina fundamentos técnicos con gestión de riesgos, cumplimiento normativo y respuesta a incidentes. Incluye preparación para la certificación CompTIA Security+.',
                category: 'Ciberseguridad',
                modality: 'online',
                totalDuration: '4 meses',
                totalHours: 80,
                price: 1897,
                currency: 'USD',
                certification: 'Diplomado en Ciberseguridad Empresarial',
                certifyingEntity: 'Innovation Institute + CompTIA Authorized Partner',
                objectives: ['Diseñar e implementar una estrategia de ciberseguridad completa', 'Obtener las bases para la certificación CompTIA Security+', 'Gestionar incidentes de seguridad y recuperación', 'Garantizar el cumplimiento de GDPR e ISO 27001'],
                targetAudience: 'Profesionales de IT, gerentes de sistemas y cualquier persona que quiera especializarse en ciberseguridad.',
                status: 'activo',
                tags: ['Ciberseguridad', 'Diplomado', 'CompTIA', 'ISO 27001', 'GDPR'],
                tools: ['Kali Linux', 'Wireshark', 'SIEM tools', 'AWS Security Hub'],
                benefits: ['Preparación para CompTIA Security+', 'Acceso a laboratorios de hacking ético 24/7', 'Red de profesionales de ciberseguridad', 'Bolsa de trabajo especializada'],
                guarantee: '30 días de satisfacción o te devolvemos tu dinero',
                programCourses: {
                    create: [
                        { title: 'Módulo 1: Fundamentos de Ciberseguridad', description: 'Conceptos clave y panorama de amenazas 2025', hours: 20, instructor: 'Dra. Fernanda Castro', topics: ['Tipos de ataques', 'Marco NIST', 'CIA Triad'], sortOrder: 1 },
                        { title: 'Módulo 2: Seguridad de Redes e Infraestructura', description: 'Protege tu red y servidores', hours: 20, instructor: 'Ing. Rodrigo Lima', topics: ['Firewalls', 'VPNs', 'Análisis de tráfico'], sortOrder: 2 },
                        { title: 'Módulo 3: Seguridad en la Nube y Aplicaciones', description: 'Cloud security y pentesting web básico', hours: 20, instructor: 'Dra. Fernanda Castro', topics: ['AWS Security', 'OWASP Top 10', 'DevSecOps'], sortOrder: 3 },
                        { title: 'Módulo 4: Gestión de Riesgos y Cumplimiento', description: 'Normativas, auditorías y respuesta a incidentes', hours: 20, instructor: 'Dra. Fernanda Castro', topics: ['ISO 27001', 'GDPR', 'Plan de respuesta a incidentes'], sortOrder: 4 },
                    ],
                },
            },
        });
        console.log(`✅ Program: ${prog2.title}`);
    }

    console.log('\n✨ Enriched seed completado exitosamente!');
    console.log('📊 Resumen:');
    console.log('   - Org: perfil completo con sedes, horarios y redes sociales ✅');
    console.log('   - Teams: 3 equipos con miembros completos ✅');
    console.log('   - Cursos nuevos: Ciberseguridad, Cloud AWS, UX/UI, Dev con IA ✅');
    console.log('   - Webinars nuevos: Data Science, Ciberseguridad 2025 ✅');
    console.log('   - Programa nuevo: Diplomado en Ciberseguridad ✅');
}

main()
    .then(() => prisma.$disconnect())
    .catch((e) => { console.error('Error:', e); prisma.$disconnect(); process.exit(1); });
