import { useState, useEffect, useRef } from 'react';
import { Send, X, Phone, CheckCircle } from 'lucide-react';
import type { AiAgent, OrgProfile } from '../lib/types';
import { chatWithAgent } from '../lib/gemini';

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

    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMessages([{
            role: 'assistant',
            content: `👋 ¡Hola! Soy ${agent.name}, ${agent.role}. Veo que te interesa ${courseContext?.title || 'nuestros cursos'}. ¿En qué puedo ayudarte?`
        }]);
    }, [agent, courseContext]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (overrideMsg?: string) => {
        const msg = overrideMsg || input;
        if (!msg.trim() || loading || status !== 'chatting') return;

        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: msg }]);
        setLoading(true);

        try {
            const response = await chatWithAgent(agent, messages, msg, courseContext, orgProfile);
            setMessages(prev => [...prev, { role: 'assistant', content: response }]);

            // Logic to detect closure or transfer (Simulated by simple keyword detection or AI response flags)
            // In a real app, the AI would return a structured field.
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
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl p-4 shadow-sm relative ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'
                                }`}>
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                <p className={`text-[10px] mt-2 opacity-50 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                    {msg.role === 'user' ? 'Tú (Alumno)' : agent.name}
                                </p>
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-sm border border-gray-100 flex gap-1">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                            </div>
                        </div>
                    )}

                    {/* Status Indicators */}
                    {status === 'transferred' && (
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3 animate-fade-in">
                            <div className="bg-amber-100 p-2 rounded-full text-amber-600"><Phone size={20} /></div>
                            <div>
                                <p className="font-bold text-amber-900 text-sm">Transferido a Ventas</p>
                                <p className="text-xs text-amber-700">El agente ha detectado una oportunidad y está derivando el lead.</p>
                            </div>
                        </div>
                    )}
                    {status === 'closed' && (
                        <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center gap-3 animate-fade-in">
                            <div className="bg-green-100 p-2 rounded-full text-green-600"><CheckCircle size={20} /></div>
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
                        {[
                            "¿De qué trata el curso?",
                            "¿Cuál es el precio?",
                            "¿Tienen facilidades de pago?",
                            "Lo quiero comprar ahora",
                            "Quiero hablar con un humano"
                        ].map(chip => (
                            <button
                                key={chip}
                                onClick={() => sendMessage(chip)}
                                className="whitespace-nowrap px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs rounded-full border transition-colors"
                            >
                                {chip}
                            </button>
                        ))}
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
