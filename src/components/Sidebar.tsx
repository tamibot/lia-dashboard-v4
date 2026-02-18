import { NavLink } from 'react-router-dom';
import { LayoutDashboard, BookOpen, BarChart2, FolderPlus, Settings, Users, Building2 } from 'lucide-react';

export default function Sidebar() {
    return (
        <div className="sidebar" style={{
            width: '240px',
            background: 'white',
            borderRight: '1px solid var(--border)',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            display: 'flex',
            flexDirection: 'column',
            zIndex: 50
        }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border)' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building2 size={24} />
                    LIA
                    <span style={{ fontSize: '12px', background: '#EFF6FF', color: '#2563EB', padding: '2px 6px', borderRadius: '4px' }}>V4.0</span>
                </h1>
            </div>

            <nav style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ padding: '0 12px 6px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Principal
                </div>

                <NavLink to="/kpi" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} style={navLinkStyle}>
                    <BarChart2 size={18} /> KPIs & Reportes
                </NavLink>

                <NavLink to="/" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} style={navLinkStyle}>
                    <LayoutDashboard size={18} /> Dashboard
                </NavLink>

                <div style={{ padding: '16px 12px 6px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Académico
                </div>
                <NavLink to="/courses" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} style={navLinkStyle}>
                    <BookOpen size={18} /> Mi Catálogo
                </NavLink>
                <NavLink to="/courses/upload" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} style={navLinkStyle}>
                    <FolderPlus size={18} /> Subir & Analizar
                </NavLink>

                <div style={{ padding: '16px 12px 6px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Configuración
                </div>
                <NavLink to="/profile" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} style={navLinkStyle}>
                    <Building2 size={18} /> Perfil & Bot IA
                </NavLink>
                <NavLink to="/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} style={navLinkStyle}>
                    <Settings size={18} /> API & Sistema
                </NavLink>
            </nav>

            <div style={{ marginTop: 'auto', padding: '16px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Users size={16} color="var(--text-secondary)" />
                    </div>
                    <div>
                        <div style={{ fontSize: '13px', fontWeight: 600 }}>Usuario Demo</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Admin</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const navLinkStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    color: 'var(--text-secondary)',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s',
    textDecoration: 'none'
};

/* Active style handled via CSS class in global styles or inline conditional if needed, 
   but NavLink handles class. We add a global style for .sidebar-link.active */
