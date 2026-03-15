import { useState, useEffect, useCallback } from 'react';
import { crmService } from '../lib/services/crm.service';
import {
    GitBranch, Database, Plus, Edit3, Trash2, ChevronDown, ChevronUp,
    Save, X, GripVertical, AlertCircle, RefreshCw
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FunnelStage {
    id?: string;
    name: string;
    description?: string;
    rules?: string;
    sortOrder: number;
    color?: string;
}

interface Funnel {
    id: string;
    name: string;
    description?: string;
    isDefault: boolean;
    stages: FunnelStage[];
    createdAt?: string;
}

interface ExtractionField {
    id: string;
    name: string;
    key: string;
    dataType: string;
    description?: string;
    isRequired: boolean;
    isDefault: boolean;
    options?: string[];
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const STAGE_COLORS = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981',
    '#6366F1', '#14B8A6', '#F97316', '#EF4444', '#06B6D4',
];

/** Stage names considered "parallel" / non-sequential — shown separately */
const PARALLEL_STAGE_KEYS = new Set([
    'seguimiento', 'asesor_manual', 'caso_especial', 'descartado',
]);

/** Color map by stage key for consistent coloring */
const STAGE_COLOR_MAP: Record<string, string> = {
    bbdd: '#6B7280',
    interesado: '#3B82F6',
    informado: '#0EA5E9',
    filtrado: '#F59E0B',
    cualificado: '#8B5CF6',
    alumno_registrado: '#10B981',
    alumno_activo: '#059669',
    seguimiento: '#F97316',
    asesor_manual: '#6366F1',
    caso_especial: '#EC4899',
    descartado: '#EF4444',
};

function getStageColor(stage: FunnelStage, idx: number): string {
    if (stage.color) return stage.color;
    const key = (stage as any).key as string | undefined;
    if (key && STAGE_COLOR_MAP[key]) return STAGE_COLOR_MAP[key];
    // Fallback: try matching by name
    const nameLower = stage.name.toLowerCase();
    for (const [k, c] of Object.entries(STAGE_COLOR_MAP)) {
        if (nameLower.includes(k.replace('_', ' '))) return c;
    }
    return STAGE_COLORS[idx % STAGE_COLORS.length];
}

function isParallelStage(stage: FunnelStage): boolean {
    const key = (stage as any).key as string | undefined;
    if (key && PARALLEL_STAGE_KEYS.has(key)) return true;
    // Fallback: match by name
    const nameLower = stage.name.toLowerCase();
    return nameLower === 'seguimiento'
        || nameLower === 'asesor manual'
        || nameLower === 'caso especial'
        || nameLower === 'descartado';
}

const DATA_TYPES = [
    { value: 'string', label: 'Texto' },
    { value: 'number', label: 'Numero' },
    { value: 'boolean', label: 'Booleano' },
    { value: 'date', label: 'Fecha' },
];

function emptyFunnel(): Omit<Funnel, 'id'> {
    return {
        name: '',
        description: '',
        isDefault: false,
        stages: [
            { name: 'Nuevo', sortOrder: 0, color: STAGE_COLORS[0] },
            { name: 'Contactado', sortOrder: 1, color: STAGE_COLORS[1] },
            { name: 'Cerrado', sortOrder: 2, color: STAGE_COLORS[4] },
        ],
    };
}

function emptyField(): Omit<ExtractionField, 'id'> {
    return {
        name: '',
        key: '',
        dataType: 'string',
        description: '',
        isRequired: false,
        isDefault: false,
        options: [],
    };
}

/* ------------------------------------------------------------------ */
/*  Shared Styles                                                      */
/* ------------------------------------------------------------------ */

const styles = {
    overlay: {
        position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    },
    modal: {
        background: 'white', borderRadius: '14px', width: '100%', maxWidth: '620px',
        maxHeight: '85vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
    },
    modalHeader: {
        padding: '20px 24px', borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    },
    modalBody: { padding: '24px' },
    modalFooter: {
        padding: '16px 24px', borderTop: '1px solid var(--border)',
        display: 'flex', justifyContent: 'flex-end', gap: '10px',
    },
    label: {
        display: 'block', fontSize: '13px', fontWeight: 600 as const,
        color: 'var(--text-secondary)', marginBottom: '6px',
    },
    input: {
        width: '100%', padding: '10px 12px', borderRadius: '8px',
        border: '1px solid var(--border)', fontSize: '14px', outline: 'none',
        background: 'white', boxSizing: 'border-box' as const,
    },
    select: {
        width: '100%', padding: '10px 12px', borderRadius: '8px',
        border: '1px solid var(--border)', fontSize: '14px', outline: 'none',
        background: 'white', boxSizing: 'border-box' as const,
    },
    card: {
        background: 'white', borderRadius: '12px', border: '1px solid var(--border)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    },
    btnPrimary: {
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '10px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer',
        fontWeight: 600 as const, fontSize: '14px', color: 'white',
        background: 'var(--brand)',
    },
    btnOutline: {
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '10px 18px', borderRadius: '8px', cursor: 'pointer',
        fontWeight: 600 as const, fontSize: '14px', color: 'var(--brand)',
        background: 'white', border: '1px solid var(--border)',
    },
    btnDanger: {
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
        fontWeight: 600 as const, fontSize: '12px', color: 'var(--error)',
        background: '#FEF2F2',
    },
    btnIcon: {
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: '32px', height: '32px', borderRadius: '6px', border: '1px solid var(--border)',
        background: 'white', cursor: 'pointer', color: 'var(--text-secondary)',
    },
};

/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */

export default function CRMPage() {
    const [tab, setTab] = useState<'funnels' | 'fields'>('funnels');

    // Data
    const [funnels, setFunnels] = useState<Funnel[]>([]);
    const [fields, setFields] = useState<ExtractionField[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modals
    const [funnelModal, setFunnelModal] = useState<{ open: boolean; editing: Funnel | null }>({ open: false, editing: null });
    const [fieldModal, setFieldModal] = useState<{ open: boolean; editing: ExtractionField | null }>({ open: false, editing: null });

    // Expanded funnel cards
    const [expandedFunnels, setExpandedFunnels] = useState<Set<string>>(new Set());

    /* ---------- Fetch ---------- */

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [f, fi] = await Promise.all([
                crmService.getFunnels().catch(() => []),
                crmService.getFields().catch(() => []),
            ]);
            setFunnels(f);
            setFields(fi);
        } catch (err: any) {
            setError(err.message || 'Error al cargar datos del CRM');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    /* ---------- Funnel CRUD ---------- */

    const openCreateFunnel = () => setFunnelModal({ open: true, editing: null });
    const openEditFunnel = (f: Funnel) => setFunnelModal({ open: true, editing: f });
    const closeFunnelModal = () => setFunnelModal({ open: false, editing: null });

    const handleSaveFunnel = async (data: any) => {
        try {
            if (funnelModal.editing) {
                await crmService.updateFunnel(funnelModal.editing.id, data);
            } else {
                await crmService.createFunnel(data);
            }
            closeFunnelModal();
            fetchData();
        } catch (err: any) {
            throw err; // let modal handle error display
        }
    };

    const handleDeleteFunnel = async (id: string) => {
        if (!confirm('¿Eliminar este embudo? Esta acción no se puede deshacer.')) return;
        try {
            await crmService.deleteFunnel(id);
            fetchData();
        } catch (err: any) {
            setError('Error al eliminar el embudo');
        }
    };

    /* ---------- Field CRUD ---------- */

    const openCreateField = () => setFieldModal({ open: true, editing: null });
    const openEditField = (f: ExtractionField) => setFieldModal({ open: true, editing: f });
    const closeFieldModal = () => setFieldModal({ open: false, editing: null });

    const handleSaveField = async (data: any) => {
        try {
            if (fieldModal.editing) {
                await crmService.updateField(fieldModal.editing.id, data);
            } else {
                await crmService.createField(data);
            }
            closeFieldModal();
            fetchData();
        } catch (err: any) {
            throw err;
        }
    };

    const handleDeleteField = async (id: string) => {
        if (!confirm('¿Eliminar este campo? Esta acción no se puede deshacer.')) return;
        try {
            await crmService.deleteField(id);
            fetchData();
        } catch (err: any) {
            setError('Error al eliminar el campo');
        }
    };

    /* ---------- Toggle expand ---------- */

    const toggleExpand = (id: string) => {
        setExpandedFunnels(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    /* ---------- RENDER ---------- */

    if (loading) {
        return (
            <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto 16px' }} />
                    <p style={{ color: 'var(--text-secondary)' }}>Cargando CRM...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>CRM & Embudo de Ventas</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '14px' }}>
                        Administra tus embudos de venta y campos de extraccion de datos.
                    </p>
                </div>
                <button
                    style={styles.btnPrimary}
                    onClick={tab === 'funnels' ? openCreateFunnel : openCreateField}
                >
                    <Plus size={18} />
                    {tab === 'funnels' ? 'Nuevo Embudo' : 'Nuevo Campo'}
                </button>
            </div>

            {/* Error banner */}
            {error && (
                <div style={{
                    ...styles.card, padding: '14px 18px', marginBottom: '18px',
                    borderLeft: '4px solid var(--error)', background: '#FEF2F2',
                    display: 'flex', alignItems: 'center', gap: '10px',
                }}>
                    <AlertCircle size={18} style={{ color: 'var(--error)', flexShrink: 0 }} />
                    <p style={{ color: '#B91C1C', fontSize: '14px', margin: 0, flex: 1 }}>{error}</p>
                    <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B91C1C' }}>
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '24px' }}>
                {[
                    { key: 'funnels' as const, icon: <GitBranch size={16} />, label: 'Embudos', count: funnels.length },
                    { key: 'fields' as const, icon: <Database size={16} />, label: 'Campos de Extraccion', count: fields.length },
                ].map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 18px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                            fontWeight: 600, fontSize: '14px',
                            background: tab === t.key ? 'var(--brand-light)' : 'transparent',
                            color: tab === t.key ? 'var(--brand)' : 'var(--text-secondary)',
                            transition: 'all 0.15s ease',
                        }}
                    >
                        {t.icon}
                        {t.label}
                        <span style={{
                            padding: '1px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700,
                            background: tab === t.key ? 'var(--brand)' : 'var(--bg-subtle, #f4f4f5)',
                            color: tab === t.key ? 'white' : 'var(--text-muted)',
                        }}>
                            {t.count}
                        </span>
                    </button>
                ))}

                <button
                    onClick={fetchData}
                    title="Recargar"
                    style={{ ...styles.btnIcon, marginLeft: 'auto' }}
                >
                    <RefreshCw size={16} />
                </button>
            </div>

            {/* Tab Content */}
            {tab === 'funnels' ? (
                <FunnelsSection
                    funnels={funnels}
                    expandedFunnels={expandedFunnels}
                    toggleExpand={toggleExpand}
                    onEdit={openEditFunnel}
                    onDelete={handleDeleteFunnel}
                    onCreate={openCreateFunnel}
                />
            ) : (
                <FieldsSection
                    fields={fields}
                    onEdit={openEditField}
                    onDelete={handleDeleteField}
                    onCreate={openCreateField}
                />
            )}

            {/* Modals */}
            {funnelModal.open && (
                <FunnelModal
                    funnel={funnelModal.editing}
                    onSave={handleSaveFunnel}
                    onClose={closeFunnelModal}
                />
            )}
            {fieldModal.open && (
                <FieldModal
                    field={fieldModal.editing}
                    onSave={handleSaveField}
                    onClose={closeFieldModal}
                />
            )}
        </div>
    );
}

/* ================================================================== */
/*  FUNNELS SECTION                                                    */
/* ================================================================== */

function FunnelsSection({
    funnels, expandedFunnels, toggleExpand, onEdit, onDelete, onCreate,
}: {
    funnels: Funnel[];
    expandedFunnels: Set<string>;
    toggleExpand: (id: string) => void;
    onEdit: (f: Funnel) => void;
    onDelete: (id: string) => void;
    onCreate: () => void;
}) {
    if (funnels.length === 0) {
        return (
            <div style={{
                ...styles.card, padding: '48px', textAlign: 'center' as const,
                display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
            }}>
                <GitBranch size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px' }}>No hay embudos</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 20px' }}>
                    Crea tu primer embudo de ventas para organizar tu proceso comercial.
                </p>
                <button style={styles.btnPrimary} onClick={onCreate}>
                    <Plus size={16} /> Crear Embudo
                </button>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {funnels.map(funnel => {
                const isExpanded = expandedFunnels.has(funnel.id);
                return (
                    <div key={funnel.id} style={styles.card}>
                        {/* Card header */}
                        <div style={{
                            padding: '18px 20px', display: 'flex', alignItems: 'center',
                            justifyContent: 'space-between', cursor: 'pointer',
                        }} onClick={() => toggleExpand(funnel.id)}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '10px',
                                    background: 'var(--brand-light)', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', color: 'var(--brand)',
                                }}>
                                    <GitBranch size={20} />
                                </div>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <h4 style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>{funnel.name}</h4>
                                        {funnel.isDefault && (
                                            <span style={{
                                                padding: '1px 8px', borderRadius: '6px', fontSize: '10px',
                                                fontWeight: 700, background: '#DCFCE7', color: '#16A34A',
                                            }}>
                                                Predeterminado
                                            </span>
                                        )}
                                    </div>
                                    {funnel.description && (
                                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                                            {funnel.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                    fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600,
                                }}>
                                    {funnel.stages.length} etapa{funnel.stages.length !== 1 ? 's' : ''}
                                </span>
                                <button
                                    style={styles.btnIcon}
                                    onClick={(e) => { e.stopPropagation(); onEdit(funnel); }}
                                    title="Editar"
                                >
                                    <Edit3 size={14} />
                                </button>
                                <button
                                    style={{ ...styles.btnIcon, color: 'var(--error)' }}
                                    onClick={(e) => { e.stopPropagation(); onDelete(funnel.id); }}
                                    title="Eliminar"
                                >
                                    <Trash2 size={14} />
                                </button>
                                {isExpanded ? <ChevronUp size={18} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-muted)' }} />}
                            </div>
                        </div>

                        {/* Pipeline visualization (always visible) */}
                        {(() => {
                            const sorted = funnel.stages.slice().sort((a, b) => a.sortOrder - b.sortOrder);
                            const sequential = sorted.filter(s => !isParallelStage(s));
                            const parallel = sorted.filter(s => isParallelStage(s));

                            return (
                                <div style={{ padding: '0 20px 16px' }}>
                                    {/* Sequential flow */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflowX: 'auto', flexWrap: 'wrap' }}>
                                        {sequential.map((stage, idx) => {
                                            const color = getStageColor(stage, idx);
                                            return (
                                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                        padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                                                        background: color + '18',
                                                        color: color,
                                                        whiteSpace: 'nowrap',
                                                        border: `1px solid ${color}30`,
                                                    }}>
                                                        <span style={{
                                                            width: '8px', height: '8px', borderRadius: '50%',
                                                            background: color,
                                                        }} />
                                                        {stage.name}
                                                    </span>
                                                    {idx < sequential.length - 1 && (
                                                        <span style={{ color: 'var(--text-muted)', fontSize: '16px', margin: '0 2px' }}>→</span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Parallel / non-sequential states */}
                                    {parallel.length > 0 && (
                                        <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed var(--border, #e5e7eb)' }}>
                                            <span style={{
                                                fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
                                                letterSpacing: '0.05em', color: 'var(--text-muted, #9ca3af)',
                                                marginRight: '10px',
                                            }}>
                                                Estados Especiales
                                            </span>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                                                {parallel.map((stage, idx) => {
                                                    const color = getStageColor(stage, idx);
                                                    return (
                                                        <span key={idx} style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                            padding: '5px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                                                            background: color + '18',
                                                            color: color,
                                                            whiteSpace: 'nowrap',
                                                            border: `1px solid ${color}30`,
                                                        }}>
                                                            <span style={{
                                                                width: '7px', height: '7px', borderRadius: '50%',
                                                                background: color,
                                                            }} />
                                                            {stage.name}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Expanded details */}
                        {isExpanded && funnel.stages.length > 0 && (
                            <div style={{
                                borderTop: '1px solid var(--border)', padding: '16px 20px',
                                background: '#FAFAFA',
                            }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Orden</th>
                                            <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Etapa</th>
                                            <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Descripcion</th>
                                            <th style={{ textAlign: 'left', padding: '8px 10px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Reglas</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {funnel.stages
                                            .slice()
                                            .sort((a, b) => a.sortOrder - b.sortOrder)
                                            .map((stage, idx) => (
                                                <tr key={idx} style={{ borderTop: '1px solid var(--border)' }}>
                                                    <td style={{ padding: '10px' }}>
                                                        <span style={{
                                                            width: '24px', height: '24px', borderRadius: '6px',
                                                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                            background: (stage.color || '#999') + '20',
                                                            color: stage.color || '#999', fontWeight: 700, fontSize: '11px',
                                                        }}>
                                                            {stage.sortOrder + 1}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '10px', fontWeight: 600 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{
                                                                width: '10px', height: '10px', borderRadius: '50%',
                                                                background: stage.color || STAGE_COLORS[idx % STAGE_COLORS.length],
                                                            }} />
                                                            {stage.name}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{stage.description || '—'}</td>
                                                    <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{stage.rules || '—'}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/* ================================================================== */
/*  FIELDS SECTION                                                     */
/* ================================================================== */

function FieldsSection({
    fields, onEdit, onDelete, onCreate,
}: {
    fields: ExtractionField[];
    onEdit: (f: ExtractionField) => void;
    onDelete: (id: string) => void;
    onCreate: () => void;
}) {
    if (fields.length === 0) {
        return (
            <div style={{
                ...styles.card, padding: '48px', textAlign: 'center' as const,
                display: 'flex', flexDirection: 'column' as const, alignItems: 'center',
            }}>
                <Database size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px' }}>No hay campos</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: '0 0 20px' }}>
                    Define los campos que tus agentes deben extraer durante las conversaciones.
                </p>
                <button style={styles.btnPrimary} onClick={onCreate}>
                    <Plus size={16} /> Crear Campo
                </button>
            </div>
        );
    }

    const typeLabel = (dt: string) => {
        const found = DATA_TYPES.find(d => d.value === dt);
        return found ? found.label : dt;
    };

    const typeBadgeStyle = (dt: string) => {
        const map: Record<string, { bg: string; color: string }> = {
            string: { bg: '#DBEAFE', color: '#2563EB' },
            number: { bg: '#FEF9C3', color: '#CA8A04' },
            boolean: { bg: '#F3E8FF', color: '#7C3AED' },
            date: { bg: '#DCFCE7', color: '#16A34A' },
        };
        return map[dt] || { bg: '#F4F4F5', color: '#71717A' };
    };

    return (
        <div style={styles.card}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Nombre</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Key</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Tipo</th>
                        <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Descripcion</th>
                        <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Requerido</th>
                        <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase' }}>Default</th>
                        <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', width: '90px' }}>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {fields.map(field => {
                        const badge = typeBadgeStyle(field.dataType);
                        return (
                            <tr key={field.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '12px 16px', fontWeight: 600 }}>{field.name}</td>
                                <td style={{ padding: '12px 16px' }}>
                                    <code style={{
                                        padding: '2px 8px', borderRadius: '4px', fontSize: '12px',
                                        background: '#F4F4F5', color: '#71717A', fontFamily: 'monospace',
                                    }}>
                                        {field.key}
                                    </code>
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                    <span style={{
                                        padding: '2px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                                        background: badge.bg, color: badge.color,
                                    }}>
                                        {typeLabel(field.dataType)}
                                    </span>
                                </td>
                                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {field.description || '—'}
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                    <span style={{
                                        width: '20px', height: '20px', borderRadius: '4px', display: 'inline-flex',
                                        alignItems: 'center', justifyContent: 'center', fontSize: '11px',
                                        background: field.isRequired ? '#DCFCE7' : '#F4F4F5',
                                        color: field.isRequired ? '#16A34A' : '#A1A1AA',
                                    }}>
                                        {field.isRequired ? '✓' : '—'}
                                    </span>
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                    <span style={{
                                        width: '20px', height: '20px', borderRadius: '4px', display: 'inline-flex',
                                        alignItems: 'center', justifyContent: 'center', fontSize: '11px',
                                        background: field.isDefault ? '#DBEAFE' : '#F4F4F5',
                                        color: field.isDefault ? '#2563EB' : '#A1A1AA',
                                    }}>
                                        {field.isDefault ? '✓' : '—'}
                                    </span>
                                </td>
                                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                        <button style={styles.btnIcon} onClick={() => onEdit(field)} title="Editar">
                                            <Edit3 size={14} />
                                        </button>
                                        <button style={{ ...styles.btnIcon, color: 'var(--error)' }} onClick={() => onDelete(field.id)} title="Eliminar">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

/* ================================================================== */
/*  FUNNEL MODAL                                                       */
/* ================================================================== */

function FunnelModal({
    funnel, onSave, onClose,
}: {
    funnel: Funnel | null;
    onSave: (data: any) => Promise<void>;
    onClose: () => void;
}) {
    const init = funnel || emptyFunnel();
    const [name, setName] = useState(init.name);
    const [description, setDescription] = useState(init.description || '');
    const [isDefault, setIsDefault] = useState(init.isDefault);
    const [stages, setStages] = useState<FunnelStage[]>(
        init.stages.map((s, i) => ({ ...s, sortOrder: s.sortOrder ?? i }))
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const addStage = () => {
        setStages(prev => [
            ...prev,
            { name: '', sortOrder: prev.length, color: STAGE_COLORS[prev.length % STAGE_COLORS.length] },
        ]);
    };

    const removeStage = (idx: number) => {
        setStages(prev => prev.filter((_, i) => i !== idx).map((s, i) => ({ ...s, sortOrder: i })));
    };

    const updateStage = (idx: number, field: keyof FunnelStage, value: any) => {
        setStages(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
    };

    const moveStage = (idx: number, direction: 'up' | 'down') => {
        const target = direction === 'up' ? idx - 1 : idx + 1;
        if (target < 0 || target >= stages.length) return;
        const newStages = [...stages];
        [newStages[idx], newStages[target]] = [newStages[target], newStages[idx]];
        setStages(newStages.map((s, i) => ({ ...s, sortOrder: i })));
    };

    const handleSubmit = async () => {
        if (!name.trim()) { setError('El nombre es requerido'); return; }
        if (stages.some(s => !s.name.trim())) { setError('Todas las etapas necesitan nombre'); return; }

        setSaving(true);
        setError(null);
        try {
            await onSave({ name, description, isDefault, stages });
        } catch (err: any) {
            setError(err.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={styles.modalHeader}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                        {funnel ? 'Editar Embudo' : 'Nuevo Embudo'}
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div style={styles.modalBody}>
                    {error && (
                        <div style={{
                            padding: '10px 14px', borderRadius: '8px', marginBottom: '16px',
                            background: '#FEF2F2', color: '#B91C1C', fontSize: '13px',
                            display: 'flex', alignItems: 'center', gap: '8px',
                        }}>
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div style={{ marginBottom: '16px' }}>
                        <label style={styles.label}>Nombre del Embudo *</label>
                        <input
                            style={styles.input}
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ej: Embudo de Admisiones"
                        />
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label style={styles.label}>Descripcion</label>
                        <input
                            style={styles.input}
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Descripcion breve del embudo"
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                            <input
                                type="checkbox"
                                checked={isDefault}
                                onChange={e => setIsDefault(e.target.checked)}
                                style={{ width: '16px', height: '16px', accentColor: 'var(--brand)' }}
                            />
                            <span style={{ fontWeight: 600 }}>Embudo predeterminado</span>
                        </label>
                    </div>

                    {/* Stages */}
                    <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <label style={{ ...styles.label, marginBottom: 0 }}>Etapas</label>
                        <button
                            onClick={addStage}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '4px',
                                padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border)',
                                background: 'white', cursor: 'pointer', fontSize: '12px',
                                fontWeight: 600, color: 'var(--brand)',
                            }}
                        >
                            <Plus size={14} /> Agregar
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {stages.map((stage, idx) => (
                            <div key={idx} style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)',
                                background: '#FAFAFA',
                            }}>
                                <GripVertical size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />

                                {/* Color picker */}
                                <input
                                    type="color"
                                    value={stage.color || STAGE_COLORS[idx % STAGE_COLORS.length]}
                                    onChange={e => updateStage(idx, 'color', e.target.value)}
                                    style={{ width: '28px', height: '28px', border: 'none', padding: 0, cursor: 'pointer', borderRadius: '4px', flexShrink: 0 }}
                                />

                                <input
                                    style={{ ...styles.input, flex: 1, marginBottom: 0 }}
                                    value={stage.name}
                                    onChange={e => updateStage(idx, 'name', e.target.value)}
                                    placeholder="Nombre de etapa"
                                />
                                <input
                                    style={{ ...styles.input, flex: 1, marginBottom: 0, fontSize: '12px' }}
                                    value={stage.description || ''}
                                    onChange={e => updateStage(idx, 'description', e.target.value)}
                                    placeholder="Descripcion (opcional)"
                                />
                                <input
                                    style={{ ...styles.input, flex: 1, marginBottom: 0, fontSize: '12px' }}
                                    value={stage.rules || ''}
                                    onChange={e => updateStage(idx, 'rules', e.target.value)}
                                    placeholder="Reglas (opcional)"
                                />

                                <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                                    <button
                                        onClick={() => moveStage(idx, 'up')}
                                        disabled={idx === 0}
                                        style={{ ...styles.btnIcon, width: '26px', height: '26px', opacity: idx === 0 ? 0.3 : 1 }}
                                    >
                                        <ChevronUp size={14} />
                                    </button>
                                    <button
                                        onClick={() => moveStage(idx, 'down')}
                                        disabled={idx === stages.length - 1}
                                        style={{ ...styles.btnIcon, width: '26px', height: '26px', opacity: idx === stages.length - 1 ? 0.3 : 1 }}
                                    >
                                        <ChevronDown size={14} />
                                    </button>
                                    <button
                                        onClick={() => removeStage(idx)}
                                        style={{ ...styles.btnIcon, width: '26px', height: '26px', color: 'var(--error)' }}
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div style={styles.modalFooter}>
                    <button style={styles.btnOutline} onClick={onClose}>Cancelar</button>
                    <button style={{ ...styles.btnPrimary, opacity: saving ? 0.7 : 1 }} onClick={handleSubmit} disabled={saving}>
                        <Save size={16} />
                        {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ================================================================== */
/*  FIELD MODAL                                                        */
/* ================================================================== */

function FieldModal({
    field, onSave, onClose,
}: {
    field: ExtractionField | null;
    onSave: (data: any) => Promise<void>;
    onClose: () => void;
}) {
    const init = field || emptyField();
    const [name, setName] = useState(init.name);
    const [key, setKey] = useState(init.key);
    const [dataType, setDataType] = useState(init.dataType);
    const [description, setDescription] = useState(init.description || '');
    const [isRequired, setIsRequired] = useState(init.isRequired);
    const [isDefault, setIsDefault] = useState(init.isDefault);
    const [options, setOptions] = useState<string[]>(init.options || []);
    const [newOption, setNewOption] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Auto-generate key from name
    const handleNameChange = (val: string) => {
        setName(val);
        if (!field) {
            setKey(val.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''));
        }
    };

    const addOption = () => {
        if (!newOption.trim()) return;
        setOptions(prev => [...prev, newOption.trim()]);
        setNewOption('');
    };

    const removeOption = (idx: number) => {
        setOptions(prev => prev.filter((_, i) => i !== idx));
    };

    const handleSubmit = async () => {
        if (!name.trim()) { setError('El nombre es requerido'); return; }
        if (!key.trim()) { setError('La key es requerida'); return; }

        setSaving(true);
        setError(null);
        try {
            await onSave({
                name, key, dataType, description, isRequired, isDefault,
                options: options.length > 0 ? options : undefined,
            });
        } catch (err: any) {
            setError(err.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div style={styles.modal} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={styles.modalHeader}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>
                        {field ? 'Editar Campo' : 'Nuevo Campo de Extraccion'}
                    </h3>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div style={styles.modalBody}>
                    {error && (
                        <div style={{
                            padding: '10px 14px', borderRadius: '8px', marginBottom: '16px',
                            background: '#FEF2F2', color: '#B91C1C', fontSize: '13px',
                            display: 'flex', alignItems: 'center', gap: '8px',
                        }}>
                            <AlertCircle size={16} />
                            {error}
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div>
                            <label style={styles.label}>Nombre *</label>
                            <input
                                style={styles.input}
                                value={name}
                                onChange={e => handleNameChange(e.target.value)}
                                placeholder="Ej: Correo Electronico"
                            />
                        </div>
                        <div>
                            <label style={styles.label}>Key *</label>
                            <input
                                style={{ ...styles.input, fontFamily: 'monospace', fontSize: '13px' }}
                                value={key}
                                onChange={e => setKey(e.target.value)}
                                placeholder="correo_electronico"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div>
                            <label style={styles.label}>Tipo de Dato</label>
                            <select
                                style={styles.select}
                                value={dataType}
                                onChange={e => setDataType(e.target.value)}
                            >
                                {DATA_TYPES.map(dt => (
                                    <option key={dt.value} value={dt.value}>{dt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label style={styles.label}>Descripcion</label>
                            <input
                                style={styles.input}
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Descripcion del campo"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                            <input
                                type="checkbox"
                                checked={isRequired}
                                onChange={e => setIsRequired(e.target.checked)}
                                style={{ width: '16px', height: '16px', accentColor: 'var(--brand)' }}
                            />
                            <span style={{ fontWeight: 600 }}>Requerido</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                            <input
                                type="checkbox"
                                checked={isDefault}
                                onChange={e => setIsDefault(e.target.checked)}
                                style={{ width: '16px', height: '16px', accentColor: 'var(--brand)' }}
                            />
                            <span style={{ fontWeight: 600 }}>Campo predeterminado</span>
                        </label>
                    </div>

                    {/* Options (for select-type fields) */}
                    <div>
                        <label style={styles.label}>Opciones (para campos tipo select)</label>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                            <input
                                style={{ ...styles.input, flex: 1 }}
                                value={newOption}
                                onChange={e => setNewOption(e.target.value)}
                                placeholder="Agregar opcion..."
                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addOption(); } }}
                            />
                            <button onClick={addOption} style={{ ...styles.btnOutline, padding: '10px 14px' }}>
                                <Plus size={16} />
                            </button>
                        </div>
                        {options.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {options.map((opt, idx) => (
                                    <span key={idx} style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                        padding: '4px 10px', borderRadius: '6px', fontSize: '12px',
                                        background: 'var(--brand-light)', color: 'var(--brand)', fontWeight: 600,
                                    }}>
                                        {opt}
                                        <button
                                            onClick={() => removeOption(idx)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand)', padding: 0, lineHeight: 1 }}
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div style={styles.modalFooter}>
                    <button style={styles.btnOutline} onClick={onClose}>Cancelar</button>
                    <button style={{ ...styles.btnPrimary, opacity: saving ? 0.7 : 1 }} onClick={handleSubmit} disabled={saving}>
                        <Save size={16} />
                        {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
