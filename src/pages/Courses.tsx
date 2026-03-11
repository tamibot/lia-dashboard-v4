import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../lib/services/course.service';
import { Plus, Clock, Users, BookOpen, GraduationCap, Video, Tag, Edit, LayoutGrid, LayoutList, UserCheck, Repeat, Wrench, MessageCircle } from 'lucide-react';
import AdvancedCourseFilters from '../components/AdvancedCourseFilters';
import type { FilterState } from '../components/AdvancedCourseFilters';

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
    if (type === 'taller') return <Wrench size={16} />;
    if (type === 'subscripcion') return <Repeat size={16} />;
    if (type === 'asesoria') return <MessageCircle size={16} />;
    if (type === 'postulacion') return <UserCheck size={16} />;
    return <BookOpen size={16} />;
}

function typeLabel(type: string) {
    const labels: Record<string, string> = {
        curso: 'Curso', programa: 'Programa', webinar: 'Webinar',
        taller: 'Taller', subscripcion: 'Suscripción', asesoria: 'Asesoría', postulacion: 'Postulación'
    };
    return labels[type] || type;
}

function statusColor(status: string) {
    const s = status?.toLowerCase() || 'borrador';
    if (s === 'activo') return { bg: '#DCFCE7', color: '#16A34A', label: 'Activo' };
    if (s === 'borrador') return { bg: '#FEF9C3', color: '#CA8A04', label: 'Borrador' };
    if (s === 'finalizado') return { bg: '#E5E7EB', color: '#6B7280', label: 'Finalizado' };
    return { bg: '#DBEAFE', color: '#2563EB', label: status || 'Borrador' };
}

type TabKey = 'cursos' | 'programas' | 'webinars' | 'talleres' | 'subscripciones' | 'asesorias' | 'postulaciones';

export default function CoursesPage() {
    const navigate = useNavigate();
    const [tab, setTab] = useState<TabKey>('cursos');
    const [view, setView] = useState<'list' | 'grid'>('list');
    const [filters, setFilters] = useState<FilterState>({
        search: '',
        selectedCategories: [],
        selectedModalities: [],
        selectedLocations: [],
        priceSort: null,
        hasPromotion: false
    });

    const [cursos, setCursos] = useState<any[]>([]);
    const [programas, setProgramas] = useState<any[]>([]);
    const [webinars, setWebinars] = useState<any[]>([]);
    const [talleres, setTalleres] = useState<any[]>([]);
    const [subscripciones, setSubscripciones] = useState<any[]>([]);
    const [asesorias, setAsesorias] = useState<any[]>([]);
    const [postulaciones, setPostulaciones] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const [c, p, w, t, su, as_, po] = await Promise.all([
                    courseService.getAll('curso').catch(err => { console.error('Error fetching cursos:', err); return []; }),
                    courseService.getAll('programa').catch(err => { console.error('Error fetching programas:', err); return []; }),
                    courseService.getAll('webinar').catch(err => { console.error('Error fetching webinars:', err); return []; }),
                    courseService.getAll('taller').catch(err => { console.error('Error fetching talleres:', err); return []; }),
                    courseService.getAll('subscripcion').catch(err => { console.error('Error fetching subscripciones:', err); return []; }),
                    courseService.getAll('asesoria').catch(err => { console.error('Error fetching asesorias:', err); return []; }),
                    courseService.getAll('postulacion').catch(err => { console.error('Error fetching postulaciones:', err); return []; })
                ]);
                setCursos(c);
                setProgramas(p);
                setWebinars(w);
                setTalleres(t);
                setSubscripciones(su);
                setAsesorias(as_);
                setPostulaciones(po);
            } catch (err: any) {
                console.error("Error fetching courses:", err);
                setError("No se pudieron cargar los datos. Por favor, intenta de nuevo.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const categories = Array.from(new Set([
        ...cursos.map(c => c.category),
        ...programas.map(p => p.category),
        ...webinars.map(w => w.category),
        ...talleres.map(t => t.category),
        ...asesorias.map(a => a.category)
    ].filter(Boolean)));

    const locations = Array.from(new Set([
        ...cursos.map(c => c.location),
        ...programas.map(p => p.location),
        ...webinars.map(w => w.location),
        ...talleres.map(t => t.location)
    ].filter(Boolean)));

    const getFilteredItems = () => {
        let items: any[] = [];
        if (tab === 'cursos') items = cursos.map(i => ({ ...i, _type: 'curso' }));
        if (tab === 'programas') items = programas.map(i => ({ ...i, _type: 'programa' }));
        if (tab === 'webinars') items = webinars.map(i => ({ ...i, _type: 'webinar' }));
        if (tab === 'talleres') items = talleres.map(i => ({ ...i, _type: 'taller' }));
        if (tab === 'subscripciones') items = subscripciones.map(i => ({ ...i, _type: 'subscripcion' }));
        if (tab === 'asesorias') items = asesorias.map(i => ({ ...i, _type: 'asesoria' }));
        if (tab === 'postulaciones') items = postulaciones.map(i => ({ ...i, _type: 'postulacion' }));

        let filtered = items.filter(i => {
            const matchesSearch = !filters.search ||
                (i.title || '').toLowerCase().includes(filters.search.toLowerCase()) ||
                (i.code || '').toLowerCase().includes(filters.search.toLowerCase()) ||
                (i.description || '').toLowerCase().includes(filters.search.toLowerCase());

            const matchesCategory = filters.selectedCategories.length === 0 ||
                filters.selectedCategories.includes(i.category);

            const matchesModality = filters.selectedModalities.length === 0 ||
                filters.selectedModalities.includes(i.modality?.toLowerCase());

            const matchesLocation = filters.selectedLocations.length === 0 ||
                filters.selectedLocations.includes(i.location);

            const matchesPromotion = !filters.hasPromotion || !!i.promotions;

            return matchesSearch && matchesCategory && matchesModality && matchesLocation && matchesPromotion;
        });

        if (filters.priceSort) {
            filtered.sort((a, b) => {
                const priceA = a.price || a.pricePerHour || 0;
                const priceB = b.price || b.pricePerHour || 0;
                if (filters.priceSort === 'asc') return priceA - priceB;
                return priceB - priceA;
            });
        }

        return filtered;
    };

    const filteredItems = getFilteredItems();
    const tabCounts = {
        cursos: cursos.length,
        programas: programas.length,
        webinars: webinars.length,
        talleres: talleres.length,
        subscripciones: subscripciones.length,
        asesorias: asesorias.length,
        postulaciones: postulaciones.length
    };

    const emptyLabel: Record<TabKey, string> = {
        cursos: 'cursos', programas: 'programas', webinars: 'webinars',
        talleres: 'talleres', subscripciones: 'suscripciones', asesorias: 'asesorías', postulaciones: 'postulaciones'
    };
    const createLabel: Record<TabKey, string> = {
        cursos: 'Curso', programas: 'Programa', webinars: 'Webinar',
        talleres: 'Taller', subscripciones: 'Suscripción', asesorias: 'Asesoría', postulaciones: 'Postulación'
    };

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

            <AdvancedCourseFilters
                onFilterChange={setFilters}
                categories={categories}
                locations={locations}
            />

            <div className="tabs mb-6" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {([
                        { key: 'cursos' as const, icon: '📚', label: 'Cursos', count: tabCounts.cursos },
                        { key: 'programas' as const, icon: '🎓', label: 'Programas', count: tabCounts.programas },
                        { key: 'webinars' as const, icon: '🎥', label: 'Webinars', count: tabCounts.webinars },
                        { key: 'talleres' as const, icon: '🔧', label: 'Talleres', count: tabCounts.talleres },
                        { key: 'subscripciones' as const, icon: '🔄', label: 'Suscripciones', count: tabCounts.subscripciones },
                        { key: 'asesorias' as const, icon: '💬', label: 'Asesorías', count: tabCounts.asesorias },
                        { key: 'postulaciones' as const, icon: '✅', label: 'Postulaciones', count: tabCounts.postulaciones },
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
                    <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '10px', background: 'white', overflow: 'hidden' }}>
                        <button
                            className={`btn-icon ${view === 'list' ? 'active' : ''}`}
                            onClick={() => setView('list')}
                            style={{ padding: '8px 12px', border: 'none', background: view === 'list' ? 'var(--bg-subtle)' : 'transparent', color: view === 'list' ? 'var(--brand)' : 'var(--text-muted)' }}
                        >
                            <LayoutList size={18} />
                        </button>
                        <button
                            className={`btn-icon ${view === 'grid' ? 'active' : ''}`}
                            onClick={() => setView('grid')}
                            style={{ padding: '8px 12px', border: 'none', background: view === 'grid' ? 'var(--bg-subtle)' : 'transparent', color: view === 'grid' ? 'var(--brand)' : 'var(--text-muted)' }}
                        >
                            <LayoutGrid size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {filteredItems.length === 0 ? (
                <div className="empty-state-card">
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                    <h3>No hay registros</h3>
                    <p style={{ margin: '8px 0 16px' }}>
                        {filters.search ? 'No se encontraron resultados para tu búsqueda.' : `Aún no tienes ${emptyLabel[tab]}.`}
                    </p>
                    <button className="btn btn-primary" onClick={() => navigate('/courses/upload')}>
                        <Plus size={16} /> Crear {createLabel[tab]}
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
                                                        {item._type === 'webinar' ? `${item.eventDate || ''} ${item.eventTime || ''}` : (item.duration || item.totalDuration || item.sessionDuration || '—')}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span className="badge badge-gray">{item.category || 'General'}</span></td>
                                        <td style={{ textTransform: 'capitalize', fontSize: '13px' }}>{item.modality || 'Online'}</td>
                                        <td style={{ fontWeight: 600, fontSize: '13px' }}>
                                            {item.pricePerHour ? `${item.currency || 'USD'} ${item.pricePerHour}/hr` : item.price ? `${item.currency || 'USD'} ${item.price}` : 'Gratis'}
                                        </td>
                                        <td style={{ fontSize: '13px' }}>{item.maxStudents || item.maxAttendees || item.maxParticipants || item.availableSlots || '—'}</td>
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
                                            {typeLabel(item._type)}
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
                                                `${item.eventDate || ''} ${item.eventTime || ''}`
                                                : (item.duration || item.totalDuration || item.sessionDuration || '—')}
                                        </span>
                                        {(item.maxStudents || item.maxAttendees || item.maxParticipants) && (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                <Users size={11} />{item.maxStudents || item.maxAttendees || item.maxParticipants}
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
                                        <span style={{ fontWeight: 700, fontSize: '15px', color: (item.price || item.pricePerHour) ? 'var(--text)' : '#16A34A' }}>
                                            {item.pricePerHour ? `${item.currency || 'USD'} ${item.pricePerHour}/hr` : item.price ? `${item.currency || 'USD'} ${item.price}` : 'Gratis'}
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
