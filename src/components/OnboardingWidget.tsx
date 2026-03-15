import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronRight, X, Rocket } from 'lucide-react';
import { settingsService } from '../lib/services/settings.service';
import { integrationsService } from '../lib/services/integrations.service';

interface OnboardingStep {
    id: string;
    label: string;
    description: string;
    link: string;
    completed: boolean;
}

interface OnboardingWidgetProps {
    totalProducts: number;
    hasAgent: boolean;
}

const STORAGE_KEY = 'lia_onboarding_dismissed';

export default function OnboardingWidget({ totalProducts, hasAgent }: OnboardingWidgetProps) {
    const [dismissed, setDismissed] = useState(() => localStorage.getItem(STORAGE_KEY) === 'true');
    const [steps, setSteps] = useState<OnboardingStep[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (dismissed) return;

        const checkSteps = async () => {
            try {
                const [keys, ghlStatus] = await Promise.all([
                    settingsService.getApiKeys().catch(() => ({ gemini_key: null, openai_key: null })),
                    integrationsService.getGhlStatus().catch(() => ({ connected: false })),
                ]);

                const hasAiKeys = !!(keys.gemini_key || keys.openai_key);
                const hasGhl = !!ghlStatus.connected;

                setSteps([
                    {
                        id: 'account',
                        label: 'Crear tu cuenta',
                        description: 'Registrate en la plataforma',
                        link: '/account',
                        completed: true, // Always done if they're here
                    },
                    {
                        id: 'ghl',
                        label: 'Conectar GoHighLevel',
                        description: 'Sincroniza tu CRM para gestionar leads',
                        link: '/settings',
                        completed: hasGhl,
                    },
                    {
                        id: 'ai-keys',
                        label: 'Configurar IA (Gemini / OpenAI)',
                        description: 'Activa el asistente de ventas inteligente',
                        link: '/settings',
                        completed: hasAiKeys,
                    },
                    {
                        id: 'first-product',
                        label: 'Subir tu primer producto',
                        description: 'Carga un curso, webinar o programa',
                        link: '/courses/upload',
                        completed: totalProducts > 0,
                    },
                    {
                        id: 'agent',
                        label: 'Configurar Agente de Ventas',
                        description: 'Personaliza a LIA para que venda por ti',
                        link: '/agentes',
                        completed: hasAgent,
                    },
                ]);
            } catch {
                // Fail silently
            } finally {
                setLoading(false);
            }
        };

        checkSteps();
    }, [dismissed, totalProducts, hasAgent]);

    if (dismissed || loading) return null;

    const completedCount = steps.filter(s => s.completed).length;
    const allComplete = completedCount === steps.length;

    if (allComplete) return null;

    const percent = Math.round((completedCount / steps.length) * 100);

    const handleDismiss = () => {
        localStorage.setItem(STORAGE_KEY, 'true');
        setDismissed(true);
    };

    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 mb-8 relative">
            {/* Dismiss button */}
            <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/60 rounded-lg transition-colors"
                title="Ocultar guia"
            >
                <X size={16} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Rocket size={20} className="text-blue-600" />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-sm">Configura tu plataforma para vender</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Completa estos pasos para empezar a generar ventas con LIA</p>
                </div>
                <div className="text-right flex-shrink-0">
                    <span className="text-lg font-black text-blue-700">{percent}%</span>
                    <p className="text-[10px] text-gray-400">{completedCount}/{steps.length} pasos</p>
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-blue-100 rounded-full mb-5 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700"
                    style={{ width: `${percent}%` }}
                />
            </div>

            {/* Steps */}
            <div className="space-y-2">
                {steps.map((step, i) => (
                    <Link
                        key={step.id}
                        to={step.link}
                        className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${
                            step.completed
                                ? 'bg-white/40 opacity-60'
                                : 'bg-white hover:bg-white hover:shadow-sm border border-transparent hover:border-blue-200'
                        }`}
                    >
                        {/* Step indicator */}
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                            step.completed
                                ? 'bg-green-100 text-green-600'
                                : 'bg-blue-100 text-blue-600'
                        }`}>
                            {step.completed ? <Check size={14} /> : i + 1}
                        </div>

                        {/* Label */}
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${step.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                                {step.label}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate">{step.description}</p>
                        </div>

                        {/* Arrow */}
                        {!step.completed && (
                            <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                        )}
                    </Link>
                ))}
            </div>
        </div>
    );
}
