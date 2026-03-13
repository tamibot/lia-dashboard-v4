import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, GripVertical, Filter, ToggleLeft, ToggleRight, Edit, Save, X } from 'lucide-react';
import { filterQuestionsService, type FilterQuestion } from '../lib/services/filterQuestions.service';
import { useToast } from '../context/ToastContext';

const PRODUCT_TYPES = [
    { value: 'all', label: 'Todos los productos' },
    { value: 'curso', label: 'Cursos' },
    { value: 'programa', label: 'Programas' },
    { value: 'webinar', label: 'Webinars' },
    { value: 'taller', label: 'Talleres' },
    { value: 'asesoria', label: 'Asesorias' },
    { value: 'subscripcion', label: 'Suscripciones' },
    { value: 'postulacion', label: 'Postulaciones' },
];

const QUESTION_TYPES = [
    { value: 'text', label: 'Texto libre' },
    { value: 'select', label: 'Seleccion unica' },
    { value: 'multiselect', label: 'Seleccion multiple' },
    { value: 'radio', label: 'Opcion radio' },
    { value: 'yesno', label: 'Si / No' },
];

const EMPTY_FORM: Omit<FilterQuestion, 'id' | 'createdAt'> = {
    question: '',
    fieldKey: '',
    type: 'text',
    options: [],
    isRequired: false,
    isActive: true,
    productType: 'all',
    sortOrder: 0,
    placeholder: '',
};

const TYPE_COLORS: Record<string, string> = {
    all: 'bg-blue-50 text-blue-700 border-blue-100',
    curso: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    programa: 'bg-purple-50 text-purple-700 border-purple-100',
    webinar: 'bg-green-50 text-green-700 border-green-100',
    taller: 'bg-amber-50 text-amber-700 border-amber-100',
    asesoria: 'bg-teal-50 text-teal-700 border-teal-100',
    subscripcion: 'bg-pink-50 text-pink-700 border-pink-100',
    postulacion: 'bg-orange-50 text-orange-700 border-orange-100',
};

export default function FilterQuestionsPage() {
    const { toast } = useToast();
    const [questions, setQuestions] = useState<FilterQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [optionsText, setOptionsText] = useState('');
    const [filterType, setFilterType] = useState('all');
    const dragItemRef = useRef<string | null>(null);
    const dragOverRef = useRef<string | null>(null);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            const data = await filterQuestionsService.getAll();
            setQuestions(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...EMPTY_FORM, sortOrder: questions.length });
        setOptionsText('');
        setShowForm(true);
    };

    const openEdit = (q: FilterQuestion) => {
        setEditingId(q.id);
        setForm({
            question: q.question,
            fieldKey: q.fieldKey,
            type: q.type,
            options: q.options,
            isRequired: q.isRequired,
            isActive: q.isActive,
            productType: q.productType,
            sortOrder: q.sortOrder,
            placeholder: q.placeholder || '',
        });
        setOptionsText(q.options.join('\n'));
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.question.trim()) return;
        setSaving(true);
        try {
            const payload = {
                ...form,
                options: optionsText.split('\n').map(s => s.trim()).filter(Boolean),
                fieldKey: form.fieldKey || form.question.toLowerCase().replace(/\s+/g, '_').slice(0, 30),
            };
            if (editingId) {
                await filterQuestionsService.update(editingId, payload);
            } else {
                await filterQuestionsService.create(payload);
            }
            await load();
            setShowForm(false);
            toast(editingId ? 'Pregunta actualizada' : 'Pregunta creada');
        } catch (e) {
            console.error(e);
            toast('Error al guardar la pregunta', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Eliminar esta pregunta?')) return;
        try {
            await filterQuestionsService.delete(id);
            setQuestions(prev => prev.filter(q => q.id !== id));
            toast('Pregunta eliminada');
        } catch {
            toast('Error al eliminar', 'error');
        }
    };

    const handleToggleActive = async (q: FilterQuestion) => {
        try {
            await filterQuestionsService.update(q.id, { isActive: !q.isActive });
            setQuestions(prev => prev.map(x => x.id === q.id ? { ...x, isActive: !x.isActive } : x));
            toast(q.isActive ? 'Pregunta desactivada' : 'Pregunta activada');
        } catch {
            toast('Error al actualizar', 'error');
        }
    };

    // Drag & drop handlers
    const handleDragStart = useCallback((id: string) => {
        dragItemRef.current = id;
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
        e.preventDefault();
        dragOverRef.current = id;
    }, []);

    const handleDrop = useCallback(async () => {
        const dragId = dragItemRef.current;
        const dropId = dragOverRef.current;
        if (!dragId || !dropId || dragId === dropId) return;

        const updated = [...questions];
        const dragIdx = updated.findIndex(q => q.id === dragId);
        const dropIdx = updated.findIndex(q => q.id === dropId);
        if (dragIdx === -1 || dropIdx === -1) return;

        const [moved] = updated.splice(dragIdx, 1);
        updated.splice(dropIdx, 0, moved);

        // Update sort orders
        const reordered = updated.map((q, i) => ({ ...q, sortOrder: i }));
        setQuestions(reordered);

        // Persist order changes
        try {
            await Promise.all(
                reordered.map((q, i) =>
                    q.sortOrder !== questions.find(orig => orig.id === q.id)?.sortOrder
                        ? filterQuestionsService.update(q.id, { sortOrder: i })
                        : Promise.resolve()
                )
            );
            toast('Orden actualizado');
        } catch {
            toast('Error al reordenar', 'error');
        }

        dragItemRef.current = null;
        dragOverRef.current = null;
    }, [questions, toast]);

    const visibleQuestions = filterType === 'all' ? questions : questions.filter(q => q.productType === filterType || q.productType === 'all');
    const grouped = PRODUCT_TYPES.slice(1).reduce<Record<string, FilterQuestion[]>>((acc, pt) => {
        const qs = visibleQuestions.filter(q => q.productType === pt.value);
        if (qs.length > 0) acc[pt.value] = qs;
        return acc;
    }, {});
    const globalQuestions = visibleQuestions.filter(q => q.productType === 'all');

    return (
        <div className="page-content max-w-5xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Preguntas Filtro</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Preguntas de calificacion que el agente de IA hace a los prospectos antes de vender.
                        Pueden ser <span className="font-semibold text-gray-700">obligatorias</span> u <span className="font-semibold text-gray-700">opcionales</span>.
                    </p>
                </div>
                <button onClick={openCreate} className="btn btn-primary gap-2 flex-shrink-0">
                    <Plus size={16} /> Nueva Pregunta
                </button>
            </div>

            {/* Info banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex items-start gap-3">
                <Filter size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                    <strong>Como funcionan?</strong> Estas preguntas aparecen cuando un prospecto inicia conversacion con el agente de ventas.
                    El agente las usa para <strong>calificar al lead</strong> y personalizar la presentacion del producto.
                    Puedes asignarlas a todos los productos o a uno especifico. <strong>Arrastra</strong> para reordenar.
                </div>
            </div>

            {/* Filter by product type */}
            {questions.length > 0 && (
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <span className="text-xs font-semibold text-gray-500">Filtrar por tipo:</span>
                    <div className="flex flex-wrap gap-1.5">
                        {PRODUCT_TYPES.map(pt => (
                            <button
                                key={pt.value}
                                onClick={() => setFilterType(pt.value)}
                                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-all ${
                                    filterType === pt.value
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                                }`}
                            >
                                {pt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {loading ? (
                <div className="space-y-3">
                    {[1,2,3,4].map(i => (
                        <div key={i} className="card flex items-center gap-4">
                            <div className="skeleton w-4 h-4" />
                            <div className="flex-1">
                                <div className="skeleton h-4 w-3/4 mb-2" />
                                <div className="skeleton h-3 w-1/3" />
                            </div>
                            <div className="skeleton h-6 w-16" />
                        </div>
                    ))}
                </div>
            ) : questions.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl bg-white">
                    <Filter size={48} className="text-gray-300 mx-auto mb-4" />
                    <h3 className="font-bold text-gray-700 text-lg mb-1">Sin preguntas filtro aun</h3>
                    <p className="text-sm text-gray-400 mb-5 max-w-sm mx-auto">Crea tu primera pregunta de calificacion para que el agente la use con tus prospectos.</p>
                    <button onClick={openCreate} className="btn btn-primary gap-2">
                        <Plus size={15} /> Crear primera pregunta
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Global questions */}
                    {globalQuestions.length > 0 && (
                        <div>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Todos los productos</p>
                            <div className="space-y-2">
                                {globalQuestions.map(q => (
                                    <QuestionCard
                                        key={q.id} q={q}
                                        onEdit={openEdit} onDelete={handleDelete} onToggle={handleToggleActive}
                                        onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Per-type groups */}
                    {Object.entries(grouped).map(([type, qs]) => (
                        <div key={type}>
                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                                {PRODUCT_TYPES.find(p => p.value === type)?.label}
                            </p>
                            <div className="space-y-2">
                                {qs.map(q => (
                                    <QuestionCard
                                        key={q.id} q={q}
                                        onEdit={openEdit} onDelete={handleDelete} onToggle={handleToggleActive}
                                        onDragStart={handleDragStart} onDragOver={handleDragOver} onDrop={handleDrop}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Form modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
                            <h3 className="font-bold text-gray-900">{editingId ? 'Editar pregunta' : 'Nueva pregunta filtro'}</h3>
                            <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">

                            <div>
                                <label className="label-sm">Pregunta <span className="text-red-500">*</span></label>
                                <input
                                    className="input w-full"
                                    placeholder="Ej: Cual es tu nivel de experiencia en marketing digital?"
                                    value={form.question}
                                    onChange={e => setForm({ ...form, question: e.target.value })}
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="label-sm">Aplica a</label>
                                    <select className="input w-full" value={form.productType} onChange={e => setForm({ ...form, productType: e.target.value })}>
                                        {PRODUCT_TYPES.map(pt => (
                                            <option key={pt.value} value={pt.value}>{pt.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label-sm">Tipo de respuesta</label>
                                    <select className="input w-full" value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })}>
                                        {QUESTION_TYPES.map(qt => (
                                            <option key={qt.value} value={qt.value}>{qt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {['select', 'multiselect', 'radio'].includes(form.type) && (
                                <div>
                                    <label className="label-sm">Opciones (una por linea)</label>
                                    <textarea
                                        className="input w-full h-24 text-sm"
                                        placeholder={"Principiante\nIntermedio\nAvanzado"}
                                        value={optionsText}
                                        onChange={e => setOptionsText(e.target.value)}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="label-sm">Texto de ayuda (placeholder)</label>
                                <input
                                    className="input w-full"
                                    placeholder="Ej: Describe tu situacion actual..."
                                    value={form.placeholder || ''}
                                    onChange={e => setForm({ ...form, placeholder: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">Obligatoria</p>
                                    <p className="text-xs text-gray-500">El agente debe obtener respuesta antes de continuar</p>
                                </div>
                                <button
                                    onClick={() => setForm({ ...form, isRequired: !form.isRequired })}
                                    className={`transition-colors ${form.isRequired ? 'text-blue-600' : 'text-gray-300'}`}
                                >
                                    {form.isRequired ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                </button>
                            </div>

                        </div>
                        <div className="p-6 border-t flex gap-3">
                            <button onClick={() => setShowForm(false)} className="btn btn-ghost flex-1">Cancelar</button>
                            <button onClick={handleSave} disabled={!form.question.trim() || saving} className="btn btn-primary flex-1 gap-2">
                                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={15} />}
                                {saving ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function QuestionCard({ q, onEdit, onDelete, onToggle, onDragStart, onDragOver, onDrop }: {
    q: FilterQuestion;
    onEdit: (q: FilterQuestion) => void;
    onDelete: (id: string) => void;
    onToggle: (q: FilterQuestion) => void;
    onDragStart: (id: string) => void;
    onDragOver: (e: React.DragEvent, id: string) => void;
    onDrop: () => void;
}) {
    const typeLabel = PRODUCT_TYPES.find(p => p.value === q.productType)?.label || q.productType;
    const typeColor = TYPE_COLORS[q.productType] || 'bg-gray-50 text-gray-600 border-gray-100';
    const qTypeLabel = QUESTION_TYPES.find(t => t.value === q.type)?.label || q.type;

    return (
        <div
            className={`card flex items-start gap-4 transition-all ${!q.isActive ? 'opacity-50' : ''}`}
            draggable
            onDragStart={() => onDragStart(q.id)}
            onDragOver={(e) => onDragOver(e, q.id)}
            onDrop={onDrop}
        >
            <GripVertical size={16} className="text-gray-300 mt-0.5 flex-shrink-0 cursor-grab" />
            <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 flex-wrap">
                    <p className={`text-sm font-semibold text-gray-900 ${q.isRequired ? '' : 'text-gray-700'}`}>
                        {q.question}
                        {q.isRequired && <span className="ml-1.5 text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">OBLIGATORIA</span>}
                    </p>
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${typeColor}`}>{typeLabel}</span>
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{qTypeLabel}</span>
                    {q.options.length > 0 && (
                        <span className="text-[10px] text-gray-400">{q.options.length} opciones</span>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
                <button onClick={() => onToggle(q)} className={`p-1.5 rounded-lg transition-colors ${q.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-300 hover:bg-gray-100'}`} title={q.isActive ? 'Activa' : 'Inactiva'}>
                    {q.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                </button>
                <button onClick={() => onEdit(q)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                    <Edit size={15} />
                </button>
                <button onClick={() => onDelete(q.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={15} />
                </button>
            </div>
        </div>
    );
}
