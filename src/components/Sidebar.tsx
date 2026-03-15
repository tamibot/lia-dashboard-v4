import { NavLink, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BookOpen, BarChart2, FolderPlus, Settings, Users, Building2, Bot, Globe, GitBranch, User, X, Contact } from 'lucide-react';
import { useSidebar } from '../context/SidebarContext';
import { useEffect } from 'react';

const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
        isActive
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
    }`;

const SectionLabel = ({ label }: { label: string }) => (
    <p className="mt-5 mb-1 px-3 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
        {label}
    </p>
);

const SoonItem = ({ icon: Icon, label }: { icon: any; label: string }) => (
    <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 dark:text-gray-600 cursor-default select-none">
        <Icon size={16} className="opacity-60" />
        <span className="flex-1">{label}</span>
        <span className="text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 px-1.5 py-0.5 rounded font-semibold tracking-wide">Pronto</span>
    </div>
);

export default function Sidebar() {
    const { isOpen, close } = useSidebar();
    const location = useLocation();

    // Close sidebar on route change (mobile)
    useEffect(() => {
        close();
    }, [location.pathname, close]);

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 md:hidden animate-fade-in"
                    onClick={close}
                />
            )}

            <aside className={`
                fixed left-0 top-0 h-screen w-[240px] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col z-50
                transition-transform duration-200 ease-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
                md:translate-x-0
            `}>

                {/* Logo */}
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Building2 size={16} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-sm font-extrabold text-gray-900 dark:text-gray-100 leading-none">LIA Dashboard</h1>
                            <span className="text-[10px] text-blue-600 font-semibold">V4.0</span>
                        </div>
                    </Link>
                    <button
                        onClick={close}
                        className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-3 px-3 flex flex-col">

                    <SectionLabel label="Principal" />
                    <NavLink to="/" end className={navClass}>
                        <LayoutDashboard size={16} /> Inicio
                    </NavLink>

                    <SectionLabel label="Catalogo" />
                    <NavLink to="/courses" className={navClass}>
                        <BookOpen size={16} /> Mi Portafolio
                    </NavLink>
                    <NavLink to="/courses/upload" className={navClass}>
                        <FolderPlus size={16} /> Subir Producto
                    </NavLink>

                    <SectionLabel label="Comercial" />
                    <NavLink to="/crm" className={navClass}>
                        <GitBranch size={16} /> Embudo & Campos
                    </NavLink>
                    <NavLink to="/kpi" className={navClass}>
                        <BarChart2 size={16} /> KPIs & Reportes
                    </NavLink>
                    <NavLink to="/contacts" className={navClass}>
                        <Contact size={16} /> Contactos
                    </NavLink>
                    <NavLink to="/team" className={navClass}>
                        <Users size={16} /> Equipo de Ventas
                    </NavLink>

                    <SectionLabel label="Configuracion" />
                    <NavLink to="/profile" className={navClass}>
                        <Building2 size={16} /> Mi Institucion
                    </NavLink>
                    <NavLink to="/agentes" className={navClass}>
                        <Bot size={16} /> Agente de Venta
                    </NavLink>
                    <NavLink to="/settings" className={navClass}>
                        <Settings size={16} /> Integraciones
                    </NavLink>

                    <SectionLabel label="Proximamente" />
                    <SoonItem icon={Globe} label="Pagina de Venta" />
                    <SoonItem icon={Bot} label="Content IA" />
                    <SoonItem icon={BookOpen} label="Educational IA" />
                </nav>

                {/* Footer */}
                <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-700">
                    <NavLink
                        to="/account"
                        className={({ isActive }) =>
                            `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                                isActive ? 'bg-blue-50 dark:bg-blue-900/30' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`
                        }
                    >
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <User size={13} className="text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate leading-none">Mi Cuenta</p>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Configurar perfil</p>
                        </div>
                        <Settings size={13} className="text-gray-300" />
                    </NavLink>
                </div>
            </aside>
        </>
    );
}
