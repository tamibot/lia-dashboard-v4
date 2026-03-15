import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import {
    Search, Filter, ChevronDown, ChevronUp, ExternalLink,
    User, Mail, Phone, MapPin, Calendar, Tag, Loader2, AlertTriangle,
    RefreshCw, X, Users,
} from 'lucide-react';

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

const GHL_BASE = 'https://app.gohighlevel.com/v2/location/xnkv60LDkjOYchFtULc2/contacts';

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function Contacts() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');

    const stage = searchParams.get('stage') || '';
    const origin = searchParams.get('origin') || '';
    const search = searchParams.get('search') || '';

    /* ---- data fetching ---- */
    const fetchContacts = useCallback(async () => {
        setError(null);
        try {
            const params: Record<string, string> = { limit: '100' };
            if (stage) params.stage = stage;
            if (origin) params.origin = origin;
            if (search) params.search = search;

            const data = await api.get<Contact[]>('/contacts', params);
            setContacts(data);
        } catch (err: any) {
            setError(err.message || 'Error al cargar contactos');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [stage, origin, search]);

    useEffect(() => { fetchContacts(); }, [fetchContacts]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchContacts();
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
                        {contacts.length} contacto{contacts.length !== 1 ? 's' : ''} encontrado{contacts.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                    Actualizar
                </button>
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
                                        />
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
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
}: {
    contact: Contact;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    const stageCls = STAGE_COLORS[contact.stage] || 'bg-gray-100 text-gray-600';
    const originCls = ORIGIN_COLORS[contact.origin] || 'bg-gray-100 text-gray-600';

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
                <td className="px-4 py-3 font-medium text-gray-900">{contact.name}</td>
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
                                {/* Name */}
                                <DetailItem icon={User} label="Nombre" value={contact.name} />

                                {/* Email */}
                                <DetailItem icon={Mail} label="Email" value={contact.email || '-'} />

                                {/* Phone */}
                                <DetailItem icon={Phone} label="Telefono" value={contact.phone || '-'} />

                                {/* Location */}
                                <DetailItem
                                    icon={MapPin}
                                    label="Ubicacion"
                                    value={
                                        [contact.city, contact.country].filter(Boolean).join(', ') || '-'
                                    }
                                />

                                {/* Date */}
                                <DetailItem
                                    icon={Calendar}
                                    label="Fecha de registro"
                                    value={new Date(contact.createdAt).toLocaleDateString('es', {
                                        day: '2-digit', month: 'long', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit',
                                    })}
                                />

                                {/* Tags */}
                                {contact.tags && contact.tags.length > 0 && (
                                    <div className="flex items-start gap-2">
                                        <Tag size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide">Tags</p>
                                            <div className="flex flex-wrap gap-1 mt-0.5">
                                                {contact.tags.map((tag, i) => (
                                                    <span
                                                        key={i}
                                                        className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-gray-200 text-gray-600"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Notes */}
                            {contact.notes && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                    <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wide mb-1">Notas</p>
                                    <p className="text-sm text-gray-700 whitespace-pre-line">{contact.notes}</p>
                                </div>
                            )}

                            {/* GHL Link */}
                            {contact.ghlContactId && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                    <a
                                        href={`${GHL_BASE}/${contact.ghlContactId}`}
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
