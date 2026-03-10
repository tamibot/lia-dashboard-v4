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

// === Core AI Function (with model fallback + OpenAI backup) ===

async function ask(prompt: string, system: string, retries = 2): Promise<string> {
    const client = getClient();

    // Try each Gemini model with retries
    for (const model of GEMINI_MODELS) {
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const response = await client.models.generateContent({
                    model,
                    contents: prompt,
                    config: {
                        systemInstruction: system,
                    }
                });
                const text = response.text;
                if (text) return text;
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : '';
                console.warn(`Attempt ${attempt + 1} failed for ${model}: ${msg}`);

                if (msg.includes('404') || msg.includes('not found')) {
                    console.warn(`Model ${model} not available, skipping...`);
                    break;
                }

                if ((msg.includes('429') || msg.includes('quota') || msg.includes('resource_exhausted')) && attempt < retries) {
                    // Exponential backoff: 2s, 4s, 8s
                    const waitTime = Math.pow(2, attempt + 1) * 1000;
                    console.warn(`Rate limit hit, waiting ${waitTime}ms before retry...`);
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
            const result = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: system },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 4096,
            });
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
      "missing": ["Campos faltantes"]
    }
    REGLA: EL SYLLABUS DEBE SER MUY DETALLADO INDICANDO QUÉ SE VA A APRENDER. SIEMPRE INCLUYE EL TEMA DEL CERTIFICADO.`,

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
      "missing": ["Campos faltantes"]
    }
    REGLA: ENFATIZA LOS REQUISITOS (EXPERIENCIA PREVIA) Y DETALLA LA PLANA DOCENTE SI APARECE EN EL TEXTO.`,

    RAW_EXTRACT_WEBINAR: `Eres un experto en Lanzamientos y Generación de Leads.
    TU TAREA: Transformar contenido crudo de un WEBINAR/MASTERCLASS en un gancho hiper-persuasivo.
    
    FORMATO DE RESPUESTA (JSON PURO):
    {
      "type": "webinar",
      "title": "TÍTULO GANCHO DE URGENCIA",
      "description": "Copy corto. Qué descubrirán en estos 60/90 minutos.",
      "speaker": "Nombre del experto",
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "duration": "Tiempo corto",
      "targetAudience": "A quién le urge ver esto",
      "modality": "online" | "presencial",
      "platform": "Zoom/Meet",
      "price": 0,
      "currency": "USD",
      "benefits": ["Plantilla gratis en vivo", "Q&A"],
      "painPoints": ["Problema muy urgente"],
      "socialProof": ["Más de X registrados"],
      "missing": ["Campos faltantes"]
    }
    REGLA DE ORO: NO INCLUYAS SYLLABUS. EL WEBINAR ES CORTO, ENFÓCATE EN EL ENLACE DE REGISTRO, SI ES VIRTUAL/PRESENCIAL Y QUÉ SECRETO VAN A DESCUBRIR.`,

    RAW_EXTRACT_POSTULACION: `Eres un experto en Admisiones Universitarias y Reclutamiento.
    TU TAREA: extraer información sobre procesos de POSTULACIÓN, ADMISIÓN o INGRESO.

    FORMATO DE RESPUESTA (JSON PURO):
    {
      "type": "postulacion",
      "title": "NOMBRE DEL PROCESO (Ej: 'Admisión 2026-I')",
      "description": "Explicación del proceso y a qué programas aplica.",
      "methods": ["Examen de admisión", "Ingreso directo", "Traslado"],
      "modalities": ["Ordinario", "Extraordinario", "Beca"],
      "dates": [ { "event": "Cierre de inscripciones", "date": "YYYY-MM-DD" } ],
      "requirements": ["DNI", "Certificado de estudios"],
      "contactInfo": { "phone": "string", "email": "string", "office": "string" },
      "price": número,
      "currency": "USD" | "PEN",
      "missing": ["Campos faltantes"]
    }`,

    RAW_EXTRACT_SUBSCRIPCION: `Eres un experto en Modelos de Negocio Recurrentes (SaaS/Memberhsips).
    TU TAREA: extraer información sobre un servicio de SUSCRIPCIÓN (asesoría, acompañamiento, etc).

    FORMATO DE RESPUESTA (JSON PURO):
    {
      "type": "subscripcion",
      "title": "NOMBRE DE LA SUSCRIPCIÓN (Ej: 'Asesoría Premium')",
      "description": "Valor recurrente que aporta el servicio.",
      "price": número,
      "currency": "USD" | "PEN",
      "frequency": "mensual" | "anual" | "trimestral",
      "benefits": ["Acceso a portal", "1 sesión semanal"],
      "bonuses": ["Guía gratuita"],
      "missing": ["Campos faltantes"]
    }`,

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

    COMPLETE_FIELD: `Eres un asistente experto en diseño instruccional y gestión académica.
    Tu tarea es ayudar a completar la información faltante de un curso/programa/webinar.
    
    El usuario te proporcionará el contexto actual del curso y te pedirá completar o mejorar información.
    
    DEBES RESPONDER SIEMPRE con un JSON válido (sin marcadores de código) con esta estructura:
    {
      "updates": {
        "campo1": "nuevo valor",
        "campo2": "nuevo valor"
      },
      "message": "Explicación breve de lo que hiciste y por qué"
    }
    
    REGLAS:
    - "updates" contiene SOLO los campos que el usuario pidió completar o mejorar.
    - Los nombres de campos válidos son: title, description, objectives, targetAudience, modality, duration, hours, startDate, schedule, syllabus, instructor, instructorBio, price, currency, maxStudents, category, prerequisites, certification, promotions, requirements, contactInfo, benefits, painPoints, guarantee, socialProof, faqs, bonuses, methods, modalities, dates, frequency.
    - Si el usuario pide objetivos, devuelve "objectives": ["Obj1", "Obj2", ...].
    - Si el usuario pide descripción, devuelve "description": "texto".
    - Si el usuario pide precio, devuelve "price": número.
    - Si el usuario pide temario/syllabus, devuelve "syllabus": [{"module": "Nombre", "topics": ["t1", "t2"]}].
    - "message" es una explicación amigable de los cambios para mostrar al usuario.
    - Genera contenido persuasivo, profesional y realista.
    - Responde en español (o el idioma del usuario).
    - Responde SOLO con el JSON, sin marcadores de código.`,

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

export async function analyzeRawText(text: string, type?: string): Promise<string> {
    const hint = type ? `\nNota: El usuario indicó que es un "${type}".` : '';
    let prompt = PROMPTS.RAW_EXTRACT_CURSO;
    if (type === 'programa') prompt = PROMPTS.RAW_EXTRACT_PROGRAMA;
    if (type === 'webinar') prompt = PROMPTS.RAW_EXTRACT_WEBINAR;
    const res = await ask(`Extrae la información del siguiente texto:\n---\n${text}\n---${hint}`, prompt);
    return cleanJson(res);
}

export async function analyzeFileContent(content: string, fileName: string, type?: string): Promise<string> {
    const isBase64 = content.startsWith('data:');

    if (isBase64) {
        const base64Data = content.split(',')[1];
        const mimeType = content.split(';')[0].split(':')[1];
        const client = getClient();
        const hint = type && type !== 'auto' ? `El usuario indica que es un "${type}".` : '';
        let basePrompt = PROMPTS.RAW_EXTRACT_CURSO;
        if (type === 'programa') basePrompt = PROMPTS.RAW_EXTRACT_PROGRAMA;
        if (type === 'webinar') basePrompt = PROMPTS.RAW_EXTRACT_WEBINAR;
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
    let prompt = PROMPTS.RAW_EXTRACT_CURSO;
    if (type === 'programa') prompt = PROMPTS.RAW_EXTRACT_PROGRAMA;
    if (type === 'webinar') prompt = PROMPTS.RAW_EXTRACT_WEBINAR;
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
                    const likeMatch = term.match(/(\w+)\s+LIKE\s+'%?(.+?)%?'/i);
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
                if (direction.toUpperCase() === 'DESC') {
                    return valB - valA;
                }
                return valA - valB;
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

    // PRE-STEP: Grounding Query Generation
    let filteredCatalog = fullCatalog;
    try {
        const sqlQuery = await ask(
            `MENSAJE DEL USUARIO: ${userMsg}`,
            PROMPTS.SQL_CATALOG_QUERY
        );
        console.log('AI generated grounding query:', sqlQuery);

        if (fullCatalog) {
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
            console.log(`Grounding results: ${results.length} items matched.`);
        }
    } catch (e) {
        console.warn('Grounding query step failed, using full catalog as fallback.', e);
    }

    // === Build the verified catalog block ===
    const catalogBlock = (() => {
        if (!filteredCatalog) return 'No hay catálogo disponible.';

        const sections: string[] = [];

        if (filteredCatalog.courses?.length) {
            sections.push('=== CURSOS DISPONIBLES ===');
            filteredCatalog.courses.forEach((c: any) => {
                sections.push(
                    `• [${c.code || ''}] ${c.title} | ${c.modality || 'online'} | ${c.duration || ''} | ${c.currency || 'USD'} ${c.price || 0} | Instructor: ${c.instructor || 'N/A'}` +
                    (c.description ? `\n  Descripción: ${c.description.slice(0, 120)}...` : '')
                );
            });
        }

        if (filteredCatalog.programs?.length) {
            sections.push('\n=== PROGRAMAS / DIPLOMADOS ===');
            filteredCatalog.programs.forEach((p: any) => {
                sections.push(
                    `• [${p.code || ''}] ${p.title} | ${p.totalDuration || ''} | ${p.currency || 'USD'} ${p.price || 0}`
                );
            });
        }

        if (filteredCatalog.webinars?.length) {
            sections.push('\n=== WEBINARS / MASTERCLASSES ===');
            filteredCatalog.webinars.forEach((w: any) => {
                sections.push(
                    `• ${w.title} | ${w.speaker || ''} | ${w.date || 'Próximamente'} | ${w.price === 0 ? 'GRATIS' : `${w.currency} ${w.price}`}`
                );
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
Modalidad: ${courseContext.modality || 'online'}
Duración: ${courseContext.duration || 'N/A'}
Instructor: ${courseContext.instructor || 'N/A'}
Descripción: ${courseContext.description || ''}
Objetivos: ${(courseContext.objectives || []).join(', ')}
Beneficios: ${(courseContext.benefits || []).join(', ')}
Bonos: ${(courseContext.bonuses || []).join(', ')}
Garantía: ${courseContext.guarantee || 'N/A'}
    ` : '';

    // === Org info ===
    const orgInfo = orgProfile ? `
INFORMACIÓN DE LA INSTITUCIÓN:
Nombre: ${orgProfile.name}
Ubicación: ${orgProfile.location || 'No especificado'}
Correo de contacto: ${orgProfile.contactEmail || 'No especificado'}
Sedes: ${orgProfile.locations ? orgProfile.locations.map((l: any) => `${l.name} (${l.address})`).join(' | ') : 'No hay sedes registradas'}
Horarios: ${orgProfile.operatingHours ? orgProfile.operatingHours.map((h: any) => `${h.days}: ${h.hours}`).join(' | ') : 'No especificado'}
    ` : '';

    const systemPrompt = `Eres un agente de ventas educativas de élite. Tu identidad:
NOMBRE: ${agent.name}
ROL: ${agent.role}
PERSONALIDAD: ${agent.personality || 'profesional'}
TONO: ${agent.tone || 'Cálido y persuasivo'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 REGLAS ABSOLUTAS — NUNCA ROMPER ESTAS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. JAMÁS inventes ni menciones un curso, programa o webinar que NO aparezca en el catálogo real proporcionado abajo.
2. SI EL CATÁLOGO DICE "Catálogo vacío (Ningún curso coincide con la búsqueda)", DEBES informar al usuario que no tienes cursos que coincidan con esos criterios específicos y ofrecerle ver el catálogo general o preguntar por otro tema.
3. Siempre basa tus respuestas en la información de:
   - "INFORMACIÓN DE LA INSTITUCIÓN"
   - "CATÁLOGO DE PRODUCTOS DISPONIBLES"
   - "CURSO PRINCIPAL QUE ESTÁS VENDIENDO HOY" (si aplica)
4. Si alguien pide hablar con un humano o agendar llamada → di exactamente: "Te paso con el equipo de ventas para coordinar los detalles finales."
5. Si el usuario quiere comprar/inscribirse → di exactamente: "¡Excelente decisión! La inscripción ha sido completada con éxito. ¡Bienvenido al curso!"

CATÁLOGO DE PRODUCTOS DISPONIBLES (FILTRADO):
${catalogBlock}

${orgInfo}
${courseInfo}

HISTORIAL DE CONVERSACIÓN:
${history.map(h => `${h.role === 'user' ? 'USUARIO' : 'AGENTE'}: ${h.content}`).join('\n')}

INSTRUCCIÓN FINAL: Responde al usuario de forma natural, pero siempre apegado a la verdad del catálogo. Si no encuentras algo, ofrece la alternativa más cercana que SÍ esté en el catálogo.`;

    return ask(userMsg, systemPrompt);
}

