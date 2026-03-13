import { useEffect, useState } from 'react';
import { courseService } from '../lib/services/course.service';
import { agentService } from '../lib/services/agent.service';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, Plus, BookOpen, GraduationCap, Video, Wrench, Repeat, MessageCircle, FileText, Play } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { AiAgent } from '../lib/types';
import SalesPlayground from '../components/SalesPlayground';

const StatCard = ({
    bg, border, iconBg, iconColor, icon: Icon, label, labelColor, value, valueColor
}: {
    bg: string; border: string; iconBg: string; iconColor: string; icon: any;
    label: string; labelColor: string; value: string | number; valueColor: string;
}) => (
    <div className={`card ${bg} ${border} border`}>
        <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Icon className={iconColor} size={20} />
            </div>
            <div>
                <p className={`text-[11px] font-bold ${labelColor} uppercase tracking-wide`}>{label}</p>
                <h4 className={`text-2xl font-black ${valueColor} leading-none mt-0.5`}>{value}</h4>
            </div>
        </div>
    </div>
);

export default function DashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ cursos: 0, programas: 0, webinars: 0, talleres: 0, subscripciones: 0, asesorias: 0, postulaciones: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [agents, setAgents] = useState<AiAgent[]>([]);
    const [playgroundAgent, setPlaygroundAgent] = useState<AiAgent | null>(null);

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
        ]).then(([c, p, w, t, sub, ase, post, ag]) => {
            setStats({ cursos: c.length, programas: p.length, webinars: w.length, talleres: t.length, subscripciones: sub.length, asesorias: ase.length, postulaciones: post.length });
            setAgents(ag);
        }).catch(err => {
            console.error("Error fetching dashboard data:", err);
        }).finally(() => {
            setIsLoading(false);
        });
    }, []);

    const statValue = (n: number) => isLoading ? '–' : n;

    return (
        <div className="page-content">

            {/* Welcome */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                        Hola, {user?.name?.split(' ')[0] || 'Administrador'} 👋
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Bienvenido a tu panel de control de <span className="font-semibold text-gray-700">{user?.orgName}</span>.</p>
                </div>
            </div>

            {/* Stats */}
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Resumen del catálogo</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                <StatCard bg="bg-blue-50" border="border-blue-100" iconBg="bg-blue-100" iconColor="text-blue-600" icon={BookOpen} label="Cursos" labelColor="text-blue-600" value={statValue(stats.cursos)} valueColor="text-blue-900" />
                <StatCard bg="bg-purple-50" border="border-purple-100" iconBg="bg-purple-100" iconColor="text-purple-600" icon={GraduationCap} label="Programas" labelColor="text-purple-600" value={statValue(stats.programas)} valueColor="text-purple-900" />
                <StatCard bg="bg-orange-50" border="border-orange-100" iconBg="bg-orange-100" iconColor="text-orange-600" icon={Video} label="Webinars" labelColor="text-orange-600" value={statValue(stats.webinars)} valueColor="text-orange-900" />
                <StatCard bg="bg-teal-50" border="border-teal-100" iconBg="bg-teal-100" iconColor="text-teal-600" icon={Wrench} label="Talleres" labelColor="text-teal-600" value={statValue(stats.talleres)} valueColor="text-teal-900" />
                <StatCard bg="bg-rose-50" border="border-rose-100" iconBg="bg-rose-100" iconColor="text-rose-600" icon={Repeat} label="Suscripciones" labelColor="text-rose-600" value={statValue(stats.subscripciones)} valueColor="text-rose-900" />
                <StatCard bg="bg-emerald-50" border="border-emerald-100" iconBg="bg-emerald-100" iconColor="text-emerald-600" icon={MessageCircle} label="Asesorías" labelColor="text-emerald-600" value={statValue(stats.asesorias)} valueColor="text-emerald-900" />
                <StatCard bg="bg-amber-50" border="border-amber-100" iconBg="bg-amber-100" iconColor="text-amber-600" icon={FileText} label="Postulaciones" labelColor="text-amber-600" value={statValue(stats.postulaciones)} valueColor="text-amber-900" />
            </div>

            {/* Quick Actions */}
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Acciones rápidas</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Link to="/agentes" className="card hover:shadow-md transition-all cursor-pointer border-l-4 border-l-blue-500 group flex items-center gap-4">
                    <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform flex-shrink-0">
                        <Bot size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm">Mis Agentes</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Crear o administrar bots de ventas</p>
                    </div>
                </Link>

                <Link to="/courses" className="card hover:shadow-md transition-all cursor-pointer border-l-4 border-l-emerald-500 group flex items-center gap-4">
                    <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform flex-shrink-0">
                        <BookOpen size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm">Mi Catálogo</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Ver y gestionar cursos y programas</p>
                    </div>
                </Link>

                <Link to="/courses/upload" className="card hover:shadow-md transition-all cursor-pointer border-l-4 border-l-orange-500 group flex items-center gap-4">
                    <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform flex-shrink-0">
                        <Plus size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 text-sm">Nuevo Material</h4>
                        <p className="text-xs text-gray-500 mt-0.5">Subir PDF, temario o contenido</p>
                    </div>
                </Link>
            </div>

            {/* Agents section */}
            <div className="flex justify-between items-center mb-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    {agents.length > 0 ? 'Tus Agentes IA' : 'Agentes IA'}
                </p>
                {agents.length > 0 && (
                    <Link to="/agentes" className="text-xs text-blue-600 hover:underline font-medium">
                        Administrar →
                    </Link>
                )}
            </div>

            {agents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {agents.slice(0, 5).map(agent => (
                        <div key={agent.id} className="card hover:shadow-md transition-all flex items-center gap-4 group">
                            <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                                {agent.avatar || '🤖'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm text-gray-900 truncate">{agent.name}</h4>
                                <p className="text-[10px] text-gray-400 truncate mt-0.5">{agent.role}</p>
                            </div>
                            <button
                                onClick={() => setPlaygroundAgent(agent)}
                                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                            >
                                <Play size={11} className="fill-current" /> Probar
                            </button>
                        </div>
                    ))}

                    {/* Link to all agents if more than 5 */}
                    {agents.length > 5 && (
                        <Link to="/agentes" className="card flex items-center justify-center gap-2 text-blue-600 hover:bg-blue-50 transition-colors font-semibold text-sm">
                            <Plus size={16} /> {agents.length - 5} más...
                        </Link>
                    )}

                    {/* Create new agent shortcut */}
                    <Link to="/agentes" className="border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center gap-2 p-4 text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/30 transition-all">
                        <Plus size={16} />
                        <span className="text-xs font-bold">Nuevo Agente</span>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="card hover:shadow-md transition-all group">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-xl w-9 h-9 flex items-center justify-center bg-amber-50 rounded-xl">🎓</span>
                            <div>
                                <h4 className="font-bold text-sm text-gray-900">Asistente de Admisiones</h4>
                                <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mt-0.5">Sugerido</p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mb-4 leading-relaxed">Ayuda a tus prospectos a elegir el mejor programa para su perfil.</p>
                        <button className="btn btn-outline btn-sm w-full text-xs" onClick={() => navigate('/agentes')}>Crear este Agente</button>
                    </div>

                    <div className="card hover:shadow-md transition-all group">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-xl w-9 h-9 flex items-center justify-center bg-blue-50 rounded-xl">⚡</span>
                            <div>
                                <h4 className="font-bold text-sm text-gray-900">Agente de Ventas 24/7</h4>
                                <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide mt-0.5">Sugerido</p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mb-4 leading-relaxed">Responde preguntas y cierra ventas de tus cursos de forma automática.</p>
                        <button className="btn btn-outline btn-sm w-full text-xs" onClick={() => navigate('/agentes')}>Crear este Agente</button>
                    </div>

                    <Link to="/agentes" className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-6 text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/30 transition-all cursor-pointer">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                            <Plus size={20} />
                        </div>
                        <span className="text-xs font-bold">Crear nuevo agente</span>
                        <span className="text-[10px] mt-1 opacity-70">Personalizalo a tu medida</span>
                    </Link>
                </div>
            )}

            {/* Playground modal */}
            {playgroundAgent && (
                <SalesPlayground
                    agent={playgroundAgent}
                    onClose={() => setPlaygroundAgent(null)}
                />
            )}
        </div>
    );
}
