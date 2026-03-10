import { useLocation } from 'react-router-dom';
import { Search, Bell, Menu, User } from 'lucide-react';

export default function TopBar() {
    const location = useLocation();

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/') return 'Dashboard';
        if (path.startsWith('/agentes')) return 'Mis Agentes';
        if (path.startsWith('/courses/upload') || path.startsWith('/courses/new')) return 'Subir Información';
        if (path.startsWith('/courses/edit')) return 'Editar Registro';
        if (path.startsWith('/courses/detail')) return 'Detalle Académico';
        if (path.startsWith('/courses')) return 'Catálogo Académico';
        if (path.startsWith('/profile')) return 'Perfil Institución';
        if (path.startsWith('/team')) return 'Mi Equipo';
        if (path.startsWith('/settings')) return 'API & Sistema';
        if (path.startsWith('/account')) return 'Mi Cuenta';
        return 'LIA Dashboard';
    };

    return (
        <div style={{
            height: '64px',
            background: 'white',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
            position: 'sticky',
            top: 0,
            zIndex: 40
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button className="btn-icon" style={{ display: 'none' }}><Menu size={20} /></button>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{getPageTitle()}</h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className="search-box" style={{ position: 'relative', width: '280px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Buscar cursos, alumnos..."
                        className="form-input"
                        style={{ paddingLeft: '34px', height: '36px', fontSize: '13px' }}
                    />
                </div>

                <button className="btn-icon" style={{ position: 'relative' }}>
                    <Bell size={18} />
                    <span style={{ position: 'absolute', top: '8px', right: '8px', width: '8px', height: '8px', background: 'var(--error)', borderRadius: '50%', border: '2px solid white' }}></span>
                </button>

                <div style={{ height: '24px', width: '1px', background: 'var(--border)' }}></div>

                <div
                    className="dropdown"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                    onClick={() => window.location.href = '/account'}
                >
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>Mi Cuenta</div>
                        <div style={{ fontSize: '10px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                            <span style={{ width: '6px', height: '6px', background: 'var(--success)', borderRadius: '50%' }}></span>
                            Conectado
                        </div>
                    </div>
                    <div style={{ width: '32px', height: '32px', background: 'var(--brand-light)', color: 'var(--brand)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={16} />
                    </div>
                </div>
            </div>
        </div>
    );
}
