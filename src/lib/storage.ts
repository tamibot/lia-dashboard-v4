import type { OrgProfile, CursoLibre, Programa, Webinar, GeneratedContent } from './types';

const KEYS = {
    GEMINI_API_KEY: 'lia_gemini_key',
    OPENAI_API_KEY: 'lia_openai_key',
    PROFILE: 'lia_profile',
    CURSOS: 'lia_cursos',
    PROGRAMAS: 'lia_programas',
    WEBINARS: 'lia_webinars',
    GENERATED: 'lia_generated',
};

// === Gemini API Key ===
const DEFAULT_GEMINI_KEY = '';

export function getGeminiKey(): string | null {
    return localStorage.getItem(KEYS.GEMINI_API_KEY) || DEFAULT_GEMINI_KEY;
}
export function setGeminiKey(key: string): void {
    localStorage.setItem(KEYS.GEMINI_API_KEY, key);
}
export function removeGeminiKey(): void {
    localStorage.removeItem(KEYS.GEMINI_API_KEY);
}

// === OpenAI API Key ===
const DEFAULT_OPENAI_KEY = ''; // Default removed for security

export function getOpenAIKey(): string | null {
    return localStorage.getItem(KEYS.OPENAI_API_KEY);
}
export function setOpenAIKey(key: string): void {
    localStorage.setItem(KEYS.OPENAI_API_KEY, key);
}
export function removeOpenAIKey(): void {
    localStorage.removeItem(KEYS.OPENAI_API_KEY);
}

// === Profile ===
export function getProfile(): OrgProfile | null {
    const raw = localStorage.getItem(KEYS.PROFILE);
    return raw ? JSON.parse(raw) : null;
}
export function saveProfile(profile: OrgProfile): void {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
}
export function removeProfile(): void {
    localStorage.removeItem(KEYS.PROFILE);
}

// === Cursos Libres ===
export function getCursos(): CursoLibre[] {
    const raw = localStorage.getItem(KEYS.CURSOS);
    return raw ? JSON.parse(raw) : [];
}
export function saveCursos(items: CursoLibre[]): void {
    localStorage.setItem(KEYS.CURSOS, JSON.stringify(items));
}
export function addCurso(item: CursoLibre): CursoLibre[] {
    const items = getCursos();
    items.push(item);
    saveCursos(items);
    return items;
}
export function updateCurso(id: string, updates: Partial<CursoLibre>): CursoLibre[] {
    const items = getCursos().map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c);
    saveCursos(items);
    return items;
}
export function deleteCurso(id: string): CursoLibre[] {
    const items = getCursos().filter(c => c.id !== id);
    saveCursos(items);
    return items;
}

// === Programas ===
export function getProgramas(): Programa[] {
    const raw = localStorage.getItem(KEYS.PROGRAMAS);
    return raw ? JSON.parse(raw) : [];
}
export function saveProgramas(items: Programa[]): void {
    localStorage.setItem(KEYS.PROGRAMAS, JSON.stringify(items));
}
export function addPrograma(item: Programa): Programa[] {
    const items = getProgramas();
    items.push(item);
    saveProgramas(items);
    return items;
}
export function deletePrograma(id: string): Programa[] {
    const items = getProgramas().filter(c => c.id !== id);
    saveProgramas(items);
    return items;
}

// === Webinars ===
export function getWebinars(): Webinar[] {
    const raw = localStorage.getItem(KEYS.WEBINARS);
    return raw ? JSON.parse(raw) : [];
}
export function saveWebinars(items: Webinar[]): void {
    localStorage.setItem(KEYS.WEBINARS, JSON.stringify(items));
}
export function addWebinar(item: Webinar): Webinar[] {
    const items = getWebinars();
    items.push(item);
    saveWebinars(items);
    return items;
}
export function deleteWebinar(id: string): Webinar[] {
    const items = getWebinars().filter(c => c.id !== id);
    saveWebinars(items);
    return items;
}

// === Generated Content ===
export function getGenerated(): GeneratedContent[] {
    const raw = localStorage.getItem(KEYS.GENERATED);
    return raw ? JSON.parse(raw) : [];
}
export function saveGenerated(items: GeneratedContent[]): void {
    localStorage.setItem(KEYS.GENERATED, JSON.stringify(items));
}
export function addGenerated(item: GeneratedContent): void {
    const items = getGenerated();
    items.push(item);
    saveGenerated(items);
}

// === ID Generator ===
export function generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// === Load demo data ===
export function loadDemoData(): void {
    // Only load if no existing data
    if (getCursos().length > 0 || getProgramas().length > 0 || getWebinars().length > 0) return;

    // We import dynamically to keep this file clean
    import('./demoData').then(mod => {
        saveProfile(mod.demoProfile);
        saveCursos(mod.demoCursos);
        saveProgramas(mod.demoProgramas);
        saveWebinars(mod.demoWebinars);
        window.location.reload();
    });
}

// === Reset all data ===
export function resetAllData(): void {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
}
