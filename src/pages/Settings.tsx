import { useState, useEffect } from 'react';
import { settingsService } from '../lib/services/settings.service';
import { resetClient, validateGeminiKey, validateOpenAIKey, type ValidationResult } from '../lib/gemini';
import { Eye, EyeOff, Trash2, ExternalLink, Copy, CheckCircle, Loader, ShieldCheck, ShieldX, AlertTriangle, Zap, Bot, RefreshCcw, Database } from 'lucide-react';

type ValidationState = 'idle' | 'validating' | 'success' | 'warning' | 'error';

interface KeyCardProps {
    provider: 'gemini' | 'openai';
    title: string;
    icon: string;
    currentKey: string | null;
    defaultKey: string;
    onSave: (key: string) => void;
    onDelete: () => void;
    onValidate: (key: string) => Promise<ValidationResult>;
    guideSteps: { step: number; icon: string; title: string; desc: string; link?: string }[];
    guideLink: string;
    guideLinkLabel: string;
    infoItems: string[];
    accentColor: string;
}

function KeyCard({ provider, title, icon, currentKey, defaultKey, onSave, onDelete, onValidate, guideSteps, guideLink, guideLinkLabel, accentColor }: KeyCardProps) {
    const [key, setKey] = useState('');
    const [show, setShow] = useState(false);
    const [copied, setCopied] = useState(false);
    const [validation, setValidation] = useState<ValidationState>('idle');
    const [validationMsg, setValidationMsg] = useState('');
    const [testOutput, setTestOutput] = useState('');
    const [modelUsed, setModelUsed] = useState('');
    const isDefault = !currentKey || currentKey === defaultKey;

    useEffect(() => { if (currentKey) setKey(currentKey); }, [currentKey]);

    async function handleSave() {
        if (!key.trim()) return;
        setValidation('validating');
        setValidationMsg('Conectando y validando...');
        setTestOutput('');
        setModelUsed('');

        const result = await onValidate(key.trim());

        if (result.valid) {
            onSave(key.trim());
            if (result.message.includes('⚠️')) {
                setValidation('warning');
            } else {
                setValidation('success');
            }
        } else {
            setValidation('error');
        }
        setValidationMsg(result.message);
        if (result.testOutput) setTestOutput(result.testOutput);
        if (result.model) setModelUsed(result.model);
    }

    function handleDelete() {
        if (confirm(`¿Eliminar la API Key de ${title}? Se usará la key por defecto.`)) {
            onDelete();
            setKey(defaultKey);
            setValidation('idle');
            setValidationMsg('');
            setTestOutput('');
        }
    }

    return (
        <div className="card mb-6">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ fontSize: '24px' }}>{icon}</span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>{title} API Key</h3>
                <span className={`badge ${isDefault ? 'badge-yellow' : 'badge-green'}`} style={{ marginLeft: 'auto' }}>
                    {isDefault ? 'Por defecto' : 'Personal ✓'}
                </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <input
                        className="form-input"
                        type={show ? 'text' : 'password'}
                        value={key}
                        onChange={e => { setKey(e.target.value); setValidation('idle'); setValidationMsg(''); setTestOutput(''); }}
                        placeholder={provider === 'gemini' ? 'AIza...' : 'sk-proj-...'}
                        style={{ paddingRight: '40px', fontFamily: 'monospace', fontSize: '13px' }}
                    />
                    <button
                        onClick={() => setShow(!show)}
                        style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                        {show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={!key.trim() || validation === 'validating'}
                    style={{ minWidth: '160px', background: accentColor }}
                >
                    {validation === 'validating' ? (
                        <><Loader size={16} className="spin" /> Validando...</>
                    ) : (
                        <><Zap size={16} /> Probar & Guardar</>
                    )}
                </button>
                {currentKey && !isDefault && (
                    <button className="btn btn-ghost btn-sm" onClick={handleDelete} style={{ color: 'var(--error)' }}>
                        <Trash2 size={16} />
                    </button>
                )}
            </div>

            {/* Validation Result */}
            {validation === 'validating' && (
                <div className="validation-box loading">
                    <Loader size={16} className="spin" />
                    <span>{validationMsg}</span>
                </div>
            )}
            {validation === 'success' && (
                <div style={{ marginTop: '12px' }}>
                    <div className="validation-box success">
                        <ShieldCheck size={18} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>{validationMsg}</div>
                            {modelUsed && <div style={{ fontSize: '11px', marginTop: '2px', opacity: 0.8 }}>Modelo: {modelUsed}</div>}
                        </div>
                    </div>
                    {testOutput && (
                        <div style={{ marginTop: '8px', padding: '12px 16px', background: '#F0FDF4', borderRadius: 'var(--radius)', border: '1px solid #BBF7D0' }}>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Bot size={12} /> Respuesta de prueba:
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                                "{testOutput}"
                            </div>
                        </div>
                    )}
                </div>
            )}
            {validation === 'warning' && (
                <div style={{ marginTop: '12px' }}>
                    <div className="validation-box" style={{ background: 'var(--warning-light)', color: '#B45309', border: '1px solid #FCD34D' }}>
                        <AlertTriangle size={18} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>{validationMsg}</div>
                        </div>
                    </div>
                    {testOutput && (
                        <div style={{ marginTop: '8px', padding: '12px 16px', background: '#FFFBEB', borderRadius: 'var(--radius)', border: '1px solid #FDE68A' }}>
                            <div style={{ fontSize: '13px', color: '#92400E' }}>{testOutput}</div>
                        </div>
                    )}
                </div>
            )}
            {validation === 'error' && (
                <div className="validation-box error" style={{ marginTop: '12px' }}>
                    <ShieldX size={18} />
                    <span style={{ fontWeight: 600 }}>{validationMsg}</span>
                </div>
            )}

            {/* Guide */}
            <details style={{ marginTop: '16px' }}>
                <summary style={{ cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', padding: '8px 0' }}>
                    📖 Cómo crear tu API Key de {title} (gratis)
                </summary>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px', paddingLeft: '4px' }}>
                    {guideSteps.map(s => (
                        <div key={s.step} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: accentColor, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                                {s.step}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '12px', fontWeight: 600 }}>{s.icon} {s.title}</div>
                                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>{s.desc}</p>
                            </div>
                            {s.link && (
                                <a href={s.link} target="_blank" rel="noopener" className="btn btn-outline btn-sm" style={{ fontSize: '10px' }}>
                                    Abrir <ExternalLink size={10} />
                                </a>
                            )}
                        </div>
                    ))}
                </div>
                <div style={{ marginTop: '12px', padding: '8px 12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '11px', color: 'var(--brand)' }}>{guideLinkLabel}</span>
                    <button className="btn btn-ghost btn-sm" style={{ fontSize: '10px' }} onClick={() => { navigator.clipboard.writeText(guideLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                        {copied ? <><CheckCircle size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
                    </button>
                </div>
            </details>
        </div>
    );
}


export default function SettingsPage() {
    const DEFAULT_GEMINI_KEY = '';
    const DEFAULT_OPENAI_KEY = '';

    const [keys, setKeys] = useState<{ gemini_key: string | null, openai_key: string | null }>({ gemini_key: null, openai_key: null });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadKeys = async () => {
            const data = await settingsService.getApiKeys();
            setKeys(data);
            setLoading(false);
        };
        loadKeys();
    }, []);

    const geminiIsDefault = !keys.gemini_key || keys.gemini_key === DEFAULT_GEMINI_KEY;
    const openaiIsDefault = !keys.openai_key || keys.openai_key === DEFAULT_OPENAI_KEY;

    if (loading) {
        return (
            <div className="page-content flex items-center justify-center min-h-[400px]">
                <Loader size={32} className="spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="page-content" style={{ maxWidth: '780px' }}>
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 800 }}>⚙️ Configuración de IA</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Gestiona tus API Keys para que las herramientas de IA funcionen sin interrupciones.</p>
            </div>

            {/* Why Both Keys */}
            <div className="card mb-6" style={{ background: 'linear-gradient(135deg, #EFF6FF, #F5F3FF)', border: '1px solid #C7D2FE' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <span style={{ fontSize: '24px' }}>🛡️</span>
                    <div>
                        <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>¿Por qué tener dos API Keys?</h4>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                            <p>• <strong>Respaldo automático:</strong> Si Gemini alcanza su límite de uso, LIA cambia automáticamente a OpenAI para que nunca pierdas productividad.</p>
                            <p>• <strong>Sin interrupciones:</strong> Los modelos gratuitos tienen restricciones de uso. Con dos proveedores, siempre tienes un plan B.</p>
                            <p>• <strong>Mejor calidad:</strong> Cada proveedor tiene fortalezas diferentes. Gemini es rápido; OpenAI es versátil.</p>
                            <p>• <strong>Ambas son gratis:</strong> Tanto Google Gemini como OpenAI ofrecen niveles gratuitos generosos.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Overview */}
            <div className="grid-2 mb-6">
                <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
                    <div style={{ fontSize: '28px', marginBottom: '4px' }}>🔵</div>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>Gemini</div>
                    <div style={{ fontSize: '11px', color: geminiIsDefault ? 'var(--warning)' : 'var(--success)', fontWeight: 600, marginTop: '2px' }}>
                        {geminiIsDefault ? '⚠️ Key compartida' : '✅ Key personal'}
                    </div>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
                    <div style={{ fontSize: '28px', marginBottom: '4px' }}>🟢</div>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>OpenAI</div>
                    <div style={{ fontSize: '11px', color: openaiIsDefault ? 'var(--warning)' : 'var(--success)', fontWeight: 600, marginTop: '2px' }}>
                        {openaiIsDefault ? '⚠️ Key compartida' : '✅ Key personal'}
                    </div>
                </div>
            </div>

            {/* Gemini Key */}
            <KeyCard
                provider="gemini"
                title="Google Gemini"
                icon="🔵"
                currentKey={keys.gemini_key}
                defaultKey={DEFAULT_GEMINI_KEY}
                onSave={async (k) => {
                    await settingsService.updateGeminiKey(k);
                    setKeys(prev => ({ ...prev, gemini_key: k }));
                    resetClient();
                }}
                onDelete={async () => {
                    await settingsService.deleteGeminiKey();
                    setKeys(prev => ({ ...prev, gemini_key: null }));
                    resetClient();
                }}
                onValidate={validateGeminiKey}
                accentColor="#2563EB"
                guideSteps={[
                    { step: 1, icon: '🌐', title: 'Ve a Google AI Studio', desc: 'Ingresa con tu cuenta Google', link: 'https://aistudio.google.com/apikey' },
                    { step: 2, icon: '🔑', title: 'Click en "Create API Key"', desc: 'Selecciona un proyecto o crea uno nuevo' },
                    { step: 3, icon: '📋', title: 'Copia la key (AIza...)', desc: 'Pégala arriba y haz click en "Probar & Guardar"' },
                ]}
                guideLink="https://aistudio.google.com/apikey"
                guideLinkLabel="aistudio.google.com/apikey"
                infoItems={[
                    'Gratis: 1,500 requests/día',
                    '4 modelos de respaldo automático',
                    'Ideal para uso principal'
                ]}
            />

            {/* OpenAI Key */}
            <KeyCard
                provider="openai"
                title="OpenAI"
                icon="🟢"
                currentKey={keys.openai_key}
                defaultKey={DEFAULT_OPENAI_KEY}
                onSave={async (k) => {
                    await settingsService.updateOpenAIKey(k);
                    setKeys(prev => ({ ...prev, openai_key: k }));
                }}
                onDelete={async () => {
                    await settingsService.deleteOpenAIKey();
                    setKeys(prev => ({ ...prev, openai_key: null }));
                }}
                onValidate={validateOpenAIKey}
                accentColor="#10A37F"
                guideSteps={[
                    { step: 1, icon: '🌐', title: 'Ve a platform.openai.com', desc: 'Crea una cuenta o inicia sesión', link: 'https://platform.openai.com/api-keys' },
                    { step: 2, icon: '🔑', title: 'Click en "Create new secret key"', desc: 'Dale un nombre descriptivo como "LIA Dashboard"' },
                    { step: 3, icon: '📋', title: 'Copia la key (sk-proj-...)', desc: 'Solo se muestra una vez. Pégala arriba.' },
                ]}
                guideLink="https://platform.openai.com/api-keys"
                guideLinkLabel="platform.openai.com/api-keys"
                infoItems={[
                    'Créditos gratis para nuevos usuarios',
                    'Se usa como respaldo de Gemini',
                    'Modelo: gpt-4o-mini'
                ]}
            />

            {/* Data Management */}
            <div className="card mb-6" style={{ border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4B5563' }}>
                        <Database size={20} />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>Gestión de Datos</h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Controla los datos almacenados en el servidor.</p>
                    </div>
                </div>

                <div style={{ background: '#FFFBEB', padding: '12px 16px', borderRadius: 'var(--radius)', border: '1px solid #FDE68A', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', color: '#92400E' }}>
                        <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                        <div style={{ fontSize: '13px' }}>
                            <strong>¿Quieres ver el nuevo contenido demo?</strong> Si has realizado cambios manuales o quieres actualizar el catálogo de cursos, programas y webinars con la versión más reciente, puedes resetear los datos demo.
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius)' }}>
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>Resetear Datos Demo</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Se borrarán cursos, programas y agentes creados, y se cargarán los de fábrica. Tus <strong>API Keys NO se borrarán</strong>.</div>
                    </div>
                    <button
                        className="btn btn-outline"
                        onClick={async () => {
                            if (confirm('¿Estás seguro de resetear los datos? Se perderán los cursos y agentes que hayas creado manualmente.')) {
                                await settingsService.resetDemoData();
                                window.location.reload();
                            }
                        }}
                        style={{ color: 'var(--error)', borderColor: 'var(--error)' }}
                    >
                        <RefreshCcw size={16} /> Resetear Ahora
                    </button>
                </div>
            </div>

            {/* Technical Info */}
            <div className="card" style={{ background: 'var(--bg)' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '10px' }}>ℹ️ Información técnica</h4>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                    <p>• <strong>Privacidad:</strong> Las API Keys se almacenan de forma segura en nuestros servidores y solo se usan para procesar tus solicitudes.</p>
                    <p>• <strong>Fallback inteligente:</strong> LIA intenta 3 modelos de Gemini (2.5-flash-lite → 2.5-flash → 2.0-flash) con pausa entre intentos. Si todos fallan, usa OpenAI automáticamente.</p>
                    <p>• <strong>Rate limits:</strong> Los límites dependen de tu plan con Google/OpenAI. Si ves un error 429, espera unos minutos.</p>
                    <p>• <strong>Seguridad:</strong> Todas las llamadas se realizan a través de conexiones cifradas directamente a los proveedores de IA.</p>
                </div>
            </div>
        </div>
    );
}
