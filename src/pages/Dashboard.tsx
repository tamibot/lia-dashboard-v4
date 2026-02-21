import { useEffect, useState } from 'react';
import { courseService } from '../lib/services/course.service';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, Plus, BookOpen, GraduationCap, Video } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ cursos: 0, programas: 0, webinars: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [c, p, w] = await Promise.all([
                    courseService.getAll('curso'),
                    courseService.getAll('programa'),
                    courseService.getAll('webinar')
                ]);
                setStats({
                    cursos: c.length,
                    programas: p.length,
                    webinars: w.length
                });
            } catch (err) {
                console.error("Error fetching dashboard stats:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="page-content">
            {/* Welcome Section */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-900">
                        Hola, {user?.name || 'Administrador'} 👋
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Gestiona tus agentes y catálogo educativo desde aquí.</p>
                </div>
                <div className="flex gap-2">
                    <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full font-medium">
                        ID: {user?.orgName || 'LIA Educación'}
                    </span>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card bg-blue-50 border-blue-100">
                    <div className="flex items-center gap-3">
                        <BookOpen className="text-blue-600" size={20} />
                        <div>
                            <p className="text-xs font-bold text-blue-600 uppercase">Cursos</p>
                            <h4 className="text-2xl font-black text-blue-900">{isLoading ? '...' : stats.cursos}</h4>
                        </div>
                    </div>
                </div>
                <div className="card bg-purple-50 border-purple-100">
                    <div className="flex items-center gap-3">
                        <GraduationCap className="text-purple-600" size={20} />
                        <div>
                            <p className="text-xs font-bold text-purple-600 uppercase">Programas</p>
                            <h4 className="text-2xl font-black text-purple-900">{isLoading ? '...' : stats.programas}</h4>
                        </div>
                    </div>
                </div>
                <div className="card bg-orange-50 border-orange-100">
                    <div className="flex items-center gap-3">
                        <Video className="text-orange-600" size={20} />
                        <div>
                            <p className="text-xs font-bold text-orange-600 uppercase">Webinars</p>
                            <h4 className="text-2xl font-black text-orange-900">{isLoading ? '...' : stats.webinars}</h4>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions Grid */}
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Acciones Rápidas</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

                {/* Mis Agentes */}
                <Link to="/my-agents" className="card hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-500 group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                            <Bot size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900">Mis Agentes</h4>
                            <p className="text-xs text-gray-500">Crear o administrar bots</p>
                        </div>
                    </div>
                </Link>

                {/* Catálogo */}
                <Link to="/courses" className="card hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-green-500 group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900">Mi Catálogo</h4>
                            <p className="text-xs text-gray-500">Ver cursos y programas</p>
                        </div>
                    </div>
                </Link>

                {/* Upload Course */}
                <Link to="/courses/upload" className="card hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-orange-500 group">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                            <Plus size={24} />
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900">Nuevo Material</h4>
                            <p className="text-xs text-gray-500">Subir PDF o temario</p>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Recent Activity / Agents Preview */}
            <div className="flex justify-between items-end mb-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Agentes Sugeridos</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="card">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">🎓</span>
                        <div>
                            <h4 className="font-bold text-sm">Asistente de Admisiones</h4>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">Ayuda a tus prospectos a elegir el mejor programa para su perfil.</p>
                    <button className="btn btn-outline btn-sm w-full text-xs" onClick={() => navigate('/my-agents')}>Crear Agente</button>
                </div>

                <div className="card">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">⚡</span>
                        <div>
                            <h4 className="font-bold text-sm">Tutor de IA Personalizado</h4>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">Acompaña a tus alumnos en toda su ruta de aprendizaje con IA.</p>
                    <button className="btn btn-outline btn-sm w-full text-xs" onClick={() => navigate('/my-agents')}>Crear Agente</button>
                </div>

                <Link to="/my-agents" className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center p-6 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-all cursor-pointer">
                    <Plus size={24} className="mb-2" />
                    <span className="text-xs font-bold">Ver todos los Agentes</span>
                </Link>
            </div>
        </div>
    );
}

