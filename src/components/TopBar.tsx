import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { User, LogOut, Building2, ChevronDown, Settings, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';

const PAGE_TITLES: Record<string, string> = {
    '/': 'Dashboard',
    '/agentes': 'Agentes IA',
    '/courses': 'Catálogo Académico',
    '/courses/upload': 'Subir Información',
    '/courses/new': 'Nuevo Registro',
    '/crm': 'Embudo & Campos',
    '/profile': 'Mi Institución',
    '/team': 'Equipo de Ventas',
    '/settings': 'API & Integraciones',
    '/account': 'Mi Cuenta',
    '/contacts': 'Contactos',
    '/kpi': 'KPIs & Reportes',
};

function getPageTitle(path: string): string {
    if (PAGE_TITLES[path]) return PAGE_TITLES[path];
    if (path.startsWith('/courses/edit')) return 'Editar Registro';
    if (path.startsWith('/courses/detail')) return 'Detalle Académico';
    if (path.startsWith('/courses')) return 'Catálogo Académico';
    if (path.startsWith('/agentes')) return 'Agentes IA';
    return 'LIA Dashboard';
}

export default function TopBar() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { toggle } = useSidebar();
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const initials = user?.name
        ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
        : 'U';

    return (
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-40 flex items-center justify-between px-4 md:px-8 gap-4">
            {/* Left: hamburger + title */}
            <div className="flex items-center gap-3">
                <button
                    onClick={toggle}
                    className="md:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                    aria-label="Menu"
                >
                    <Menu size={20} />
                </button>
                <h2 className="text-base font-bold text-gray-900 tracking-tight">
                    {getPageTitle(location.pathname)}
                </h2>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
                {/* User dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setOpen(o => !o)}
                        className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl transition-colors ${open ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
                    >
                        {/* Avatar with initials */}
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">
                            {initials}
                        </div>
                        <div className="text-left hidden sm:block">
                            <p className="text-xs font-semibold text-gray-800 leading-none">{user?.name || 'Usuario'}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5 leading-none">{user?.orgName || 'Organización'}</p>
                        </div>
                        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown menu */}
                    {open && (
                        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                            {/* User info header */}
                            <div className="px-4 py-3 border-b border-gray-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                                        {initials}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                    </div>
                                </div>
                                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-blue-700 bg-blue-50 px-2.5 py-1.5 rounded-lg">
                                    <Building2 size={11} />
                                    <span className="font-medium truncate">{user?.orgName}</span>
                                </div>
                            </div>

                            {/* Menu items */}
                            <div className="px-2 pt-1.5">
                                <button
                                    onClick={() => { navigate('/account'); setOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
                                >
                                    <User size={15} className="text-gray-400" />
                                    <span className="text-sm font-medium text-gray-700">Mi Cuenta</span>
                                </button>
                                <button
                                    onClick={() => { navigate('/settings'); setOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
                                >
                                    <Settings size={15} className="text-gray-400" />
                                    <span className="text-sm font-medium text-gray-700">API & Integraciones</span>
                                </button>
                            </div>

                            <div className="mx-2 my-1.5 border-t border-gray-100" />

                            <div className="px-2 pb-1.5">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 transition-colors text-left group"
                                >
                                    <LogOut size={15} className="text-gray-400 group-hover:text-red-500 transition-colors" />
                                    <span className="text-sm font-medium text-gray-700 group-hover:text-red-600 transition-colors">Cerrar Sesión</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
