import { useState, useEffect } from 'react';
import { Bot, Play, Save, Loader, RefreshCw, AlertTriangle, Check } from 'lucide-react';
import type { AiAgent, OrgProfile } from '../lib/types';
import { agentService } from '../lib/services/agent.service';
import { profileService } from '../lib/services/profile.service';
import SalesPlayground from '../components/SalesPlayground';

// ── Personality presets ───────────────────────────────────────────────
const PERSONALITIES = [
    {
        value: 'enthusiastic',
        label: 'Cercana y entusiasta',
        desc: 'Usa emojis, tutea, es muy energética y empuja hacia el cierre.',
        tone: 'Cálida, usa emojis frecuentemente, tutea siempre, muy persuasiva y directa al cierre.',
        emoji: '🔥',
    },
    {
        value: 'friendly',
        label: 'Amigable y consultiva',
        desc: 'Escucha activamente, hace preguntas, genera confianza antes de vender.',
        tone: 'Amigable y empática, hace preguntas para entender al prospecto, genera confianza.',
        emoji: '😊',
    },
    {
        value: 'professional',
        label: 'Profesional y directa',
        desc: 'Formal, sin emojis, respuestas precisas. Ideal para B2B o públicos ejecutivos.',
        tone: 'Formal y precisa, sin emojis, lenguaje ejecutivo. Va directo al punto.',
        emoji: '💼',
    },
    {
        value: 'empathetic',
        label: 'Empática y motivadora',
        desc: 'Se conecta con las emociones del prospecto, inspira y motiva a tomar acción.',
        tone: 'Empática, conecta emocionalmente, motiva con la transformación del producto.',
        emoji: '💡',
    },
];

const AVATARS = ['🤖', '👩‍💼', '👨‍💼', '🎓', '⚡', '💼', '🚀', '⭐', '🧠', '🦋'];

export default function AiAgentsPage() {
    const [agent, setAgent] = useState<AiAgent | null>(null);
    const [profile, setProfile] = useState<OrgProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState(false);
    const [playground, setPlayground] = useState(false);

    // Form
    const [name, setName] = useState('LIA');
    const [role, setRole] = useState('Asistente de Ventas');
    const [personality, setPersonality] = useState('enthusiastic');
    const [avatar, setAvatar] = useState('🤖');
    const [systemPrompt, setSystemPrompt] = useState('');

    const selectedPersonality = PERSONALITIES.find(p => p.value === personality) || PERSONALITIES[0];

    const load = async () => {
        try {
            setLoading(true);
            setError(false);
            const [agents, prof] = await Promise.all([
                agentService.getAll(),
                profileService.get().catch(() => null),
            ]);
            setProfile(prof);

            if (agents.length > 0) {
                const a = agents[0];
                setAgent(a);
                setName(a.name || 'LIA');
                setRole(a.role || 'Asistente de Ventas');
                setPersonality(a.personality || 'enthusiastic');
                setAvatar(a.avatar || '🤖');
                setSystemPrompt(a.systemPrompt || '');
            }
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const handleSave = async () => {
        if (!name.trim()) return;
        setSaving(true);
        try {
            const tone = selectedPersonality.tone;
            const payload = { name, role, personality, avatar, tone, systemPrompt, isActive: true, language: 'es' };
            if (agent) {
                const updated = await agentService.update(agent.id, payload);
                setAgent(updated);
            } else {
                const created = await agentService.create(payload);
                setAgent(created);
            }
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch {
            alert('Error al guardar. Inténtalo de nuevo.');
        } finally {
            setSaving(false);
        }
    };

    const currentAgent: AiAgent = {
        id: agent?.id || 'preview',
        orgId: '',
        name,
        role,
        personality: personality as any,
        tone: selectedPersonality.tone,
        avatar,
        systemPrompt,
        isActive: true,
        language: 'es',
        expertise: [],
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <p className="text-gray-600 mb-4">Error al cargar datos del servidor.</p>
                    <button onClick={load} className="btn btn-primary gap-2"><RefreshCw size={15} /> Reintentar</button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content max-w-3xl">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Agente de Ventas</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Configura la personalidad y comportamiento de <span className="font-semibold text-gray-700">LIA</span>, tu asistente de ventas 24/7.
                    </p>
                </div>
                <button
                    onClick={() => setPlayground(true)}
                    className="btn btn-primary gap-2 shadow-md shadow-blue-100"
                >
                    <Play size={15} className="fill-current" /> Probar Agente
                </button>
            </div>

            <div className="space-y-5">

                {/* Identity card */}
                <div className="card">
                    <h3 className="text-sm font-bold text-gray-800 mb-4">Identidad del Agente</h3>
                    <div className="flex items-start gap-6">
                        {/* Avatar preview */}
                        <div className="flex-shrink-0 text-center">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mb-2 shadow-sm">
                                {avatar}
                            </div>
                            <div className="flex flex-wrap gap-1 justify-center w-16">
                                {AVATARS.map(em => (
                                    <button
                                        key={em}
                                        onClick={() => setAvatar(em)}
                                        className={`w-6 h-6 rounded text-xs flex items-center justify-center transition-all ${avatar === em ? 'bg-blue-100 ring-2 ring-blue-400' : 'hover:bg-gray-100'}`}
                                    >
                                        {em}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 space-y-3">
                            <div>
                                <label className="label-sm">Nombre del agente</label>
                                <input
                                    className="input w-full font-semibold"
                                    placeholder="LIA"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Este es el nombre con el que se presentará a los prospectos.</p>
                            </div>
                            <div>
                                <label className="label-sm">Rol / Título</label>
                                <input
                                    className="input w-full"
                                    placeholder="Ej: Asistente de Ventas, Asesor de Admisiones"
                                    value={role}
                                    onChange={e => setRole(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Personality card */}
                <div className="card">
                    <h3 className="text-sm font-bold text-gray-800 mb-4">Personalidad y Temperamento</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {PERSONALITIES.map(p => (
                            <button
                                key={p.value}
                                onClick={() => setPersonality(p.value)}
                                className={`text-left p-4 rounded-xl border-2 transition-all ${
                                    personality === p.value
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg">{p.emoji}</span>
                                    <span className={`font-semibold text-sm ${personality === p.value ? 'text-blue-700' : 'text-gray-800'}`}>{p.label}</span>
                                    {personality === p.value && <Check size={13} className="text-blue-600 ml-auto" />}
                                </div>
                                <p className="text-xs text-gray-500 leading-relaxed">{p.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom instructions */}
                <div className="card">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-bold text-gray-800">Instrucciones Personalizadas</h3>
                        <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">Opcional</span>
                    </div>
                    <textarea
                        className="input w-full h-28 text-sm font-mono resize-none"
                        placeholder={`Ej: Nunca menciones el precio sin antes preguntar sobre sus objetivos.\nSiempre ofrece una llamada gratuita de 15 minutos como primer paso.`}
                        value={systemPrompt}
                        onChange={e => setSystemPrompt(e.target.value)}
                    />
                    <p className="text-[10px] text-gray-400 mt-1.5">
                        Reglas adicionales para el agente. Se combinan con su personalidad base.
                    </p>
                </div>

                {/* Preview banner */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-3">
                    <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">{avatar}</div>
                    <div>
                        <p className="text-xs font-bold text-gray-700">{name} · {role}</p>
                        <p className="text-xs text-gray-500 mt-0.5 italic">"{selectedPersonality.tone}"</p>
                    </div>
                </div>

                {/* Save */}
                <button
                    onClick={handleSave}
                    disabled={saving || !name.trim()}
                    className="w-full btn btn-primary py-3 gap-2 text-sm"
                >
                    {saving
                        ? <><Loader size={15} className="animate-spin" /> Guardando...</>
                        : saved
                            ? <><Check size={15} /> Cambios guardados</>
                            : <><Save size={15} /> Guardar Configuración</>
                    }
                </button>
            </div>

            {/* Playground */}
            {playground && (
                <SalesPlayground
                    agent={currentAgent}
                    orgProfile={profile || undefined}
                    onClose={() => setPlayground(false)}
                />
            )}
        </div>
    );
}
