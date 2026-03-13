/**
 * Generate a unique code for any product type.
 * Format: CRS-AI2026-001
 * Uses total count + 1 as sequence, with a retry-safe random suffix fallback.
 */
export function generateCode(prefix: string, category: string, existingCount: number): string {
    const year = new Date().getFullYear();
    const catAbbr = abbreviateCategory(category);
    const seq = String(existingCount + 1).padStart(3, '0');
    // Add random suffix to avoid collisions across categories
    const rand = String(Math.floor(Math.random() * 900) + 100);
    return `${prefix}-${catAbbr}${year}-${seq}${rand}`;
}

function abbreviateCategory(category: string): string {
    if (!category) return 'GEN';

    const map: Record<string, string> = {
        'inteligencia artificial': 'AI',
        'ia': 'AI',
        'ai': 'AI',
        'marketing': 'MKT',
        'marketing digital': 'MKT',
        'ventas': 'VNT',
        'sales': 'VNT',
        'negocios': 'BIZ',
        'business': 'BIZ',
        'mba': 'MBA',
        'tecnología': 'TEC',
        'technology': 'TEC',
        'tech': 'TEC',
        'diseño': 'DIS',
        'design': 'DIS',
        'ux': 'UX',
        'ui/ux': 'UX',
        'data': 'DAT',
        'datos': 'DAT',
        'data science': 'DAT',
        'liderazgo': 'LID',
        'leadership': 'LID',
        'finanzas': 'FIN',
        'finance': 'FIN',
        'comunicación': 'COM',
        'educación': 'EDU',
        'programación': 'DEV',
        'desarrollo': 'DEV',
        'soft skills': 'SKL',
        'habilidades blandas': 'SKL',
        'emprendimiento': 'EMP',
        'startups': 'EMP',
        'transformación digital': 'TDG',
        'innovación': 'INN',
    };

    const lower = category.toLowerCase().trim();
    return map[lower] || category.slice(0, 3).toUpperCase();
}
