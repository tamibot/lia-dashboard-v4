import { useState, useRef, useEffect } from 'react';
import { analyzeRawText, analyzeFileContent, completeField } from '../lib/gemini';
import { getGeminiKey, addCurso, addPrograma, addWebinar, generateId } from '../lib/storage';
import { Upload, Sparkles, Loader, ArrowLeft, File, CheckCircle2, X, Plus, Send, AlertCircle, Save, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const types = [
    { key: 'auto', label: '🤖 Auto-detectar', desc: 'La IA identifica el tipo' },
    { key: 'curso', label: '📚 Curso Libre', desc: 'Curso individual' },
    { key: 'programa', label: '🎓 Programa', desc: 'Conjunto de cursos' },
    { key: 'webinar', label: '🎤 Webinar/Taller', desc: 'Sesión corta' },
];

interface UploadedFile {
    name: string;
    size: number;
    dataUrl: string;
}

interface SyllabusModule {
    module: string;
    topics: string[];
}

interface CourseData {
    type: string;
    title: string;
    description: string;
    objectives: string[];
    targetAudience: string;
    modality: string;
    duration: string;
    hours: number | null;
    startDate: string | null;
    schedule: string | null;
    syllabus: SyllabusModule[];
    instructor: string | null;
    instructorBio: string | null;
    price: number | null;
    currency: string;
    maxStudents: number | null;
    category: string;
    prerequisites: string | null;
    certification: string | null;
    missing: string[];
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    updates?: Record<string, unknown>; // fields that were updated
    applied?: boolean;
}

const FIELD_LABELS: Record<string, string> = {
    type: 'Tipo', title: 'Título', description: 'Descripción', objectives: 'Objetivos',
    targetAudience: 'Público Objetivo', modality: 'Modalidad', duration: 'Duración',
    hours: 'Horas Totales', startDate: 'Fecha de Inicio', schedule: 'Horario',
    syllabus: 'Temario', instructor: 'Instructor', instructorBio: 'Bio del Instructor',
    price: 'Precio', currency: 'Moneda', maxStudents: 'Cupos Máximos',
    category: 'Categoría', prerequisites: 'Requisitos', certification: 'Certificación',
};

// Normalize syllabus: if AI returns flat strings, convert to modules
function normalizeSyllabus(raw: unknown): SyllabusModule[] {
    if (!raw || !Array.isArray(raw)) return [];
    // If already hierarchical
    if (raw.length > 0 && typeof raw[0] === 'object' && raw[0] !== null && 'module' in raw[0]) {
        return raw as SyllabusModule[];
    }
    // Flat array of strings → group by detecting module headers (bold, numbered, caps)
    const modules: SyllabusModule[] = [];
    let currentModule: SyllabusModule | null = null;
    for (const item of raw) {
        const text = String(item).trim();
        // Detect module headers: starts with **, number+dot, or ALL CAPS
        const isHeader = /^\*\*/.test(text) || /^\d+[\.\)]?\s+[A-ZÁÉÍÓÚ]/.test(text) ||
            (text === text.toUpperCase() && text.length > 5 && !text.startsWith('-'));
        if (isHeader || !currentModule) {
            currentModule = { module: text.replace(/^\*\*|\*\*$/g, '').trim(), topics: [] };
            modules.push(currentModule);
        } else {
            currentModule.topics.push(text.replace(/^[-–•]\s*/, ''));
        }
    }
    return modules.length > 0 ? modules : [{ module: 'Contenido General', topics: raw.map(String) }];
}

function parseAIResponse(raw: string): CourseData | null {
    try {
        let cleaned = raw.trim();
        if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
        }
        const parsed = JSON.parse(cleaned);
        parsed.syllabus = normalizeSyllabus(parsed.syllabus);
        return parsed;
    } catch {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                parsed.syllabus = normalizeSyllabus(parsed.syllabus);
                return parsed;
            } catch { return null; }
        }
        return null;
    }
}

function parseAgentResponse(raw: string): { updates: Record<string, unknown>; message: string } | null {
    try {
        let cleaned = raw.trim();
        if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
        }
        const parsed = JSON.parse(cleaned);
        if (parsed.updates && parsed.message) return parsed;
        return null;
    } catch {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.updates && parsed.message) return parsed;
            } catch { /* fall through */ }
        }
        return null;
    }
}

export default function CourseUploadPage() {
    const navigate = useNavigate();
    const [text, setText] = useState('');
    const [type, setType] = useState('auto');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [courseData, setCourseData] = useState<CourseData | null>(null);
    const [rawError, setRawError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Chat agent state
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);

    // Syllabus expand state
    const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    async function handleAnalyze() {
        if (!text.trim() && files.length === 0) { setRawError('⚠️ Pega texto o sube un archivo.'); return; }
        if (!getGeminiKey()) { setRawError('⚠️ Configura tu API Key de Gemini en Configuración.'); return; }
        setLoading(true); setRawError(''); setCourseData(null); setChatMessages([]);

        try {
            let result: string;
            const typeHint = type === 'auto' ? undefined : type;

            if (files.length > 0) {
                result = await analyzeFileContent(files[0].dataUrl, files[0].name, typeHint);
            } else {
                result = await analyzeRawText(text, typeHint);
            }

            const parsed = parseAIResponse(result);
            if (parsed) {
                setCourseData(parsed);
                // Expand all modules by default
                setExpandedModules(new Set(parsed.syllabus.map((_, i) => i)));
                // Pre-populate chat
                const missingCount = parsed.missing?.length || 0;
                if (missingCount > 0) {
                    setChatMessages([{
                        role: 'assistant',
                        content: `✅ Analicé tu documento. Encontré **${missingCount} campo(s)** sin información: ${parsed.missing.map(m => FIELD_LABELS[m] || m).join(', ')}.\n\nPuedes pedirme que los complete. Por ejemplo:\n• "Completa la información faltante"\n• "Genera una descripción persuasiva"\n• "Sugiere un precio competitivo"`,
                    }]);
                } else {
                    setChatMessages([{
                        role: 'assistant',
                        content: '✅ ¡Toda la información se extrajo correctamente! Puedes editar los campos manualmente o pedirme mejoras. Por ejemplo: "Mejora la descripción" o "Sugiere más objetivos".',
                    }]);
                }
            } else {
                setRawError('⚠️ No se pudo estructurar la respuesta. Intenta con un documento diferente o texto más claro.');
            }
        } catch (err: unknown) {
            setRawError(`❌ Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
        }
        setLoading(false);
    }

    // AI Chat Agent — now with auto-apply
    async function handleChat(overrideMsg?: string) {
        const userMsg = (overrideMsg || chatInput).trim();
        if (!userMsg || !courseData) return;
        if (!overrideMsg) setChatInput('');
        setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setChatLoading(true);

        try {
            const context = JSON.stringify(courseData, null, 2);
            const response = await completeField(context, userMsg);
            const parsed = parseAgentResponse(response);

            if (parsed) {
                // Auto-apply the updates
                const updatedData = { ...courseData };
                for (const [key, value] of Object.entries(parsed.updates)) {
                    if (key === 'syllabus') {
                        (updatedData as Record<string, unknown>)[key] = normalizeSyllabus(value as unknown[]);
                    } else {
                        (updatedData as Record<string, unknown>)[key] = value;
                    }
                }
                // Remove applied fields from missing
                updatedData.missing = (updatedData.missing || []).filter(
                    m => !Object.keys(parsed.updates).includes(m)
                );
                setCourseData(updatedData);

                const updatedFields = Object.keys(parsed.updates).map(k => FIELD_LABELS[k] || k);
                setChatMessages(prev => [...prev, {
                    role: 'assistant',
                    content: parsed.message,
                    updates: parsed.updates,
                    applied: true,
                }]);
            } else {
                // Couldn't parse as JSON — show as plain text
                setChatMessages(prev => [...prev, {
                    role: 'assistant',
                    content: response,
                }]);
            }
        } catch {
            setChatMessages(prev => [...prev, { role: 'assistant', content: '❌ Error al consultar la IA. Intenta de nuevo.' }]);
        }
        setChatLoading(false);
    }

    function updateField(field: string, value: unknown) {
        if (!courseData) return;
        setCourseData({ ...courseData, [field]: value });
    }

    // Save to catalog
    async function handleSave() {
        if (!courseData) return;
        setSaving(true);
        const now = new Date().toISOString();
        const id = generateId();

        try {
            if (courseData.type === 'programa') {
                addPrograma({
                    id, title: courseData.title, description: courseData.description,
                    objectives: courseData.objectives || [], targetAudience: courseData.targetAudience || '',
                    modality: (courseData.modality as 'online' | 'presencial' | 'hibrido') || 'online',
                    totalDuration: courseData.duration || '', totalHours: courseData.hours || 0,
                    courses: (courseData.syllabus || []).map((mod, i) => ({
                        id: `${id}c${i + 1}`, order: i + 1, title: mod.module,
                        description: mod.topics.join(', '), hours: 0, topics: mod.topics
                    })),
                    price: courseData.price || 0, currency: courseData.currency || 'USD',
                    maxStudents: courseData.maxStudents || 30,
                    certification: courseData.certification || '', category: courseData.category || 'General',
                    tags: [], status: 'borrador', startDate: courseData.startDate || '',
                    createdAt: now, updatedAt: now,
                });
            } else if (courseData.type === 'webinar') {
                addWebinar({
                    id, title: courseData.title, description: courseData.description,
                    type: 'webinar', speaker: courseData.instructor || '',
                    speakerBio: courseData.instructorBio || '',
                    date: courseData.startDate || '', time: courseData.schedule || '19:00',
                    duration: courseData.duration || '90 min',
                    modality: (courseData.modality as 'online' | 'presencial' | 'hibrido') || 'online',
                    platform: 'zoom', price: courseData.price || 0, currency: courseData.currency || 'USD',
                    maxAttendees: courseData.maxStudents || 100,
                    keyTopics: courseData.syllabus.flatMap(m => [m.module, ...m.topics]),
                    targetAudience: courseData.targetAudience || '',
                    category: courseData.category || 'General', tags: [],
                    status: 'borrador', createdAt: now, updatedAt: now,
                });
            } else {
                addCurso({
                    id, title: courseData.title, description: courseData.description,
                    objectives: courseData.objectives || [], targetAudience: courseData.targetAudience || '',
                    modality: (courseData.modality as 'online' | 'presencial' | 'hibrido') || 'online',
                    startDate: courseData.startDate || '', duration: courseData.duration || '',
                    totalHours: courseData.hours || 0, schedule: courseData.schedule || '',
                    syllabus: (courseData.syllabus || []).map((mod, i) => ({
                        id: `${id}m${i + 1}`, title: mod.module, description: '',
                        topics: mod.topics, hours: 0,
                    })),
                    instructor: courseData.instructor || '', instructorBio: courseData.instructorBio || '',
                    price: courseData.price || 0, currency: courseData.currency || 'USD',
                    maxStudents: courseData.maxStudents || 30, prerequisites: courseData.prerequisites || '',
                    certification: courseData.certification || '', category: courseData.category || 'General',
                    tags: [], status: 'borrador', createdAt: now, updatedAt: now,
                });
            }
            navigate('/courses');
        } catch (err) {
            setRawError(`❌ Error al guardar: ${err instanceof Error ? err.message : 'Error'}`);
        }
        setSaving(false);
    }

    function processFile(file: globalThis.File) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            setFiles(prev => [...prev, { name: file.name, size: file.size, dataUrl }]);
        };
        reader.readAsDataURL(file);
    }

    function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const fileList = e.target.files;
        if (!fileList) return;
        Array.from(fileList).forEach(processFile);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    function removeFile(index: number) { setFiles(prev => prev.filter((_, i) => i !== index)); }

    function formatSize(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    function toggleModule(i: number) {
        setExpandedModules(prev => {
            const next = new Set(prev);
            next.has(i) ? next.delete(i) : next.add(i);
            return next;
        });
    }

    const isFieldMissing = (field: string) => courseData?.missing?.includes(field);
    const missingStyle = { borderColor: '#FDE68A', background: '#FFFBEB' };
    const missingLabelStyle = { color: '#D97706' };

    return (
        <div className="page-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/courses')}><ArrowLeft size={16} /></button>
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 800 }}>📤 Subir & Analizar Información</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '14px' }}>Sube un archivo o pega texto. La IA extraerá y organizará la información para ti.</p>
                </div>
            </div>

            {/* ======= PHASE 1: UPLOAD ======= */}
            {!courseData && (
                <>
                    {/* Step 1: Type */}
                    <div className="card mb-6 fade-in">
                        <h3 className="form-section-title">1. ¿Qué tipo de oferta es?</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                            {types.map(t => {
                                const isActive = type === t.key;
                                return (
                                    <button key={t.key} onClick={() => setType(t.key)} style={{
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                                        padding: '14px 8px', border: isActive ? '2px solid var(--brand)' : '1px solid var(--border)',
                                        borderRadius: 'var(--radius)', background: isActive ? '#EFF6FF' : 'var(--bg)',
                                        cursor: 'pointer', transition: 'all 0.2s', position: 'relative'
                                    }}>
                                        {isActive && <CheckCircle2 size={14} style={{ position: 'absolute', top: '6px', right: '6px', color: 'var(--brand)' }} />}
                                        <span style={{ fontSize: '20px', marginBottom: '4px' }}>{t.label.split(' ')[0]}</span>
                                        <span style={{ fontSize: '13px', fontWeight: 600, color: isActive ? 'var(--brand)' : 'inherit' }}>{t.label.split(' ').slice(1).join(' ')}</span>
                                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{t.desc}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step 2: Upload */}
                    <div className="card mb-6 fade-in delay-1">
                        <h3 className="form-section-title">2. Carga la información</h3>
                        <label className="file-drop-zone" style={{ display: 'block', marginBottom: '16px' }}
                            onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.background = '#EFF6FF'; }}
                            onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-subtle)'; }}
                            onDrop={e => {
                                e.preventDefault(); e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--bg-subtle)';
                                if (e.dataTransfer.files) Array.from(e.dataTransfer.files).forEach(processFile);
                            }}
                        >
                            <div style={{ textAlign: 'center', padding: '8px 0' }}>
                                <Upload size={28} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
                                <div style={{ fontWeight: 600, fontSize: '14px' }}>Arrastra archivos aquí o haz click para buscar</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>PDF, DOCX, TXT, CSV — Máx 10MB</div>
                            </div>
                            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.csv" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
                        </label>

                        {files.length > 0 && (
                            <div style={{ marginBottom: '16px' }}>
                                {files.map((f, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 'var(--radius)', marginBottom: '8px' }}>
                                        <File size={18} style={{ color: 'var(--success)', flexShrink: 0 }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{formatSize(f.size)} — Lista para analizar</div>
                                        </div>
                                        <button onClick={() => removeFile(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}><X size={16} /></button>
                                    </div>
                                ))}
                                <button onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: '1px dashed var(--border)', borderRadius: 'var(--radius)', padding: '8px 14px', cursor: 'pointer', color: 'var(--brand)', fontSize: '13px', fontWeight: 500, width: '100%', justifyContent: 'center' }}>
                                    <Plus size={14} /> Agregar otro archivo
                                </button>
                            </div>
                        )}

                        <div style={{ margin: '12px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500 }}>— O pega texto directamente —</div>
                        <textarea className="form-textarea" rows={6} value={text} onChange={e => setText(e.target.value)}
                            placeholder="Pega aquí el temario, correos, notas o cualquier texto con la información de tu curso..."
                            style={{ fontSize: '13px', resize: 'vertical' }}
                        />
                    </div>

                    <button className="btn btn-primary btn-xl full-width" onClick={handleAnalyze} disabled={loading} style={{ marginBottom: '24px' }}>
                        {loading ? <Loader size={20} className="spin" /> : <Sparkles size={20} />}
                        {loading ? 'Analizando con IA...' : 'Analizar y Estructurar'}
                    </button>

                    {rawError && (
                        <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--radius)', color: '#DC2626', fontSize: '13px', marginBottom: '16px' }}>{rawError}</div>
                    )}
                </>
            )}

            {/* ======= PHASE 2: STRUCTURED FORM ======= */}
            {courseData && (
                <div className="fade-in">
                    {/* Success banner */}
                    <div className="card mb-6" style={{ background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <CheckCircle2 size={24} style={{ color: 'var(--success)' }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: '16px', color: '#166534' }}>✅ Información extraída exitosamente</div>
                                <div style={{ fontSize: '13px', color: '#15803D', marginTop: '2px' }}>
                                    Tipo: <strong>{courseData.type?.toUpperCase()}</strong> —
                                    {courseData.missing?.length ? ` ${courseData.missing.length} campo(s) por completar` : ' Toda la información está completa'}
                                </div>
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setCourseData(null); setChatMessages([]); }}>← Volver</button>
                        </div>
                    </div>

                    {/* Missing fields alert */}
                    {courseData.missing?.length > 0 && (
                        <div className="card mb-6" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'start' }}>
                                <AlertCircle size={18} style={{ color: '#D97706', marginTop: '2px', flexShrink: 0 }} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#92400E', marginBottom: '8px' }}>Campos por completar — usa el chat de IA para rellenarlos automáticamente</div>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        {courseData.missing.map((m, i) => (
                                            <span key={i} style={{ display: 'inline-flex', padding: '2px 10px', background: '#FEF3C7', borderRadius: '12px', fontSize: '12px', fontWeight: 600, color: '#92400E' }}>
                                                {FIELD_LABELS[m] || m}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <button className="btn btn-sm" onClick={() => handleChat('Completa toda la información faltante con sugerencias profesionales')}
                                    style={{ background: '#F59E0B', color: 'white', border: 'none', fontSize: '12px', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                    <Sparkles size={12} /> Auto-completar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Editable Form */}
                    <div className="card mb-6">
                        <h3 className="form-section-title">📋 Datos del {courseData.type === 'programa' ? 'Programa' : courseData.type === 'webinar' ? 'Webinar' : 'Curso'}</h3>

                        <div className="form-group">
                            <label style={isFieldMissing('title') ? missingLabelStyle : {}}>
                                {isFieldMissing('title') && '⚠️ '}Título
                            </label>
                            <input className="form-input" value={courseData.title || ''} onChange={e => updateField('title', e.target.value)}
                                style={isFieldMissing('title') ? missingStyle : {}} />
                        </div>

                        <div className="form-group">
                            <label style={isFieldMissing('description') ? missingLabelStyle : {}}>
                                {isFieldMissing('description') && '⚠️ '}Descripción
                            </label>
                            <textarea className="form-textarea" rows={3} value={courseData.description || ''} onChange={e => updateField('description', e.target.value)}
                                style={isFieldMissing('description') ? missingStyle : {}} />
                        </div>

                        <div className="grid-2">
                            <div className="form-group">
                                <label>Categoría</label>
                                <input className="form-input" value={courseData.category || ''} onChange={e => updateField('category', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Modalidad</label>
                                <select className="form-select" value={courseData.modality || 'online'} onChange={e => updateField('modality', e.target.value)}>
                                    <option value="online">Online</option><option value="presencial">Presencial</option><option value="hibrido">Híbrido</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid-2">
                            <div className="form-group">
                                <label style={isFieldMissing('duration') ? missingLabelStyle : {}}>
                                    {isFieldMissing('duration') && '⚠️ '}Duración
                                </label>
                                <input className="form-input" value={courseData.duration || ''} onChange={e => updateField('duration', e.target.value)}
                                    placeholder="Ej: 8 semanas" style={isFieldMissing('duration') ? missingStyle : {}} />
                            </div>
                            <div className="form-group">
                                <label style={isFieldMissing('hours') ? missingLabelStyle : {}}>
                                    {isFieldMissing('hours') && '⚠️ '}Horas Totales
                                </label>
                                <input className="form-input" type="number" value={courseData.hours || ''} onChange={e => updateField('hours', Number(e.target.value) || null)}
                                    style={isFieldMissing('hours') ? missingStyle : {}} />
                            </div>
                        </div>

                        <div className="grid-2">
                            <div className="form-group">
                                <label style={isFieldMissing('instructor') ? missingLabelStyle : {}}>
                                    {isFieldMissing('instructor') && '⚠️ '}Instructor
                                </label>
                                <input className="form-input" value={courseData.instructor || ''} onChange={e => updateField('instructor', e.target.value)}
                                    style={isFieldMissing('instructor') ? missingStyle : {}} />
                            </div>
                            <div className="form-group">
                                <label style={isFieldMissing('targetAudience') ? missingLabelStyle : {}}>
                                    {isFieldMissing('targetAudience') && '⚠️ '}Público Objetivo
                                </label>
                                <input className="form-input" value={courseData.targetAudience || ''} onChange={e => updateField('targetAudience', e.target.value)}
                                    style={isFieldMissing('targetAudience') ? missingStyle : {}} />
                            </div>
                        </div>

                        <div className="grid-2">
                            <div className="form-group">
                                <label style={isFieldMissing('price') ? missingLabelStyle : {}}>
                                    {isFieldMissing('price') && '⚠️ '}Precio
                                </label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <select className="form-select" style={{ width: '80px' }} value={courseData.currency || 'USD'} onChange={e => updateField('currency', e.target.value)}>
                                        <option value="USD">USD</option><option value="PEN">PEN</option><option value="EUR">EUR</option>
                                    </select>
                                    <input className="form-input" type="number" value={courseData.price ?? ''} onChange={e => updateField('price', Number(e.target.value) || null)}
                                        placeholder="0 = Gratis" style={isFieldMissing('price') ? missingStyle : {}} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label style={isFieldMissing('startDate') ? missingLabelStyle : {}}>
                                    {isFieldMissing('startDate') && '⚠️ '}Fecha de Inicio
                                </label>
                                <input className="form-input" type="date" value={courseData.startDate || ''} onChange={e => updateField('startDate', e.target.value)}
                                    style={isFieldMissing('startDate') ? missingStyle : {}} />
                            </div>
                        </div>

                        {/* Objectives */}
                        <div className="form-group">
                            <label>🎯 Objetivos de Aprendizaje</label>
                            {(courseData.objectives || []).map((obj, i) => (
                                <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '36px', flexShrink: 0 }}>{i + 1}.</span>
                                    <input className="form-input" value={obj} onChange={e => {
                                        const newObj = [...(courseData.objectives || [])]; newObj[i] = e.target.value; updateField('objectives', newObj);
                                    }} />
                                    <button onClick={() => updateField('objectives', courseData.objectives.filter((_, j) => j !== i))}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={16} /></button>
                                </div>
                            ))}
                            <button onClick={() => updateField('objectives', [...(courseData.objectives || []), ''])}
                                style={{ background: 'none', border: '1px dashed var(--border)', borderRadius: 'var(--radius)', padding: '6px 12px', cursor: 'pointer', color: 'var(--brand)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Plus size={12} /> Agregar objetivo
                            </button>
                        </div>

                        {/* Hierarchical Syllabus */}
                        <div className="form-group">
                            <label>📚 Temario / Módulos</label>
                            {(courseData.syllabus || []).map((mod, mi) => (
                                <div key={mi} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', marginBottom: '8px', overflow: 'hidden' }}>
                                    {/* Module header */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'var(--bg-subtle)', cursor: 'pointer' }}
                                        onClick={() => toggleModule(mi)}>
                                        {expandedModules.has(mi) ? <ChevronDown size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> : <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                                        <span style={{ fontWeight: 700, fontSize: '13px', color: 'var(--brand)', flexShrink: 0 }}>Módulo {mi + 1}</span>
                                        <input className="form-input" value={mod.module}
                                            onClick={e => e.stopPropagation()}
                                            onChange={e => {
                                                const newSyl = [...courseData.syllabus]; newSyl[mi] = { ...mod, module: e.target.value }; updateField('syllabus', newSyl);
                                            }}
                                            style={{ fontSize: '13px', fontWeight: 600, border: 'none', background: 'transparent', padding: '0 4px' }}
                                        />
                                        <button onClick={(e) => { e.stopPropagation(); updateField('syllabus', courseData.syllabus.filter((_, j) => j !== mi)); }}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', marginLeft: 'auto', flexShrink: 0 }}><X size={16} /></button>
                                    </div>
                                    {/* Topics */}
                                    {expandedModules.has(mi) && (
                                        <div style={{ padding: '8px 12px 12px 36px' }}>
                                            {mod.topics.map((topic, ti) => (
                                                <div key={ti} style={{ display: 'flex', gap: '6px', marginBottom: '4px', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>•</span>
                                                    <input className="form-input" value={topic}
                                                        onChange={e => {
                                                            const newSyl = [...courseData.syllabus];
                                                            const newTopics = [...mod.topics]; newTopics[ti] = e.target.value;
                                                            newSyl[mi] = { ...mod, topics: newTopics }; updateField('syllabus', newSyl);
                                                        }}
                                                        style={{ fontSize: '12px', padding: '4px 8px' }}
                                                    />
                                                    <button onClick={() => {
                                                        const newSyl = [...courseData.syllabus];
                                                        newSyl[mi] = { ...mod, topics: mod.topics.filter((_, j) => j !== ti) }; updateField('syllabus', newSyl);
                                                    }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={14} /></button>
                                                </div>
                                            ))}
                                            <button onClick={() => {
                                                const newSyl = [...courseData.syllabus];
                                                newSyl[mi] = { ...mod, topics: [...mod.topics, ''] }; updateField('syllabus', newSyl);
                                            }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                                <Plus size={12} /> Agregar tema
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <button onClick={() => updateField('syllabus', [...(courseData.syllabus || []), { module: '', topics: [''] }])}
                                style={{ background: 'none', border: '1px dashed var(--border)', borderRadius: 'var(--radius)', padding: '8px 14px', cursor: 'pointer', color: 'var(--brand)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', width: '100%', justifyContent: 'center' }}>
                                <Plus size={12} /> Agregar módulo
                            </button>
                        </div>
                    </div>

                    {/* ======= AI CHAT AGENT ======= */}
                    <div className="card mb-6">
                        <h3 className="form-section-title">🤖 Asistente IA — Completa y mejora</h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                            Pídele que complete campos faltantes, mejore descripciones o sugiera contenido. <strong>Los cambios se aplican automáticamente al formulario.</strong>
                        </p>

                        <div style={{ maxHeight: '320px', overflowY: 'auto', marginBottom: '12px', padding: '4px' }}>
                            {chatMessages.map((msg, i) => (
                                <div key={i} style={{ marginBottom: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                        <div style={{
                                            maxWidth: '85%', padding: '10px 14px', borderRadius: '14px', fontSize: '13px', lineHeight: 1.5,
                                            background: msg.role === 'user' ? 'var(--brand)' : 'var(--bg-subtle)',
                                            color: msg.role === 'user' ? 'white' : 'var(--text)',
                                            border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                                        }}>
                                            {msg.content}
                                        </div>
                                    </div>
                                    {/* Applied indicator */}
                                    {msg.applied && msg.updates && (
                                        <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '4px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', fontSize: '11px', color: '#16A34A', fontWeight: 600 }}>
                                                <CheckCircle2 size={12} />
                                                Aplicado: {Object.keys(msg.updates).map(k => FIELD_LABELS[k] || k).join(', ')}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {chatLoading && (
                                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '8px' }}>
                                    <div style={{ padding: '10px 14px', borderRadius: '14px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Loader size={14} className="spin" /> Analizando y aplicando cambios...
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Chat input */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input className="form-input" value={chatInput} onChange={e => setChatInput(e.target.value)}
                                placeholder="Ej: Completa toda la información faltante..."
                                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleChat()}
                                disabled={chatLoading}
                            />
                            <button className="btn btn-primary" onClick={() => handleChat()} disabled={chatLoading || !chatInput.trim()}>
                                <Send size={16} />
                            </button>
                        </div>

                        {/* Quick prompts */}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                            {[
                                'Completa toda la información faltante',
                                'Mejora la descripción del curso',
                                'Sugiere 5 objetivos de aprendizaje',
                                'Recomienda un precio competitivo',
                                'Sugiere duración y horarios',
                            ].map(prompt => (
                                <button key={prompt} onClick={() => handleChat(prompt)}
                                    disabled={chatLoading}
                                    style={{ padding: '5px 12px', background: 'var(--bg-subtle)', border: '1px solid var(--border)', borderRadius: '16px', fontSize: '11px', cursor: chatLoading ? 'not-allowed' : 'pointer', color: 'var(--text-secondary)', transition: 'all 0.15s' }}>
                                    ✨ {prompt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* SAVE BUTTON */}
                    <button className="btn btn-primary btn-xl full-width" onClick={handleSave} disabled={saving} style={{ marginBottom: '24px', background: '#16A34A' }}>
                        {saving ? <Loader size={20} className="spin" /> : <Save size={20} />}
                        {saving ? 'Guardando...' : `Guardar ${courseData.type === 'programa' ? 'Programa' : courseData.type === 'webinar' ? 'Webinar' : 'Curso'} en Catálogo`}
                    </button>

                    {rawError && (
                        <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--radius)', color: '#DC2626', fontSize: '13px' }}>{rawError}</div>
                    )}
                </div>
            )}
        </div>
    );
}
