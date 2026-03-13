import { useLocation } from 'react-router-dom';
import { Bell, User } from 'lucide-react';

const PAGE_TITLES: Record<string, string> = {
    '/': 'Dashboard',
    '/agentes': 'Agentes IA',
    '/courses': 'Catálogo Académico',
    '/courses/upload': 'Subir Información',
    '/courses/new': 'Nuevo Registro',
    '/crm': 'Embudo & Campos',
    '/profile': 'Mi Institución',
    '/team': 'Equipo de Ventas',
    '/settings': 'API & Sistema',
    '/account': 'Mi Cuenta',
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

    return (
        <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-40 flex items-center justify-between px-6 md:px-8 gap-4">
            {/* Page title */}
            <h2 className="text-base font-bold text-gray-900 tracking-tight">
                {getPageTitle(location.pathname)}
            </h2>

            {/* Right side */}
            <div className="flex items-center gap-3">
                {/* Notifications */}
                <button className="relative p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors" aria-label="Notificaciones">
                    <Bell size={18} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                </button>

                <div className="w-px h-6 bg-gray-200" />

                {/* User */}
                <button
                    onClick={() => window.location.href = '/account'}
                    className="flex items-center gap-2.5 pl-1 pr-2 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                >
                    <div className="text-right hidden sm:block">
                        <p className="text-xs font-semibold text-gray-800 leading-none">Mi Cuenta</p>
                        <p className="text-[10px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1 justify-end">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" />
                            Conectado
                        </p>
                    </div>
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <User size={15} />
                    </div>
                </button>
            </div>
        </header>
    );
}
