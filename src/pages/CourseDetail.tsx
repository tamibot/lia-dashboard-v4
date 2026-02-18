import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCursos, getProgramas, getWebinars, getProfile, getGeminiKey } from '../lib/storage';
import {
    generateLanding, generateEmailSequence, generateWhatsAppSequence, generateMarketing,
    analyzeCourseData, generateContentIdeas, refineContent,
    generateLaunchContent, generateBanner, generateSocialPosts, generateCourseSheet
} from '../lib/gemini';
import {
    ArrowLeft, Sparkles, Loader, Globe, Mail, MessageCircle, Megaphone, FileText, Lightbulb,
    Send, Copy, Check, Download, BookOpen, GraduationCap, Video, Rocket, Image, Layout,
    Clock, Users, Tag, DollarSign, MapPin, Award, ChevronDown, ChevronRight, X, RefreshCw
} from 'lucide-react';

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
    const { type, id } = useParams<{ type: string; id: string }>();
    const navigate = useNavigate();
    const profile = getProfile();

    // Find item
    let item: Record<string, unknown> | null = null;
    let itemTitle = '';
    const findItem = (list: any[]) => list.find(x => x.id === id);
    if (type === 'curso') { const f = findItem(getCursos()); if (f) { item = f; itemTitle = f.title; } }
    else if (type === 'programa') { const f = findItem(getProgramas()); if (f) { item = f; itemTitle = f.title; } }
    else if (type === 'webinar') { const f = findItem(getWebinars()); if (f) { item = f; itemTitle = f.title; } }

    // State
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState('');
    const [chat, setChat] = useState<ChatMsg[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [refining, setRefining] = useState(false);
    const [copied, setCopied] = useState(false);
    const [expandSyllabus, setExpandSyllabus] = useState(false);

    const typeEmoji = type === 'curso' ? '📚' : type === 'programa' ? '🎓' : '🎥';
    const typeLabel = type === 'curso' ? 'Curso Libre' : type === 'programa' ? 'Programa' : 'Webinar';

    // Run a tool
    async function runTool(toolId: string) {
        if (!getGeminiKey()) { alert('Configura tu API Key de Gemini primero'); return; }
        if (!item || !profile) return;
        setActiveTool(toolId);
        setLoading(true);
        setContent('');
        setChat([]);
        setChatInput('');

        try {
            let result = '';
            const p = profile as unknown as Record<string, unknown>;
            switch (toolId) {
                case 'analyze': result = await analyzeCourseData(item, type as any); break;
                case 'landing': result = await generateLanding(item, p); break;
                case 'banner': result = await generateBanner(item, p); break;
                case 'social': result = await generateSocialPosts(item, p); break;
                case 'sheet': result = await generateCourseSheet(item, p); break;
                case 'email': result = await generateEmailSequence(item, p); break;
                case 'whatsapp': result = await generateWhatsAppSequence(item, p); break;
                case 'launch': result = await generateLaunchContent(item, p); break;
                case 'marketing': result = await generateMarketing(item, p); break;
                case 'content': result = await generateContentIdeas(p, { [type!]: item }); break;
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

    if (!item) {
        return (
            <div className="page-content">
                <div className="card empty-state"><h3>No encontrado</h3>
                    <Link to="/courses" className="btn btn-primary">Volver</Link>
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

    const currentTool = ALL_TOOLS.find(t => t.id === activeTool);
    const htmlContent = currentTool?.visual && content ? extractHtml(content) : null;

    // Group tools by category
    const categories = [...new Set(ALL_TOOLS.map(t => t.category))];

    return (
        <div className="page-content" style={{ maxWidth: '1100px', margin: '0 auto' }}>
            {/* ====== HEADER ====== */}
            <div style={{
                borderRadius: '14px', overflow: 'hidden', marginBottom: '20px',
                border: '1px solid var(--border)', background: 'var(--bg)'
            }}>
                <div style={{
                    padding: '20px 24px', background: '#f8fafc', borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'flex-start', gap: '16px'
                }}>
                    <button onClick={() => navigate('/courses')} className="btn btn-ghost btn-sm" style={{ marginTop: '2px' }}>
                        <ArrowLeft size={16} />
                    </button>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                padding: '2px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                                background: '#EFF6FF', color: '#3B82F6'
                            }}>
                                {typeEmoji} {typeLabel}
                            </span>
                            <span style={{
                                padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                                background: '#F0FDF4', color: '#16A34A'
                            }}>● Activo</span>
                        </div>
                        <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text)' }}>{itemTitle}</h1>
                    </div>
                </div>

                {/* Stats bar */}
                <div style={{ display: 'flex', borderTop: '1px solid var(--border)' }}>
                    {[
                        { icon: <Tag size={12} />, label: category },
                        { icon: <MapPin size={12} />, label: modality.charAt(0).toUpperCase() + modality.slice(1) },
                        { icon: <Clock size={12} />, label: duration || '—' },
                        { icon: <Users size={12} />, label: maxStudents ? `${maxStudents} cupos` : '—' },
                        { icon: <DollarSign size={12} />, label: price ? `${currency} ${price}` : 'Gratis' },
                    ].map((s, i) => (
                        <div key={i} style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                            padding: '8px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500,
                            borderRight: i < 4 ? '1px solid var(--border)' : 'none'
                        }}>
                            {s.icon} {s.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* ====== COURSE INFO ====== */}
            {!activeTool && (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px', marginBottom: '14px' }}>
                        {/* Description */}
                        <div className="card" style={{ padding: '16px' }}>
                            <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Descripción</h4>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                                {description || <em style={{ color: 'var(--text-muted)' }}>Sin descripción</em>}
                            </p>
                        </div>

                        {/* Instructor + cert */}
                        <div className="card" style={{ padding: '16px' }}>
                            {instructor && (
                                <div style={{ marginBottom: certification ? '12px' : 0 }}>
                                    <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Instructor</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '50%', background: '#EFF6FF',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6',
                                            fontWeight: 700, fontSize: '14px', flexShrink: 0
                                        }}>
                                            {instructor.charAt(0).toUpperCase()}
                                        </div>
                                        <span style={{ fontWeight: 600, fontSize: '13px' }}>{instructor}</span>
                                    </div>
                                </div>
                            )}
                            {certification && (
                                <div>
                                    <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                                        <Award size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />Certificación
                                    </h4>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>{certification}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Objectives */}
                    {objectives.length > 0 && (
                        <div className="card" style={{ padding: '16px', marginBottom: '14px' }}>
                            <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                                🎯 Objetivos ({objectives.length})
                            </h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '6px' }}>
                                {objectives.map((obj, i) => (
                                    <div key={i} style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, display: 'flex', gap: '6px' }}>
                                        <span style={{ color: '#16A34A', flexShrink: 0 }}>✓</span>{obj}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Syllabus */}
                    {syllabus.length > 0 && (
                        <div className="card" style={{ padding: '16px', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                                onClick={() => setExpandSyllabus(!expandSyllabus)}>
                                <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
                                    Temario ({syllabus.length} {typeof syllabus[0] === 'object' && syllabus[0]?.module ? 'módulos' : 'temas'})
                                </h4>
                                {expandSyllabus ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </div>
                            {expandSyllabus && (
                                <div style={{ marginTop: '10px' }}>
                                    {syllabus.map((mod: any, i: number) => (
                                        <div key={i} style={{ padding: '6px 0', borderBottom: i < syllabus.length - 1 ? '1px solid var(--border)' : 'none' }}>
                                            {typeof mod === 'object' && mod.module ? (
                                                <>
                                                    <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '3px' }}>
                                                        <span style={{ color: '#3B82F6', marginRight: '6px' }}>M{i + 1}</span>{mod.module}
                                                    </div>
                                                    {mod.topics && (
                                                        <ul style={{ margin: '2px 0 0', paddingLeft: '28px' }}>
                                                            {mod.topics.map((t: string, ti: number) => (
                                                                <li key={ti} style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '1px' }}>{t}</li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </>
                                            ) : (
                                                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                    <span style={{ color: '#3B82F6', fontWeight: 600, marginRight: '6px' }}>{i + 1}.</span>
                                                    {typeof mod === 'string' ? mod : mod.title || JSON.stringify(mod)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* ====== TOOL GRID (when no tool is active) ====== */}
            {!activeTool && (
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
        </div>
    );
}
