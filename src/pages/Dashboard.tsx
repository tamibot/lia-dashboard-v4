import { useEffect, useState } from 'react';
import { courseService } from '../lib/services/course.service';
import { agentService } from '../lib/services/agent.service';
import { profileService } from '../lib/services/profile.service';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, BookOpen, GraduationCap, Video, Wrench, Repeat, MessageCircle, FileText, Play, Plus, ArrowRight, ListFilter, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { AiAgent, OrgProfile } from '../lib/types';
import SalesPlayground from '../components/SalesPlayground';
import OnboardingWidget from '../components/OnboardingWidget';

const StatCard = ({
    bg, border, iconBg, iconColor, icon: Icon, label, labelColor, value, valueColor, onClick, isLoading
}: {
    bg: string; border: string; iconBg: string; iconColor: string; icon: any;
    label: string; labelColor: string; value: string | number; valueColor: string;
    onClick?: () => void; isLoading?: boolean;
}) => (
    <div
        className={`card ${bg} ${border} border group ${onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''} transition-all duration-150`}
        onClick={onClick}
    >
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon className={iconColor} size={20} />
            </div>
            <div className="flex-1">
                <p className={`text-[11px] font-bold ${labelColor} uppercase tracking-wide`}>{label}</p>
                {isLoading ? (
                    <div className="h-7 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-0.5" />
                ) : (
                    <h4 className={`text-2xl font-black ${valueColor} leading-none mt-0.5`}>{value}</h4>
                )}
            </div>
            {onClick && (
                <ArrowRight size={14} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            )}
        </div>
    </div>
);

export default function DashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ cursos: 0, programas: 0, webinars: 0, talleres: 0, subscripciones: 0, asesorias: 0, postulaciones: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [agents, setAgents] = useState<AiAgent[]>([]);
    const [profile, setProfile] = useState<OrgProfile | null>(null);
    const [playgroundAgent, setPlaygroundAgent] = useState<AiAgent | null>(null);
    const goToCatalog = (tab: string) => navigate(`/courses?tab=${tab}`);

    useEffect(() => {
        Promise.all([
            courseService.getAll('curso').catch(() => []),
            courseService.getAll('programa').catch(() => []),
            courseService.getAll('webinar').catch(() => []),
            courseService.getAll('taller').catch(() => []),
            courseService.getAll('subscripcion').catch(() => []),
            courseService.getAll('asesoria').catch(() => []),
            courseService.getAll('postulacion').catch(() => []),
            agentService.getAll().catch(() => []),
            profileService.get().catch(() => null),
        ]).then(([c, p, w, t, sub, ase, post, ag, prof]) => {
            setStats({ cursos: c.length, programas: p.length, webinars: w.length, talleres: t.length, subscripciones: sub.length, asesorias: ase.length, postulaciones: post.length });
            setAgents(ag);
            if (prof) setProfile(prof);
        }).catch(err => {
            console.error("Error fetching dashboard data:", err);
        }).finally(() => {
            setIsLoading(false);
        });
    }, []);

    return (
        <div className="page-content">

            {/* Welcome */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                        Hola, {user?.name?.split(' ')[0] || 'Administrador'} 👋
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Bienvenido a tu panel de control de <span className="font-semibold text-gray-700 dark:text-gray-300">{user?.orgName}</span>.</p>
                </div>
            </div>

            {/* Onboarding Widget */}
            <OnboardingWidget
                totalProducts={Object.values(stats).reduce((a, b) => a + b, 0)}
                hasAgent={agents.length > 0}
            />

            {/* Stats */}
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Resumen del catálogo</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                <StatCard bg="bg-blue-50 dark:bg-blue-950/40" border="border-blue-100 dark:border-blue-900" iconBg="bg-blue-100 dark:bg-blue-900" iconColor="text-blue-600 dark:text-blue-400" icon={BookOpen} label="Cursos" labelColor="text-blue-600 dark:text-blue-400" value={stats.cursos} valueColor="text-blue-900 dark:text-blue-200" onClick={() => goToCatalog('curso')} isLoading={isLoading} />
                <StatCard bg="bg-purple-50 dark:bg-purple-950/40" border="border-purple-100 dark:border-purple-900" iconBg="bg-purple-100 dark:bg-purple-900" iconColor="text-purple-600 dark:text-purple-400" icon={GraduationCap} label="Programas" labelColor="text-purple-600 dark:text-purple-400" value={stats.programas} valueColor="text-purple-900 dark:text-purple-200" onClick={() => goToCatalog('programa')} isLoading={isLoading} />
                <StatCard bg="bg-orange-50 dark:bg-orange-950/40" border="border-orange-100 dark:border-orange-900" iconBg="bg-orange-100 dark:bg-orange-900" iconColor="text-orange-600 dark:text-orange-400" icon={Video} label="Webinars" labelColor="text-orange-600 dark:text-orange-400" value={stats.webinars} valueColor="text-orange-900 dark:text-orange-200" onClick={() => goToCatalog('webinar')} isLoading={isLoading} />
                <StatCard bg="bg-teal-50 dark:bg-teal-950/40" border="border-teal-100 dark:border-teal-900" iconBg="bg-teal-100 dark:bg-teal-900" iconColor="text-teal-600 dark:text-teal-400" icon={Wrench} label="Talleres" labelColor="text-teal-600 dark:text-teal-400" value={stats.talleres} valueColor="text-teal-900 dark:text-teal-200" onClick={() => goToCatalog('taller')} isLoading={isLoading} />
                <StatCard bg="bg-rose-50 dark:bg-rose-950/40" border="border-rose-100 dark:border-rose-900" iconBg="bg-rose-100 dark:bg-rose-900" iconColor="text-rose-600 dark:text-rose-400" icon={Repeat} label="Suscripciones" labelColor="text-rose-600 dark:text-rose-400" value={stats.subscripciones} valueColor="text-rose-900 dark:text-rose-200" onClick={() => goToCatalog('subscripcion')} isLoading={isLoading} />
                <StatCard bg="bg-emerald-50 dark:bg-emerald-950/40" border="border-emerald-100 dark:border-emerald-900" iconBg="bg-emerald-100 dark:bg-emerald-900" iconColor="text-emerald-600 dark:text-emerald-400" icon={MessageCircle} label="Asesorías" labelColor="text-emerald-600 dark:text-emerald-400" value={stats.asesorias} valueColor="text-emerald-900 dark:text-emerald-200" onClick={() => goToCatalog('asesoria')} isLoading={isLoading} />
                <StatCard bg="bg-amber-50 dark:bg-amber-950/40" border="border-amber-100 dark:border-amber-900" iconBg="bg-amber-100 dark:bg-amber-900" iconColor="text-amber-600 dark:text-amber-400" icon={FileText} label="Postulaciones" labelColor="text-amber-600 dark:text-amber-400" value={stats.postulaciones} valueColor="text-amber-900 dark:text-amber-200" onClick={() => goToCatalog('postulacion')} isLoading={isLoading} />
            </div>

            {/* Quick Actions */}
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Acciones rapidas</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Link to="/agentes" className="card hover:shadow-md transition-all cursor-pointer border-l-4 border-l-blue-500 group flex items-center gap-4">
                    <div className="w-11 h-11 bg-blue-50 dark:bg-blue-900/40 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform flex-shrink-0">
                        <Bot size={20} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Agente LIA</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Configurar vendedor IA</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                </Link>

                <Link to="/courses" className="card hover:shadow-md transition-all cursor-pointer border-l-4 border-l-emerald-500 group flex items-center gap-4">
                    <div className="w-11 h-11 bg-emerald-50 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform flex-shrink-0">
                        <BookOpen size={20} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Mi Catálogo</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Ver cursos y programas</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-emerald-500 transition-colors flex-shrink-0" />
                </Link>

                <Link to="/courses/upload" className="card hover:shadow-md transition-all cursor-pointer border-l-4 border-l-orange-500 group flex items-center gap-4">
                    <div className="w-11 h-11 bg-orange-50 dark:bg-orange-900/40 rounded-xl flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform flex-shrink-0">
                        <Plus size={20} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Nuevo Material</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Subir PDF o contenido</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-orange-500 transition-colors flex-shrink-0" />
                </Link>

                <Link to="/contacts" className="card hover:shadow-md transition-all cursor-pointer border-l-4 border-l-purple-500 group flex items-center gap-4">
                    <div className="w-11 h-11 bg-purple-50 dark:bg-purple-900/40 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform flex-shrink-0">
                        <ListFilter size={20} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm">Contactos</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Ver y gestionar leads</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-purple-500 transition-colors flex-shrink-0" />
                </Link>
            </div>

            {/* Agent LIA section */}
            <div className="flex justify-between items-center mb-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Tu Agente de Ventas</p>
                <Link to="/agentes" className="text-xs text-blue-600 hover:underline font-medium">
                    Configurar →
                </Link>
            </div>

            {(() => {
                const agent = agents[0];
                return agent ? (
                    <div className="card hover:shadow-md transition-all flex items-center gap-4 max-w-xl">
                        <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                            {agent.avatar || '🤖'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">{agent.name}</h4>
                            <p className="text-[10px] text-gray-400 mt-0.5">{agent.role} · <span className="text-green-600 dark:text-green-400 font-semibold">Activo 24/7</span></p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                onClick={() => setPlaygroundAgent(agent)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                            >
                                <Play size={11} className="fill-current" /> Probar
                            </button>
                            <Link to="/agentes" className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                                Editar
                            </Link>
                        </div>
                    </div>
                ) : (
                    <Link to="/agentes" className="card hover:shadow-md transition-all flex items-center gap-4 max-w-xl border-2 border-dashed border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20">
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">🤖</div>
                        <div className="flex-1">
                            <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">Configura tu agente LIA</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Define la personalidad y comportamiento de tu vendedor IA 24/7</p>
                        </div>
                        <span className="text-blue-600 font-bold text-xs">Configurar →</span>
                    </Link>
                );
            })()}

            {/* Playground modal */}
            {playgroundAgent && (
                <SalesPlayground
                    agent={playgroundAgent}
                    orgProfile={profile || undefined}
                    onClose={() => setPlaygroundAgent(null)}
                />
            )}
        </div>
    );
}
