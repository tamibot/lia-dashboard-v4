import { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, ListFilter, ToggleLeft, ToggleRight } from 'lucide-react';
import { filterQuestionsService, type FilterQuestion } from '../lib/services/filterQuestions.service';

const QUESTION_TYPES = [
    { value: 'text', label: 'Texto libre' },
    { value: 'select', label: 'Seleccion unica' },
    { value: 'multiselect', label: 'Seleccion multiple' },
    { value: 'yesno', label: 'Si / No' },
];

interface Props {
    courseId: string;
    productType: string;
    readOnly?: boolean;
}

export default function ProductFilterQuestions({ courseId, productType, readOnly = false }: Props) {
    const [questions, setQuestions] = useState<FilterQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({
        question: '',
        type: 'text' as string,
        options: [] as string[],
        isRequired: false,
        placeholder: '',
    });
    const [optionsText, setOptionsText] = useState('');

    useEffect(() => {
        loadQuestions();
    }, [courseId]);

    const loadQuestions = async () => {
        try {
            const data = await filterQuestionsService.getByCourse(courseId);
            setQuestions(data);
        } catch {
            setQuestions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!form.question.trim()) return;
        setSaving(true);
        try {
            const options = form.type === 'select' || form.type === 'multiselect'
                ? optionsText.split('\n').map(s => s.trim()).filter(Boolean)
                : [];
            const fieldKey = form.question.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 50);
            await filterQuestionsService.create({
                question: form.question,
                fieldKey,
                type: form.type as any,
                options,
                isRequired: form.isRequired,
                isActive: true,
                productType,
                sortOrder: questions.length,
                placeholder: form.placeholder,
                courseId,
            });
            setForm({ question: '', type: 'text', options: [], isRequired: false, placeholder: '' });
            setOptionsText('');
            setShowForm(false);
            await loadQuestions();
        } catch {
            // silent
        } finally {
            setSaving(false);
        }
    };

    const handleToggleRequired = async (q: FilterQuestion) => {
        try {
            await filterQuestionsService.update(q.id, { isRequired: !q.isRequired });
            setQuestions(prev => prev.map(x => x.id === q.id ? { ...x, isRequired: !x.isRequired } : x));
        } catch {
            // silent
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Eliminar esta pregunta?')) return;
        try {
            await filterQuestionsService.delete(id);
            setQuestions(prev => prev.filter(x => x.id !== id));
        } catch {
            // silent
        }
    };

    if (loading) {
        return (
            <div className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <ListFilter size={14} /> Cargando preguntas filtro...
                </div>
            </div>
        );
    }

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ListFilter size={16} className="text-gray-500" />
                    <h4 className="text-sm font-bold text-gray-800">Preguntas Filtro</h4>
                    <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                        {questions.length}
                    </span>
                </div>
                {!readOnly && (
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                        {showForm ? <><X size={12} /> Cancelar</> : <><Plus size={12} /> Agregar</>}
                    </button>
                )}
            </div>

            {/* Add form */}
            {showForm && !readOnly && (
                <div className="p-4 bg-blue-50/50 border-b border-gray-200 space-y-3">
                    <input
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Escribe la pregunta..."
                        value={form.question}
                        onChange={e => setForm({ ...form, question: e.target.value })}
                    />
                    <div className="flex gap-3 items-center">
                        <select
                            value={form.type}
                            onChange={e => setForm({ ...form, type: e.target.value })}
                            className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {QUESTION_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                        <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={form.isRequired}
                                onChange={e => setForm({ ...form, isRequired: e.target.checked })}
                                className="rounded border-gray-300"
                            />
                            Obligatoria
                        </label>
                    </div>
                    {(form.type === 'select' || form.type === 'multiselect') && (
                        <textarea
                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Una opcion por linea..."
                            rows={3}
                            value={optionsText}
                            onChange={e => setOptionsText(e.target.value)}
                        />
                    )}
                    <button
                        onClick={handleAdd}
                        disabled={saving || !form.question.trim()}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Save size={12} /> {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            )}

            {/* Questions list */}
            {questions.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400">
                    No hay preguntas filtro para este producto.
                    {!readOnly && ' Agrega una para calificar mejor a tus prospectos.'}
                </div>
            ) : (
                <div className="divide-y divide-gray-100">
                    {questions.map((q, i) => (
                        <div key={q.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50">
                            <span className="text-[10px] font-bold text-gray-300 w-4 text-right">{i + 1}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-800 truncate">{q.question}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-gray-400 capitalize">{q.type}</span>
                                    {q.options?.length > 0 && (
                                        <span className="text-[10px] text-gray-300">
                                            ({q.options.length} opciones)
                                        </span>
                                    )}
                                </div>
                            </div>
                            {!readOnly && (
                                <button
                                    onClick={() => handleToggleRequired(q)}
                                    className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                        q.isRequired
                                            ? 'bg-red-50 text-red-600'
                                            : 'bg-gray-100 text-gray-400'
                                    }`}
                                >
                                    {q.isRequired ? <><ToggleRight size={10} /> Obligatoria</> : <><ToggleLeft size={10} /> Opcional</>}
                                </button>
                            )}
                            {readOnly && (
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                    q.isRequired ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-400'
                                }`}>
                                    {q.isRequired ? 'Obligatoria' : 'Opcional'}
                                </span>
                            )}
                            {!readOnly && (
                                <button
                                    onClick={() => handleDelete(q.id)}
                                    className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={13} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
