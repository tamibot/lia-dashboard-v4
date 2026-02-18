import { useState } from 'react';
import { getProfile, saveProfile } from '../lib/storage';
import { analyzeBrand } from '../lib/gemini';
import type { OrgProfile, BrandingConfig } from '../lib/types';
import { Save, Building2, GraduationCap, Laptop, Sparkles, Loader, User, MessageSquare, Shield, Palette, Type, Mic } from 'lucide-react';

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
    botConfig: { name: 'LIA Bot', gender: 'female', tone: 'professional', restrictions: '' }
};

export default function ProfilePage() {
    const [data, setData] = useState<OrgProfile>(() => {
        const p = getProfile();
        if (!p) return emptyProfile;
        // Migration safety
        if (!p.branding?.colors) {
            p.branding = {
                ...emptyProfile.branding,
                ...p.branding,
                colors: {
                    primary: p.branding?.primaryColor || '#2563EB',
                    secondary: p.branding?.secondaryColor || '#1E40AF',
                    accent: p.branding?.accentColor || '#F59E0B',
                    neutral: '#F3F4F6'
                }
            };
        }
        return p;
    });

    const [brandAnalyzing, setBrandAnalyzing] = useState(false);
    const [brandText, setBrandText] = useState('');
    const [tab, setTab] = useState<'general' | 'branding' | 'bot'>('general');

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

    function handleSave() {
        saveProfile(data);
        alert('Perfil guardado correctamente ✅');
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

    return (
        <div className="page-content" style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div className="page-header">
                <h2 style={{ fontSize: '24px', fontWeight: 800 }}>🏢 Studio de Marca</h2>
                <p>Define el ADN de tu institución para que la IA genere contenido 100% on-brand.</p>
            </div>

            <div className="tabs mb-6">
                <button className={`tab ${tab === 'general' ? 'active' : ''}`} onClick={() => setTab('general')}>General</button>
                <button className={`tab ${tab === 'branding' ? 'active' : ''}`} onClick={() => setTab('branding')}>🎨 Identidad Visual</button>
                <button className={`tab ${tab === 'bot' ? 'active' : ''}`} onClick={() => setTab('bot')}>🤖 Personalidad Bot</button>
            </div>

            {tab === 'general' && (
                <div className="card fade-in">
                    <div className="form-group grid-3" style={{ gap: '10px', marginBottom: '20px' }}>
                        {[
                            { id: 'universidad', label: 'Universidad', icon: Building2 },
                            { id: 'instituto', label: 'Instituto', icon: GraduationCap },
                            { id: 'infoproductor', label: 'Infoproductor', icon: Laptop },
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => handleChange('type', t.id)}
                                className={`btn ${data.type === t.id ? 'btn-primary' : 'btn-outline'}`}
                                style={{ justifyContent: 'center', flexDirection: 'column', padding: '15px' }}
                            >
                                <t.icon size={20} style={{ marginBottom: '5px' }} />
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="form-group">
                        <label>Nombre de la Institución</label>
                        <input className="form-input" value={data.name} onChange={e => handleChange('name', e.target.value)} placeholder="Ej: Universidad Tech Latam" />
                    </div>

                    <div className="form-group">
                        <label>Descripción Corta</label>
                        <textarea className="form-textarea" rows={2} value={data.description} onChange={e => handleChange('description', e.target.value)} placeholder="¿Qué hacen y cuál es su misión?" />
                    </div>

                    <div className="grid-2" style={{ gap: '20px' }}>
                        <div className="form-group">
                            <label>Público Objetivo</label>
                            <input className="form-input" value={data.targetAudience} onChange={e => handleChange('targetAudience', e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Sitio Web</label>
                            <input className="form-input" value={data.website} onChange={e => handleChange('website', e.target.value)} />
                        </div>
                    </div>
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

            {tab === 'bot' && (
                <div className="card fade-in">
                    {/* ... Existing Bot Config Code ... */}
                    <div className="alert alert-info mb-4" style={{ display: 'flex', gap: '10px', alignItems: 'start' }}>
                        <MessageSquare size={20} />
                        <div>
                            <strong>Configuración del Agente IA</strong>
                            <p style={{ fontSize: '13px', margin: '4px 0 0' }}>Define la personalidad del bot que atenderá a tus leads.</p>
                        </div>
                    </div>
                    {/* Reuse existing bot form fields for brevity or functionality preservation */}
                    <div className="form-group">
                        <label>Nombre del Asistente</label>
                        <input className="form-input" value={data.botConfig?.name} onChange={e => handleChange('botConfig', { ...data.botConfig, name: e.target.value })} />
                    </div>
                    <div className="grid-2" style={{ gap: '20px' }}>
                        <div className="form-group">
                            <label>Género</label>
                            <select className="form-select" value={data.botConfig?.gender} onChange={e => handleChange('botConfig', { ...data.botConfig, gender: e.target.value })}>
                                <option value="female">Femenino</option>
                                <option value="male">Masculino</option>
                                <option value="neutral">Neutro</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Tono</label>
                            <select className="form-select" value={data.botConfig?.tone} onChange={e => handleChange('botConfig', { ...data.botConfig, tone: e.target.value })}>
                                <option value="professional">Profesional</option>
                                <option value="friendly">Amigable</option>
                                <option value="sales">Ventas</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Restricciones</label>
                        <textarea className="form-textarea" rows={3} value={data.botConfig?.restrictions} onChange={e => handleChange('botConfig', { ...data.botConfig, restrictions: e.target.value })} />
                    </div>
                </div>
            )}
        </div>
    );
}

