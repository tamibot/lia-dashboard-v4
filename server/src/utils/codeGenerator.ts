import { env } from '../config/env.js';

// Counter cache per org per entity type (resets on server restart; in production use DB sequence)
const counters: Record<string, number> = {};

type CodePrefix = 'CRS' | 'PRG' | 'WBN';

/**
 * Generate a unique code for a course/program/webinar.
 * Format: CRS-AI2024-001
 */
export function generateCode(prefix: CodePrefix, category: string, existingCount: number): string {
    const year = new Date().getFullYear();
    // Clean the category to a short 2-4 char abbreviation
    const catAbbr = abbreviateCategory(category);
    const seq = String(existingCount + 1).padStart(3, '0');
    return `${prefix}-${catAbbr}${year}-${seq}`;
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
