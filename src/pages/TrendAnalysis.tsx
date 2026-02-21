import { useState, useEffect } from 'react';
import { settingsService } from '../lib/services/settings.service';
import { analyzeTrends } from '../lib/gemini';
import { TrendingUp, Sparkles, Loader, ArrowLeft, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { profileService } from '../lib/services/profile.service';
import { courseService } from '../lib/services/course.service';
import type { OrgProfile, CursoLibre, Programa, Webinar } from '../lib/types';

export default function TrendAnalysisPage() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<OrgProfile | null>(null);
    const [cursos, setCursos] = useState<CursoLibre[]>([]);
    const [programas, setProgramas] = useState<Programa[]>([]);
    const [webinars, setWebinars] = useState<Webinar[]>([]);

    const [initialLoading, setInitialLoading] = useState(true);
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setInitialLoading(true);
        setError(false);
        try {
            const [p, c, pr, w] = await Promise.all([
                profileService.get(),
                courseService.getAll('curso'),
                courseService.getAll('programa'),
                courseService.getAll('webinar')
            ]);
            setProfile(p);
            setCursos(c as CursoLibre[]);
            setProgramas(pr as Programa[]);
            setWebinars(w as Webinar[]);
        } catch (err) {
            console.error("Error fetching trend data:", err);
            setError(true);
        } finally {
            setInitialLoading(false);
        }
    };

    async function handleAnalyze() {
        if (!settingsService.getGeminiKeySync()) { setResult('⚠️ Configura tu API Key de Gemini en el Dashboard (Footer).'); return; }
        if (!profile) { setResult('⚠️ Completa tu perfil primero.'); return; }
        setLoading(true);
        setResult('');
        try {
            const offerings = {
                cursos_libres: cursos,
                programas,
                webinars
            };
            const res = await analyzeTrends(profile as unknown as Record<string, unknown>, offerings as unknown as Record<string, unknown>);
            setResult(res);
        } catch (err: unknown) {
            setResult(`❌ Error: ${err instanceof Error ? err.message : 'Error'}`);
        }
        setLoading(false);
    }

    if (initialLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                <p className="text-gray-500 font-medium">Cargando datos del mercado...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 bg-red-50 rounded-2xl border border-red-100 mx-6 mt-10">
                <div className="bg-red-100 p-4 rounded-full mb-4">
                    <RefreshCw className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-red-900 mb-2">Error al cargar datos</h3>
                <p className="text-red-700 mb-6 max-w-md">No pudimos conectar con los servicios necesarios para el análisis.</p>
                <button onClick={fetchData} className="btn bg-red-600 hover:bg-red-700 text-white border-none shadow-lg px-8">
                    Reintentar Conexión
                </button>
            </div>
        );
    }

    return (
        <div className="page-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/ai-tools')}>
                    <ArrowLeft size={16} />
                </button>
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 800 }}>📈 Análisis de Tendencias</h2>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Descubre qué cursos crear según el mercado y tu perfil.</p>
                </div>
            </div>

            {/* Context */}
            <div className="grid-3 mb-6">
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px' }}>🏛️</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '8px' }}>{profile?.name || 'Sin perfil'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{profile?.type || '—'}</div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px' }}>📦</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '8px' }}>{cursos.length + programas.length + webinars.length} ofertas</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>catálogo actual</div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '24px' }}>🏷️</div>
                    <div style={{ fontSize: '14px', fontWeight: 700, marginTop: '8px' }}>
                        {[...new Set([...cursos.map(c => c.category), ...programas.map(p => p.category), ...webinars.map(w => w.category)])].length} categorías
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>áreas de conocimiento</div>
                </div>
            </div>

            <div className="card mb-6">
                <div className="flex-between">
                    <div>
                        <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <TrendingUp size={18} style={{ color: 'var(--brand)' }} /> Análisis Inteligente de Mercado
                        </h3>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                            La IA analiza tu perfil, catálogo actual y tendencias del mercado para sugerir nuevos cursos con alta demanda.
                        </p>
                    </div>
                    <button className="btn btn-primary" onClick={handleAnalyze} disabled={loading}>
                        {loading ? <><Loader size={16} className="animate-spin" /> Analizando...</> : <><Sparkles size={16} /> Analizar Tendencias</>}
                    </button>
                </div>
            </div>

            {result && (
                <div className="ai-response">
                    <div className="ai-response-header">🤖 Análisis de Tendencias y Oportunidades</div>
                    <div className="ai-response-content" style={{ maxHeight: '70vh', overflowY: 'auto' }}>{result}</div>
                </div>
            )}

            {!result && !loading && (
                <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: '56px', marginBottom: '16px' }}>📊</div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Descubre nuevas oportunidades</h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto' }}>
                        Haz click en "Analizar Tendencias" para obtener un reporte personalizado con recomendaciones de nuevos cursos basándose en tu perfil y las tendencias del mercado.
                    </p>
                </div>
            )}
        </div>
    );
}
