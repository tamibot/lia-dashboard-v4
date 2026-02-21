import { useState, useEffect, useRef } from 'react';
import { Plus, Bot, Edit2, Trash2, Play, X, Loader, AlertTriangle, RefreshCw } from 'lucide-react';
import type { AiAgent, CursoLibre, OrgProfile } from '../lib/types';

import { courseService } from '../lib/services/course.service';
import { agentService } from '../lib/services/agent.service';
import { profileService } from '../lib/services/profile.service';
import SalesPlayground from '../components/SalesPlayground';

export default function MyAgents() {
    const [agents, setAgents] = useState<AiAgent[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [playgroundAgent, setPlaygroundAgent] = useState<AiAgent | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);
    const [profile, setProfile] = useState<OrgProfile | null>(null);

    // Form State
    const [agentForm, setAgentForm] = useState<Partial<AiAgent>>({
        name: '',
        role: 'Asistente de Ventas',
        personality: 'professional',
        tone: 'Profesional y directo',
        systemPrompt: '',
        expertise: [],
        avatar: '🤖'
    });

    // Playground State
    const [messages, setMessages] = useState<{ role: string, content: string }[]>([]);
    const [availableCourses, setAvailableCourses] = useState<(CursoLibre | any)[]>([]);
    const [selectedCourseId] = useState<string>('all');

    // Auto-scroll
    const chatEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(false);
            const [a, c, p, w, prof] = await Promise.all([
                agentService.getAll(),
                courseService.getAll('curso'),
                courseService.getAll('programa'),
                courseService.getAll('webinar'),
                profileService.get()
            ]);
            setAgents(a);
            setAvailableCourses([...c, ...p, ...w]);
            setProfile(prof);
        } catch (err) {
            console.error("Error fetching agents or catalog:", err);
            setError(true);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleEdit = (agent: AiAgent) => {
        setAgentForm({ ...agent });
        setEditingId(agent.id);
        setIsCreating(true);
    };

    const handleSaveAgent = async () => {
        if (!agentForm.name || !agentForm.role) return;

        try {
            setIsLoading(true);
            if (editingId) {
                const updated = await agentService.update(editingId, agentForm);
                setAgents(prev => prev.map(a => a.id === editingId ? updated : a));
            } else {
                const newAgent = await agentService.create({
                    ...agentForm,
                    language: 'es',
                    isActive: true,
                    createdAt: new Date().toISOString()
                });
                setAgents([...agents, newAgent]);
            }
            setIsCreating(false);
            setEditingId(null);
            setAgentForm({ name: '', role: 'Asistente de Ventas', personality: 'professional', tone: 'Profesional y directo', expertise: [], avatar: '🤖', systemPrompt: '' });
        } catch (err) {
            console.error("Error saving agent:", err);
            alert("Error al guardar el agente");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Seguro que quieres eliminar este agente?')) {
            try {
                await agentService.delete(id);
                setAgents(prev => prev.filter(a => a.id !== id));
            } catch (err) {
                console.error("Error deleting agent:", err);
                alert("Error al eliminar el agente");
            }
        }
    };

    const openPlayground = (agent: AiAgent) => {
        setPlaygroundAgent(agent);
        setMessages([{ role: 'assistant', content: `👋 ¡Hola! Soy ${agent.name}. ¿En qué puedo ayudarte hoy?` }]);
    };

    if (isLoading && agents.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Cargando tus agentes...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center max-w-sm px-6">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Error al cargar datos</h3>
                    <p className="text-gray-600 mb-6">No pudimos conectar con el servidor para obtener tus agentes.</p>
                    <button
                        onClick={fetchData}
                        className="btn btn-primary w-full flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" /> Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-8 py-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-7xl mx-auto w-full">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <Bot className="w-8 h-8 text-blue-600" />
                            Mis Agentes IA
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Configura y entrena a tus vendedores virtuales 24/7.</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingId(null);
                            setAgentForm({ name: '', role: 'Asistente de Ventas', personality: 'professional', tone: 'Profesional y directo', expertise: [], avatar: '🤖', systemPrompt: '' });
                            setIsCreating(true);
                        }}
                        className="btn btn-primary flex items-center gap-2 shadow-lg shadow-blue-100"
                    >
                        <Plus className="w-4 h-4" /> Nuevo Agente
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-8 overflow-y-auto w-full">
                <div className="max-w-7xl mx-auto">
                    {agents.length === 0 ? (
                        <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-100 max-w-2xl mx-auto">
                            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Bot className="w-12 h-12 text-blue-500" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-2">No tienes agentes activos</h2>
                            <p className="text-gray-500 mb-8 max-w-md mx-auto">Crea tu primer agente para automatizar la atención y ventas de tus cursos.</p>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="btn btn-primary"
                            >
                                <Plus className="w-4 h-4 mr-2" /> Crear mi primer agente
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {agents.map((agent) => (
                                <div key={agent.id} className="group bg-white rounded-3xl border border-gray-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all p-6 relative overflow-hidden flex flex-col h-full">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50/50 to-transparent rounded-bl-full -mr-16 -mt-16 group-hover:scale-110 transition-transform" />

                                    <div className="flex items-center gap-4 mb-6 relative">
                                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
                                            {agent.avatar || '🤖'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{agent.name}</h3>
                                            <p className="text-xs text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded inline-block mt-1">{agent.role}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-8 flex-1">
                                        <div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Personalidad</p>
                                            <div className="flex flex-wrap gap-2">
                                                <span className="text-[10px] px-2 py-1 bg-blue-50 text-blue-600 rounded-full font-bold uppercase ring-1 ring-blue-100">
                                                    {agent.personality}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="line-clamp-3 text-sm text-gray-600 leading-relaxed italic border-l-2 border-blue-100 pl-3">
                                            "{agent.tone}"
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-4 border-t border-gray-50 mt-auto">
                                        <button
                                            onClick={() => openPlayground(agent)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-100 group-hover:-translate-y-0.5"
                                        >
                                            <Play className="w-4 h-4 fill-current" /> Probar
                                        </button>
                                        <button
                                            onClick={() => handleEdit(agent)}
                                            className="p-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(agent.id)}
                                            className="p-2.5 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Modal */}
            {isCreating && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{editingId ? 'Editar Agente' : 'Nuevo Agente IA'}</h3>
                                <p className="text-sm text-gray-500">Personaliza el comportamiento de tu IA.</p>
                            </div>
                            <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Nombre del Agente</label>
                                    <input
                                        className="input w-full"
                                        placeholder="Ej: Sofia (Ventas)"
                                        value={agentForm.name}
                                        onChange={e => setAgentForm({ ...agentForm, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Rol / Cargo</label>
                                    <input
                                        className="input w-full"
                                        placeholder="Ej: Asistente de Admisiones"
                                        value={agentForm.role}
                                        onChange={e => setAgentForm({ ...agentForm, role: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Personalidad</label>
                                    <select
                                        className="input w-full"
                                        value={agentForm.personality}
                                        onChange={e => setAgentForm({ ...agentForm, personality: e.target.value as any })}
                                    >
                                        <option value="professional">Profesional</option>
                                        <option value="friendly">Amigable</option>
                                        <option value="empathetic">Empático</option>
                                        <option value="enthusiastic">Entusiasta</option>
                                        <option value="strict">Estricto / Directo</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Avatar</label>
                                    <div className="flex gap-3 text-xl overflow-x-auto pb-2">
                                        {['🤖', '👩‍💼', '👨‍💼', '🎓', '⚡', '💼', '🚀', '⭐', '🧠'].map(emoji => (
                                            <button
                                                key={emoji}
                                                onClick={() => setAgentForm({ ...agentForm, avatar: emoji })}
                                                className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center border hover:bg-blue-50 transition-colors ${agentForm.avatar === emoji ? 'border-blue-500 bg-blue-100 shadow-sm ring-2 ring-blue-200' : 'border-gray-200'}`}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Tono de Voz</label>
                                <input
                                    className="input w-full"
                                    placeholder="Ej: Usa emojis, es muy formal, hace preguntas cortas..."
                                    value={agentForm.tone}
                                    onChange={e => setAgentForm({ ...agentForm, tone: e.target.value })}
                                />
                                <p className="text-xs text-gray-400 mt-1">Define cómo se expresa el agente.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex justify-between">
                                    <span>Instrucciones del Sistema (System Prompt)</span>
                                    <span className="text-blue-600 text-xs font-normal cursor-pointer hover:underline" onClick={() => setAgentForm({ ...agentForm, systemPrompt: "Tu objetivo es vender. Si el usuario objeta por precio, ofrece un plan de pagos. Sé persistente pero amable." })}>Usar sugerencia</span>
                                </label>
                                <textarea
                                    className="input w-full h-32 resize-none font-mono text-sm leading-relaxed"
                                    placeholder="Instrucciones específicas para la IA. Ej: 'Nunca menciones precios sin antes preguntar el país...'"
                                    value={agentForm.systemPrompt}
                                    onChange={e => setAgentForm({ ...agentForm, systemPrompt: e.target.value })}
                                />
                                <p className="text-xs text-gray-400 mt-1">Tip: Dale reglas claras sobre qué hacer y qué NO hacer.</p>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                            <button onClick={() => setIsCreating(false)} className="btn btn-ghost text-gray-600">Cancelar</button>
                            <button
                                onClick={handleSaveAgent}
                                className="btn btn-primary px-8 shadow-lg disabled:opacity-50"
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader className="w-4 h-4 animate-spin" /> : (editingId ? 'Guardar Cambios' : 'Crear Agente')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Testing Playground Modal */}
            {playgroundAgent && (
                <SalesPlayground
                    agent={playgroundAgent}
                    courseContext={selectedCourseId !== 'all' ? availableCourses.find(c => c.id === selectedCourseId) : null}
                    orgProfile={profile || undefined}
                    onClose={() => setPlaygroundAgent(null)}
                />
            )}
        </div>
    );
}
