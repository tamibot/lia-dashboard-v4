import React, { useEffect } from 'react';
import { getProfile, getCursos, getProgramas, getWebinars, loadDemoData, resetAllData, getGeminiKey } from '../lib/storage';
import { Link } from 'react-router-dom';
import { ArrowRight, RefreshCcw } from 'lucide-react';

export default function DashboardPage() {
    const profile = getProfile();
    const cursos = getCursos();
    const programas = getProgramas();
    const webinars = getWebinars();
    const hasData = cursos.length > 0 || programas.length > 0 || webinars.length > 0;
    const hasKey = !!getGeminiKey();

    // Auto-load demo data if empty (User Request: "necesito que este todo cargado")
    useEffect(() => {
        if (!hasData) {
            loadDemoData();
        }
    }, [hasData]);

    const allItems = [
        ...cursos.map(c => ({ ...c, _type: 'Curso' as const })),
        ...programas.map(p => ({ ...p, _type: 'Programa' as const })),
        ...webinars.map(w => ({ ...w, _type: 'Webinar' as const })),
    ];

    return (
        <div className="page-content">
            {/* Welcome */}
            <div className="flex-between" style={{ marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '26px', fontWeight: 800 }}>
                        Hola, {profile?.type === 'universidad' ? 'Universidad' : profile?.type === 'instituto' ? 'Instituto' : profile?.name?.split(' ')[0] || 'Bienvenido'} 👋
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Tu centro de operaciones para cursos e IA.</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {!hasData && <button className="btn btn-primary" onClick={loadDemoData}>📦 Cargar Demo</button>}
                    {hasData && <button className="btn btn-ghost btn-sm" onClick={() => { resetAllData(); window.location.reload(); }}><RefreshCcw size={14} /> Reset</button>}
                </div>
            </div>

            {/* Alerts */}
            {!hasData && (
                <div className="card mb-6" style={{ background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)', border: '1px solid #93C5FD' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '28px' }}>📦</span>
                        <div>
                            <h4 style={{ fontSize: '14px', fontWeight: 700 }}>Sin datos aún</h4>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                                Haz click en <strong>"Cargar Demo"</strong> para ver el dashboard con datos de ejemplo de la UIG.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {hasKey && (
                <div className="card mb-6" style={{ background: 'linear-gradient(135deg, #ECFDF5, #D1FAE5)', border: '1px solid #6EE7B7', padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '20px' }}>✅</span>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: '#065F46' }}>API Key configurada — herramientas de IA activas</span>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="stat-grid">
                <div className="stat-card">
                    <div className="stat-icon">📚</div>
                    <div className="stat-value">{cursos.length}</div>
                    <div className="stat-label">Cursos Libres</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🎓</div>
                    <div className="stat-value">{programas.length}</div>
                    <div className="stat-label">Programas</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🎤</div>
                    <div className="stat-value">{webinars.length}</div>
                    <div className="stat-label">Webinars / Talleres</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">{hasKey ? '🟢' : '🔴'}</div>
                    <div className="stat-value" style={{ fontSize: '16px' }}>{hasKey ? 'Activa' : '—'}</div>
                    <div className="stat-label">Gemini API</div>
                </div>
            </div>

            {/* Quick Actions */}
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>⚡ Acciones rápidas</h3>
            <div className="grid-3 mb-6">
                <Link to="/courses/upload" className="card card-clickable" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>📤</div>
                    <h4 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--brand)' }}>Subir Información</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Sube datos de un curso y deja que la IA los organice</p>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand)' }}>+ Nuevo registro</span>
                </Link>
                <Link to="/tools/trends" className="card card-clickable" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>📈</div>
                    <h4 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--brand)' }}>Análisis de Tendencias</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Descubre qué cursos crear según el mercado</p>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand)' }}>Explorar <ArrowRight size={12} style={{ display: 'inline' }} /></span>
                </Link>
                <Link to="/kpi" className="card card-clickable" style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ fontSize: '28px', marginBottom: '8px' }}>📊</div>
                    <h4 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--brand)' }}>KPIs Comerciales</h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Embudo de ventas, canales y rendimiento</p>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--brand)' }}>Ver reportes <ArrowRight size={12} style={{ display: 'inline' }} /></span>
                </Link>
            </div>

            {/* Catalog Table */}
            {hasData && (
                <>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>📦 Catálogo reciente</h3>
                    <div className="card">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Tipo</th>
                                    <th>Modalidad</th>
                                    <th>Precio</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {allItems.slice(0, 8).map(item => (
                                    <tr key={item.id} style={{ cursor: 'pointer' }}>
                                        <td style={{ fontWeight: 500 }}>
                                            <Link to={`/courses/detail/${item._type.toLowerCase()}/${item.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                                                {item.title}
                                            </Link>
                                        </td>
                                        <td>
                                            <span className={`badge ${item._type === 'Programa' ? 'badge-blue' : item._type === 'Webinar' ? 'badge-yellow' : 'badge-green'}`} style={{ fontSize: '10px' }}>
                                                {item._type === 'Curso' ? '📚' : item._type === 'Programa' ? '🎓' : '🎤'} {item._type}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                                            {(item as Record<string, unknown>).modality as string || '—'}
                                        </td>
                                        <td style={{ fontWeight: 600 }}>
                                            {(item as Record<string, unknown>).price !== undefined
                                                ? `${(item as Record<string, unknown>).currency || 'USD'} ${((item as Record<string, unknown>).price as number).toLocaleString()}`
                                                : '—'}
                                        </td>
                                        <td>
                                            <span className={`badge ${item.status === 'activo' ? 'badge-green' : 'badge-yellow'}`} style={{ fontSize: '10px' }}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
