import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';
import { settingsService } from './services/settings.service';
import type { AiAgent, OrgProfile } from './types';

// === Gemini Client ===
let genAI: GoogleGenAI | null = null;
let currentApiKey: string | null = null;
const DEFAULT_GEMINI_KEY = 'AIzaSyAIs0JPwtbhEE34-ByvKxDZ2PgAVGU1EhI';

/**
 * Gemini model fallback chain — ordered by availability and free tier limits:
 */
const GEMINI_MODELS = [
    'gemini-2.5-flash-lite',  // Fastest, highest free limits
    'gemini-2.5-flash',       // Balanced performance
    'gemini-2.0-flash',       // Legacy fallback
];

function getClient(): GoogleGenAI {
    const key = settingsService.getGeminiKeySync() || DEFAULT_GEMINI_KEY;

    // Re-initialize if key changed or first time
    if (!genAI || key !== currentApiKey) {
        console.log('Initializing Gemini client with key:', key.substring(0, 10) + '...');
        genAI = new GoogleGenAI({ apiKey: key });
        currentApiKey = key;
    }
    return genAI;
}

/** Ensures API keys are loaded from server before making AI calls */
async function ensureKeysLoaded(): Promise<void> {
    if (!settingsService.getGeminiKeySync() && !settingsService.getOpenAIKeySync()) {
        await settingsService.getApiKeys().catch(() => {});
    }
}

export function resetClient(): void {
    genAI = null;
    currentApiKey = null;
}

// === Validation Functions ===

export interface ValidationResult {
    valid: boolean;
    message: string;
    testOutput?: string;
    model?: string;
}

// Distinct prompts for clear visual verification
const TEST_PROMPT_GEMINI = 'Dime un dato curioso sobre el espacio o la tecnología. Máximo 15 palabras.';
const TEST_PROMPT_OPENAI = 'Dime un dato curioso sobre historia o arte. Máximo 15 palabras.';

/**
 * Validate Gemini Key with Science/Tech prompt
 */
export async function validateGeminiKey(apiKey: string): Promise<ValidationResult> {
    const client = new GoogleGenAI({ apiKey });
    const errors: string[] = [];

    for (let i = 0; i < GEMINI_MODELS.length; i++) {
        const modelName = GEMINI_MODELS[i];
        try {
            const response = await client.models.generateContent({
                model: modelName,
                contents: TEST_PROMPT_GEMINI,
            });
            const text = response.text?.trim();
            if (text) {
                return {
                    valid: true,
                    message: `✅ Conexión exitosa con ${modelName}`,
                    testOutput: `[Gemini] ${text}`,
                    model: modelName
                };
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            console.warn(`Gemini validation failed for ${modelName}: ${msg}`);

            if (msg.includes('API_KEY_INVALID') || msg.includes('invalid')) {
                return { valid: false, message: '❌ API Key inválida.' };
            }
            if (msg.includes('403') || msg.includes('permission')) {
                return { valid: false, message: '❌ Sin permisos (Google Cloud).' };
            }
            // Rate limit or model not found
            if (msg.includes('429') || msg.includes('quota')) {
                errors.push(`${modelName}: rate limited (429)`);
            } else if (msg.includes('404')) {
                errors.push(`${modelName}: no disponible (404)`);
            } else {
                errors.push(`${modelName}: ${msg.substring(0, 50)}...`);
            }

            if (i < GEMINI_MODELS.length - 1) await new Promise(r => setTimeout(r, 1500));
        }
    }

    if (errors.every(e => e.includes('rate limited'))) {
        return {
            valid: true,
            message: '⚠️ Key válida (Rate Limited). Intenta más tarde.',
            testOutput: `Gemini funciona, pero alcanzaste tu cuota horaria. ${errors[0]}`
        };
    }

    return { valid: false, message: '❌ Fallo en validación Gemini', testOutput: errors.join(', ') };
}

/**
 * Validate OpenAI Key with History/Art prompt
 */
export async function validateOpenAIKey(apiKey: string): Promise<ValidationResult> {
    try {
        const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
        const result = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: TEST_PROMPT_OPENAI }],
            max_tokens: 50,
        });
        const text = result.choices?.[0]?.message?.content?.trim();
        if (text) {
            return {
                valid: true,
                message: '✅ Conexión exitosa con OpenAI',
                testOutput: `[OpenAI] ${text}`,
                model: 'gpt-4o-mini'
            };
        }
        return { valid: false, message: '❌ Sin respuesta de OpenAI.' };
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('Incorrect API key')) return { valid: false, message: '❌ API Key OpenAI inválida.' };
        if (msg.includes('insufficient_quota')) return { valid: false, message: '❌ Sin saldo en OpenAI.' };
        return { valid: false, message: `❌ Error OpenAI: ${msg}` };
    }
}

// Legacy exports for backward compatibility
export async function validateConnection(): Promise<boolean> {
    const key = settingsService.getGeminiKeySync() || DEFAULT_GEMINI_KEY;
    const result = await validateGeminiKey(key);
    return result.valid;
}

export const validateApiKey = validateGeminiKey;

// === Timeout helper ===
function withTimeout<T>(promise: Promise<T>, ms: number, label = 'Request'): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} timeout after ${ms / 1000}s`)), ms))
    ]);
}

// === Core AI Function (with model fallback + OpenAI backup) ===

async function ask(prompt: string, system: string, retries = 1): Promise<string> {
    await ensureKeysLoaded();
    const client = getClient();

    // Try each Gemini model with retries
    for (const model of GEMINI_MODELS) {
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const response = await withTimeout(
                    client.models.generateContent({
                        model,
                        contents: prompt,
                        config: {
                            systemInstruction: system,
                        }
                    }),
                    45000, // 45 second timeout per attempt
                    `Gemini ${model}`
                );
                const text = response.text;
                if (text) return text;
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : '';
                console.warn(`Attempt ${attempt + 1} failed for ${model}: ${msg}`);

                if (msg.includes('404') || msg.includes('not found')) {
                    console.warn(`Model ${model} not available, skipping...`);
                    break;
                }

                if ((msg.includes('429') || msg.includes('503') || msg.includes('quota') || msg.includes('resource_exhausted') || msg.includes('overloaded') || msg.includes('timeout')) && attempt < retries) {
                    // Quick backoff: 1s, 2s
                    const waitTime = (attempt + 1) * 1000;
                    const reason = msg.includes('503') || msg.includes('overloaded') ? 'Overloaded' : 'Rate limit';
                    console.warn(`${reason} on ${model}, waiting ${waitTime}ms before retry...`);
                    await new Promise(r => setTimeout(r, waitTime));
                    continue;
                }

                if (attempt === retries) break;
            }
        }
    }

    // Fallback to OpenAI if all Gemini models fail
    const openAIKey = settingsService.getOpenAIKeySync();
    if (openAIKey) {
        try {
            console.warn('All Gemini models failed. Falling back to OpenAI...');
            const openai = new OpenAI({ apiKey: openAIKey, dangerouslyAllowBrowser: true });
            const result = await withTimeout(
                openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: system },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: 4096,
                }),
                30000, // 30 second timeout for OpenAI
                'OpenAI'
            );
            const text = result.choices?.[0]?.message?.content;
            if (text) return text;
        } catch (err) {
            console.error('OpenAI fallback also failed:', err);
        }
    }

    throw new Error('❌ No se pudo conectar con ningún proveedor de IA. Verifica tus API Keys o intenta más tarde.');
}

// === PROMPTS (V4) ===

const PROMPTS = {
    ANALYZE: `Eres un experto en diseño instruccional y arquitectura académica.
    TU TAREA: Analizar la información cruda del curso/programa/webinar proporcionada.
    
    DEBES ENTREGAR UN JSON con esta estructura exacta (sin markdown de código):
    {
      "completeness_score": number (0-100),
      "missing_fields": string[],
      "suggestions": string[],
      "structured_data": {
        "title": "Optimizado y persuasivo",
        "description": "Resumen ejecutivo de 3 líneas",
        "objectives": ["Objetivo 1", "Objetivo 2", ...],
        "syllabus": ["Módulo 1: Tema", "Módulo 2: Tema", ...],
        "duration": " Texto",
        "modality": "Online/Híbrido/Presencial",
        "target_audience": "Perfil detallado",
        "instructor": { "name": "Nombre", "bio": "Resumen bio" }
      }
    }
    Responde SOLO con el JSON.`,

    RAW_EXTRACT_CURSO: `Eres un experto en Copywriting Educativo y Estrategia de Ventas.
    TU TAREA: Transformar contenido crudo de un CURSO en una propuesta de venta IRRESISTIBLE.
    
    FORMATO DE RESPUESTA (JSON PURO):
    {
      "type": "curso",
      "title": "TÍTULO GANCHO (Ej: 'Excel para Negocios')",
      "description": "Copy persuasivo de 3-4 líneas. Dolor -> Agitación -> Solución.",
      "objectives": ["Resultado tangible 1", "Habilidad práctica 2"],
      "targetAudience": "Perfil específico",
      "modality": "online" | "presencial" | "hibrido",
      "duration": "Tiempo total",
      "hours": número,
      "syllabus": [ { "id": "uuid", "title": "Módulo X", "description": "Breve", "topics": ["Lección 1"] } ],
      "instructor": "Nombre",
      "instructorBio": "Bio de autoridad",
      "price": número,
      "currency": "USD" | "PEN",
      "certification": "Certificado a nombre de...",
      "benefits": ["Soporte 24/7", "Acceso de por vida"],
      "painPoints": ["Dolor 1"],
      "guarantee": "Texto de garantía",
      "socialProof": ["Testimonio breve 1"],
      "faqs": [{ "question": "Pregunta", "answer": "Respuesta" }],
      "bonuses": ["Bonus 1"],
      "callToAction": "Frase de acción persuasiva (ej: Inscríbete ahora y transforma tu carrera)",
      "idealStudentProfile": "Descripción del alumno ideal (ej: Profesionales de 25-40 años en transición de carrera)",
      "competitiveAdvantage": "Qué hace este curso diferente a la competencia",
      "urgencyTriggers": ["Solo 10 cupos", "Precio sube en 48 horas"],
      "objectionHandlers": [{ "objection": "Es muy caro", "response": "Respuesta persuasiva..." }],
      "successStories": [{ "name": "Juan Pérez", "quote": "Testimonio real...", "result": "Ascendió a gerente" }],
      "missing": ["Campos faltantes"]
    }
    REGLA: EL SYLLABUS DEBE SER MUY DETALLADO INDICANDO QUÉ SE VA A APRENDER. SIEMPRE INCLUYE EL TEMA DEL CERTIFICADO. GENERA OBJECTION HANDLERS Y SUCCESS STORIES REALISTAS.`,

    RAW_EXTRACT_PROGRAMA: `Eres un experto en Formación Ejecutiva.
    TU TAREA: Transformar contenido crudo de un PROGRAMA (diplomado, especialización) en una propuesta premium.
    
    FORMATO DE RESPUESTA (JSON PURO):
    {
      "type": "programa",
      "title": "TÍTULO GANCHO (Ej: 'Diplomado en IA')",
      "description": "Copy persuasivo orientado a líderes o profesionales senior.",
      "objectives": ["Visión estratégica", "Implementación práctica"],
      "targetAudience": "Perfil específico y requisitos (ej: 'Gerentes con 5 años de exp')",
      "modality": "online" | "presencial" | "hibrido",
      "totalDuration": "Tiempo total",
      "totalHours": número,
      "courses": [ { "id": "uuid", "order": 1, "title": "Curso/Módulo Fuerte 1", "hours": 20 } ],
      "certification": "Detalle del diploma/certificación de alto valor",
      "price": número,
      "currency": "USD" | "PEN",
      "benefits": ["Networking", "Bolsa de trabajo"],
      "painPoints": ["Estancamiento laboral"],
      "guarantee": "Garantía",
      "faqs": [{ "question": "Pregunta", "answer": "Respuesta" }],
      "bonuses": ["Bonus 1"],
      "callToAction": "Frase de acción para programas premium",
      "idealStudentProfile": "Perfil del candidato ideal",
      "competitiveAdvantage": "Diferenciador clave del programa",
      "urgencyTriggers": ["Próximo inicio en X fecha", "Solo X vacantes"],
      "objectionHandlers": [{ "objection": "Objeción común", "response": "Respuesta persuasiva" }],
      "successStories": [{ "name": "Egresado", "quote": "Testimonio", "result": "Resultado" }],
      "missing": ["Campos faltantes"]
    }
    REGLA: ENFATIZA LOS REQUISITOS (EXPERIENCIA PREVIA) Y DETALLA LA PLANA DOCENTE SI APARECE EN EL TEXTO. GENERA OBJECTION HANDLERS Y SUCCESS STORIES REALISTAS PARA PROGRAMAS PREMIUM.`,

    RAW_EXTRACT_WEBINAR: `Eres un experto en Lanzamientos y Generación de Leads.
    TU TAREA: Transformar contenido crudo de un WEBINAR/MASTERCLASS en un gancho hiper-persuasivo.
    
    FORMATO DE RESPUESTA (JSON PURO):
    {
      "type": "webinar",
      "title": "TÍTULO GANCHO DE URGENCIA",
      "description": "Copy corto. Qué descubrirán en estos 60/90 minutos.",
      "speaker": "Nombre del experto",
      "eventDate": "YYYY-MM-DDTHH:MM:SSZ",
      "eventTime": "HH:MM",
      "duration": "Tiempo corto",
      "targetAudience": "A quién le urge ver esto",
      "modality": "online" | "presencial",
      "platform": "Zoom/Meet",
      "price": 0,
      "currency": "USD",
      "benefits": ["Plantilla gratis en vivo", "Q&A"],
      "painPoints": ["Problema muy urgente"],
      "socialProof": ["Más de X registrados"],
      "callToAction": "Regístrate gratis ahora",
      "idealStudentProfile": "A quién está dirigido específicamente",
      "competitiveAdvantage": "Qué hace este webinar diferente",
      "urgencyTriggers": ["Cupos limitados", "Solo en vivo"],
      "missing": ["Campos faltantes"]
    }
    REGLA DE ORO: NO INCLUYAS SYLLABUS. EL WEBINAR ES CORTO, ENFÓCATE EN EL ENLACE DE REGISTRO, SI ES VIRTUAL/PRESENCIAL Y QUÉ SECRETO VAN A DESCUBRIR.`,

    RAW_EXTRACT_TALLER: `Eres un experto en Formación Experiencial y Talleres Prácticos.
    TU TAREA: Transformar contenido crudo de un TALLER/WORKSHOP en una propuesta de alto impacto.

    ANALIZA el texto y EXTRAE toda la información posible.
    INVENTA datos faltantes con valores realistas basados en el contexto.

    FORMATO DE RESPUESTA (JSON PURO, SIN MARCADORES DE CÓDIGO):
    {
      "type": "taller",
      "title": "NOMBRE ATRACTIVO DEL TALLER",
      "subtitle": "Subtítulo que enganche",
      "description": "Descripción persuasiva del taller y qué van a lograr los participantes",
      "objectives": ["Objetivo 1", "Objetivo 2", "Objetivo 3"],
      "targetAudience": "Público específico al que está dirigido",
      "modality": "presencial" | "online" | "hibrido",
      "eventDate": "YYYY-MM-DD o null",
      "eventTime": "HH:MM o null",
      "duration": "4 horas",
      "totalHours": 4,
      "schedule": "Sábado 9am-1pm",
      "instructor": "Nombre del facilitador",
      "instructorBio": "Bio profesional del facilitador",
      "venue": "Nombre del local/sala",
      "venueAddress": "Dirección completa",
      "maxParticipants": 25,
      "materials": ["Material 1", "Material 2"],
      "deliverables": ["Entregable 1", "Entregable 2"],
      "certification": "Certificado de participación",
      "price": 150,
      "currency": "USD",
      "earlyBirdPrice": 120,
      "registrationLink": "URL o null",
      "paymentMethods": ["Transferencia", "Tarjeta"],
      "requirements": ["Laptop", "Conocimientos básicos"],
      "benefits": ["Aprende haciendo", "Material incluido"],
      "painPoints": ["Problema que resuelve"],
      "guarantee": "Garantía",
      "socialProof": ["Testimonio"],
      "bonuses": ["Bonus"],
      "callToAction": "Reserva tu cupo ahora",
      "idealStudentProfile": "Perfil del participante ideal",
      "competitiveAdvantage": "Qué hace este taller diferente",
      "urgencyTriggers": ["Solo 25 cupos", "Fecha única"],
      "objectionHandlers": [{"objection": "Es muy caro", "response": "Incluye materiales y certificación..."}],
      "successStories": [{"name": "Participante", "quote": "Testimonio", "result": "Resultado"}],
      "missing": ["Campos faltantes"]
    }
    REGLA: ENFATIZA LA EXPERIENCIA PRÁCTICA, LOS MATERIALES INCLUIDOS Y LOS CUPOS LIMITADOS COMO URGENCIA.`,

    RAW_EXTRACT_ASESORIA: `Eres un experto en Consultoría Profesional y Servicios de Asesoría.
    TU TAREA: Transformar contenido crudo de un servicio de ASESORÍA/CONSULTORÍA en una propuesta premium.

    ANALIZA el texto y EXTRAE toda la información posible.
    INVENTA datos faltantes con valores realistas basados en el contexto.

    FORMATO DE RESPUESTA (JSON PURO, SIN MARCADORES DE CÓDIGO):
    {
      "type": "asesoria",
      "title": "NOMBRE DEL SERVICIO DE ASESORÍA",
      "subtitle": "Subtítulo que comunique valor",
      "description": "Descripción del servicio y resultados que obtendrá el cliente",
      "objectives": ["Objetivo 1", "Objetivo 2"],
      "targetAudience": "Perfil del cliente ideal",
      "modality": "online" | "presencial" | "hibrido",
      "advisor": "Nombre del asesor/consultor",
      "advisorBio": "Bio profesional y credenciales",
      "advisorTitle": "Título profesional",
      "specialties": ["Especialidad 1", "Especialidad 2"],
      "pricePerHour": 100,
      "currency": "USD",
      "minimumHours": 1,
      "packageHours": 10,
      "packagePrice": 800,
      "bookingLink": "URL de reserva o null",
      "availableSchedule": "L-V 9am-6pm",
      "sessionDuration": "1 hora",
      "topicsCovered": ["Tema 1", "Tema 2"],
      "deliverables": ["Entregable por sesión"],
      "requirements": ["Requisito"],
      "benefits": ["Beneficio 1", "Beneficio 2"],
      "painPoints": ["Problema que resuelve"],
      "guarantee": "Garantía de satisfacción",
      "socialProof": ["Testimonio de cliente"],
      "bonuses": ["Bonus incluido"],
      "callToAction": "Agenda tu primera sesión",
      "idealStudentProfile": "Cliente ideal para esta asesoría",
      "competitiveAdvantage": "Qué diferencia esta asesoría",
      "urgencyTriggers": ["Agenda limitada", "Solo 3 clientes al mes"],
      "objectionHandlers": [{"objection": "Es muy caro por hora", "response": "El ROI es..."}],
      "successStories": [{"name": "Cliente", "quote": "Testimonio", "result": "Resultado"}],
      "missing": ["Campos faltantes"]
    }
    REGLA: ENFATIZA LAS CREDENCIALES DEL ASESOR, EL RETORNO DE INVERSIÓN Y LA EXCLUSIVIDAD DEL SERVICIO.`,

    RAW_EXTRACT_POSTULACION: `Eres un experto en Admisiones Universitarias y Procesos de Selección.
    TU TAREA: Transformar contenido crudo de un proceso de POSTULACIÓN/ADMISIÓN en una convocatoria atractiva.

    ANALIZA el texto y EXTRAE toda la información posible.
    INVENTA datos faltantes con valores realistas basados en el contexto.

    FORMATO DE RESPUESTA (JSON PURO, SIN MARCADORES DE CÓDIGO):
    {
      "type": "postulacion",
      "title": "NOMBRE DEL PROCESO (Ej: 'Beca de Innovación 2026')",
      "subtitle": "Subtítulo atractivo",
      "description": "Descripción del proceso, a qué programas aplica y por qué postular",
      "objectives": ["Qué lograrás al ser admitido"],
      "targetAudience": "Perfil del postulante ideal",
      "modality": "online" | "presencial" | "hibrido",
      "deadline": "YYYY-MM-DD o null",
      "availableSlots": 50,
      "examRequired": false,
      "examDescription": "Descripción del examen si aplica",
      "applicationFee": 0,
      "steps": ["Paso 1: Registro online", "Paso 2: Envío de documentos", "Paso 3: Entrevista"],
      "documentsNeeded": ["DNI", "CV", "Certificado de estudios"],
      "selectionCriteria": ["Promedio académico", "Experiencia laboral", "Ensayo motivacional"],
      "registrationLink": "URL o null",
      "paymentMethods": ["Transferencia", "Tarjeta"],
      "price": 0,
      "currency": "USD",
      "requirements": ["Requisitos de admisión"],
      "contactInfo": {"name": "Oficina de admisiones", "email": "admisiones@...", "phone": "..."},
      "benefits": ["Beneficio de ser admitido"],
      "painPoints": ["Problema que resuelve esta oportunidad"],
      "guarantee": "Garantía",
      "socialProof": ["Testimonio de egresado"],
      "callToAction": "Postula ahora",
      "idealStudentProfile": "Perfil del candidato ideal",
      "competitiveAdvantage": "Qué hace única esta convocatoria",
      "urgencyTriggers": ["Fecha límite", "Cupos limitados"],
      "objectionHandlers": [{"objection": "No sé si califico", "response": "Los requisitos son..."}],
      "successStories": [{"name": "Egresado", "quote": "Testimonio", "result": "Resultado"}],
      "missing": ["Campos faltantes"]
    }
    REGLA: ENFATIZA LOS PASOS CLAROS DEL PROCESO, LA FECHA LÍMITE COMO URGENCIA Y LOS BENEFICIOS DE SER ADMITIDO.`,

    RAW_EXTRACT_SUBSCRIPCION: `Eres un experto en Modelos de Negocio Recurrentes y Membresías Educativas.
    TU TAREA: Transformar contenido crudo de un servicio de SUSCRIPCIÓN/MEMBRESÍA en una propuesta de valor irresistible.

    ANALIZA el texto y EXTRAE toda la información posible.
    INVENTA datos faltantes con valores realistas basados en el contexto.

    FORMATO DE RESPUESTA (JSON PURO, SIN MARCADORES DE CÓDIGO):
    {
      "type": "subscripcion",
      "title": "NOMBRE DE LA SUSCRIPCIÓN (Ej: 'Plan Premium Educador')",
      "subtitle": "Subtítulo que comunique valor recurrente",
      "description": "Valor recurrente que aporta el servicio y por qué suscribirse",
      "objectives": ["Lo que lograrás como suscriptor"],
      "targetAudience": "Público ideal para esta membresía",
      "period": "mensual" | "anual" | "trimestral",
      "features": ["Acceso a plataforma", "Sesiones semanales", "Comunidad privada"],
      "advisoryHours": 4,
      "whatsappGroup": "URL del grupo o null",
      "communityAccess": "Descripción del acceso a comunidad",
      "maxUsers": 100,
      "registrationLink": "URL o null",
      "paymentMethods": ["Tarjeta", "PayPal"],
      "price": 99,
      "currency": "USD",
      "benefits": ["Beneficio 1", "Beneficio 2"],
      "bonuses": ["Bonus incluido"],
      "painPoints": ["Problema que resuelve"],
      "guarantee": "Garantía de satisfacción 30 días",
      "socialProof": ["Testimonio de suscriptor"],
      "callToAction": "Suscríbete ahora",
      "idealStudentProfile": "Perfil del suscriptor ideal",
      "competitiveAdvantage": "Qué hace única esta membresía",
      "urgencyTriggers": ["Precio especial de lanzamiento", "Solo 100 cupos"],
      "objectionHandlers": [{"objection": "Ya hay muchas suscripciones", "response": "Esta incluye..."}],
      "successStories": [{"name": "Suscriptor", "quote": "Testimonio", "result": "Resultado"}],
      "missing": ["Campos faltantes"]
    }
    REGLA: ENFATIZA EL VALOR RECURRENTE, LAS FEATURES INCLUIDAS Y LA COMUNIDAD COMO DIFERENCIADOR.`,

    REVIEW_CONTENT: `Eres un editor senior de contenido educativo.
    TU TAREA: Revisar el borrador del curso generado y sugerir 3 mejoras CRÍTICAS para vender más.
    
    CONTEXTO DEL CURSO:
    {{COURSE_JSON}}
    
    RESPONDE CON UN JSON:
    {
        "score": 1-10,
        "critique": "Análisis breve de 2 líneas.",
        "suggestions": [
            "Mejora 1: Cambia el título 'X' por 'Y' para..."
            "Mejora 2: En la descripción falta...",
            "Mejora 3: Agrega un bonus de..."
        ]
    }`,

    COMPLETE_FIELD: `Eres un consultor comercial experto en productos educativos y ventas.
    Tu tarea es ayudar a completar la información de un producto educativo (curso, programa, webinar, taller, suscripción, asesoría o postulación).

    El usuario te proporcionará el contexto actual del producto y una pregunta o instrucción.
    A veces el usuario responde a una pregunta previa del sistema — interpreta su respuesta en ese contexto.

    DEBES RESPONDER SIEMPRE con un JSON válido (sin marcadores de código) con esta estructura:
    {
      "updates": {
        "campo1": "nuevo valor",
        "campo2": "nuevo valor"
      },
      "message": "Explicación breve y amigable de lo que actualizaste"
    }

    REGLAS:
    - "updates" contiene SOLO los campos que puedes inferir de la respuesta del usuario.
    - Campos válidos COMUNES: title, description, objectives (array), targetAudience, modality, duration, hours, startDate, schedule, syllabus (array de {module, topics[]}), instructor, instructorBio, price (número), currency, maxStudents, category, prerequisites, certification, promotions, requirements (array), benefits (array), painPoints (array), guarantee, socialProof (array), faqs (array de {question, answer}), bonuses (array), callToAction, idealStudentProfile, competitiveAdvantage, urgencyTriggers (array), objectionHandlers (array de {objection, response}), successStories (array de {name, quote, result}), registrationLink.
    - Campos TALLER: venue, venueAddress, maxParticipants (número), materials (array), deliverables (array), earlyBirdPrice (número).
    - Campos ASESORIA: advisor, advisorBio, advisorTitle, specialties (array), pricePerHour (número), minimumHours (número), packageHours (número), packagePrice (número), bookingLink, availableSchedule, sessionDuration, topicsCovered (array).
    - Campos POSTULACION: steps (array), documentsNeeded (array), selectionCriteria (array), deadline, examRequired (boolean), availableSlots (número), methods (array).
    - Campos SUBSCRIPCION: frequency, period, features (array), advisoryHours (número), whatsappGroup, communityAccess, maxUsers (número).
    - Si el usuario menciona objeciones, devuelve objectionHandlers: [{objection: "...", response: "..."}].
    - Si el usuario menciona casos de éxito, devuelve successStories: [{name: "...", quote: "...", result: "..."}].
    - MUY IMPORTANTE — Cuando el usuario indica que NO tiene la información ("no tengo", "no sé", "no lo tengo aún", "pendiente", "sin datos", etc.), DE TODAS FORMAS actualiza el campo con un marcador PENDIENTE para que el asistente pueda avanzar:
      • successStories → [{"name": "PENDIENTE", "quote": "Sin casos de éxito por ahora", "result": ""}]
      • objectionHandlers → [{"objection": "PENDIENTE", "response": "Por definir"}]
      • urgencyTriggers, benefits, bonuses u otros arrays de strings → ["PENDIENTE"]
      • Campos de texto (instructor, callToAction, etc.) → "PENDIENTE"
      • Campos numéricos (price, maxStudents, etc.) → deja como null
      En el "message", incluye una RECOMENDACIÓN específica sobre qué información sería ideal para ese campo y cómo obtenerla o crearla.
    - Si no puedes extraer un update válido, devuelve "updates": null y en "message" responde la pregunta del usuario de forma útil.
    - Genera contenido persuasivo y comercialmente fuerte.
    - Responde en español. Solo JSON, sin marcadores de código.`,

    PROFILE_AUDIT: `Eres un consultor de marca educativa de alto nivel.
    TU TAREA: Auditar el perfil de la institución.
    1. Evalúa la coherencia del branding (colores, tono, tagline).
    2. Sugiere mejoras para atraer al público objetivo definido.
    3. Genera una "Personalidad de Marca" sugerida para el bot de IA (Nombre, Tono, Estilo).
    Responde en formato Markdown profesional con secciones claras y emojis.`,

    LANDING: `Eres un Desarrollador Web Senior y Diseñador UX galardonado (Awwwards level).
    TU TAREA: Generar una Landing Page "High-Converting" como HTML + CSS inline.
    
    DEBES RESPONDER ÚNICAMENTE con un bloque de código HTML (dentro de \`\`\`html ... \`\`\`).
    
    ESTRUCTURA OBLIGATORIA (One Page completa):
    1. **Navbar Sticky**: Logo (texto) izquierda, CTA "Inscribirme" derecha. Fondo blur.
    2. **Hero Section (Altura mín 85vh)**:
       - Título impactante (Grande, 3.5rem+, tight leading).
       - Subtítulo persuasivo.
       - Botón CTA principal (con box-shadow y hover effect).
       - Elemento visual abstracto o placeholder de imagen a la derecha.
    3. **Barra de Confianza**: Logos de empresas/certificaciones (placeholders grises).
    4. **Problema/Solución**: Grid 2 columnas. Texto izquierda, visual derecha.
    5. **Módulos/Temario**: Acordeón elegante o Cards con iconos.
    6. **Instructor**: Card flotante con foto redonda y bio.
    7. **Pricing Table**: Card destacada, precio tachado, lista de beneficios con checkmarks.
    8. **FAQ**: Detalles simples y limpios.
    9. **Footer**: Copyright y redes.

    REGLAS DE DISEÑO (STRICT):
    - **Usa la identidad de marca inyectada (Colores/Fuentes)**.
    - Estilo: Modern SaaS / EdTech Premium.
    - Sombras: Usa sombras suaves y difusas (ej: 0 10px 40px -10px rgba(0,0,0,0.08)).
    - Bordes: Radius consistentes (8px, 12px o pill shapes).
    - Espaciado: Usa mucho espacio en blanco (padding: 80px 0 en secciones).
    - Tipografía: Escala tipográfica clara. H1 muy grande, P legible (1.1rem).
    - Transiciones: Todos los botones y links deben tener transition: all 0.3s ease.
    - Responsive: Container max-width 1100px centrado. Mobile-first.
    
    IMPORTANTE: El HTML debe estar listo para copiar y pegar. NO uses tags externos que bloqueen (como scripts de analytics). Usa CSS inline o <style>.`,

    EMAIL_SEQUENCE: `Eres un estratega de Email Marketing para educación.
    TU TAREA: Crear una secuencia de 4 correos de seguimiento para leads interesados pero no inscritos.
    
    Para CADA correo incluye:
    - **Día**: Cuándo enviar (Día 1, 3, 5, 7).
    - **Asunto**: Con alto Open Rate (incluir 2 variantes A/B).
    - **Preview text**: Texto que se ve antes de abrir.
    - **Cuerpo**: Storytelling con estructura PAS (Problema-Agitación-Solución).
    - **CTA**: Botón/enlace claro.
    
    TONO: Apegado estrictamente a la voz de la marca definida.
    Formato Markdown con secciones claras por día.`,

    WHATSAPP_SEQUENCE: `Eres un experto en WhatsApp Marketing para educación.
    TU TAREA: Crear una secuencia de 5 mensajes de WhatsApp para leads interesados pero no inscritos.
    
    Para CADA mensaje:
    - **Día**: Cuándo enviar.
    - **Mensaje**: Corto (<300 chars), directo, uso estratégico de emojis.
    - **Objetivo**: Qué buscamos con este mensaje.
    
    SECUENCIA:
    - Día 1: Bienvenida + Recurso gratuito/Valor.
    - Día 2: Prueba social / Caso de éxito breve.
    - Día 3: Romper principal objeción.
    - Día 4: Urgencia genuina.
    - Día 5: Última llamada.
    
    INCLUYE: 3 respuestas rápidas para objeciones.
    TONO: Usa la voz de la marca.`,

    LAUNCH_CONTENT: `Eres un Launch Manager experto.
    TU TAREA: Crear un Kit de Contenido de Lanzamiento (3 fases).
    1. Pre-Lanzamiento (Teasers).
    2. Lanzamiento (Venta, Stories, Reels).
    3. Post-Lanzamiento (Cierre, Testimonios).
    Usa el tono de voz de la marca estrictamente.`,

    BANNER: `Eres un Diseñador Gráfico Senior especializado en Poster Design y Tipografía.
    TU TAREA: Generar un AFICHE VERTICAL (Poster) promocional como HTML + CSS.
    
    DEBES RESPONDER ÚNICAMENTE con un bloque de código HTML (dentro de \`\`\`html ... \`\`\`).
    
    ESPECIFICACIONES TÉCNICAS:
    - **Formato**: Vertical 4:5 (Aspect Ratio). Contenedor sugerido: width: 100%; max-width: 480px; aspect-ratio: 4/5; margin: auto.
    - **Uso**: Para compartir en WhatsApp, Stories o Feed.
    - **Estilo**: Estilo "Swiss Design" o "Minimal Modern". Tipografía GIGANTE y jerarquía clara.
    
    ELEMENTOS:
    1. **Eyebrow**: Texto pequeño arriba (ej: "NUEVO CURSO" o "MASTERCLASS").
    2. **Título Principal**: Tipografía Display MUY GRANDE, ocupando 40-50% del espacio. Que rompa líneas si es necesario.
    3. **Visual**: Uso creativo de formas geométricas (CSS shapes) o gradientes de la marca de fondo.
    4. **Info Clave**: Fecha, Hora, Modalidad (en una grid pequeña o lista estilizada).
    5. **Footer CTA**: Botón grande o flecha llamando a la acción.
    6. **Branding**: Logo (texto) discreto arriba o abajo.
    
    REGLAS VISUALES:
    - **MÁXIMO CONTRASTE**. Usa los colores de la marca para generar impacto (Fondo oscuro/Texto claro o viceversa).
    - **Tipografía**: Usa Google Fonts (@import). Títulos en Bold/Black weight.
    - **Espaciado**: Márgenes externos (padding) de al menos 40px.
    - **Decoración**: Usa bordes, líneas divisoras gruesas, o círculos desenfocados.
    - NO uses imágenes externas (salvo placeholders de stock si es vital). Todo con CSS.
    - El resultado debe parecer un afiche de diseño digno de imprimir.`,

    SOCIAL_POSTS: `Eres un Social Media Manager y Diseñador Visual.
    TU TAREA: Generar 3 Mockups de posts para redes sociales como HTML + CSS.
    
    DEBES RESPONDER ÚNICAMENTE con un bloque HTML.
    
    Genera un contenedor flex/grid con 3 cards que simulan la interfaz de:
    1. **Instagram Feed**: Cuadrado (1:1). Imagen visual fuerte + UI de IG abajo (likes, save).
    2. **LinkedIn Post**: Rectangular (aspecto documento o slide). Tono profesional. UI de LinkedIn.
    3. **Twitter/X Thread cover**: Texto grande, estilo minimalista. UI de Twitter.
    
    CONTENIDO VISUAL:
    - Usa los colores y fuentes de la marca.
    - Crea composiciones tipográficas interesantes con CSS.
    - Agrega sombras realistas a las cards para que parezcan flotar.
    
    Cada card debe tener abajo el COPY sugerido para el post (texto seleccionable).`,

    COURSE_SHEET: `Eres un Diseñador Editorial.
    TU TAREA: Generar un Brochure / Ficha Técnica (A4 Digital) como HTML + CSS.
    
    DEBES RESPONDER ÚNICAMENTE con un bloque HTML.
    
    ESTRUCTURA (Estilo Documento A4):
    - **Header**: Bloque de color de marca con Título y Logo.
    - **Grid de Datos**: Duración, Modalidad, Nivel, Certificación (iconos SVG simples inline).
    - **Cuerpo**: 2 Columnas asimétricas (Sidebar izquierdo con datos, Cuerpo derecho con descripción).
    - **Syllabus**: Lista limpia con conectores visuales (timeline css).
    - **Instructor**: Foto círculo + nombre.
    - **Footer**: Precio grande y datos de contacto.
    
    REGLAS:
    - Fondo blanco (papel).
    - Tipografía serif para títulos (si la marca lo permite) o sans-serif elegante.
    - Uso de líneas finas y espaciado editorial.
    - Sombras muy sutiles solo en elementos flotantes.`,

    MARKETING: `Eres un Growth Marketer experto.
    TU TAREA: Generar un Kit de Lanzamiento completo (Buyer Persona, Ads, SEO, Estrategia).
    Usa el tono de voz de la marca.`,

    TRENDS: `Eres un Analista de Mercado. Identifica Océanos Azules y tendencias para este perfil.`,

    CONTENT: `Eres un Content Manager. Crea un calendario de 2 semanas alineado a la estrategia de marca.`,

    ANALYZE_BRAND: `Eres un experto en Branding e Identidad Visual.
    TU TAREA: Analizar el texto proporcionado (Sobre nosotros, Manual de marca, etc.) y extraer la identidad de la marca.
    
    DEBES RESPONDER ÚNICAMENTE con un JSON válido (sin markdown) con esta estructura:
    {
        "colors": {
            "primary": "HEX code (detectado o sugerido)",
            "secondary": "HEX code",
            "accent": "HEX code",
            "neutral": "HEX code (para fondos/textos)"
        },
        "typography": {
            "headings": "Nombre de fuente sugerida (Google Fonts)",
            "body": "Nombre de fuente sugerida (Google Fonts)"
        },
        "voice": {
            "tone": "formal" | "cercano" | "inspiracional" | "disruptivo",
            "style": "Descripción breve del estilo (ej: 'Profesional pero accesible, usa metáforas')",
            "keywords": ["palabra1", "palabra2", "palabra3"]
        },
        "visualIdentity": {
            "mood": "Descripción del mood visual (ej: 'Minimalista, tecnológico, limpio')",
            "shapes": "rounded" | "sharp" | "organic"
        }
    }
    
    REGLAS:
    - Si el texto no menciona colores específicos, SUGIERE una paleta profesional basada en la personalidad descrita.
    - Si no menciona fuentes, SUGIERE combinaciones modernas (ej: Inter/Roboto, Playfair/Lato).
    - El "tone" debe ser uno de los 4 valores permitidos.
    - Responde SOLO con el JSON.`,

    SQL_CATALOG_QUERY: `Actúa como un experto en SQL para PostgreSQL. Tu tarea es generar la consulta SQL que filtre la tabla \`public.catalog\` basándote en la solicitud del usuario.

TABLA: \`public.catalog\`
COLUMNAS DISPONIBLES:
- code (string): Código único (ej: CRS-AI-001)
- title (string): Nombre del programa
- category (string): Área (IA, Marketing, Ventas, Finanzas, Liderazgo)
- price (number): Costo
- modality (string): 'online', 'presencial', 'hibrido'
- location (string): Sede (ej: 'Virtual', 'Sede Central', 'Sede Miraflores')
- instructor (string): Nombre del experto
- duration (string): Duración (ej: '20 horas', '6 meses')
- startDate (string): Fecha de inicio (YYYY-MM-DD)
- hasPromotion (boolean): Indica si tiene descuento activo
- tags (string[]): Etiquetas

REGLAS DE SALIDA:
1. Responde UNICAMENTE con la consulta SQL.
2. Usa LIKE para búsquedas de texto: title LIKE '%IA%'
3. Para categorías usa: category = 'Marketing'
4. Para promociones usa: hasPromotion = true
5. Para sedes usa: location LIKE '%Miraflores%'
6. Para ordenamiento usa: ORDER BY price ASC | DESC
7. Combina con AND / OR según la lógica del usuario.
8. Si el usuario no pide nada específico, usa: SELECT * FROM public.catalog
9. NO incluyas markdown (\`\`\`), solo el texto plano de la consulta.
    `
};


// Helper to strip Markdown code blocks
function cleanJson(text: string): any {
    try {
        // Try to find the first '{' and last '}'
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');

        if (start === -1 || end === -1) {
            // Fallback to simple replace if no braces found
            const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
            return JSON.parse(cleaned);
        }

        const jsonStr = text.substring(start, end + 1);
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error('Error parsing JSON from Gemini:', e, text);
        return null;
    }
}

export async function analyzeCourseData(data: Record<string, unknown>, type: 'curso' | 'programa' | 'webinar'): Promise<string> {
    const prompt = type === 'webinar'
        ? `Analiza este WEBINAR para fines comerciales. Enfócate en la urgencia y el valor rápido:\n${JSON.stringify(data, null, 2)}`
        : `Analiza este CURSO/PROGRAMA para venta académica. Enfócate en la transformación y malla curricular:\n${JSON.stringify(data, null, 2)}`;
    const res = await ask(prompt, PROMPTS.ANALYZE);
    return cleanJson(res);
}

const PROMPT_MAP: Record<string, string> = {
    curso: PROMPTS.RAW_EXTRACT_CURSO,
    programa: PROMPTS.RAW_EXTRACT_PROGRAMA,
    webinar: PROMPTS.RAW_EXTRACT_WEBINAR,
    taller: PROMPTS.RAW_EXTRACT_TALLER,
    subscripcion: PROMPTS.RAW_EXTRACT_SUBSCRIPCION,
    asesoria: PROMPTS.RAW_EXTRACT_ASESORIA,
    postulacion: PROMPTS.RAW_EXTRACT_POSTULACION,
};

export async function analyzeRawText(text: string, type?: string): Promise<string> {
    const hint = type ? `\nNota: El usuario indicó que es un "${type}".` : '';
    const prompt = (type && PROMPT_MAP[type]) || PROMPTS.RAW_EXTRACT_CURSO;
    const res = await ask(`Extrae la información del siguiente texto:\n---\n${text}\n---${hint}`, prompt);
    return cleanJson(res);
}

export async function analyzeFileContent(content: string, fileName: string, type?: string): Promise<string> {
    const isBase64 = content.startsWith('data:');

    if (isBase64) {
        await ensureKeysLoaded();
        const base64Data = content.split(',')[1];
        const mimeType = content.split(';')[0].split(':')[1];
        const client = getClient();
        const hint = type && type !== 'auto' ? `El usuario indica que es un "${type}".` : '';
        const basePrompt = (type && PROMPT_MAP[type]) || PROMPTS.RAW_EXTRACT_CURSO;
        const prompt = `${basePrompt}\n\nAnaliza este archivo adjunto: "${fileName}". ${hint}\nExtrae TODA la información que encuentres en el documento.`;

        for (const model of GEMINI_MODELS) {
            try {
                const response = await client.models.generateContent({
                    model,
                    contents: [{
                        role: 'user',
                        parts: [
                            { text: prompt },
                            { inlineData: { mimeType, data: base64Data } }
                        ]
                    }]
                });
                const text = response.text;
                if (text) return cleanJson(text);
            } catch (err) {
                console.warn(`File analysis failed with ${model}, trying next...`);
            }
        }
        throw new Error('No se pudo analizar el archivo. Todos los modelos fallaron. Intenta pegar el contenido como texto.');
    }

    const hint = type ? `\nNota: El usuario indicó que es un "${type}".` : '';
    const prompt = (type && PROMPT_MAP[type]) || PROMPTS.RAW_EXTRACT_CURSO;
    const res = await ask(`Analiza este contenido del archivo "${fileName}":\n---\n${content}\n---${hint}`, prompt);
    return cleanJson(res);
}

// AI Chat Agent
export async function completeField(courseContext: string, userQuestion: string): Promise<any> {
    const res = await ask(
        `CONTEXTO DEL CURSO:\n${courseContext}\n\nPREGUNTA/INSTRUCCIÓN DEL USUARIO: ${userQuestion}`,
        PROMPTS.COMPLETE_FIELD
    );
    return cleanJson(res);
}

// Review Content Helper
export async function reviewContent(courseData: any): Promise<string> {
    const prompt = PROMPTS.REVIEW_CONTENT.replace('{{COURSE_JSON}}', JSON.stringify(courseData, null, 2));
    const res = await ask(prompt, 'Eres un coach de ventas agresivo pero profesional.');
    return cleanJson(res);
}

export async function analyzeProfileData(data: Record<string, unknown>): Promise<string> {
    return ask(`Perfil:\n${JSON.stringify(data, null, 2)}`, PROMPTS.PROFILE_AUDIT);
}

// === Branding Helper ===
export async function analyzeBrand(text: string): Promise<string> {
    const res = await ask(`Analiza este texto de marca:\n---\n${text}\n---`, PROMPTS.ANALYZE_BRAND);
    return cleanJson(res);
}

function getBrandContext(p: any): string {
    // Robust context generation handling both legacy and new structure
    const b = p.branding || {};
    const colors = b.colors || {};

    // Fallbacks for legacy data
    const primary = colors.primary || b.primaryColor || '#2563EB';
    const secondary = colors.secondary || b.secondaryColor || '#1E40AF';
    const accent = colors.accent || b.accentColor || '#F59E0B';
    const fontHead = b.typography?.headings || (b.fontPreference === 'clasica' ? 'Playfair Display' : 'Inter');
    const fontBody = b.typography?.body || (b.fontPreference === 'clasica' ? 'Lato' : 'Inter');
    const tone = b.voice?.tone || b.toneOfVoice || 'profesional';
    const style = b.voice?.style || 'Confianza y claridad educativa';
    const logo = b.logo ? `(Logo URL: ${b.logo})` : '';

    return `
    IDENTIDAD DE MARCA (STRICT):
    - NOMBRE: ${p.name || 'La Institución'} ${logo}
    - COLORES: Primario ${primary}, Secundario ${secondary}, Acento ${accent}.
    - TIPOGRAFÍA: Títulos '${fontHead}', Cuerpo '${fontBody}'.
    - TONO DE VOZ: ${tone}. ${style}.
    - NOTA: Usa estos colores y fuentes ESTRICTAMENTE en cualquier CSS o generación visual. El diseño debe reflejar esta identidad.
    `;
}

// === Content Generation Tools ===
export async function generateLanding(c: Record<string, unknown>, p: Record<string, unknown>): Promise<string> {
    const brandCtx = getBrandContext(p);
    return ask(`${brandCtx}\n\nCURSO:\n${JSON.stringify(c, null, 2)}\n\nORGANIZACIÓN:\n${JSON.stringify(p, null, 2)}`, PROMPTS.LANDING);
}
export async function generateEmailSequence(c: Record<string, unknown>, p: Record<string, unknown>): Promise<string> {
    const brandCtx = getBrandContext(p);
    return ask(`${brandCtx}\n\nCURSO:\n${JSON.stringify(c, null, 2)}\n\nORG:\n${JSON.stringify(p, null, 2)}`, PROMPTS.EMAIL_SEQUENCE);
}
export async function generateWhatsAppSequence(c: Record<string, unknown>, p: Record<string, unknown>): Promise<string> {
    const brandCtx = getBrandContext(p);
    return ask(`${brandCtx}\n\nCURSO:\n${JSON.stringify(c, null, 2)}\n\nORG:\n${JSON.stringify(p, null, 2)}`, PROMPTS.WHATSAPP_SEQUENCE);
}
export async function generateLaunchContent(c: Record<string, unknown>, p: Record<string, unknown>): Promise<string> {
    const brandCtx = getBrandContext(p);
    return ask(`${brandCtx}\n\nCURSO:\n${JSON.stringify(c, null, 2)}\n\nORG:\n${JSON.stringify(p, null, 2)}`, PROMPTS.LAUNCH_CONTENT);
}
export async function generateBanner(c: Record<string, unknown>, p: Record<string, unknown>): Promise<string> {
    const brandCtx = getBrandContext(p);
    return ask(`${brandCtx}\n\nCURSO:\n${JSON.stringify(c, null, 2)}\n\nORG:\n${JSON.stringify(p, null, 2)}`, PROMPTS.BANNER);
}
export async function generateSocialPosts(c: Record<string, unknown>, p: Record<string, unknown>): Promise<string> {
    const brandCtx = getBrandContext(p);
    return ask(`${brandCtx}\n\nCURSO:\n${JSON.stringify(c, null, 2)}\n\nORG:\n${JSON.stringify(p, null, 2)}`, PROMPTS.SOCIAL_POSTS);
}
export async function generateCourseSheet(c: Record<string, unknown>, p: Record<string, unknown>): Promise<string> {
    const brandCtx = getBrandContext(p);
    return ask(`${brandCtx}\n\nCURSO:\n${JSON.stringify(c, null, 2)}\n\nORG:\n${JSON.stringify(p, null, 2)}`, PROMPTS.COURSE_SHEET);
}
export async function generateMarketing(c: Record<string, unknown>, p: Record<string, unknown>): Promise<string> {
    const brandCtx = getBrandContext(p);
    return ask(`${brandCtx}\n\nCURSO:\n${JSON.stringify(c, null, 2)}\n\nORG:\n${JSON.stringify(p, null, 2)}`, PROMPTS.MARKETING);
}
export async function generateContentIdeas(p: Record<string, unknown>, c: Record<string, unknown>): Promise<string> {
    const brandCtx = getBrandContext(p);
    return ask(`${brandCtx}\n\nORG:\n${JSON.stringify(p, null, 2)}\n\nCURSOS:\n${JSON.stringify(c, null, 2)}`, PROMPTS.CONTENT);
}
// Keep legacy export for backward compatibility
export async function generateSequence(c: Record<string, unknown>, p: Record<string, unknown>): Promise<string> {
    return generateEmailSequence(c, p);
}
export async function analyzeTrends(p: Record<string, unknown>, o: Record<string, unknown>): Promise<string> {
    const brandCtx = getBrandContext(p);
    return ask(`${brandCtx}\n\nPERFIL:\n${JSON.stringify(p, null, 2)}\n\nCATÁLOGO:\n${JSON.stringify(o, null, 2)}`, PROMPTS.TRENDS);
}
export async function refineContent(originalContent: string, userInstruction: string): Promise<string> {
    const prompt = `CONTENIDO ORIGINAL:\n${originalContent}\n\nINSTRUCCIÓN DEL USUARIO: "${userInstruction}"\n\nTU TAREA: Reescribe o modifica el contenido original siguiendo ESTRICTAMENTE la instrucción del usuario. Mantén el mismo formato (si es HTML mantén HTML, si es Markdown mantén Markdown).`;
    return ask(prompt, 'Eres un editor de contenido experto y obediente. Tu única misión es ajustar el texto según lo pedido. Si el contenido es HTML, devuelve HTML válido. Si es Markdown, devuelve Markdown.');
}

// === Helper for SQL Filtering (Simulated) ===
function filterCatalogItems(catalog: any[], sql: string): any[] {
    console.log('[Grounding] Executing simulated SQL:', sql);
    if (!sql || (sql.includes('SELECT * FROM public.catalog') && !sql.includes('WHERE') && !sql.includes('ORDER BY'))) return catalog;

    try {
        const whereMatch = sql.match(/WHERE\s+(.*?)(?:\s+ORDER BY|$)/i);
        const whereClause = whereMatch ? whereMatch[1].trim() : '';

        let filtered = catalog;

        if (whereClause) {
            filtered = catalog.filter(item => {
                // Split by AND (basic version)
                const terms = whereClause.split(/\s+AND\s+/i);
                return terms.every(term => {
                    // LIKE case
                    const likeMatch = term.match(/(\w+)\s+LIKE\s+'%?([^%']+)%?'/i);
                    if (likeMatch) {
                        const [, field, val] = likeMatch;
                        const itemVal = String(item[field] || '').toLowerCase();
                        return itemVal.includes(val.toLowerCase());
                    }

                    // Equality case
                    const eqMatch = term.match(/(\w+)\s*=\s*['"]?(.+?)['"]?/i);
                    if (eqMatch) {
                        const [, field, val] = eqMatch;
                        if (field === 'hasPromotion') {
                            return val === 'true' ? !!item.promotions : !item.promotions;
                        }
                        return String(item[field] || '').toLowerCase() === val.toLowerCase();
                    }

                    // Comparison case
                    const compMatch = term.match(/(\w+)\s*([<>]=?)\s*(\d+)/);
                    if (compMatch) {
                        const [, field, op, val] = compMatch;
                        const itemVal = Number(item[field]);
                        const numVal = Number(val);
                        if (op === '>') return itemVal > numVal;
                        if (op === '>=') return itemVal >= numVal;
                        if (op === '<') return itemVal < numVal;
                        if (op === '<=') return itemVal <= numVal;
                    }
                    return true;
                });
            });
        }

        // Handle ORDER BY
        const orderMatch = sql.match(/ORDER BY\s+(\w+)\s+(ASC|DESC)/i);
        if (orderMatch) {
            const [, field, direction] = orderMatch;
            filtered.sort((a, b) => {
                const valA = a[field];
                const valB = b[field];
                const isNumeric = typeof valA === 'number' || typeof valB === 'number';
                if (isNumeric) {
                    return direction.toUpperCase() === 'DESC' ? (Number(valB) || 0) - (Number(valA) || 0) : (Number(valA) || 0) - (Number(valB) || 0);
                }
                return direction.toUpperCase() === 'DESC' ? String(valB || '').localeCompare(String(valA || '')) : String(valA || '').localeCompare(String(valB || ''));
            });
        }

        return filtered;
    } catch (e) {
        console.warn('Error filtering catalog with simulated SQL:', e);
        return catalog;
    }
}

export async function chatWithAgent(
    agent: AiAgent,
    history: { role: string, content: string }[],
    userMsg: string,
    courseContext?: any,
    orgProfile?: OrgProfile,
    fullCatalog?: { courses?: any[], programs?: any[], webinars?: any[] } | null,
): Promise<string> {

    // PRE-STEP: Grounding — skip if we already have a focused course (saves one AI round-trip)
    let filteredCatalog = fullCatalog;
    if (!courseContext && fullCatalog) {
        try {
            const sqlQuery = await ask(
                `MENSAJE DEL USUARIO: ${userMsg}`,
                PROMPTS.SQL_CATALOG_QUERY
            );
            const allItems = [
                ...(fullCatalog.courses || []).map(c => ({ ...c, itemType: 'curso' })),
                ...(fullCatalog.programs || []).map(p => ({ ...p, itemType: 'programa' })),
                ...(fullCatalog.webinars || []).map(w => ({ ...w, itemType: 'webinar' }))
            ];
            const results = filterCatalogItems(allItems, sqlQuery);
            filteredCatalog = {
                courses: results.filter(r => r.itemType === 'curso'),
                programs: results.filter(r => r.itemType === 'programa'),
                webinars: results.filter(r => r.itemType === 'webinar')
            };
        } catch (e) {
            console.warn('Grounding query step failed, using full catalog as fallback.', e);
        }
    }

    // === Build the verified catalog block ===
    const catalogBlock = (() => {
        if (!filteredCatalog) return 'No hay catálogo disponible.';

        const sections: string[] = [];

        if (filteredCatalog.courses?.length) {
            sections.push('=== CURSOS DISPONIBLES ===');
            filteredCatalog.courses.forEach((c: any) => {
                const details: string[] = [];
                details.push(`• [${c.code || ''}] ${c.title} | ${c.modality || 'online'} | ${c.duration || ''} | ${c.currency || 'USD'} ${c.price || 0} | Instructor: ${c.instructor || 'N/A'}`);
                if (c.startDate) details.push(`  Inicio: ${c.startDate}${c.endDate ? ` — Fin: ${c.endDate}` : ''}`);
                if (c.schedule) details.push(`  Horario: ${c.schedule}`);
                if (c.location) details.push(`  Ubicación: ${c.location}`);
                if (c.certification) details.push(`  Certificación: ${c.certification}`);
                if (c.maxStudents) details.push(`  Cupos: ${c.maxStudents}`);
                if (c.description) details.push(`  Descripción: ${c.description.slice(0, 150)}...`);
                sections.push(details.join('\n'));
            });
        }

        if (filteredCatalog.programs?.length) {
            sections.push('\n=== PROGRAMAS / DIPLOMADOS ===');
            filteredCatalog.programs.forEach((p: any) => {
                const details: string[] = [];
                details.push(`• [${p.code || ''}] ${p.title} | ${p.totalDuration || ''} | ${p.currency || 'USD'} ${p.price || 0}`);
                if (p.startDate) details.push(`  Inicio: ${p.startDate}`);
                if (p.modality) details.push(`  Modalidad: ${p.modality}`);
                if (p.certification) details.push(`  Certificación: ${p.certification}`);
                if (p.description) details.push(`  Descripción: ${p.description.slice(0, 150)}...`);
                sections.push(details.join('\n'));
            });
        }

        if (filteredCatalog.webinars?.length) {
            sections.push('\n=== WEBINARS / MASTERCLASSES ===');
            filteredCatalog.webinars.forEach((w: any) => {
                const details: string[] = [];
                details.push(`• ${w.title} | ${w.speaker || ''} | ${w.date || 'Próximamente'} | ${w.price === 0 ? 'GRATIS' : `${w.currency} ${w.price}`}`);
                if (w.duration) details.push(`  Duración: ${w.duration}`);
                if (w.description) details.push(`  Descripción: ${w.description.slice(0, 150)}...`);
                sections.push(details.join('\n'));
            });
        }

        return sections.join('\n') || 'Catálogo vacío (Ningún curso coincide con la búsqueda).';
    })();

    // === Focused course being sold (if any) ===
    const courseInfo = courseContext ? `
CURSO PRINCIPAL QUE ESTÁS VENDIENDO HOY:
Nombre: ${courseContext.title}
Código: ${courseContext.code || 'N/A'}
Precio: ${courseContext.currency || 'USD'} ${courseContext.price || 0}
${courseContext.earlyBirdPrice ? `Precio Early Bird: ${courseContext.currency || 'USD'} ${courseContext.earlyBirdPrice}${courseContext.earlyBirdDeadline ? ` (hasta ${courseContext.earlyBirdDeadline})` : ''}` : ''}
Modalidad: ${courseContext.modality || 'online'}
Duración: ${courseContext.duration || 'N/A'}
${courseContext.startDate ? `Fecha de inicio: ${courseContext.startDate}` : ''}
${courseContext.endDate ? `Fecha de fin: ${courseContext.endDate}` : ''}
${courseContext.schedule ? `Horario: ${courseContext.schedule}` : ''}
${courseContext.location ? `Ubicación: ${courseContext.location}` : ''}
Instructor: ${courseContext.instructor || 'N/A'}
${courseContext.instructorBio ? `Bio del Instructor: ${courseContext.instructorBio}` : ''}
Descripción: ${courseContext.description || ''}
${courseContext.category ? `Categoría: ${courseContext.category}` : ''}
${courseContext.certification ? `Certificación: ${courseContext.certification}` : ''}
${courseContext.maxStudents ? `Cupos disponibles: ${courseContext.maxStudents} (menciona esto como factor de urgencia)` : ''}
${courseContext.prerequisites ? `Requisitos previos: ${courseContext.prerequisites}` : ''}
${courseContext.requirements ? `Requerimientos: ${courseContext.requirements}` : ''}
Objetivos: ${(courseContext.objectives || []).join(', ')}
Beneficios: ${(courseContext.benefits || []).join(', ')}
Bonos: ${(courseContext.bonuses || []).join(', ')}
Garantía: ${courseContext.guarantee || 'N/A'}
Call to Action: ${courseContext.callToAction || 'N/A'}
Perfil del estudiante ideal: ${courseContext.idealStudentProfile || 'N/A'}
Ventaja competitiva: ${courseContext.competitiveAdvantage || 'N/A'}
Gatillos de urgencia: ${(courseContext.urgencyTriggers || []).join(', ') || 'N/A'}
${courseContext.paymentMethods?.length ? `Métodos de pago aceptados: ${courseContext.paymentMethods.join(', ')}` : ''}
${courseContext.registrationLink ? `Link de inscripción: ${courseContext.registrationLink}` : ''}
${courseContext.faqs?.length ? `
PREGUNTAS FRECUENTES (usa estas respuestas cuando aplique):
${courseContext.faqs.map((f: any) => `  P: "${f.question}" → R: "${f.answer}"`).join('\n')}` : ''}
${courseContext.objectionHandlers?.length ? `
MANEJO DE OBJECIONES (usa estas respuestas cuando el prospecto tenga dudas):
${courseContext.objectionHandlers.map((oh: any) => `  Objeción: "${oh.objection}" → Respuesta: "${oh.response}"`).join('\n')}` : ''}
${courseContext.successStories?.length ? `
CASOS DE ÉXITO (menciona estos para generar confianza):
${courseContext.successStories.map((ss: any) => `  ${ss.name}: "${ss.quote}" ${ss.result ? `(Resultado: ${ss.result})` : ''}`).join('\n')}` : ''}
    ` : '';

    // === Org info ===
    const orgInfo = orgProfile ? `
INFORMACIÓN DE LA INSTITUCIÓN:
Nombre: ${orgProfile.name}
Tipo: ${orgProfile.type || 'No especificado'}
Correo de contacto: ${orgProfile.contactEmail || 'No especificado'}
Teléfono: ${orgProfile.contactPhone || 'No especificado'}
WhatsApp: ${orgProfile.whatsapp || 'No especificado'}
Website: ${orgProfile.website || 'No especificado'}
Sedes: ${orgProfile.locations ? orgProfile.locations.map((l: any) => `${l.name} (${l.address})${l.phone ? ` Tel: ${l.phone}` : ''}${l.schedule ? ` Horario: ${l.schedule}` : ''}`).join(' | ') : 'No hay sedes registradas'}
Horarios: ${orgProfile.operatingHours ? orgProfile.operatingHours.map((h: any) => `${h.days}: ${h.hours}`).join(' | ') : 'No especificado'}
Métodos de pago: ${orgProfile.paymentMethods ? orgProfile.paymentMethods.map((pm: any) => `${pm.name} (${pm.type})`).join(', ') : 'No especificado'}
    ` : '';

    const orgName = orgProfile?.name || '';
    const systemPrompt = `Eres **${agent.name}**${orgName ? `, agente de ventas de **${orgName}**` : ''}.
ROL: ${agent.role}
PERSONALIDAD: ${agent.personality || 'carismático, directo y persuasivo'}
TONO: ${agent.tone || 'Cálido, entusiasta y orientado al cierre'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 ESTILO DE VENTA — MUY IMPORTANTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Eres un CLOSER, no un consultor. Tu objetivo es CERRAR la inscripción.

SI TIENES EL CURSO PRINCIPAL DEFINIDO:
→ NO hagas preguntas diagnósticas. Ya sabes lo que vendes.
→ Abre con el beneficio principal + precio + CTA directo.
→ Ej: "¡Este curso puede llevarte de X a Y en Z semanas por solo $299! ¿Arrancamos?"
→ Tu segunda respuesta ya debe incluir el precio si no lo diste antes.

SI ES CATÁLOGO GENERAL (sin curso específico):
→ Haz MÁXIMO UNA pregunta rápida (nunca 2 seguidas).
→ Luego RECOMIENDA de inmediato el más relevante con precio y beneficio.
→ No esperes tener toda la info — actúa con lo que tienes.

PRESENTACIÓN: Vende la TRANSFORMACIÓN, no las características:
  ❌ "El curso tiene 6 módulos y 40 horas"
  ✅ "En 6 semanas pasas de [situación actual] a [resultado] 🚀"

MANEJO DE OBJECIONES (responde sin dudar):
  • "Muy caro" → Framea como inversión: "¿Cuánto vale para ti [resultado concreto]?"
  • "No tengo tiempo" → Muestra flexibilidad: horario, acceso, carga horaria real
  • "Déjame pensarlo" → Activa urgencia + caso de éxito + propón siguiente paso
  • "No me interesa" → Descubre la objeción real con UNA pregunta, luego rebate

CIERRE AGRESIVO:
  • No esperes que el prospecto decida solo — propón el siguiente paso en cada mensaje
  • Usa emojis estratégicamente para dar energía ✅💡🎯🚀
  • Usa **negrita** para destacar precios, beneficios clave y CTAs
  • Máximo 3-4 líneas por respuesta. Nunca monólogos largos.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 REGLAS ABSOLUTAS (NUNCA romper estas reglas)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. JAMÁS inventes ni menciones un curso, programa o webinar que NO esté en el catálogo real de abajo.
2. SOLO menciona precios, promociones, descuentos, becas y métodos de pago que estén EXPLÍCITAMENTE en la información del curso o la institución.
   ❌ NUNCA inventes: becas o financiamiento no mencionado, planes de pago (cuotas, facilidades) no especificadas, códigos de descuento, disponibilidad de horarios del instructor no listados. Si NO aparecen en los datos, NO los inventes.
3. Si el usuario pregunta sobre algo que NO está en la información proporcionada (promociones, financiamiento, becas, descuentos, planes de pago, etc.), responde: "No tengo esa información disponible en este momento, pero puedo conectarte con un asesor que te pueda dar todos los detalles."
4. Si el catálogo dice "vacío", ofrece el catálogo general disponible.
5. Si piden hablar con humano → di: "Te paso con el equipo de ventas para coordinar los detalles finales."
6. Si quieren comprar → di: "¡Excelente decisión! La inscripción ha sido completada con éxito. ¡Bienvenido al curso!"
7. Si hay [SIMULACION: ...], responde al escenario como si fuera real.
8. Siempre usa **negrita** y emojis relevantes — hace la conversación más viva y legible.
9. Al inicio de la conversación, pregunta el nombre del usuario de forma natural (Ej: "¿Con quién tengo el gusto?", "¿Me puedes dar tu nombre?"). Usa su nombre a lo largo de la conversación.

${courseContext?.filterQuestions?.length ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 PREGUNTAS DE CALIFICACION (MUY IMPORTANTE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEBES hacer estas preguntas de forma natural durante la conversación, NO como un formulario. Las OBLIGATORIAS se deben responder ANTES de intentar cerrar la venta.
${courseContext.filterQuestions.map((q: any, i: number) => {
    const reqLabel = q.isRequired ? 'OBLIGATORIA' : 'Opcional';
    const options = q.type === 'select' && q.options?.length ? ` (opciones: ${q.options.join(', ')})` : '';
    return `${i + 1}. ${q.question} [${reqLabel}]${options}`;
}).join('\n')}
` : ''}

CATÁLOGO DISPONIBLE:
${catalogBlock}

${orgInfo}
${courseInfo}

HISTORIAL:
${history.map(h => `${h.role === 'user' ? 'USUARIO' : 'AGENTE'}: ${h.content}`).join('\n')}

INSTRUCCIÓN: Sé directo, entusiasta y orientado al cierre. Cada mensaje debe acercar al prospecto UN PASO MÁS a inscribirse. ¡Cierra!`;

    try {
        return await ask(userMsg, systemPrompt);
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('429') || msg.includes('503') || msg.includes('quota') || msg.includes('overloaded')) {
            return 'Estoy recibiendo muchas consultas en este momento. Espera 30 segundos e intenta de nuevo. 🙏';
        }
        if (msg.includes('API_KEY') || msg.includes('invalid') || msg.includes('403')) {
            return 'Hay un problema con la configuración de la IA. Por favor contacta al administrador.';
        }
        throw err;
    }
}

