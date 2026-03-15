import { useState, useRef, useEffect, useCallback } from 'react';
import {
    Upload, FileText, Check, Loader, Wand2,
    Video, Send, Paperclip, X, File, Link as LinkIcon,
    GraduationCap, Award, Tv, Hammer, CreditCard, Users, ClipboardList, AlertTriangle, RefreshCw,
    ChevronDown, ChevronUp, ArrowRight, MessageSquare
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { analyzeRawText, analyzeFileContent, completeField, reviewContent } from '../lib/gemini';
import { courseService } from '../lib/services/course.service';
import { filterQuestionsService } from '../lib/services/filterQuestions.service';
import { useToast } from '../context/ToastContext';
import type { Attachment, ContactInfo } from '../lib/types';
import ProductFilterQuestions from '../components/ProductFilterQuestions';

// ─── Field labels for data-collection chips ───────────────────────────
const FIELD_LABELS: Record<string, string> = {
    title: 'Título', subtitle: 'Subtítulo', description: 'Descripción',
    targetAudience: 'Audiencia', instructor: 'Instructor', instructorBio: 'Bio del instructor',
    speaker: 'Speaker', speakerBio: 'Bio del speaker', coordinator: 'Coordinador',
    advisor: 'Asesor', price: 'Precio', currency: 'Moneda', earlyBirdPrice: 'Precio early bird',
    earlyBirdDeadline: 'Fecha early bird', modality: 'Modalidad', duration: 'Duración',
    hours: 'Horas totales', startDate: 'Fecha inicio', endDate: 'Fecha fin',
    schedule: 'Horario', eventDate: 'Fecha del evento', eventTime: 'Hora del evento',
    registrationLink: 'Link de registro', certification: 'Certificación',
    prerequisites: 'Requisitos previos', maxStudents: 'Cupos máximos',
    objectives: 'Objetivos', syllabus: 'Temario', requirements: 'Requisitos',
    benefits: 'Beneficios', painPoints: 'Problemas que resuelve', guarantee: 'Garantía',
    socialProof: 'Testimonios', bonuses: 'Bonos', urgencyTriggers: 'Urgencia',
    objectionHandlers: 'Manejo de objeciones', successStories: 'Casos de éxito',
    callToAction: 'CTA', idealStudentProfile: 'Perfil ideal', competitiveAdvantage: 'Ventaja competitiva',
    faqs: 'FAQs', promotions: 'Promociones', paymentMethods: 'Métodos de pago',
    category: 'Categoría', tags: 'Etiquetas', tools: 'Herramientas',
    platform: 'Plataforma', frequency: 'Frecuencia', period: 'Período',
};

// ─── Types ───────────────────────────────────────────────────────────
interface CourseData {
    type: 'curso' | 'programa' | 'webinar' | 'taller' | 'subscripcion' | 'asesoria' | 'postulacion';
    title: string;
    description: string;
    objectives: string[];
    targetAudience: string;
    modality: 'online' | 'presencial' | 'hibrido' | 'remoto';
    duration: string;
    hours: number | null;
    startDate: string | null;
    schedule: string | null;
    syllabus: any[];
    instructor: string;
    instructorBio: string;
    price: number | null;
    currency: string;
    maxStudents: number | null;
    category: string;
    prerequisites: string | null;
    certification: string | null;
    promotions: string | null;
    requirements: string[];
    contactInfo: ContactInfo | null;
    missing: string[];
    youtubeUrl?: string;
    benefits?: string[];
    urgencyTriggers?: string[];
    painPoints?: string[];
    guarantee?: string;
    socialProof?: string[];
    faqs?: { question: string; answer: string }[];
    tools?: string[];
    bonuses?: string[];
    callToAction?: string;
    idealStudentProfile?: string;
    competitiveAdvantage?: string;
    objectionHandlers?: { objection: string; response: string }[];
    successStories?: { name: string; quote: string; result?: string }[];
    attachments: Attachment[];
    registrationLink?: string;
    venue?: string;
    venueAddress?: string;
    maxParticipants?: number;
    materials?: string[];
    deliverables?: string[];
    earlyBirdPrice?: number;
    advisor?: string;
    advisorBio?: string;
    advisorTitle?: string;
    specialties?: string[];
    pricePerHour?: number;
    minimumHours?: number;
    packageHours?: number;
    packagePrice?: number;
    bookingLink?: string;
    availableSchedule?: string;
    sessionDuration?: string;
    topicsCovered?: string[];
    methods?: string[];
    modalities?: string[];
    dates?: { event: string; date: string }[];
    steps?: string[];
    documentsNeeded?: string[];
    selectionCriteria?: string[];
    deadline?: string;
    examRequired?: boolean;
    availableSlots?: number;
    frequency?: 'mensual' | 'anual' | 'trimestral';
    period?: string;
    features?: string[];
    advisoryHours?: number;
    whatsappGroup?: string;
    communityAccess?: string;
    maxUsers?: number;
    // Tracking flags for guided flow
    _filterQuestionsAsked?: boolean;
    _extractionFieldsAsked?: boolean;
}

const INITIAL_STATE: CourseData = {
    type: 'curso', title: '', description: '', objectives: [], targetAudience: '',
    modality: 'online', duration: '', hours: null, startDate: null, schedule: null,
    syllabus: [], instructor: '', instructorBio: '', price: null, currency: 'USD',
    maxStudents: null, category: 'Negocios', prerequisites: null, certification: null,
    promotions: null, requirements: [], contactInfo: null, missing: [],
    painPoints: [], guarantee: '', socialProof: [], faqs: [], bonuses: [],
    callToAction: '', idealStudentProfile: '', competitiveAdvantage: '',
    urgencyTriggers: [], objectionHandlers: [], successStories: [],
    attachments: [], registrationLink: '', methods: [], modalities: [], dates: [],
    frequency: 'mensual', venue: '', venueAddress: '', materials: [], deliverables: [],
    advisor: '', advisorBio: '', advisorTitle: '', specialties: [], bookingLink: '',
    availableSchedule: '', sessionDuration: '', topicsCovered: [],
    steps: [], documentsNeeded: [], selectionCriteria: [], deadline: '', examRequired: false,
    period: '', features: [], whatsappGroup: '', communityAccess: '',
};

type AnalysisStatus = 'idle' | 'analyzing' | 'success' | 'error';
type Tab = 'type-select' | 'upload' | 'guided' | 'editor';

const ANALYSIS_STEPS = [
    'Leyendo el contenido...',
    'Extrayendo información con IA...',
    'Analizando estructura comercial...',
    'Preparando asistente guiado...',
];

const TYPE_OPTIONS = [
    { value: 'curso', label: 'Curso', icon: GraduationCap, color: 'blue', desc: 'Formacion estructurada con temario, modulos y certificacion' },
    { value: 'programa', label: 'Programa', icon: Award, color: 'purple', desc: 'Diplomado o especializacion de largo plazo con multiples cursos' },
    { value: 'webinar', label: 'Webinar', icon: Tv, color: 'green', desc: 'Evento en vivo, corto, de alto impacto (masterclass, charla)' },
    { value: 'taller', label: 'Taller', icon: Hammer, color: 'amber', desc: 'Sesion practica presencial o virtual con materiales incluidos' },
    { value: 'subscripcion', label: 'Suscripcion', icon: CreditCard, color: 'pink', desc: 'Membresia recurrente con acceso continuo y beneficios' },
    { value: 'asesoria', label: 'Asesoria', icon: Users, color: 'teal', desc: 'Consultoria personalizada por hora o paquete con experto' },
    { value: 'postulacion', label: 'Postulacion', icon: ClipboardList, color: 'indigo', desc: 'Proceso de admision, beca o convocatoria con pasos claros' },
] as const;

const TYPE_LABELS: Record<string, string> = {
    curso: 'Curso', programa: 'Programa', webinar: 'Webinar', taller: 'Taller',
    subscripcion: 'Suscripcion', asesoria: 'Asesoria', postulacion: 'Postulacion',
};

// ─── Required fields per type (for completeness + guided questions) ──
type FieldCheck = { ok: boolean; label: string; priority: 'high' | 'medium' | 'low' };

function getRequiredFields(d: CourseData): FieldCheck[] {
    // Common required fields (all types)
    const common: FieldCheck[] = [
        { ok: !!d.title, label: 'Titulo', priority: 'high' },
        { ok: !!d.description && d.description.length > 20, label: 'Descripcion comercial', priority: 'high' },
        { ok: d.objectives.length > 0, label: 'Objetivos', priority: 'high' },
        { ok: !!d.targetAudience, label: 'Publico objetivo', priority: 'high' },
        { ok: !!d.callToAction, label: 'Call to Action', priority: 'medium' },
        { ok: !!d.idealStudentProfile, label: 'Perfil estudiante ideal', priority: 'medium' },
        { ok: !!d.competitiveAdvantage, label: 'Ventaja competitiva', priority: 'medium' },
        { ok: (d.objectionHandlers?.length || 0) > 0, label: 'Manejo de objeciones', priority: 'medium' },
        { ok: (d.successStories?.length || 0) > 0, label: 'Casos de exito', priority: 'low' },
        { ok: (d.benefits?.length || 0) > 0, label: 'Beneficios / Transformacion', priority: 'medium' },
    ];

    // Type-specific required fields
    const specific: Record<string, FieldCheck[]> = {
        curso: [
            { ok: !!d.instructor, label: 'Instructor', priority: 'high' },
            { ok: d.price !== null && d.price > 0, label: 'Precio', priority: 'high' },
            { ok: d.syllabus.length > 0, label: 'Temario / Modulos', priority: 'high' },
            { ok: !!d.duration, label: 'Duracion', priority: 'medium' },
            { ok: !!d.registrationLink, label: 'Link de registro', priority: 'low' },
        ],
        programa: [
            { ok: !!d.instructor, label: 'Coordinador / Instructor', priority: 'high' },
            { ok: d.price !== null && d.price > 0, label: 'Precio', priority: 'high' },
            { ok: d.syllabus.length > 0, label: 'Malla curricular', priority: 'high' },
            { ok: !!d.duration, label: 'Duracion total', priority: 'medium' },
            { ok: !!d.certification, label: 'Certificacion', priority: 'medium' },
            { ok: !!d.registrationLink, label: 'Link de registro', priority: 'low' },
        ],
        webinar: [
            { ok: !!d.instructor, label: 'Speaker', priority: 'high' },
            { ok: d.price !== null && d.price >= 0, label: 'Precio (0 si es gratis)', priority: 'high' },
            { ok: !!d.startDate, label: 'Fecha del evento', priority: 'high' },
            { ok: !!d.duration, label: 'Duracion', priority: 'medium' },
            { ok: !!d.registrationLink, label: 'Link de registro (Zoom, etc)', priority: 'high' },
        ],
        taller: [
            { ok: !!d.instructor, label: 'Instructor', priority: 'high' },
            { ok: d.price !== null && d.price > 0, label: 'Precio', priority: 'high' },
            { ok: !!d.venue, label: 'Sede / Venue', priority: 'high' },
            { ok: !!d.venueAddress, label: 'Direccion de la sede', priority: 'medium' },
            { ok: !!d.maxParticipants, label: 'Capacidad maxima', priority: 'high' },
            { ok: (d.materials?.length || 0) > 0, label: 'Materiales incluidos', priority: 'medium' },
            { ok: (d.deliverables?.length || 0) > 0, label: 'Entregables', priority: 'medium' },
            { ok: !!d.startDate, label: 'Fecha del taller', priority: 'high' },
            { ok: !!d.duration, label: 'Duracion', priority: 'medium' },
        ],
        asesoria: [
            { ok: !!d.advisor, label: 'Nombre del asesor', priority: 'high' },
            { ok: !!d.advisorTitle, label: 'Titulo profesional del asesor', priority: 'medium' },
            { ok: !!d.pricePerHour, label: 'Precio por hora', priority: 'high' },
            { ok: (d.specialties?.length || 0) > 0, label: 'Especialidades', priority: 'high' },
            { ok: !!d.bookingLink, label: 'Link de reserva', priority: 'high' },
            { ok: !!d.sessionDuration, label: 'Duracion de sesion', priority: 'medium' },
            { ok: !!d.availableSchedule, label: 'Horario disponible', priority: 'medium' },
            { ok: (d.topicsCovered?.length || 0) > 0, label: 'Temas cubiertos', priority: 'medium' },
        ],
        postulacion: [
            { ok: (d.steps?.length || 0) > 0, label: 'Pasos del proceso', priority: 'high' },
            { ok: (d.documentsNeeded?.length || 0) > 0, label: 'Documentos requeridos', priority: 'high' },
            { ok: (d.selectionCriteria?.length || 0) > 0, label: 'Criterios de seleccion', priority: 'medium' },
            { ok: !!d.deadline, label: 'Fecha limite', priority: 'high' },
            { ok: !!d.availableSlots, label: 'Cupos disponibles', priority: 'medium' },
            { ok: !!d.registrationLink, label: 'Link de registro / postulacion', priority: 'high' },
        ],
        subscripcion: [
            { ok: d.price !== null && d.price > 0, label: 'Precio por periodo', priority: 'high' },
            { ok: !!d.frequency, label: 'Frecuencia de pago', priority: 'high' },
            { ok: (d.features?.length || 0) > 0, label: 'Beneficios incluidos', priority: 'high' },
            { ok: !!d.advisoryHours, label: 'Horas de asesoria incluidas', priority: 'low' },
            { ok: !!d.registrationLink, label: 'Link de registro', priority: 'medium' },
        ],
    };

    return [...common, ...(specific[d.type] || [])];
}

function calcCompleteness(d: CourseData): { percent: number; missing: string[]; missingHigh: string[] } {
    const fields = getRequiredFields(d);
    const filled = fields.filter(f => f.ok).length;
    const missing = fields.filter(f => !f.ok).map(f => f.label);
    const missingHigh = fields.filter(f => !f.ok && f.priority === 'high').map(f => f.label);
    return { percent: Math.round((filled / fields.length) * 100), missing, missingHigh };
}

// ─── Guided questions (all types, exhaustive, with formatting) ──────
function getNextQuestion(d: CourseData): string | null {
    const t = TYPE_LABELS[d.type] || 'producto';

    // ── 1. Core info (all types) ──
    if (!d.title) return `📝 **Titulo del ${t}** — ¿Como se llama tu ${t}? Dale un nombre que enganche al prospecto.`;
    if (!d.description || d.description.length < 30) return `📋 **Descripcion comercial** — Necesito una descripcion atractiva de **"${d.title}"**. ¿Que problema resuelve? ¿Que transformacion ofrece?`;
    if (d.objectives.length === 0) return `🎯 **Objetivos** — ¿Cuales son los objetivos principales de **"${d.title}"**? Lista los 3-5 mas importantes.`;
    if (!d.targetAudience) return '👥 **Publico objetivo** — ¿A quien va dirigido? Describe a tu alumno/cliente ideal (edad, profesion, situacion actual).';

    // ── 2. Type-specific REQUIRED fields ──
    if (d.type === 'curso') {
        if (!d.instructor) return '👨‍🏫 **Instructor** — ¿Quien imparte el curso? Dame nombre y un breve perfil profesional.';
        if (d.price === null || d.price === 0) return '💰 **Precio** — ¿Cual es el precio del curso? Si no lo tienes definido, indica "pendiente".';
        if (d.syllabus.length === 0) return '📚 **Temario** — ¿Cuales son los modulos o temas principales? Lista cada uno con sus subtemas.';
        if (!d.duration) return '⏱ **Duracion** — ¿Cuanto dura el curso? (ej: 4 semanas, 3 meses, 20 horas)';
    }
    if (d.type === 'programa') {
        if (!d.instructor) return '👨‍🏫 **Coordinador** — ¿Quien coordina o imparte el programa? Dame nombre y perfil.';
        if (d.price === null || d.price === 0) return '💰 **Inversion** — ¿Cual es la inversion total del programa?';
        if (d.syllabus.length === 0) return '📚 **Malla curricular** — ¿Cuales son los cursos o modulos que incluye? Lista cada uno.';
        if (!d.duration) return '⏱ **Duracion** — ¿Cuanto dura el programa completo?';
        if (!d.certification) return '🏆 **Certificacion** — ¿El programa otorga certificacion? ¿Cual y por quien?';
    }
    if (d.type === 'webinar') {
        if (!d.instructor) return '🎤 **Speaker** — ¿Quien es el speaker del webinar? Dame nombre y titulo.';
        if (d.price === null) return '💰 **Precio** — ¿El webinar es gratuito o tiene costo? Indica el precio (0 si es gratis).';
        if (!d.startDate) return '📅 **Fecha del evento** — ¿Cuando se realizara el webinar? Dame la fecha y hora.';
        if (!d.registrationLink) return '🔗 **Link de registro** — ⚠️ Es MUY IMPORTANTE: ¿Cual es el link de registro? (Zoom, Eventbrite, formulario). Sin este link no podran inscribirse.';
        if (!d.duration) return '⏱ **Duracion** — ¿Cuanto durara el webinar?';
    }
    if (d.type === 'taller') {
        if (!d.instructor) return '👨‍🏫 **Instructor** — ¿Quien impartira el taller? Dame nombre y perfil.';
        if (d.price === null || d.price === 0) return '💰 **Precio** — ¿Cual es el precio del taller?';
        if (!d.venue) return '📍 **Sede** — ¿Donde se realizara el taller? Indica el nombre de la sede.';
        if (!d.venueAddress) return '🗺 **Direccion** — ¿Cual es la direccion exacta de la sede?';
        if (!d.maxParticipants) return '👥 **Capacidad** — ¿Cual es la capacidad maxima de participantes?';
        if (!d.startDate) return '📅 **Fecha** — ¿Cuando se realizara el taller? Dame la fecha.';
        if ((d.materials?.length || 0) === 0) return '🧰 **Materiales** — ¿Que materiales o herramientas se entregaran a los participantes?';
        if ((d.deliverables?.length || 0) === 0) return '📦 **Entregables** — ¿Que se llevaran los participantes al finalizar? (entregables, certificado, proyecto)';
        if (!d.duration) return '⏱ **Duracion** — ¿Cuanto durara el taller?';
    }
    if (d.type === 'asesoria') {
        if (!d.advisor) return '🧑‍💼 **Asesor** — ¿Quien es el asesor/consultor? Dame nombre completo.';
        if (!d.advisorTitle) return `🎓 **Titulo profesional** — ¿Cual es el titulo profesional de ${d.advisor || 'el asesor'}?`;
        if (!d.pricePerHour) return '💰 **Precio por hora** — ¿Cual es el precio por hora de la asesoria?';
        if ((d.specialties?.length || 0) === 0) return '⭐ **Especialidades** — ¿Cuales son las especialidades del asesor? Lista las 3-5 principales.';
        if (!d.bookingLink) return '🔗 **Link de agenda** — ⚠️ Es MUY IMPORTANTE: ¿Tienes un link para agendar sesiones? (Calendly, Google Calendar, etc.). Sin esto los clientes no pueden reservar.';
        if (!d.sessionDuration) return '⏱ **Duracion de sesion** — ¿Cuanto dura cada sesion? (ej: 60 minutos)';
        if (!d.availableSchedule) return '🕐 **Horario** — ¿Cual es el horario disponible para agendar? (ej: Lunes a Viernes 9am-6pm)';
        if ((d.topicsCovered?.length || 0) === 0) return '📋 **Temas** — ¿Que temas cubre la asesoria? Lista los principales.';
    }
    if (d.type === 'postulacion') {
        if ((d.steps?.length || 0) === 0) return '📋 **Pasos del proceso** — ¿Cuales son los pasos que debe seguir alguien para postular? Lista cada paso en orden.';
        if ((d.documentsNeeded?.length || 0) === 0) return '📄 **Documentos** — ¿Que documentos necesita presentar el postulante?';
        if (!d.deadline) return '⏰ **Fecha limite** — ¿Cual es la fecha limite para postular?';
        if (!d.availableSlots) return '🎟 **Cupos** — ¿Cuantos cupos hay disponibles?';
        if ((d.selectionCriteria?.length || 0) === 0) return '✅ **Criterios** — ¿Cuales son los criterios de seleccion?';
        if (!d.registrationLink) return '🔗 **Link de postulacion** — ⚠️ Es MUY IMPORTANTE: ¿Cual es el link o formulario de postulacion? Sin esto los interesados no pueden postular.';
    }
    if (d.type === 'subscripcion') {
        if (d.price === null || d.price === 0) return '💰 **Precio** — ¿Cual es el precio de la suscripcion?';
        if ((d.features?.length || 0) === 0) return '⭐ **Beneficios incluidos** — ¿Que beneficios incluye la suscripcion? Lista todo lo que obtiene el suscriptor.';
        if (!d.registrationLink) return '🔗 **Link de registro** — ¿Tienes un link de registro para la suscripcion?';
    }

    // ── 3. Commercial intelligence (all types) ──
    if (!d.competitiveAdvantage) return `🏅 **Ventaja competitiva** — ¿Que hace UNICO a **"${d.title}"**? ¿Por que un prospecto deberia elegirte a ti y no a la competencia?`;
    if (!d.callToAction) return '🚀 **Call to Action** — ¿Cual es tu llamada a la accion? ¿Que frase motivaria al prospecto a inscribirse YA?';
    if (!d.idealStudentProfile) return '🎯 **Perfil del cliente ideal** — Describe en detalle a tu cliente ideal. ¿Que situacion vive hoy y que resultado busca?';
    if ((d.benefits?.length || 0) === 0) return '✨ **Beneficios** — ¿Cuales son los principales beneficios o transformaciones que obtendra el alumno?';
    if ((d.objectionHandlers?.length || 0) === 0) return '🛡 **Manejo de objeciones** — Piensa en las 2-3 objeciones mas comunes (ej: "es caro", "no tengo tiempo"). ¿Cuales son y como las respondes?';
    if ((d.urgencyTriggers?.length || 0) === 0) return '⚡ **Urgencia** — ¿Tienes algun gatillo de urgencia? (ej: cupos limitados, precio sube pronto, fecha limite). Si no tienes, escribe "no tengo aun".';
    if ((d.successStories?.length || 0) === 0) return '🌟 **Casos de exito** — ¿Tienes algun testimonio? Dame nombre, resultado obtenido y una cita. Si no tienes, escribe "no tengo aun".';

    // ── 4. Filter questions (preguntas filtro para calificar prospectos) ──
    if (!(d as any)._filterQuestionsAsked) return `📋 **Preguntas Filtro** — Estas son las preguntas que tu **agente de ventas** le hara a los prospectos para **calificarlos**. Por ejemplo:\n• "¿Cual es tu nivel de experiencia?"\n• "¿Tienes presupuesto aprobado?"\n• "¿Para cuando necesitas empezar?"\n\n¿Que preguntas de calificacion quieres hacerle a los interesados en **"${d.title}"**? Si no tienes, escribe "omitir".`;

    // ── 5. Extraction fields (campos especiales) ──
    if (!(d as any)._extractionFieldsAsked) return `📊 **Campos especiales de captura** — Ademas de nombre, email y telefono, ¿que otros datos quieres capturar de los prospectos? Por ejemplo:\n• Empresa\n• Cargo\n• Ciudad\n• Presupuesto\n\nEscribe los campos que necesites o "omitir" si no aplica.`;

    return null; // All done!
}

// ─── Component ────────────────────────────────────────────────────────
export default function CourseUpload() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const { id } = useParams();
    const [status, setStatus] = useState<AnalysisStatus>('idle');
    const [data, setData] = useState<CourseData>(INITIAL_STATE);
    const [text, setText] = useState('');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [activeTab, setActiveTab] = useState<Tab>('type-select');
    const [errorMessage, setErrorMessage] = useState('');

    // Chat state (shared between guided + sidebar)
    const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [applyingChange, setApplyingChange] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(true);
    const [interactionCount, setInteractionCount] = useState(0);
    const [guidedFilterQuestions, setGuidedFilterQuestions] = useState<string>('');

    const [analysisStep, setAnalysisStep] = useState(0);

    // Progress through analysis steps while analyzing
    useEffect(() => {
        if (status !== 'analyzing') { setAnalysisStep(0); return; }
        const timings = [0, 4000, 10000, 18000];
        const timers = timings.map((t, i) => setTimeout(() => setAnalysisStep(i), t));
        return () => timers.forEach(clearTimeout);
    }, [status]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Editor section collapse state
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({
        basic: true, instructor: true, typeSpecific: true,
        content: false, marketing: false, sales: false, social: false,
    });
    const toggleSection = (s: string) => setOpenSections(prev => ({ ...prev, [s]: !prev[s] }));

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    // Load data if editing
    useEffect(() => {
        const fetchItem = async () => {
            if (!id) {
                setData(INITIAL_STATE);
                setStatus('idle');
                setChatMessages([]);
                setActiveTab('type-select');
                setErrorMessage('');
                return;
            }
            try {
                setStatus('analyzing');
                const found = await courseService.getById(id);
                if (found) {
                    let type: CourseData['type'] = 'curso';
                    if (found.type) type = found.type;
                    else if ('totalDuration' in found || 'courses' in found) type = 'programa';
                    else if ('speaker' in found || 'date' in found) type = 'webinar';

                    setData({
                        type,
                        title: found.title || '', description: found.description || '',
                        objectives: found.objectives || [], targetAudience: found.targetAudience || '',
                        modality: found.modality || 'online',
                        duration: found.duration || found.totalDuration || '',
                        hours: found.hours || found.totalHours || null,
                        startDate: found.startDate || found.date || null,
                        schedule: found.schedule || found.time || null,
                        syllabus: found.syllabus || found.courses || [],
                        instructor: found.instructor || found.speaker || '',
                        instructorBio: found.instructorBio || found.speakerBio || '',
                        price: found.price || null, currency: found.currency || 'USD',
                        maxStudents: found.maxStudents || null,
                        category: found.category || 'General',
                        prerequisites: found.prerequisites || null,
                        certification: found.certification || null,
                        promotions: found.promotions || null,
                        requirements: found.requirements || [], contactInfo: found.contactInfo || null,
                        missing: [],
                        benefits: found.benefits || [], painPoints: found.painPoints || [],
                        guarantee: found.guarantee || '', socialProof: found.socialProof || [],
                        faqs: found.faqs || [], bonuses: found.bonuses || [],
                        callToAction: found.callToAction || '',
                        idealStudentProfile: found.idealStudentProfile || '',
                        competitiveAdvantage: found.competitiveAdvantage || '',
                        urgencyTriggers: found.urgencyTriggers || [],
                        objectionHandlers: found.objectionHandlers || [],
                        successStories: found.successStories || [],
                        registrationLink: found.registrationLink || '',
                        attachments: found.attachments || [],
                        venue: found.venue || '', venueAddress: found.venueAddress || '',
                        maxParticipants: found.maxParticipants || undefined,
                        materials: found.materials || [], deliverables: found.deliverables || [],
                        earlyBirdPrice: found.earlyBirdPrice || undefined,
                        advisor: found.advisor || '', advisorBio: found.advisorBio || '',
                        advisorTitle: found.advisorTitle || '', specialties: found.specialties || [],
                        pricePerHour: found.pricePerHour || undefined,
                        minimumHours: found.minimumHours || undefined,
                        packageHours: found.packageHours || undefined,
                        packagePrice: found.packagePrice || undefined,
                        bookingLink: found.bookingLink || '',
                        availableSchedule: found.availableSchedule || '',
                        sessionDuration: found.sessionDuration || '',
                        topicsCovered: found.topicsCovered || [],
                        steps: found.steps || [], documentsNeeded: found.documentsNeeded || [],
                        selectionCriteria: found.selectionCriteria || [],
                        deadline: found.deadline || '', examRequired: found.examRequired || false,
                        availableSlots: found.availableSlots || undefined,
                        period: found.period || '', features: found.features || [],
                        advisoryHours: found.advisoryHours || undefined,
                        whatsappGroup: found.whatsappGroup || '',
                        communityAccess: found.communityAccess || '',
                        maxUsers: found.maxUsers || undefined,
                    });
                    setActiveTab('editor');
                    setStatus('success');
                }
            } catch (err) {
                console.error("Error fetching course detail:", err);
                setStatus('error');
            }
        };
        fetchItem();
    }, [id]);

    // ─── Analyze handler ──────────────────────────────────────────────
    const handleAnalyze = async () => {
        if (!text && !youtubeUrl && !selectedFile) return;
        setStatus('analyzing');
        setErrorMessage('');
        try {
            let parsed: any = null;
            if (selectedFile) {
                const file = selectedFile;
                const content = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target?.result as string);
                    reader.readAsDataURL(file);
                });
                parsed = await analyzeFileContent(content, file.name, data.type);
            } else if (youtubeUrl) {
                parsed = await analyzeRawText(`Analiza este recurso: ${youtubeUrl}\n\nContexto adicional: ${text}`, data.type);
            } else {
                parsed = await analyzeRawText(text, data.type);
            }
            // analyzeFileContent/analyzeRawText already return parsed objects (via cleanJson)
            if (typeof parsed === 'string') parsed = JSON.parse(parsed);

            let attachmentToAdd: any = null;
            if (selectedFile) {
                attachmentToAdd = {
                    id: Date.now().toString(), name: selectedFile.name, url: '#',
                    type: selectedFile.type.includes('pdf') ? 'pdf' : selectedFile.type.includes('image') ? 'image' : 'video',
                    size: (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB'
                };
            } else if (youtubeUrl) {
                attachmentToAdd = { id: Date.now().toString(), name: 'YouTube Resource', url: youtubeUrl, type: 'link' };
            }

            // Normalize Gemini response to unified CourseData fields
            // (model-specific names → unified UI names)
            if (parsed.speaker && !parsed.instructor) {
                parsed.instructor = parsed.speaker;
                parsed.instructorBio = parsed.speakerBio || parsed.instructorBio || '';
            }
            if (parsed.coordinator && !parsed.instructor) {
                parsed.instructor = parsed.coordinator;
            }
            if (parsed.advisor && !parsed.instructor) {
                parsed.instructor = parsed.advisor;
                parsed.instructorBio = parsed.advisorBio || parsed.instructorBio || '';
            }
            if (parsed.totalDuration && !parsed.duration) {
                parsed.duration = parsed.totalDuration;
            }
            if (parsed.totalHours && !parsed.hours) {
                parsed.hours = typeof parsed.totalHours === 'number' ? parsed.totalHours : parseInt(parsed.totalHours) || null;
            }
            if (parsed.eventDate && !parsed.startDate) {
                parsed.startDate = parsed.eventDate;
            }
            if (parsed.eventTime && !parsed.schedule) {
                parsed.schedule = parsed.eventTime;
            }
            if (parsed.topics && !parsed.objectives && data.type === 'webinar') {
                parsed.objectives = parsed.topics;
            }
            if (parsed.courses && !parsed.syllabus && data.type === 'programa') {
                parsed.syllabus = parsed.courses;
            }
            if (parsed.period && !parsed.frequency) {
                parsed.frequency = parsed.period;
            }

            // Normalize modality from Gemini to valid Prisma enum values
            if (parsed.modality) {
                const m = String(parsed.modality).toLowerCase();
                const modalityMap: Record<string, string> = {
                    virtual: 'online', remoto: 'online', remote: 'online', online: 'online',
                    presencial: 'presencial', 'in-person': 'presencial',
                    hibrido: 'hibrido', híbrido: 'hibrido', hybrid: 'hibrido',
                };
                parsed.modality = modalityMap[m] ?? 'online';
            }

            const mergedData = { ...data, ...parsed };

            setData(prev => {
                const atts = prev.attachments || [];
                return {
                    ...prev, ...parsed,
                    objectives: parsed.objectives || prev.objectives || [],
                    syllabus: parsed.syllabus || prev.syllabus || [],
                    requirements: parsed.requirements || prev.requirements || [],
                    attachments: attachmentToAdd ? [...atts, attachmentToAdd] : atts,
                };
            });

            setStatus('success');
            setActiveTab('guided');

            // Build initial guided messages with rich summary
            const msgs: { role: string; content: string }[] = [];
            const summaryLines: string[] = [];
            summaryLines.push(`📊 **Resumen del analisis de tu ${TYPE_LABELS[mergedData.type]}:**\n`);
            if (mergedData.title) summaryLines.push(`📝 **Titulo:** "${mergedData.title}"`);
            if (mergedData.price) summaryLines.push(`💰 **Precio:** $${mergedData.price} ${mergedData.currency || 'USD'}`);
            if (mergedData.instructor) summaryLines.push(`👨‍🏫 **Instructor:** ${mergedData.instructor}`);
            if (mergedData.objectives?.length) summaryLines.push(`🎯 **Objetivos:** ${mergedData.objectives.length} detectados`);
            if (mergedData.syllabus?.length) summaryLines.push(`📚 **Modulos:** ${mergedData.syllabus.length} en el temario`);
            if (mergedData.modality) summaryLines.push(`🌐 **Modalidad:** ${mergedData.modality}`);
            if (mergedData.duration) summaryLines.push(`⏱ **Duracion:** ${mergedData.duration}`);
            if (mergedData.targetAudience) summaryLines.push(`👥 **Audiencia:** ${mergedData.targetAudience.slice(0, 80)}...`);
            summaryLines.push(`\n¿Esta todo correcto? Si hay algo que corregir, indicamelo. Si esta bien, escribe **"confirmar"** o **"continuar"** para seguir.`);
            msgs.push({ role: 'assistant', content: summaryLines.join('\n') });

            // Try proactive review
            try {
                const reviewJson = await reviewContent(parsed);
                const review = JSON.parse(reviewJson);
                if (review.score !== undefined) {
                    msgs.push({ role: 'assistant', content: `📋 **Auditoria comercial:** ${review.score}/10\n${review.suggestions?.slice(0, 3).map((s: string) => `• ${s}`).join('\n') || ''}` });
                }
            } catch { /* skip review if fails */ }

            msgs.push({ role: 'assistant', content: '💬 Voy a hacerte algunas preguntas para **completar la informacion comercial**. Responde con naturalidad.' });

            const nextQ = getNextQuestion(mergedData as CourseData);
            if (nextQ) msgs.push({ role: 'assistant', content: nextQ });
            else msgs.push({ role: 'assistant', content: '✅ Tu producto ya tiene toda la informacion comercial necesaria. Puedes ir al **editor** para revisar los detalles.' });

            setChatMessages(msgs);

        } catch (error: any) {
            console.error('Analysis error:', error);
            const msg = error?.message || String(error);
            if (msg.includes('API_KEY_INVALID') || msg.includes('invalid')) {
                setErrorMessage('API Key de Gemini invalida. Ve a Configuracion para actualizarla.');
            } else if (msg.includes('429') || msg.includes('rate') || msg.includes('quota')) {
                setErrorMessage('Se alcanzo el limite de uso de la API. Espera unos minutos e intenta de nuevo.');
            } else if (msg.includes('network') || msg.includes('fetch')) {
                setErrorMessage('Error de conexion. Verifica tu internet e intenta de nuevo.');
            } else if (msg.includes('JSON') || msg.includes('parse')) {
                setErrorMessage('La IA no pudo estructurar la informacion. Intenta pegar el contenido como texto.');
            } else {
                setErrorMessage(msg.length > 200 ? 'Error al analizar. Intenta con otro formato o pega texto directamente.' : msg);
            }
            setStatus('error');
        }
    };

    // ─── Chat handler (guided + sidebar) ──────────────────────────────
    const handleChatAction = useCallback(async (overrideMsg?: string | React.MouseEvent) => {
        const msg = (typeof overrideMsg === 'string') ? overrideMsg : chatInput;
        if (!msg.trim()) return;
        setChatInput('');
        setChatMessages(prev => [...prev, { role: 'user', content: msg }]);
        setApplyingChange(true);

        try {
            // Include last AI question as context for better field mapping
            const lastAiMsg = chatMessages.filter(m => m.role === 'assistant').pop()?.content || '';
            const contextPrompt = lastAiMsg
                ? `Pregunta anterior del sistema: "${lastAiMsg}"\n\nRespuesta del usuario: "${msg}"`
                : msg;

            const context = JSON.stringify(data);
            const responseRaw = await completeField(context, contextPrompt);
            // completeField already returns a parsed object via cleanJson
            const response = typeof responseRaw === 'string' ? JSON.parse(responseRaw) : responseRaw;

            if (response.updates) {
                // Check if user is responding to filter questions or extraction fields
                const lastAiContent = chatMessages.filter(m => m.role === 'assistant').pop()?.content || '';
                const isFilterQuestion = lastAiContent.includes('**Preguntas Filtro**');
                const isExtractionField = lastAiContent.includes('**Campos especiales');
                const isSkip = msg.toLowerCase().includes('omitir') || msg.toLowerCase().includes('no tengo') || msg.toLowerCase().includes('siguiente');

                let newData = { ...data, ...response.updates };

                if (isFilterQuestion) {
                    newData = { ...newData, _filterQuestionsAsked: true };
                    setData(prev => ({ ...prev, ...response.updates, _filterQuestionsAsked: true }));
                    if (!isSkip) setGuidedFilterQuestions(msg);
                } else if (isExtractionField) {
                    newData = { ...newData, _extractionFieldsAsked: true };
                    setData(prev => ({ ...prev, ...response.updates, _extractionFieldsAsked: true }));
                } else {
                    setData(prev => ({ ...prev, ...response.updates }));
                }

                setInteractionCount(prev => prev + 1);
                setChatMessages(prev => [...prev, { role: 'assistant', content: `${response.message}` }]);

                // Show chips for fields that were just saved (only recognized FIELD_LABELS keys)
                const savedKeys = Object.keys(response.updates).filter(k => {
                    const v = response.updates[k];
                    return k in FIELD_LABELS && v !== null && v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0);
                });
                if (savedKeys.length > 0) {
                    const chipContent = savedKeys.map(k => FIELD_LABELS[k] || k).join('|');
                    setChatMessages(prev => [...prev, { role: 'data-chips', content: chipContent }]);
                }
                if (isFilterQuestion && !isSkip) {
                    setChatMessages(prev => [...prev, { role: 'data-chips', content: 'Preguntas filtro guardadas' }]);
                }
                if (isExtractionField && !isSkip) {
                    setChatMessages(prev => [...prev, { role: 'data-chips', content: 'Campos especiales guardados' }]);
                }

                // Auto-ask next question in guided mode
                if (activeTab === 'guided') {
                    const nextQ = getNextQuestion(newData as CourseData);
                    if (nextQ) {
                        setTimeout(() => {
                            setChatMessages(prev => [...prev, { role: 'assistant', content: nextQ }]);
                        }, 1200);
                    } else {
                        setTimeout(() => {
                            setChatMessages(prev => [...prev, { role: 'assistant', content: '✅ **Tu producto esta completo.** Toda la informacion comercial ha sido recopilada. Haz clic en **"Ir al Editor"** para revisar los detalles finales.' }]);
                        }, 1200);
                    }
                }
            } else {
                setChatMessages(prev => [...prev, { role: 'assistant', content: response.message || 'No pude entender el cambio solicitado.' }]);
            }
        } catch {
            setChatMessages(prev => [...prev, { role: 'assistant', content: 'Error al procesar. Intenta reformular tu respuesta.' }]);
        } finally {
            setApplyingChange(false);
        }
    }, [chatInput, chatMessages, data, activeTab]);

    // ─── Build payload mapped to correct model fields per type ────────
    const buildPayload = (d: CourseData) => {
        const type = d.type;
        // Common fields all models share
        const base: Record<string, any> = {
            type,
            title: d.title,
            description: d.description,
            targetAudience: d.targetAudience,
            status: 'borrador',
            category: d.category || '',
            tags: d.tools ? [] : [],
            requirements: d.requirements || [],
            benefits: d.benefits || [],
            painPoints: d.painPoints || [],
            socialProof: d.socialProof || [],
            bonuses: d.bonuses || [],
            urgencyTriggers: d.urgencyTriggers || [],
            objectionHandlers: d.objectionHandlers || [],
            successStories: d.successStories || [],
            callToAction: d.callToAction || '',
            idealStudentProfile: d.idealStudentProfile || '',
            competitiveAdvantage: d.competitiveAdvantage || '',
            guarantee: d.guarantee || '',
        };
        if (d.registrationLink) base.registrationLink = d.registrationLink;
        if (d.promotions) base.promotions = d.promotions;
        if ((d as any).location) base.location = (d as any).location;
        if (d.tools?.length) base.tools = d.tools;
        if ((d as any).tags?.length) base.tags = (d as any).tags;

        // Type-specific field mapping
        switch (type) {
            case 'curso':
                return {
                    ...base,
                    objectives: d.objectives || [],
                    modality: d.modality || 'online',
                    duration: d.duration || '',
                    totalHours: d.hours || undefined,
                    schedule: d.schedule || undefined,
                    startDate: d.startDate || undefined,
                    instructor: d.instructor || '',
                    instructorBio: d.instructorBio || '',
                    price: parseFloat(String(d.price)) || 0,
                    currency: d.currency || 'USD',
                    maxStudents: d.maxStudents || undefined,
                    prerequisites: d.prerequisites || undefined,
                    certification: d.certification || undefined,
                    earlyBirdPrice: d.earlyBirdPrice || undefined,
                    syllabus: d.syllabus || [],
                    faqs: d.faqs || [],
                };
            case 'programa':
                return {
                    ...base,
                    objectives: d.objectives || [],
                    modality: d.modality || 'online',
                    totalDuration: d.duration || '',
                    totalHours: d.hours || 0,
                    coordinator: d.instructor || '', // unified "instructor" maps to coordinator
                    schedule: d.schedule || undefined,
                    startDate: d.startDate || undefined,
                    price: parseFloat(String(d.price)) || 0,
                    currency: d.currency || 'USD',
                    maxStudents: d.maxStudents || undefined,
                    prerequisites: d.prerequisites || undefined,
                    certification: d.certification || '',
                    courses: d.syllabus || [], // unified "syllabus" maps to programCourses
                    faqs: d.faqs || [],
                };
            case 'webinar':
                return {
                    ...base,
                    modality: d.modality || 'online',
                    duration: d.duration || '',
                    speaker: d.instructor || '', // unified "instructor" maps to speaker
                    speakerBio: d.instructorBio || '',
                    speakerTitle: (d as any).speakerTitle || '',
                    eventDate: d.startDate || undefined,
                    eventTime: d.schedule || undefined,
                    topics: d.objectives || [], // unified "objectives" maps to topics
                    keyTopics: d.topicsCovered || [],
                    price: parseFloat(String(d.price)) || 0,
                    currency: d.currency || 'USD',
                    maxAttendees: d.maxStudents || undefined,
                    platform: (d as any).platform || undefined,
                    faqs: d.faqs || [],
                };
            case 'taller':
                return {
                    ...base,
                    objectives: d.objectives || [],
                    modality: d.modality || 'presencial',
                    duration: d.duration || '',
                    totalHours: d.hours || undefined,
                    schedule: d.schedule || undefined,
                    eventDate: d.startDate || undefined,
                    instructor: d.instructor || '',
                    instructorBio: d.instructorBio || '',
                    venue: d.venue || '',
                    venueAddress: d.venueAddress || '',
                    maxParticipants: d.maxParticipants || undefined,
                    materials: d.materials || [],
                    deliverables: d.deliverables || [],
                    certification: d.certification || undefined,
                    price: parseFloat(String(d.price)) || 0,
                    currency: d.currency || 'USD',
                    earlyBirdPrice: d.earlyBirdPrice || undefined,
                    faqs: d.faqs || [],
                };
            case 'asesoria':
                return {
                    ...base,
                    objectives: d.objectives || [],
                    modality: d.modality || 'online',
                    advisor: d.advisor || d.instructor || '',
                    advisorBio: d.advisorBio || d.instructorBio || '',
                    advisorTitle: d.advisorTitle || '',
                    specialties: d.specialties || [],
                    pricePerHour: parseFloat(String(d.pricePerHour)) || 0,
                    currency: d.currency || 'USD',
                    minimumHours: d.minimumHours || 1,
                    packageHours: d.packageHours || undefined,
                    packagePrice: d.packagePrice || undefined,
                    bookingLink: d.bookingLink || '',
                    availableSchedule: d.availableSchedule || '',
                    sessionDuration: d.sessionDuration || '',
                    topicsCovered: d.topicsCovered || [],
                    deliverables: d.deliverables || [],
                    faqs: d.faqs || [],
                };
            case 'subscripcion':
                return {
                    ...base,
                    objectives: d.objectives || [],
                    price: parseFloat(String(d.price)) || 0,
                    currency: d.currency || 'USD',
                    period: d.period || d.frequency || 'mensual',
                    features: d.features || [],
                    advisoryHours: d.advisoryHours || undefined,
                    whatsappGroup: d.whatsappGroup || '',
                    communityAccess: d.communityAccess || '',
                    maxUsers: d.maxUsers || undefined,
                    faqs: d.faqs || [],
                };
            case 'postulacion':
                return {
                    ...base,
                    objectives: d.objectives || [],
                    modality: d.modality || 'online',
                    duration: d.duration || undefined,
                    startDate: d.startDate || undefined,
                    deadline: d.deadline || undefined,
                    availableSlots: d.availableSlots || undefined,
                    examRequired: d.examRequired || false,
                    steps: d.steps || [],
                    documentsNeeded: d.documentsNeeded || [],
                    selectionCriteria: d.selectionCriteria || [],
                    price: parseFloat(String(d.price)) || 0,
                    currency: d.currency || 'USD',
                    faqs: d.faqs || [],
                };
            default:
                return base;
        }
    };

    // ─── Save handler ─────────────────────────────────────────────────
    const handleSave = async () => {
        if (!data.title) { toast('Por favor, ingresa un titulo', 'info'); return; }
        try {
            setStatus('analyzing');
            const payload = buildPayload(data);
            let savedId = id;
            if (id) {
                await courseService.update(id, payload);
            } else {
                const created = await courseService.create(payload);
                savedId = (created as any)?.id;
            }

            // Auto-save filter questions from guided flow
            if (savedId && guidedFilterQuestions) {
                try {
                    const questions = guidedFilterQuestions
                        .split(/[\n•\-\d+\.]+/)
                        .map(q => q.trim().replace(/^[¿"]+|[?"]+$/g, ''))
                        .filter(q => q.length > 5);
                    for (let i = 0; i < questions.length; i++) {
                        await filterQuestionsService.create({
                            courseId: savedId,
                            question: questions[i],
                            fieldKey: `guided_q${i + 1}`,
                            type: 'text',
                            options: [],
                            isRequired: false,
                            isActive: true,
                            productType: data.type,
                            sortOrder: i,
                        });
                    }
                } catch (e) {
                    console.warn('Could not auto-save filter questions:', e);
                }
            }

            navigate('/courses');
        } catch (error: any) {
            console.error("Error saving:", error);
            toast("Error al guardar: " + (error.message || "Intenta de nuevo"), 'error');
            setStatus('error');
        }
    };

    const addAttachment = () => {
        setData(prev => ({
            ...prev,
            attachments: [...prev.attachments, { id: Date.now().toString(), name: 'Nuevo Recurso.pdf', type: 'pdf', url: '#', size: '1.2 MB' }]
        }));
    };

    const { percent, missing, missingHigh } = calcCompleteness(data);
    const progressColor = percent >= 80 ? 'bg-green-500' : percent >= 50 ? 'bg-yellow-500' : 'bg-red-400';
    const progressTextColor = percent >= 80 ? 'text-green-600' : percent >= 50 ? 'text-yellow-600' : 'text-red-500';

    // ─── Render ───────────────────────────────────────────────────────
    return (
        <div className="flex h-full bg-gray-50 overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden relative transition-all duration-300">
                {/* ── Header ── */}
                <div className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center z-20 sticky top-0">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/courses')} className="text-gray-400 hover:text-gray-600"><X size={22} /></button>
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">
                                {id ? `Editar ${TYPE_LABELS[data.type]}` : activeTab === 'type-select' ? 'Nuevo Producto' : `Nuevo ${TYPE_LABELS[data.type]}`}
                            </h1>
                            <p className="text-xs text-gray-500">
                                {activeTab === 'type-select' ? 'Selecciona el tipo' : activeTab === 'upload' ? 'Carga tu contenido' : activeTab === 'guided' ? 'Asistente comercial' : 'Editor completo'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {status === 'success' && (
                            <div className="flex items-center gap-2">
                                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div className={`h-full ${progressColor} rounded-full transition-all`} style={{ width: `${percent}%` }} />
                                </div>
                                <span className={`text-xs font-bold ${progressTextColor}`}>{percent}%</span>
                            </div>
                        )}
                        {activeTab === 'editor' && (
                            <button onClick={() => setIsChatOpen(!isChatOpen)} className={`btn btn-sm gap-1.5 ${isChatOpen ? 'btn-primary' : 'btn-ghost'}`}>
                                <MessageSquare size={16} /> IA
                            </button>
                        )}
                        <button onClick={handleSave} className="btn btn-primary btn-sm gap-1.5 px-4">
                            <Check size={16} /> Guardar
                        </button>
                    </div>
                </div>

                {/* ── Steps bar ── */}
                <div className="bg-white border-b border-gray-100 px-6 flex items-center gap-1 overflow-x-auto sticky top-[57px] z-10">
                    {[
                        { id: 'type-select' as Tab, label: 'Tipo', step: 1 },
                        { id: 'upload' as Tab, label: 'Contenido', step: 2 },
                        { id: 'guided' as Tab, label: 'Asistente', step: 3 },
                        { id: 'editor' as Tab, label: 'Editor', step: 4 },
                    ].map((tab, i) => {
                        const isActive = activeTab === tab.id;
                        const isPast = ['type-select', 'upload', 'guided', 'editor'].indexOf(activeTab) > i;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                    isActive ? 'border-blue-600 text-blue-600' : isPast ? 'border-transparent text-green-600' : 'border-transparent text-gray-400'
                                }`}
                            >
                                <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${
                                    isActive ? 'bg-blue-600 text-white' : isPast ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                                }`}>{isPast && !isActive ? <Check size={12} /> : tab.step}</span>
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* ── Analysis loading overlay ── */}
                {status === 'analyzing' && (
                    <div className="absolute inset-0 bg-white/96 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-6 px-8">
                        <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
                            <Wand2 size={30} className="text-blue-600 animate-pulse" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-gray-900 mb-1">Analizando con IA</h3>
                            <p className="text-sm text-gray-500">Este proceso puede tardar entre 15 y 30 segundos</p>
                        </div>
                        <div className="w-72 space-y-2.5">
                            {ANALYSIS_STEPS.map((label, i) => (
                                <div key={i} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-500 ${
                                    i < analysisStep ? 'bg-green-50 text-green-700' :
                                    i === analysisStep ? 'bg-blue-50 text-blue-700 shadow-sm' :
                                    'text-gray-300'
                                }`}>
                                    {i < analysisStep
                                        ? <Check size={15} className="flex-shrink-0" />
                                        : i === analysisStep
                                            ? <Loader size={15} className="animate-spin flex-shrink-0" />
                                            : <span className="w-3.5 h-3.5 rounded-full border-2 border-current flex-shrink-0" />
                                    }
                                    <span className={`text-sm ${i === analysisStep ? 'font-semibold' : ''}`}>{label}</span>
                                </div>
                            ))}
                        </div>
                        <div className="w-64 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                                style={{ width: `${((analysisStep + 1) / ANALYSIS_STEPS.length) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* ── Content ── */}
                <div className="flex-1 overflow-y-auto">
                    <div className={`${activeTab === 'guided' ? 'h-full' : 'p-6'}`}>
                        <div className={`${activeTab === 'guided' ? 'h-full' : 'max-w-5xl mx-auto'}`}>

                            {/* ═══ STEP 1: Type Select ═══ */}
                            {activeTab === 'type-select' && (
                                <div className="animate-fade-in">
                                    <div className="text-center mb-8">
                                        <h2 className="text-2xl font-bold text-gray-900">Que tipo de producto quieres crear?</h2>
                                        <p className="text-gray-500 mt-2">La IA adaptara el analisis y los campos segun el tipo</p>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
                                        {TYPE_OPTIONS.map(opt => {
                                            const Icon = opt.icon;
                                            const isSelected = data.type === opt.value;
                                            const colorMap: Record<string, string> = {
                                                blue: 'border-blue-500 bg-blue-50 ring-blue-200',
                                                purple: 'border-purple-500 bg-purple-50 ring-purple-200',
                                                green: 'border-green-500 bg-green-50 ring-green-200',
                                                amber: 'border-amber-500 bg-amber-50 ring-amber-200',
                                                pink: 'border-pink-500 bg-pink-50 ring-pink-200',
                                                teal: 'border-teal-500 bg-teal-50 ring-teal-200',
                                                indigo: 'border-indigo-500 bg-indigo-50 ring-indigo-200',
                                            };
                                            const iconColorMap: Record<string, string> = {
                                                blue: 'text-blue-600', purple: 'text-purple-600', green: 'text-green-600',
                                                amber: 'text-amber-600', pink: 'text-pink-600', teal: 'text-teal-600', indigo: 'text-indigo-600',
                                            };
                                            return (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => { setData(prev => ({ ...prev, type: opt.value as any })); setActiveTab('upload'); }}
                                                    className={`p-6 rounded-xl border-2 text-left transition-all hover:shadow-md ${isSelected ? `${colorMap[opt.color]} ring-2` : 'border-gray-200 bg-white hover:border-gray-300'}`}
                                                >
                                                    <Icon size={28} className={isSelected ? iconColorMap[opt.color] : 'text-gray-400'} />
                                                    <h3 className="font-bold text-lg mt-3 text-gray-900">{opt.label}</h3>
                                                    <p className="text-sm text-gray-500 mt-1">{opt.desc}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* ═══ STEP 2: Upload ═══ */}
                            {activeTab === 'upload' && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                                    <div className="space-y-4">
                                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                            <h3 className="font-bold text-base mb-3 flex items-center gap-2">
                                                <FileText className="text-blue-600" size={18} /> Pegar Informacion
                                            </h3>
                                            <textarea
                                                className="w-full h-40 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                placeholder="Pega aqui el temario, brochure, landing page o notas del experto..."
                                                value={text} onChange={e => setText(e.target.value)}
                                            />
                                        </div>
                                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                            <h3 className="font-bold text-base mb-3 flex items-center gap-2">
                                                <Video className="text-red-600" size={18} /> Enlace YouTube
                                            </h3>
                                            <input className="input w-full" placeholder="https://youtube.com/watch?v=..." value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="bg-white p-5 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors flex flex-col items-center justify-center text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                        <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx,.txt,video/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                                        <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                                            <Upload className="text-blue-600 w-7 h-7" />
                                        </div>
                                        <h3 className="font-bold text-gray-900">Subir Archivo</h3>
                                        <p className="text-sm text-gray-500 mt-1 max-w-xs">PDF, Word o Video. La IA analizara el contenido.</p>
                                        {selectedFile && (
                                            <div className="mt-3 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium flex items-center gap-2">
                                                <Check size={14} /> {selectedFile.name}
                                            </div>
                                        )}
                                    </div>
                                    <div className="col-span-full space-y-3">
                                        <div className="flex items-center gap-3 px-3 py-2 bg-gray-100 rounded-lg text-sm">
                                            <span className="text-gray-500">Tipo:</span>
                                            <span className="font-bold text-gray-800">{TYPE_LABELS[data.type]}</span>
                                            <button onClick={() => setActiveTab('type-select')} className="text-blue-600 hover:underline text-xs ml-auto">Cambiar</button>
                                        </div>
                                        <div className="flex gap-3">
                                            <button
                                                onClick={handleAnalyze}
                                                disabled={status === 'analyzing' || (!text && !youtubeUrl && !selectedFile)}
                                                className="btn btn-primary flex-1 py-3 text-base shadow-lg hover:shadow-xl disabled:opacity-50"
                                            >
                                                {status === 'analyzing' ? (
                                                    <span className="flex items-center gap-2"><Loader className="animate-spin" size={18} /> Analizando...</span>
                                                ) : (
                                                    <span className="flex items-center gap-2"><Wand2 size={18} /> Analizar con IA</span>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => { setStatus('success'); setActiveTab('guided'); setIsChatOpen(true); setChatMessages([{ role: 'assistant', content: `Vamos a crear tu ${TYPE_LABELS[data.type]} desde cero. Te hare algunas preguntas para completar la informacion.` }, { role: 'assistant', content: getNextQuestion(data) || 'Dame el titulo de tu producto.' }]); }}
                                                className="btn btn-ghost py-3 text-sm"
                                            >
                                                Crear desde cero
                                            </button>
                                        </div>
                                        {status === 'error' && errorMessage && (
                                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-3">
                                                <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                                                <div className="flex-1">
                                                    <p className="text-red-700 font-medium text-sm">{errorMessage}</p>
                                                    <p className="text-red-500 text-xs mt-1">Tip: Si el archivo falla, intenta pegar el contenido como texto.</p>
                                                </div>
                                                <button onClick={() => { setErrorMessage(''); setStatus('idle'); handleAnalyze(); }} className="btn btn-sm bg-red-100 text-red-700 hover:bg-red-200 gap-1 flex-shrink-0">
                                                    <RefreshCw size={14} /> Reintentar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ═══ STEP 3: Guided Chat ═══ */}
                            {activeTab === 'guided' && (
                                <div className="flex h-full animate-fade-in">
                                    {/* Left: Summary Card */}
                                    <div className="w-80 border-r border-gray-200 bg-white p-5 flex flex-col overflow-y-auto flex-shrink-0">
                                        <div className="space-y-4 flex-1">
                                            {/* Progress */}
                                            <div>
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Completitud</span>
                                                    <span className={`text-sm font-bold ${progressTextColor}`}>{percent}%</span>
                                                </div>
                                                <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className={`h-full ${progressColor} rounded-full transition-all duration-500`} style={{ width: `${percent}%` }} />
                                                </div>
                                            </div>

                                            {/* Type badge */}
                                            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                                                {(() => { const opt = TYPE_OPTIONS.find(o => o.value === data.type); const Icon = opt?.icon || GraduationCap; return <Icon size={16} className="text-gray-500" />; })()}
                                                <span className="font-bold text-sm text-gray-700">{TYPE_LABELS[data.type]}</span>
                                            </div>

                                            {/* Data preview */}
                                            <div className="space-y-2">
                                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide">Datos extraidos</h4>
                                                {[
                                                    ['Titulo', data.title],
                                                    ['Precio', data.price ? `$${data.price} ${data.currency}` : ''],
                                                    ['Instructor', data.instructor || data.advisor || ''],
                                                    ['Objetivos', data.objectives.length ? `${data.objectives.length} definidos` : ''],
                                                    ['Temario', data.syllabus.length ? `${data.syllabus.length} modulos` : ''],
                                                ].map(([label, val]) => (
                                                    <div key={label as string} className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-500">{label}</span>
                                                        {val ? (
                                                            <span className="font-medium text-gray-800 truncate max-w-[140px] text-right">{val as string}</span>
                                                        ) : (
                                                            <span className="text-gray-300 text-xs">Pendiente</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Missing fields */}
                                            {missingHigh.length > 0 && (
                                                <div>
                                                    <h4 className="text-xs font-bold text-red-500 uppercase tracking-wide mb-1.5">Obligatorios</h4>
                                                    <ul className="space-y-1">
                                                        {missingHigh.map((m, i) => (
                                                            <li key={i} className="text-xs text-red-600 font-medium flex items-center gap-1.5">
                                                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />{m}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            {missing.length > missingHigh.length && (
                                                <div>
                                                    <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wide mb-1.5">Recomendados</h4>
                                                    <ul className="space-y-1">
                                                        {missing.filter(m => !missingHigh.includes(m)).slice(0, 5).map((m, i) => (
                                                            <li key={i} className="text-xs text-gray-500 flex items-center gap-1.5">
                                                                <span className="w-1.5 h-1.5 bg-amber-300 rounded-full flex-shrink-0" />{m}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>

                                        {/* Go to editor button */}
                                        <button
                                            onClick={() => { setActiveTab('editor'); setIsChatOpen(true); }}
                                            disabled={interactionCount < 3}
                                            className={`mt-4 btn w-full gap-2 ${interactionCount >= 3 && percent >= 40 ? 'btn-primary' : 'btn-ghost border border-gray-200'} disabled:opacity-40 disabled:cursor-not-allowed`}
                                            title={interactionCount < 3 ? `Responde al menos ${3 - interactionCount} preguntas mas para continuar` : ''}
                                        >
                                            <ArrowRight size={16} />
                                            {interactionCount < 3
                                                ? `Responde ${3 - interactionCount} preguntas mas`
                                                : percent >= 40 ? 'Ir al Editor' : 'Saltar al Editor'
                                            }
                                        </button>
                                    </div>

                                    {/* Right: Chat */}
                                    <div className="flex-1 flex flex-col bg-gray-50">
                                        <div className="flex-1 overflow-y-auto p-5 space-y-3">
                                            {chatMessages.map((msg, i) => (
                                                msg.role === 'data-chips' ? (
                                                    <div key={i} className="flex justify-start pl-1">
                                                        <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm">
                                                            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                                                <Check size={10} className="text-green-600" />
                                                            </div>
                                                            <span className="text-[11px] text-green-700 font-medium">
                                                                {msg.content.includes('|')
                                                                    ? `Datos actualizados: ${msg.content.split('|').join(', ')}`
                                                                    : msg.content}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[75%] p-3 rounded-2xl text-sm leading-relaxed ${
                                                        msg.role === 'user'
                                                            ? 'bg-blue-600 text-white rounded-br-md'
                                                            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-md shadow-sm'
                                                    }`}>
                                                        {msg.content.split('\n').map((line, j) => (
                                                            <p key={j} className={j > 0 ? 'mt-1' : ''}>
                                                                {line.split(/(\*\*[^*]+\*\*)/g).map((part, pi) =>
                                                                    part.startsWith('**') && part.endsWith('**')
                                                                        ? <strong key={pi} className="font-bold">{part.slice(2, -2)}</strong>
                                                                        : <span key={pi}>{part}</span>
                                                                )}
                                                            </p>
                                                        ))}
                                                    </div>
                                                </div>
                                                )
                                            ))}
                                            {applyingChange && (
                                                <div className="flex items-center gap-2 text-xs text-gray-400 ml-2">
                                                    <Loader size={12} className="animate-spin" /> Procesando...
                                                </div>
                                            )}
                                            <div ref={chatEndRef} />
                                        </div>
                                        <div className="p-4 bg-white border-t border-gray-200">
                                            <div className="flex items-center gap-2 max-w-2xl mx-auto">
                                                <button
                                                    onClick={() => handleChatAction('No tengo esa información por ahora, siguiente pregunta')}
                                                    disabled={applyingChange}
                                                    className="px-3 py-2.5 text-xs font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full border border-gray-200 transition-colors whitespace-nowrap disabled:opacity-50"
                                                    title="Saltar esta pregunta"
                                                >
                                                    Omitir
                                                </button>
                                                <div className="relative flex-1">
                                                    <input
                                                        className="w-full pl-4 pr-12 py-3 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        placeholder="Responde aqui..."
                                                        value={chatInput} onChange={e => setChatInput(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleChatAction()}
                                                        disabled={applyingChange}
                                                    />
                                                    <button onClick={handleChatAction} disabled={!chatInput.trim() || applyingChange}
                                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors disabled:opacity-50">
                                                        <Send size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ═══ STEP 4: Full Editor ═══ */}
                            {activeTab === 'editor' && (
                                <div className="space-y-4 animate-fade-in pb-8">

                                    {/* Section: Basic Info */}
                                    <EditorSection title="Informacion Basica" id="basic" open={openSections.basic} toggle={toggleSection}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="col-span-full">
                                                <label className="label-sm">Titulo</label>
                                                <input className="input w-full font-bold text-lg" value={data.title} onChange={e => setData({ ...data, title: e.target.value })} />
                                            </div>
                                            <div className="col-span-full">
                                                <label className="label-sm">Descripcion Comercial</label>
                                                <textarea className="input w-full h-28" value={data.description} onChange={e => setData({ ...data, description: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="label-sm">Tipo</label>
                                                <div className="input w-full bg-gray-50 font-bold text-gray-700 cursor-default">{TYPE_LABELS[data.type]}</div>
                                            </div>
                                            <div>
                                                <label className="label-sm">Modalidad</label>
                                                <select className="input w-full" value={data.modality} onChange={e => setData({ ...data, modality: e.target.value as any })}>
                                                    <option value="online">Online</option>
                                                    <option value="presencial">Presencial</option>
                                                    <option value="hibrido">Hibrido</option>
                                                    <option value="remoto">Remoto</option>
                                                </select>
                                            </div>
                                            <div className="col-span-full">
                                                <label className="label-sm">Publico Objetivo</label>
                                                <textarea className="input w-full h-16" value={data.targetAudience} onChange={e => setData({ ...data, targetAudience: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="label-sm">Fecha de Inicio</label>
                                                <input type="date" className="input w-full" value={data.startDate?.split('T')[0] || ''} onChange={e => setData({ ...data, startDate: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="label-sm">Duracion / Horas</label>
                                                <div className="flex gap-2">
                                                    <input className="input w-2/3" placeholder="Ej: 4 semanas" value={data.duration || ''} onChange={e => setData({ ...data, duration: e.target.value })} />
                                                    <input type="number" className="input w-1/3" placeholder="Hrs" value={data.hours || ''} onChange={e => setData({ ...data, hours: Number(e.target.value) })} />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="label-sm">Objetivos (uno por linea)</label>
                                                <textarea className="input w-full h-20" value={data.objectives.join('\n')} onChange={e => setData({ ...data, objectives: e.target.value.split('\n').filter(Boolean) })} />
                                            </div>
                                            <div>
                                                <label className="label-sm">Requisitos Previos (coma)</label>
                                                <input className="input w-full" placeholder="Ej: Laptop, experiencia previa" value={data.requirements?.join(', ') || ''} onChange={e => setData({ ...data, requirements: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
                                            </div>
                                        </div>
                                    </EditorSection>

                                    {/* Section: Instructor */}
                                    {!['postulacion'].includes(data.type) && (
                                        <EditorSection title={data.type === 'asesoria' ? 'Asesor' : 'Instructor'} id="instructor" open={openSections.instructor} toggle={toggleSection}>
                                            <div className="flex gap-4">
                                                <div className="w-14 h-14 bg-gray-200 rounded-full flex-shrink-0" />
                                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    <input className="input w-full" placeholder="Nombre" value={data.type === 'asesoria' ? (data.advisor || '') : data.instructor} onChange={e => data.type === 'asesoria' ? setData({ ...data, advisor: e.target.value }) : setData({ ...data, instructor: e.target.value })} />
                                                    {data.type === 'asesoria' && <input className="input w-full" placeholder="Titulo profesional" value={data.advisorTitle || ''} onChange={e => setData({ ...data, advisorTitle: e.target.value })} />}
                                                    <textarea className="input w-full h-16 text-sm col-span-full" placeholder="Bio corta..." value={data.type === 'asesoria' ? (data.advisorBio || '') : data.instructorBio} onChange={e => data.type === 'asesoria' ? setData({ ...data, advisorBio: e.target.value }) : setData({ ...data, instructorBio: e.target.value })} />
                                                </div>
                                            </div>
                                        </EditorSection>
                                    )}

                                    {/* Section: Type-Specific */}
                                    {['taller', 'asesoria', 'postulacion', 'subscripcion', 'webinar', 'programa'].includes(data.type) && (
                                        <EditorSection title={`Detalles de ${TYPE_LABELS[data.type]}`} id="typeSpecific" open={openSections.typeSpecific} toggle={toggleSection}>
                                            {data.type === 'taller' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <InputField label="Sede / Venue" pending value={data.venue || ''} onChange={v => setData({ ...data, venue: v })} />
                                                    <InputField label="Direccion" pending value={data.venueAddress || ''} onChange={v => setData({ ...data, venueAddress: v })} />
                                                    <InputField label="Capacidad Maxima" pending type="number" value={data.maxParticipants || ''} onChange={v => setData({ ...data, maxParticipants: Number(v) || undefined })} />
                                                    <InputField label="Precio Early Bird" type="number" value={data.earlyBirdPrice || ''} onChange={v => setData({ ...data, earlyBirdPrice: Number(v) || undefined })} />
                                                    <TextareaField label="Materiales (uno por linea)" value={data.materials?.join('\n') || ''} onChange={v => setData({ ...data, materials: v.split('\n').filter(Boolean) })} />
                                                    <TextareaField label="Entregables (uno por linea)" value={data.deliverables?.join('\n') || ''} onChange={v => setData({ ...data, deliverables: v.split('\n').filter(Boolean) })} />
                                                </div>
                                            )}
                                            {data.type === 'asesoria' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <InputField label="Precio por Hora" pending type="number" value={data.pricePerHour || ''} onChange={v => setData({ ...data, pricePerHour: Number(v) || undefined })} />
                                                    <InputField label="Horas Minimas" type="number" value={data.minimumHours || ''} onChange={v => setData({ ...data, minimumHours: Number(v) || undefined })} />
                                                    <InputField label="Paquete: Horas" type="number" value={data.packageHours || ''} onChange={v => setData({ ...data, packageHours: Number(v) || undefined })} />
                                                    <InputField label="Paquete: Precio" type="number" value={data.packagePrice || ''} onChange={v => setData({ ...data, packagePrice: Number(v) || undefined })} />
                                                    <InputField label="Duracion de Sesion" pending value={data.sessionDuration || ''} onChange={v => setData({ ...data, sessionDuration: v })} placeholder="Ej: 60 minutos" />
                                                    <InputField label="Link de Reserva" pending value={data.bookingLink || ''} onChange={v => setData({ ...data, bookingLink: v })} placeholder="https://calendly.com/..." />
                                                    <InputField label="Especialidades (coma)" pending value={data.specialties?.join(', ') || ''} onChange={v => setData({ ...data, specialties: v.split(',').map(s => s.trim()).filter(Boolean) })} />
                                                    <InputField label="Temas Cubiertos (coma)" value={data.topicsCovered?.join(', ') || ''} onChange={v => setData({ ...data, topicsCovered: v.split(',').map(s => s.trim()).filter(Boolean) })} />
                                                    <div className="col-span-full">
                                                        <InputField label="Horario Disponible" value={data.availableSchedule || ''} onChange={v => setData({ ...data, availableSchedule: v })} placeholder="Ej: Lunes a Viernes 9am-6pm" />
                                                    </div>
                                                </div>
                                            )}
                                            {data.type === 'postulacion' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="label-sm">Fecha Limite</label>
                                                        <input type="date" className="input w-full" value={data.deadline || ''} onChange={e => setData({ ...data, deadline: e.target.value })} />
                                                    </div>
                                                    <InputField label="Cupos Disponibles" pending type="number" value={data.availableSlots || ''} onChange={v => setData({ ...data, availableSlots: Number(v) || undefined })} />
                                                    <div className="col-span-full">
                                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                                            <input type="checkbox" checked={data.examRequired || false} onChange={e => setData({ ...data, examRequired: e.target.checked })} className="rounded" />
                                                            Requiere examen de admision
                                                        </label>
                                                    </div>
                                                    <TextareaField label="Pasos del Proceso (uno por linea)" value={data.steps?.join('\n') || ''} onChange={v => setData({ ...data, steps: v.split('\n').filter(Boolean) })} />
                                                    <TextareaField label="Documentos Requeridos (uno por linea)" value={data.documentsNeeded?.join('\n') || ''} onChange={v => setData({ ...data, documentsNeeded: v.split('\n').filter(Boolean) })} />
                                                    <InputField label="Criterios de Seleccion (coma)" value={data.selectionCriteria?.join(', ') || ''} onChange={v => setData({ ...data, selectionCriteria: v.split(',').map(s => s.trim()).filter(Boolean) })} />
                                                    <InputField label="Metodos de Ingreso (coma)" value={data.methods?.join(', ') || ''} onChange={v => setData({ ...data, methods: v.split(',').map(s => s.trim()).filter(Boolean) })} />
                                                </div>
                                            )}
                                            {data.type === 'subscripcion' && (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="label-sm">Frecuencia</label>
                                                        <select className="input w-full" value={data.frequency} onChange={e => setData({ ...data, frequency: e.target.value as any })}>
                                                            <option value="mensual">Mensual</option>
                                                            <option value="trimestral">Trimestral</option>
                                                            <option value="anual">Anual</option>
                                                        </select>
                                                    </div>
                                                    <InputField label="Precio por Periodo" type="number" value={data.price || ''} onChange={v => setData({ ...data, price: Number(v) })} />
                                                    <TextareaField label="Beneficios Incluidos (uno por linea)" cls="col-span-full" value={data.features?.join('\n') || ''} onChange={v => setData({ ...data, features: v.split('\n').filter(Boolean) })} />
                                                    <InputField label="Horas Asesoria Incluidas" type="number" value={data.advisoryHours || ''} onChange={v => setData({ ...data, advisoryHours: Number(v) || undefined })} />
                                                    <InputField label="Max Usuarios" type="number" value={data.maxUsers || ''} onChange={v => setData({ ...data, maxUsers: Number(v) || undefined })} />
                                                    <InputField label="Grupo WhatsApp" value={data.whatsappGroup || ''} onChange={v => setData({ ...data, whatsappGroup: v })} />
                                                    <InputField label="Acceso a Comunidad" value={data.communityAccess || ''} onChange={v => setData({ ...data, communityAccess: v })} placeholder="Discord, Slack, etc." />
                                                </div>
                                            )}
                                            {data.type === 'webinar' && (
                                                <InputField label="Link de Registro (Zoom, Eventbrite)" pending value={data.registrationLink || ''} onChange={v => setData({ ...data, registrationLink: v })} />
                                            )}
                                            {data.type === 'programa' && (
                                                <InputField label="Link de Registro" value={data.registrationLink || ''} onChange={v => setData({ ...data, registrationLink: v })} />
                                            )}
                                        </EditorSection>
                                    )}

                                    {/* Section: Content / Syllabus */}
                                    <EditorSection title="Temario y Recursos" id="content" open={openSections.content} toggle={toggleSection}>
                                        <div className="space-y-4">
                                            {data.syllabus.map((mod, idx) => (
                                                <div key={idx} className="border border-gray-100 rounded-lg p-3 hover:border-blue-300 transition-colors">
                                                    <div className="flex justify-between font-bold text-gray-800 text-sm mb-1">
                                                        <span>{mod.module || `Modulo ${idx + 1}`}</span>
                                                    </div>
                                                    <ul className="list-disc list-inside text-xs text-gray-600 space-y-0.5 ml-2">
                                                        {mod.topics?.map((t: string, i: number) => <li key={i}>{t}</li>)}
                                                    </ul>
                                                </div>
                                            ))}
                                            {data.syllabus.length === 0 && <p className="text-gray-400 italic text-center text-sm py-4">No se ha detectado temario.</p>}
                                            <div>
                                                <label className="label-sm">Herramientas a Ensenar (coma)</label>
                                                <input className="input w-full" placeholder="Excel, ChatGPT, Python" value={data.tools?.join(', ') || ''} onChange={e => setData({ ...data, tools: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <label className="label-sm">Recursos Adjuntos</label>
                                                <button onClick={addAttachment} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><Paperclip size={12} /> Adjuntar</button>
                                            </div>
                                            {data.attachments.map((att) => (
                                                <div key={att.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border text-sm">
                                                    <div className="flex items-center gap-2">
                                                        {att.type === 'pdf' ? <File className="text-red-500" size={16} /> : <LinkIcon className="text-blue-500" size={16} />}
                                                        <span className="font-medium text-gray-900">{att.name}</span>
                                                    </div>
                                                    <button onClick={() => setData(prev => ({ ...prev, attachments: prev.attachments.filter(a => a.id !== att.id) }))} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                                                </div>
                                            ))}
                                        </div>
                                    </EditorSection>

                                    {/* Section: Pricing & Marketing */}
                                    <EditorSection title="Precio y Oferta" id="marketing" open={openSections.marketing} toggle={toggleSection}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="label-sm">Precio</label>
                                                <input type="number" className="input w-full" value={data.price || ''} onChange={e => setData({ ...data, price: Number(e.target.value) })} />
                                            </div>
                                            <div>
                                                <label className="label-sm">Moneda</label>
                                                <select className="input w-full" value={data.currency} onChange={e => setData({ ...data, currency: e.target.value })}>
                                                    <option value="USD">USD</option><option value="PEN">PEN</option><option value="MXN">MXN</option>
                                                </select>
                                            </div>
                                            <div className="col-span-full">
                                                <InputField label="Promocion / Descuento" value={data.promotions || ''} onChange={v => setData({ ...data, promotions: v })} placeholder="Ej: 50% OFF por 24 horas" />
                                            </div>
                                            <TextareaField label="Gatillos de Urgencia (uno por linea)" value={data.urgencyTriggers?.join('\n') || ''} onChange={v => setData({ ...data, urgencyTriggers: v.split('\n').filter(Boolean) })} />
                                            <TextareaField label="Bonos (uno por linea)" value={data.bonuses?.join('\n') || ''} onChange={v => setData({ ...data, bonuses: v.split('\n').filter(Boolean) })} />
                                            <TextareaField label="Garantia" cls="col-span-full" value={data.guarantee || ''} onChange={v => setData({ ...data, guarantee: v })} placeholder="Ej: Devolucion 100% en 30 dias" />
                                        </div>
                                    </EditorSection>

                                    {/* Section: Sales Intelligence */}
                                    <EditorSection title="Inteligencia de Ventas" id="sales" open={openSections.sales} toggle={toggleSection}>
                                        <div className="space-y-4">
                                            <TextareaField label="Call to Action" pending value={data.callToAction || ''} onChange={v => setData({ ...data, callToAction: v })} placeholder="Inscribete ahora y transforma tu carrera..." />
                                            <TextareaField label="Perfil del Estudiante Ideal" pending value={data.idealStudentProfile || ''} onChange={v => setData({ ...data, idealStudentProfile: v })} placeholder="Profesionales de 25-40 que buscan..." />
                                            <TextareaField label="Ventaja Competitiva" pending value={data.competitiveAdvantage || ''} onChange={v => setData({ ...data, competitiveAdvantage: v })} placeholder="Somos los unicos en..." />
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <TextareaField label="Dolores del Alumno (antes)" value={data.painPoints?.join('\n') || ''} onChange={v => setData({ ...data, painPoints: v.split('\n').filter(Boolean) })} />
                                                <TextareaField label="Beneficios / Transformacion (despues)" value={data.benefits?.join('\n') || ''} onChange={v => setData({ ...data, benefits: v.split('\n').filter(Boolean) })} />
                                            </div>

                                            {/* Objection Handlers */}
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="label-sm">Manejo de Objeciones</label>
                                                    <button onClick={() => setData(prev => ({ ...prev, objectionHandlers: [...(prev.objectionHandlers || []), { objection: '', response: '' }] }))} className="text-xs text-blue-600 hover:underline">+ Agregar</button>
                                                </div>
                                                {data.objectionHandlers?.map((oh, idx) => (
                                                    <div key={idx} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg border mb-2">
                                                        <div className="flex-1 space-y-1.5">
                                                            <input className="input w-full text-sm font-bold" placeholder="Objecion..." value={oh.objection}
                                                                onChange={e => { const u = [...(data.objectionHandlers || [])]; u[idx] = { ...u[idx], objection: e.target.value }; setData({ ...data, objectionHandlers: u }); }} />
                                                            <textarea className="input w-full h-14 text-sm" placeholder="Respuesta..." value={oh.response}
                                                                onChange={e => { const u = [...(data.objectionHandlers || [])]; u[idx] = { ...u[idx], response: e.target.value }; setData({ ...data, objectionHandlers: u }); }} />
                                                        </div>
                                                        <button onClick={() => setData(prev => ({ ...prev, objectionHandlers: prev.objectionHandlers?.filter((_, i) => i !== idx) }))} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Success Stories */}
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="label-sm">Casos de Exito</label>
                                                    <button onClick={() => setData(prev => ({ ...prev, successStories: [...(prev.successStories || []), { name: '', quote: '', result: '' }] }))} className="text-xs text-blue-600 hover:underline">+ Agregar</button>
                                                </div>
                                                {data.successStories?.map((s, idx) => (
                                                    <div key={idx} className="p-3 bg-gray-50 rounded-lg border mb-2">
                                                        <div className="flex justify-between mb-2">
                                                            <span className="text-xs font-bold text-green-600">Caso #{idx + 1}</span>
                                                            <button onClick={() => setData(prev => ({ ...prev, successStories: prev.successStories?.filter((_, i) => i !== idx) }))} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 mb-1.5">
                                                            <input className="input w-full text-sm" placeholder="Nombre" value={s.name} onChange={e => { const u = [...(data.successStories || [])]; u[idx] = { ...u[idx], name: e.target.value }; setData({ ...data, successStories: u }); }} />
                                                            <input className="input w-full text-sm" placeholder="Resultado" value={s.result || ''} onChange={e => { const u = [...(data.successStories || [])]; u[idx] = { ...u[idx], result: e.target.value }; setData({ ...data, successStories: u }); }} />
                                                        </div>
                                                        <textarea className="input w-full h-12 text-sm" placeholder="Testimonio..." value={s.quote} onChange={e => { const u = [...(data.successStories || [])]; u[idx] = { ...u[idx], quote: e.target.value }; setData({ ...data, successStories: u }); }} />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </EditorSection>

                                    {/* Section: Social / FAQs */}
                                    <EditorSection title="Prueba Social y FAQs" id="social" open={openSections.social} toggle={toggleSection}>
                                        <div className="space-y-4">
                                            <TextareaField label="Prueba Social (uno por linea)" value={data.socialProof?.join('\n') || ''} onChange={v => setData({ ...data, socialProof: v.split('\n').filter(Boolean) })} placeholder="Testimonios, menciones en prensa..." />
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="label-sm">Preguntas Frecuentes</label>
                                                    <button onClick={() => setData(prev => ({ ...prev, faqs: [...(prev.faqs || []), { question: '', answer: '' }] }))} className="text-xs text-blue-600 hover:underline">+ Agregar</button>
                                                </div>
                                                {data.faqs?.map((faq, idx) => (
                                                    <div key={idx} className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg border mb-2">
                                                        <div className="flex-1 space-y-1.5">
                                                            <input className="input w-full text-sm font-bold" placeholder="Pregunta..." value={faq.question}
                                                                onChange={e => { const u = [...(data.faqs || [])]; u[idx] = { ...u[idx], question: e.target.value }; setData({ ...data, faqs: u }); }} />
                                                            <textarea className="input w-full h-14 text-sm" placeholder="Respuesta..." value={faq.answer}
                                                                onChange={e => { const u = [...(data.faqs || [])]; u[idx] = { ...u[idx], answer: e.target.value }; setData({ ...data, faqs: u }); }} />
                                                        </div>
                                                        <button onClick={() => setData(prev => ({ ...prev, faqs: prev.faqs?.filter((_, i) => i !== idx) }))} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </EditorSection>

                                    {/* Section: Filter Questions (edit mode only) */}
                                    {id && (
                                        <ProductFilterQuestions
                                            courseId={id}
                                            productType={data.type}
                                        />
                                    )}
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>

            {/* ── AI Sidebar (editor mode only) ── */}
            {activeTab === 'editor' && (
                <div className={`w-80 bg-white border-l border-gray-200 flex flex-col transition-all duration-300 transform ${isChatOpen ? 'translate-x-0' : 'translate-x-full absolute right-0 h-full shadow-2xl'}`}>
                    <div className="p-3 border-b border-gray-200 bg-blue-50 flex justify-between items-center">
                        <h3 className="font-bold text-sm text-blue-900 flex items-center gap-1.5"><Wand2 size={14} /> Asistente IA</h3>
                        <button onClick={() => setIsChatOpen(false)}><X size={16} className="text-blue-400 hover:text-blue-700" /></button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
                        {chatMessages.length === 0 && (
                            <div className="text-center text-gray-400 text-xs mt-10 p-3">
                                <p>Pideme cosas como:</p>
                                <ul className="mt-2 space-y-1 text-blue-600 cursor-pointer">
                                    <li className="hover:underline" onClick={() => setChatInput("Mejora la descripcion")}>Mejora la descripcion</li>
                                    <li className="hover:underline" onClick={() => setChatInput("Agrega un modulo sobre IA")}>Agrega un modulo</li>
                                    <li className="hover:underline" onClick={() => setChatInput("Cambia el precio a 299 USD")}>Cambia precio a 299</li>
                                </ul>
                            </div>
                        )}
                        {chatMessages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[90%] p-2.5 rounded-lg text-xs ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-800 shadow-sm'}`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {applyingChange && <div className="flex gap-1.5 items-center text-xs text-gray-500 ml-2"><Loader size={10} className="animate-spin" /> Aplicando...</div>}
                    </div>
                    <div className="p-3 border-t bg-white">
                        <div className="relative">
                            <input className="w-full pl-3 pr-8 py-2 bg-gray-100 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Instruccion..." value={chatInput} onChange={e => setChatInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleChatAction()} disabled={applyingChange} />
                            <button onClick={handleChatAction} disabled={!chatInput.trim() || applyingChange}
                                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-blue-600 hover:bg-blue-100 rounded-full disabled:opacity-50">
                                <Send size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Reusable sub-components ─────────────────────────────────────────

function EditorSection({ title, id, open, toggle, children }: { title: string; id: string; open: boolean; toggle: (id: string) => void; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button onClick={() => toggle(id)} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                <h3 className="font-bold text-sm text-gray-800">{title}</h3>
                {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            {open && <div className="px-5 pb-5 border-t border-gray-100 pt-4">{children}</div>}
        </div>
    );
}

function InputField({ label, value, onChange, type = 'text', placeholder = '', pending = false }: { label: string; value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string; pending?: boolean }) {
    const isEmpty = value === '' || value === 0 || value === undefined || value === null;
    return (
        <div>
            <label className="label-sm flex items-center gap-1.5">
                {label}
                {pending && isEmpty && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">PENDIENTE</span>}
            </label>
            <input type={type} className={`input w-full ${pending && isEmpty ? 'border-red-300 bg-red-50/30' : ''}`} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
        </div>
    );
}

function TextareaField({ label, value, onChange, placeholder = '', cls = '', pending = false }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; cls?: string; pending?: boolean }) {
    const isEmpty = !value || value.trim() === '';
    return (
        <div className={cls}>
            <label className="label-sm flex items-center gap-1.5">
                {label}
                {pending && isEmpty && <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">PENDIENTE</span>}
            </label>
            <textarea className={`input w-full h-20 ${pending && isEmpty ? 'border-red-300 bg-red-50/30' : ''}`} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
        </div>
    );
}
