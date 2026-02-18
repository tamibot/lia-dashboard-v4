import type { AITool } from '../lib/types';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const tools: AITool[] = [
    // Onboarding
    {
        id: 'upload-analyzer',
        name: 'Subir & Analizar Información',
        description: 'Pega texto con datos de un curso, programa o webinar. La IA los extrae, organiza y estandariza.',
        icon: '📤',
        status: 'available',
        category: 'onboarding',
        path: '/courses/upload',
    },
    {
        id: 'profile-onboarding',
        name: 'Onboarding de Perfil',
        description: 'Asistente IA que te guía para completar tu perfil, definir tu branding y optimizar tu presencia.',
        icon: '👤',
        status: 'available',
        category: 'onboarding',
        path: '/profile',
    },
    // Analytics
    {
        id: 'trend-analysis',
        name: 'Análisis de Tendencias',
        description: 'Descubre qué cursos crear según tendencias de mercado, demanda y tu perfil de organización.',
        icon: '📈',
        status: 'available',
        category: 'analytics',
        path: '/tools/trends',
    },
    // Content (per-course tools)
    {
        id: 'course-analyzer',
        name: 'Analizador de Datos',
        description: 'Revisa completitud de un curso, estandariza descripciones y sugiere mejoras. Accesible desde cada curso.',
        icon: '📋',
        status: 'available',
        category: 'content',
        path: '/courses',
    },
    {
        id: 'landing-generator',
        name: 'Generador de Landing Pages',
        description: 'Crea contenido completo de landing page desde los datos del curso y tu branding.',
        icon: '🌐',
        status: 'available',
        category: 'marketing',
        path: '/courses',
    },
    {
        id: 'sequence-builder',
        name: 'Secuencias de Seguimiento',
        description: 'Genera secuencias de WhatsApp (5 mensajes) y Email (4 emails) para convertir leads.',
        icon: '📩',
        status: 'available',
        category: 'marketing',
        path: '/courses',
    },
    {
        id: 'marketing-kit',
        name: 'Kit de Marketing & Ads',
        description: 'Copys para Meta/Google/LinkedIn Ads, audiencias target, keywords e intereses sugeridos.',
        icon: '🚀',
        status: 'available',
        category: 'marketing',
        path: '/courses',
    },
    {
        id: 'content-ideas',
        name: 'Ideas de Contenido Orgánico',
        description: 'Calendario de contenido de 2 semanas: posts, reels, artículos vinculados a tus cursos.',
        icon: '💡',
        status: 'available',
        category: 'content',
        path: '/courses',
    },
    // Coming soon
    {
        id: 'video-to-ppt',
        name: 'Video → Presentación',
        description: 'Convierte el contenido de un video en slides tipo PPT o guía rápida descargable.',
        icon: '🎞️',
        status: 'coming_soon',
        category: 'content',
        path: '#',
    },
    {
        id: 'banner-creator',
        name: 'Banners Publicitarios',
        description: 'Genera banners visuales para redes sociales con los datos del curso y tu branding.',
        icon: '🖼️',
        status: 'coming_soon',
        category: 'marketing',
        path: '#',
    },
];

const categories = [
    { key: 'onboarding', label: '🚀 Onboarding', desc: 'Herramientas para empezar' },
    { key: 'analytics', label: '📊 Análisis', desc: 'Inteligencia de mercado' },
    { key: 'content', label: '✏️ Contenido', desc: 'Generación de contenido' },
    { key: 'marketing', label: '📢 Marketing', desc: 'Ads, copys y secuencias' },
];

export default function AIToolsPage() {
    return (
        <div className="page-content">
            <div className="page-header">
                <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Herramientas IA 🛠️</h2>
                <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>8 herramientas disponibles para generar, analizar y automatizar.</p>
            </div>

            {/* Info banner */}
            <div className="card mb-6" style={{ background: 'linear-gradient(135deg, #EFF6FF, #F0FDF4)', border: '1px solid #BFDBFE' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '32px' }}>💡</span>
                    <div>
                        <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '2px' }}>¿Cómo funciona?</h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            Las herramientas de <strong>Onboarding y Análisis</strong> funcionan de forma independiente. Las de <strong>Contenido y Marketing</strong> se activan desde cada curso — ve a <strong>Mi Catálogo → selecciona un curso → Tools IA</strong>.
                        </p>
                    </div>
                </div>
            </div>

            {categories.map(cat => {
                const catTools = tools.filter(t => t.category === cat.key);
                if (catTools.length === 0) return null;
                return (
                    <div key={cat.key} style={{ marginBottom: '28px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>{cat.label}</h3>
                        <div className={catTools.length <= 2 ? 'grid-2' : 'grid-3'}>
                            {catTools.map(tool => {
                                const isAvailable = tool.status === 'available';
                                const isPerCourse = ['course-analyzer', 'landing-generator', 'sequence-builder', 'marketing-kit', 'content-ideas'].includes(tool.id);
                                return (
                                    <div key={tool.id} className={`card ${isAvailable && !isPerCourse ? 'card-clickable' : ''}`} style={{ opacity: isAvailable ? 1 : 0.6 }}>
                                        {isAvailable && !isPerCourse ? (
                                            <Link to={tool.path} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                                                <ToolCard tool={tool} isPerCourse={false} />
                                            </Link>
                                        ) : (
                                            <ToolCard tool={tool} isPerCourse={isPerCourse && isAvailable} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function ToolCard({ tool, isPerCourse }: { tool: AITool; isPerCourse: boolean }) {
    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '28px' }}>{tool.icon}</span>
                <div>
                    <span className={`badge ${tool.status === 'available' ? 'badge-green' : 'badge-yellow'}`} style={{ fontSize: '9px' }}>
                        {tool.status === 'available' ? 'Activo' : 'Próximo'}
                    </span>
                </div>
            </div>
            <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>{tool.name}</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '8px' }}>{tool.description}</p>
            {tool.status === 'available' && !isPerCourse && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--brand)', fontWeight: 600 }}>
                    Abrir <ArrowRight size={12} />
                </div>
            )}
            {isPerCourse && (
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    📌 Accesible desde cada curso → Tools IA
                </div>
            )}
        </>
    );
}
