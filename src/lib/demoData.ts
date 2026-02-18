import type { OrgProfile, CursoLibre, Programa, Webinar } from './types';

// =====================================================
// DEMO: Universidad de Innovación y Gestión (UIG)
// =====================================================

export const demoProfile: OrgProfile = {
    type: 'universidad',
    name: 'Universidad de Innovación y Gestión (UIG)',
    description: 'Universidad líder en formación ejecutiva, innovación y gestión empresarial. Más de 15 años formando profesionales que transforman organizaciones con metodologías ágiles, design thinking y liderazgo digital.',
    tagline: 'Transformamos profesionales, impulsamos organizaciones',
    targetAudience: 'Profesionales de 25-50 años, mandos medios y ejecutivos que buscan actualizar competencias en innovación, gestión de proyectos y transformación digital.',
    address: 'Av. Universidad 2580, San Isidro, Lima, Perú',
    website: 'https://uig.edu.pe',
    accreditations: 'SUNEDU, PMI R.E.P, Certificación ISO 21001',
    branding: {
        primaryColor: '#1E3A5F',
        secondaryColor: '#E8B931',
        accentColor: '#2ECC71',
        fontPreference: 'moderna',
        toneOfVoice: 'formal',
    },
    onboardingComplete: true,
};

// =====================================================
// CURSOS LIBRES (6 cursos)
// =====================================================
export const demoCursos: CursoLibre[] = [
    {
        id: 'c1', title: 'Design Thinking & Innovación Aplicada', category: 'Innovación',
        description: 'Domina la metodología de Design Thinking para resolver problemas complejos en tu organización. Incluye talleres prácticos con casos reales de empresas peruanas y latinoamericanas.',
        objectives: ['Aplicar el proceso de Design Thinking en 5 etapas', 'Facilitar sesiones de ideación', 'Crear prototipos rápidos', 'Validar soluciones con usuarios reales'],
        modality: 'hibrido', duration: '8 semanas', hours: 48, price: 1200, currency: 'USD',
        instructor: 'Dra. Carolina Mendoza', instructorBio: 'PhD en Innovación, ex-consultora IDEO, 12 años de experiencia',
        syllabus: ['Fundamentos del Design Thinking', 'Empatía y Research', 'Definición del Problema', 'Ideación y Brainstorming', 'Prototipado rápido', 'Testing y validación', 'Casos de estudio Latam', 'Proyecto final'],
        targetAudience: 'Gerentes, product managers, emprendedores', maxStudents: 35, startDate: '2026-03-15', status: 'activo', createdAt: '2026-01-10T10:00:00Z', updatedAt: '2026-02-01T10:00:00Z',
    },
    {
        id: 'c2', title: 'Gestión de Proyectos con Metodologías Ágiles', category: 'Project Management',
        description: 'Aprende Scrum, Kanban y metodologías híbridas para gestionar proyectos con éxito. Preparación incluida para certificación PSM I.',
        objectives: ['Implementar Scrum en equipos reales', 'Gestionar backlogs y sprints', 'Medir velocidad y burndown', 'Prepararse para PSM I'],
        modality: 'online', duration: '6 semanas', hours: 36, price: 890, currency: 'USD',
        instructor: 'Ing. Roberto Chávez, PMP, PSM', instructorBio: 'PMP certificado, Scrum Master, 15 años en gestión de proyectos IT',
        syllabus: ['Intro a metodologías ágiles', 'Framework Scrum', 'Kanban y Lean', 'Herramientas (Jira, Trello)', 'Métricas ágiles', 'Preparación PSM I'],
        targetAudience: 'Project managers, líderes técnicos, developers', maxStudents: 40, startDate: '2026-04-01', status: 'activo', createdAt: '2026-01-15T10:00:00Z', updatedAt: '2026-02-01T10:00:00Z',
    },
    {
        id: 'c3', title: 'Administración Estratégica del Turismo', category: 'Turismo',
        description: 'Gestión moderna de empresas turísticas: revenue management, marketing digital turístico, experiencia del cliente y sostenibilidad.',
        objectives: ['Diseñar estrategias de revenue management', 'Implementar marketing digital turístico', 'Gestionar experiencia del viajero', 'Aplicar principios de turismo sostenible'],
        modality: 'presencial', duration: '10 semanas', hours: 60, price: 980, currency: 'USD',
        instructor: 'Mg. Lucía Paredes', instructorBio: 'MBA en Gestión Turística, ex-directora Marriott Perú',
        syllabus: ['Panorama del turismo global', 'Revenue management', 'E-commerce turístico', 'Experiencia del cliente', 'Marketing digital', 'Sostenibilidad', 'Gastronomía y turismo', 'Turismo cultural', 'Gestión de crisis', 'Proyecto integrador'],
        targetAudience: 'Profesionales del turismo, hoteleros, emprendedores', maxStudents: 30, startDate: '2026-03-20', status: 'activo', createdAt: '2026-01-20T10:00:00Z', updatedAt: '2026-02-01T10:00:00Z',
    },
    {
        id: 'c4', title: 'Liderazgo y Gestión del Cambio Organizacional', category: 'Liderazgo',
        description: 'Desarrolla competencias de liderazgo transformacional para gestionar procesos de cambio organizacional exitosos.',
        objectives: ['Liderar procesos de transformación', 'Gestionar resistencia al cambio', 'Diseñar planes de gestión del cambio', 'Desarrollar inteligencia emocional'],
        modality: 'online', duration: '5 semanas', hours: 30, price: 750, currency: 'USD',
        instructor: 'Dr. Fernando Rivas', instructorBio: 'PhD en Comportamiento Organizacional, consultor McKinsey 8 años',
        syllabus: ['Liderazgo transformacional', 'Modelos de gestión del cambio', 'Comunicación estratégica', 'Inteligencia emocional', 'Proyecto de cambio'],
        targetAudience: 'Directivos, gerentes de RRHH, líderes de equipo', maxStudents: 45, startDate: '2026-04-10', status: 'activo', createdAt: '2026-01-25T10:00:00Z', updatedAt: '2026-02-01T10:00:00Z',
    },
    {
        id: 'c5', title: 'Data Analytics para la Toma de Decisiones', category: 'Tecnología',
        description: 'Aprende a utilizar datos para tomar mejores decisiones de negocio. Incluye Excel avanzado, Power BI y nociones de Python.',
        objectives: ['Analizar datos con Excel y Power BI', 'Crear dashboards ejecutivos', 'Tomar decisiones basadas en datos', 'Introducción a Python para análisis'],
        modality: 'hibrido', duration: '8 semanas', hours: 48, price: 1100, currency: 'USD',
        instructor: 'Ing. María Torres', instructorBio: 'Data Scientist, ex-Amazon, certificada Google Data Analytics',
        syllabus: ['Fundamentos de analytics', 'Excel avanzado', 'Visualización de datos', 'Power BI', 'Storytelling con datos', 'Intro Python', 'Machine Learning Básico', 'Capstone project'],
        targetAudience: 'Analistas, gerentes, consultores', maxStudents: 35, startDate: '2026-05-01', status: 'borrador', createdAt: '2026-02-01T10:00:00Z', updatedAt: '2026-02-10T10:00:00Z',
    },
    {
        id: 'c6', title: 'Marketing Digital y Growth Hacking', category: 'Marketing',
        description: 'Estrategias de crecimiento acelerado: SEO/SEM, redes sociales, email marketing, funnels de conversión y analítica web.',
        objectives: ['Diseñar estrategias de growth', 'Gestionar campañas de Meta y Google Ads', 'Implementar funnels de conversión', 'Medir y optimizar ROI'],
        modality: 'online', duration: '6 semanas', hours: 36, price: 850, currency: 'USD',
        instructor: 'Lic. Andrés Gutiérrez', instructorBio: 'Growth Hacker, fundador de 2 startups, +500 campañas gestionadas',
        syllabus: ['Growth mindset', 'SEO y SEM', 'Redes sociales', 'Email marketing', 'Funnels', 'Analytics', 'A/B Testing', 'Plan de growth'],
        targetAudience: 'Marketeros, emprendedores, gerentes comerciales', maxStudents: 50, startDate: '2026-04-15', status: 'activo', createdAt: '2026-02-05T10:00:00Z', updatedAt: '2026-02-10T10:00:00Z',
    },
];

// =====================================================
// PROGRAMAS (3 programas)
// =====================================================
export const demoProgramas: Programa[] = [
    {
        id: 'p1', title: 'Especialización en Innovación y Transformación Digital', category: 'Innovación',
        description: 'Programa integral de 6 meses diseñado para líderes que necesitan dominar herramientas de innovación y transformación digital.',
        objectives: ['Liderar procesos de transformación digital', 'Implementar metodologías de innovación', 'Gestionar proyectos de cambio tecnológico', 'Desarrollar estrategias digitales'],
        modality: 'hibrido', totalDuration: '6 meses', totalHours: 180, price: 4500, currency: 'USD',
        courses: [
            { id: 'p1c1', title: 'Design Thinking y Creatividad', hours: 30, instructor: 'Dra. Carolina Mendoza', order: 1 },
            { id: 'p1c2', title: 'Transformación Digital', hours: 30, instructor: 'Ing. Pablo Soto', order: 2 },
            { id: 'p1c3', title: 'Innovación en Modelos de Negocio', hours: 30, instructor: 'Dr. Fernando Rivas', order: 3 },
            { id: 'p1c4', title: 'Data-Driven Decision Making', hours: 30, instructor: 'Ing. María Torres', order: 4 },
            { id: 'p1c5', title: 'Liderazgo Digital', hours: 30, instructor: 'Mg. Rosa Díaz', order: 5 },
            { id: 'p1c6', title: 'Proyecto Integrador de Innovación', hours: 30, instructor: 'Panel de expertos', order: 6 },
        ],
        coordinator: 'Dr. Fernando Rivas',
        certification: 'Especialista en Innovación y Transformación Digital - UIG',
        targetAudience: 'Directivos y gerentes que lideran transformación en sus organizaciones',
        maxStudents: 30, startDate: '2026-03-01', status: 'activo', createdAt: '2026-01-05T10:00:00Z', updatedAt: '2026-02-01T10:00:00Z',
    },
    {
        id: 'p2', title: 'Programa de Alta Dirección en Project Management', category: 'Project Management',
        description: 'Programa ejecutivo de 4 meses enfocado en metodologías avanzadas de gestión de proyectos, portafolios y PMO.',
        objectives: ['Dominar PMBOK y Agile', 'Diseñar y gestionar PMOs', 'Gestionar portafolios de proyectos', 'Prepararse para PMP/PgMP'],
        modality: 'online', totalDuration: '4 meses', totalHours: 120, price: 3200, currency: 'USD',
        courses: [
            { id: 'p2c1', title: 'PMBOK y Gestión Predictiva', hours: 30, instructor: 'Ing. Roberto Chávez, PMP', order: 1 },
            { id: 'p2c2', title: 'Agile y Frameworks Escalados', hours: 30, instructor: 'Mg. Diego Fernández', order: 2 },
            { id: 'p2c3', title: 'PMO y Gestión de Portafolios', hours: 30, instructor: 'Dra. Patricia López', order: 3 },
            { id: 'p2c4', title: 'Preparación PMP + Proyecto Final', hours: 30, instructor: 'Panel certificadores', order: 4 },
        ],
        coordinator: 'Ing. Roberto Chávez, PMP',
        certification: 'Alta Dirección en Project Management - UIG + 120 PDUs PMI',
        targetAudience: 'Project Managers, PMO Leads, directores de tecnología',
        maxStudents: 25, startDate: '2026-04-01', status: 'activo', createdAt: '2026-01-10T10:00:00Z', updatedAt: '2026-02-01T10:00:00Z',
    },
    {
        id: 'p3', title: 'Programa Ejecutivo en Marketing Digital y Ventas', category: 'Marketing',
        description: 'Domina el ecosistema digital: estrategia, ejecución, automatización y medición para multiplicar ventas.',
        objectives: ['Diseñar estrategias omnicanal', 'Automatizar procesos de marketing', 'Implementar CRM y funnels', 'Optimizar presupuesto publicitario'],
        modality: 'online', totalDuration: '5 meses', totalHours: 150, price: 3800, currency: 'USD',
        courses: [
            { id: 'p3c1', title: 'Estrategia Digital y Buyer Persona', hours: 30, instructor: 'Lic. Andrés Gutiérrez', order: 1 },
            { id: 'p3c2', title: 'Paid Media: Meta, Google, LinkedIn', hours: 30, instructor: 'Mg. Sofía Vargas', order: 2 },
            { id: 'p3c3', title: 'CRM, Automatización y Funnels', hours: 30, instructor: 'Ing. Carlos Ruiz', order: 3 },
            { id: 'p3c4', title: 'Content Marketing y SEO', hours: 30, instructor: 'Lic. Andrés Gutiérrez', order: 4 },
            { id: 'p3c5', title: 'Analytics, ROI y Proyecto Final', hours: 30, instructor: 'Panel de expertos', order: 5 },
        ],
        coordinator: 'Lic. Andrés Gutiérrez',
        certification: 'Especialista en Marketing Digital y Ventas - UIG',
        targetAudience: 'Marketeros, gerentes comerciales, emprendedores',
        maxStudents: 35, startDate: '2026-05-01', status: 'borrador', createdAt: '2026-02-01T10:00:00Z', updatedAt: '2026-02-10T10:00:00Z',
    },
];

// =====================================================
// WEBINARS / TALLERES (5 webinars)
// =====================================================
export const demoWebinars: Webinar[] = [
    {
        id: 'w1', title: 'Innovación Tecnológica en la Industria Minera', category: 'Minería',
        description: 'Sesión gratuita sobre cómo la IA, IoT y drones están transformando la minería en Perú y Latam.',
        speaker: 'Ing. Alejandro Vega', speakerBio: 'Director de innovación, Minera Las Bambas. 20 años en el sector.',
        date: '2026-03-22', time: '19:00', duration: '90 min', platform: 'zoom',
        price: 0, currency: 'USD', maxAttendees: 500,
        topics: ['IA en exploración minera', 'IoT y sensores', 'Drones y mapeo', 'Automatización de procesos', 'Sostenibilidad y medio ambiente'],
        targetAudience: 'Ingenieros de minas, gerentes de operaciones, profesionales del sector',
        status: 'activo', createdAt: '2026-02-01T10:00:00Z', updatedAt: '2026-02-10T10:00:00Z',
    },
    {
        id: 'w2', title: 'Project Management para Startups: Lo Esencial', category: 'PM',
        description: 'Taller práctico de 2 horas para fundadores y equipos de startups sobre gestión ágil de proyectos.',
        speaker: 'Mg. Diego Fernández', speakerBio: 'Mentor Seedstars, co-fundador 3 startups tech. SAFe Agilist.',
        date: '2026-03-29', time: '10:00', duration: '120 min', platform: 'google_meet',
        price: 45, currency: 'USD', maxAttendees: 100,
        topics: ['MVP y priorización', 'Kanban para startups', 'Métricas que importan', 'Herramientas gratuitas', 'Pitch + gestión'],
        targetAudience: 'Founders, co-founders, equipos de producto en startups',
        status: 'activo', createdAt: '2026-02-05T10:00:00Z', updatedAt: '2026-02-10T10:00:00Z',
    },
    {
        id: 'w3', title: 'IA Generativa Aplicada a la Educación', category: 'IA',
        description: 'Cómo usar ChatGPT, Gemini y otras herramientas de IA para mejorar la enseñanza y el aprendizaje.',
        speaker: 'Dra. Valentina Rojas', speakerBio: 'PhD en EdTech, investigadora MIT Media Lab, consultora UNESCO.',
        date: '2026-04-05', time: '18:00', duration: '90 min', platform: 'zoom',
        price: 25, currency: 'USD', maxAttendees: 300,
        topics: ['IA generativa: qué es y cómo funciona', 'Prompt engineering para profesores', 'Creación de contenido con IA', 'Evaluación asistida por IA', 'Ética y limitaciones'],
        targetAudience: 'Docentes, coordinadores académicos, diseñadores instruccionales',
        status: 'activo', createdAt: '2026-02-08T10:00:00Z', updatedAt: '2026-02-10T10:00:00Z',
    },
    {
        id: 'w4', title: 'Excel Avanzado para Finanzas en 2 Horas', category: 'Tecnología',
        description: 'Taller intensivo: tablas dinámicas, funciones financieras, dashboards y macros básicas.',
        speaker: 'CPA. Miguel Rosales', speakerBio: 'Contador certificado, instructor Microsoft, autor de "Excel para Contadores".',
        date: '2026-04-12', time: '09:00', duration: '120 min', platform: 'google_meet',
        price: 35, currency: 'USD', maxAttendees: 80,
        topics: ['Tablas dinámicas avanzadas', 'Funciones financieras clave', 'Dashboards en Excel', 'Automatización con macros', 'Tips de productividad'],
        targetAudience: 'Contadores, analistas financieros, tesoreros',
        status: 'activo', createdAt: '2026-02-10T10:00:00Z', updatedAt: '2026-02-12T10:00:00Z',
    },
    {
        id: 'w5', title: 'Neuromarketing: La Ciencia detrás de la Compra', category: 'Marketing',
        description: 'Masterclass sobre cómo el cerebro toma decisiones de compra y cómo aplicar estos insights en marketing.',
        speaker: 'Dra. Gabriela Montoya', speakerBio: 'PhD en Neurociencia aplicada, TEDx Speaker, autor de "Cerebro que Compra".',
        date: '2026-04-19', time: '19:00', duration: '90 min', platform: 'zoom',
        price: 0, currency: 'USD', maxAttendees: 1000,
        topics: ['Neurociencia del consumo', 'Sesgos cognitivos en marketing', 'Diseño persuasivo', 'Pricing psicológico', 'Caso práctico'],
        targetAudience: 'Marketeros, publicistas, emprendedores, psicólogos',
        status: 'borrador', createdAt: '2026-02-12T10:00:00Z', updatedAt: '2026-02-13T10:00:00Z',
    },
];

// =====================================================
// DEMO CRM/KPI DATA
// =====================================================
export interface CRMStats {
    totalLeads: number;
    newLeadsThisMonth: number;
    conversionRate: number;
    revenue: number;
    channels: { name: string; leads: number; conversion: number }[];
    advisors: { name: string; assigned: number; converted: number; pendente: number }[];
    pipeline: { stage: string; count: number; value: number }[];
    byCourse: { courseId: string; courseName: string; type: string; leads: number; enrolled: number; revenue: number }[];
}

export const demoCRMStats: CRMStats = {
    totalLeads: 847,
    newLeadsThisMonth: 156,
    conversionRate: 23.4,
    revenue: 89750,
    channels: [
        { name: 'Meta Ads', leads: 312, conversion: 26.2 },
        { name: 'Google Ads', leads: 198, conversion: 21.5 },
        { name: 'Orgánico', leads: 145, conversion: 31.0 },
        { name: 'LinkedIn', leads: 87, conversion: 18.4 },
        { name: 'Referidos', leads: 68, conversion: 42.6 },
        { name: 'Email Marketing', leads: 37, conversion: 16.2 },
    ],
    advisors: [
        { name: 'Ana Rodríguez', assigned: 180, converted: 52, pendente: 28 },
        { name: 'Carlos López', assigned: 165, converted: 45, pendente: 32 },
        { name: 'María Sánchez', assigned: 155, converted: 48, pendente: 19 },
        { name: 'Pedro García', assigned: 170, converted: 38, pendente: 41 },
        { name: 'Laura Díaz', assigned: 177, converted: 55, pendente: 22 },
    ],
    pipeline: [
        { stage: 'Nuevo Lead', count: 156, value: 0 },
        { stage: 'Contactado', count: 234, value: 0 },
        { stage: 'Interesado', count: 178, value: 187900 },
        { stage: 'Propuesta Enviada', count: 95, value: 104500 },
        { stage: 'Negociación', count: 42, value: 48300 },
        { stage: 'Matriculado', count: 198, value: 89750 },
        { stage: 'Perdido', count: 144, value: 0 },
    ],
    byCourse: [
        { courseId: 'c1', courseName: 'Design Thinking', type: 'Curso', leads: 125, enrolled: 28, revenue: 33600 },
        { courseId: 'c2', courseName: 'PM Ágil', type: 'Curso', leads: 98, enrolled: 35, revenue: 31150 },
        { courseId: 'c3', courseName: 'Admin. Turismo', type: 'Curso', leads: 45, enrolled: 12, revenue: 11760 },
        { courseId: 'c6', courseName: 'Marketing Digital', type: 'Curso', leads: 87, enrolled: 22, revenue: 18700 },
        { courseId: 'p1', courseName: 'Esp. Innovación', type: 'Programa', leads: 156, enrolled: 28, revenue: 126000 },
        { courseId: 'p2', courseName: 'Alta Dir. PM', type: 'Programa', leads: 112, enrolled: 22, revenue: 70400 },
        { courseId: 'w1', courseName: 'Minería & IA', type: 'Webinar', leads: 245, enrolled: 198, revenue: 0 },
        { courseId: 'w2', courseName: 'PM Startups', type: 'Webinar', leads: 67, enrolled: 45, revenue: 2025 },
        { courseId: 'w3', courseName: 'IA Educación', type: 'Webinar', leads: 89, enrolled: 62, revenue: 1550 },
    ],
};
