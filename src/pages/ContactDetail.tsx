import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import {
    ArrowLeft, User, Mail, Phone, MapPin, Globe, Tag, Calendar,
    Loader2, AlertTriangle, ExternalLink, ChevronDown, X, Plus,
    MessageSquare, Clock, Send, Download, Edit3, CheckCircle2,
    Circle, Database,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Contact {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    phoneCountry: string | null;
    city: string | null;
    country: string | null;
    stage: string;
    origin: string;
    customOrigin: string | null;
    courseInterest: string | null;
    programInterest: string | null;
    budget: number | null;
    currency: string;
    tags: string[];
    notes: string | null;
    ghlContactId: string | null;
    ghlData: any;
    utmSource: string | null;
    utmMedium: string | null;
    utmCampaign: string | null;
    adPlatform: string | null;
    landingPage: string | null;
    createdAt: string;
    updatedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Label & color mappings                                             */
/* ------------------------------------------------------------------ */

const STAGE_OPTIONS = [
    'nuevo', 'contactado', 'interesado', 'propuesta',
    'negociacion', 'ganado', 'perdido', 'inactivo',
] as const;

const STAGE_LABELS: Record<string, string> = {
    nuevo: 'Nuevo Lead',
    contactado: 'Contactado',
    interesado: 'Interesado',
    propuesta: 'Propuesta',
    negociacion: 'Negociacion',
    ganado: 'Ganado',
    perdido: 'Perdido',
    inactivo: 'Inactivo',
};

const STAGE_COLORS: Record<string, string> = {
    nuevo: 'bg-blue-50 text-blue-700',
    contactado: 'bg-indigo-50 text-indigo-700',
    interesado: 'bg-violet-50 text-violet-700',
    propuesta: 'bg-purple-50 text-purple-700',
    negociacion: 'bg-amber-50 text-amber-700',
    ganado: 'bg-emerald-50 text-emerald-700',
    perdido: 'bg-red-50 text-red-700',
    inactivo: 'bg-gray-100 text-gray-500',
};

const STAGE_DOT_COLORS: Record<string, string> = {
    nuevo: 'text-blue-500',
    contactado: 'text-indigo-500',
    interesado: 'text-violet-500',
    propuesta: 'text-purple-500',
    negociacion: 'text-amber-500',
    ganado: 'text-emerald-500',
    perdido: 'text-red-500',
    inactivo: 'text-gray-400',
};

const ORIGIN_LABELS: Record<string, string> = {
    meta_ads: 'Meta Ads',
    google_ads: 'Google Ads',
    tiktok_ads: 'TikTok Ads',
    referido: 'Referido',
    organico: 'Organico',
    webinar: 'Webinar',
    evento: 'Evento',
    linkedin: 'LinkedIn',
    whatsapp: 'WhatsApp',
    agente_ia: 'Agente IA',
    otro: 'Otro',
};

const ORIGIN_COLORS: Record<string, string> = {
    meta_ads: 'bg-blue-50 text-blue-700',
    google_ads: 'bg-yellow-50 text-yellow-700',
    tiktok_ads: 'bg-red-50 text-red-700',
    referido: 'bg-purple-50 text-purple-700',
    organico: 'bg-emerald-50 text-emerald-700',
    webinar: 'bg-pink-50 text-pink-700',
    evento: 'bg-indigo-50 text-indigo-700',
    linkedin: 'bg-sky-50 text-sky-700',
    whatsapp: 'bg-green-50 text-green-700',
    agente_ia: 'bg-violet-50 text-violet-700',
    otro: 'bg-gray-100 text-gray-600',
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatDate(iso: string, includeTime = false) {
    const opts: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    };
    return new Date(iso).toLocaleDateString('es', opts);
}

function formatShortDate(iso: string) {
    return new Date(iso).toLocaleDateString('es', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function ContactDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [contact, setContact] = useState<Contact | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Tags
    const [newTag, setNewTag] = useState('');

    // Notes
    const [noteText, setNoteText] = useState('');
    const [savingNote, setSavingNote] = useState(false);

    // Stage change
    const [stageDropdownOpen, setStageDropdownOpen] = useState(false);
    const [changingStage, setChangingStage] = useState(false);

    /* ---- Fetch contact ---- */
    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setError(null);
        api.get<Contact>(`/contacts/${id}`)
            .then((data) => setContact(data))
            .catch((err: any) => setError(err.message || 'Error al cargar contacto'))
            .finally(() => setLoading(false));
    }, [id]);

    /* ---- Tag management ---- */
    const addTag = async () => {
        if (!contact) return;
        const tag = newTag.trim().toLowerCase().replace(/\s+/g, '_');
        if (!tag || contact.tags.includes(tag)) return;
        const updated = [...contact.tags, tag];
        try {
            await api.put(`/contacts/${contact.id}`, { tags: updated });
            setContact({ ...contact, tags: updated });
            setNewTag('');
        } catch { /* ignore */ }
    };

    const removeTag = async (tag: string) => {
        if (!contact) return;
        const updated = contact.tags.filter((t) => t !== tag);
        try {
            await api.put(`/contacts/${contact.id}`, { tags: updated });
            setContact({ ...contact, tags: updated });
        } catch { /* ignore */ }
    };

    /* ---- Change stage ---- */
    const changeStage = async (newStage: string) => {
        if (!contact || newStage === contact.stage) {
            setStageDropdownOpen(false);
            return;
        }
        setChangingStage(true);
        try {
            await api.put(`/contacts/${contact.id}`, { stage: newStage });
            setContact({ ...contact, stage: newStage, updatedAt: new Date().toISOString() });
        } catch { /* ignore */ }
        setChangingStage(false);
        setStageDropdownOpen(false);
    };

    /* ---- Add note ---- */
    const addNote = async () => {
        if (!contact || !noteText.trim()) return;
        setSavingNote(true);
        const existingNotes = contact.notes || '';
        const timestamp = new Date().toLocaleString('es', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
        const newNote = `[${timestamp}] ${noteText.trim()}`;
        const updatedNotes = existingNotes
            ? `${newNote}\n${existingNotes}`
            : newNote;
        try {
            await api.put(`/contacts/${contact.id}`, { notes: updatedNotes });
            setContact({ ...contact, notes: updatedNotes, updatedAt: new Date().toISOString() });
            setNoteText('');
        } catch { /* ignore */ }
        setSavingNote(false);
    };

    /* ---- Export contact ---- */
    const exportContact = () => {
        if (!contact) return;
        const data = JSON.stringify(contact, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contacto-${contact.name.replace(/\s+/g, '_')}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    /* ---- Build timeline ---- */
    const buildTimeline = () => {
        if (!contact) return [];
        const items: { date: string; icon: any; iconColor: string; title: string; description?: string }[] = [];

        // Created
        items.push({
            date: contact.createdAt,
            icon: Plus,
            iconColor: 'text-emerald-500',
            title: 'Contacto creado',
            description: `Origen: ${ORIGIN_LABELS[contact.origin] || contact.origin}${contact.customOrigin ? ` (${contact.customOrigin})` : ''}`,
        });

        // Current stage
        items.push({
            date: contact.updatedAt,
            icon: CheckCircle2,
            iconColor: STAGE_DOT_COLORS[contact.stage] || 'text-gray-400',
            title: `Etapa actual: ${STAGE_LABELS[contact.stage] || contact.stage}`,
            description: `Ultima actualizacion: ${formatShortDate(contact.updatedAt)}`,
        });

        // Notes entries (parse timestamped notes)
        if (contact.notes) {
            const noteLines = contact.notes.split('\n').filter((l) => l.trim());
            noteLines.forEach((line) => {
                const match = line.match(/^\[(.+?)\]\s*(.+)$/);
                if (match) {
                    items.push({
                        date: contact.updatedAt,
                        icon: MessageSquare,
                        iconColor: 'text-blue-500',
                        title: 'Nota agregada',
                        description: match[2],
                    });
                }
            });
        }

        return items;
    };

    /* ---- Render: Loading ---- */
    if (loading) {
        return (
            <div className="page-content">
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-blue-600" />
                    <span className="ml-3 text-gray-500">Cargando contacto...</span>
                </div>
            </div>
        );
    }

    /* ---- Render: Error ---- */
    if (error || !contact) {
        return (
            <div className="page-content">
                <button
                    onClick={() => navigate('/contacts')}
                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Volver a Contactos
                </button>
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-4 py-3 rounded-lg">
                    <AlertTriangle size={16} />
                    {error || 'Contacto no encontrado'}
                </div>
            </div>
        );
    }

    const stageCls = STAGE_COLORS[contact.stage] || 'bg-gray-100 text-gray-600';
    const originCls = ORIGIN_COLORS[contact.origin] || 'bg-gray-100 text-gray-600';
    const timeline = buildTimeline();

    /* ---- Render: Main ---- */
    return (
        <div className="page-content">
            {/* Back button */}
            <button
                onClick={() => navigate('/contacts')}
                className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 transition-colors"
            >
                <ArrowLeft size={16} />
                Volver a Contactos
            </button>

            {/* Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                            {contact.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                                {contact.name}
                            </h1>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                {contact.email && (
                                    <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                        <Mail size={13} />
                                        {contact.email}
                                    </span>
                                )}
                                {contact.phone && (
                                    <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                        <Phone size={13} />
                                        {contact.phoneCountry ? `(${contact.phoneCountry}) ` : ''}{contact.phone}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${stageCls}`}>
                            {STAGE_LABELS[contact.stage] || contact.stage}
                        </span>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${originCls}`}>
                            {ORIGIN_LABELS[contact.origin] || contact.origin}
                            {contact.customOrigin ? ` (${contact.customOrigin})` : ''}
                        </span>
                    </div>
                </div>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Contact Info Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                            <User size={16} className="text-gray-400" />
                            Informacion del Contacto
                        </h2>
                        <div className="space-y-3">
                            <InfoRow icon={User} label="Nombre" value={contact.name} />
                            <InfoRow icon={Mail} label="Email" value={contact.email || '-'} />
                            <InfoRow
                                icon={Phone}
                                label="Telefono"
                                value={contact.phone
                                    ? `${contact.phoneCountry ? `(${contact.phoneCountry}) ` : ''}${contact.phone}`
                                    : '-'}
                            />
                            <InfoRow icon={MapPin} label="Ciudad" value={contact.city || '-'} />
                            <InfoRow icon={Globe} label="Pais" value={contact.country || '-'} />
                            <InfoRow
                                icon={Calendar}
                                label="Registrado"
                                value={formatDate(contact.createdAt, true)}
                            />
                            {contact.courseInterest && (
                                <InfoRow icon={Edit3} label="Interes (Curso)" value={contact.courseInterest} />
                            )}
                            {contact.programInterest && (
                                <InfoRow icon={Edit3} label="Interes (Programa)" value={contact.programInterest} />
                            )}
                            {contact.budget != null && (
                                <InfoRow
                                    icon={Edit3}
                                    label="Presupuesto"
                                    value={`${contact.budget.toLocaleString()} ${contact.currency}`}
                                />
                            )}
                        </div>

                        {/* UTM Data */}
                        {(contact.utmSource || contact.utmMedium || contact.utmCampaign || contact.adPlatform || contact.landingPage) && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-2">
                                    Datos de Adquisicion
                                </p>
                                <div className="space-y-1.5 text-xs">
                                    {contact.utmSource && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">UTM Source</span>
                                            <span className="text-gray-700 font-medium">{contact.utmSource}</span>
                                        </div>
                                    )}
                                    {contact.utmMedium && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">UTM Medium</span>
                                            <span className="text-gray-700 font-medium">{contact.utmMedium}</span>
                                        </div>
                                    )}
                                    {contact.utmCampaign && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">UTM Campaign</span>
                                            <span className="text-gray-700 font-medium">{contact.utmCampaign}</span>
                                        </div>
                                    )}
                                    {contact.adPlatform && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Plataforma</span>
                                            <span className="text-gray-700 font-medium">{contact.adPlatform}</span>
                                        </div>
                                    )}
                                    {contact.landingPage && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Landing Page</span>
                                            <span className="text-gray-700 font-medium truncate max-w-[160px]">{contact.landingPage}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Tags Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                            <Tag size={16} className="text-gray-400" />
                            Etiquetas
                        </h2>
                        <div className="flex flex-wrap gap-1.5 items-center">
                            {contact.tags.length === 0 && (
                                <span className="text-xs text-gray-400">Sin etiquetas</span>
                            )}
                            {contact.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 group"
                                >
                                    {tag}
                                    <button
                                        onClick={() => removeTag(tag)}
                                        className="text-blue-400 hover:text-red-500 transition-colors"
                                    >
                                        <X size={10} />
                                    </button>
                                </span>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                            <input
                                type="text"
                                placeholder="Nueva etiqueta..."
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addTag()}
                                className="flex-1 text-xs px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <button
                                onClick={addTag}
                                disabled={!newTag.trim()}
                                className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </div>

                    {/* GHL Data Card */}
                    {contact.ghlContactId && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                                <Database size={16} className="text-gray-400" />
                                GoHighLevel
                            </h2>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400">GHL Contact ID</span>
                                    <span className="text-xs text-gray-700 font-mono">{contact.ghlContactId}</span>
                                </div>
                                {contact.ghlData && (
                                    <div className="mt-3 pt-3 border-t border-gray-100">
                                        <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-2">
                                            Datos Raw
                                        </p>
                                        <pre className="text-[10px] text-gray-600 bg-gray-50 rounded-lg p-3 overflow-x-auto max-h-60 overflow-y-auto">
                                            {JSON.stringify(contact.ghlData, null, 2)}
                                        </pre>
                                    </div>
                                )}
                                <a
                                    href={`https://app.gohighlevel.com/v2/location/contacts/${contact.ghlContactId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors mt-2"
                                >
                                    <ExternalLink size={12} />
                                    Ver en GoHighLevel
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                            <Edit3 size={16} className="text-gray-400" />
                            Acciones Rapidas
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {/* Change Stage Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setStageDropdownOpen(!stageDropdownOpen)}
                                    disabled={changingStage}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                                >
                                    {changingStage ? (
                                        <Loader2 size={14} className="animate-spin" />
                                    ) : (
                                        <Circle size={14} />
                                    )}
                                    Cambiar Etapa
                                    <ChevronDown size={14} />
                                </button>
                                {stageDropdownOpen && (
                                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1">
                                        {STAGE_OPTIONS.map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => changeStage(s)}
                                                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                                                    s === contact.stage ? 'font-semibold text-blue-700 bg-blue-50' : 'text-gray-700'
                                                }`}
                                            >
                                                <span className={`w-2 h-2 rounded-full ${STAGE_COLORS[s]?.split(' ')[0] || 'bg-gray-200'}`} />
                                                {STAGE_LABELS[s]}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Export */}
                            <button
                                onClick={exportContact}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <Download size={14} />
                                Exportar JSON
                            </button>
                        </div>
                    </div>

                    {/* Add Note */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                            <MessageSquare size={16} className="text-gray-400" />
                            Agregar Nota
                        </h2>
                        <div className="flex gap-3">
                            <textarea
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="Escribe una nota sobre este contacto..."
                                rows={3}
                                className="flex-1 text-sm px-4 py-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex justify-end mt-3">
                            <button
                                onClick={addNote}
                                disabled={!noteText.trim() || savingNote}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {savingNote ? (
                                    <Loader2 size={14} className="animate-spin" />
                                ) : (
                                    <Send size={14} />
                                )}
                                Guardar Nota
                            </button>
                        </div>
                    </div>

                    {/* Timeline / Activity Log */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                        <h2 className="text-sm font-semibold text-gray-900 mb-5 flex items-center gap-2">
                            <Clock size={16} className="text-gray-400" />
                            Actividad y Notas
                        </h2>

                        {/* Notes display */}
                        {contact.notes && (
                            <div className="mb-6">
                                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-3">
                                    Historial de Notas
                                </p>
                                <div className="space-y-2">
                                    {contact.notes.split('\n').filter((l) => l.trim()).map((line, idx) => {
                                        const match = line.match(/^\[(.+?)\]\s*(.+)$/);
                                        return (
                                            <div
                                                key={idx}
                                                className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-100"
                                            >
                                                {match ? (
                                                    <>
                                                        <p className="text-[10px] text-gray-400 mb-1">{match[1]}</p>
                                                        <p className="text-sm text-gray-700">{match[2]}</p>
                                                    </>
                                                ) : (
                                                    <p className="text-sm text-gray-700">{line}</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Timeline */}
                        <div>
                            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-3">
                                Linea de Tiempo
                            </p>
                            <div className="relative">
                                {/* Vertical line */}
                                <div className="absolute left-[11px] top-2 bottom-2 w-px bg-gray-200" />

                                <div className="space-y-4">
                                    {timeline.map((item, idx) => {
                                        const Icon = item.icon;
                                        return (
                                            <div key={idx} className="relative flex items-start gap-3 pl-0">
                                                <div className={`relative z-10 w-6 h-6 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center flex-shrink-0`}>
                                                    <Icon size={12} className={item.iconColor} />
                                                </div>
                                                <div className="flex-1 min-w-0 pb-1">
                                                    <p className="text-sm font-medium text-gray-800">{item.title}</p>
                                                    {item.description && (
                                                        <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                                                    )}
                                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                                        {formatShortDate(item.date)}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Info Row                                                           */
/* ------------------------------------------------------------------ */

function InfoRow({
    icon: Icon,
    label,
    value,
}: {
    icon: any;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-start gap-2.5">
            <Icon size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
                <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">{label}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 break-words">{value}</p>
            </div>
        </div>
    );
}
