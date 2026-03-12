import { useState, useEffect } from 'react';
import {
    Users, Plus, Edit2, Trash2, Calendar, Clock, Book, Loader,
    AlertCircle, RefreshCw, Mail, Phone, MessageCircle, Star,
    ToggleLeft, ToggleRight, ChevronDown, ChevronUp
} from 'lucide-react';
import { teamService } from '../lib/services/team.service';
import { courseService } from '../lib/services/course.service';
import type { Team, TeamMember, TeamProductAssignment } from '../lib/types';

// All 7 product types the platform supports
const PRODUCT_TYPES = [
    { value: 'course', label: 'Curso Libre', color: 'bg-blue-100 text-blue-700' },
    { value: 'program', label: 'Programa', color: 'bg-purple-100 text-purple-700' },
    { value: 'webinar', label: 'Webinar', color: 'bg-green-100 text-green-700' },
    { value: 'taller', label: 'Taller', color: 'bg-amber-100 text-amber-700' },
    { value: 'subscription', label: 'Suscripción', color: 'bg-pink-100 text-pink-700' },
    { value: 'asesoria', label: 'Asesoría', color: 'bg-teal-100 text-teal-700' },
    { value: 'application', label: 'Postulación', color: 'bg-indigo-100 text-indigo-700' },
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
    const [teams, setTeams] = useState<Team[]>([]);
    const [products, setProducts] = useState<ProductOption[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [expandedMember, setExpandedMember] = useState<number | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [productAssignments, setProductAssignments] = useState<TeamProductAssignment[]>([]);
    const [members, setMembers] = useState<TeamMember[]>([]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Fetch all product types in parallel
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
            setError('No se pudieron cargar los datos del equipo. Por favor, intenta de nuevo.');
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
        setIsCreating(false);
        setExpandedMember(null);
    };

    const handleEdit = (team: Team) => {
        setEditingTeam(team);
        setName(team.name);
        setDescription(team.description || '');
        setProductAssignments(team.productAssignments || []);
        setMembers(team.members || []);
        setIsCreating(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar este equipo?')) {
            try {
                setIsSaving(true);
                await teamService.delete(id);
                setTeams(prev => prev.filter(t => t.id !== id));
            } catch (err: any) {
                console.error('Error deleting team:', err);
                alert('No se pudo eliminar el equipo. Intenta de nuevo.');
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleSave = async () => {
        if (!name) return alert('El nombre del equipo es requerido');

        try {
            setIsSaving(true);
            const payload = {
                name,
                description,
                productAssignments,
                members,
            };

            if (editingTeam) {
                const updatedTeam = await teamService.update(editingTeam.id, payload);
                setTeams(prev => prev.map(t => t.id === updatedTeam.id ? updatedTeam : t));
            } else {
                const newTeam = await teamService.create(payload as any);
                setTeams(prev => [...prev, newTeam]);
            }
            resetForm();
        } catch (err: any) {
            console.error('Error saving team:', err);
            alert('No se pudo guardar el equipo. Intenta de nuevo.');
        } finally {
            setIsSaving(false);
        }
    };

    // --- Member helpers ---
    const addMember = () => {
        setMembers(prev => [...prev, emptyMember()]);
        setExpandedMember(members.length); // expand newly added
    };

    const updateMember = (index: number, updates: Partial<TeamMember>) => {
        setMembers(prev => prev.map((m, i) => i === index ? { ...m, ...updates } : m));
    };

    const removeMember = (index: number) => {
        setMembers(prev => prev.filter((_, i) => i !== index));
        setExpandedMember(null);
    };

    // --- Product assignment helpers ---
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

    // Group products by type for the selector
    const productsByType = PRODUCT_TYPES.map(pt => ({
        ...pt,
        items: products.filter(p => p.entityType === pt.value),
    })).filter(group => group.items.length > 0);

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                        <Users size={32} className="text-blue-600" />
                        Gestión de Equipos Comerciales
                    </h1>
                    <p className="text-gray-500 mt-2 font-medium">
                        Administra grupos de vendedores, horarios y asignación de productos.
                    </p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    disabled={isLoading || isSaving}
                    className="btn btn-primary shadow-lg hover:shadow-xl transition-all flex items-center gap-2 disabled:opacity-50"
                >
                    <Plus size={20} /> Nuevo Equipo
                </button>
            </div>

            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
                    <Loader className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                    <p className="text-gray-500 font-medium">Cargando equipos...</p>
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-lg font-bold text-red-900 mb-2">Error al cargar datos</h3>
                    <p className="text-red-700 mb-6">{error}</p>
                    <button onClick={fetchData} className="btn bg-red-600 text-white hover:bg-red-700 inline-flex items-center gap-2">
                        <RefreshCw size={18} /> Reintentar
                    </button>
                </div>
            ) : (
                <>
                    {/* Team List */}
                    {!isCreating ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {teams.map(team => (
                                <div key={team.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{team.name}</h3>
                                            {team.description && <p className="text-sm text-gray-500 mt-1">{team.description}</p>}
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEdit(team)} disabled={isSaving} className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-lg disabled:opacity-50">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(team.id)} disabled={isSaving} className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 rounded-lg disabled:opacity-50">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Members */}
                                        <div>
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                                <Users size={14} /> Integrantes ({team.members?.length || 0})
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                {team.members?.map((m, i) => (
                                                    <div key={i} className="bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                                                    {m.name || 'Sin nombre'}
                                                                    {m.role && <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{m.role}</span>}
                                                                    {!m.isAvailable && <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">No disponible</span>}
                                                                </div>
                                                                <div className="text-xs text-gray-500 flex items-center gap-3 mt-1 flex-wrap">
                                                                    {m.email && <span className="flex items-center gap-1"><Mail size={11} /> {m.email}</span>}
                                                                    {m.phone && <span className="flex items-center gap-1"><Phone size={11} /> {m.phone}</span>}
                                                                    {m.whatsapp && <span className="flex items-center gap-1"><MessageCircle size={11} /> {m.whatsapp}</span>}
                                                                    <span className="flex items-center gap-1"><Clock size={11} /> {m.availability || 'Sin horario'}</span>
                                                                    {(m.vacationStart || m.vacationEnd) && (
                                                                        <span className="flex items-center gap-1 text-amber-600">
                                                                            <Calendar size={11} />
                                                                            {m.vacationStart ? new Date(m.vacationStart).toLocaleDateString() : '?'} - {m.vacationEnd ? new Date(m.vacationEnd).toLocaleDateString() : '?'}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {m.specialties && m.specialties.length > 0 && (
                                                                    <div className="flex gap-1 mt-1 flex-wrap">
                                                                        {m.specialties.map((s, si) => (
                                                                            <span key={si} className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">{s}</span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!team.members || team.members.length === 0) && (
                                                    <div className="text-xs text-gray-400 italic">No hay integrantes asignados</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Product Assignments */}
                                        <div>
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                                <Book size={14} /> Productos Asignados
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {team.productAssignments?.map((pa, idx) => {
                                                    const productInfo = products.find(p => p.id === pa.entityId && p.entityType === pa.entityType);
                                                    const typeConfig = getTypeConfig(pa.entityType);
                                                    return (
                                                        <span key={idx} className={`text-xs px-2 py-1 rounded-md ${typeConfig.color}`}>
                                                            {typeConfig.label}: {productInfo?.title || pa.entityId}
                                                        </span>
                                                    );
                                                })}
                                                {(!team.productAssignments || team.productAssignments.length === 0) && (
                                                    <span className="text-xs text-gray-400">Sin productos asignados</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {teams.length === 0 && (
                                <div className="col-span-full py-20 text-center bg-white rounded-xl border border-dashed border-gray-200">
                                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">No hay equipos</h3>
                                    <p className="text-gray-500">Comienza creando tu primer equipo comercial.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Create / Edit Form */
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 animate-fade-in">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">
                                {editingTeam ? 'Editar Equipo' : 'Nuevo Equipo Comercial'}
                            </h2>

                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del Equipo</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="Ej. Admisiones High Ticket"
                                        className="input focus:ring-2 focus:ring-blue-100 w-full"
                                        disabled={isSaving}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Descripción</label>
                                    <input
                                        type="text"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        placeholder="Rol del equipo en el funnel de ventas..."
                                        className="input focus:ring-2 focus:ring-blue-100 w-full"
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>

                            {/* Product Assignments Section */}
                            <div className="mb-8">
                                <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                    <Book size={16} /> Productos Asignados
                                    <span className="text-xs font-normal text-gray-400">({productAssignments.length} seleccionados)</span>
                                </label>

                                {productsByType.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic">No hay productos disponibles. Crea productos primero.</p>
                                ) : (
                                    <div className="space-y-3 max-h-[300px] overflow-y-auto border border-gray-200 rounded-lg p-4 bg-gray-50">
                                        {productsByType.map(group => (
                                            <div key={group.value}>
                                                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{group.label}</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {group.items.map(product => {
                                                        const selected = isProductAssigned(product.entityType, product.id);
                                                        return (
                                                            <button
                                                                key={product.id}
                                                                type="button"
                                                                onClick={() => toggleProduct(product.entityType, product.id)}
                                                                disabled={isSaving}
                                                                className={`text-xs px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 ${
                                                                    selected
                                                                        ? `${group.color} border-current font-semibold ring-1 ring-current`
                                                                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                                                                }`}
                                                            >
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

                            {/* Members Section */}
                            <div className="mb-8">
                                <div className="flex justify-between items-center mb-3">
                                    <label className="block text-sm font-bold text-gray-700 flex items-center gap-2">
                                        <Users size={16} /> Integrantes
                                        <span className="text-xs font-normal text-gray-400">({members.length})</span>
                                    </label>
                                    <button
                                        onClick={addMember}
                                        disabled={isSaving}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 disabled:opacity-50"
                                    >
                                        <Plus size={14} /> Agregar Vendedor
                                    </button>
                                </div>

                                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                                    {members.map((m, i) => {
                                        const isExpanded = expandedMember === i;
                                        return (
                                            <div key={i} className="bg-gray-50 rounded-lg border border-gray-200 relative group overflow-hidden">
                                                {/* Collapsed header */}
                                                <div
                                                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                                                    onClick={() => setExpandedMember(isExpanded ? null : i)}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${m.isAvailable ? 'bg-green-500' : 'bg-red-400'}`} />
                                                        <span className="text-sm font-semibold text-gray-900 truncate">{m.name || 'Nuevo vendedor'}</span>
                                                        {m.role && <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex-shrink-0">{m.role}</span>}
                                                        {m.email && <span className="text-xs text-gray-400 truncate hidden md:inline">{m.email}</span>}
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <button
                                                            onClick={e => { e.stopPropagation(); removeMember(i); }}
                                                            disabled={isSaving}
                                                            className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                        {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                                                    </div>
                                                </div>

                                                {/* Expanded form */}
                                                {isExpanded && (
                                                    <div className="p-4 pt-0 border-t border-gray-200 bg-white space-y-4">
                                                        {/* Row 1: Name, Email */}
                                                        <div className="grid grid-cols-2 gap-4 pt-4">
                                                            <div>
                                                                <label className="text-[10px] font-bold text-gray-500 uppercase">Nombre completo</label>
                                                                <input
                                                                    type="text" value={m.name}
                                                                    onChange={e => updateMember(i, { name: e.target.value })}
                                                                    className="w-full text-sm py-1.5 px-2 border rounded mt-1 bg-white"
                                                                    placeholder="Ej. Laura Gómez"
                                                                    disabled={isSaving}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><Mail size={10} /> Email</label>
                                                                <input
                                                                    type="email" value={m.email}
                                                                    onChange={e => updateMember(i, { email: e.target.value })}
                                                                    className="w-full text-sm py-1.5 px-2 border rounded mt-1 bg-white"
                                                                    placeholder="laura@empresa.com"
                                                                    disabled={isSaving}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Row 2: Phone, WhatsApp, Role */}
                                                        <div className="grid grid-cols-3 gap-4">
                                                            <div>
                                                                <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><Phone size={10} /> Teléfono</label>
                                                                <input
                                                                    type="tel" value={m.phone || ''}
                                                                    onChange={e => updateMember(i, { phone: e.target.value })}
                                                                    className="w-full text-sm py-1.5 px-2 border rounded mt-1 bg-white"
                                                                    placeholder="+51 999 999 999"
                                                                    disabled={isSaving}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><MessageCircle size={10} /> WhatsApp</label>
                                                                <input
                                                                    type="tel" value={m.whatsapp || ''}
                                                                    onChange={e => updateMember(i, { whatsapp: e.target.value })}
                                                                    className="w-full text-sm py-1.5 px-2 border rounded mt-1 bg-white"
                                                                    placeholder="+51 999 999 999"
                                                                    disabled={isSaving}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold text-gray-500 uppercase">Rol</label>
                                                                <input
                                                                    type="text" value={m.role || ''}
                                                                    onChange={e => updateMember(i, { role: e.target.value })}
                                                                    className="w-full text-sm py-1.5 px-2 border rounded mt-1 bg-white"
                                                                    placeholder="Ej. Closer, SDR, Manager"
                                                                    disabled={isSaving}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Row 3: Availability, Vacation dates */}
                                                        <div className="grid grid-cols-3 gap-4">
                                                            <div>
                                                                <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><Clock size={10} /> Horario</label>
                                                                <input
                                                                    type="text" value={m.availability || ''}
                                                                    onChange={e => updateMember(i, { availability: e.target.value })}
                                                                    className="w-full text-sm py-1.5 px-2 border rounded mt-1 bg-white"
                                                                    placeholder="09:00 - 18:00"
                                                                    disabled={isSaving}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><Calendar size={10} /> Inicio vacaciones</label>
                                                                <input
                                                                    type="date" value={m.vacationStart || ''}
                                                                    onChange={e => updateMember(i, { vacationStart: e.target.value || undefined })}
                                                                    className="w-full text-sm py-1.5 px-2 border rounded mt-1 bg-white"
                                                                    disabled={isSaving}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><Calendar size={10} /> Fin vacaciones</label>
                                                                <input
                                                                    type="date" value={m.vacationEnd || ''}
                                                                    onChange={e => updateMember(i, { vacationEnd: e.target.value || undefined })}
                                                                    className="w-full text-sm py-1.5 px-2 border rounded mt-1 bg-white"
                                                                    disabled={isSaving}
                                                                />
                                                            </div>
                                                        </div>

                                                        {/* Row 4: Specialties, Max Leads, Available toggle */}
                                                        <div className="grid grid-cols-3 gap-4 items-end">
                                                            <div>
                                                                <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><Star size={10} /> Especialidades</label>
                                                                <input
                                                                    type="text"
                                                                    value={m.specialties?.join(', ') || ''}
                                                                    onChange={e => updateMember(i, { specialties: e.target.value ? e.target.value.split(',').map(s => s.trim()).filter(Boolean) : [] })}
                                                                    className="w-full text-sm py-1.5 px-2 border rounded mt-1 bg-white"
                                                                    placeholder="Ej. MBA, Pregrado, Online"
                                                                    disabled={isSaving}
                                                                />
                                                                <p className="text-[10px] text-gray-400 mt-0.5">Separar con comas</p>
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] font-bold text-gray-500 uppercase">Max leads simultáneos</label>
                                                                <input
                                                                    type="number" value={m.maxLeads ?? ''}
                                                                    onChange={e => updateMember(i, { maxLeads: e.target.value ? parseInt(e.target.value) : undefined })}
                                                                    className="w-full text-sm py-1.5 px-2 border rounded mt-1 bg-white"
                                                                    placeholder="Sin límite"
                                                                    min={1}
                                                                    disabled={isSaving}
                                                                />
                                                            </div>
                                                            <div className="flex items-center gap-3 pb-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateMember(i, { isAvailable: !m.isAvailable })}
                                                                    disabled={isSaving}
                                                                    className={`flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50 ${m.isAvailable ? 'text-green-700' : 'text-red-600'}`}
                                                                >
                                                                    {m.isAvailable
                                                                        ? <><ToggleRight size={24} className="text-green-600" /> Disponible</>
                                                                        : <><ToggleLeft size={24} className="text-red-400" /> No disponible</>
                                                                    }
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    {members.length === 0 && (
                                        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                                            No hay vendedores asignados a este equipo.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="pt-6 border-t flex justify-end gap-3">
                                <button onClick={resetForm} className="btn btn-ghost text-gray-600" disabled={isSaving}>
                                    Cancelar
                                </button>
                                <button onClick={handleSave} className="btn btn-primary px-8 flex items-center gap-2" disabled={isSaving}>
                                    {isSaving ? <><Loader size={18} className="animate-spin" /> Guardando...</> : 'Guardar Equipo'}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
