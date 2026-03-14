import { useState, useEffect, useCallback } from 'react';
import { kpiService, type KpiOverview, type KpiFunnel } from '../lib/services/kpi.service';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
    PieChart, Pie, AreaChart, Area, CartesianGrid, Legend,
} from 'recharts';
import {
    Users, TrendingUp, Trophy, Target, AlertTriangle, Loader2,
    RefreshCw, DollarSign,
} from 'lucide-react';

const STAGE_COLORS = [
    '#3B82F6', // blue - Nuevo Lead
    '#6366F1', // indigo - Primer Contacto
    '#8B5CF6', // violet - Calificado
    '#A855F7', // purple - Presentacion
    '#EC4899', // pink - Propuesta
    '#F59E0B', // amber - Negociacion
    '#10B981', // emerald - Inscrito
    '#EF4444', // red - Perdido
];

const ORIGIN_COLORS: Record<string, string> = {
    organico: '#10B981',
    meta_ads: '#3B82F6',
    google_ads: '#F59E0B',
    tiktok_ads: '#EF4444',
    referido: '#8B5CF6',
    webinar: '#EC4899',
    evento: '#6366F1',
    linkedin: '#0EA5E9',
    whatsapp: '#22C55E',
    email: '#F97316',
    otro: '#94A3B8',
};

const ORIGIN_LABELS: Record<string, string> = {
    organico: 'Orgánico',
    meta_ads: 'Meta Ads',
    google_ads: 'Google Ads',
    tiktok_ads: 'TikTok Ads',
    referido: 'Referido',
    webinar: 'Webinar',
    evento: 'Evento',
    linkedin: 'LinkedIn',
    whatsapp: 'WhatsApp',
    email: 'Email',
    otro: 'Otro',
};

const STAGE_LABELS: Record<string, string> = {
    nuevo: 'Nuevo',
    contactado: 'Contactado',
    interesado: 'Interesado',
    propuesta: 'Propuesta',
    negociacion: 'Negociación',
    ganado: 'Ganado',
    perdido: 'Perdido',
    inactivo: 'Inactivo',
};

function formatCurrency(value: number) {
    return new Intl.NumberFormat('es', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function formatWeek(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es', { day: '2-digit', month: 'short' });
}

export default function KpiReports() {
    const [overview, setOverview] = useState<KpiOverview | null>(null);
    const [funnel, setFunnel] = useState<KpiFunnel | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        setError(null);
        try {
            const [ov, fn] = await Promise.all([
                kpiService.getOverview().catch(() => null),
                kpiService.getFunnel().catch(() => null),
            ]);
            setOverview(ov);
            setFunnel(fn);
        } catch (err: any) {
            setError(err.message || 'Error al cargar datos');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    if (loading) {
        return (
            <div className="page-content">
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={32} className="animate-spin text-blue-600" />
                    <span className="ml-3 text-gray-500">Cargando KPIs...</span>
                </div>
            </div>
        );
    }

    const maxFunnelCount = funnel?.stages ? Math.max(...funnel.stages.map(s => s.count), 1) : 1;

    return (
        <div className="page-content">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">KPIs & Reportes</h1>
                    <p className="text-sm text-gray-500 mt-1">Visualización de métricas de tu embudo comercial y contactos.</p>
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

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <SummaryCard
                    icon={Users}
                    label="Total Contactos"
                    value={overview?.totalContacts ?? 0}
                    color="blue"
                />
                <SummaryCard
                    icon={Target}
                    label="Oportunidades"
                    value={funnel?.totalOpportunities ?? 0}
                    subtitle={funnel?.openCount !== undefined ? `${funnel.openCount} activas` : undefined}
                    color="purple"
                />
                <SummaryCard
                    icon={Trophy}
                    label="Inscritos"
                    value={funnel?.wonCount ?? overview?.won ?? 0}
                    color="emerald"
                />
                <SummaryCard
                    icon={TrendingUp}
                    label="Tasa Conversión"
                    value={`${overview?.conversionRate ?? 0}%`}
                    subtitle={funnel?.totalValue ? formatCurrency(funnel.totalValue) : undefined}
                    color="amber"
                />
            </div>

            {/* Funnel + Origin */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                {/* Funnel Visualization */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="font-bold text-gray-900">Embudo de Ventas</h3>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {funnel?.pipeline?.name || 'Pipeline GHL'}
                            </p>
                        </div>
                        {funnel?.totalValue ? (
                            <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg">
                                <DollarSign size={14} />
                                {formatCurrency(funnel.totalValue)}
                            </div>
                        ) : null}
                    </div>

                    {funnel?.connected && funnel.stages.length > 0 ? (
                        <div className="space-y-2">
                            {funnel.stages.map((stage, i) => (
                                <div key={stage.id} className="flex items-center gap-3">
                                    <div className="w-36 text-right">
                                        <span className="text-xs font-medium text-gray-600 truncate block">
                                            {stage.name}
                                        </span>
                                    </div>
                                    <div className="flex-1 h-8 bg-gray-100 rounded-lg overflow-hidden relative">
                                        <div
                                            className="h-full rounded-lg transition-all duration-500 flex items-center px-2"
                                            style={{
                                                width: `${Math.max((stage.count / maxFunnelCount) * 100, 4)}%`,
                                                backgroundColor: STAGE_COLORS[i % STAGE_COLORS.length],
                                            }}
                                        >
                                            <span className="text-xs font-bold text-white whitespace-nowrap">
                                                {stage.count}
                                            </span>
                                        </div>
                                    </div>
                                    {stage.value > 0 && (
                                        <span className="text-xs text-gray-400 w-20 text-right">
                                            {formatCurrency(stage.value)}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : funnel?.connected === false ? (
                        <div className="text-center py-8 text-gray-400">
                            <Target size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Conecta GoHighLevel para ver el embudo</p>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400">
                            <Target size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No hay datos de pipeline disponibles</p>
                        </div>
                    )}
                </div>

                {/* Contacts by Origin */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-bold text-gray-900 mb-1">Fuentes de Contactos</h3>
                    <p className="text-xs text-gray-400 mb-4">Distribución por origen</p>

                    {overview && overview.byOrigin.length > 0 ? (
                        <>
                            <div className="h-48 mb-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={overview.byOrigin.map(o => ({
                                                name: ORIGIN_LABELS[o.origin] || o.origin,
                                                value: o.count,
                                                fill: ORIGIN_COLORS[o.origin] || '#94A3B8',
                                            }))}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={40}
                                            outerRadius={70}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {overview.byOrigin.map((o, i) => (
                                                <Cell key={i} fill={ORIGIN_COLORS[o.origin] || '#94A3B8'} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number) => [value, 'Contactos']}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-1.5">
                                {overview.byOrigin
                                    .sort((a, b) => b.count - a.count)
                                    .map(o => (
                                        <div key={o.origin} className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-2.5 h-2.5 rounded-full"
                                                    style={{ backgroundColor: ORIGIN_COLORS[o.origin] || '#94A3B8' }}
                                                />
                                                <span className="text-gray-600">
                                                    {ORIGIN_LABELS[o.origin] || o.origin}
                                                </span>
                                            </div>
                                            <span className="font-semibold text-gray-900">{o.count}</span>
                                        </div>
                                    ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8 text-gray-400">
                            <Users size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Sincroniza contactos para ver fuentes</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Contacts Over Time + Stage Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {/* Contacts Over Time */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-bold text-gray-900 mb-1">Contactos por Semana</h3>
                    <p className="text-xs text-gray-400 mb-4">Últimas 12 semanas</p>

                    {overview && overview.contactsOverTime.length > 0 ? (
                        <div className="h-56">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={overview.contactsOverTime}>
                                    <defs>
                                        <linearGradient id="colorContacts" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="week"
                                        tickFormatter={formatWeek}
                                        tick={{ fontSize: 11 }}
                                        stroke="#9CA3AF"
                                    />
                                    <YAxis
                                        tick={{ fontSize: 11 }}
                                        stroke="#9CA3AF"
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        labelFormatter={(label: string) => `Semana del ${formatWeek(label)}`}
                                        formatter={(value: number) => [value, 'Contactos']}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#3B82F6"
                                        strokeWidth={2}
                                        fill="url(#colorContacts)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400">
                            <TrendingUp size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Sin datos de contactos recientes</p>
                        </div>
                    )}
                </div>

                {/* Stage Distribution (local DB) */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-bold text-gray-900 mb-1">Contactos por Etapa</h3>
                    <p className="text-xs text-gray-400 mb-4">Distribución en BD local</p>

                    {overview && overview.byStage.length > 0 ? (
                        <div className="h-56">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={overview.byStage.map(s => ({
                                        name: STAGE_LABELS[s.stage] || s.stage,
                                        count: s.count,
                                    }))}
                                    layout="vertical"
                                    margin={{ left: 10 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9CA3AF" allowDecimals={false} />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        tick={{ fontSize: 11 }}
                                        stroke="#9CA3AF"
                                        width={80}
                                    />
                                    <Tooltip formatter={(value: number) => [value, 'Contactos']} />
                                    <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={24}>
                                        {overview.byStage.map((_, i) => (
                                            <Cell key={i} fill={STAGE_COLORS[i % STAGE_COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400">
                            <Users size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Sincroniza contactos para ver distribución</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Contacts Table */}
            {overview && overview.recentContacts.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900 text-sm">Contactos Recientes</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                <tr>
                                    <th className="px-4 py-2 text-left">Nombre</th>
                                    <th className="px-4 py-2 text-left">Email</th>
                                    <th className="px-4 py-2 text-left">Etapa</th>
                                    <th className="px-4 py-2 text-left">Origen</th>
                                    <th className="px-4 py-2 text-left">Fecha</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {overview.recentContacts.map(c => (
                                    <tr key={c.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-2 font-medium text-gray-900">{c.name}</td>
                                        <td className="px-4 py-2 text-gray-600">{c.email || '-'}</td>
                                        <td className="px-4 py-2">
                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                                                {STAGE_LABELS[c.stage] || c.stage}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                                {ORIGIN_LABELS[c.origin] || c.origin}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-gray-500 text-xs">
                                            {new Date(c.createdAt).toLocaleDateString('es', {
                                                day: '2-digit', month: 'short', year: 'numeric',
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* GHL Status Banner */}
            {funnel && !funnel.connected && (
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-5">
                    <h3 className="font-semibold text-blue-900 mb-1">Conecta GoHighLevel</h3>
                    <p className="text-sm text-blue-700">
                        Para ver el embudo de ventas completo con datos en tiempo real, conecta tu cuenta de GHL en la sección de
                        <a href="/integrations" className="font-semibold underline ml-1">Integraciones</a>.
                    </p>
                </div>
            )}
        </div>
    );
}

// Summary Card Component
function SummaryCard({ icon: Icon, label, value, subtitle, color }: {
    icon: any;
    label: string;
    value: string | number;
    subtitle?: string;
    color: 'blue' | 'purple' | 'emerald' | 'amber';
}) {
    const colors = {
        blue: { bg: 'bg-blue-50', border: 'border-blue-100', iconBg: 'bg-blue-100', icon: 'text-blue-600', label: 'text-blue-600', value: 'text-blue-900' },
        purple: { bg: 'bg-purple-50', border: 'border-purple-100', iconBg: 'bg-purple-100', icon: 'text-purple-600', label: 'text-purple-600', value: 'text-purple-900' },
        emerald: { bg: 'bg-emerald-50', border: 'border-emerald-100', iconBg: 'bg-emerald-100', icon: 'text-emerald-600', label: 'text-emerald-600', value: 'text-emerald-900' },
        amber: { bg: 'bg-amber-50', border: 'border-amber-100', iconBg: 'bg-amber-100', icon: 'text-amber-600', label: 'text-amber-600', value: 'text-amber-900' },
    };
    const c = colors[color];

    return (
        <div className={`card ${c.bg} ${c.border} border`}>
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${c.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <Icon className={c.icon} size={20} />
                </div>
                <div className="flex-1">
                    <p className={`text-[11px] font-bold ${c.label} uppercase tracking-wide`}>{label}</p>
                    <h4 className={`text-2xl font-black ${c.value} leading-none mt-0.5`}>{value}</h4>
                    {subtitle && (
                        <p className="text-[10px] text-gray-500 mt-0.5">{subtitle}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
