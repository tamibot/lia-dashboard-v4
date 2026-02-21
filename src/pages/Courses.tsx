import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../lib/services/course.service';
import { Plus, Search, List, Grid, Clock, Users, BookOpen, GraduationCap, Video, Tag, Edit } from 'lucide-react';

// Simple deterministic color from title (pastel)
function titleColor(title: string): string {
    let hash = 0;
    for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
    const colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1', '#14B8A6', '#F97316'];
    return colors[Math.abs(hash) % colors.length];
}

function typeIcon(type: string) {
    if (type === 'programa') return <GraduationCap size={16} />;
    if (type === 'webinar') return <Video size={16} />;
    return <BookOpen size={16} />;
}

function statusColor(status: string) {
    const s = status?.toLowerCase() || 'borrador';
    if (s === 'activo') return { bg: '#DCFCE7', color: '#16A34A', label: 'Activo' };
    if (s === 'borrador') return { bg: '#FEF9C3', color: '#CA8A04', label: 'Borrador' };
    if (s === 'finalizado') return { bg: '#E5E7EB', color: '#6B7280', label: 'Finalizado' };
    return { bg: '#DBEAFE', color: '#2563EB', label: status || 'Borrador' };
}

export default function CoursesPage() {
    const navigate = useNavigate();
    const [tab, setTab] = useState<'cursos' | 'programas' | 'webinars'>('cursos');
    const [search, setSearch] = useState('');
    const [view, setView] = useState<'list' | 'grid'>('grid');

    const [cursos, setCursos] = useState<any[]>([]);
    const [programas, setProgramas] = useState<any[]>([]);
    const [webinars, setWebinars] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [c, p, w] = await Promise.all([
                    courseService.getAll('curso'),
                    courseService.getAll('programa'),
                    courseService.getAll('webinar')
                ]);
                setCursos(c);
                setProgramas(p);
                setWebinars(w);
            } catch (err: any) {
                console.error("Error fetching courses:", err);
                setError("No se pudieron cargar los datos. Por favor, intenta de nuevo.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const getFilteredItems = () => {
        let items: any[] = [];
        if (tab === 'cursos') items = cursos.map(i => ({ ...i, _type: 'curso' }));
        if (tab === 'programas') items = programas.map(i => ({ ...i, _type: 'programa' }));
        if (tab === 'webinars') items = webinars.map(i => ({ ...i, _type: 'webinar' }));

        return items.filter(i =>
            (i.title || '').toLowerCase().includes(search.toLowerCase()) ||
            (i.category && i.category.toLowerCase().includes(search.toLowerCase()))
        );
    };

    const filteredItems = getFilteredItems();
    const tabCounts = { cursos: cursos.length, programas: programas.length, webinars: webinars.length };

    if (isLoading) {
        return (
            <div className="page-content flex-center" style={{ height: '60vh' }}>
                <div className="text-center">
                    <div className="spinner mb-4" style={{ width: '40px', height: '40px', margin: '0 auto' }}></div>
                    <p>Cargando tu catálogo...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content">
            <div className="flex-between mb-6">
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Mi Catálogo</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Gestiona toda tu oferta académica.</p>
                </div>
                <button onClick={() => navigate('/courses/upload')} className="btn btn-primary text-white">
                    <Plus size={18} /> Nuevo Registro
                </button>
            </div>

            {error && (
                <div className="card mb-6" style={{ borderLeft: '4px solid #ef4444', background: '#fef2f2' }}>
                    <p style={{ color: '#b91c1c', fontSize: '14px' }}>{error}</p>
                </div>
            )}

            <div className="tabs mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                    {([
                        { key: 'cursos' as const, icon: '📚', label: 'Cursos', count: tabCounts.cursos },
                        { key: 'programas' as const, icon: '🎓', label: 'Programas', count: tabCounts.programas },
                        { key: 'webinars' as const, icon: '🎥', label: 'Webinars', count: tabCounts.webinars },
                    ] as const).map(t => (
                        <button key={t.key} className={`tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
                            {t.icon} {t.label}
                            <span style={{
                                marginLeft: '6px', padding: '1px 7px', borderRadius: '10px', fontSize: '11px', fontWeight: 700,
                                background: tab === t.key ? 'var(--brand)' : 'var(--bg-subtle)',
                                color: tab === t.key ? 'white' : 'var(--text-muted)',
                            }}>{t.count}</span>
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <div className="search-box" style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '30px' }} />
                    </div>
                    <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '6px' }}>
                        <button className={`btn-icon ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}><List size={16} /></button>
                        <button className={`btn-icon ${view === 'grid' ? 'active' : ''}`} onClick={() => setView('grid')}><Grid size={16} /></button>
                    </div>
                </div>
            </div>

            {filteredItems.length === 0 ? (
                <div className="empty-state-card">
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                    <h3>No hay registros</h3>
                    <p style={{ margin: '8px 0 16px' }}>
                        {search ? 'No se encontraron resultados para tu búsqueda.' : `Aún no tienes ${tab === 'cursos' ? 'cursos' : tab === 'programas' ? 'programas' : 'webinars'}.`}
                    </p>
                    <button className="btn btn-primary" onClick={() => navigate('/courses/upload')}>
                        <Plus size={16} /> Crear {tab === 'cursos' ? 'Curso' : tab === 'programas' ? 'Programa' : 'Webinar'}
                    </button>
                </div>
            ) : view === 'list' ? (
                <div className="card">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40%' }}>Nombre</th>
                                <th>Categoría</th>
                                <th>Modalidad</th>
                                <th>Precio</th>
                                <th>Cupos</th>
                                <th>Estado</th>
                                <th style={{ width: '40px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((item: any) => {
                                const st = statusColor(item.status);
                                const accent = titleColor(item.title);
                                return (
                                    <tr key={item.id} onClick={() => navigate(`/courses/detail/${item._type}/${item.id}`)} style={{ cursor: 'pointer' }}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{
                                                    width: '36px', height: '36px', borderRadius: '8px', flexShrink: 0,
                                                    background: `${accent}14`, display: 'flex', alignItems: 'center',
                                                    justifyContent: 'center', color: accent
                                                }}>
                                                    {typeIcon(item._type)}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{item.title}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                        {item._type === 'webinar' ? `${item.date || item.startDate || ''} ${item.time || item.schedule || ''}` : (item.duration || item.totalDuration || '—')}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span className="badge badge-gray">{item.category || 'General'}</span></td>
                                        <td style={{ textTransform: 'capitalize', fontSize: '13px' }}>{item.modality || 'Online'}</td>
                                        <td style={{ fontWeight: 600, fontSize: '13px' }}>{item.price ? `${item.currency || 'USD'} ${item.price}` : 'Gratis'}</td>
                                        <td style={{ fontSize: '13px' }}>{item.maxStudents || item.maxAttendees || '—'}</td>
                                        <td>
                                            <span style={{ padding: '2px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: 600, background: st.bg, color: st.color }}>{st.label}</span>
                                        </td>
                                        <td style={{ width: '40px' }} onClick={(e) => e.stopPropagation()}>
                                            <button onClick={(e) => { e.stopPropagation(); navigate(`/courses/edit/${item.id}`); }} className="btn-icon">
                                                <Edit size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* ====== GRID VIEW — Clean Cards ====== */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                    {filteredItems.map((item: any) => {
                        const st = statusColor(item.status);
                        const accent = titleColor(item.title);
                        const syllabusCount = Array.isArray(item.syllabus) ? item.syllabus.length : 0;
                        return (
                            <div key={item.id} onClick={() => navigate(`/courses/detail/${item._type}/${item.id}`)}
                                style={{
                                    borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.2s ease',
                                    border: '1px solid var(--border)', background: 'var(--bg)',
                                    borderLeft: `3px solid ${accent}`,
                                    position: 'relative'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                                <div style={{ padding: '16px' }}>
                                    {/* Top row: icon + status */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px',
                                            borderRadius: '6px', background: `${accent}10`, color: accent,
                                            fontSize: '11px', fontWeight: 600
                                        }}>
                                            {typeIcon(item._type)}
                                            <span>{item._type === 'curso' ? 'Curso' : item._type === 'programa' ? 'Programa' : 'Webinar'}</span>
                                        </div>
                                        <span style={{
                                            padding: '2px 8px', borderRadius: '8px', fontSize: '10px',
                                            fontWeight: 600, background: st.bg, color: st.color
                                        }}>{st.label}</span>
                                    </div>

                                    {/* Title */}
                                    <h3 style={{ fontSize: '15px', fontWeight: 700, lineHeight: 1.3, margin: '0 0 6px', color: 'var(--text)' }}>
                                        {item.title}
                                    </h3>

                                    {/* Category */}
                                    <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '3px',
                                            padding: '1px 7px', borderRadius: '4px', fontSize: '10px',
                                            fontWeight: 600, background: '#f4f4f5', color: 'var(--text-muted)'
                                        }}>
                                            <Tag size={9} />{item.category || 'General'}
                                        </span>
                                        <span style={{
                                            padding: '1px 7px', borderRadius: '4px', fontSize: '10px',
                                            fontWeight: 500, background: '#f4f4f5', color: 'var(--text-muted)',
                                            textTransform: 'capitalize'
                                        }}>
                                            {item.modality || 'online'}
                                        </span>
                                    </div>

                                    {/* Description */}
                                    {item.description && (
                                        <p style={{
                                            fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5,
                                            margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical', overflow: 'hidden'
                                        }}>
                                            {item.description}
                                        </p>
                                    )}

                                    {/* Stats */}
                                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                            <Clock size={11} />
                                            {item._type === 'webinar' ?
                                                `${item.date || item.startDate || ''} ${item.time || item.schedule || ''}`
                                                : (item.duration || item.totalDuration || '—')}
                                        </span>
                                        {(item.maxStudents || item.maxAttendees) && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                <Users size={11} />{item.maxStudents || item.maxAttendees}
                                            </span>
                                        )}
                                        {syllabusCount > 0 && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                <BookOpen size={11} />{syllabusCount} mód.
                                            </span>
                                        )}
                                    </div>

                                    {/* Divider + Footer */}
                                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontWeight: 700, fontSize: '15px', color: item.price ? 'var(--text)' : '#16A34A' }}>
                                            {item.price ? `${item.currency || 'USD'} ${item.price}` : 'Gratis'}
                                        </span>
                                        <span style={{ fontSize: '11px', fontWeight: 600, color: accent }}>
                                            Ver detalle →
                                        </span>
                                    </div>

                                    <button onClick={(e) => { e.stopPropagation(); navigate(`/courses/edit/${item.id}`); }}
                                        style={{
                                            position: 'absolute', top: '12px', right: '12px',
                                            background: 'white', border: '1px solid var(--border)', borderRadius: '6px',
                                            padding: '4px', cursor: 'pointer', color: 'var(--text-muted)',
                                            display: 'none'
                                        }}
                                        className="edit-btn"
                                    >
                                        <Edit size={14} />
                                    </button>
                                    <style>{`
                                        div:hover > .edit-btn { display: block !important; }
                                    `}</style>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

