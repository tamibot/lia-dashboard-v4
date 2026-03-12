import { useState, useRef, useEffect } from 'react';
import {
    Upload, FileText, Check, Loader, Wand2,
    BookOpen, DollarSign, Layout, Video,
    MessageSquare, Send, Paperclip, X, File, Link as LinkIcon, Sparkles
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { analyzeRawText, analyzeFileContent, completeField, reviewContent } from '../lib/gemini';
import { courseService } from '../lib/services/course.service';
import type { Attachment, ContactInfo } from '../lib/types';

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
    // Postulacion fields
    methods?: string[];
    modalities?: string[];
    dates?: { event: string; date: string }[];
    // Subscripcion fields
    frequency?: 'mensual' | 'anual' | 'trimestral';
}

const INITIAL_STATE: CourseData = {
    type: 'curso',
    title: '',
    description: '',
    objectives: [],
    targetAudience: '',
    modality: 'online',
    duration: '',
    hours: null,
    startDate: null,
    schedule: null,
    syllabus: [],
    instructor: '',
    instructorBio: '',
    price: null,
    currency: 'USD',
    maxStudents: null,
    category: 'Negocios',
    prerequisites: null,
    certification: null,
    promotions: null,
    requirements: [],
    contactInfo: null,
    missing: [],
    painPoints: [],
    guarantee: '',
    socialProof: [],
    faqs: [],
    bonuses: [],
    callToAction: '',
    idealStudentProfile: '',
    competitiveAdvantage: '',
    urgencyTriggers: [],
    objectionHandlers: [],
    successStories: [],
    attachments: [],
    registrationLink: '',
    methods: [],
    modalities: [],
    dates: [],
    frequency: 'mensual'
};

type AnalysisStatus = 'idle' | 'analyzing' | 'success' | 'error';
type Tab = 'upload' | 'details' | 'content' | 'marketing';

// Completeness calculation — fields that matter for sales readiness
function calcCompleteness(d: CourseData): { percent: number; missing: string[] } {
    const checks: [boolean, string][] = [
        [!!d.title, 'Título'],
        [!!d.description && d.description.length > 20, 'Descripción detallada'],
        [d.objectives.length > 0, 'Objetivos'],
        [!!d.targetAudience, 'Público objetivo'],
        [!!d.instructor, 'Instructor / Speaker'],
        [d.price !== null && d.price > 0, 'Precio'],
        [d.syllabus.length > 0, 'Temario / Malla curricular'],
        // Commercial fields
        [(d.benefits?.length || 0) > 0, 'Beneficios / Transformación'],
        [(d.painPoints?.length || 0) > 0, 'Dolores del alumno'],
        [!!d.guarantee, 'Garantía'],
        [!!d.callToAction, 'Call to Action'],
        [!!d.idealStudentProfile, 'Perfil del estudiante ideal'],
        [!!d.competitiveAdvantage, 'Ventaja competitiva'],
        [(d.urgencyTriggers?.length || 0) > 0, 'Gatillos de urgencia'],
        [(d.objectionHandlers?.length || 0) > 0, 'Manejo de objeciones'],
        [(d.successStories?.length || 0) > 0, 'Casos de éxito'],
        [(d.faqs?.length || 0) > 0, 'Preguntas frecuentes'],
    ];
    const filled = checks.filter(([ok]) => ok).length;
    const missing = checks.filter(([ok]) => !ok).map(([, label]) => label);
    return { percent: Math.round((filled / checks.length) * 100), missing };
}

export default function CourseUpload() {
    const navigate = useNavigate();
    const { id } = useParams(); // Get ID from URL
    const [status, setStatus] = useState<AnalysisStatus>('idle');
    const [data, setData] = useState<CourseData>(INITIAL_STATE);
    const [text, setText] = useState('');
    const [youtubeUrl, setYoutubeUrl] = useState('');
    const [activeTab, setActiveTab] = useState<Tab>('upload');

    // Chat & AI State
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState<{ role: string, content: string }[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [applyingChange, setApplyingChange] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Load data if editing
    useEffect(() => {
        const fetchItem = async () => {
            if (!id) {
                setData(INITIAL_STATE);
                setStatus('idle');
                setChatMessages([]);
                setActiveTab('upload');
                return;
            }

            try {
                // Use analyzing as a temporary loading state
                setStatus('analyzing');
                const found = await courseService.getById(id);

                if (found) {
                    // Determine type based on properties or stored type
                    let type: 'curso' | 'programa' | 'webinar' = 'curso';
                    if (found.type) {
                        type = found.type;
                    } else if ('totalDuration' in found || 'courses' in found) {
                        type = 'programa';
                    } else if ('speaker' in found || 'date' in found) {
                        type = 'webinar';
                    }

                    // Robust mapping from API to local form state
                    setData({
                        type,
                        title: found.title || '',
                        description: found.description || '',
                        objectives: found.objectives || [],
                        targetAudience: found.targetAudience || '',
                        modality: found.modality || 'online',
                        duration: found.duration || found.totalDuration || '',
                        hours: found.hours || found.totalHours || null,
                        startDate: found.startDate || found.date || null,
                        schedule: found.schedule || found.time || null,
                        syllabus: found.syllabus || found.courses || [],
                        instructor: found.instructor || found.speaker || '',
                        instructorBio: found.instructorBio || found.speakerBio || '',
                        price: found.price || null,
                        currency: found.currency || 'USD',
                        maxStudents: found.maxStudents || null,
                        category: found.category || 'General',
                        prerequisites: found.prerequisites || null,
                        certification: found.certification || null,
                        promotions: found.promotions || null,
                        requirements: found.requirements || [],
                        contactInfo: found.contactInfo || null,
                        missing: [],
                        benefits: found.benefits || [],
                        painPoints: found.painPoints || [],
                        guarantee: found.guarantee || '',
                        socialProof: found.socialProof || [],
                        faqs: found.faqs || [],
                        bonuses: found.bonuses || [],
                        callToAction: found.callToAction || '',
                        idealStudentProfile: found.idealStudentProfile || '',
                        competitiveAdvantage: found.competitiveAdvantage || '',
                        urgencyTriggers: found.urgencyTriggers || [],
                        objectionHandlers: found.objectionHandlers || [],
                        successStories: found.successStories || [],
                        registrationLink: found.registrationLink || '',
                        attachments: found.attachments || []
                    });
                    setActiveTab('details'); // Skip upload step
                    setStatus('success'); // Mark as loaded
                }
            } catch (err) {
                console.error("Error fetching course detail:", err);
                setStatus('error');
            }
        };

        fetchItem();
    }, [id]);

    const handleAnalyze = async () => {
        if (!text && !youtubeUrl && !selectedFile) return;

        setStatus('analyzing');
        try {
            let resultJson = '';

            // Prioritize Video/File analysis
            if (selectedFile) {
                const file = selectedFile;
                const reader = new FileReader();
                const content = await new Promise<string>((resolve) => {
                    reader.onload = (e) => resolve(e.target?.result as string);
                    reader.readAsDataURL(file);
                });
                resultJson = await analyzeFileContent(content, file.name, data.type);
            } else if (youtubeUrl) {
                // If YouTube URL is present, ask AI to analyze it (it can't watch it, but can analyze title/context provided)
                // For a real app, you'd use a server to get transcript. Here we pass URL + Context.
                resultJson = await analyzeRawText(`Analiza este recurso: ${youtubeUrl}\n\nContexto adicional: ${text}`, data.type);
            } else {
                resultJson = await analyzeRawText(text, data.type);
            }

            const parsed = JSON.parse(resultJson);

            // Calculate new attachment to add
            let attachmentToAdd: any = null;
            if (selectedFile) {
                const file = selectedFile;
                attachmentToAdd = {
                    id: Date.now().toString(),
                    name: file.name,
                    url: '#', // In a real app, upload result URL
                    type: file.type.includes('pdf') ? 'pdf' : file.type.includes('image') ? 'image' : 'video',
                    size: (file.size / 1024 / 1024).toFixed(2) + ' MB'
                };
            } else if (youtubeUrl) {
                attachmentToAdd = {
                    id: Date.now().toString(),
                    name: 'YouTube Resource',
                    url: youtubeUrl,
                    type: 'link'
                };
            }

            // Merge with initial state to ensure all fields exist
            setData(prev => {
                const currentAttachments = prev.attachments || [];
                const updatedAttachments = attachmentToAdd
                    ? [...currentAttachments, attachmentToAdd]
                    : currentAttachments;

                return {
                    ...prev,
                    ...parsed,
                    objectives: parsed.objectives || [],
                    syllabus: parsed.syllabus || [],
                    requirements: parsed.requirements || [],
                    attachments: updatedAttachments
                };
            });

            setStatus('success');
            setActiveTab('details');

            // Proactive Review
            try {
                const reviewJson = await reviewContent(parsed);
                const review = JSON.parse(reviewJson);
                setChatMessages([
                    { role: 'assistant', content: '✅ Información extraída.' },
                    { role: 'assistant', content: `🕵️ **Auditoría de Ventas:**\n\n**Puntaje:** ${review.score}/10\n\n_${review.critique}_\n\n**Sugerencias:**\n${review.suggestions.map((s: any) => `• ${s}`).join('\n')}` }
                ]);
            } catch (e) {
                setChatMessages([{ role: 'assistant', content: '¡He extraído la información! Revisa los campos.' }]);
            }

        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    const handleChatAction = async () => {
        if (!chatInput.trim()) return;
        const msg = chatInput;
        setChatInput('');
        setChatMessages(prev => [...prev, { role: 'user', content: msg }]);
        setApplyingChange(true);

        try {
            // Context is current form data
            const context = JSON.stringify(data);
            const responseJson = await completeField(context, msg);
            const response = JSON.parse(responseJson);

            if (response.updates) {
                setData(prev => ({ ...prev, ...response.updates }));
                setChatMessages(prev => [...prev, { role: 'assistant', content: `✅ ${response.message}` }]);
            } else {
                setChatMessages(prev => [...prev, { role: 'assistant', content: response.message || 'No pude entender el cambio solicitado.' }]);
            }
        } catch (e) {
            setChatMessages(prev => [...prev, { role: 'assistant', content: '❌ Error al procesar la solicitud.' }]);
        } finally {
            setApplyingChange(false);
        }
    };

    const handleSave = async () => {
        // Basic validation
        if (!data.title) {
            alert('Por favor, ingresa un título');
            return;
        }

        try {
            setStatus('analyzing');

            // Strip UI-only fields NOT in Prisma schema
            // Strip UI-only and read-only fields NOT in Prisma schema
            const { missing, contactInfo, updatedAt, createdAt, id: _id, orgId: _orgId, ...cleanData } = data as any;

            const payload = {
                ...cleanData,
                price: parseFloat(cleanData.price) || 0,
                status: 'borrador',
                // Ensure arrays are never null
                objectives: cleanData.objectives || [],
                requirements: cleanData.requirements || [],
                benefits: cleanData.benefits || [],
                painPoints: cleanData.painPoints || [],
                socialProof: cleanData.socialProof || [],
                bonuses: cleanData.bonuses || [],
                tags: cleanData.tags || [],
                tools: cleanData.tools || [],
                faqs: cleanData.faqs || [],
                syllabus: cleanData.syllabus || [],
                urgencyTriggers: cleanData.urgencyTriggers || [],
                objectionHandlers: cleanData.objectionHandlers || [],
                successStories: cleanData.successStories || [],
            };

            if (id) {
                await courseService.update(id, payload);
            } else {
                await courseService.create(payload);
            }

            navigate('/courses');
        } catch (error: any) {
            console.error("Error saving course:", error);
            alert("Error al guardar: " + (error.message || "Intenta de nuevo"));
            setStatus('error');
        }
    };

    const addAttachment = () => {
        const newAtt: Attachment = {
            id: Date.now().toString(),
            name: 'Nuevo Recurso.pdf',
            type: 'pdf',
            url: '#',
            size: '1.2 MB'
        };
        setData(prev => ({ ...prev, attachments: [...prev.attachments, newAtt] }));
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative transition-all duration-300">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center z-10">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/courses')} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">
                                {id ? `Editar ${data.type === 'webinar' ? 'Webinar' : data.type === 'programa' ? 'Programa' : data.type === 'postulacion' ? 'Postulación' : data.type === 'subscripcion' ? 'Suscripción' : 'Curso'}` : `Crear Nuevo ${data.type === 'webinar' ? 'Webinar' : data.type === 'postulacion' ? 'Postulación' : data.type === 'subscripcion' ? 'Suscripción' : 'Curso'}`}
                            </h1>
                            <p className="text-sm text-gray-500 flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${status === 'success' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                                {id ? 'Editando recurso existente' : status === 'success' ? 'Datos extraídos con IA' : 'Borrador'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {/* Completeness Indicator */}
                        {status === 'success' && (() => {
                            const { percent, missing } = calcCompleteness(data);
                            const color = percent >= 80 ? 'bg-green-500' : percent >= 50 ? 'bg-yellow-500' : 'bg-red-400';
                            return (
                                <div className="group relative">
                                    <div className="flex items-center gap-2 cursor-help">
                                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${percent}%` }} />
                                        </div>
                                        <span className={`text-xs font-bold ${percent >= 80 ? 'text-green-600' : percent >= 50 ? 'text-yellow-600' : 'text-red-500'}`}>
                                            {percent}%
                                        </span>
                                    </div>
                                    {missing.length > 0 && (
                                        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-50 hidden group-hover:block">
                                            <p className="text-xs font-bold text-gray-700 mb-2">Campos faltantes:</p>
                                            <ul className="text-xs text-gray-500 space-y-1">
                                                {missing.map((m, i) => <li key={i} className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0" />{m}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                        <button onClick={() => setIsChatOpen(!isChatOpen)} className={`btn gap-2 ${isChatOpen ? 'btn-primary' : 'btn-ghost'}`}>
                            <MessageSquare size={18} /> Asistente IA
                        </button>
                        <button onClick={handleSave} className="btn btn-primary gap-2 px-6">
                            <Check size={18} /> Guardar Registro
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-5xl mx-auto">

                        {/* Tabs */}
                        <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
                            {[
                                { id: 'upload', label: '1. Cargar Contenido', icon: Upload },
                                { id: 'details', label: '2. Detalles Básicos', icon: Layout },
                                { id: 'content', label: '3. Temario', icon: BookOpen },
                                { id: 'tools', label: '4. Herramientas y Requisitos', icon: FileText },
                                { id: 'marketing', label: '5. Venta y Marketing', icon: DollarSign },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as Tab)}
                                    className={`flex whitespace-nowrap items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                        ? 'border-blue-600 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <tab.icon size={16} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Step 1: Upload */}
                        {activeTab === 'upload' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                                <div className="space-y-6">
                                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                            <FileText className="text-blue-600" size={20} />
                                            Pegar Información Texto
                                        </h3>
                                        <textarea
                                            className="w-full h-48 p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                            placeholder="Pega aquí el temario, brochure o notas del experto..."
                                            value={text}
                                            onChange={e => setText(e.target.value)}
                                        />
                                    </div>
                                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                            <Video className="text-red-600" size={20} />
                                            Enlace de YouTube
                                        </h3>
                                        <input
                                            className="input w-full"
                                            placeholder="https://youtube.com/watch?v=..."
                                            value={youtubeUrl}
                                            onChange={e => setYoutubeUrl(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-white p-6 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-500 transition-colors h-full flex flex-col items-center justify-center text-center cursor-pointer relative" onClick={() => fileInputRef.current?.click()}>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept=".pdf,.docx,.txt,video/*"
                                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                        />
                                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                                            <Upload className="text-blue-600 w-8 h-8" />
                                        </div>
                                        <h3 className="font-bold text-gray-900">Subir Archivo o Video</h3>
                                        <p className="text-sm text-gray-500 mt-2 max-w-xs">
                                            Arrastra tu PDF, Word o Video (MP4) aquí. La IA analizará el contenido visual o textual.
                                        </p>
                                        {selectedFile && (
                                            <div className="mt-4 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium flex items-center gap-2">
                                                <Check size={14} />
                                                {selectedFile.name}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="col-span-full">
                                    <button
                                        onClick={handleAnalyze}
                                        disabled={status === 'analyzing' || (!text && !youtubeUrl && !selectedFile)}
                                        className="btn btn-primary w-full py-4 text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {status === 'analyzing' ? (
                                            <span className="flex items-center gap-2"><Loader className="animate-spin" /> Analizando Contenido...</span>
                                        ) : (
                                            <span className="flex items-center gap-2"><Wand2 /> Analizar y Extraer Datos</span>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Details */}
                        {activeTab === 'details' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-gray-700">Título del Curso</label>
                                    <input className="input w-full font-bold text-lg" value={data.title} onChange={e => setData({ ...data, title: e.target.value })} />

                                    <label className="block text-sm font-medium text-gray-700">Descripción Persuasiva</label>
                                    <textarea className="input w-full h-32" value={data.description} onChange={e => setData({ ...data, description: e.target.value })} />

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Tipo de Registro</label>
                                            <select className="input w-full" value={data.type} onChange={e => setData({ ...data, type: e.target.value as any })}>
                                                <option value="curso">Curso</option>
                                                <option value="programa">Programa</option>
                                                <option value="webinar">Webinar</option>
                                                <option value="taller">Taller</option>
                                                <option value="subscripcion">Suscripción</option>
                                                <option value="asesoria">Asesoría</option>
                                                <option value="postulacion">Postulación</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Modalidad</label>
                                            <select className="input w-full" value={data.modality} onChange={e => setData({ ...data, modality: e.target.value as any })}>
                                                <option value="online">Online</option>
                                                <option value="presencial">Presencial</option>
                                                <option value="hibrido">Híbrido</option>
                                                <option value="remoto">Remoto</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4 bg-white p-6 rounded-xl border border-gray-200">
                                    <h3 className="font-bold border-b pb-2 mb-4">Información del Instructor</h3>
                                    <div className="flex gap-4">
                                        <div className="w-16 h-16 bg-gray-200 rounded-full flex-shrink-0"></div>
                                        <div className="flex-1 space-y-3">
                                            <input className="input w-full" placeholder="Nombre Instructor" value={data.instructor} onChange={e => setData({ ...data, instructor: e.target.value })} />
                                            <textarea className="input w-full h-20 text-sm" placeholder="Bio corta..." value={data.instructorBio} onChange={e => setData({ ...data, instructorBio: e.target.value })} />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-full">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Público Objetivo</label>
                                    <textarea className="input w-full h-20" value={data.targetAudience} onChange={e => setData({ ...data, targetAudience: e.target.value })} />
                                </div>

                                <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Fecha de Inicio / Evento</label>
                                        <input type="date" className="input w-full" value={data.startDate?.split('T')[0] || ''} onChange={e => setData({ ...data, startDate: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Duración / Horas</label>
                                        <div className="flex gap-2">
                                            <input className="input w-2/3" placeholder="Ej: 4 semanas" value={data.duration || ''} onChange={e => setData({ ...data, duration: e.target.value })} />
                                            <input type="number" className="input w-1/3" placeholder="Hrs" value={data.hours || ''} onChange={e => setData({ ...data, hours: Number(e.target.value) })} />
                                        </div>
                                    </div>
                                </div>
                                {data.type === 'webinar' && (
                                    <div className="col-span-full">
                                        <label className="block text-sm font-medium text-gray-700">Link de Registro (Zoom, Eventbrite, etc)</label>
                                        <input className="input w-full" placeholder="https://zoom.us/webinar/..." value={data.registrationLink || ''} onChange={e => setData({ ...data, registrationLink: e.target.value })} />
                                    </div>
                                )}

                                {data.type === 'postulacion' && (
                                    <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-blue-50/30 rounded-xl border border-blue-100 mt-4">
                                        <div className="col-span-full">
                                            <h4 className="font-bold text-blue-800 flex items-center gap-2 mb-4">
                                                <Layout size={18} /> Detalles de Postulación
                                            </h4>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Métodos de Ingreso</label>
                                            <input className="input w-full" placeholder="Ej: Examen, Entrevista, Méritos" value={data.methods?.join(', ') || ''}
                                                onChange={e => setData({ ...data, methods: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Modalidades Disponibles</label>
                                            <input className="input w-full" placeholder="Ej: Ordinario, Especial, Beca" value={data.modalities?.join(', ') || ''}
                                                onChange={e => setData({ ...data, modalities: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
                                        </div>
                                    </div>
                                )}

                                {data.type === 'subscripcion' && (
                                    <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-purple-50/30 rounded-xl border border-purple-100 mt-4">
                                        <div className="col-span-full">
                                            <h4 className="font-bold text-purple-800 flex items-center gap-2 mb-4">
                                                <DollarSign size={18} /> Plan de Suscripción
                                            </h4>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Frecuencia de Pago</label>
                                            <select className="input w-full" value={data.frequency} onChange={e => setData({ ...data, frequency: e.target.value as any })}>
                                                <option value="mensual">Mensual</option>
                                                <option value="trimestral">Trimestral</option>
                                                <option value="anual">Anual</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Precio per Periodo</label>
                                            <div className="flex gap-2">
                                                <input type="number" className="input w-full" placeholder="0.00" value={data.price || ''} onChange={e => setData({ ...data, price: Number(e.target.value) })} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2.5: Tools and Requirements */}
                        {activeTab === 'tools' as Tab && (
                            <div className="grid grid-cols-1 gap-8 animate-fade-in bg-white p-6 rounded-xl border border-gray-200">
                                <div>
                                    <h3 className="font-bold text-lg mb-2">Herramientas a Enseñar</h3>
                                    <p className="text-sm text-gray-500 mb-4">¿Qué plataformas, softwares o herramientas se enseñarán durante el programa?</p>
                                    <input className="input w-full" placeholder="Ej: Excel, ChatGPT, n8n, Python" value={data.tools?.join(', ') || ''} onChange={e => setData({ ...data, tools: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
                                </div>
                                <hr className="border-gray-100" />
                                <div>
                                    <h3 className="font-bold text-lg mb-2">Requisitos Previos</h3>
                                    <p className="text-sm text-gray-500 mb-4">¿Qué necesita el estudiante antes de empezar? (Ej: Laptop, Experiencia previa).</p>
                                    <input className="input w-full" placeholder="Ej: Experiencia previa en ventas, Laptop moderna" value={data.requirements?.join(', ') || ''} onChange={e => setData({ ...data, requirements: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} />
                                </div>
                            </div>
                        )}

                        {/* Step 3: Content */}
                        {activeTab === 'content' && (
                            <div className="space-y-8 animate-fade-in">
                                <div className="bg-white p-6 rounded-xl border border-gray-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-lg">Malla Curricular</h3>
                                        <button className="text-sm text-blue-600 font-medium hover:underline">+ Agregar Módulo</button>
                                    </div>
                                    <div className="space-y-4">
                                        {data.syllabus.map((mod, idx) => (
                                            <div key={idx} className="border border-gray-100 rounded-lg p-4 hover:border-blue-300 transition-colors">
                                                <div className="flex justify-between font-bold text-gray-800 mb-2">
                                                    <span>{mod.module || `Módulo ${idx + 1}`}</span>
                                                    <span className="text-gray-400 text-sm font-normal">Editar</span>
                                                </div>
                                                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-2">
                                                    {mod.topics?.map((t: string, i: number) => <li key={i}>{t}</li>)}
                                                </ul>
                                            </div>
                                        ))}
                                        {data.syllabus.length === 0 && <p className="text-gray-400 italic text-center py-8">No se ha detectado temario aún.</p>}
                                    </div>
                                </div>

                                {/* Attachments Section */}
                                <div className="bg-white p-6 rounded-xl border border-gray-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-lg">Recursos Descargables (Brochure, Guías)</h3>
                                        <button onClick={addAttachment} className="btn btn-sm btn-outline gap-2">
                                            <Paperclip size={14} /> Adjuntar
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {data.attachments.map((att) => (
                                            <div key={att.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-white rounded shadow-sm">
                                                        {att.type === 'pdf' ? <File className="text-red-500" size={20} /> : <LinkIcon className="text-blue-500" size={20} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-sm text-gray-900">{att.name}</p>
                                                        <p className="text-xs text-gray-500">{att.size || 'Enlace externo'}</p>
                                                    </div>
                                                </div>
                                                <button className="text-gray-400 hover:text-red-500"><X size={16} /></button>
                                            </div>
                                        ))}
                                        {data.attachments.length === 0 && (
                                            <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 text-sm">
                                                Arrastra archivos aquí o haz clic en "Adjuntar"
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Marketing */}
                        {activeTab === 'marketing' && (
                            <div className="space-y-8 animate-fade-in">
                                {/* Pricing & Guarantee */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-white p-6 rounded-xl border border-gray-200">
                                        <h3 className="font-bold text-lg mb-4 text-green-700 flex items-center gap-2"><DollarSign size={20} /> Oferta Irresistible</h3>
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700">Precio</label>
                                                    <input type="number" className="input w-full" value={data.price || ''} onChange={e => setData({ ...data, price: Number(e.target.value) })} />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700">Moneda</label>
                                                    <select className="input w-full" value={data.currency} onChange={e => setData({ ...data, currency: e.target.value })}>
                                                        <option value="USD">USD</option>
                                                        <option value="PEN">PEN</option>
                                                        <option value="MXN">MXN</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700">Promoción (Descuento)</label>
                                                <input className="input w-full bg-yellow-50 border-yellow-200" placeholder="Ej: 50% OFF por 24 horas" value={data.promotions || ''} onChange={e => setData({ ...data, promotions: e.target.value })} />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700">Gatillos de Urgencia (uno por línea)</label>
                                                <textarea
                                                    className="input w-full h-16"
                                                    placeholder="Solo 5 cupos disponibles&#10;Precio sube en 48 horas"
                                                    value={data.urgencyTriggers?.join('\n') || ''}
                                                    onChange={e => setData({ ...data, urgencyTriggers: e.target.value.split('\n').filter(Boolean) })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-xl border border-gray-200">
                                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">🛡️ Garantía y Bonos</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700">Garantía de Riesgo Cero</label>
                                                <textarea
                                                    className="input w-full h-20"
                                                    placeholder="Ej: Si no te encanta en 30 días, te devolvemos el 100%..."
                                                    value={data.guarantee || ''}
                                                    onChange={e => setData({ ...data, guarantee: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700">Bonos (Uno por línea)</label>
                                                <textarea
                                                    className="input w-full h-20"
                                                    placeholder="- Ebook de Regalo&#10;- Plantilla Excel"
                                                    value={data.bonuses?.join('\n') || ''}
                                                    onChange={e => setData({ ...data, bonuses: e.target.value.split('\n') })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Deep Psychology */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-white p-6 rounded-xl border border-gray-200">
                                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">😩 Dolores (Antes)</h3>
                                        <p className="text-xs text-gray-500 mb-2">¿Qué problemas tiene tu alumno ideal hoy?</p>
                                        <textarea
                                            className="input w-full h-32 bg-red-50 border-red-100 focus:border-red-300"
                                            placeholder="- Siento que pierdo el tiempo...&#10;- No logro vender..."
                                            value={data.painPoints?.join('\n') || ''}
                                            onChange={e => setData({ ...data, painPoints: e.target.value.split('\n') })}
                                        />
                                    </div>

                                    <div className="bg-white p-6 rounded-xl border border-gray-200">
                                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-blue-600"><Sparkles size={20} /> Transformación (Después)</h3>
                                        <p className="text-xs text-gray-500 mb-2">¿Qué logrará tras tomar el curso?</p>
                                        <textarea
                                            className="input w-full h-32 bg-blue-50 border-blue-100 focus:border-blue-300"
                                            placeholder="- Certificado Validado&#10;- Aumento de sueldo..."
                                            value={data.benefits?.join('\n') || ''}
                                            onChange={e => setData({ ...data, benefits: e.target.value.split('\n') })}
                                        />
                                    </div>
                                </div>

                                {/* Authority & Social Proof */}
                                <div className="bg-white p-6 rounded-xl border border-gray-200">
                                    <h3 className="font-bold text-lg mb-4">🏆 Prueba Social</h3>
                                    <textarea
                                        className="input w-full h-24"
                                        placeholder="Pegar testimonios cortos o menciones en prensa (uno por línea)..."
                                        value={data.socialProof?.join('\n') || ''}
                                        onChange={e => setData({ ...data, socialProof: e.target.value.split('\n') })}
                                    />
                                </div>

                                {/* Sales Strategy */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="bg-white p-6 rounded-xl border border-gray-200">
                                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">🎯 Call to Action</h3>
                                        <textarea
                                            className="input w-full h-20"
                                            placeholder="Ej: Inscríbete ahora y transforma tu carrera profesional..."
                                            value={data.callToAction || ''}
                                            onChange={e => setData({ ...data, callToAction: e.target.value })}
                                        />
                                    </div>
                                    <div className="bg-white p-6 rounded-xl border border-gray-200">
                                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">🧑‍🎓 Perfil del Estudiante Ideal</h3>
                                        <textarea
                                            className="input w-full h-20"
                                            placeholder="Ej: Profesionales de 25-40 años que buscan especializarse en marketing digital..."
                                            value={data.idealStudentProfile || ''}
                                            onChange={e => setData({ ...data, idealStudentProfile: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-xl border border-gray-200">
                                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">💎 Ventaja Competitiva</h3>
                                    <p className="text-xs text-gray-500 mb-2">¿Qué hace este producto diferente a los demás? ¿Por qué elegirte a ti?</p>
                                    <textarea
                                        className="input w-full h-24"
                                        placeholder="Ej: Somos la única universidad en Latam que ofrece esta certificación con modalidad 100% online y con profesores activos en la industria..."
                                        value={data.competitiveAdvantage || ''}
                                        onChange={e => setData({ ...data, competitiveAdvantage: e.target.value })}
                                    />
                                </div>

                                {/* Objection Handlers */}
                                <div className="bg-white p-6 rounded-xl border border-gray-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg">🛡️ Manejo de Objeciones</h3>
                                            <p className="text-xs text-gray-500 mt-1">Respuestas preparadas para las objeciones más comunes de tus prospectos</p>
                                        </div>
                                        <button
                                            onClick={() => setData(prev => ({ ...prev, objectionHandlers: [...(prev.objectionHandlers || []), { objection: '', response: '' }] }))}
                                            className="text-sm text-blue-600 hover:underline font-bold"
                                        >
                                            + Agregar Objeción
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {data.objectionHandlers?.map((oh, idx) => (
                                            <div key={idx} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                <span className="font-bold text-orange-400 mt-2 text-xs">OBJ{idx + 1}</span>
                                                <div className="flex-1 space-y-2">
                                                    <input
                                                        className="input w-full font-bold"
                                                        placeholder='Ej: "Es muy caro para mí"'
                                                        value={oh.objection}
                                                        onChange={e => {
                                                            const updated = [...(data.objectionHandlers || [])];
                                                            updated[idx] = { ...updated[idx], objection: e.target.value };
                                                            setData({ ...data, objectionHandlers: updated });
                                                        }}
                                                    />
                                                    <textarea
                                                        className="input w-full h-16 text-sm"
                                                        placeholder="Respuesta sugerida para el vendedor/agente..."
                                                        value={oh.response}
                                                        onChange={e => {
                                                            const updated = [...(data.objectionHandlers || [])];
                                                            updated[idx] = { ...updated[idx], response: e.target.value };
                                                            setData({ ...data, objectionHandlers: updated });
                                                        }}
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => setData(prev => ({ ...prev, objectionHandlers: prev.objectionHandlers?.filter((_, i) => i !== idx) }))}
                                                    className="text-gray-400 hover:text-red-500"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        {(!data.objectionHandlers || data.objectionHandlers.length === 0) && (
                                            <p className="text-gray-400 text-center text-sm italic py-4">No hay objeciones registradas. Agrega las más comunes para que el agente de ventas las maneje.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Success Stories */}
                                <div className="bg-white p-6 rounded-xl border border-gray-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <h3 className="font-bold text-lg">⭐ Casos de Éxito</h3>
                                            <p className="text-xs text-gray-500 mt-1">Historias reales de alumnos o clientes satisfechos</p>
                                        </div>
                                        <button
                                            onClick={() => setData(prev => ({ ...prev, successStories: [...(prev.successStories || []), { name: '', quote: '', result: '' }] }))}
                                            className="text-sm text-blue-600 hover:underline font-bold"
                                        >
                                            + Agregar Caso
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {data.successStories?.map((story, idx) => (
                                            <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                <div className="flex justify-between items-start mb-3">
                                                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">Caso #{idx + 1}</span>
                                                    <button
                                                        onClick={() => setData(prev => ({ ...prev, successStories: prev.successStories?.filter((_, i) => i !== idx) }))}
                                                        className="text-gray-400 hover:text-red-500"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <input
                                                        className="input w-full"
                                                        placeholder="Nombre del alumno"
                                                        value={story.name}
                                                        onChange={e => {
                                                            const updated = [...(data.successStories || [])];
                                                            updated[idx] = { ...updated[idx], name: e.target.value };
                                                            setData({ ...data, successStories: updated });
                                                        }}
                                                    />
                                                    <input
                                                        className="input w-full"
                                                        placeholder="Resultado obtenido"
                                                        value={story.result || ''}
                                                        onChange={e => {
                                                            const updated = [...(data.successStories || [])];
                                                            updated[idx] = { ...updated[idx], result: e.target.value };
                                                            setData({ ...data, successStories: updated });
                                                        }}
                                                    />
                                                </div>
                                                <textarea
                                                    className="input w-full h-16 text-sm mt-2"
                                                    placeholder="Testimonio o cita del alumno..."
                                                    value={story.quote}
                                                    onChange={e => {
                                                        const updated = [...(data.successStories || [])];
                                                        updated[idx] = { ...updated[idx], quote: e.target.value };
                                                        setData({ ...data, successStories: updated });
                                                    }}
                                                />
                                            </div>
                                        ))}
                                        {(!data.successStories || data.successStories.length === 0) && (
                                            <p className="text-gray-400 text-center text-sm italic py-4">No hay casos de éxito aún. Agrega testimonios reales para potenciar la venta.</p>
                                        )}
                                    </div>
                                </div>

                                {/* FAQs */}
                                <div className="bg-white p-6 rounded-xl border border-gray-200">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="font-bold text-lg">❓ Preguntas Frecuentes</h3>
                                        <button
                                            onClick={() => setData(prev => ({ ...prev, faqs: [...(prev.faqs || []), { question: '', answer: '' }] }))}
                                            className="text-sm text-blue-600 hover:underline font-bold"
                                        >
                                            + Agregar Pregunta
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {data.faqs?.map((faq, idx) => (
                                            <div key={idx} className="flex gap-4 items-start p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                <span className="font-bold text-gray-400 mt-2">Q{idx + 1}</span>
                                                <div className="flex-1 space-y-2">
                                                    <input
                                                        className="input w-full font-bold"
                                                        placeholder="Pregunta..."
                                                        value={faq.question}
                                                        onChange={e => {
                                                            const newFaqs = [...(data.faqs || [])];
                                                            newFaqs[idx].question = e.target.value;
                                                            setData({ ...data, faqs: newFaqs });
                                                        }}
                                                    />
                                                    <textarea
                                                        className="input w-full h-20 text-sm"
                                                        placeholder="Respuesta..."
                                                        value={faq.answer}
                                                        onChange={e => {
                                                            const newFaqs = [...(data.faqs || [])];
                                                            newFaqs[idx].answer = e.target.value;
                                                            setData({ ...data, faqs: newFaqs });
                                                        }}
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => setData(prev => ({ ...prev, faqs: prev.faqs?.filter((_, i) => i !== idx) }))}
                                                    className="text-gray-400 hover:text-red-500"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        {(!data.faqs || data.faqs.length === 0) && (
                                            <p className="text-gray-400 text-center text-sm italic py-4">No hay preguntas frecuentes aún.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* AI Assistant Sidebar */}
            <div className={`w-96 bg-white border-l border-gray-200 flex flex-col transition-all duration-300 transform ${isChatOpen ? 'translate-x-0' : 'translate-x-full absolute right-0 h-full shadow-2xl'}`}>
                <div className="p-4 border-b border-gray-200 bg-blue-50 flex justify-between items-center">
                    <h3 className="font-bold text-blue-900 flex items-center gap-2">
                        <Wand2 size={16} /> Asistente de Contenido
                    </h3>
                    <button onClick={() => setIsChatOpen(false)}><X size={18} className="text-blue-400 hover:text-blue-700" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                    {chatMessages.length === 0 && (
                        <div className="text-center text-gray-400 text-sm mt-10 p-4">
                            <p>¡Hola! Soy tu editor personal.</p>
                            <p className="mt-2">Pídeme cosas como:</p>
                            <ul className="mt-2 space-y-2 text-blue-600 cursor-pointer">
                                <li className="hover:underline" onClick={() => setChatInput("Mejora la descripción para que sea más vendedora")}>"Mejora la descripción"</li>
                                <li className="hover:underline" onClick={() => setChatInput("Agrega un módulo de IA al temario")}>"Agrega un módulo sobre IA"</li>
                                <li className="hover:underline" onClick={() => setChatInput("Cambia el precio a 299 USD y pon una oferta")}>"Cambia precio a 299"</li>
                            </ul>
                        </div>
                    )}
                    {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border text-gray-800 shadow-sm'}`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {applyingChange && (
                        <div className="flex gap-2 items-center text-xs text-gray-500 ml-4">
                            <Loader size={12} className="animate-spin" /> Aplicando cambios...
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-200 bg-white">
                    <div className="relative">
                        <input
                            className="w-full pl-4 pr-10 py-3 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            placeholder="Escribe tu instrucción..."
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleChatAction()}
                            disabled={applyingChange}
                        />
                        <button
                            onClick={handleChatAction}
                            disabled={!chatInput.trim() || applyingChange}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-blue-600 hover:bg-blue-100 rounded-full transition-colors disabled:opacity-50"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

