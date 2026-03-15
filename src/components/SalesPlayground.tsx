import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { Send, X, Phone, CheckCircle, Clock, ThumbsDown, UserCheck, FileText, Download, MessageSquare, Target, BookOpen, ClipboardList, Search, ShoppingCart } from 'lucide-react';
import type { AiAgent, OrgProfile } from '../lib/types';
import { chatWithAgent } from '../lib/gemini';
import { API_CONFIG } from '../config/api.config';

// ── Simple inline markdown renderer (bold + line breaks) ──────────────
function renderMd(text: string): ReactNode {
    const lines = text.split('\n');
    return lines.map((line, li) => {
        const parts = line.split(/(\*\*[^*\n]+\*\*)/g);
        const rendered = parts.map((part, pi) =>
            part.startsWith('**') && part.endsWith('**')
                ? <strong key={pi} className="font-bold">{part.slice(2, -2)}</strong>
                : <span key={pi}>{part}</span>
        );
        return (
            <span key={li}>
                {rendered}
                {li < lines.length - 1 && <br />}
            </span>
        );
    });
}

type AgentMode = 'sales' | 'search';

interface SalesPlaygroundProps {
    agent: AiAgent;
    courseContext?: any;
    orgProfile?: OrgProfile;
    onClose: () => void;
    initialMode?: AgentMode;
}

export default function SalesPlayground({ agent, courseContext, orgProfile, onClose, initialMode = 'sales' }: SalesPlaygroundProps) {
    const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'chatting' | 'closed' | 'transferred'>('chatting');
    const [fullCatalog, setFullCatalog] = useState<any>(null);
    const [simulatedTransfer, setSimulatedTransfer] = useState(false);
    const [assignedAdvisor, setAssignedAdvisor] = useState<{ name: string; phone?: string; whatsapp?: string } | null>(null);
    const [agentMode, setAgentMode] = useState<AgentMode>(initialMode);
    const [teamMembers, setTeamMembers] = useState<any[]>([]);

    const chatEndRef = useRef<HTMLDivElement>(null);

    // Fetch the REAL catalog from the backend so the agent doesn't invent courses
    const [catalogLoading, setCatalogLoading] = useState(true);

    // Fetch the REAL catalog from the backend so the agent doesn't invent courses
    useEffect(() => {
        // Try to get org slug from profile; fall back to localStorage or default
        const orgSlug = (orgProfile as any)?.slug
            || localStorage.getItem('orgSlug')
            || '';

        if (!orgSlug) {
            setCatalogLoading(false);
            return;
        }

        setCatalogLoading(true);
        const url = `${API_CONFIG.BASE_URL}/public/${orgSlug}/catalog`;

        fetch(url)
            .then(r => r.json())
            .then(data => {
                setFullCatalog(data);
                setCatalogLoading(false);
            })
            .catch(err => {
                console.warn('Could not load catalog for agent context:', err);
                setCatalogLoading(false);
            });
    }, [orgProfile]);

    // Fetch team members for advisor assignment
    useEffect(() => {
        fetch(`${API_CONFIG.BASE_URL}/team`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem(API_CONFIG.TOKEN_KEY)}` }
        })
            .then(r => r.json())
            .then(data => {
                const members = Array.isArray(data) ? data : data.members || [];
                setTeamMembers(members);
            })
            .catch(() => {});
    }, []);

    const orgName = orgProfile?.name || (fullCatalog as any)?.orgName || null;

    useEffect(() => {
        // Reset conversation state when agent or context changes
        setStatus('chatting');
        setInput('');
        const fromOrg = orgName ? ` de **${orgName}**` : '';
        const greeting = agentMode === 'search'
            ? `Hola, soy **${agent.name}**${fromOrg}. Soy tu asistente de busqueda de cursos. Puedo ayudarte a encontrar el programa perfecto para ti. Dime: ¿que area te interesa? ¿presencial u online? ¿tienes un presupuesto en mente?`
            : courseContext
                ? `Hola, soy **${agent.name}**, tu asesora${fromOrg}. Vimos que tienes interes en **${courseContext.title}**, me encantaria ayudarte con toda la informacion que necesites. ¿En que te puedo ayudar?`
                : `Hola, soy **${agent.name}**, tu asesora${fromOrg}. Estoy aqui para orientarte y ayudarte a encontrar el programa ideal para ti. ¿Que area te interesa o en que puedo ayudarte?`;
        setMessages([{ role: 'assistant', content: greeting }]);
    }, [agent.name, orgName, courseContext?.title, agentMode]); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-scroll: scroll after messages change AND after a short delay for render
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        const timer = setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
        return () => clearTimeout(timer);
    }, [messages, loading]);

    const sendMessage = async (overrideMsg?: string, isSimulation = false, simulationLabel = '') => {
        const msg = overrideMsg || input;
        if (!msg.trim() || loading || status !== 'chatting') return;

        setInput('');

        if (isSimulation) {
            // Show simulation event chip first
            setMessages(prev => [...prev, { role: 'simulation', content: simulationLabel }]);
        } else {
            setMessages(prev => [...prev, { role: 'user', content: msg }]);
        }
        setLoading(true);

        try {
            // Filter out simulation-event messages so they don't pollute the AI's conversation history
            const cleanHistory = messages.filter(m => m.role === 'user' || m.role === 'assistant');
            // In search mode, don't pass courseContext so the agent focuses on catalog browsing
            const ctxForMode = agentMode === 'search' ? undefined : courseContext;
            const searchPrefix = agentMode === 'search' ? '[MODO BUSQUEDA] El usuario busca un curso en el catalogo. Ayudalo a encontrar el mejor match comparando opciones. NO intentes cerrar venta, solo orienta y compara. ' : '';
            const response = await chatWithAgent(agent, cleanHistory, searchPrefix + msg, ctxForMode, orgProfile, fullCatalog);
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);

            const lower = response.toLowerCase();
            if (simulatedTransfer || lower.includes('agendado') || lower.includes('paso con el equipo') || lower.includes('te paso con') || lower.includes('te conecto con') || lower.includes('te comunico con')) {
                setStatus('transferred');
                // Assign a random available advisor
                if (!assignedAdvisor) {
                    let selectedAdvisor: any = null;
                    if (teamMembers.length > 0) {
                        const available = teamMembers.filter((m: any) => m.availability !== 'vacation');
                        const pool = available.length > 0 ? available : teamMembers;
                        selectedAdvisor = pool[Math.floor(Math.random() * pool.length)];
                        setAssignedAdvisor({ name: selectedAdvisor.name, phone: selectedAdvisor.phone, whatsapp: selectedAdvisor.whatsapp });
                    } else {
                        setAssignedAdvisor({ name: 'Equipo de ventas' });
                    }

                    // Register the transfer as a real contact in the backend
                    try {
                        const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
                        if (token) {
                            // Extract user info from conversation
                            const userMsgs = messages.filter(m => m.role === 'user').map(m => m.content).join(' ');
                            fetch(`${API_CONFIG.BASE_URL}/contacts/transfer`, {
                                method: 'POST',
                                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    name: 'Lead de LIA',
                                    courseInterest: courseContext?.title || detectedInterests[0] || null,
                                    advisorId: selectedAdvisor?.id || null,
                                    conversationSummary: `Prospecto interesado en ${detectedInterests[0] || 'el catalogo'}. ${totalInteractions} interacciones. ${userMsgs.slice(0, 200)}`,
                                }),
                            }).catch(() => {});
                        }
                    } catch { /* non-blocking */ }
                }
                setSimulatedTransfer(false);
            } else if (lower.includes('inscripción completada') || lower.includes('pago exitoso') || lower.includes('¡bienvenido al curso!') || lower.includes('bienvenido al curso')) {
                setStatus('closed');
            }
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: '❌ Error conectando con el agente.' }]);
        } finally {
            setLoading(false);
        }
    };

    const triggerSimulation = (type: 'visto15' | 'visto1h' | 'visto5h' | 'negativa' | 'asesor') => {
        const simulations = {
            visto15: { label: '⏱ Dejó en visto 15 minutos', msg: '[SIMULACION:VISTO_15MIN] El prospecto dejó en visto por 15 minutos. Reengánchalo.', newStatus: 'chatting' as const },
            visto1h: { label: '⏰ Dejó en visto 1 hora', msg: '[SIMULACION:VISTO_1H] El prospecto estuvo 1 hora sin responder. Haz seguimiento cálido.', newStatus: 'chatting' as const },
            visto5h: { label: '🕐 Dejó en visto 5 horas', msg: '[SIMULACION:VISTO_5H] Pasaron 5 horas sin respuesta. Reactiva con urgencia o nuevo ángulo.', newStatus: 'chatting' as const },
            negativa: { label: '👎 Respuesta negativa', msg: '[SIMULACION:NEGATIVA] El prospecto dijo que no está interesado. Maneja la objeción y rescata el lead.', newStatus: 'chatting' as const },
            asesor: { label: '🙋 Quiere hablar con asesor', msg: '[SIMULACION:ASESOR] El prospecto quiere hablar con una persona. Haz el handoff de forma profesional.', newStatus: 'transferred' as const },
        };
        const sim = simulations[type];
        // For asesor simulation, immediately set transferred status
        if (sim.newStatus === 'transferred') {
            setSimulatedTransfer(true);
        }
        sendMessage(sim.msg, true, sim.label);
    };

    // ── Info panel data: derived from messages ──
    const userMessages = messages.filter(m => m.role === 'user');
    const assistantMessages = messages.filter(m => m.role === 'assistant');
    const totalInteractions = userMessages.length;

    // Stage detection from assistant messages
    const hasSimulationEvent = messages.some(m => m.role === 'simulation');
    const detectStage = (): { label: string; color: string } => {
        if (status === 'transferred') return { label: 'Asesor Asignado', color: 'text-amber-700 bg-amber-50' };
        if (status === 'closed') return { label: 'Cierre', color: 'text-green-700 bg-green-50' };
        // Check for simulation-driven stages
        const simMessages = messages.filter(m => m.role === 'simulation').map(m => m.content);
        if (simMessages.some(s => s.includes('visto') || s.includes('Visto'))) {
            return { label: 'Seguimiento', color: 'text-orange-700 bg-orange-50' };
        }
        const lastMsgs = assistantMessages.slice(-3).map(m => m.content.toLowerCase()).join(' ');
        if (lastMsgs.includes('precio') || lastMsgs.includes('costo') || lastMsgs.includes('inversion') || lastMsgs.includes('pago')) {
            return { label: 'Decision', color: 'text-purple-700 bg-purple-50' };
        }
        if (lastMsgs.includes('beneficio') || lastMsgs.includes('incluye') || lastMsgs.includes('programa') || lastMsgs.includes('modulo')) {
            return { label: 'Consideracion', color: 'text-blue-700 bg-blue-50' };
        }
        if (totalInteractions >= 2) return { label: 'Consideracion', color: 'text-blue-700 bg-blue-50' };
        return { label: 'Descubrimiento', color: 'text-gray-700 bg-gray-50' };
    };
    const currentStage = detectStage();

    // Detect interests from conversation
    const detectedInterests: string[] = [];
    if (courseContext?.title) detectedInterests.push(courseContext.title);
    const allText = messages.map(m => m.content).join(' ');
    if (fullCatalog?.courses) {
        for (const c of fullCatalog.courses) {
            if (c.title && allText.includes(c.title) && !detectedInterests.includes(c.title)) {
                detectedInterests.push(c.title);
            }
        }
    }

    // Build summary when transferred
    const conversationSummary = status === 'transferred'
        ? `El prospecto mostro interes en ${detectedInterests[0] || 'un producto'}. Se realizaron ${totalInteractions} interacciones antes de ser transferido${assignedAdvisor ? ` al asesor ${assignedAdvisor.name}` : ' a un asesor humano'}.`
        : null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex justify-end animate-fade-in">
            <div className="bg-white w-full max-w-2xl lg:max-w-5xl h-full shadow-2xl flex animate-slide-in-right">

            {/* Info Panel — right side, hidden on small screens */}
            <div className="hidden lg:flex flex-col w-[260px] border-l border-gray-200 bg-gray-50/80 overflow-y-auto flex-shrink-0 order-2">
                <div className="p-4 border-b border-gray-200">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Panel de Seguimiento</h4>
                </div>

                {/* Interaction Counter */}
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-2">
                        <MessageSquare size={13} /> Interacciones
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{totalInteractions}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{assistantMessages.length} respuestas del agente</p>
                </div>

                {/* Current Stage */}
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-2">
                        <Target size={13} /> Etapa Actual
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${currentStage.color}`}>
                        {currentStage.label}
                    </span>
                    <div className="mt-2 flex gap-1">
                        {['Descubrimiento', 'Consideracion', 'Decision', 'Cierre'].map((s, i) => {
                            const stageOrder = ['Descubrimiento', 'Consideracion', 'Seguimiento', 'Decision', 'Cierre', 'Asesor Asignado'];
                            const currentIdx = stageOrder.indexOf(currentStage.label);
                            const isActive = currentIdx >= i || (currentStage.label === 'Seguimiento' && i <= 1) || (currentStage.label === 'Asesor Asignado');
                            return (
                                <div key={s} className={`h-1.5 flex-1 rounded-full ${isActive ? 'bg-blue-500' : 'bg-gray-200'}`} title={s} />
                            );
                        })}
                    </div>
                </div>

                {/* Detected Interests */}
                <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-2">
                        <BookOpen size={13} /> Intereses Detectados
                    </div>
                    {detectedInterests.length > 0 ? (
                        <div className="space-y-1.5">
                            {detectedInterests.slice(0, 5).map((interest, i) => (
                                <div key={i} className="text-xs text-gray-700 bg-white rounded-lg px-2.5 py-1.5 border border-gray-100 line-clamp-1">
                                    {interest}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-400 italic">Aun no detectados</p>
                    )}
                </div>

                {/* Conversation Summary (when transferred) */}
                {conversationSummary && (
                    <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-2">
                            <ClipboardList size={13} /> Resumen
                        </div>
                        <p className="text-xs text-gray-700 leading-relaxed bg-white rounded-lg p-2.5 border border-gray-100 break-words overflow-y-auto max-h-32">
                            {conversationSummary}
                        </p>
                    </div>
                )}

                {/* Status indicator */}
                <div className="p-4 mt-auto">
                    <div className={`text-[10px] font-semibold px-2 py-1 rounded-full text-center ${
                        status === 'chatting' ? 'bg-green-100 text-green-700' :
                        status === 'transferred' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                    }`}>
                        {status === 'chatting' ? (hasSimulationEvent ? 'Seguimiento activo' : 'Conversacion activa') :
                         status === 'transferred' ? (assignedAdvisor ? `Asesor: ${assignedAdvisor.name}` : 'Transferido a asesor') :
                         'Venta cerrada'}
                    </div>
                </div>
            </div>

            {/* Main Chat Panel */}
            <div className="flex-1 flex flex-col min-w-0 order-1">

                {/* Header */}
                <div className="px-5 py-4 border-b flex justify-between items-center bg-white sticky top-0 z-10 shadow-sm">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl bg-gray-100 w-10 h-10 flex items-center justify-center rounded-xl flex-shrink-0">{agent.avatar}</span>
                        <div>
                            <h3 className="font-bold text-base text-gray-900 flex items-center gap-2 leading-tight">
                                {agent.name}
                                <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold tracking-wide">LIVE</span>
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5">{agent.role} · Playground de prueba</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Agent mode toggle */}
                        <div className="flex bg-gray-100 rounded-lg p-0.5">
                            <button
                                onClick={() => setAgentMode('sales')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${agentMode === 'sales' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <ShoppingCart size={12} /> Ventas
                            </button>
                            <button
                                onClick={() => setAgentMode('search')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${agentMode === 'search' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                <Search size={12} /> Buscar Cursos
                            </button>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Course Context Mini Card */}
                {courseContext && (
                    <>
                    <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-white border border-blue-200 flex items-center justify-center text-xl overflow-hidden">
                                {courseContext.image ? <img src={courseContext.image} className="w-full h-full object-cover" /> : '📚'}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">Vendiendo curso:</p>
                                <p className="text-sm font-medium text-blue-800 line-clamp-1">{courseContext.title}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-blue-600 font-bold">{courseContext.currency} {courseContext.price || 'Gratis'}</p>
                        </div>
                    </div>
                    {courseContext.attachments?.length > 0 && (
                        <div className="px-4 py-2 bg-blue-50/50 border-b border-blue-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
                            <span className="text-[10px] text-blue-500 font-semibold whitespace-nowrap">Adjuntos:</span>
                            {courseContext.attachments.map((att: any) => (
                                <a
                                    key={att.id}
                                    href={att.url !== '#' ? att.url : undefined}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-blue-200 rounded-lg text-[11px] text-blue-700 hover:bg-blue-100 transition-colors whitespace-nowrap"
                                >
                                    {att.type === 'pdf' ? <FileText size={12} className="text-red-500" /> : <Download size={12} />}
                                    {att.name}
                                    {att.size && <span className="text-blue-400">({att.size})</span>}
                                </a>
                            ))}
                        </div>
                    )}
                    </>
                )}

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-5 bg-gray-50 space-y-4">
                    {/* Catalog Context Indicator */}
                    <div className="flex justify-center mb-2">
                        {catalogLoading ? (
                            <span className="text-[10px] bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100 flex items-center gap-2 shadow-sm">
                                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping"></span>
                                Sincronizando catálogo real...
                            </span>
                        ) : fullCatalog?.courses?.length || fullCatalog?.programs?.length || fullCatalog?.webinars?.length ? (
                            <span className="text-[10px] bg-green-50 text-green-600 px-3 py-1 rounded-full border border-green-100 flex items-center gap-1 shadow-sm animate-fade-in">
                                <CheckCircle size={10} className="text-green-500" />
                                Agente conectado al catálogo (Grounding OK)
                            </span>
                        ) : (
                            <span className="text-[10px] bg-red-50 text-red-600 px-3 py-1 rounded-full border border-red-100 flex items-center gap-1 shadow-sm animate-shake">
                                <X size={10} />
                                Catálogo vacío (Peligro de alucinación)
                            </span>
                        )}
                    </div>

                    {messages.map((msg, idx) => (
                        msg.role === 'simulation' ? (
                            <div key={idx} className="flex justify-center animate-fade-in">
                                <span className="text-[11px] bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                                    <Clock size={10} className="text-amber-500" />
                                    {msg.content}
                                </span>
                            </div>
                        ) : (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm relative transition-all hover:shadow-md ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                }`}>
                                <div className="text-sm leading-relaxed">{renderMd(msg.content)}</div>
                                <p className={`text-[10px] mt-2 opacity-50 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                    {msg.role === 'user' ? 'Tú (Alumno)' : agent.name}
                                </p>
                            </div>
                        </div>
                        )
                    ))}
                    {loading && (
                        <div className="flex justify-start animate-fade-in flex-col gap-2">
                            <span className="text-[10px] text-gray-400 italic ml-2">
                                {messages.length % 2 === 0 ? "Buscando en el catálogo..." : "Consultando base de datos..."}
                            </span>
                            <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm border border-gray-100 flex gap-1 w-fit">
                                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                            </div>
                        </div>
                    )}

                    {/* Status Indicators */}
                    {status === 'transferred' && (
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3 animate-slide-in-up">
                            <div className="bg-amber-100 p-2 rounded-full text-amber-600 animate-pulse"><Phone size={20} /></div>
                            <div className="flex-1">
                                <p className="font-bold text-amber-900 text-sm">Transferido a Ventas</p>
                                {assignedAdvisor ? (
                                    <div className="mt-1">
                                        <p className="text-xs text-amber-700">Asesor asignado: <strong>{assignedAdvisor.name}</strong></p>
                                        {assignedAdvisor.phone && <p className="text-xs text-amber-600">Tel: {assignedAdvisor.phone}</p>}
                                        {assignedAdvisor.whatsapp && <p className="text-xs text-amber-600">WhatsApp: {assignedAdvisor.whatsapp}</p>}
                                    </div>
                                ) : (
                                    <p className="text-xs text-amber-700">El agente ha detectado una oportunidad y está derivando el lead.</p>
                                )}
                            </div>
                        </div>
                    )}
                    {status === 'closed' && (
                        <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center gap-3 animate-slide-in-up">
                            <div className="bg-green-100 p-2 rounded-full text-green-600 animate-bounce"><CheckCircle size={20} /></div>
                            <div>
                                <p className="font-bold text-green-900 text-sm">¡Venta Cerrada!</p>
                                <p className="text-xs text-green-700">El agente ha logrado concretar la inscripción exitosamente.</p>
                            </div>
                        </div>
                    )}

                    <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t space-y-3">
                    {/* Quick chips for testing */}
                    <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                        {(agentMode === 'search' ? [
                            "¿Qué cursos tienen disponibles?",
                            "Busco algo de marketing digital",
                            "Quiero comparar opciones virtuales",
                            "¿Cuál es el más económico?",
                            "¿Tienen algo de tecnología o IA?"
                        ] : courseContext ? [
                            "¿De qué trata el curso?",
                            "¿Cuál es el precio?",
                            "¿Tienen facilidades de pago?",
                            "Lo quiero comprar ahora",
                            "Quiero hablar con un humano"
                        ] : [
                            "¿Qué cursos tienen?",
                            "Busco algo virtual y flexible",
                            "¿Qué programas hay?",
                            "¿Tienen cursos de tecnología?",
                            "Quiero hablar con un asesor"
                        ]).map(chip => (
                            <button
                                key={chip}
                                onClick={() => sendMessage(chip)}
                                className="whitespace-nowrap px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-full border transition-colors"
                            >
                                {chip}
                            </button>
                        ))}
                    </div>

                    {/* Simulation buttons */}
                    <div className="pt-2 border-t border-dashed border-gray-200">
                    <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                        <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider self-center whitespace-nowrap mr-1">Simular:</span>
                        <button onClick={() => triggerSimulation('visto15')} disabled={loading || status !== 'chatting'}
                            className="whitespace-nowrap px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs rounded-full border border-amber-200 transition-colors flex items-center gap-1 disabled:opacity-40">
                            <Clock size={10} /> Visto 15min
                        </button>
                        <button onClick={() => triggerSimulation('visto1h')} disabled={loading || status !== 'chatting'}
                            className="whitespace-nowrap px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs rounded-full border border-amber-200 transition-colors flex items-center gap-1 disabled:opacity-40">
                            <Clock size={10} /> Visto 1h
                        </button>
                        <button onClick={() => triggerSimulation('visto5h')} disabled={loading || status !== 'chatting'}
                            className="whitespace-nowrap px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs rounded-full border border-amber-200 transition-colors flex items-center gap-1 disabled:opacity-40">
                            <Clock size={10} /> Visto 5h
                        </button>
                        <button onClick={() => triggerSimulation('negativa')} disabled={loading || status !== 'chatting'}
                            className="whitespace-nowrap px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs rounded-full border border-red-200 transition-colors flex items-center gap-1 disabled:opacity-40">
                            <ThumbsDown size={10} /> Resp. negativa
                        </button>
                        <button onClick={() => triggerSimulation('asesor')} disabled={loading || status !== 'chatting'}
                            className="whitespace-nowrap px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs rounded-full border border-purple-200 transition-colors flex items-center gap-1 disabled:opacity-40">
                            <UserCheck size={10} /> Pasar con asesor
                        </button>
                    </div>
                    </div>

                    <div className="relative">
                        <input
                            className="input w-full pr-12 py-4 pl-5 text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-500 rounded-xl"
                            placeholder="Escribe como un alumno interesado..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendMessage()}
                            disabled={loading || status !== 'chatting'}
                        />
                        <button
                            onClick={() => sendMessage()}
                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${input.trim() && !loading ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400'
                                }`}
                            disabled={!input.trim() || loading || status !== 'chatting'}
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
}
