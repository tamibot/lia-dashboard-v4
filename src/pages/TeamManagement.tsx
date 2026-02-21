import { useState, useEffect } from 'react';
import { Users, Plus, Edit2, Trash2, Calendar, Clock, Book, Loader, AlertCircle, RefreshCw } from 'lucide-react';
import { teamService } from '../lib/services/team.service';
import { courseService } from '../lib/services/course.service';
import type { Team, ContactInfo } from '../lib/types';

export default function TeamManagement() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [courses, setCourses] = useState<{ id: string, title: string, type: string }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [assignedCourses, setAssignedCourses] = useState<string[]>([]);
    const [members, setMembers] = useState<ContactInfo[]>([]);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const [teamsData, cursosData, programasData, webinarsData] = await Promise.all([
                teamService.getAll(),
                courseService.getAll('curso'),
                courseService.getAll('programa'),
                courseService.getAll('webinar')
            ]);

            setTeams(teamsData);

            const allCourses = [
                ...cursosData.map(c => ({ id: c.id, title: c.title, type: 'curso' })),
                ...programasData.map(p => ({ id: p.id, title: p.title, type: 'programa' })),
                ...webinarsData.map(w => ({ id: w.id, title: w.title, type: 'webinar' }))
            ];
            setCourses(allCourses);
        } catch (err: any) {
            console.error("Error fetching team data:", err);
            setError("No se pudieron cargar los datos del equipo. Por favor, intenta de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const resetForm = () => {
        setName('');
        setDescription('');
        setAssignedCourses([]);
        setMembers([]);
        setEditingTeam(null);
        setIsCreating(false);
    };

    const handleEdit = (team: Team) => {
        setEditingTeam(team);
        setName(team.name);
        setDescription(team.description || '');
        setAssignedCourses(team.assignedCourses || []);
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
                console.error("Error deleting team:", err);
                alert("No se pudo eliminar el equipo. Intenta de nuevo.");
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleSave = async () => {
        if (!name) return alert('El nombre del equipo es requerido');

        try {
            setIsSaving(true);
            const payload: Partial<Team> = {
                name,
                description,
                assignedCourses,
                members,
            };

            if (editingTeam) {
                const updatedTeam = await teamService.update(editingTeam.id, payload);
                setTeams(prev => prev.map(t => t.id === updatedTeam.id ? updatedTeam : t));
            } else {
                const newTeam = await teamService.create(payload);
                setTeams(prev => [...prev, newTeam]);
            }

            resetForm();
        } catch (err: any) {
            console.error("Error saving team:", err);
            alert("No se pudo guardar el equipo. Intenta de nuevo.");
        } finally {
            setIsSaving(false);
        }
    };

    const addMember = () => {
        setMembers([...members, { name: '', email: '', role: 'SDR', availability: '09:00 - 18:00', vacations: [] }]);
    };

    const updateMember = (index: number, updates: Partial<ContactInfo>) => {
        const newMembers = [...members];
        newMembers[index] = { ...newMembers[index], ...updates };
        setMembers(newMembers);
    };

    const removeMember = (index: number) => {
        setMembers(members.filter((_, i) => i !== index));
    };

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
                        Administra grupos de vendedores, horarios y asignación de cursos.
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
                    <button
                        onClick={fetchData}
                        className="btn bg-red-600 text-white hover:bg-red-700 inline-flex items-center gap-2"
                    >
                        <RefreshCw size={18} /> Reintentar
                    </button>
                </div>
            ) : (
                <>
                    {/* List */}
                    {!isCreating ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {teams.map(team => (
                                <div key={team.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900">{team.name}</h3>
                                            <p className="text-sm text-gray-500">{team.description}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(team)}
                                                disabled={isSaving}
                                                className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 rounded-lg disabled:opacity-50"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(team.id)}
                                                disabled={isSaving}
                                                className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 rounded-lg disabled:opacity-50"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                                <Users size={14} /> Integrantes ({team.members?.length || 0})
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                {team.members?.map((m, i) => (
                                                    <div key={i} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                                                        <div>
                                                            <div className="text-sm font-semibold text-gray-900">{m.name} <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded ml-2">{m.role}</span></div>
                                                            <div className="text-xs text-gray-500 flex items-center gap-3 mt-1">
                                                                <span className="flex items-center gap-1"><Clock size={12} /> {m.availability || 'Sin horario'}</span>
                                                                {m.vacations && m.vacations.length > 0 && <span className="flex items-center gap-1 text-amber-600"><Calendar size={12} /> Vacaciones prog.</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!team.members || team.members.length === 0) && (
                                                    <div className="text-xs text-gray-400 italic">No hay integrantes asignados</div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                                                <Book size={14} /> Cursos Asignados
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {team.assignedCourses?.map(cid => {
                                                    const courseInfo = courses.find(c => c.id === cid);
                                                    return (
                                                        <span key={cid} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-md mb-1">
                                                            {courseInfo?.title || cid}
                                                        </span>
                                                    );
                                                })}
                                                {(!team.assignedCourses || team.assignedCourses.length === 0) && <span className="text-xs text-gray-400">Sin cursos asignados</span>}
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
                        /* Edit/Create Form */
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 animate-fade-in">
                            <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">
                                {editingTeam ? 'Editar Equipo' : 'Nuevo Equipo Comercial'}
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Basic Info */}
                                <div className="space-y-6">
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
                                        <textarea
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            placeholder="Rol del equipo en el funnel de ventas..."
                                            className="input focus:ring-2 focus:ring-blue-100 w-full"
                                            rows={3}
                                            disabled={isSaving}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Cursos Asignados</label>
                                        <select
                                            multiple
                                            value={assignedCourses}
                                            onChange={e => setAssignedCourses(Array.from(e.target.selectedOptions, option => option.value))}
                                            className="input focus:ring-2 focus:ring-blue-100 w-full h-40"
                                            disabled={isSaving}
                                        >
                                            {courses.map(c => (
                                                <option key={c.id} value={c.id}>{c.title}</option>
                                            ))}
                                        </select>
                                        <p className="text-xs text-gray-500 mt-2">Mantén presionado Cmd/Ctrl para seleccionar múltiples.</p>
                                    </div>
                                </div>

                                {/* Members */}
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="block text-sm font-medium text-gray-700">Integrantes</label>
                                        <button
                                            onClick={addMember}
                                            disabled={isSaving}
                                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 disabled:opacity-50"
                                        >
                                            <Plus size={14} /> Agregar Vendedor
                                        </button>
                                    </div>

                                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                                        {members.map((m, i) => (
                                            <div key={i} className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative group">
                                                <button
                                                    onClick={() => removeMember(i)}
                                                    disabled={isSaving}
                                                    className="absolute top-2 right-2 text-gray-400 hover:text-red-500 md:opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                                <div className="grid grid-cols-2 gap-4 mb-3">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Nombre</label>
                                                        <input
                                                            type="text"
                                                            value={m.name}
                                                            onChange={e => updateMember(i, { name: e.target.value })}
                                                            className="w-full text-sm py-1.5 px-2 border rounded mt-1 bg-white"
                                                            placeholder="Ej. Laura"
                                                            disabled={isSaving}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Rol</label>
                                                        <input
                                                            type="text"
                                                            value={m.role}
                                                            onChange={e => updateMember(i, { role: e.target.value })}
                                                            className="w-full text-sm py-1.5 px-2 border rounded mt-1 bg-white"
                                                            placeholder="Ej. Closer Senior"
                                                            disabled={isSaving}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><Clock size={10} /> Horario</label>
                                                        <input
                                                            type="text"
                                                            value={m.availability}
                                                            onChange={e => updateMember(i, { availability: e.target.value })}
                                                            className="w-full text-sm py-1.5 px-2 border rounded mt-1 bg-white"
                                                            placeholder="09:00 - 18:00"
                                                            disabled={isSaving}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1"><Calendar size={10} /> Vacaciones</label>
                                                        <input
                                                            type="text"
                                                            value={m.vacations?.join(', ')}
                                                            onChange={e => updateMember(i, { vacations: e.target.value ? e.target.value.split(',').map(v => v.trim()) : [] })}
                                                            className="w-full text-sm py-1.5 px-2 border rounded mt-1 bg-white"
                                                            placeholder="DD/MM al DD/MM"
                                                            disabled={isSaving}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {members.length === 0 && (
                                            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                                                No hay vendedores asignados a este equipo.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t flex justify-end gap-3">
                                <button
                                    onClick={resetForm}
                                    className="btn btn-ghost text-gray-600"
                                    disabled={isSaving}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="btn btn-primary px-8 flex items-center gap-2"
                                    disabled={isSaving}
                                >
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
