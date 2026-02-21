import type { OrgProfile, CursoLibre, Programa, Webinar, Team } from './types';

export const demoProfile: OrgProfile = {
    type: 'instituto',
    name: 'Innovation Institute',
    description: 'Líderes en formación tecnológica y de negocios para el futuro. Capacitamos a los profesionales de alto rendimiento para liderar la transformación digital en LATAM.',
    tagline: 'Transformando carreras con Inteligencia Artificial',
    specialty: 'Tecnología, Negocios e IA',
    location: 'Sede Central: Av. Javier Prado Este 456, Piso 8, San Isidro, Lima, Perú. (También contamos con campus virtual 100% online).',
    contactEmail: 'inscripciones@innovation-institute.com',
    locations: [
        {
            id: 'l1',
            name: 'Campus San Isidro (Principal)',
            address: 'Av. Javier Prado Este 456, Piso 8, San Isidro, Lima, Perú',
            mapUrl: 'https://maps.google.com/?q=Av.+Javier+Prado+Este+456'
        },
        {
            id: 'l2',
            name: 'Sede Miraflores (Tech Hub)',
            address: 'Calle Alfonso Ugarte 210, Miraflores, Lima, Perú'
        }
    ],
    operatingHours: [
        { days: 'Lunes a Viernes', hours: '08:00 - 20:00' },
        { days: 'Sábados', hours: '09:00 - 13:00' }
    ],
    branding: {
        colors: {
            primary: '#2563EB', // Blue 600
            secondary: '#1E40AF', // Blue 800
            accent: '#F59E0B', // Amber 500
            neutral: '#F3F4F6' // Gray 100
        },
        typography: {
            headings: 'Inter, sans-serif',
            body: 'Inter, sans-serif'
        },
        voice: {
            tone: 'profesional',
            style: 'Directo, inspirador, consultivo y orientado a resultados rápidos.',
            keywords: ['innovación', 'futuro', 'liderazgo', 'IA', 'transformación', 'ROI', 'escalabilidad']
        },
        visualIdentity: {
            mood: 'moderno',
            shapes: 'rounded'
        }
    },
    onboardingComplete: true,
    socialMedia: {
        instagram: '@innovation.institute',
        linkedin: 'Innovation Institute LATAM',
        website: 'www.innovation-institute.com'
    }
};

export const demoCursos: CursoLibre[] = [
    {
        id: 'c1',
        title: 'Productividad Extrema con IA y ChatGPT',
        description: 'Domina la IA generativa para ahorrar hasta 15 horas a la semana. Aprende prompting avanzado, automatización de correos, análisis de datos rápido y creación de contenido a escala.',
        objectives: ['Dominar estructuras de prompting avanzado', 'Automatizar tareas repetitivas de oficina', 'Crear contenido 10x más rápido', 'Analizar hojas de cálculo con IA'],
        targetAudience: 'Profesionales, freelancers, gerentes medios y emprendedores que sienten que les falta tiempo.',
        modality: 'online',
        startDate: '2024-04-15',
        duration: '4 semanas',
        hours: 20,
        price: 99,
        currency: 'USD',
        instructor: 'Sofia Martinez',
        instructorBio: 'Ex-Google Product Manager. Ha capacitado a más de 5,000 profesionales en el uso estratégico de IA.',
        category: 'Productividad e Innovación',
        status: 'activo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['IA', 'ChatGPT', 'Productividad', 'Low Ticket', 'Principiantes'],
        syllabus: [
            { id: 's1', title: 'Módulo 1: Fundamentos del Prompt Engineering', description: 'Bases de IA', hours: 5, topics: ['Anatomía de un prompt perfecto', 'Contexto, Tarea y Formato', 'Evitando alucinaciones'] },
            { id: 's2', title: 'Módulo 2: Automatización de Oficina', description: 'Eficiencia', hours: 8, topics: ['Gestión de correos con IA', 'Resumen de reuniones automáticos', 'Redacción de informes en segundos'] },
            { id: 's3', title: 'Módulo 3: Análisis de Datos Básicos', description: 'Datos e IA', hours: 7, topics: ['ChatGPT Code Interpreter', 'Limpieza de datos', 'Generación de gráficos rápidos'] }
        ],
        tools: ['ChatGPT', 'Zapier', 'Make', 'Excel'],
        promotions: '20% Off por lanzamiento (Cupón: IA20)',
        requirements: ['Computadora básica', 'Conexión a internet estable', 'Cuenta gratuita de ChatGPT'],
        contactInfo: { name: 'Soporte Alumnos', email: 'soporte@innovation-institute.com', phone: '+123456789' },
        attachments: [
            { id: 'att1', name: 'Prompt_Cheat_Sheet.pdf', url: 'https://example.com/prompt-cheat-sheet.pdf', type: 'pdf' },
            { id: 'att2', name: 'Intro_Video.mp4', url: 'https://example.com/intro.mp4', type: 'video' }
        ],
        benefits: ['Clases grabadas de por vida', 'Plantillas de prompts listas para usar', 'Comunidad privada en Discord'],
        painPoints: ['Siento que el día no me alcanza', 'Me paso horas respondiendo correos', 'Tengo miedo de quedarme atrás tecnológicamente'],
        guarantee: 'Garantía incondicional de 7 días. Si no ahorras al menos 5 horas en tu primera semana, te devolvemos tu dinero.',
        socialProof: ['"Este curso me devolvió mis fines de semana." - Carlos R., Analista', 'Más de 10,000 alumnos satisfechos en LATAM'],
        faqs: [
            { question: '¿Necesito saber programar?', answer: 'Absolutamente no. Empezamos desde cero.' },
            { question: '¿Es solo teoría?', answer: 'No, es 80% práctico. Construirás automatizaciones reales.' }
        ],
        bonuses: ['Bonus 1: Cheat Sheet con 100 Prompts de Negocios', 'Bonus 2: Masterclass Grabada: Creación de imágenes con Midjourney']
    },
    {
        id: 'c2',
        title: 'Growth Marketing Acelerado: Embudos de Venta con IA',
        description: 'Construye embudos de venta que convierten al 15% automatizando la captación, nutrición y cierre de leads utilizando herramientas de inteligencia artificial y automatización sin código.',
        objectives: ['Diseñar embudos de alta conversión', 'Implementar flujos automatizados en n8n', 'Crear copys persuasivos con IA', 'Medir y optimizar campañas de performance'],
        targetAudience: 'Marketers, media buyers, dueños de agencias y emprendedores buscando escalar ventas.',
        modality: 'hibrido',
        startDate: '2024-05-10',
        duration: '6 semanas',
        hours: 30,
        price: 349,
        currency: 'USD',
        instructor: 'Fernando Costa',
        instructorBio: 'Growth Hacker que escaló 3 startups a Serie B. Gestiona +$1M mensuales en ads.',
        category: 'Marketing Digital',
        status: 'activo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['Marketing', 'Embudos', 'IA', 'Automatización', 'Medium Ticket'],
        syllabus: [
            { id: 'm1', title: 'Módulo 1: Fundamentos de Conversión', description: 'Psicología y ofertas', hours: 6, topics: ['Creación de ofertas irresistibles', 'Tipos de embudos funcionales', 'Análisis de la demanda'] },
            { id: 'm2', title: 'Módulo 2: Tráfico y Captación Automatizada', description: 'Lead generation', hours: 10, topics: ['Ads con IA generativa', 'Landing pages dinámicas', 'Chatbots de perfilación'] },
            { id: 'm3', title: 'Módulo 3: Nutrición con IA', description: 'Email y WhatsApp marketing', hours: 8, topics: ['Secuencias de seguimiento dinámicas', 'Cierre conversacional preventivo'] },
            { id: 'm4', title: 'Módulo 4: Análisis Avanzado (ROI)', description: 'Métricas clave', hours: 6, topics: ['CAC vs LTV', 'Dashboarding automático en 5 min'] }
        ],
        tools: ['n8n', 'Zapier', 'ActiveCampaign', 'Elementor', 'ChatGPT'],
        promotions: 'Pago en 3 cuotas sin interés',
        requirements: ['Conocimientos básicos de marketing', 'Presupuesto mínimo para Ads ($100/mes)'],
        contactInfo: { name: 'Admisiones Growth', email: 'growth@innovation-institute.com', phone: '+123456789' },
        attachments: [
            { id: 'att3', name: 'Plantilla_Funnel.pdf', url: 'https://example.com/plantilla-funnel.pdf', type: 'pdf' }
        ],
        benefits: ['Librería de plantillas de embudos', 'Soporte técnico grupal 2 veces por semana', 'Certificado de Growth Hacking'],
        painPoints: ['Invierto en ads pero no consigo ventas', 'Mi costo de adquisición de clientes es muy alto', 'Pierdo mucho tiempo creando campañas'],
        guarantee: 'Aplica el sistema por 14 días. Si pruebas que hiciste todo el trabajo y no aumentaste tu tasa de conversión, te regresamos el doble de tu inversión.',
        socialProof: ['"Pasamos de un ROAS de 1.5 a 4.2 en 3 semanas." - Maria G., Directora de Agencia', 'Votado como el curso #1 de Performance Marketing en LATAM en 2023'],
        faqs: [
            { question: '¿Para qué industrias sirve?', answer: 'E-commerce, infoproductos, inmobiliaria, agencias y servicios B2B.' },
            { question: '¿Incluye licencias de software?', answer: 'No, pero mostramos alternativas gratuitas y te damos descuentos de partners.' }
        ],
        bonuses: ['Swipe file de Anuncios Ganadores 2024', 'Revisión grupal de tu embudo en vivo']
    },
    {
        id: 'c3',
        title: 'Finanzas para No Financieros en la Era Digital',
        description: 'Entiende y domina los números de tu negocio usando simuladores financieros e IA. Aprende a leer estados financieros, proyectar flujo de caja y tomar decisiones rentables sin ser contador.',
        objectives: ['Leer y analizar estados de resultados', 'Proyectar flujos de caja a 12 meses', 'Identificar cuellos de botella en la rentabilidad', 'Usar IA para auditar finanzas'],
        targetAudience: 'Fundadores de startups, gerentes de operaciones, emprendedores e inversionistas novatos.',
        modality: 'online',
        startDate: '2024-04-20',
        duration: '5 semanas',
        hours: 25,
        price: 199,
        currency: 'USD',
        instructor: 'Alejandra Rios',
        instructorBio: 'Ex-CFO de Fintech unicornio. Experta en simplificar finanzas corporativas complejas.',
        category: 'Negocios',
        status: 'activo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['Finanzas', 'Negocios', 'Startups', 'Medium Ticket'],
        syllabus: [
            { id: 'f1', title: 'Módulo 1: El Idioma de los Negocios', description: 'Conceptos básicos', hours: 5, topics: ['Ingresos vs Ganancias', 'Costos Fijos y Variables', 'EBITDA en términos simples'] },
            { id: 'f2', title: 'Módulo 2: Estados Financieros sin Llenar el Ojo', description: 'Análisis fácil', hours: 8, topics: ['P&L dinámico', 'Balance General', 'Flujo de Efectivo - El Rey'] },
            { id: 'f3', title: 'Módulo 3: Proyecciones con IA', description: 'Presupuestos rápidos', hours: 7, topics: ['Uso de prompts financieros para simulaciones', 'Identificar escenarios catastróficos', 'Planificación de recursos'] },
            { id: 'f4', title: 'Módulo 4: Decisiones de Inversión', description: 'ROI y capital', hours: 5, topics: ['Cuándo contratar', 'Cuándo buscar inversión', 'Pricing estratégico'] }
        ],
        tools: ['Excel', 'Google Sheets', 'Simulador Financiero Pro'],
        promotions: 'Plantillas Excel Gratis al inscribirte hoy',
        requirements: ['Ninguno, se empieza desde cero'],
        contactInfo: { name: 'Soporte Financiero', email: 'finanzas@innovation-institute.com', phone: '+123456789' },
        attachments: [
            { id: 'att4', name: 'Ejemplo_Flujo_Caja.xlsx', url: 'https://example.com/ejemplo-caja.xlsx', type: 'pdf' },
            { id: 'att5', name: 'Testimonio_Alumno.mp4', url: 'https://example.com/testimonio.mp4', type: 'video' }
        ],
        benefits: ['Modelos de Excel pre-configurados', 'Consultas de casos reales', 'Acceso al club de fundadores'],
        painPoints: ['Siento que vendo mucho pero no veo el dinero', 'No entiendo lo que me dice mi contador', 'Me da miedo quebrar por falta de flujo de caja'],
        guarantee: 'Garantía de claridad: Si en 15 días sientes que las finanzas siguen siendo "chino" para ti, te reembolsamos el 100%.',
        socialProof: ['"Alejandra me enseñó a cobrar lo que vale mi trabajo." - Jorge S., CEO', 'Top 5 cursos más recomendados por aceleradoras locales'],
        faqs: [
            { question: 'Mi negocio es muy pequeño, ¿sirve?', answer: 'Con mayor razón. Los hábitos financieros se construyen de a pocos dólares.' },
            { question: '¿Me enseñarán a hacer mis impuestos?', answer: 'No. Esto es finanzas gerenciales y toma de decisiones, no contabilidad tributaria legal.' }
        ],
        bonuses: ['Auditor Financiero Bot pre-configurado', 'Plantilla de Control de Cajas Diarias']
    },
    {
        id: 'c4',
        title: 'Liderazgo Ágil y Gestión de Equipos Remotos',
        description: 'Domina las metodologías ágiles (Scrum, Kanban) y desarrolla habilidades blandas para liderar equipos distribuidos internacionalmente con alta motivación y rendimiento.',
        objectives: ['Implementar ceremonias ágiles efectivas', 'Medir el performance sin micro-management', 'Crear una cultura de confianza a distancia', 'Manejar conflictos transculturales'],
        targetAudience: 'Scrum Masters, Project Managers, Team Leads y Directores de RRHH.',
        modality: 'online',
        startDate: '2024-05-20',
        duration: '5 semanas',
        hours: 25,
        price: 149,
        currency: 'USD',
        instructor: 'Camilo Vargas',
        instructorBio: 'Agile Coach en Spotify Europa. Más de 10 años escalando equipos remotos.',
        category: 'Habilidades Blandas',
        status: 'activo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['Liderazgo', 'Agile', 'Remoto', 'Management'],
        syllabus: [
            { id: 'l1', title: 'Módulo 1: Mindset Ágil y Cultura Remota', description: 'Bases del liderazgo a distancia', hours: 5, topics: ['De jefe a facilitador', 'Seguridad psicológica en Zoom'] },
            { id: 'l2', title: 'Módulo 2: Herramientas y Ritmos', description: 'Comunicación asíncrona', hours: 8, topics: ['Notion y Slack avanzado', 'Documentación vs Reuniones'] },
            { id: 'l3', title: 'Módulo 3: Desempeño y OKRs', description: 'Métricas que importan', hours: 7, topics: ['Estableciendo OKRs de equipo', 'Feedback radical y continuo'] },
            { id: 'l4', title: 'Módulo 4: Resolviendo la Fricción', description: 'Manejo de conflictos', hours: 5, topics: ['Burnout y bienestar', 'Microagresiones en remoto'] }
        ],
        tools: ['Jira', 'Trello', 'Miro', 'Notion', 'Slack'],
        promotions: 'Descuento para equipos (3x2)',
        requirements: ['Líderes de equipo o gestores de proyectos'],
        contactInfo: { name: 'Asesoría In-Company', email: 'b2b@innovation-institute.com', phone: '+123456789' },
        attachments: [
            { id: 'att6', name: 'Guia_Cultura_Remota.pdf', url: 'https://example.com/guia-remota.pdf', type: 'pdf' }
        ],
        benefits: ['Librería de ice-breakers para reuniones', 'Plantillas de Notion para 1-on-1s', 'Simulador de feedback difícil'],
        painPoints: ['Mi equipo está desmotivado y no enciende la cámara', 'Pierdo todo el día en reuniones improductivas', 'No sé cómo evaluar el trabajo si no los veo en la oficina'],
        guarantee: 'Garantía de 14 días. Aplica el sistema y si no reduces tus reuniones en un 30%, te devolvemos tu dinero.',
        socialProof: ['"Transformó nuestro caos remoto en una máquina sincronizada." - VP de Ing., Startup XYZ'],
        faqs: [
            { question: '¿Incluye certificación Scrum?', answer: 'No, este curso se enfoca en la práctica real, no teórica de los marcos ágiles.' },
            { question: '¿Sirve para equipos híbridos?', answer: 'Sí, los principios asíncronos son aún más valiosos en entornos híbridos.' }
        ],
        bonuses: ['Guía Onboarding 100% Remoto', 'Checklist de Contratación Asíncrona']
    },
    {
        id: 'c5',
        title: 'Ventas B2B High-Ticket: Negociación Avanzada',
        description: 'Multiplica tus cierres de contratos empresariales (>$10k USD). Aprende técnicas de cualificación profunda, superación de objeciones corporativas y mapeo de tomadores de decisión.',
        objectives: ['Acortar el ciclo de venta B2B', 'Mapear cuentas corporativas complejas (ABM)', 'Manejar comités de compra', 'Técnicas de negociación Harvard'],
        targetAudience: 'Ejecutivos de cuenta, SDRs Senior, Founders B2B y Directores Comerciales.',
        modality: 'hibrido',
        startDate: '2024-06-05',
        duration: '8 semanas',
        hours: 40,
        price: 499,
        currency: 'USD',
        instructor: 'Roberto Mendoza',
        instructorBio: 'Top 1% Global Sales Rep en Salesforce LATAM.',
        category: 'Ventas y Negociación',
        status: 'activo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['Ventas', 'B2B', 'High Ticket', 'Negociación'],
        syllabus: [
            { id: 'v1', title: 'Módulo 1: Prospectando Corporaciones', description: 'Entrando a la cuenta', hours: 10, topics: ['Cold call vs Social Selling', 'Encontrando al Champion'] },
            { id: 'v2', title: 'Módulo 2: Discovery Profundo', description: 'Encontrando el dolor real', hours: 12, topics: ['Metodología MEDDPICC', 'Preguntas que cierran tratos'] },
            { id: 'v3', title: 'Módulo 3: Presentación y Piloto', description: 'Demostrando valor', hours: 8, topics: ['Pruebas de concepto exitosas', 'Alineación con el ROI del cliente'] },
            { id: 'v4', title: 'Módulo 4: Negociación Asimétrica', description: 'Cerrando firmas', hours: 10, topics: ['Defendiendo el precio', 'Trabajando con Legal y Compras (Procurement)'] }
        ],
        tools: ['Salesforce', 'HubSpot', 'LinkedIn Sales Navigator', 'Gong'],
        promotions: 'Acceso Anticipado - 10% Off',
        requirements: ['Experiencia previa en ventas (1-2 años mínimo)', 'Perfil en LinkedIn activo'],
        contactInfo: { name: 'Admisiones B2B', email: 'ventas@innovation-institute.com', phone: '+123456789' },
        attachments: [
            { id: 'att7', name: 'Guion_Cold_Call.pdf', url: 'https://example.com/guion.pdf', type: 'pdf' },
            { id: 'att8', name: 'Roleplay_Demo.mp4', url: 'https://example.com/roleplay.mp4', type: 'video' }
        ],
        benefits: ['Roleplays en vivo cada semana', 'Guiones en frío probados', 'Acceso a directorio de emails corporativos (demo)'],
        painPoints: ['Mis prospectos me dejan en "lo vamos a revisar"', 'Procurement siempre me pide descuentos agresivos', 'El ciclo de venta toma 6 meses y se cae al final'],
        guarantee: 'Garantía ROI: Cierra al menos un trato B2B adicional usando nuestra metodología o te devolvemos la inversión (terms apply).',
        socialProof: ['"El ROI del curso fue evidente en mi primera comisión del mes." - Ejecutivo SaaS'],
        faqs: [
            { question: '¿Sirve si vendo servicios?', answer: 'Sí, tanto software, maquinaria como servicios profesionales B2B.' },
            { question: '¿Es teoría general?', answer: 'No, analizamos grabaciones de llamadas de ventas reales (Gong/Chorus).' }
        ],
        bonuses: ['Calculadora de ROI para tu prospecto', 'Plantilla de Propuesta Comercial (Docs)']
    },
    {
        id: 'c6',
        title: 'Data Storytelling: Presentaciones de Impacto',
        description: 'Deja de mostrar dashboards aburridos. Aprende a convertir datos complejos en narrativas visuales que influyan en la toma de decisiones del directorio de tu empresa.',
        objectives: ['Limpiar ruido visual en gráficos', 'Estructurar una narrativa de negocios', 'Diseñar diapositivas tipo McKinsey', 'Hablar en público frente a C-Levels'],
        targetAudience: 'Analistas de datos, Gerentes de Inteligencia Comercial, Product Managers y Consultores.',
        modality: 'online',
        startDate: '2024-05-28',
        duration: '4 semanas',
        hours: 15,
        price: 129,
        currency: 'USD',
        instructor: 'Elena Rios',
        instructorBio: 'Ex-Consultora MBB (McKinsey, BCG, Bain). Diseñadora de Información Estratégica.',
        category: 'Habilidades Blandas',
        status: 'activo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['Datos', 'Presentaciones', 'Storytelling', 'Soft Skills'],
        syllabus: [
            { id: 'd1', title: 'Módulo 1: Contexto y Audiencia', description: 'Entendiendo para quién presentas', hours: 3, topics: ['El viaje del héroe aplicado a negocios', 'Definiendo el "Action Point"'] },
            { id: 'd2', title: 'Módulo 2: Eligiendo el Gráfico Correcto', description: 'Visualización efectiva', hours: 5, topics: ['Eliminando el "Chartjunk"', 'Énfasis y color estratégico'] },
            { id: 'd3', title: 'Módulo 3: Estructura de la Presentación', description: 'El formato consultor', hours: 4, topics: ['El principio de la pirámide (Minto)', 'Títulos orientados a la acción'] },
            { id: 'd4', title: 'Módulo 4: Delivery', description: 'En la sala de juntas', hours: 3, topics: ['Manejo de preguntas hostiles', 'Timing y ritmo'] }
        ],
        tools: ['PowerPoint', 'Keynote', 'Miro', 'Think-Cell'],
        promotions: '25% Off Grupos Mínimo 3',
        requirements: ['Tener datos reales de un proyecto de tu empresa'],
        contactInfo: { name: 'Capacitación Storytelling', email: 'storytelling@innovation-institute.com', phone: '+123456789' },
        attachments: [
            { id: 'att9', name: 'Plantilla_Slides.key', url: 'https://example.com/slides.key', type: 'pdf' }
        ],
        benefits: ['Feedback personalizado de 1 presentación tuya', 'Librería de slides maestras en PPT/Keynote'],
        painPoints: ['Nadie presta atención cuando muestro mis resultados', 'Siento que el directorio no entiende mis datos', 'Paso horas armando PPTs que nadie lee'],
        guarantee: 'Garantía de impacto en 7 días.',
        socialProof: ['"Logré que aprobaran mi presupuesto gracias a cómo estructuré el caso de negocio."'],
        faqs: [
            { question: '¿Enseñan PowerBI o Tableau?', answer: 'No. Enseñamos QUÉ mostrar, no CÓMO crear el dashboard en un software específico.' }
        ],
        bonuses: ['Guía de colores corporativos accesibles', 'Checklist de revisión final']
    },
    {
        id: 'c7',
        title: 'Diseño de Interfaces (UI/UX) con Inteligencia Artificial',
        description: 'Aprende a diseñar productos digitales de clase mundial utilizando herramientas de IA generativa. Desde la investigación de usuarios hasta prototipos de alta fidelidad, descubre cómo la IA puede acelerar tu flujo creativo y mejorar la conversión.',
        objectives: ['Dominar Figma con plugins de IA', 'Generar assets visuales consistentes con Midjourney', 'Realizar auditorías de usabilidad asistidas por IA', 'Diseñar sistemas de diseño escalables'],
        targetAudience: 'Diseñadores UI/UX, diseñadores gráficos, Product Designers y emprendedores digitales.',
        modality: 'online',
        startDate: '2024-06-15',
        duration: '6 semanas',
        hours: 30,
        price: 249,
        currency: 'USD',
        instructor: 'Marco Polo',
        instructorBio: 'Lead Designer en fintech europea. Pionero en la integración de IA en procesos de diseño centrado en el usuario.',
        category: 'Diseño',
        status: 'activo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['Diseño', 'UI/UX', 'IA', 'Figma', 'Prototipado'],
        syllabus: [
            { id: 'u1', title: 'Módulo 1: AI-Driven User Research', description: 'Investigación inteligente', hours: 6, topics: ['Sintetizando entrevistas con IA', 'Creación de proto-personas rápidas', 'Mapas de empatía predictivos'] },
            { id: 'u2', title: 'Módulo 2: Generación de Assets y Estética', description: 'Visuales con IA', hours: 8, topics: ['Midjourney para Moodboards', 'Generación de iconos y fotos de stock únicas', 'Consistencia visual en prompts'] },
            { id: 'u3', title: 'Módulo 3: Prototipado Aumentado', description: 'Velocidad en Figma', hours: 10, topics: ['Plugins de IA para layouts', 'Copia (Copywriting) UX automatizada', 'Pruebas de contraste y accesibilidad'] },
            { id: 'u4', title: 'Módulo 4: El Futuro del Diseño Conversacional', description: 'Nuevos paradigmas', hours: 6, topics: ['Diseño para Agentes AI', 'Interfaces cero (Zero UI)', 'Ética en el diseño de IA'] }
        ],
        tools: ['Figma', 'Midjourney', 'Uizard', 'Relume', 'ChatGPT'],
        benefits: ['Acceso a biblioteca de prompts para diseño', 'Certificado de Especialista en AI Design', 'Networking con líderes de diseño en LATAM'],
        painPoints: ['Siento que el diseño me toma demasiado tiempo', 'Me cuesta mantenerme actualizado con las nuevas herramientas', 'Mis prototipos no parecen lo suficientemente profesionales'],
        guarantee: 'Garantía de 14 días. Si no logras crear tu primer sistema de diseño con IA, te devolvemos el dinero.',
        socialProof: ['"Reduje mi tiempo de conceptualización en un 40%." - Sara L., Freelance Designer'],
        faqs: [
            { question: '¿Debo saber dibujar?', answer: 'No, el curso se enfoca en pensamiento estratégico y herramientas digitales.' }
        ],
        bonuses: ['Bonus: Guía de Prompts para Midjourney v6', 'Bonus: Masterclass sobre Diseño de Portafolio Estratégico']
    },
    {
        id: 'c8',
        title: 'Automatización de Ventas B2B con Agentes de IA',
        description: 'Transforma tu departamento comercial en una máquina de prospección y cierre 24/7. Aprende a clonar a tus mejores vendedores usando agentes inteligentes que califican y agendan llamadas por ti.',
        objectives: ['Implementar agentes de ventas en WhatsApp y Web', 'Automatizar la prospección en LinkedIn', 'Crear flujos de seguimiento hiper-personalizados', 'Integrar IA con tu CRM actual (HubSpot/Salesforce)'],
        targetAudience: 'Gerentes de Ventas, Founders B2B, Ejecutivos Especialistas en Cierre y Agencias de Marketing.',
        modality: 'hibrido',
        startDate: '2024-07-01',
        duration: '8 semanas',
        hours: 45,
        price: 599,
        currency: 'USD',
        instructor: 'Daniela Flores',
        instructorBio: 'Experta en Sales Ops y Automatización. Ha ayudado a +50 startups a escalar sus ventas usando tecnología No-Code.',
        category: 'Ventas y Negociación',
        status: 'activo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['Ventas', 'B2B', 'IA', 'Automatización', 'Agentes'],
        syllabus: [
            { id: 'v1', title: 'Módulo 1: Arquitectura de Ventas con IA', description: 'Estrategia', hours: 10, topics: ['El nuevo embudo de ventas híbrido', 'Identificando tareas automatizables', 'Selección de stack tecnológico'] },
            { id: 'v2', title: 'Módulo 2: Clonando al Super Vendedor', description: 'Entrenamiento de Agentes', hours: 15, topics: ['Inyectando conocimiento (Knowledge Base)', 'Definiendo el tono y tácticas de cierre', 'Manejo de objeciones por IA'] },
            { id: 'v3', title: 'Módulo 3: Flujos Cross-Channel', description: 'Omnicanalidad', hours: 12, topics: ['De LinkedIn a WhatsApp automáticamente', 'Campañas de email dinámicas con IA', 'Alertas y notificaciones para el equipo humano'] },
            { id: 'v4', title: 'Módulo 4: Análisis y Escalabilidad', description: 'Optimizando el ROI', hours: 8, topics: ['Métricas de rendimiento de agentes', 'Aprender de las conversaciones perdidas', 'Escalando a miles de leads'] }
        ],
        tools: ['Make', 'n8n', 'OpenAI API', 'HubSpot', 'Instantly', 'Phantombuster'],
        benefits: ['Blueprint descargable de Agente de Ventas', 'Acceso a comunidad privada de Sales Hustlers', 'Soporte técnico para tu primera implementación'],
        painPoints: ['Mis vendedores pasan mucho tiempo calificando leads malos', 'Perdemos clientes por responder tarde', 'No logramos escalar el número de contactos diarios'],
        guarantee: 'Si en 30 días no has automatizado al menos el 50% de tu prospección inicial, te asesoramos personalmente hasta lograrlos.',
        socialProof: ['"Pasamos de 10 a 50 demos semanales sin contratar más gente." - CEO Tech Startup'],
        faqs: [
            { question: '¿Sustituirá a mis vendedores?', answer: 'No, los potenciará para que solo hablen con prospectos realmente interesados.' }
        ],
        bonuses: ['Bonus: Diccionario de Prompts de Cierre Irresistibles', 'Bonus: Guía de Cumplimiento y Ética en Ventas con IA']
    },
    {
        id: 'c9',
        title: 'Liderazgo Persuasivo para Introvertidos en Tecnología',
        description: '¿Eres un experto técnico pero te cuesta influir en las decisiones o liderar equipos? Desarrolla tu carisma desde tu autenticidad. Aprende a comunicar ideas complejas con seguridad y a navegar la política organizacional sin estrés.',
        objectives: ['Comunicar con impacto en reuniones técnicas y de negocio', 'Gestionar equipos de alto rendimiento con empatía', 'Negociar recursos y plazos efectivamente', 'Construir una marca personal como referente técnico'],
        targetAudience: 'Software Engineers, Technical Leads, Arquitectos de Software y Data Scientists que transicionan a roles de gestión.',
        modality: 'online',
        startDate: '2024-05-15',
        duration: '5 semanas',
        hours: 20,
        price: 199,
        currency: 'USD',
        instructor: 'Julian Herrera',
        instructorBio: 'Executive Coach especializado en Tech Leaders. Ex-Director de Ingeniería en unicornio latinoamericano.',
        category: 'Habilidades Blandas',
        status: 'activo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['Liderazgo', 'Comunicación', 'Tech', 'Soft Skills'],
        syllabus: [
            { id: 'h1', title: 'Módulo 1: El Poder del Líder Silencioso', description: 'Mindset', hours: 4, topics: ['Introvertido no es tímido', 'Tus fortalezas como líder técnico', 'Gestionando la energía social'] },
            { id: 'h2', title: 'Módulo 2: Comunicación Estratégica', description: 'Hablar para influir', hours: 6, topics: ['Storytelling para datos técnicos', 'Hablar en público sin ansiedad', 'Manejo de interrupciones en reuniones'] },
            { id: 'h3', title: 'Módulo 3: Gestión de Personas y Conflictos', description: 'El factor humano', hours: 6, topics: ['Feedback radical pero humano', 'Motivando a perfiles técnicos diversos', 'Negociación 1-on-1'] },
            { id: 'h4', title: 'Módulo 4: Visibilidad y Carrera', description: 'Escalando impacto', hours: 4, topics: ['Networking para introvertidos', 'Politica de oficina ética', 'Tu plan de desarrollo de liderazgo'] }
        ],
        tools: ['Notion', 'Loom', 'Miro'],
        benefits: ['Clasess grabadas y materiales de estudio', 'Sesiones de role-play grupales', 'Evaluación de perfil de liderazgo'],
        painPoints: ['Siento que las personas menos preparadas ganan las discusiones por hablar más fuerte', 'Me agoto después de un día de reuniones', 'No sé cómo pedir un aumento o ascenso de forma efectiva'],
        guarantee: 'Garantía de confianza: Si después de 3 semanas no te sientes más cómodo liderando tus reuniones, te devolvemos el dinero.',
        socialProof: ['"Finalmente entendí que mi introversión es una ventaja competitiva." - Sr. Developer'],
        faqs: [
            { question: '¿Es necesario prender la cámara?', answer: 'Sí, las sesiones interactivas requieren participación visual para practicar lenguaje no verbal.' }
        ],
        bonuses: ['Bonus: Guía de 50 frases para ganar autoridad en reuniones', 'Bonus: Plantilla de Seguimiento de Carrera (OKR Personal)']
    },
    {
        id: 'c10',
        title: 'Gestión de Proyectos Técnicos para No-Tecnológicos',
        description: '¿Trabajas con programadores y sientes que hablan otro idioma? Cierra la brecha. Aprende a gestionar proyectos de software, entender estimaciones y plazos, y asegurar entregas de calidad sin necesidad de saber programar.',
        objectives: ['Entender el ciclo de vida de desarrollo (SDLC)', 'Hablar el idioma de los desarrolladores (Frontend, Backend, APIs)', 'Gestionar expectativas de stakeholders', 'Usar herramientas ágiles (Jira/Asana) profesionalmente'],
        targetAudience: 'Product Owners, Project Managers Junior, Emprendedores no-técnicos y Gerentes de Operaciones.',
        modality: 'online',
        startDate: '2024-08-10',
        duration: '6 semanas',
        hours: 24,
        price: 229,
        currency: 'USD',
        instructor: 'Elena Vasquez',
        instructorBio: 'Project Manager Certified (PMP). Ha gestionado proyectos globales de transformación digital por más de 12 años.',
        category: 'Tecnología e Innovación',
        status: 'activo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['Project Management', 'Tech', 'Agile', 'Comunicación'],
        syllabus: [
            { id: 't1', title: 'Módulo 1: Anatomía de una Aplicación', description: 'Bases técnicas', hours: 5, topics: ['Servidores, Bases de Datos y Clientes', 'Qué es una API y por qué importa', 'Deuda técnica explicada fácil'] },
            { id: 't2', title: 'Módulo 2: Metodologías Reales (No de libro)', description: 'Agilidad práctica', hours: 7, topics: ['Scrum vs Kanban en la vida real', 'Escribiendo historias de usuario perfectas', 'Criterios de aceptación que evitan errores'] },
            { id: 't3', title: 'Módulo 3: Estimaciones y Plazos', description: 'Manejando la incertidumbre', hours: 6, topics: ['Por qué los programadores siempre tardan más', 'Cómo detectar riesgos antes de que exploten', 'Gestión de cambios de alcance'] },
            { id: 't4', title: 'Módulo 4: Herramientas y Documentación', description: 'El kit de supervivencia', hours: 6, topics: ['Configurando Jira para el éxito', 'Documentación mínima viable', 'Métricas de velocidad y calidad'] }
        ],
        tools: ['Jira', 'Asana', 'Confluence', 'Slack', 'Trello'],
        benefits: ['Glosario de términos técnicos para no-técnicos', 'Plantillas de seguimiento de proyectos', 'Checklist de revisión de requerimientos'],
        painPoints: ['Siento que mi equipo técnico me oculta información', 'No entiendo por qué una tarea "simple" toma 2 semanas', 'Me frustra que el resultado final no sea lo que pedí'],
        guarantee: 'Garantía de entendimiento: Si después del módulo 1 no entiendes cómo funciona una web, te devolvemos el dinero.',
        socialProof: ['"Por fin dejé de sentirme perdida en las reuniones con ingeniería." - Ana M., Marketing Manager'],
        faqs: [
            { question: '¿Aprenderé a programar?', answer: 'No, aprenderás a gestionar el proceso de programación.' }
        ],
        bonuses: ['Bonus: Guía de Preguntas Clave para entrevistar programadores', 'Bonus: Masterclass sobre Estimación de Presupuestos Tech']
    }
];

export const demoProgramas: Programa[] = [
    {
        id: 'p1',
        title: 'Diplomado Ejecutivo en Inteligencia Artificial para Negocios',
        description: 'Conviértete en el líder que guía la transformación de IA en tu empresa. Aprende a identificar oportunidades, mitigar riesgos e implementar agentes y automatizaciones sin escribir código.',
        objectives: ['Diseñar una estrategia de IA corporativa', 'Manejar la ética y regulación de datos', 'Implementar flujos de trabajo con agentes AI', 'Calcular el ROI de proyectos de IA'],
        targetAudience: 'Directores de Innovación, Gerentes Generales, Consultores Estratégicos y Dueños de Negocios.',
        modality: 'hibrido',
        startDate: '2024-06-01',
        totalDuration: '4 meses',
        totalHours: 120,
        courses: [
            { id: 'm1', order: 1, title: 'Estrategia y Liderazgo en la Era de la IA', hours: 20 },
            { id: 'm2', order: 2, title: 'LLMs, RAG y Modelos Empresariales Privados', hours: 30 },
            { id: 'm3', order: 3, title: 'Operaciones Ágiles: Automatización con n8n y Make', hours: 40 },
            { id: 'm4', order: 4, title: 'Proyecto Integrador Corporativo', hours: 30 }
        ],
        price: 2500,
        currency: 'USD',
        certification: 'Doble Certificación Internacional (Innovation Institute & Tech University Partner)',
        category: 'Negocios',
        status: 'activo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['High Ticket', 'IA', 'Ejecutivo', 'Negocios'],
        tools: ['OpenAI API', 'Midjourney', 'GitHub Copilot', 'Notion AI', 'Zapier'],
        promotions: 'Becas parciales disponibles por mérito',
        requirements: ['Experiencia profesional mínima de 5 años', 'Nivel de inglés intermedio (lectura)'],
        contactInfo: { name: 'Comité de Admisiones Ejecutivas', email: 'ejecutivo@innovation-institute.com', phone: '+123456789' },
        attachments: [
            { id: 'att10', name: 'Brochure_Exec.pdf', url: 'https://example.com/brochure.pdf', type: 'pdf' },
            { id: 'att11', name: 'Sesion_Informativa.mp4', url: 'https://example.com/info.mp4', type: 'video' }
        ],
        benefits: ['Networking de altísimo nivel', 'Mentoría 1:1 con expertos', 'Acceso a herramientas enterprise durante el curso'],
        painPoints: ['Mi competencia ya usa IA y nos estamos quedando atrás', 'No sé por dónde empezar a implementar IA en mi empresa', 'Tengo dudas de seguridad sobre los datos de mi empresa'],
        guarantee: 'Satisfacción total o reprogramamos tus sesiones de mentoría sin costo adicional.',
        socialProof: ['"Transformó completamente nuestra cadena de suministro." - Directora de Operaciones, RetailCorp'],
        faqs: [
            { question: '¿Cuáles son los requisitos de admisión?', answer: 'Mínimo 5 años de experiencia laboral en roles de liderazgo o gestión.' },
            { question: '¿Ofrecen cuotas sin intereses?', answer: 'Sí, hasta 6 pagos sin intereses con tarjetas afiliadas.' }
        ],
        bonuses: ['Auditoría inicial de IA para tu empresa (Valor $500)', 'Membresía anual a la Red de Innovadores Alumni']
    },
    {
        id: 'p2',
        title: 'Bootcamp Full-Stack Developer con IA',
        description: 'Acelera tu carrera como desarrollador. Construye aplicaciones web completas en tiempo récord utilizando asistentes de código como GitHub Copilot y Cursor. Domina React, Node.js y bases de datos.',
        objectives: ['Construir SPAs con React y TailwindCSS', 'Desarrollar APIs REST con Node.js y Express', 'Desplegar aplicaciones en AWS/Vercel', 'Integrar LLMs en tus aplicaciones vía API'],
        targetAudience: 'Estudiantes de tecnología, analistas que buscan cambiar a desarrollo, y programadores junior.',
        modality: 'online',
        startDate: '2024-07-15',
        totalDuration: '6 meses',
        totalHours: 240,
        courses: [
            { id: 'b1', order: 1, title: 'Fundamentos Web & UI/UX', hours: 40 },
            { id: 'b2', order: 2, title: 'Frontend Avanzado con React', hours: 60 },
            { id: 'b3', order: 3, title: 'Backend & Bases de Datos', hours: 80 },
            { id: 'b4', order: 4, title: 'Integración de IA & Despliegue', hours: 60 }
        ],
        price: 3500,
        currency: 'USD',
        certification: 'Full-Stack Developer Certificate',
        category: 'Tecnología',
        status: 'activo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['Desarrollo', 'Bootcamp', 'Medium Ticket', 'IA'],
        tools: ['React', 'Node.js', 'PostgreSQL', 'Cursor', 'Docker'],
        promotions: 'Paga al conseguir empleo (ISA)',
        requirements: ['Lógica básica de programación', 'Aprobar examen técnico de ingreso'],
        contactInfo: { name: 'Admisiones Bootcamp', email: 'bootcamp@innovation-institute.com', phone: '+123456789' },
        attachments: [
            { id: 'att12', name: 'Temario_Detallado.pdf', url: 'https://example.com/temario.pdf', type: 'pdf' }
        ],
        benefits: ['Bolsa de trabajo exclusiva', 'Revisión de código por ingenieros senior', 'Proyectos reales para tu portafolio'],
        painPoints: ['Hay demasiados tutoriales y no sé por dónde empezar', 'Me rechazan en las entrevistas por falta de experiencia', 'Aprender solo es frustrante'],
        guarantee: 'Si no consigues trabajo en tecnología en 6 meses después de graduarte, te reembolsamos el 50% de la matrícula.',
        socialProof: ['"Firmé con un startup de Silicon Valley dos semanas después del Demo Day." - Luis M., Graduado'],
        faqs: [
            { question: '¿Es sincrónico o asincrónico?', answer: 'Clases en vivo 3 veces por semana, más proyectos asincrónicos.' },
            { question: '¿Qué pasa si falto a una clase?', answer: 'Todas las sesiones quedan grabadas en nuestra plataforma.' }
        ],
        bonuses: ['Revisión de CV y perfil de LinkedIn', 'Simulacros de entrevistas técnicas en vivo']
    },
    {
        id: 'p3',
        title: 'Máster en Product Management',
        description: 'Lidera la creación de productos digitales que los usuarios amen y que generen rentabilidad. Domina el ciclo de vida completo: desde el descubrimiento (Discovery) hasta el lanzamiento (Go-To-Market) y la iteración basada en métricas.',
        objectives: ['Definir la visión y estrategia del producto', 'Liderar equipos de ingeniería y diseño (sin ser jefe directo)', 'Escribir PRDs efectivos', 'Dominar métricas de retención, engagement y monetización'],
        targetAudience: 'Ingenieros de software, diseñadores UX/UI, analistas de negocio que quieren transicionar a PM, y Product Managers Junior.',
        modality: 'hibrido',
        startDate: '2024-08-01',
        totalDuration: '8 meses',
        totalHours: 320,
        courses: [
            { id: 'm1', order: 1, title: 'Product Discovery y User Research', hours: 60 },
            { id: 'm2', order: 2, title: 'Estrategia, Roadmap y Priorización', hours: 80 },
            { id: 'm3', order: 3, title: 'Ejecución Ágil y Trabajo con Ingeniería', hours: 80 },
            { id: 'm4', order: 4, title: 'Go-To-Market, Product-Led Growth y Métricas', hours: 100 }
        ],
        price: 4500,
        currency: 'USD',
        certification: 'Advanced Certified Product Manager',
        category: 'Tecnología y Negocios',
        status: 'activo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['Product Management', 'High Ticket', 'PM', 'Tech'],
        benefits: ['Proyecto real con una startup partner', 'Mentoría 1:1 con Product Leaders de MercadoLibre y Rappi', 'Pase a la comunidad PM LATAM Private'],
        painPoints: ['No logro transicionar a PM en mi empresa actual', 'Lidero proyectos pero no estrategias', 'Mi equipo de ingeniería y yo no nos entendemos'],
        guarantee: 'Garantía de carrera: Asistencia de headhunting dedicada al finalizar.',
        socialProof: ['"El máster me dio el framework exacto para pasar la entrevista en un unicornio." - Laura T., Senior PM'],
        faqs: [
            { question: '¿Necesito saber programar?', answer: 'No, pero tendrás un módulo nivelatorio de arquitectura de software básica para conversar con ingeniería.' }
        ],
        bonuses: ['Taller intensivo para pasar la entrevista de PM (Roleplay con preguntas reales)']
    },
    {
        id: 'p4',
        title: 'Certificación Avanzada en Ciberseguridad Defensiva',
        description: 'Protege la infraestructura crítica de grandes corporaciones. Aprende Blue Teaming, Threat Hunting, Respuesta a Incidentes e implementa arquitecturas Zero Trust en entornos Cloud.',
        objectives: ['Auditar infraestructuras AWS/Azure', 'Implementar SOC/SIEM', 'Desarrollar planes de respuesta a ransomware', 'Threat hunting proactivo'],
        targetAudience: 'Administradores de red, SysAdmins, y analistas de ciberseguridad junior.',
        modality: 'online',
        startDate: '2024-09-15',
        totalDuration: '5 meses',
        totalHours: 200,
        courses: [
            { id: 'c1', order: 1, title: 'Fundamentos de Redes Seguras y Criptografía', hours: 40 },
            { id: 'c2', order: 2, title: 'Arquitectura Cloud Security (Azure/AWS)', hours: 60 },
            { id: 'c3', order: 3, title: 'Operaciones Defensivas (Blue Team, SIEM, SOAR)', hours: 50 },
            { id: 'c4', order: 4, title: 'Respuesta a Incidentes y Forense Digital', hours: 50 }
        ],
        price: 2900,
        currency: 'USD',
        certification: 'Ciberseguridad Defensiva (Alineado a CompTIA CySA+)',
        category: 'Tecnología',
        status: 'activo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['Ciberseguridad', 'IT', 'Medium Ticket'],
        tools: ['Splunk', 'Wireshark', 'Kali Linux', 'AWS Security Hub', 'CrowdStrike'],
        promotions: '10% de descuento abonando por transferencia',
        requirements: ['Conocimientos básicos de redes TCP/IP', 'Computadora con al menos 16GB de RAM'],
        contactInfo: { name: 'Admsiones Ciberseguridad', email: 'cyber@innovation-institute.com', phone: '+123456789' },
        attachments: [
            { id: 'att13', name: 'Syllabus_Cyber.pdf', url: 'https://example.com/syllabus-cyber.pdf', type: 'pdf' }
        ],
        benefits: ['Acceso a nuestro CyberRange (Simulador de ataques)', 'Voucher incluido para el examen de certificación oficial', 'Grupos pequeños (max 20)'],
        painPoints: ['Me faltan laboratorios prácticos en mi trabajo actual', 'Quiero especializarme para acceder a mejores salarios (>$5k/mes)', 'Las teorías de la universidad están desactualizadas'],
        guarantee: 'Garantía de Simulador: 30 días de periodo de prueba. Cancelación libre si el nivel técnico no es lo que esperabas.',
        socialProof: ['"Los laboratorios de ransomware del módulo 4 valen todo el precio del programa."'],
        faqs: [
            { question: '¿Enseñan hacking ético (Red Team)?', answer: 'Este programa se enfoca en defensa (Blue Team). Tenemos otro programa para ataque.' }
        ],
        bonuses: ['Licencia anual de herramientas de Threat Hunting de partners.']
    },
    {
        id: 'p5',
        title: 'Especialización en Diseño UX/UI Estratégico',
        description: 'Transforma problemas de negocio en interfaces hermosas, accesibles y de alta conversión. Domina Figma avanzado, sistemas de diseño y procesos de investigación (Research) profunda.',
        objectives: ['Crear Sistemas de Diseño escalables', 'Ejecutar pruebas de usabilidad', 'Mapear Customer Journeys', 'Dominar prototipado avanzado en Figma'],
        targetAudience: 'Diseñadores gráficos, maquetadores front-end, y profesionales creativos.',
        modality: 'online',
        startDate: '2024-10-10',
        totalDuration: '4 meses',
        totalHours: 160,
        courses: [
            { id: 'c1', order: 1, title: 'UX Research y Psicología del Usuario', hours: 40 },
            { id: 'c2', order: 2, title: 'Arquitectura de Información e Interaction Design', hours: 40 },
            { id: 'c3', order: 3, title: 'UI Avanzado, Accesibilidad y Design Systems', hours: 50 },
            { id: 'c4', order: 4, title: 'Handoff y Creación de Portafolio Estratégico', hours: 30 }
        ],
        price: 1800,
        currency: 'USD',
        certification: 'Strategic UX/UI Designer',
        category: 'Diseño',
        status: 'activo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['UX/UI', 'Diseño', 'Figma', 'Focalizado'],
        tools: ['Figma', 'Miro', 'Notion', 'Hotjar'],
        promotions: 'Licencia Premium de Figma Educativa por 1 año',
        requirements: ['Sin requisitos previos', 'Creatividad y ganas de aprender'],
        contactInfo: { name: 'Comunidad UX', email: 'ux@innovation-institute.com', phone: '+123456789' },
        attachments: [
            { id: 'att14', name: 'Caso_Estudio_UI.pdf', url: 'https://example.com/caso-ui.pdf', type: 'pdf' }
        ],
        benefits: ['Revisión mensual de portafolio por expertos de agencia', 'Plantillas de Design Systems de nivel corporativo'],
        painPoints: ['Mis diseños son bonitos pero los programadores dicen que no se pueden construir', 'No sé justificar mis decisiones de diseño con datos', 'Me estanco cobrando barato en plataformas freelance'],
        guarantee: 'Satisfacción 100% en los primeros 14 días.',
        socialProof: ['"Pasé de cobrar $200 por una web a $3,500 justificando el valor de la investigación de usuarios."'],
        faqs: [
            { question: '¿Necesito Mac?', answer: 'No, usaremos Figma que funciona en el navegador en cualquier SO.' }
        ],
        bonuses: ['Masterclass de IA para diseñadores (Midjourney + UI Generativa)']
    },
    {
        id: 'p5',
        title: 'Master en Transformación Digital y Dirección de IA',
        description: 'El programa más completo para liderar la evolución tecnológica de organizaciones enteras. Combina visión estratégica, gestión del cambio y dominio técnico de vanguardia.',
        objectives: ['Liderar procesos de digitalización a escala', 'Gestionar presupuestos de innovación millonarios', 'Estructurar departamentos de IA y Datos', 'Definir el roadmap tecnológico a 5 años'],
        targetAudience: 'Chief Digital Officers (CDOs), Gerentes de Tecnología, Consultores de Senior y Directivos.',
        modality: 'hibrido',
        startDate: '2024-09-01',
        totalDuration: '12 meses',
        totalHours: 350,
        courses: [
            { id: 'tm1', order: 1, title: 'Gobierno de Datos y Ética Algorítmica', hours: 40 },
            { id: 'tm2', order: 2, title: 'Cloud Architecture & Scalability', hours: 50 },
            { id: 'tm3', order: 3, title: 'AI Business Models & Monetization', hours: 40 },
            { id: 'tm4', order: 4, title: 'Change Management & Digital Culture', hours: 40 },
            { id: 'tm5', order: 5, title: 'Master Thesis Project (Capstone)', hours: 100 }
        ],
        price: 8500,
        currency: 'USD',
        certification: 'Master de Innovación y Tecnología (Acreditación Europea)',
        category: 'Negocios',
        status: 'activo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['Masters', 'Dirección', 'Tech', 'MBA'],
        tools: ['AWS', 'Google Cloud', 'Microsoft Azure', 'Tableau', 'PowerBI', 'Jira'],
        benefits: ['Viaje de inmersión a Silicon Valley opcional', 'Acceso a red global de CXOs', 'Doble titulación internacional'],
        painPoints: ['Mi empresa tiene la tecnología pero no la cultura para usarla', 'No sé cómo medir el éxito real de nuestras iniciativas digitales', 'Me siento inseguro liderando equipos técnicos de alto nivel'],
        guarantee: 'Garantía de Crecimiento: Si en 6 meses de graduado no has escalado tu posición o ingresos, recibes 2 años de mentoría ejecutiva gratuita.',
        socialProof: ['"Este master me dio la confianza para pasar de Manager a VP de Tecnología." - Eduardo S.'],
        faqs: [
            { question: '¿Requiere saber programar?', answer: 'Se requiere una base técnica, pero el enfoque es estratégico y directivo.' }
        ],
        bonuses: ['Bonus: Preparación para Certificación PMP', 'Bonus: Acceso de por vida a la biblioteca de casos de estudio HBR']
    },
    {
        id: 'p6',
        title: 'Especialista en Operaciones No-Code (No-Code Ops)',
        description: 'Aprende a construir el "sistema operativo" de cualquier empresa sin escribir una sola línea de código. Conecta herramientas, automatiza flujos y crea dashboards de control inteligentes.',
        objectives: ['Dominar Make (Integromat) y Zapier a nivel experto', 'Construir intranets y CRMs personalizados con Notion y Airtable', 'Crear flujos de aprobación y portales de cliente No-Code', 'Reducir costes operativos eliminando tareas manuales'],
        targetAudience: 'Operations Managers, Freelancers, Solopreneurs y entusiastas de la eficiencia.',
        modality: 'online',
        startDate: '2024-07-15',
        totalDuration: '6 meses',
        totalHours: 120,
        courses: [
            { id: 'oc1', order: 1, title: 'Arquitectura de Datos con Airtable', hours: 30 },
            { id: 'oc2', order: 2, title: 'Automatización Avanzada con Make', hours: 40 },
            { id: 'oc3', order: 3, title: 'Interfaces de Usuario con Softr y Stacker', hours: 30 },
            { id: 'oc4', order: 4, title: 'Gestión de Sistemas No-Code Escalables', hours: 20 }
        ],
        price: 1200,
        currency: 'USD',
        certification: 'No-Code Operations Specialist Certification',
        category: 'Productividad',
        status: 'activo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['No-Code', 'Automatización', 'Operaciones', 'Eficiencia'],
        tools: ['Make', 'Airtable', 'Notion', 'Zapier', 'Softr', 'Tally'],
        benefits: ['Librería de +50 Blueprints de automatización', 'Cuenta educativa premium de Airtable por 6 meses', 'Feedback en vivo en tus proyectos reales'],
        painPoints: ['Paso el día haciendo copy-paste entre hojas de cálculo', 'Nuestros procesos son lentos y propensos a errores humanos', 'Pagar por software a medida es demasiado caro para nosotros'],
        guarantee: 'Garantía de Retorno: Si no ahorras al menos 10 horas semanales con lo aprendido, te devolvemos el dinero.',
        socialProof: ['"Logré reemplazar un software de $300/mes con una solución propia en Airtable en un fin de semana."'],
        faqs: [
            { question: '¿Es difícil aprender Make?', answer: 'Tiene una curva de aprendizaje, pero nuestro método visual lo hace muy intuitivo.' }
        ],
        bonuses: ['Bonus: Pack de iconos premium para tus apps', 'Bonus: Guía de seguridad de datos en herramientas No-Code']
    },
    {
        id: 'p7',
        title: 'Bootcamp de Análisis de Datos y Visualización Estratégica',
        description: 'Pasa de los datos a las decisiones. Aprende a recolectar, limpiar y analizar información para contar historias que impulsen el crecimiento del negocio.',
        objectives: ['Dominar SQL para extracción de datos', 'Realizar análisis estadístico descriptivo y predictivo', 'Crear visualizaciones impactantes con PowerBI o Tableau', 'Traducir hallazgos técnicos en recomendaciones de negocio'],
        targetAudience: 'Analistas Jr, profesionales de Marketing, Finanzas o Ventas que quieran ser Data-Driven.',
        modality: 'online',
        startDate: '2024-05-20',
        totalDuration: '3 meses',
        totalHours: 100,
        courses: [
            { id: 'da1', order: 1, title: 'Fundamentos de SQL y Bases de Datos', hours: 25 },
            { id: 'da2', order: 2, title: 'Análisis Exploratorio con Python (Numpy/Pandas)', hours: 35 },
            { id: 'da3', order: 3, title: 'Visualización y Dashboarding Profesional', hours: 25 },
            { id: 'da4', order: 4, title: 'Storytelling con Datos para Stakeholders', hours: 15 }
        ],
        price: 899,
        currency: 'USD',
        certification: 'Data Analyst Bootcamp Certified',
        category: 'Tecnología e Innovación',
        status: 'activo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['Data Science', 'BI', 'Analytics', 'Bootcamp'],
        tools: ['PowerBI', 'Tableau', 'SQL', 'Python', 'Excel Avanzado'],
        benefits: ['Acceso a datasets reales de empresas partners', 'Tutorías grupales semanales', 'Preparación para entrevistas técnicas'],
        painPoints: ['Tengo mucha data pero no sé qué significa', 'Mis dashboards en Excel son lentos y difíciles de mantener', 'No sé cómo presentar mis conclusiones a la gerencia'],
        guarantee: 'Garantía de Empleabilidad: Te ayudamos a optimizar tu LinkedIn y Portfolio para atraer recruiters.',
        socialProof: ['"Gracias al proyecto integrador, conseguí mi primer trabajo como Analista de Datos Senior."'],
        faqs: [
            { question: '¿Necesito saber matemáticas avanzadas?', answer: 'Con aritmética básica y lógica es suficiente; nosotros te enseñamos la estadística necesaria.' }
        ],
        bonuses: ['Bonus: Masterclass de Python para principiantes', 'Bonus: Suscripción a Datacamp por 3 meses']
    },
    {
        id: 'p8',
        title: 'Especialista en IA Generativa para Marketing',
        description: 'Domina las herramientas que están redefiniendo el marketing digital. Aprende a generar contenido, segmentar audiencias y optimizar campañas usando modelos de lenguaje y visión por computadora.',
        objectives: ['Crear estrategias de contenido 100% asistidas por IA', 'Generar imágenes y videos publicitarios realistas', 'Personalización de emails a escala con LLMs', 'Análisis de sentimiento y tendencias en tiempo real'],
        targetAudience: 'Content Managers, Copywriters, Media Buyers y Gerentes de Marketing.',
        modality: 'online',
        startDate: '2024-08-05',
        totalDuration: '4 meses',
        totalHours: 80,
        courses: [
            { id: 'mc1', order: 1, title: 'Prompt Engineering para Copywriters', hours: 20 },
            { id: 'mc2', order: 2, title: 'Generación Visual: Midjourney & Stable Diffusion', hours: 25 },
            { id: 'mc3', order: 3, title: 'IA para Social Media & Ads', hours: 20 },
            { id: 'mc4', order: 4, title: 'Marketing Automation & AI Analytics', hours: 15 }
        ],
        price: 750,
        currency: 'USD',
        certification: 'AI Marketing Specialist Certification',
        category: 'Marketing',
        status: 'activo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['IA', 'Marketing', 'Especialización', 'Creative'],
        tools: ['ChatGPT', 'Midjourney', 'Canva AI', 'Jasper', 'Copy.ai'],
        benefits: ['Librería de +100 prompts de marketing probados', 'Acceso a herramientas beta de IA', 'Feedback de expertos en campañas reales'],
        painPoints: ['Me toma días escribir un solo artículo de blog', 'Gasto mucho en diseñadores para piezas simples', 'Mis campañas tienen un CTR muy bajo'],
        guarantee: 'Garantía de Creatividad: Si no aprendes a generar un mes de contenido en un día, te devolvemos el dinero.',
        socialProof: ['"Redujimos nuestros costos de producción de contenido en un 70%."'],
        faqs: [
            { question: '¿La IA reemplazará a los creativos?', answer: 'No, reemplazará a los creativos que no usen IA.' }
        ],
        bonuses: ['Bonus: Guía de SEO para Contenido Generado por IA', 'Bonus: Masterclass sobre Ética y Copyright en IA']
    },
    {
        id: 'p9',
        title: 'Liderazgo Digital y Gestión de Equipos Remotos',
        description: 'Desarrolla las competencias necesarias para dirigir organizaciones en la era de la ubicuidad. Aprende a mantener la cultura, la productividad y el compromiso sin importar la distancia física.',
        objectives: ['Implementar metodologías de trabajo asíncrono', 'Construir confianza y cultura en entornos virtuales', 'Dominar herramientas de colaboración remota', 'Gestionar el rendimiento por resultados (no por horas)'],
        targetAudience: 'Líderes de equipo, HR Managers, y Directivos de empresas en transición al remoto.',
        modality: 'online',
        startDate: '2024-09-12',
        totalDuration: '3 meses',
        totalHours: 60,
        courses: [
            { id: 'lc1', order: 1, title: 'Cultura y Confianza en Equipos Distribuidos', hours: 15 },
            { id: 'lc2', order: 2, title: 'Comunicación Asíncrona Estratégica', hours: 15 },
            { id: 'lc3', order: 3, title: 'Diseño de Procesos y Herramientas Remotas', hours: 15 },
            { id: 'lc4', order: 4, title: 'Salud Mental y Bienestar en el Teletrabajo', hours: 15 }
        ],
        price: 499,
        currency: 'USD',
        certification: 'Digital Leadership & Remote Management Certified',
        category: 'Habilidades Blandas',
        status: 'activo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['Liderazgo', 'Remoto', 'Gestión', 'Cultura'],
        tools: ['Slack', 'Notion', 'Miro', 'Loom', 'Tandem'],
        benefits: ['Manual de Trabajo Remoto para tu empresa', 'Sesiones de mentoring grupal con líderes de startups remotas', 'Checklist de onboarding para empleados remotos'],
        painPoints: ['Siento que mi equipo no trabaja si no los veo', 'Nuestros reuniones por Zoom son eternas y aburridas', 'Perdemos el sentido de pertenencia y cultura'],
        guarantee: 'Garantía de Productividad: Mejora el engagement de tu equipo en 3 meses o te asesoramos gratis.',
        socialProof: ['"Este curso salvó la cultura de nuestra agencia durante el crecimiento internacional."'],
        faqs: [
            { question: '¿Es solo para empresas de tecnología?', answer: 'No, es para cualquier empresa que quiera adoptar un modelo flexible o remoto.' }
        ],
        bonuses: ['Bonus: Guía de Compensación y Beneficios para Equipos Globales', 'Bonus: Plantilla de Acuerdo de Trabajo Remoto (Legal)']
    },
    {
        id: 'p10',
        title: 'Finanzas para Emprendedores y Líderes No-Financieros',
        description: 'Toma el control de los números de tu negocio. Aprende a leer estados financieros, proyectar flujo de caja y tomar decisiones basadas en rentabilidad real, no solo en ventas.',
        objectives: ['Entender el P&L, Balance General y Cash Flow', 'Realizar proyecciones financieras realistas', 'Determinar el punto de equilibrio y márgenes de ganancia', 'Preparar la empresa para búsqueda de inversión o préstamos'],
        targetAudience: 'Emprendedores, Founders, Gerentes de Área y Dueños de Pequeñas Empresas.',
        modality: 'online',
        startDate: '2024-10-20',
        totalDuration: '3 meses',
        totalHours: 45,
        courses: [
            { id: 'fc1', order: 1, title: 'Fundamentos: El Lenguaje del Dinero', hours: 10 },
            { id: 'fc2', order: 2, title: 'Gestión de Tesorería y Flujo de Caja', hours: 15 },
            { id: 'fc3', order: 3, title: 'Costos, Precios y Rentabilidad', hours: 10 },
            { id: 'fc4', order: 4, title: 'Finanzas para el Crecimiento y Escalabilidad', hours: 10 }
        ],
        price: 349,
        currency: 'USD',
        certification: 'Business Finance for Entrepreneurs Certificate',
        category: 'Negocios',
        status: 'activo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['Finanzas', 'Negocios', 'Gestión', 'Admin'],
        tools: ['Excel', 'QuickBooks', 'Xero', 'Holded'],
        benefits: ['Plantilla Maestra de Proyecciones Financieras en Excel', 'Diccionario de términos financieros para humanos', 'Acceso a comunidad de emprendedores'],
        painPoints: ['No sé si mi negocio es realmente rentable', 'Me quedo sin efectivo a fin de mes a pesar de vender mucho', 'Los inversores me hacen preguntas que no sé responder'],
        guarantee: 'Garantía de Claridad: Si después del módulo 2 no entiendes tu flujo de caja, te devolvemos el dinero.',
        socialProof: ['"Por fin entiendo a mi contador y puedo tomar decisiones estratégicas."'],
        faqs: [
            { question: '¿Necesito ser experto en Excel?', answer: 'Con saber lo básico es suficiente, nosotros te entregamos las plantillas listas.' }
        ],
        bonuses: ['Bonus: Masterclass sobre Valuación de Startups', 'Bonus: Guía de Impuestos para Negocios Digitales']
    }
];

export const demoWebinars: Webinar[] = [
    {
        id: 'w1',
        title: 'Masterclass: El Fin de las Páginas Web Tradicionales',
        description: 'Descubre cómo los Agentes de Venta y las interfaces conversacionales están matando el modelo antiguo de e-commerce. Únete en vivo y descubre nuestro playbook de conversión para multiplicar tus leads por 3.',
        type: 'masterclass',
        speaker: 'Alejandro Torres (CEO, Innovation Institute)',
        date: '2024-03-25',
        time: '19:00',
        duration: '1.5 horas',
        price: 0,
        currency: 'USD',
        targetAudience: 'Marketing Managers, E-commerce Owners, Agencias de Marketing y Emprendedores.',
        category: 'Tendencias y Marketing',
        status: 'activo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['Webinar', 'Gratis', 'Ventas', 'Tendencias', 'IA'],
        tools: ['ChatGPT', 'Make', 'Typeform'],
        promotions: 'Sorteo al final del evento en vivo',
        requirements: ['Interés en innovación y automatización'],
        contactInfo: { name: 'Soporte Webinars', email: 'webinars@innovation-institute.com', phone: '+123456789' },
        attachments: [
            { id: 'att15', name: 'Playbook_Sales.pdf', url: 'https://example.com/playbook.pdf', type: 'pdf' }
        ],
        benefits: ['Casos de estudio reales B2B y B2C', 'Sesión de Q&A en vivo de 30 minutos', 'Plantilla descargable de embudo conversacional'],
        painPoints: ['El costo de adquisición de clientes está por las nubes', 'Las landing pages ya no convierten como antes', 'La competencia está robando mis clientes con respuestas más rápidas'],
        guarantee: 'Invierte solo 90 minutos de tu tiempo a cambio de estrategias accionables que podrás implementar mañana mismo en tu negocio.',
        socialProof: ['Nuestros webinars anteriores han tenido más de 5,000 registros y una tasa de satisfacción del 98%.'],
        faqs: [
            { question: '¿Quedará grabado?', answer: 'Sí, pero los asistentes en vivo recibirán un recurso exclusivo que no enviaremos en la grabación.' },
            { question: '¿Necesito saber programar para implementar esto?', answer: 'No, hablaremos de estrategias y herramientas No-Code accesibles para cualquier persona.' }
        ],
        bonuses: ['Plantilla de Copywriting Conversacional a los asistentes en vivo.', 'Auditoría gratuita de funnel para 2 asistentes elegidos al azar.']
    },
    {
        id: 'w2',
        title: 'Taller Práctico: Crea tu Primera Automatización en n8n',
        description: 'Deja de hacer tareas manuales. En solo 2 horas, construiremos juntos un flujo automatizado que conectará tu correo, CRM y WhatsApp usando n8n.',
        type: 'taller',
        speaker: 'Laura Salazar (Ingeniera de Automatización)',
        date: '2024-04-05',
        time: '10:00',
        duration: '2 horas',
        price: 19,
        currency: 'USD',
        targetAudience: 'Marketers, administradores y emprendedores digitales que sienten que pierden el tiempo copiando y pegando datos.',
        category: 'Tecnología',
        status: 'activo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['Taller Pago', 'Automatización', 'n8n', 'Low Ticket', 'Práctico'],
        tools: ['n8n', 'Webhook testing tools'],
        promotions: '2x1 si vienes con un colega',
        requirements: ['Laptop', 'Cuenta gratuita de n8n Cloud'],
        contactInfo: { name: 'Soporte Talleres', email: 'talleres@innovation-institute.com', phone: '+123456789' },
        attachments: [
            { id: 'att16', name: 'Guia_Nodos_n8n.pdf', url: 'https://example.com/nodos.pdf', type: 'pdf' }
        ],
        benefits: ['Acceso a la plantilla exacta del flujo construido en clase', 'Soporte en vivo durante los ejercicios', 'Descuento exclusivo para el curso completo de Growth Marketing'],
        painPoints: ['Mis herramientas no se comunican entre sí', 'Zapier se ha vuelto muy caro', 'Me da miedo "romper" mis sistemas si intento automatizar'],
        guarantee: 'Garantía de "Flujo Funcionando": Si al final de la clase tu flujo no funciona en tu propia máquina, te devolvemos tus $19 dólares y te regalamos una hora de asesoría.',
        socialProof: ['"Laurita tiene una paciencia increíble para enseñar temas técnicos a gente de negocios." - Equipo de Marketing, Agencia X'],
        faqs: [
            { question: '¿Tengo que comprar n8n antes de la clase?', answer: 'No, usaremos la versión gratuita cloud para la demostración.' },
            { question: '¿Necesito saber programar en JavaScript?', answer: 'No para este nivel básico. Usaremos solo los nodos visuales.' }
        ],
        bonuses: ['Guía en PDF: Expresiones Básicas en n8n para No-Programadores']
    },
    {
        id: 'w3',
        title: 'Panel: El Futuro del Trabajo en LATAM 2025',
        description: 'Mesa redonda con directores de RRHH de las empresas más innovadoras de la región. Discutiremos tendencias de contratación, salarios, trabajo remoto vs volver a la oficina y las habilidades más demandadas (spoiler: IA).',
        type: 'charla',
        speaker: 'Varios (Moderador: Alejandro Torres)',
        date: '2024-05-15',
        time: '18:00',
        duration: '1.5 horas',
        price: 0,
        currency: 'USD',
        targetAudience: 'Profesionales buscando ascensos, líderes de equipos y reclutadores.',
        category: 'Tendencias y Empleo',
        status: 'activo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['Webinar', 'Gratis', 'Empleo', 'Panel'],
        tools: ['LinkedIn', 'Applicant Tracking Systems'],
        promotions: 'Acceso anticipado a Reportes Laborales',
        requirements: ['Ninguno'],
        contactInfo: { name: 'Eventos HR', email: 'hr-panel@innovation-institute.com', phone: '+123456789' },
        attachments: [
            { id: 'att17', name: 'Reporte_LATAM_2025.pdf', url: 'https://example.com/reporte.pdf', type: 'pdf' }
        ],
        benefits: ['Networking en chat en vivo', 'Descarga del Reporte de Tendencias Laborales LATAM', 'Insights directos de quienes contratan'],
        painPoints: ['Siento incertidumbre sobre el futuro de mi profesión', 'No sé qué estudiar para mantenerme relevante', 'Busco trabajo remoto pero la competencia es feroz'],
        guarantee: '-',
        socialProof: ['Nuestros paneles anteriores han marcado tendencia en LinkedIn.'],
        faqs: [
            { question: '¿Será interactivo?', answer: 'Sí, contestaremos la mayor cantidad de preguntas del chat en los últimos 30 minutos.' }
        ],
        bonuses: ['Directorio oculto de plataformas de trabajo remoto verificadas']
    },
    {
        id: 'w4',
        title: 'Workshop: Optimiza tu Perfil de LinkedIn en Vivo',
        description: 'Deja de buscar trabajo, haz que las ofertas te lleguen solas. En este taller súper práctico, re-escribiremos tu perfil utilizando SEO para buscadores de reclutadores y copys magnéticos.',
        type: 'taller',
        speaker: 'Paola Gomez (Career Coach)',
        date: '2024-06-10',
        time: '19:00',
        duration: '2 horas',
        price: 29,
        currency: 'USD',
        targetAudience: 'Profesionales de todas las áreas que buscan un cambio de empleo o captar clientes consultivos.',
        category: 'Habilidades Blandas',
        status: 'activo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['Taller Pago', 'Low Ticket', 'LinkedIn', 'Marca Personal'],
        tools: ['LinkedIn', 'Canva'],
        promotions: 'Cupón exclusivo 50% de descuento',
        requirements: ['Tener perfil de LinkedIn creado previamente'],
        contactInfo: { name: 'Mentoria Career', email: 'coach@innovation-institute.com', phone: '+123456789' },
        attachments: [
            { id: 'att18', name: 'Checklist_LinkedIn.pdf', url: 'https://example.com/checklist.pdf', type: 'pdf' }
        ],
        benefits: ['Auditoría en vivo de 3 perfiles de los asistentes', 'Estructura comprobada de encabezado y extracto', 'Guía de conexión para hacer networking en frío'],
        painPoints: ['He aplicado a 100 trabajos y no me llaman', 'Siento pena posteando en LinkedIn', 'Los reclutadores no revisan mi perfil'],
        guarantee: 'Si en 30 días aplicando la guía no aumentan tus visualizaciones de perfil x2, te devolvemos el dinero.',
        socialProof: ['"Modifiqué mi titular y a la semana tuve 3 entrevistas de Inbound Recruiting."'],
        faqs: [
            { question: '¿Sirve si no soy del área de tecnología?', answer: 'Sí, la optimización SEO de LinkedIn funciona para médicos, arquitectos, abogados, etc.' }
        ],
        bonuses: ['Plantilla de Banner Cover profesional de Canva']
    },
    {
        id: 'w5',
        title: 'Masterclass: Cómo Levantar Capital Semilla',
        description: 'La ruta real (y cruda) para conseguir tus primeros $100k - $500k USD para tu startup. Analizaremos pitch decks reales (los que funcionaron y los que fracasaron).',
        type: 'masterclass',
        speaker: 'Carlos Ruiz (Venture Partner)',
        date: '2024-07-20',
        time: '18:30',
        duration: '1.5 horas',
        price: 0,
        currency: 'USD',
        targetAudience: 'Startups en etapa inicial (pre-seed/seed), founders técnicos y emprendedores seriales.',
        category: 'Negocios',
        status: 'activo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['Startups', 'Venture Capital', 'Gratis', 'Negocios'],
        tools: ['Excel', 'DocSend', 'Pitch Decks'],
        promotions: 'Auditoría express de Deck gratuita al final',
        requirements: ['Conocimientos básicos del ecosistema startup'],
        contactInfo: { name: 'Startups Hub', email: 'vc@innovation-institute.com', phone: '+123456789' },
        attachments: [
            { id: 'att19', name: 'Y_Combinator_Deck.pdf', url: 'https://example.com/yc-deck.pdf', type: 'pdf' },
            { id: 'att20', name: 'Testimonio_Founder.mp4', url: 'https://example.com/founder.mp4', type: 'video' }
        ],
        benefits: ['Métricas exactas que buscan los fondos en LATAM', 'Análisis de "Red Flags" para inversores', 'Q&A abierto sin filtros'],
        painPoints: ['No sé cómo estructurar el CAP Table', 'Mis reuniones con ángeles inversores no pasan de la primera cita', 'No tengo las métricas claras que piden'],
        guarantee: '-',
        socialProof: ['Más de $50M levantados colectivamente por los founders asesorados por nuestro equipo.'],
        faqs: [
            { question: 'Tengo solo una idea, ¿puedo asistir?', answer: 'Idealmente para startups con MVP, pero útil para entender el ecosistema desde cero.' }
        ],
        bonuses: ['Template del "Pitch Deck Perfecto" aceptado por Y Combinator']
    },
    {
        id: 'w6',
        title: 'LinkedIn Live: IA para Recruiters y Gestión de Talento',
        description: 'Cómo usar la IA para encontrar al candidato ideal en la mitad del tiempo. Screening automático, redacción de ofertas atractivas y mejora de la experiencia del candidato.',
        type: 'charla',
        speaker: 'Marta Soler (Head of Talent)',
        date: '2024-06-25',
        time: '11:00',
        duration: '1 hora',
        price: 0,
        currency: 'USD',
        targetAudience: 'Reclutadores, HR Business Partners y Lead Hunters.',
        category: 'Recursos Humanos',
        status: 'activo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['Webinar', 'Gratis', 'HR', 'IA'],
        tools: ['LinkedIn Recruiter', 'ChatGPT', 'Gemini'],
        benefits: ['Guía de prompts para reclutadores', 'Demo de herramientas de screening con IA'],
        guarantee: '-',
        socialProof: ['Evento en colaboración con la Asociación de RRHH.'],
        faqs: [{ question: '¿Es para perfiles tech?', answer: 'Sí, pero los conceptos aplican a cualquier industria.' }]
    },
    {
        id: 'w7',
        title: 'Taller: Lanza tu App No-Code en 48 Horas con FlutterFlow',
        description: 'Taller intensivo para pasar de una idea a una app funcional en las tiendas. Sin programar, solo arrastrando y soltando componentes con lógica avanzada.',
        type: 'taller',
        speaker: 'Kevin Torres (No-Code Expert)',
        date: '2024-07-08',
        time: '18:00',
        duration: '3 horas',
        price: 49,
        currency: 'USD',
        targetAudience: 'Emprendedores con ideas de apps y diseñadores que quieren ser constructores.',
        category: 'Tecnología',
        status: 'activo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['Taller Pago', 'FlutterFlow', 'App Development', 'No-Code'],
        tools: ['FlutterFlow', 'Firebase'],
        benefits: ['Acceso al clon de la app construida', 'Guía de publicación en App Store/Play Store'],
        guarantee: 'Garantía de Prototipo: Sal con tu primer prototipo funcional.',
        socialProof: ['"Kevin hace que FlutterFlow parezca un juego de niños."'],
        faqs: [{ question: '¿Incluye Firebase?', answer: 'Sí, veremos la configuración básica de la base de datos.' }]
    },
    {
        id: 'w8',
        title: 'Masterclass: El Auge del Low-Code en la Empresa',
        description: 'Por qué las grandes corporaciones están abandonando el desarrollo tradicional para adoptar soluciones Low-Code. Velocidad, ahorro y flexibilidad.',
        type: 'masterclass',
        speaker: 'Roberto Sanz (CTO Enterprise)',
        date: '2024-08-14',
        time: '17:00',
        duration: '1.5 horas',
        price: 0,
        currency: 'USD',
        targetAudience: 'Directores de IT, CTOs y Arquitectos de Sistemas.',
        category: 'Tendencias',
        status: 'activo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['Webinar', 'Gratis', 'Enterprise', 'Low-Code'],
        tools: ['OutSystems', 'Mendix', 'Microsoft PowerApps'],
        benefits: ['E-book: Roadmap de adopción Low-Code'],
        guarantee: '-',
        socialProof: ['Con la presencia de líderes de TI de empresas Fortune 500.'],
        faqs: [{ question: '¿Es seguro?', answer: 'Hablaremos extensamente sobre seguridad y gobierno de datos.' }]
    },
    {
        id: 'w9',
        title: 'Webinar: Copywriting Magnético asistido por IA',
        description: 'Aprende a escribir textos que venden sin sonar como un robot. La combinación perfecta entre psicología humana e inteligencia artificial.',
        type: 'masterclass',
        speaker: 'Sonia Perez (Copywriter Pro)',
        date: '2024-09-05',
        time: '19:00',
        duration: '1 hora',
        price: 15,
        currency: 'USD',
        targetAudience: 'Emprendedores, Community Managers y dueños de e-commerce.',
        category: 'Marketing',
        status: 'activo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['Webinar Pago', 'Copywriting', 'IA', 'Ventas'],
        tools: ['ChatGPT', 'Claude'],
        benefits: ['Swipe file de estructuras que convierten'],
        guarantee: 'Si no escribes un mejor anuncio al terminar, te devolvemos el dinero.',
        socialProof: ['"Sonia domina el arte de las palabras como nadie."'],
        faqs: [{ question: '¿Sirve para emails?', answer: 'Sí, veremos landing pages, anuncios y correos.' }]
    },
    {
        id: 'w10',
        title: 'Charla: Ciberseguridad Esencial para Negocios Digitales',
        description: 'No esperes a que te hackeen. Aprende las medidas básicas y avanzadas para proteger tus datos, los de tus clientes y tu reputación online.',
        type: 'charla',
        speaker: 'Andrés Vera (Security Analyst)',
        date: '2024-10-12',
        time: '18:00',
        duration: '1.5 horas',
        price: 0,
        currency: 'USD',
        targetAudience: 'Todos los que tengan un negocio operando en internet.',
        category: 'Tecnología',
        status: 'activo',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['Webinar', 'Gratis', 'Seguridad', 'Privacidad'],
        tools: ['1Password', '2FA Tools', 'VPNs'],
        benefits: ['Checklist de Seguridad de 20 puntos'],
        guarantee: '-',
        socialProof: ['Andrés ha protegido infraestructuras críticas en LATAM.'],
        faqs: [{ question: '¿Es muy técnico?', answer: 'No, está diseñado para que cualquier dueño de negocio pueda aplicarlo.' }]
    }
];

export const demoTeams: Team[] = [
    {
        id: 't1',
        name: 'Equipo Básico - Consultas Generales',
        description: 'Equipo encargado de atender dudas generales de prospectos top of funnel y derivar consultas complejas.',
        members: [
            {
                name: 'Ana Bot (IA)',
                email: 'ana.bot@innovation-institute.com',
                role: 'agente'
            }
        ],
        assignedCourses: ['c1', 'w1', 'w2'],
        createdAt: new Date().toISOString()
    },
    {
        id: 't2',
        name: 'Equipo de Admisiones (High Ticket)',
        description: 'Especializados en cierre consultivo B2B y venta del Diplomado Ejecutivo.',
        members: [
            { name: 'Ana Garcia', email: 'ana@innovation-institute.com', role: 'Closer Senior' },
            { name: 'Pedro Diaz', email: 'pedro@innovation-institute.com', role: 'SDR' }
        ],
        assignedCourses: ['p1', 'p2', 'c2', 'c3'], // Diplomados y cursos caros
        createdAt: new Date().toISOString()
    }
];
