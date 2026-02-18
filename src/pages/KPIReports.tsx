import { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { ArrowUp, ArrowDown, Users, DollarSign, MousePointer, Activity } from 'lucide-react';

const mockDailyData = [
    { day: 'Lun', leads: 45, sales: 1200, users: 150 },
    { day: 'Mar', leads: 52, sales: 1500, users: 180 },
    { day: 'Mié', leads: 38, sales: 900, users: 140 },
    { day: 'Jue', leads: 65, sales: 2100, users: 220 },
    { day: 'Vie', leads: 72, sales: 2400, users: 250 },
    { day: 'Sáb', leads: 40, sales: 1100, users: 160 },
    { day: 'Dom', leads: 35, sales: 800, users: 130 },
];

const StatCard = ({ title, value, trend, icon: Icon, color }: any) => (
    <div className="stat-card fade-in">
        <div className="stat-icon" style={{ background: `var(--${color}-light)`, color: `var(--${color})` }}>
            <Icon size={24} />
        </div>
        <div className="stat-content">
            <h3>{title}</h3>
            <div className="value">{value}</div>
            <div className={`trend ${trend > 0 ? 'up' : 'down'}`}>
                {trend > 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                {Math.abs(trend)}% vs semana anterior
            </div>
        </div>
    </div>
);

export default function KPIReportsPage() {
    const [range, setRange] = useState('7d');

    return (
        <div className="page-content">
            <div className="flex-between mb-6">
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 800 }}>📊 Reportes de Rendimiento</h2>
                    <p className="text-muted">Visión general de tu ecosistema educativo. Para detalle granular, revisa <a href="#" style={{ textDecoration: 'underline' }}>GoHighLevel</a>.</p>
                </div>
                <select className="form-select" style={{ width: 'auto' }} value={range} onChange={e => setRange(e.target.value)}>
                    <option value="7d">Últimos 7 días</option>
                    <option value="30d">Últimos 30 días</option>
                    <option value="90d">Último trimestre</option>
                </select>
            </div>

            {/* Hero Stats */}
            <div className="grid-4 mb-6">
                <StatCard title="Ingresos Totales" value="$12,450" trend={12.5} icon={DollarSign} color="success" />
                <StatCard title="Nuevos Leads" value="847" trend={8.2} icon={Users} color="brand" />
                <StatCard title="Visitas Página" value="3,240" trend={-2.4} icon={MousePointer} color="warning" />
                <StatCard title="Tasa Conversión" value="23.4%" trend={5.1} icon={Activity} color="info" />
            </div>

            {/* Main Charts */}
            <div className="grid-2-1 mb-6" style={{ alignItems: 'stretch' }}>
                <div className="card fade-in delay-1" style={{ minHeight: '400px' }}>
                    <h3 className="form-section-title">📈 Ingresos vs Tráfico (Diario)</h3>
                    <div style={{ width: '100%', height: '320px' }}>
                        <ResponsiveContainer>
                            <AreaChart data={mockDailyData}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="day" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Area type="monotone" dataKey="sales" stroke="#2563EB" fillOpacity={1} fill="url(#colorSales)" name="Ingresos ($)" />
                                <Area type="monotone" dataKey="users" stroke="#10B981" fillOpacity={1} fill="url(#colorUsers)" name="Usuarios" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card fade-in delay-2">
                    <h3 className="form-section-title">🔢 Embudo de Conversión</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px 0' }}>
                        {[
                            { label: 'Visitas', value: 3240, color: '#2563EB' },
                            { label: 'Leads', value: 847, color: '#3B82F6' },
                            { label: 'Evaluación', value: 420, color: '#8B5CF6' },
                            { label: 'Inscritos', value: 198, color: '#10B981' },
                        ].map((step, i, arr) => {
                            const maxVal = arr[0].value;
                            const pct = ((step.value / maxVal) * 100).toFixed(1);
                            const dropOff = i > 0 ? ((1 - step.value / arr[i - 1].value) * 100).toFixed(0) : null;
                            return (
                                <div key={i}>
                                    {dropOff && (
                                        <div style={{ textAlign: 'right', fontSize: '10px', color: 'var(--error)', marginBottom: '2px', paddingRight: '4px' }}>
                                            ↓ {dropOff}% drop
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <span style={{ width: '70px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right', flexShrink: 0 }}>{step.label}</span>
                                        <div style={{ flex: 1, background: '#F1F5F9', borderRadius: '6px', height: '32px', position: 'relative', overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${pct}%`,
                                                height: '100%',
                                                background: `linear-gradient(90deg, ${step.color}, ${step.color}dd)`,
                                                borderRadius: '6px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'flex-end',
                                                paddingRight: '8px',
                                                minWidth: '60px',
                                                transition: 'width 0.6s ease'
                                            }}>
                                                <span style={{ color: 'white', fontSize: '12px', fontWeight: 700 }}>{step.value.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <span style={{ width: '45px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500, flexShrink: 0 }}>{pct}%</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: 'var(--success-light)', borderRadius: 'var(--radius)' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--success)' }}>✅ Conversión Global</span>
                        <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--success)' }}>6.1%</span>
                    </div>
                </div>
            </div>

            {/* Bottom Grid */}
            <div className="grid-2 mb-6">
                <div className="card">
                    <h3 className="form-section-title">🏆 Top Cursos (Revenue)</h3>
                    <table className="data-table">
                        <thead>
                            <tr><th>Curso</th><th>Inscritos</th><th>Revenue</th></tr>
                        </thead>
                        <tbody>
                            {[
                                { name: 'IA para Minería', students: 45, rev: '$4,500' },
                                { name: 'Design Thinking', students: 38, rev: '$3,800' },
                                { name: 'Power BI Avanzado', students: 32, rev: '$3,200' },
                                { name: 'Gestión de Proyectos', students: 28, rev: '$2,800' },
                            ].map((c, i) => (
                                <tr key={i}>
                                    <td>{c.name}</td>
                                    <td>{c.students}</td>
                                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>{c.rev}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="card">
                    <h3 className="form-section-title">📢 Rendimiento por Canal</h3>
                    <div style={{ width: '100%', height: '220px' }}>
                        <ResponsiveContainer>
                            <BarChart data={[
                                { name: 'Meta Ads', value: 450 },
                                { name: 'Google Ads', value: 280 },
                                { name: 'Orgánico', value: 310 },
                                { name: 'Email', value: 190 },
                            ]}>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="value" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

        </div>
    );
}
