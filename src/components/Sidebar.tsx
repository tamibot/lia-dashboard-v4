import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, BarChart2, FolderPlus, Settings, Users, Building2, Bot, Globe } from 'lucide-react';

export default function Sidebar() {
    return (
        <aside className="fixed left-0 top-0 h-screen w-[260px] bg-white border-r border-gray-200 flex flex-col z-50 shadow-lg">
            <div className="p-6 border-b border-gray-200">
                <h1 className="text-xl font-extrabold text-blue-600 flex items-center gap-2">
                    <Building2 size={24} />
                    LIA
                    <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">V4.0</span>
                </h1>
            </div>

            <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-3">
                <div className="px-3 pb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Principal
                </div>

                <NavLink to="/" end className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                    <LayoutDashboard size={18} /> Inicio
                </NavLink>

                <NavLink to="/agentes" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                    <Bot size={18} /> Mis Agentes
                </NavLink>

                <div className="mt-4 px-3 pb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Académico
                </div>
                <NavLink to="/courses" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                    <BookOpen size={18} /> Mi Catálogo
                </NavLink>
                <NavLink to="/courses/upload" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                    <FolderPlus size={18} /> Subir & Analizar
                </NavLink>

                <div className="mt-4 px-3 pb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Próximamente
                </div>
                <div className="relative opacity-50 pointer-events-none">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400">
                        <Users size={18} /> Mi CRM
                        <span className="ml-auto text-[9px] bg-gray-100 text-gray-500 px-1 py-0.5 rounded">Soon</span>
                    </div>
                </div>
                <div className="relative opacity-50 pointer-events-none">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400">
                        <Globe size={18} /> Mi Página de Venta
                        <span className="ml-auto text-[9px] bg-gray-100 text-gray-500 px-1 py-0.5 rounded">Soon</span>
                    </div>
                </div>
                <div className="relative opacity-50 pointer-events-none">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400">
                        <Bot size={18} /> Content IA
                        <span className="ml-auto text-[9px] bg-gray-100 text-gray-500 px-1 py-0.5 rounded">Soon</span>
                    </div>
                </div>
                <div className="relative opacity-50 pointer-events-none">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400">
                        <BookOpen size={18} /> Educational IA
                        <span className="ml-auto text-[9px] bg-gray-100 text-gray-500 px-1 py-0.5 rounded">Soon</span>
                    </div>
                </div>
                <div className="relative opacity-50 pointer-events-none">
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400">
                        <BarChart2 size={18} /> KPIs & Reportes
                        <span className="ml-auto text-[9px] bg-gray-100 text-gray-500 px-1 py-0.5 rounded">Soon</span>
                    </div>
                </div>

                <div className="mt-4 px-3 pb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Configuración
                </div>
                <NavLink to="/team" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                    <Users size={18} /> Mi Equipo
                </NavLink>
                <NavLink to="/profile" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                    <Building2 size={18} /> Perfil Institución
                </NavLink>
                <NavLink to="/settings" className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}>
                    <Settings size={18} /> API & Sistema
                </NavLink>
            </nav>

            <div className="p-4 border-t border-gray-200 bg-white">
                <NavLink to="/account" className={({ isActive }) => `flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors ${isActive ? 'bg-blue-50 text-blue-600' : ''}`}>
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <Users size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">Mi Cuenta</div>
                        <div className="text-xs text-gray-500 truncate">Configurar perfil</div>
                    </div>
                    <Settings size={16} className="text-gray-400 hover:text-blue-600" />
                </NavLink>
            </div>
        </aside>
    );
}
