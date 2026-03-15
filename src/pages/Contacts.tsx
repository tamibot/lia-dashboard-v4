import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import {
    Search, Filter, ChevronDown, ChevronUp, ExternalLink,
    User, Mail, Phone, MapPin, Calendar, Tag, Loader2, AlertTriangle,
    RefreshCw, X, Users, Download,
} from 'lucide-react';
import { API_CONFIG } from '../config/api.config';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Contact {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    city: string | null;
    country: string | null;
    stage: string;
    origin: string;
    tags: string[];
    notes: string | null;
    ghlContactId: string | null;
    createdAt: string;
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

const ORIGIN_OPTIONS = [
    'meta_ads', 'google_ads', 'tiktok_ads', 'referido', 'organico',
    'webinar', 'evento', 'linkedin', 'whatsapp', 'agente_ia', 'otro',
] as const;

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
/*  Component                                                          */
/* ------------------------------------------------------------------ */

interface PaginatedResponse {
    contacts: Contact[];
    nextCursor: string | null;
    total: number;
}

export default function Contacts() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
    const [ghlLocationId, setGhlLocationId] = useState<string | null>(null);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState<number>(0);

    // Fetch GHL location ID for dynamic links
    useEffect(() => {
        api.get<{ locationId?: string }>('/integrations/ghl/status')
            .then(data => { if (data.locationId) setGhlLocationId(data.locationId); })
            .catch(() => {});
    }, []);

    const stage = searchParams.get('stage') || '';
    const origin = searchParams.get('origin') || '';
    const search = searchParams.get('search') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    /* ---- build filter params ---- */
    const buildFilterParams = useCallback((): Record<string, string> => {
        const params: Record<string, string> = {};
        if (stage) params.stage = stage;
        if (origin) params.origin = origin;
        if (search) params.search = search;
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;
        return params;
    }, [stage, origin, search, dateFrom, dateTo]);

    /* ---- data fetching ---- */
    const fetchContacts = useCallback(async () => {
        setError(null);
        try {
            const params: Record<string, string> = { limit: '50', ...buildFilterParams() };
            const data = await api.get<PaginatedResponse>('/contacts', params);
            setContacts(data.contacts);
            setNextCursor(data.nextCursor);
            setTotalCount(data.total);
        } catch (err: any) {
            setError(err.message || 'Error al cargar contactos');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [buildFilterParams]);

    useEffect(() => { fetchContacts(); }, [fetchContacts]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchContacts();
    };

    /* ---- load more (next page) ---- */
    const loadMore = async () => {
        if (!nextCursor || loadingMore) return;
        setLoadingMore(true);
        try {
            const params: Record<string, string> = {
                limit: '50',
                cursor: nextCursor,
                ...buildFilterParams(),
            };
            const data = await api.get<PaginatedResponse>('/contacts', params);
            setContacts(prev => [...prev, ...data.contacts]);
            setNextCursor(data.nextCursor);
            setTotalCount(data.total);
        } catch (err: any) {
            setError(err.message || 'Error al cargar mas contactos');
        } finally {
            setLoadingMore(false);
        }
    };

    /* ---- CSV export ---- */
    const handleExport = async () => {
        setExporting(true);
        try {
            const params = new URLSearchParams(buildFilterParams());
            const token = localStorage.getItem(API_CONFIG.TOKEN_KEY);
            const url = `${API_CONFIG.BASE_URL}/contacts/export${params.toString() ? '?' + params.toString() : ''}`;
            const response = await fetch(url, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            if (!response.ok) throw new Error('Error al exportar contactos');
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = 'contactos.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);
        } catch (err: any) {
            setError(err.message || 'Error al exportar contactos');
        } finally {
            setExporting(false);
        }
    };

    /* ---- filter helpers ---- */
    const updateParam = (key: string, value: string) => {
        const next = new URLSearchParams(searchParams);
        if (value) {
            next.set(key, value);
        } else {
            next.delete(key);
        }
        setSearchParams(next, { replace: true });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateParam('search', searchInput.trim());
    };

    const clearFilter = (key: string) => {
        if (key === 'search') setSearchInput('');
        updateParam(key, '');
    };

    const clearAllFilters = () => {
        setSearchInput('');
        setSearchParams({}, { replace: true });
    };

    const activeFilters = [
        stage && { key: 'stage', label: `Etapa: ${STAGE_LABELS[stage] || stage}` },
        origin && { key: 'origin', label: `Origen: ${ORIGIN_LABELS[origin] || origin}` },
        search && { key: 'search', label: `Busqueda: "${search}"` },
        dateFrom && { key: 'dateFrom', label: `Desde: ${dateFrom}` },
        dateTo && { key: 'dateTo', label: `Hasta: ${dateTo}` },
    ].filter(Boolean) as { key: string; label: string }[];

    /* ---- render ---- */
    if (loading) {
        return (
            <div className="page-content">
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-blue-600" />
                    <span className="ml-3 text-gray-500">Cargando contactos...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Contactos</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        {contacts.length} de {totalCount} contacto{totalCount !== 1 ? 's' : ''}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleExport}
                        disabled={exporting || totalCount === 0}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        {exporting
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Download size={14} />}
                        Exportar CSV
                    </button>
                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                        Actualizar
                    </button>
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-4 py-3 rounded-lg mb-6">
                    <AlertTriangle size={16} />
                    {error}
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o telefono..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </form>

                    {/* Stage filter */}
                    <div className="relative">
                        <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <select
                            value={stage}
                            onChange={(e) => updateParam('stage', e.target.value)}
                            className="appearance-none pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                        >
                            <option value="">Todas las etapas</option>
                            {STAGE_OPTIONS.map((s) => (
                                <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Origin filter */}
                    <div className="relative">
                        <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <select
                            value={origin}
                            onChange={(e) => updateParam('origin', e.target.value)}
                            className="appearance-none pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                        >
                            <option value="">Todos los origenes</option>
                            {ORIGIN_OPTIONS.map((o) => (
                                <option key={o} value={o}>{ORIGIN_LABELS[o]}</option>
                            ))}
                        </select>
                        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Date range filters */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-400 font-medium whitespace-nowrap">Rango de fecha:</span>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => updateParam('dateFrom', e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-400">a</span>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => updateParam('dateTo', e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Active filter pills */}
                {activeFilters.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                        <span className="text-xs text-gray-400 font-medium">Filtros activos:</span>
                        {activeFilters.map((f) => (
                            <button
                                key={f.key}
                                onClick={() => clearFilter(f.key)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
                            >
                                {f.label}
                                <X size={12} />
                            </button>
                        ))}
                        {activeFilters.length > 1 && (
                            <button
                                onClick={clearAllFilters}
                                className="text-xs text-gray-500 hover:text-gray-700 underline ml-1"
                            >
                                Limpiar todos
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Table */}
            {contacts.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <Users size={40} className="mx-auto mb-3 text-gray-300" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-1">No se encontraron contactos</h3>
                    <p className="text-sm text-gray-400">
                        {activeFilters.length > 0
                            ? 'Intenta ajustar los filtros de busqueda.'
                            : 'Aun no hay contactos registrados.'}
                    </p>
                    {activeFilters.length > 0 && (
                        <button
                            onClick={clearAllFilters}
                            className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium underline"
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3 text-left w-8"></th>
                                    <th className="px-4 py-3 text-left">Nombre</th>
                                    <th className="px-4 py-3 text-left">Email</th>
                                    <th className="px-4 py-3 text-left">Telefono</th>
                                    <th className="px-4 py-3 text-left">Etapa</th>
                                    <th className="px-4 py-3 text-left">Origen</th>
                                    <th className="px-4 py-3 text-left">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {contacts.map((contact) => {
                                    const isExpanded = expandedId === contact.id;
                                    return (
                                        <ContactRow
                                            key={contact.id}
                                            contact={contact}
                                            isExpanded={isExpanded}
                                            onToggle={() => setExpandedId(isExpanded ? null : contact.id)}
                                            ghlLocationId={ghlLocationId}
                                            onTagsUpdate={(id, tags) => {
                                                setContacts(prev => prev.map(c => c.id === id ? { ...c, tags } : c));
                                            }}
                                            onNavigate={(id) => navigate(`/contacts/${id}`)}
                                        />
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Load more button */}
                    {nextCursor && (
                        <div className="border-t border-gray-100 px-4 py-3 text-center">
                            <button
                                onClick={loadMore}
                                disabled={loadingMore}
                                className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                            >
                                {loadingMore
                                    ? <><Loader2 size={14} className="animate-spin" /> Cargando...</>
                                    : <>Cargar mas ({totalCount - contacts.length} restantes)</>}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Contact Row                                                        */
/* ------------------------------------------------------------------ */

function ContactRow({
    contact,
    isExpanded,
    onToggle,
    ghlLocationId,
    onTagsUpdate,
    onNavigate,
}: {
    contact: Contact;
    isExpanded: boolean;
    onToggle: () => void;
    ghlLocationId: string | null;
    onTagsUpdate: (id: string, tags: string[]) => void;
    onNavigate: (id: string) => void;
}) {
    const stageCls = STAGE_COLORS[contact.stage] || 'bg-gray-100 text-gray-600';
    const originCls = ORIGIN_COLORS[contact.origin] || 'bg-gray-100 text-gray-600';
    const [newTag, setNewTag] = useState('');

    const addTag = async () => {
        const tag = newTag.trim().toLowerCase().replace(/\s+/g, '_');
        if (!tag || contact.tags.includes(tag)) return;
        const updated = [...contact.tags, tag];
        try {
            await api.put(`/contacts/${contact.id}`, { tags: updated });
            onTagsUpdate(contact.id, updated);
            setNewTag('');
        } catch { /* ignore */ }
    };

    const removeTag = async (tag: string) => {
        const updated = contact.tags.filter(t => t !== tag);
        try {
            await api.put(`/contacts/${contact.id}`, { tags: updated });
            onTagsUpdate(contact.id, updated);
        } catch { /* ignore */ }
    };

    return (
        <>
            <tr
                onClick={onToggle}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
            >
                <td className="px-4 py-3 text-gray-400">
                    {isExpanded
                        ? <ChevronUp size={16} />
                        : <ChevronDown size={16} />}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">
                    <button
                        onClick={(e) => { e.stopPropagation(); onNavigate(contact.id); }}
                        className="hover:text-blue-600 hover:underline transition-colors text-left"
                    >
                        {contact.name}
                    </button>
                </td>
                <td className="px-4 py-3 text-gray-600">{contact.email || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{contact.phone || '-'}</td>
                <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${stageCls}`}>
                        {STAGE_LABELS[contact.stage] || contact.stage}
                    </span>
                </td>
                <td className="px-4 py-3">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${originCls}`}>
                        {ORIGIN_LABELS[contact.origin] || contact.origin}
                    </span>
                </td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(contact.createdAt).toLocaleDateString('es', {
                        day: '2-digit', month: 'short', year: 'numeric',
                    })}
                </td>
            </tr>

            {isExpanded && (
                <tr>
                    <td colSpan={7} className="px-4 py-0">
                        <div className="bg-gray-50 rounded-lg p-4 my-2 border border-gray-100">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                                <DetailItem icon={User} label="Nombre" value={contact.name} />
                                <DetailItem icon={Mail} label="Email" value={contact.email || '-'} />
                                <DetailItem icon={Phone} label="Telefono" value={contact.phone || '-'} />
                                <DetailItem
                                    icon={MapPin}
                                    label="Ubicacion"
                                    value={[contact.city, contact.country].filter(Boolean).join(', ') || '-'}
                                />
                                <DetailItem
                                    icon={Calendar}
                                    label="Fecha de registro"
                                    value={new Date(contact.createdAt).toLocaleDateString('es', {
                                        day: '2-digit', month: 'long', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit',
                                    })}
                                />
                            </div>

                            {/* Tags with inline editing */}
                            <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Tag size={14} className="text-gray-400 flex-shrink-0" />
                                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Etiquetas</p>
                                </div>
                                <div className="flex flex-wrap gap-1.5 items-center">
                                    {contact.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 group"
                                        >
                                            {tag}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
                                                className="text-blue-400 hover:text-red-500 transition-colors"
                                            >
                                                <X size={10} />
                                            </button>
                                        </span>
                                    ))}
                                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="text"
                                            placeholder="Nueva etiqueta..."
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && addTag()}
                                            className="text-[11px] px-2 py-0.5 border border-gray-200 rounded-full w-28 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                        {newTag.trim() && (
                                            <button onClick={addTag} className="text-[10px] text-blue-600 font-medium hover:underline">+</button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            {contact.notes && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-1">Notas</p>
                                    <p className="text-sm text-gray-700 whitespace-pre-line">{contact.notes}</p>
                                </div>
                            )}

                            {/* GHL Link */}
                            {contact.ghlContactId && ghlLocationId && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                    <a
                                        href={`https://app.gohighlevel.com/v2/location/${ghlLocationId}/contacts/${contact.ghlContactId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                                    >
                                        <ExternalLink size={12} />
                                        Ver en GoHighLevel
                                    </a>
                                </div>
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
}

/* ------------------------------------------------------------------ */
/*  Detail Item                                                        */
/* ------------------------------------------------------------------ */

function DetailItem({
    icon: Icon,
    label,
    value,
}: {
    icon: any;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-start gap-2">
            <Icon size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">{label}</p>
                <p className="text-gray-700">{value}</p>
            </div>
        </div>
    );
}
