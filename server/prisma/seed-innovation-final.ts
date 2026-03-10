import { PrismaClient, UserRole, Modality, ItemStatus, EntityType, WebinarType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando Reestructuración Final y Diferenciada para Innovation Institute...');

  // 1. Obtener u Crear Organización
  const org = await prisma.organization.upsert({
    where: { slug: 'innovation-institute' },
    update: {},
    create: {
      name: 'Innovation Institute',
      slug: 'innovation-institute',
      type: 'instituto'
    }
  });
  const orgId = org.id;

  // Limpieza total de datos relacionados para evitar desorden
  await prisma.faq.deleteMany({
    where: {
      OR: [
        { course: { orgId } },
        { program: { orgId } },
        { webinar: { orgId } },
        { software: { orgId } },
        { subscription: { orgId } },
        { application: { orgId } }
      ]
    }
  });

  await prisma.attachment.deleteMany({
    where: {
      OR: [
        { course: { orgId } },
        { program: { orgId } },
        { webinar: { orgId } },
        { software: { orgId } },
        { subscription: { orgId } },
        { application: { orgId } }
      ]
    }
  });

  await prisma.syllabusModule.deleteMany({ where: { course: { orgId } } });
  await prisma.programCourse.deleteMany({ where: { program: { orgId } } });

  // Limpieza de entidades raíz
  await prisma.course.deleteMany({ where: { orgId } });
  await prisma.program.deleteMany({ where: { orgId } });
  await prisma.webinar.deleteMany({ where: { orgId } });
  await prisma.software.deleteMany({ where: { orgId } });
  await prisma.subscription.deleteMany({ where: { orgId } });
  await prisma.application.deleteMany({ where: { orgId } });
  await prisma.contact.deleteMany({ where: { orgId } });

  // ---------------------------------------------------------
  // 2. CURSOS LIBRES (6 Ejemplos: Ricos en Información)
  // ---------------------------------------------------------
  const courses = [
    {
      code: 'CRS-01',
      title: 'Prompt Engineering Express',
      price: 49,
      duration: '2 Días',
      category: 'IA Core',
      modality: Modality.online,
      instructor: 'Dra. Elena Ruiz',
      description: 'Aprende a comunicarte efectivamente con modelos de lenguaje. En este curso intensivo, descubrirás los secretos para formular prompts que generen resultados precisos, creativos y de alto valor para tu negocio.',
      objectives: ['Comprender la arquitectura básica de los LLMs.', 'Dominar técnicas de prompt zero-shot and few-shot.', 'Crear flujos de trabajo automatizados usando prompts en cadena.'],
      tools: ['ChatGPT Plus', 'Claude Opus', 'Gemini Advanced'],
      requirements: ['Conocimientos básicos de uso de navegadores web.', 'No se requiere experiencia previa en programación.'],
      benefits: ['Ahorro de hasta 15 horas semanales.', 'Mayor precisión en tareas creativas.', 'Certificado de participación.'],
      guarantee: 'Satisfacción garantizada o te devolvemos el 100% en 24 horas.',
      certification: 'Certificado de Asistencia: Prompt Engineer Básico'
    },
    {
      code: 'CRS-02',
      title: 'Automatización con ChatGPT y Excel',
      price: 79,
      duration: '1 Semana',
      category: 'Productividad',
      modality: Modality.online,
      instructor: 'Ing. Marcos Paz',
      description: 'Domina la integración de IA con herramientas ofimáticas. Lleva tu productividad en Excel al siguiente nivel escribiendo macros y fórmulas complejas sin saber programar, gracias a ChatGPT.',
      objectives: ['Generar fórmulas complejas de Excel con lenguaje natural.', 'Escribir scripts de VBA guiados por IA.', 'Automatizar reportes financieros y de marketing.'],
      tools: ['Excel', 'ChatGPT', 'PowerQuery'],
      requirements: ['Manejo intermedio de Excel.', 'Licencia activa de Microsoft 365.'],
      benefits: ['Reduce el tiempo de reporteo a la mitad.', 'Evita errores humanos en fórmulas complejas.', 'Plantillas listas para usar.']
    },
    {
      code: 'CRS-03',
      title: 'Midjourney para Diseñadores',
      price: 99,
      duration: '3 Días',
      category: 'Diseño',
      modality: Modality.online,
      instructor: 'Carla Vega, Art Director',
      description: 'Revoluciona tu proceso creativo. Aprende a iterar conceptos visuales en segundos y a integrar arte generado por IA en tus flujos de trabajo profesionales de diseño gráfico e interfaces.',
      objectives: ['Dominar los parámetros avanzados de Midjourney v6.', 'Mantener consistencia de personajes y estilos.', 'Integrar assets de IA en Adobe Creative Cloud.'],
      tools: ['Midjourney', 'Discord', 'Photoshop'],
      requirements: ['Cuenta activa en Discord.', 'Suscripción básica a Midjourney.'],
      benefits: ['Acelera la etapa de conceptualización.', 'Presenta múltiples propuestas a clientes rápidamente.']
    },
    {
      code: 'CRS-04',
      title: 'Introducción a Agentes con n8n',
      price: 120,
      duration: '2 Semanas',
      category: 'Automatización',
      modality: Modality.online,
      instructor: 'David Tech, Solutions Architect',
      description: 'Da el salto de la IA conversacional a la IA agentiva. Aprende a construir workflows que no solo responden preguntas, sino que ejecutan acciones en tus herramientas favoritas usando n8n.',
      objectives: ['Entender el paradigma de Agentes Autónomos.', 'Crear flujos visuales en n8n.', 'Conectar LLMs con APIs externas (Gmail, Slack, CRM).'],
      tools: ['n8n', 'OpenAI API', 'Slack'],
      requirements: ['Lógica de programación básica.', 'Familiaridad con APIs y Webhooks REST.'],
      certification: 'Certificado: Automation Builder Jr.'
    },
    {
      code: 'CRS-05',
      title: 'IA para Redacción de Copys',
      price: 59,
      duration: '4 Horas',
      category: 'Marketing',
      modality: Modality.online,
      instructor: 'Laura Copywriter',
      description: 'Multiplica tu producción de contenido persuasivo. Descubre cómo entrenar a la IA para que escriba con tu voz de marca y genere secuencias de email, landing pages y posts virales.',
      objectives: ['Clonar voces de marca exitosas.', 'Generar variaciones de A/B test para anuncios.', 'Automatizar el calendario de contenidos.'],
      tools: ['Claude 3', 'Jasper', 'Notion AI'],
      benefits: ['Nunca más te enfrentarás al bloqueo del escritor.', 'Aumenta tu CTR con copys probados.', 'Plantillas de prompts de marketing.']
    },
    {
      code: 'CRS-06',
      title: 'Análisis de Datos con Claude Artifacts',
      price: 89,
      duration: '1 Semana',
      category: 'Análisis',
      modality: Modality.online,
      instructor: 'Dr. Alan Turing',
      description: 'Utiliza la IA para extraer insights de grandes volúmenes de datos. Aprende a subir CSVs, pedir visualizaciones interactivas y generar reportes ejecutivos usando Claude Artifacts.',
      objectives: ['Limpieza de datos asistida por IA.', 'Generación de dashboards interactivos (React/Recharts).', 'Interpretación estadística de resultados empresariales.'],
      tools: ['Claude Sonnet 3.5', 'Python (opcional)'],
      prerequisites: 'Cursos previos de estadística descriptiva básica.',
      benefits: ['Toma decisiones basadas en datos más rápido.', 'No dependas del equipo de TI para reportes básicos.']
    }
  ];

  for (const c of courses) {
    const course = await prisma.course.create({
      data: { ...c, orgId, status: ItemStatus.activo }
    });

    // Añadir Temario (Syllabus) de ejemplo
    await prisma.syllabusModule.create({
      data: {
        courseId: course.id,
        title: 'Módulo 1: Fundamentos',
        description: 'Introducción a los conceptos clave y configuración del entorno.',
        topics: ['Bienvenida', 'Configuración inicial', 'Casos de uso principales'],
        hours: 2,
        sortOrder: 1
      }
    });
    await prisma.syllabusModule.create({
      data: {
        courseId: course.id,
        title: 'Módulo 2: Casos Prácticos',
        description: 'Aplicación de lo aprendido en escenarios reales de negocio.',
        topics: ['Proyecto guiado', 'Resolución de problemas comunes', 'Mejores prácticas'],
        hours: 3,
        sortOrder: 2
      }
    });

    // Añadir FAQs
    await prisma.faq.create({
      data: {
        entityType: EntityType.course,
        courseId: course.id,
        question: '¿Tendré acceso a las grabaciones?',
        answer: 'Sí, tendrás acceso de por vida a todas las sesiones grabadas y actualizaciones futuras.',
        sortOrder: 1
      }
    });
  }

  // ---------------------------------------------------------
  // 3. PROGRAMAS (2 Ejemplos: Largos y Modulares)
  // ---------------------------------------------------------
  const programs = [
    {
      code: 'PROG-EXEC',
      title: 'Diplomado Ejecutivo en Liderazgo de IA',
      price: 2500,
      totalDuration: '6 Meses',
      category: 'Ejecutivo',
      modality: Modality.hibrido,
      coordinator: 'Prof. Roberto Silva, PhD',
      description: 'Transforma tu organización con IA. Diseñado para C-levels y directores, este diplomado te dará la visión estratégica para implementar soluciones de Inteligencia Artificial que impacten el ROI, gestionando el cambio cultural y mitigando riesgos éticos y legales.',
      certification: 'Certificación Internacional en Innovación por la LIA',
      benefits: ['Networking de alto nivel con otros ejecutivos.', 'Sesiones de mentoría individual para tu proyecto.', 'Acceso a IA Labs presenciales.'],
      objectives: ['Diseñar una estrategia de IA corporativa.', 'Evaluar proveedores y tecnologías LLM.', 'Gestionar equipos multidisciplinarios de datos.'],
      guarantee: 'Garantía de Satisfacción: Reembolso completo durante el primer mes si el programa no cumple tus expectativas ejecutivas.',
      requirements: ['Mínimo 5 años de experiencia gerencial.', 'Entrevista de admisión obligatoria.']
    },
    {
      code: 'PROG-DEV',
      title: 'Professional Track: Intelligent Systems Developer',
      price: 1800,
      totalDuration: '4 Meses',
      category: 'Técnico',
      modality: Modality.online,
      description: 'El bootcamp definitivo para convertirte en Ingeniero de IA. Aprenderás a orquestar LLMs, crear sistemas RAG (Retrieval-Augmented Generation), fine-tuning de modelos open source y despliegue en producción.',
      certification: 'Intelligent Systems Developer Associate Certification',
      objectives: ['Construir pipelines RAG escalables.', 'Desplegar modelos usando Docker y Kubernetes.', 'Optimizar latencia y costos de inferencia API.'],
      tools: ['LangChain', 'LlamaIndex', 'HuggingFace', 'FastAPI'],
      prerequisites: 'Python Intermedio, Conocimientos de Docker y Git.',
      benefits: ['Armarás un portafolio con 3 proyectos end-to-end.', 'Bolsa de trabajo exclusiva con partners.', 'Revisión de código 1-a-1.']
    }
  ];

  for (const p of programs) {
    await prisma.program.create({
      data: { ...p, orgId, status: ItemStatus.activo }
    });
  }

  // ---------------------------------------------------------
  // 4. WEBINARS / EVENTOS (2 Ejemplos)
  // ---------------------------------------------------------
  await prisma.webinar.create({
    data: {
      code: 'WBN-VIRT',
      title: 'Mega-Webinar: El Futuro de los Agentes de Voz AI',
      type: WebinarType.webinar,
      speaker: 'Carlos AI Expert',
      speakerTitle: 'Lead AI Researcher',
      speakerBio: 'Carlos tiene más de 10 años en el rubro tech y es pionero en la implementación de agentes de voz conversacionales.',
      price: 0,
      eventDate: new Date('2024-12-01T19:00:00Z'),
      duration: '90 Min',
      modality: Modality.online,
      orgId,
      status: ItemStatus.activo,
      category: 'Tendencias',
      description: 'Descubre cómo los agentes de voz están reemplazando a los IVRs tradicionales y revolucionando la atención al cliente. Un recorrido por las últimas tecnologías latency-free que compiten con operadores humanos.',
      registrationLink: 'https://zoom.us/webinar/register/WBN-VIRT',
      benefits: ['Framework de adopción gratuita.', 'Q&A en vivo.'],
      bonuses: ['PDF: Top 10 prompts para agentes de voz.']
    }
  });

  await prisma.webinar.create({
    data: {
      code: 'EVT-PRES',
      title: 'Taller Presencial: Automatizando tu Empresa en 1 Día',
      type: WebinarType.taller,
      speaker: 'Marta Rodriguez',
      speakerTitle: 'Automation Expert',
      price: 150,
      eventDate: new Date('2024-12-15T09:00:00Z'),
      duration: '1 Día',
      modality: Modality.presencial,
      location: 'Sede San Isidro - Coworking Space BTH',
      orgId,
      status: ItemStatus.activo,
      category: 'Networking',
      description: 'Trae tu laptop y tus problemas operativos. En este taller intensivo de 8 horas, saldrás con al menos 3 procesos críticos automatizados en tu negocio. Nos enfocaremos en ventas, atención y facturación.',
      requirements: ['Laptop propia.', 'Procesos documentados (opcional).'],
      guarantee: 'Si no automatizas nada, te devolvemos el dinero de la entrada.',
      tools: ['Zapier', 'Make', 'ChatGPT']
    }
  });

  // ---------------------------------------------------------
  // 5. POSTULACIONES (Dedicated Model: Application)
  // ---------------------------------------------------------
  await prisma.application.create({
    data: {
      code: 'ADM-2025-01',
      title: 'Derecho de Evaluación - Ciclo Verano 2025',
      price: 50,
      currency: 'PEN',
      category: 'Admisión',
      description: 'Pase oficial para rendir el examen de admisión y la entrevista de agilidad mental. Tu primer paso hacia el ecosistema de Innovation Institute.',
      orgId,
      status: ItemStatus.activo,
      requirements: ['Copia DNI.', 'Certificado de estudios secundarios.']
    }
  });

  await prisma.application.create({
    data: {
      code: 'ADM-PRG-EXEC',
      title: 'Postulación a Diplomado Ejecutivo',
      price: 50,
      currency: 'PEN',
      category: 'Admisión',
      description: 'Proceso de evaluación de perfil gerencial para el Diplomado en Liderazgo de IA. Incluye revisión de CV y entrevista con el Board del programa.',
      orgId,
      status: ItemStatus.activo,
    }
  });

  // ---------------------------------------------------------
  // 6. SUBSCRIPCIONES (Dedicated Model: Subscription)
  // ---------------------------------------------------------
  await prisma.subscription.create({
    data: {
      code: 'SUB-CONSULT',
      title: 'Membresía: Consultoría Mensual IA',
      price: 199,
      period: 'mensual',
      category: 'Subscripción',
      description: 'Tu propio Chief AI Officer fraccionado. Acceso a 4 sesiones de consultoría personalizada al mes para guiar la estrategia tecnológica de tu empresa, auditar procesos y proponer mejoras.',
      orgId,
      status: ItemStatus.activo,
      benefits: ['4 horas/mes de llamadas 1-a-1.', 'Auditoría mensual de herramientas.', 'Soporte prioritario por email.'],
    }
  });

  await prisma.subscription.create({
    data: {
      code: 'SUB-LABS',
      title: 'Pase Premium a IA Labs',
      price: 49,
      period: 'mensual',
      category: 'Subscripción',
      description: 'Accede a la potencia de cálculo que necesitas. Uso ilimitado de nuestras computadoras Mac Studio de alto rendimiento y APIs premium empresariales en nuestra sede San Isidro.',
      orgId,
      status: ItemStatus.activo,
      benefits: ['Acceso a GPUs de alto rendimiento.', 'API Keys corporativas incluidas.'],
    }
  });

  // ---------------------------------------------------------
  // 7. SOFTWARE (Dedicated Model: Software)
  // ---------------------------------------------------------
  await prisma.software.create({
    data: {
      code: 'SW-CRM-AI',
      title: 'LIA CRM v4 - Business Intelligence',
      subtitle: 'El motor de inteligencia para tu embudo de ventas',
      price: 999,
      currency: 'USD',
      version: '4.0.2',
      platform: 'Web / Cloud',
      category: 'CRM',
      description: 'Software avanzado de automatización de ventas con agentes de IA integrados. Permite calificar leads, extraer datos de llamadas y automatizar el seguimiento sin intervención humana.',
      orgId,
      status: ItemStatus.activo,
      tags: ['AI', 'Sales', 'Automation']
    }
  });

  await prisma.software.create({
    data: {
      code: 'SW-VOICE-AG',
      title: 'LIA Voice Connect',
      subtitle: 'Agentes de voz con latencia cero',
      price: 450,
      currency: 'USD',
      version: '1.2.0',
      platform: 'API / Node.js',
      category: 'Telecom',
      description: 'Motor de síntesis y reconocimiento de voz optimizado para español latino. Ideal para agendar citas o soporte técnico nivel 1.',
      orgId,
      status: ItemStatus.activo,
      tags: ['Voice', 'API', 'Real-time']
    }
  });

  console.log('✅ Éxito: Ecosistema refactorizado con Cursos(6), Programas(2), Webinars(2), Postulaciones(2), Subscripciones(2) y Software(2).');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
