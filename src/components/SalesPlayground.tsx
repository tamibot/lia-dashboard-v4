import { useState, useEffect, useRef } from 'react';
import { Send, X, Phone, CheckCircle, Clock, ThumbsDown, UserCheck } from 'lucide-react';
import type { AiAgent, OrgProfile } from '../lib/types';
import { chatWithAgent } from '../lib/gemini';
import { API_CONFIG } from '../config/api.config';

interface SalesPlaygroundProps {
    agent: AiAgent;
    courseContext?: any;
    orgProfile?: OrgProfile;
    onClose: () => void;
}

export default function SalesPlayground({ agent, courseContext, orgProfile, onClose }: SalesPlaygroundProps) {
    const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'chatting' | 'closed' | 'transferred'>('chatting');
    const [fullCatalog, setFullCatalog] = useState<any>(null);

    const chatEndRef = useRef<HTMLDivElement>(null);

    // Fetch the REAL catalog from the backend so the agent doesn't invent courses
    const [catalogLoading, setCatalogLoading] = useState(true);

    // Fetch the REAL catalog from the backend so the agent doesn't invent courses
    useEffect(() => {
        // Try to get org slug from profile; fall back to localStorage or default
        const orgSlug = (orgProfile as any)?.slug
            || localStorage.getItem('orgSlug')
            || 'innovation-institute';

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

    useEffect(() => {
        setMessages([{
            role: 'assistant',
            content: courseContext
                ? `👋 ¡Hola! Soy ${agent.name}, ${agent.role}. Veo que te interesa **${courseContext.title}**. ¿Qué te gustaría saber?`
                : `👋 ¡Hola! Soy ${agent.name}, ${agent.role}. Cuéntame: ¿qué tipo de formación estás buscando hoy? Puedo ayudarte con cursos, programas, webinars y más. 😊`
        }]);
    }, [agent.name, agent.role]); // Reduced deps to avoid resets

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

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
            const response = await chatWithAgent(agent, messages, msg, courseContext, orgProfile, fullCatalog);
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);

            if (response.toLowerCase().includes('agendado') || response.toLowerCase().includes('asesor') || response.toLowerCase().includes('paso con el equipo')) {
                setStatus('transferred');
            } else if (response.toLowerCase().includes('inscripción completada') || response.toLowerCase().includes('pago exitoso') || response.toLowerCase().includes('¡bienvenido al curso!')) {
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
            visto15: { label: '⏱ Dejó en visto 15 minutos', msg: '[SIMULACION:VISTO_15MIN] El prospecto dejó en visto por 15 minutos. Reengánchalo.' },
            visto1h: { label: '⏰ Dejó en visto 1 hora', msg: '[SIMULACION:VISTO_1H] El prospecto estuvo 1 hora sin responder. Haz seguimiento cálido.' },
            visto5h: { label: '🕐 Dejó en visto 5 horas', msg: '[SIMULACION:VISTO_5H] Pasaron 5 horas sin respuesta. Reactiva con urgencia o nuevo ángulo.' },
            negativa: { label: '👎 Respuesta negativa', msg: '[SIMULACION:NEGATIVA] El prospecto dijo que no está interesado. Maneja la objeción y rescata el lead.' },
            asesor: { label: '🙋 Quiere hablar con asesor', msg: '[SIMULACION:ASESOR] El prospecto quiere hablar con una persona. Haz el handoff de forma profesional.' },
        };
        const sim = simulations[type];
        sendMessage(sim.msg, true, sim.label);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex justify-end animate-fade-in">
            <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col animate-slide-in-right">

                {/* Header */}
                <div className="p-5 border-b flex justify-between items-center bg-white sticky top-0 z-10 shadow-sm">
                    <div className="flex items-center gap-4">
                        <span className="text-3xl bg-gray-100 w-12 h-12 flex items-center justify-center rounded-xl">{agent.avatar}</span>
                        <div>
                            <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                                Roleplay: {agent.name}
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">LIVE</span>
                            </h3>
                            <p className="text-xs text-gray-500">{agent.role}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Course Context Mini Card */}
                {courseContext && (
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
                )}

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-6">
                    {/* Catalog Context Indicator */}
                    <div className="flex justify-center -mt-2 mb-4">
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
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
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
                            <div>
                                <p className="font-bold text-amber-900 text-sm">Transferido a Ventas</p>
                                <p className="text-xs text-amber-700">El agente ha detectado una oportunidad y está derivando el lead.</p>
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
                <div className="p-5 bg-white border-t space-y-4">
                    {/* Quick chips for testing */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {(courseContext ? [
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
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
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
    );
}
