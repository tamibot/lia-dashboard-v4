import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { courseService } from '../lib/services/course.service';
import { profileService } from '../lib/services/profile.service';
import {
    generateLanding, generateEmailSequence, generateWhatsAppSequence, generateMarketing,
    analyzeCourseData, generateContentIdeas, refineContent,
    generateLaunchContent, generateBanner, generateSocialPosts, generateCourseSheet
} from '../lib/gemini';
import {
    ArrowLeft, Sparkles, Loader, Send, Copy, Check, Download,
    Clock, Users, Tag, DollarSign, MapPin, Award, ChevronDown, ChevronRight, RefreshCw, Edit, Play, Book, AlertTriangle
} from 'lucide-react';
import SalesPlayground from '../components/SalesPlayground';
import type { AiAgent, ContactInfo, Attachment } from '../lib/types';

// --- Types ---
type ChatMsg = { role: 'user' | 'ai'; text: string };
type ToolDef = {
    id: string; label: string; emoji: string; desc: string; category: string;
    visual?: boolean; // true = returns HTML for iframe preview
};

// --- Helpers ---
function extractHtml(raw: string): string | null {
    // Extract HTML from ```html ... ``` code blocks
    const match = raw.match(/```html\s*\n?([\s\S]*?)```/i);
    if (match) return match[1].trim();
    // If raw itself looks like HTML (starts with < or <!DOCTYPE)
    if (raw.trim().startsWith('<') || raw.trim().startsWith('<!')) return raw.trim();
    return null;
}

function renderMarkdown(md: string): string {
    if (!md) return '';
    return md
        .replace(/^### (.+)$/gm, '<h4 style="font-size:14px;font-weight:700;margin:18px 0 8px;color:#1a1a2e">$1</h4>')
        .replace(/^## (.+)$/gm, '<h3 style="font-size:16px;font-weight:800;margin:22px 0 10px;color:#1a1a2e">$1</h3>')
        .replace(/^# (.+)$/gm, '<h2 style="font-size:18px;font-weight:800;margin:26px 0 12px;color:#1a1a2e">$1</h2>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/^- (.+)$/gm, '<li style="margin:4px 0;padding-left:4px">$1</li>')
        .replace(/^(\d+)\. (.+)$/gm, '<li style="margin:4px 0;padding-left:4px">$1. $2</li>')
        .replace(/((?:<li[^>]*>.*<\/li>\n?)+)/g, '<ul style="list-style:disc;padding-left:20px;margin:8px 0">$1</ul>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color:#4F46E5;text-decoration:underline">$1</a>')
        .replace(/`([^`]+)`/g, '<code style="background:#f4f4f5;padding:1px 5px;border-radius:4px;font-size:12px">$1</code>')
        .replace(/^(?!<[hula])(.*\S.*)$/gm, '<p style="margin:6px 0;line-height:1.7">$1</p>')
        .replace(/---/g, '<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0">')
        .replace(/\n{2,}/g, '<br>');
}

// --- Tool definitions ---
const ALL_TOOLS: ToolDef[] = [
    { id: 'analyze', label: 'Analizar Datos', emoji: '📋', desc: 'Completitud y mejoras', category: 'Análisis' },
    { id: 'landing', label: 'Landing Page', emoji: '🌐', desc: 'Página completa HTML', category: 'Visual', visual: true },
    { id: 'banner', label: 'Banner Promo', emoji: '🎨', desc: 'Banner visual HTML/CSS', category: 'Visual', visual: true },
    { id: 'social', label: 'Posts Redes', emoji: '📲', desc: '3 posts visuales', category: 'Visual', visual: true },
    { id: 'sheet', label: 'Ficha Técnica', emoji: '📄', desc: 'One-pager HTML', category: 'Visual', visual: true },
    { id: 'email', label: 'Secuencia Email', emoji: '📧', desc: '4 correos de seguimiento', category: 'Comunicación' },
    { id: 'whatsapp', label: 'Secuencia WhatsApp', emoji: '📱', desc: '5 mensajes por día', category: 'Comunicación' },
    { id: 'launch', label: 'Contenido Lanzamiento', emoji: '🚀', desc: 'Kit pre/durante/post', category: 'Marketing' },
    { id: 'marketing', label: 'Kit Marketing', emoji: '📊', desc: 'Ads, SEO, audiencias', category: 'Marketing' },
    { id: 'content', label: 'Ideas Contenido', emoji: '💡', desc: 'Calendario 2 semanas', category: 'Marketing' },
];

export default function CourseDetailPage() {
    const { type: urlType, id } = useParams<{ type: string; id: string }>();
    const navigate = useNavigate();
    const [item, setItem] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [fetchStatus, setFetchStatus] = useState<'loading' | 'success' | 'error' | 'not_found'>('loading');
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState('');
    const [chat, setChat] = useState<ChatMsg[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [refining, setRefining] = useState(false);
    const [copied, setCopied] = useState(false);
    const [expandSyllabus, setExpandSyllabus] = useState(false);
    const [showSalesTest, setShowSalesTest] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'ai'>('info');

    // Fetch Data
    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                setFetchStatus('loading');
                const [itemData, profileData] = await Promise.all([
                    courseService.getById(id, urlType),
                    profileService.get()
                ]);

                if (itemData) {
                    setItem(itemData);
                    setProfile(profileData);
                    setFetchStatus('success');
                } else {
                    setFetchStatus('not_found');
                }
            } catch (err) {
                console.error("Error fetching course detail or profile:", err);
                setFetchStatus('error');
            }
        };
        fetchData();
    }, [id]);

    const itemType = item?.type || urlType;
    const itemTitle = item?.title || '';

    // Mapping for type visualization
    const getTypeInfo = (type: string) => {
        switch (type) {
            case 'taller': return { emoji: '🔧', label: 'Taller' };
            case 'subscription':
            case 'subscripcion': return { emoji: '🔄', label: 'Suscripción' };
            case 'asesoria': return { emoji: '💬', label: 'Asesoría' };
            case 'application':
            case 'postulacion': return { emoji: '📝', label: 'Postulación' };
            case 'programa': return { emoji: '🎓', label: 'Programa' };
            case 'webinar': return { emoji: '🎥', label: 'Webinar' };
            default: return { emoji: '📚', label: 'Curso Libre' };
        }
    };

    const { emoji: typeEmoji, label: typeLabel } = getTypeInfo(itemType);

    // Run a tool
    async function runTool(toolId: string) {
        if (!profile) { alert('Completa tu perfil de organización primero'); return; }
        setActiveTool(toolId);
        setLoading(true);
        setContent('');
        setChat([]);
        setChatInput('');

        try {
            let result = '';
            const p = profile as unknown as Record<string, unknown>;
            switch (toolId) {
                case 'analyze': result = await analyzeCourseData(item, itemType as any); break;
                case 'landing': result = await generateLanding(item, p); break;
                case 'banner': result = await generateBanner(item, p); break;
                case 'social': result = await generateSocialPosts(item, p); break;
                case 'sheet': result = await generateCourseSheet(item, p); break;
                case 'email': result = await generateEmailSequence(item, p); break;
                case 'whatsapp': result = await generateWhatsAppSequence(item, p); break;
                case 'launch': result = await generateLaunchContent(item, p); break;
                case 'marketing': result = await generateMarketing(item, p); break;
                case 'content': result = await generateContentIdeas(p, { [itemType!]: item }); break;
            }
            setContent(result);
        } catch (err: unknown) {
            setContent(`❌ Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    }

    // Refine content via chat
    async function handleRefine() {
        const msg = chatInput.trim();
        if (!msg || !content) return;
        setChatInput('');
        setChat(prev => [...prev, { role: 'user', text: msg }]);
        setRefining(true);
        try {
            const newContent = await refineContent(content, msg);
            setContent(newContent);
            setChat(prev => [...prev, { role: 'ai', text: '✅ Contenido actualizado según tu instrucción.' }]);
        } catch (err) {
            setChat(prev => [...prev, { role: 'ai', text: `❌ Error: ${err instanceof Error ? err.message : 'Error'}` }]);
        } finally {
            setRefining(false);
        }
    }

    async function copyToClipboard(text: string) {
        try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { }
    }

    function downloadFile(text: string, ext: string) {
        const blob = new Blob([text], { type: ext === 'html' ? 'text/html' : 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `${itemTitle.replace(/\s+/g, '_')}_${activeTool}.${ext}`; a.click();
        URL.revokeObjectURL(url);
    }

    if (fetchStatus === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader className="w-12 h-12 text-blue-600 animate-spin" />
                    <p className="text-gray-500 font-medium">Cargando detalles...</p>
                </div>
            </div>
        );
    }

    if (fetchStatus === 'error') {
        return (
            <div className="flex items-center justify-center min-h-[60vh] p-8">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-red-100 p-8 text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Error al cargar</h3>
                    <p className="text-gray-600 mb-8">Hubo un problema al obtener la información del curso. Por favor, intenta de nuevo.</p>
                    <div className="flex flex-col gap-3">
                        <button onClick={() => window.location.reload()} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors">
                            <RefreshCw size={18} /> Reintentar
                        </button>
                        <Link to="/courses" className="w-full px-6 py-3 text-gray-600 font-medium hover:bg-gray-50 rounded-xl transition-colors">
                            Volver al catálogo
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!item || fetchStatus === 'not_found') {
        return (
            <div className="flex items-center justify-center min-h-[60vh] p-8">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Book className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No encontrado</h3>
                    <p className="text-gray-600 mb-8">El curso o programa solicitado no existe o ha sido eliminado.</p>
                    <Link to="/courses" className="w-full block px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors">
                        Ir al catálogo
                    </Link>
                </div>
            </div>
        );
    }

    // Safe data access
    const description = (item.description as string) || '';
    const objectives = (item.objectives as string[]) || [];
    const syllabus = (item.syllabus as any[]) || [];
    const instructor = (item.instructor as string) || (item.speaker as string) || '';
    const price = (item.price as number) || 0;
    const currency = (item.currency as string) || 'USD';
    const modality = (item.modality as string) || 'online';
    const duration = (item.duration as string) || (item.totalDuration as string) || '';
    const maxStudents = (item.maxStudents as number) || (item.maxAttendees as number) || 0;
    const category = (item.category as string) || 'General';
    const certification = (item.certification as string) || '';

    // Webinar specifics
    const date = (item.date as string) || (item.startDate as string) || '';
    const time = (item.time as string) || (item.schedule as string) || '';
    const registrationLink = (item.registrationLink as string) || '';

    // Commercial & details
    const tools = (item.tools as string[]) || [];
    const requirements = (item.requirements as string[]) || [];
    const benefits = (item.benefits as string[]) || [];
    const faqs = (item.faqs as { question: string; answer: string }[]) || [];
    const bonuses = (item.bonuses as string[]) || [];
    const guarantee = (item.guarantee as string) || '';
    const promotions = (item.promotions as string) || '';
    const contactInfo = (item.contactInfo as ContactInfo) || null;
    const attachments = (item.attachments as Attachment[]) || [];

    // Model specific fields
    const tallerInfo = itemType === 'taller' ? {
        venue: item.venue || '',
        venueAddress: item.venueAddress || '',
        maxParticipants: item.maxParticipants || null,
        availableSpots: item.availableSpots || null,
    } : null;

    const asesoriaInfo = itemType === 'asesoria' ? {
        pricePerHour: item.pricePerHour || 0,
        advisor: item.advisor || '',
        advisorTitle: item.advisorTitle || '',
        bookingLink: item.bookingLink || '',
        sessionDuration: item.sessionDuration || '',
    } : null;

    const subscriptionInfo = (itemType === 'subscription' || itemType === 'subscripcion') ? {
        period: item.period || '',
        advisoryHours: item.advisoryHours || null,
    } : null;

    const applicationInfo = (itemType === 'application' || itemType === 'postulacion') ? {
        deadline: item.deadline ? new Date(item.deadline).toLocaleDateString() : '',
        examRequired: item.examRequired || false,
    } : null;

    const currentTool = ALL_TOOLS.find(t => t.id === activeTool);
    const htmlContent = currentTool?.visual && content ? extractHtml(content) : null;

    // Group tools by category
    const categories = [...new Set(ALL_TOOLS.map(t => t.category))];

    return (
        <div className="page-content max-w-6xl mx-auto p-4 md:p-8">
            {/* ====== HEADER ====== */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
                <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-gray-100 bg-gradient-to-br from-white to-gray-50">
                    <div className="flex items-start gap-4">
                        <button onClick={() => navigate('/courses')} className="mt-1 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                                    {typeEmoji} {typeLabel}
                                </span>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Activo
                                </span>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">{itemTitle}</h1>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button onClick={() => navigate(`/courses/edit/${id}`)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium shadow-sm">
                            <Edit size={16} /> Editar
                        </button>
                        <button onClick={() => setShowSalesTest(true)} className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all text-sm font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                            <Play size={16} fill="currentColor" /> Probar Vendedor
                        </button>
                    </div>
                </div>

                {/* Stats bar */}
                <div className="grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-gray-100 bg-white">
                    {[
                        { icon: <Tag size={16} />, label: category },
                        { icon: <MapPin size={16} />, label: modality.charAt(0).toUpperCase() + modality.slice(1) },
                        { icon: <Clock size={16} />, label: itemType === 'webinar' ? `${date} ${time}` : itemType === 'application' ? `Límite: ${applicationInfo?.deadline}` : (duration || '—') },
                        { icon: <Users size={16} />, label: maxStudents ? `${maxStudents} cupos` : '—' },
                        { icon: <DollarSign size={16} />, label: price ? `${currency} ${price}` : 'Gratis' },
                    ].map((s, i) => (
                        <div key={i} className="flex items-center justify-center gap-2.5 p-4 text-sm font-medium text-gray-600">
                            {s.icon} <span>{s.label}</span>
                        </div>
                    ))}
                </div>

                {/* Specific Details / Hierarchy Bar */}
                {(tallerInfo || asesoriaInfo || subscriptionInfo || applicationInfo) && (
                    <div className="bg-blue-50/50 border-t border-gray-100 px-8 py-3 flex flex-wrap gap-6 items-center">
                        {tallerInfo?.venue && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-400 font-bold uppercase text-[10px] tracking-tight">Sede:</span>
                                <span className="text-gray-700 font-semibold">{tallerInfo.venue}</span>
                            </div>
                        )}
                        {tallerInfo?.availableSpots != null && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-400 font-bold uppercase text-[10px] tracking-tight">Cupos disponibles:</span>
                                <span className="text-gray-700 font-semibold">{tallerInfo.availableSpots}</span>
                            </div>
                        )}
                        {asesoriaInfo?.advisor && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-400 font-bold uppercase text-[10px] tracking-tight">Asesor:</span>
                                <span className="text-gray-700 font-semibold">{asesoriaInfo.advisor} {asesoriaInfo.advisorTitle ? `(${asesoriaInfo.advisorTitle})` : ''}</span>
                            </div>
                        )}
                        {asesoriaInfo?.bookingLink && (
                            <a href={asesoriaInfo.bookingLink} target="_blank" rel="noreferrer" className="ml-auto flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-xs font-bold shadow-sm">
                                Agendar Cita
                            </a>
                        )}
                        {subscriptionInfo?.period && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-400 font-bold uppercase text-[10px] tracking-tight">Periodo:</span>
                                <span className="text-gray-700 font-semibold">{subscriptionInfo.period}</span>
                            </div>
                        )}
                        {applicationInfo?.deadline && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-400 font-bold uppercase text-[10px] tracking-tight">Fecha límite:</span>
                                <span className="text-gray-700 font-semibold">{applicationInfo.deadline}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ====== TABS ====== */}
            <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('info')}
                    className={`py-4 px-6 font-semibold text-sm border-b-2 transition-colors whitespace-nowrap ${activeTab === 'info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Información Detallada
                </button>
                <button
                    onClick={() => setActiveTab('ai')}
                    className={`py-4 px-6 font-semibold text-sm border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === 'ai' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    <Sparkles size={16} /> Crear Contenido con IA
                </button>
            </div>

            {/* ====== COURSE INFO ====== */}
            {activeTab === 'info' && !activeTool && (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        {/* Description */}
                        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Book size={16} /> Descripción General
                            </h4>
                            <p className="text-gray-600 leading-relaxed">
                                {description || <em className="text-gray-400">Sin descripción proporcionada. Edita el curso para añadir una descripción atractiva.</em>}
                            </p>
                        </div>

                        {/* Instructor + cert */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-6">
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Users size={16} /> Instructor o Expositor
                                </h4>
                                {instructor ? (
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 font-bold flex items-center justify-center shrink-0">
                                            {instructor.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="font-semibold text-gray-900">{instructor}</span>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 italic">No asignado</p>
                                )}
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                    <Award size={16} /> Certificación
                                </h4>
                                <p className="text-sm text-gray-600">{certification || <em className="text-gray-400">Sin certificación documentada</em>}</p>
                            </div>
                        </div>
                    </div>

                    {/* Objectives & Tools */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Sparkles size={16} /> Objetivos del Aprendizaje
                            </h4>
                            {objectives.length > 0 ? (
                                <ul className="space-y-3">
                                    {objectives.map((obj, i) => (
                                        <li key={i} className="flex gap-3 text-sm text-gray-600">
                                            <div className="mt-0.5 w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                                <Check size={10} strokeWidth={3} />
                                            </div>
                                            <span>{obj}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-400 italic">Agrega objetivos claros para convencer a tus prospectos.</p>
                            )}
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="mb-6">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                                    🛠️ Herramientas
                                </h4>
                                {tools.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {tools.map((t, i) => (
                                            <span key={i} className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 italic">No se han listado herramientas.</p>
                                )}
                            </div>
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                                    📋 Requisitos Previos
                                </h4>
                                {requirements.length > 0 ? (
                                    <ul className="space-y-2">
                                        {requirements.map((req, i) => (
                                            <li key={i} className="flex gap-2 text-sm text-gray-600 items-start">
                                                <span className="text-gray-400 mt-0.5">•</span> {req}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-gray-400 italic">Entrada libre de requisitos.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Marketing specific fields */}
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl shadow-sm border border-indigo-100 p-6 mb-6">
                        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                            💼 Comercial & Venta
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <div className="mb-6">
                                    <h5 className="text-sm font-bold text-indigo-900 mb-3">Beneficios Clave</h5>
                                    {benefits.length > 0 ? (
                                        <ul className="space-y-2">
                                            {benefits.map((b, i) => (
                                                <li key={i} className="flex gap-2 text-sm text-indigo-800 items-start">
                                                    <span className="text-indigo-400 mt-0.5">✨</span> {b}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-indigo-400 italic">Añade beneficios para potenciar el mensaje del Agente IA de Ventas.</p>
                                    )}
                                </div>
                                <div className="mb-6">
                                    <h5 className="text-sm font-bold text-indigo-900 mb-3">Bonos Extra</h5>
                                    {bonuses.length > 0 ? (
                                        <ul className="space-y-2">
                                            {bonuses.map((b, i) => (
                                                <li key={i} className="flex gap-2 text-sm text-emerald-700 font-medium items-start">
                                                    <span className="mt-0.5">🎁</span> {b}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-indigo-400 italic">Sin bonos configurados.</p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <div className="mb-6">
                                    <h5 className="text-sm font-bold text-indigo-900 mb-2">Promociones Activas</h5>
                                    {promotions ? (
                                        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-3 py-2 rounded-lg text-sm font-semibold">
                                            <span>🏷️</span> {promotions}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-indigo-400 italic">Ninguna por ahora.</p>
                                    )}
                                </div>
                                <div className="mb-6">
                                    <h5 className="text-sm font-bold text-indigo-900 mb-2">Garantía</h5>
                                    {guarantee ? (
                                        <div className="flex items-center gap-2 text-sm text-indigo-800 bg-white/60 px-3 py-2 rounded-lg border border-indigo-100/50">
                                            <span>🛡️</span> {guarantee}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-indigo-400 italic">Sin política de garantía visible.</p>
                                    )}
                                </div>
                                {itemType === 'webinar' && (
                                    <div className="mb-6">
                                        <h5 className="text-sm font-bold text-indigo-900 mb-2">Link de Registro</h5>
                                        {registrationLink ? (
                                            <a href={registrationLink} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:text-blue-800 underline break-all">
                                                {registrationLink}
                                            </a>
                                        ) : (
                                            <p className="text-sm text-indigo-400 italic">Falta por configurar.</p>
                                        )}
                                    </div>
                                )}
                                <div className="mb-6">
                                    <h5 className="text-sm font-bold text-indigo-900 mb-3">Preguntas Frecuentes Top</h5>
                                    {faqs.length > 0 ? (
                                        <div className="space-y-3">
                                            {faqs.slice(0, 3).map((f, i) => (
                                                <div key={i} className="bg-white/60 p-3 rounded-lg border border-indigo-100/50">
                                                    <div className="text-xs font-bold text-indigo-900 mb-1">Q: {f.question}</div>
                                                    <div className="text-xs text-indigo-700">A: {f.answer}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-indigo-400 italic">Las FAQs ayudan al Agente a responder mejor.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Syllabus */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                        <button
                            onClick={() => setExpandSyllabus(!expandSyllabus)}
                            className="w-full flex items-center justify-between text-left focus:outline-none group"
                        >
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                📚 Temario {syllabus.length > 0 && (
                                    <span className="bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-[10px]">
                                        {syllabus.length} {typeof syllabus[0] === 'object' && syllabus[0]?.module ? 'módulos' : 'temas'}
                                    </span>
                                )}
                            </h4>
                            <div className="text-gray-400 group-hover:text-blue-500 transition-colors">
                                {expandSyllabus ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </div>
                        </button>

                        {expandSyllabus && (
                            <div className="mt-6 border-t border-gray-50 pt-4 space-y-4">
                                {syllabus.length > 0 ? syllabus.map((mod: any, i: number) => (
                                    <div key={i} className="pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                                        {typeof mod === 'object' && mod.module ? (
                                            <>
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                                                        M{i + 1}
                                                    </div>
                                                    <div>
                                                        <h5 className="text-sm font-bold text-gray-900 mb-2">{mod.module}</h5>
                                                        {mod.topics && (
                                                            <ul className="space-y-1.5 pl-2 border-l-2 border-gray-100">
                                                                {mod.topics.map((t: string, ti: number) => (
                                                                    <li key={ti} className="text-sm text-gray-600 pl-3 relative before:absolute before:w-1.5 before:h-1.5 before:bg-gray-300 before:rounded-full before:left-[-4px] before:top-2">
                                                                        {t}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex items-start gap-3 text-sm">
                                                <span className="text-blue-500 font-bold shrink-0">{i + 1}.</span>
                                                <span className="text-gray-700">{typeof mod === 'string' ? mod : mod.title || JSON.stringify(mod)}</span>
                                            </div>
                                        )}
                                    </div>
                                )) : (
                                    <p className="text-sm text-gray-400 italic">No se ha cargado el temario aún.</p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Resources & Attachments */}
                    {attachments.length > 0 && (
                        <div className="card" style={{ padding: '16px', marginBottom: '14px' }}>
                            <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                                📎 Recursos ({attachments.length})
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '8px' }}>
                                {attachments.map(att => (
                                    <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', border: '1px solid var(--border)', borderRadius: '8px', background: '#f8fafc' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '6px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                                            {att.type === 'pdf' ? <span style={{ color: '#E11D48' }}>P</span> :
                                                att.type === 'image' ? <span style={{ color: '#3B82F6' }}>I</span> :
                                                    att.type === 'video' ? <span style={{ color: '#8B5CF6' }}>V</span> :
                                                        <span style={{ color: '#10B981' }}>L</span>}
                                        </div>
                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <div style={{ fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{att.name}</div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{att.type.toUpperCase()}{att.size ? ` • ${att.size}` : ''}</div>
                                        </div>
                                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#3B82F6', cursor: 'pointer' }}>Ver</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Contact Info */}
                    {contactInfo && (contactInfo.email || contactInfo.phone || contactInfo.whatsapp) && (
                        <div className="card" style={{ padding: '16px', marginBottom: '20px', background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                            <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                                📞 Información de Contacto
                            </h4>
                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                {contactInfo.email && <div style={{ fontSize: '12px', color: '#166534', background: 'white', padding: '4px 8px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>📧 {contactInfo.email}</div>}
                                {contactInfo.phone && <div style={{ fontSize: '12px', color: '#166534', background: 'white', padding: '4px 8px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>📞 {contactInfo.phone}</div>}
                                {contactInfo.whatsapp && <div style={{ fontSize: '12px', color: '#166534', background: 'white', padding: '4px 8px', borderRadius: '4px', border: '1px solid #bbf7d0' }}>📱 {contactInfo.whatsapp}</div>}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ====== TOOL GRID (when no tool is active) ====== */}
            {activeTab === 'ai' && !activeTool && (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                        <Sparkles size={18} style={{ color: '#3B82F6' }} />
                        <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Crear Contenido con IA</h3>
                    </div>

                    {categories.map(cat => (
                        <div key={cat} style={{ marginBottom: '14px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                                {cat}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                                {ALL_TOOLS.filter(t => t.category === cat).map(tool => (
                                    <button key={tool.id} onClick={() => runTool(tool.id)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left',
                                            padding: '12px 14px', border: '1px solid var(--border)', borderRadius: '10px',
                                            background: 'var(--bg)', cursor: 'pointer', transition: 'all 0.15s', width: '100%'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#3B82F6'; e.currentTarget.style.background = '#f8fafc'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg)'; }}
                                    >
                                        <span style={{ fontSize: '22px', flexShrink: 0 }}>{tool.emoji}</span>
                                        <div>
                                            <div style={{ fontSize: '12px', fontWeight: 700, lineHeight: 1.2 }}>{tool.label}</div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                {tool.desc}
                                                {tool.visual && <span style={{ marginLeft: '4px', color: '#3B82F6', fontWeight: 600 }}>• Visual</span>}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ====== FOCUS PANEL (when a tool is active) ====== */}
            {activeTool && (
                <div style={{ borderRadius: '14px', border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--bg)' }}>
                    {/* Panel header */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 16px', background: '#f8fafc', borderBottom: '1px solid var(--border)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button onClick={() => { setActiveTool(null); setContent(''); setChat([]); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px',
                                    borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)',
                                    cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)'
                                }}>
                                <ArrowLeft size={12} /> Herramientas
                            </button>
                            <span style={{ fontSize: '18px' }}>{currentTool?.emoji}</span>
                            <span style={{ fontWeight: 700, fontSize: '14px' }}>{currentTool?.label}</span>
                            {currentTool?.visual && (
                                <span style={{ padding: '1px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 600, background: '#EFF6FF', color: '#3B82F6' }}>
                                    Vista previa
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {content && !loading && (
                                <>
                                    <button onClick={() => copyToClipboard(htmlContent || content)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px',
                                            border: '1px solid var(--border)', background: copied ? '#F0FDF4' : 'var(--bg)',
                                            cursor: 'pointer', fontSize: '11px', fontWeight: 600,
                                            color: copied ? '#16A34A' : 'var(--text-secondary)'
                                        }}>
                                        {copied ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> {htmlContent ? 'Copiar HTML' : 'Copiar'}</>}
                                    </button>
                                    <button onClick={() => downloadFile(htmlContent || content, htmlContent ? 'html' : 'md')}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px',
                                            border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer',
                                            fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)'
                                        }}>
                                        <Download size={12} /> {htmlContent ? '.html' : '.md'}
                                    </button>
                                    <button onClick={() => runTool(activeTool)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '6px',
                                            border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer',
                                            fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)'
                                        }}>
                                        <RefreshCw size={12} /> Regenerar
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Loading state */}
                    {loading && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', gap: '12px' }}>
                            <Loader size={28} className="spin" style={{ color: '#3B82F6' }} />
                            <div style={{ fontWeight: 600, fontSize: '14px' }}>Generando {currentTool?.label}...</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>La IA está analizando tu curso y creando contenido profesional.</div>
                        </div>
                    )}

                    {/* Content area */}
                    {!loading && content && (
                        <div style={{ display: 'flex', minHeight: '500px' }}>
                            {/* Main content */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                {htmlContent ? (
                                    /* HTML Preview */
                                    <div style={{ flex: 1, padding: '16px', background: '#f1f5f9' }}>
                                        <iframe
                                            srcDoc={htmlContent}
                                            style={{
                                                width: '100%', height: '100%', minHeight: '460px',
                                                border: '1px solid var(--border)', borderRadius: '8px',
                                                background: 'white'
                                            }}
                                            sandbox="allow-same-origin"
                                            title="Preview"
                                        />
                                    </div>
                                ) : (
                                    /* Markdown content */
                                    <div style={{
                                        flex: 1, padding: '20px 24px', fontSize: '13px', lineHeight: 1.7,
                                        overflowY: 'auto', maxHeight: '500px'
                                    }} dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
                                )}
                            </div>

                            {/* AI Chat Sidebar */}
                            <div style={{
                                width: '300px', borderLeft: '1px solid var(--border)',
                                display: 'flex', flexDirection: 'column', background: '#fafbfc'
                            }}>
                                <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                                    <div style={{ fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Sparkles size={13} style={{ color: '#3B82F6' }} /> Refinar con IA
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                        El agente actualiza el contenido en cada mensaje.
                                    </div>
                                </div>

                                {/* Chat messages */}
                                <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
                                    {chat.length === 0 && (
                                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                                                Pide cambios al contenido generado:
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                {[
                                                    'Hazlo más corto',
                                                    'Tono más persuasivo',
                                                    'Agrega más emojis',
                                                    'Cambia los colores a tonos cálidos',
                                                    'Hazlo más formal',
                                                ].map(s => (
                                                    <button key={s} onClick={() => { setChatInput(s); }}
                                                        style={{
                                                            padding: '6px 10px', borderRadius: '8px', fontSize: '11px',
                                                            background: 'var(--bg)', border: '1px solid var(--border)',
                                                            cursor: 'pointer', color: 'var(--text-secondary)', textAlign: 'left',
                                                            transition: 'all 0.15s'
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#3B82F6'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                                                    >✨ {s}</button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {chat.map((msg, i) => (
                                        <div key={i} style={{
                                            marginBottom: '8px', padding: '8px 10px', borderRadius: '8px',
                                            fontSize: '12px', lineHeight: 1.5,
                                            background: msg.role === 'user' ? '#EFF6FF' : '#F0FDF4',
                                            color: msg.role === 'user' ? '#1E40AF' : '#166534',
                                            textAlign: msg.role === 'user' ? 'right' : 'left'
                                        }}>
                                            {msg.text}
                                        </div>
                                    ))}
                                    {refining && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px', fontSize: '12px', color: '#3B82F6' }}>
                                            <Loader size={12} className="spin" /> Actualizando...
                                        </div>
                                    )}
                                </div>

                                {/* Chat input */}
                                <div style={{ padding: '10px 14px', borderTop: '1px solid var(--border)' }}>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <input type="text" placeholder="Ej: Hazlo más corto..."
                                            value={chatInput} onChange={e => setChatInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && !refining && handleRefine()}
                                            disabled={refining}
                                            style={{
                                                flex: 1, padding: '8px 10px', borderRadius: '8px',
                                                border: '1px solid var(--border)', fontSize: '12px',
                                                outline: 'none', background: 'var(--bg)'
                                            }}
                                        />
                                        <button onClick={handleRefine} disabled={refining || !chatInput.trim()}
                                            style={{
                                                padding: '8px 12px', borderRadius: '8px', border: 'none',
                                                background: '#3B82F6', color: 'white', cursor: refining || !chatInput.trim() ? 'not-allowed' : 'pointer',
                                                opacity: refining || !chatInput.trim() ? 0.5 : 1, display: 'flex', alignItems: 'center'
                                            }}>
                                            {refining ? <Loader size={14} className="spin" /> : <Send size={14} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {/* ====== SALES PLAYGROUND MODAL ====== */}
            {showSalesTest && (
                <SalesPlayground
                    agent={{
                        id: 'sales-default',
                        name: 'Asistente de Ventas',
                        role: 'Estratega Comercial',
                        personality: 'enthusiastic',
                        avatar: '🚀',
                        tone: 'Persuasivo, empático y enfocado en resultados.',
                        systemPrompt: 'Tu objetivo es vender este curso. Resalta los beneficios y maneja objeciones.'
                    } as AiAgent}
                    courseContext={item}
                    orgProfile={profile}
                    onClose={() => setShowSalesTest(false)}
                />
            )}
        </div>
    );
}
