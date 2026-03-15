import { useState, useEffect, Fragment } from 'react';
import {
    Users, Plus, Edit2, Trash2, Calendar, Clock, Book, Loader,
    AlertCircle, RefreshCw, Mail, Phone, MessageCircle,
    ToggleLeft, ToggleRight, ChevronDown, ChevronUp, X, Save
} from 'lucide-react';
import { teamService } from '../lib/services/team.service';
import { courseService } from '../lib/services/course.service';
import type { Team, TeamMember, TeamProductAssignment } from '../lib/types';
import { useToast } from '../context/ToastContext';

const PRODUCT_TYPES = [
    { value: 'course', label: 'Curso Libre', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
    { value: 'program', label: 'Programa', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
    { value: 'webinar', label: 'Webinar', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
    { value: 'taller', label: 'Taller', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
    { value: 'subscription', label: 'Suscripción', color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300' },
    { value: 'asesoria', label: 'Asesoría', color: 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300' },
    { value: 'application', label: 'Postulación', color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' },
] as const;

type ProductOption = { id: string; title: string; entityType: string };

const emptyMember = (): TeamMember => ({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    role: 'SDR',
    availability: '09:00 - 18:00',
    isAvailable: true,
    specialties: [],
});

export default function TeamManagement() {
    const { toast } = useToast();
    const [teams, setTeams] = useState<Team[]>([]);
    const [products, setProducts] = useState<ProductOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [productAssignments, setProductAssignments] = useState<TeamProductAssignment[]>([]);
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [expandedMemberIdx, setExpandedMemberIdx] = useState<number | null>(null);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const [teamsData, ...productResults] = await Promise.all([
                teamService.getAll(),
                courseService.getAll('curso'),
                courseService.getAll('programa'),
                courseService.getAll('webinar'),
                courseService.getAll('taller'),
                courseService.getAll('subscripcion'),
                courseService.getAll('asesoria'),
                courseService.getAll('postulacion'),
            ]);

            setTeams(teamsData);

            const entityTypes = ['course', 'program', 'webinar', 'taller', 'subscription', 'asesoria', 'application'];
            const allProducts: ProductOption[] = [];
            productResults.forEach((list, idx) => {
                list.forEach((item: any) => {
                    allProducts.push({ id: item.id, title: item.title, entityType: entityTypes[idx] });
                });
            });
            setProducts(allProducts);
        } catch (err: any) {
            console.error('Error fetching team data:', err);
            setError('No se pudieron cargar los datos del equipo.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const resetForm = () => {
        setName('');
        setDescription('');
        setProductAssignments([]);
        setMembers([]);
        setEditingTeam(null);
        setShowForm(false);
        setExpandedMemberIdx(null);
    };

    const handleEdit = (team: Team) => {
        setEditingTeam(team);
        setName(team.name);
        setDescription(team.description || '');
        setProductAssignments(team.productAssignments || []);
        setMembers(team.members || []);
        setShowForm(true);
        setExpandedRow(null);
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar este equipo y todos sus miembros?')) {
            try {
                setIsSaving(true);
                await teamService.delete(id);
                setTeams(prev => prev.filter(t => t.id !== id));
                toast('Equipo eliminado', 'success');
            } catch {
                toast('No se pudo eliminar el equipo', 'error');
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleSave = async () => {
        if (!name) { toast('El nombre del equipo es requerido', 'info'); return; }
        // Validate members have required fields
        for (const m of members) {
            if (!m.name || !m.email || !m.phone) {
                toast('Cada miembro debe tener nombre, email y teléfono', 'info');
                return;
            }
        }

        try {
            setIsSaving(true);
            const payload = { name, description, productAssignments, members };

            if (editingTeam) {
                const updated = await teamService.update(editingTeam.id, payload);
                setTeams(prev => prev.map(t => t.id === updated.id ? updated : t));
                toast('Equipo actualizado', 'success');
            } else {
                const created = await teamService.create(payload as any);
                setTeams(prev => [...prev, created]);
                toast('Equipo creado', 'success');
            }
            resetForm();
        } catch {
            toast('Error al guardar el equipo', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const addMember = () => {
        setMembers(prev => [...prev, emptyMember()]);
        setExpandedMemberIdx(members.length);
    };

    const updateMember = (index: number, updates: Partial<TeamMember>) => {
        setMembers(prev => prev.map((m, i) => i === index ? { ...m, ...updates } : m));
    };

    const removeMember = (index: number) => {
        setMembers(prev => prev.filter((_, i) => i !== index));
        setExpandedMemberIdx(null);
    };

    const toggleProduct = (entityType: string, entityId: string) => {
        setProductAssignments(prev => {
            const exists = prev.some(pa => pa.entityType === entityType as any && pa.entityId === entityId);
            if (exists) return prev.filter(pa => !(pa.entityType === entityType as any && pa.entityId === entityId));
            return [...prev, { entityType: entityType as TeamProductAssignment['entityType'], entityId }];
        });
    };

    const isProductAssigned = (entityType: string, entityId: string) =>
        productAssignments.some(pa => pa.entityType === entityType as any && pa.entityId === entityId);

    const getTypeConfig = (entityType: string) =>
        PRODUCT_TYPES.find(pt => pt.value === entityType) || PRODUCT_TYPES[0];

    const productsByType = PRODUCT_TYPES.map(pt => ({
        ...pt,
        items: products.filter(p => p.entityType === pt.value),
    })).filter(group => group.items.length > 0);

    // Flatten all members across teams for the main table view
    const allMembers = teams.flatMap(team =>
        (team.members || []).map(m => ({ ...m, teamName: team.name, teamId: team.id }))
    );

    const isOnVacation = (m: TeamMember) => {
        if (!m.vacationStart || !m.vacationEnd) return false;
        const now = new Date();
        return now >= new Date(m.vacationStart) && now <= new Date(m.vacationEnd);
    };

    return (
        <div className="p-6 md:p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-3">
                        <Users size={28} className="text-blue-600" />
                        Equipo de Ventas
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
                        {allMembers.length} vendedor{allMembers.length !== 1 ? 'es' : ''} en {teams.length} equipo{teams.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    disabled={isLoading || isSaving}
                    className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                    <Plus size={18} /> Nuevo Equipo
                </button>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                    <Loader className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Cargando equipos...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-8 text-center">
                    <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
                    <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
                    <button onClick={fetchData} className="btn bg-red-600 text-white hover:bg-red-700 inline-flex items-center gap-2">
                        <RefreshCw size={16} /> Reintentar
                    </button>
                </div>
            ) : showForm ? (
                /* ── Create / Edit Form ── */
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-fade-in">
                    <div className="flex justify-between items-center mb-6 border-b pb-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                            {editingTeam ? 'Editar Equipo' : 'Nuevo Equipo'}
                        </h2>
                        <button onClick={resetForm} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 dark:text-gray-500">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Team Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Nombre del Equipo *</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)}
                                placeholder="Ej. Admisiones High Ticket" className="input w-full" disabled={isSaving} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Descripción</label>
                            <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                                placeholder="Rol del equipo..." className="input w-full" disabled={isSaving} />
                        </div>
                    </div>

                    {/* Members */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                <Users size={16} /> Miembros ({members.length})
                            </label>
                            <button onClick={addMember} disabled={isSaving}
                                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1">
                                <Plus size={14} /> Agregar
                            </button>
                        </div>

                        {members.length === 0 ? (
                            <div className="text-center py-6 text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg text-sm">
                                Agrega vendedores a este equipo
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {members.map((m, i) => {
                                    const isExp = expandedMemberIdx === i;
                                    return (
                                        <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                                onClick={() => setExpandedMemberIdx(isExp ? null : i)}>
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${m.isAvailable ? 'bg-green-500' : 'bg-red-400'}`} />
                                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{m.name || 'Nuevo vendedor'}</span>
                                                    {m.role && <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">{m.role}</span>}
                                                    {m.email && <span className="text-xs text-gray-400 dark:text-gray-500 hidden md:inline truncate">{m.email}</span>}
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <button onClick={e => { e.stopPropagation(); removeMember(i); }} disabled={isSaving}
                                                        className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 transition-opacity">
                                                        <Trash2 size={14} />
                                                    </button>
                                                    {isExp ? <ChevronUp size={16} className="text-gray-400 dark:text-gray-500" /> : <ChevronDown size={16} className="text-gray-400 dark:text-gray-500" />}
                                                </div>
                                            </div>

                                            {isExp && (
                                                <div className="p-4 bg-white dark:bg-gray-800 space-y-4 border-t border-gray-200 dark:border-gray-700">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Nombre *</label>
                                                            <input type="text" value={m.name} onChange={e => updateMember(i, { name: e.target.value })}
                                                                className="w-full text-sm py-1.5 px-2 border rounded mt-1" placeholder="Laura Gómez" disabled={isSaving} />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Email *</label>
                                                            <input type="email" value={m.email} onChange={e => updateMember(i, { email: e.target.value })}
                                                                className="w-full text-sm py-1.5 px-2 border rounded mt-1" placeholder="laura@empresa.com" disabled={isSaving} />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div>
                                                            <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Teléfono *</label>
                                                            <input type="tel" value={m.phone || ''} onChange={e => updateMember(i, { phone: e.target.value })}
                                                                className="w-full text-sm py-1.5 px-2 border rounded mt-1" placeholder="+51 999 999 999" disabled={isSaving} />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">WhatsApp</label>
                                                            <input type="tel" value={m.whatsapp || ''} onChange={e => updateMember(i, { whatsapp: e.target.value })}
                                                                className="w-full text-sm py-1.5 px-2 border rounded mt-1" placeholder="+51 999 999 999" disabled={isSaving} />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Rol</label>
                                                            <input type="text" value={m.role || ''} onChange={e => updateMember(i, { role: e.target.value })}
                                                                className="w-full text-sm py-1.5 px-2 border rounded mt-1" placeholder="Closer, SDR..." disabled={isSaving} />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div>
                                                            <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Horario</label>
                                                            <input type="text" value={m.availability || ''} onChange={e => updateMember(i, { availability: e.target.value })}
                                                                className="w-full text-sm py-1.5 px-2 border rounded mt-1" placeholder="09:00 - 18:00" disabled={isSaving} />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Inicio vacaciones</label>
                                                            <input type="date" value={m.vacationStart || ''} onChange={e => updateMember(i, { vacationStart: e.target.value || undefined })}
                                                                className="w-full text-sm py-1.5 px-2 border rounded mt-1" disabled={isSaving} />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Fin vacaciones</label>
                                                            <input type="date" value={m.vacationEnd || ''} onChange={e => updateMember(i, { vacationEnd: e.target.value || undefined })}
                                                                className="w-full text-sm py-1.5 px-2 border rounded mt-1" disabled={isSaving} />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <button type="button" onClick={() => updateMember(i, { isAvailable: !m.isAvailable })} disabled={isSaving}
                                                            className={`flex items-center gap-2 text-sm font-medium ${m.isAvailable ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                            {m.isAvailable ? <><ToggleRight size={22} className="text-green-600" /> Disponible</> : <><ToggleLeft size={22} className="text-red-400" /> No disponible</>}
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Product Assignments */}
                    <div className="mb-6">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <Book size={16} /> Productos Asignados
                            <span className="text-xs font-normal text-gray-400 dark:text-gray-500">({productAssignments.length})</span>
                        </label>
                        {productsByType.length === 0 ? (
                            <p className="text-sm text-gray-400 dark:text-gray-500 italic">No hay productos disponibles.</p>
                        ) : (
                            <div className="space-y-3 max-h-[250px] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                                {productsByType.map(group => (
                                    <div key={group.value}>
                                        <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{group.label}</div>
                                        <div className="flex flex-wrap gap-2">
                                            {group.items.map(product => {
                                                const selected = isProductAssigned(product.entityType, product.id);
                                                return (
                                                    <button key={product.id} type="button" onClick={() => toggleProduct(product.entityType, product.id)} disabled={isSaving}
                                                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 ${
                                                            selected ? `${group.color} border-current font-semibold ring-1 ring-current` : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
                                                        }`}>
                                                        {product.title}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t flex justify-end gap-3">
                        <button onClick={resetForm} className="btn btn-ghost text-gray-600 dark:text-gray-400" disabled={isSaving}>Cancelar</button>
                        <button onClick={handleSave} className="btn btn-primary px-8 flex items-center gap-2" disabled={isSaving}>
                            {isSaving ? <><Loader size={16} className="animate-spin" /> Guardando...</> : <><Save size={16} /> Guardar Equipo</>}
                        </button>
                    </div>
                </div>
            ) : (
                /* ── Main Table View ── */
                <>
                    {teams.length === 0 ? (
                        <div className="py-20 text-center bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                            <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No hay equipos</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">Comienza creando tu primer equipo comercial.</p>
                            <button onClick={() => setShowForm(true)} className="btn btn-primary">
                                <Plus size={16} /> Crear Equipo
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {teams.map(team => (
                                <div key={team.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                    {/* Team Header */}
                                    <div className="px-5 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{team.name}</h3>
                                            {team.description && <span className="text-xs text-gray-400 dark:text-gray-500">— {team.description}</span>}
                                            <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-semibold">
                                                {team.members?.length || 0} miembro{(team.members?.length || 0) !== 1 ? 's' : ''}
                                            </span>
                                            {team.productAssignments && team.productAssignments.length > 0 && (
                                                <span className="text-[10px] bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-semibold">
                                                    {team.productAssignments.length} producto{team.productAssignments.length !== 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => handleEdit(team)} disabled={isSaving}
                                                className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                                                <Edit2 size={15} />
                                            </button>
                                            <button onClick={() => handleDelete(team.id)} disabled={isSaving}
                                                className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Members Table */}
                                    {team.members && team.members.length > 0 ? (
                                        <table className="w-full">
                                            <thead>
                                                <tr className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                                                    <th className="text-left px-5 py-2.5">Nombre</th>
                                                    <th className="text-left px-5 py-2.5 hidden sm:table-cell">Email</th>
                                                    <th className="text-left px-5 py-2.5 hidden md:table-cell">Teléfono</th>
                                                    <th className="text-left px-5 py-2.5 hidden lg:table-cell">Rol</th>
                                                    <th className="text-left px-5 py-2.5">Estado</th>
                                                    <th className="text-left px-5 py-2.5 w-8"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {team.members.map((m, i) => {
                                                    const rowId = `${team.id}-${i}`;
                                                    const isExp = expandedRow === rowId;
                                                    const onVacation = isOnVacation(m);
                                                    return (
                                                        <Fragment key={rowId}>
                                                        <tr
                                                            className={`border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${isExp ? 'bg-blue-50/30 dark:bg-blue-900/20' : ''}`}
                                                            onClick={() => setExpandedRow(isExp ? null : rowId)}>
                                                            <td className="px-5 py-3">
                                                                <div className="flex items-center gap-2.5">
                                                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${onVacation ? 'bg-amber-400' : m.isAvailable ? 'bg-green-500' : 'bg-red-400'}`} />
                                                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{m.name || 'Sin nombre'}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-3 hidden sm:table-cell">
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">{m.email || '—'}</span>
                                                            </td>
                                                            <td className="px-5 py-3 hidden md:table-cell">
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">{m.phone || '—'}</span>
                                                            </td>
                                                            <td className="px-5 py-3 hidden lg:table-cell">
                                                                {m.role && <span className="text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-medium">{m.role}</span>}
                                                            </td>
                                                            <td className="px-5 py-3">
                                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                                                    onVacation ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' :
                                                                    m.isAvailable ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                                                }`}>
                                                                    {onVacation ? 'Vacaciones' : m.isAvailable ? 'Disponible' : 'No disponible'}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-3">
                                                                {isExp ? <ChevronUp size={14} className="text-gray-400 dark:text-gray-500" /> : <ChevronDown size={14} className="text-gray-400 dark:text-gray-500" />}
                                                            </td>
                                                        </tr>
                                                        {isExp && (
                                                            <tr key={`${rowId}-detail`}>
                                                                <td colSpan={6} className="px-5 py-4 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                                                        <div>
                                                                            <span className="text-gray-400 dark:text-gray-500 font-semibold uppercase text-[10px]">Email</span>
                                                                            <p className="text-gray-700 dark:text-gray-300 mt-0.5 flex items-center gap-1"><Mail size={11} /> {m.email || '—'}</p>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-gray-400 dark:text-gray-500 font-semibold uppercase text-[10px]">Teléfono</span>
                                                                            <p className="text-gray-700 dark:text-gray-300 mt-0.5 flex items-center gap-1"><Phone size={11} /> {m.phone || '—'}</p>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-gray-400 dark:text-gray-500 font-semibold uppercase text-[10px]">WhatsApp</span>
                                                                            <p className="text-gray-700 dark:text-gray-300 mt-0.5 flex items-center gap-1"><MessageCircle size={11} /> {m.whatsapp || '—'}</p>
                                                                        </div>
                                                                        <div>
                                                                            <span className="text-gray-400 dark:text-gray-500 font-semibold uppercase text-[10px]">Horario</span>
                                                                            <p className="text-gray-700 dark:text-gray-300 mt-0.5 flex items-center gap-1"><Clock size={11} /> {m.availability || '—'}</p>
                                                                        </div>
                                                                        {(m.vacationStart || m.vacationEnd) && (
                                                                            <div>
                                                                                <span className="text-gray-400 dark:text-gray-500 font-semibold uppercase text-[10px]">Vacaciones</span>
                                                                                <p className="text-amber-700 dark:text-amber-300 mt-0.5 flex items-center gap-1">
                                                                                    <Calendar size={11} />
                                                                                    {m.vacationStart ? new Date(m.vacationStart).toLocaleDateString() : '?'} — {m.vacationEnd ? new Date(m.vacationEnd).toLocaleDateString() : '?'}
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                        {m.specialties && m.specialties.length > 0 && (
                                                                            <div>
                                                                                <span className="text-gray-400 dark:text-gray-500 font-semibold uppercase text-[10px]">Especialidades</span>
                                                                                <div className="flex gap-1 mt-1 flex-wrap">
                                                                                    {m.specialties.map((s, si) => (
                                                                                        <span key={si} className="text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded">{s}</span>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        {m.maxLeads && (
                                                                            <div>
                                                                                <span className="text-gray-400 dark:text-gray-500 font-semibold uppercase text-[10px]">Max Leads</span>
                                                                                <p className="text-gray-700 dark:text-gray-300 mt-0.5">{m.maxLeads}</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                        </Fragment>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="px-5 py-4 text-sm text-gray-400 dark:text-gray-500 italic">
                                            No hay miembros en este equipo. <button onClick={() => handleEdit(team)} className="text-blue-600 dark:text-blue-400 hover:underline">Agregar</button>
                                        </div>
                                    )}

                                    {/* Product assignments footer */}
                                    {team.productAssignments && team.productAssignments.length > 0 && (
                                        <div className="px-5 py-2.5 bg-gray-50/50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2 flex-wrap">
                                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold uppercase">Productos:</span>
                                            {team.productAssignments.map((pa, idx) => {
                                                const productInfo = products.find(p => p.id === pa.entityId && p.entityType === pa.entityType);
                                                const typeConfig = getTypeConfig(pa.entityType);
                                                return (
                                                    <span key={idx} className={`text-[10px] px-2 py-0.5 rounded ${typeConfig.color}`}>
                                                        {productInfo?.title || pa.entityId}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
