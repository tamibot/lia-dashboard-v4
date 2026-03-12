import { useState, useEffect } from 'react';
import { profileService } from '../lib/services/profile.service';
import { analyzeBrand } from '../lib/gemini';
import type { OrgProfile, BrandingConfig } from '../lib/types';
import { Save, Building2, GraduationCap, Laptop, Sparkles, Loader, Palette, Type, Mic, Instagram, Facebook, Linkedin, Video, Globe, MapPin, Clock, Plus, Trash2, RefreshCw, AlertTriangle, Image, History, Award, CreditCard, School, Phone, MessageCircle, Mail } from 'lucide-react';

const GOOGLE_FONTS = [
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
    'Poppins', 'Oswald', 'Raleway', 'Playfair Display', 'Merriweather'
];

const emptyProfile: OrgProfile = {
    type: 'universidad',
    name: '',
    description: '',
    tagline: '',
    targetAudience: '',
    website: '',
    onboardingComplete: false,
    branding: {
        colors: { primary: '#2563EB', secondary: '#1E40AF', accent: '#F59E0B', neutral: '#F3F4F6' },
        typography: { headings: 'Inter', body: 'Inter' },
        voice: { tone: 'formal', style: 'Profesional y confiable', keywords: [] },
        visualIdentity: { mood: 'Moderno y limpio', shapes: 'rounded' }
    },
    socialMedia: {},
    locations: [],
    operatingHours: [],
    courseCategories: [],
    history: '',
    certificates: [],
    paymentMethods: [],
    modalities: []
};

export default function ProfilePage() {
    const [data, setData] = useState<OrgProfile>(emptyProfile);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [brandAnalyzing, setBrandAnalyzing] = useState(false);
    const [brandText, setBrandText] = useState('');
    // @ts-ignore
    const [tab, setTab] = useState<'general' | 'branding'>('general');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                setError(false);
                const p = await profileService.get();
                if (p) {
                    // Migration safety
                    if (!p.branding?.colors) {
                        p.branding = {
                            ...emptyProfile.branding,
                            ...p.branding,
                            colors: {
                                primary: (p.branding as any)?.primaryColor || '#2563EB',
                                secondary: (p.branding as any)?.secondaryColor || '#1E40AF',
                                accent: (p.branding as any)?.accentColor || '#F59E0B',
                                neutral: '#F3F4F6'
                            }
                        };
                    }
                    setData(p);
                }
            } catch (err) {
                console.error("Failed to fetch profile", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    function handleChange(field: keyof OrgProfile, value: any) {
        if (field === 'type' && value !== data.type) {
            if (!confirm('Cambiar el tipo de organización podría afectar la coherencia de los datos. ¿Continuar?')) return;
        }
        setData(prev => ({ ...prev, [field]: value }));
    }

    function updateBranding(section: keyof BrandingConfig, field: string, value: any) {
        setData(prev => ({
            ...prev,
            branding: {
                ...prev.branding,
                [section]: {
                    ...(prev.branding[section] as any),
                    [field]: value
                }
            }
        }));
    }

    async function handleSave() {
        try {
            setBrandAnalyzing(true);
            // Strip read-only fields that Prisma doesn't like in update
            const { id, orgId, slug, domain, apiKey, plan, settings, createdAt, updatedAt, ...cleanData } = data as any;
            await profileService.update(cleanData);
            alert('Perfil guardado correctamente ✅');
        } catch (err) {
            console.error(err);
            alert('Error al guardar el perfil ❌');
        } finally {
            setBrandAnalyzing(false);
        }
    }

    async function handleBrandExtraction() {
        if (!brandText.trim()) return alert('Por favor pega algún texto sobre tu marca.');
        setBrandAnalyzing(true);
        try {
            const jsonStr = await analyzeBrand(brandText);
            const extracted = JSON.parse(jsonStr.replace(/```json|```/g, '').trim());

            setData(prev => ({
                ...prev,
                branding: {
                    ...prev.branding,
                    colors: extracted.colors || prev.branding.colors,
                    typography: extracted.typography || prev.branding.typography,
                    voice: extracted.voice || prev.branding.voice,
                    visualIdentity: extracted.visualIdentity || prev.branding.visualIdentity
                }
            }));
            alert('¡Identidad extraída con éxito! Revisa los campos actualizados.');
        } catch (err) {
            console.error(err);
            alert('Error al extraer identidad. Intenta de nuevo.');
        } finally {
            setBrandAnalyzing(false);
        }
    }

    // Live Preview Component
    const BrandPreview = () => (
        <div className="card fade-in" style={{
            marginTop: '20px',
            background: 'white',
            borderRadius: data.branding.visualIdentity.shapes === 'rounded' ? '16px' : '4px',
            fontFamily: data.branding.typography.body,
            border: `1px solid ${data.branding.colors.neutral}`,
            overflow: 'hidden'
        }}>
            <div style={{ padding: '20px', background: data.branding.colors.primary, color: 'white' }}>
                <h3 style={{ fontFamily: data.branding.typography.headings, margin: 0, fontSize: '18px' }}>
                    {data.name || 'Tu Marca'}
                </h3>
                <div style={{ fontSize: '12px', opacity: 0.9, marginTop: '4px' }}>{data.tagline || 'Tu tagline aquí'}</div>
            </div>
            <div style={{ padding: '20px' }}>
                <h4 style={{ fontFamily: data.branding.typography.headings, color: data.branding.colors.secondary, marginTop: 0 }}>
                    Identidad Visual
                </h4>
                <p style={{ fontSize: '14px', lineHeight: 1.6, color: '#4B5563' }}>
                    Así se verán tus contenidos generados por IA.
                    Usamos tu tipografía <strong>{data.branding.typography.body}</strong> y tus colores de marca.
                </p>
                <button style={{
                    marginTop: '15px',
                    background: data.branding.colors.accent,
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: data.branding.visualIdentity.shapes === 'rounded' ? '99px' : '4px',
                    fontWeight: 600,
                    cursor: 'pointer'
                }}>
                    Botón de Acción
                </button>
            </div>
            <div style={{ padding: '10px 20px', background: data.branding.colors.neutral, fontSize: '11px', color: '#6B7280' }}>
                Mood: {data.branding.visualIdentity.mood}
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="flex flex-col items-center gap-4">
                    <Loader className="w-12 h-12 text-blue-600 animate-spin" />
                    <p className="text-gray-500 font-medium">Cargando perfil institucional...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] p-8">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-red-100 p-8 text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Error al cargar</h3>
                    <p className="text-gray-600 mb-8">Hubo un problema al obtener tu perfil institucional. Por favor, intenta de nuevo.</p>
                    <button onClick={() => window.location.reload()} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors">
                        <RefreshCw size={18} /> Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-content" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div className="page-header">
                <h2 style={{ fontSize: '24px', fontWeight: 800 }}>🏢 Studio de Marca</h2>
                <p>Define el ADN de tu institución para que la IA genere contenido 100% on-brand.</p>
            </div>

            {tab === 'general' && (
                <div className="flex flex-col gap-6">
                    {/* Basic Info */}
                    <div className="card fade-in">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Building2 size={20} className="text-primary" /> Información Básica
                        </h3>

                        <div className="form-group grid-3" style={{ gap: '10px', marginBottom: '20px' }}>
                            {[
                                { id: 'universidad', label: 'Universidad', icon: Building2 },
                                { id: 'instituto', label: 'Instituto', icon: GraduationCap },
                                { id: 'infoproductor', label: 'Infoproductor', icon: Laptop },
                            ].map(t => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => handleChange('type', t.id as any)}
                                    className={`btn ${data.type === t.id ? 'btn-primary shadow-lg scale-105' : 'btn-outline border-slate-200'}`}
                                    style={{
                                        justifyContent: 'center',
                                        flexDirection: 'column',
                                        padding: '15px',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        background: data.type === t.id ? 'var(--primary)' : 'white',
                                        color: data.type === t.id ? 'white' : 'var(--text-main)',
                                        border: data.type === t.id ? 'none' : '1px solid #E2E8F0'
                                    }}
                                >
                                    <t.icon size={20} style={{ marginBottom: '5px', color: data.type === t.id ? 'white' : 'inherit' }} />
                                    <span style={{ fontWeight: data.type === t.id ? 700 : 500 }}>{t.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="form-group">
                            <label>Nombre de la Institución</label>
                            <input className="form-input" value={data.name} onChange={e => handleChange('name', e.target.value)} placeholder="Ej: Universidad Tech Latam" />
                        </div>

                        <div className="form-group">
                            <label>Eslogan / Proposición de Valor</label>
                            <input className="form-input" value={data.tagline || ''} onChange={e => handleChange('tagline', e.target.value)} placeholder="Ej: Innovación para el futuro" />
                        </div>

                        <div className="form-group">
                            <label>Descripción Institucional</label>
                            <textarea className="form-textarea" rows={3} value={data.description} onChange={e => handleChange('description', e.target.value)} placeholder="¿Qué hacen y cuál es su misión?" />
                        </div>

                        <div className="grid-2" style={{ gap: '20px' }}>
                            <div className="form-group">
                                <label>Público Objetivo</label>
                                <input className="form-input" value={data.targetAudience} onChange={e => handleChange('targetAudience', e.target.value)} placeholder="Ej: Jóvenes de 18-25 años" />
                            </div>
                            <div className="form-group">
                                <label>Sitio Web Principal</label>
                                <input className="form-input" value={data.website} onChange={e => handleChange('website', e.target.value)} placeholder="https://www.ejemplo.com" />
                            </div>
                        </div>

                        <div className="grid-3" style={{ gap: '20px', marginTop: '10px' }}>
                            <div className="form-group">
                                <label className="flex items-center gap-2"><Mail size={14} /> Email de Contacto</label>
                                <input className="form-input" type="email" value={data.contactEmail || ''} onChange={e => handleChange('contactEmail', e.target.value)} placeholder="info@institucion.com" />
                            </div>
                            <div className="form-group">
                                <label className="flex items-center gap-2"><Phone size={14} /> Teléfono Principal</label>
                                <input className="form-input" value={data.contactPhone || ''} onChange={e => handleChange('contactPhone', e.target.value)} placeholder="+51 1 234 5678" />
                            </div>
                            <div className="form-group">
                                <label className="flex items-center gap-2"><MessageCircle size={14} /> WhatsApp</label>
                                <input className="form-input" value={data.whatsapp || ''} onChange={e => handleChange('whatsapp', e.target.value)} placeholder="+51 999 888 777" />
                            </div>
                        </div>
                    </div>

                    {/* History & Journey */}
                    <div className="card fade-in">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <History size={20} className="text-primary" /> Historia y Trayectoria
                        </h3>
                        <div className="form-group">
                            <label>Cuéntanos tu historia</label>
                            <p className="text-xs text-slate-500 mb-2">Este texto se usará en tu página de venta para generar confianza.</p>
                            <textarea
                                className="form-textarea"
                                rows={6}
                                value={data.history || ''}
                                onChange={e => handleChange('history', e.target.value)}
                                placeholder="Pega aquí la historia de tu institución, misión y visión detallada..."
                            />
                        </div>
                    </div>

                    {/* Certifications & Badges */}
                    <div className="card fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Award size={20} className="text-primary" /> Certificados y Sellos de Calidad
                            </h3>
                            <button
                                type="button"
                                onClick={() => handleChange('certificates', [...(data.certificates || []), ''])}
                                className="btn btn-outline btn-sm"
                            >
                                <Plus size={14} /> Añadir Sello
                            </button>
                        </div>
                        <div className="space-y-3">
                            {(data.certificates || []).map((cert, idx) => (
                                <div key={idx} className="flex gap-3">
                                    <input
                                        className="form-input flex-1"
                                        placeholder="Ej: Certificación ISO 9001, Licenciamiento SUNEDU..."
                                        value={cert}
                                        onChange={e => {
                                            const newCerts = [...(data.certificates || [])];
                                            newCerts[idx] = e.target.value;
                                            handleChange('certificates', newCerts);
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleChange('certificates', (data.certificates || []).filter((_, i) => i !== idx))}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            {(data.certificates || []).length === 0 && (
                                <p className="text-center py-4 text-slate-400 italic">No has añadido certificados todavía.</p>
                            )}
                        </div>
                    </div>

                    {/* Social Media */}
                    <div className="card fade-in">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Globe size={20} className="text-primary" /> Redes Sociales
                        </h3>
                        <div className="grid-2 gap-4">
                            {[
                                { id: 'instagram', icon: Instagram, label: 'Instagram' },
                                { id: 'facebook', icon: Facebook, label: 'Facebook' },
                                { id: 'linkedin', icon: Linkedin, label: 'LinkedIn' },
                                { id: 'tiktok', icon: Video, label: 'TikTok' },
                                { id: 'youtube', icon: Video, label: 'YouTube' },
                                { id: 'website', icon: Globe, label: 'Web Adicional' },
                            ].map(s => (
                                <div key={s.id} className="form-group">
                                    <label className="flex items-center gap-2">
                                        <s.icon size={14} /> {s.label}
                                    </label>
                                    <input
                                        className="form-input"
                                        value={(data.socialMedia as any)?.[s.id] || ''}
                                        onChange={e => handleChange('socialMedia', { ...data.socialMedia, [s.id]: e.target.value })}
                                        placeholder={`URL de ${s.label}`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Study Modalities */}
                    <div className="card fade-in">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <School size={20} className="text-primary" /> Modalidades de Estudio
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {['Online', 'Presencial', 'Híbrido', 'Semipresencial'].map(m => (
                                <label key={m} className={`flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer transition-all ${data.modalities?.includes(m) ? 'bg-primary/10 border-primary text-primary' : 'bg-white border-slate-200 text-slate-600 hover:border-primary/50'}`}>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={data.modalities?.includes(m)}
                                        onChange={e => {
                                            const current = data.modalities || [];
                                            const next = e.target.checked ? [...current, m] : current.filter(x => x !== m);
                                            handleChange('modalities', next);
                                        }}
                                    />
                                    <span className="text-sm font-medium">{m}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Locations */}
                    <div className="card fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <MapPin size={20} className="text-primary" /> Sedes y Locales
                            </h3>
                            <button
                                type="button"
                                onClick={() => handleChange('locations', [...(data.locations || []), { id: crypto.randomUUID(), name: '', address: '', phone: '', schedule: '' }])}
                                className="btn btn-outline btn-sm"
                            >
                                <Plus size={14} /> Añadir Sede
                            </button>
                        </div>
                        <div className="space-y-4">
                            {(data.locations || []).map((loc, idx) => (
                                <div key={loc.id} className="p-4 border border-slate-100 rounded-lg bg-slate-50/30">
                                    <div className="flex justify-between mb-3">
                                        <span className="text-sm font-semibold text-slate-600">Sede {idx + 1}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleChange('locations', (data.locations || []).filter(l => l.id !== loc.id))}
                                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <div className="grid grid-2 gap-4">
                                        <input
                                            className="form-input"
                                            placeholder="Nombre de la sede (Ej: Campus Central)"
                                            value={loc.name}
                                            onChange={e => {
                                                const newLocs = [...(data.locations || [])];
                                                newLocs[idx] = { ...newLocs[idx], name: e.target.value };
                                                handleChange('locations', newLocs);
                                            }}
                                        />
                                        <input
                                            className="form-input"
                                            placeholder="Dirección completa"
                                            value={loc.address}
                                            onChange={e => {
                                                const newLocs = [...(data.locations || [])];
                                                newLocs[idx] = { ...newLocs[idx], address: e.target.value };
                                                handleChange('locations', newLocs);
                                            }}
                                        />
                                        <input
                                            className="form-input"
                                            placeholder="Teléfono de la sede"
                                            value={loc.phone || ''}
                                            onChange={e => {
                                                const newLocs = [...(data.locations || [])];
                                                newLocs[idx] = { ...newLocs[idx], phone: e.target.value };
                                                handleChange('locations', newLocs);
                                            }}
                                        />
                                        <input
                                            className="form-input"
                                            placeholder="Horario (Ej: L-V 9am-6pm)"
                                            value={loc.schedule || ''}
                                            onChange={e => {
                                                const newLocs = [...(data.locations || [])];
                                                newLocs[idx] = { ...newLocs[idx], schedule: e.target.value };
                                                handleChange('locations', newLocs);
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {(data.locations || []).length === 0 && (
                                <p className="text-center py-4 text-slate-400 italic">No tienes sedes registradas todavía.</p>
                            )}
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div className="card fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <CreditCard size={20} className="text-primary" /> Métodos de Pago y Cuentas
                            </h3>
                            <button
                                type="button"
                                onClick={() => handleChange('paymentMethods', [...(data.paymentMethods || []), { type: 'bank_transfer', name: '', details: '' }])}
                                className="btn btn-outline btn-sm"
                            >
                                <Plus size={14} /> Añadir Método
                            </button>
                        </div>
                        <div className="space-y-4">
                            {(data.paymentMethods || []).map((pm, idx) => (
                                <div key={idx} className="p-4 border border-slate-100 rounded-lg bg-slate-50/30">
                                    <div className="flex justify-between mb-3">
                                        <select
                                            className="form-select w-auto py-1"
                                            value={pm.type}
                                            onChange={e => {
                                                const next = [...(data.paymentMethods || [])];
                                                next[idx].type = e.target.value as any;
                                                handleChange('paymentMethods', next);
                                            }}
                                        >
                                            <option value="bank_transfer">Transferencia Bancaria</option>
                                            <option value="gateway">Pasarela (PayPal/Stripe)</option>
                                            <option value="cash">Efectivo / Otros</option>
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => handleChange('paymentMethods', (data.paymentMethods || []).filter((_, i) => i !== idx))}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div className="grid grid-2 gap-4">
                                        <input
                                            className="form-input"
                                            placeholder="Nombre del método (Ej: BCP Soles, PayPal)"
                                            value={pm.name}
                                            onChange={e => {
                                                const next = [...(data.paymentMethods || [])];
                                                next[idx].name = e.target.value;
                                                handleChange('paymentMethods', next);
                                            }}
                                        />
                                        <input
                                            className="form-input"
                                            placeholder="Detalles (Núm. Cuenta, Correo, etc.)"
                                            value={pm.details}
                                            onChange={e => {
                                                const next = [...(data.paymentMethods || [])];
                                                next[idx].details = e.target.value;
                                                handleChange('paymentMethods', next);
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                            {(data.paymentMethods || []).length === 0 && (
                                <p className="text-center py-4 text-slate-400 italic">No tienes métodos de pago registrados.</p>
                            )}
                        </div>
                    </div>

                    {/* Operating Hours */}
                    <div className="card fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Clock size={20} className="text-primary" /> Horarios de Atención
                            </h3>
                            <button
                                type="button"
                                onClick={() => handleChange('operatingHours', [...(data.operatingHours || []), { days: '', hours: '' }])}
                                className="btn btn-outline btn-sm"
                            >
                                <Plus size={14} /> Añadir Horario
                            </button>
                        </div>
                        <div className="space-y-4">
                            {(data.operatingHours || []).map((oh, idx) => (
                                <div key={idx} className="flex gap-4 items-start">
                                    <input
                                        className="form-input flex-1"
                                        placeholder="Días (Ej: Lunes a Viernes)"
                                        value={oh.days}
                                        onChange={e => {
                                            const newHrs = [...(data.operatingHours || [])];
                                            newHrs[idx].days = e.target.value;
                                            handleChange('operatingHours', newHrs);
                                        }}
                                    />
                                    <input
                                        className="form-input flex-1"
                                        placeholder="Horario (Ej: 09:00 - 18:00)"
                                        value={oh.hours}
                                        onChange={e => {
                                            const newHrs = [...(data.operatingHours || [])];
                                            newHrs[idx].hours = e.target.value;
                                            handleChange('operatingHours', newHrs);
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleChange('operatingHours', (data.operatingHours || []).filter((_, i) => i !== idx))}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button className="btn btn-primary btn-lg w-full flex justify-center sticky bottom-6 shadow-xl" onClick={handleSave}>
                        <Save size={18} /> Guardar Perfil Institucional
                    </button>
                </div>
            )}

            {tab === 'branding' && (
                <div className="grid-sidebar-right">
                    <div style={{ gridColumn: 'span 2' }}>
                        {/* Magic Extractor */}
                        <div className="card mb-6" style={{ background: 'linear-gradient(135deg, #F0F9FF, #E0F2FE)', border: '1px solid #BAE6FD' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <Sparkles size={18} color="#0284C7" /> Extracción de ADN de Marca con IA
                            </h3>
                            <p style={{ fontSize: '13px', color: '#0369A1', marginBottom: '12px' }}>
                                Pega aquí el texto de tu "Sobre Nosotros", Misión, o guía de marca, y la IA detectará automáticamente tus colores, tipografía y voz.
                            </p>
                            <textarea
                                className="form-textarea"
                                rows={3}
                                value={brandText}
                                onChange={e => setBrandText(e.target.value)}
                                placeholder="Pega aquí textos de tu web o marca..."
                                style={{ background: 'white', marginBottom: '12px' }}
                            />
                            <button className="btn btn-primary" onClick={handleBrandExtraction} disabled={brandAnalyzing}>
                                {brandAnalyzing ? <><Loader size={16} className="spin" /> Analizando...</> : '✨ Extraer Identidad'}
                            </button>
                        </div>

                        {/* Logo */}
                        <div className="card mb-6">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><Image size={18} /> Logo de la Organización</h3>
                            <div className="form-group">
                                <label>URL del Logo (PNG/SVG recomendado)</label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input
                                        className="form-input"
                                        value={data.branding.logo || ''}
                                        onChange={e => updateBranding('logo' as any, '', e.target.value)}
                                        placeholder="https://tudominio.com/logo.png"
                                    />
                                    {data.branding.logo && (
                                        <div className="w-12 h-12 bg-slate-50 border rounded-lg p-1 flex items-center justify-center overflow-hidden">
                                            <img src={data.branding.logo} alt="Preview" className="max-w-full max-h-full object-contain" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Colors */}
                        <div className="card mb-6">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><Palette size={18} /> Paleta de Colores</h3>
                            <div className="grid-4" style={{ gap: '15px' }}>
                                {['primary', 'secondary', 'accent', 'neutral'].map(c => (
                                    <div key={c}>
                                        <label style={{ fontSize: '11px', fontWeight: 600, textTransform: 'capitalize' }}>{c}</label>
                                        <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                                            <input
                                                type="color"
                                                value={(data.branding.colors as any)[c]}
                                                onChange={e => updateBranding('colors', c, e.target.value)}
                                                style={{ width: '30px', height: '30px', border: 'none', padding: 0, borderRadius: '4px', cursor: 'pointer' }}
                                            />
                                            <input
                                                className="form-input"
                                                value={(data.branding.colors as any)[c]}
                                                onChange={e => updateBranding('colors', c, e.target.value)}
                                                style={{ fontSize: '12px', padding: '0 8px', height: '30px' }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Typography */}
                        <div className="card mb-6">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><Type size={18} /> Tipografía</h3>
                            <div className="grid-2" style={{ gap: '20px' }}>
                                <div>
                                    <label>Títulos</label>
                                    <select
                                        className="form-select"
                                        value={data.branding.typography.headings}
                                        onChange={e => updateBranding('typography', 'headings', e.target.value)}
                                    >
                                        {GOOGLE_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label>Cuerpo / Texto</label>
                                    <select
                                        className="form-select"
                                        value={data.branding.typography.body}
                                        onChange={e => updateBranding('typography', 'body', e.target.value)}
                                    >
                                        {GOOGLE_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Voice & Tone */}
                        <div className="card">
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}><Mic size={18} /> Voz y Tono</h3>
                            <div className="grid-2" style={{ gap: '20px', marginBottom: '16px' }}>
                                <div>
                                    <label>Tono General</label>
                                    <select
                                        className="form-select"
                                        value={data.branding.voice.tone}
                                        onChange={e => updateBranding('voice', 'tone', e.target.value)}
                                    >
                                        <option value="formal">Formal y Académico</option>
                                        <option value="cercano">Cercano y Amigable</option>
                                        <option value="inspiracional">Inspiracional</option>
                                        <option value="disruptivo">Disruptivo / Audaz</option>
                                    </select>
                                </div>
                                <div>
                                    <label>Estilo Visual</label>
                                    <select
                                        className="form-select"
                                        value={data.branding.visualIdentity.shapes}
                                        onChange={e => updateBranding('visualIdentity', 'shapes', e.target.value)}
                                    >
                                        <option value="rounded">Suave (Borde Redondeado)</option>
                                        <option value="sharp">Serio (Borde Recto)</option>
                                        <option value="organic">Orgánico</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Descripción del Estilo (Prompt de Sistema)</label>
                                <textarea
                                    className="form-textarea"
                                    rows={2}
                                    value={data.branding.voice.style}
                                    onChange={e => updateBranding('voice', 'style', e.target.value)}
                                    placeholder="Ej: Usar metáforas de crecimiento, evitar tecnicismos..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Preview Sidebar */}
                    <div>
                        <div style={{ position: 'sticky', top: '20px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                                Previsualización en Vivo
                            </div>
                            <BrandPreview />

                            <button className="btn btn-primary btn-lg w-full mt-6" onClick={handleSave}>
                                <Save size={18} /> Guardar Marca
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

