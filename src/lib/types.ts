// === Organization Types ===
export type OrgType = 'universidad' | 'instituto' | 'infoproductor';

export interface BrandingConfig {
    logo?: string;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        neutral: string;
    };
    typography: {
        headings: string;
        body: string;
    };
    voice: {
        tone: 'formal' | 'cercano' | 'inspiracional' | 'disruptivo';
        style: string;
        keywords: string[];
    };
    visualIdentity: {
        mood: string;
        shapes: 'rounded' | 'sharp' | 'organic';
    };
    // Legacy fields for backward compatibility
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    fontPreference?: 'moderna' | 'clasica' | 'minimalista';
    toneOfVoice?: 'formal' | 'cercano' | 'inspiracional' | 'inspirador' | 'disruptivo';
}

export interface BotConfig {
    name: string;
    gender: 'female' | 'male' | 'neutral';
    tone: 'professional' | 'friendly' | 'sales' | 'direct';
    restrictions: string;
}

export interface OrgProfile {
    type: OrgType;
    name: string;
    description: string;
    tagline?: string;
    // Universidad
    address?: string;
    accreditations?: string;
    website?: string;
    // Instituto
    specialty?: string;
    certifications?: string;
    // Infoproductor
    personalBrand?: string;
    socialMedia?: string;
    niche?: string;
    // Common
    branding: BrandingConfig;
    targetAudience?: string;
    onboardingComplete: boolean;
    botConfig?: BotConfig;
}

// === Curso Libre (standalone course) ===
export interface CursoLibre {
    id: string;
    title: string;
    subtitle?: string;
    description: string;
    objectives: string[];
    targetAudience: string;
    modality: 'online' | 'presencial' | 'hibrido';
    startDate: string;
    endDate?: string;
    duration: string;
    totalHours: number;
    schedule?: string;
    syllabus: SyllabusModule[];
    instructor: string;
    instructorBio?: string;
    price: number;
    currency: string;
    earlyBirdPrice?: number;
    earlyBirdDeadline?: string;
    promotions?: string;
    maxStudents?: number;
    prerequisites?: string;
    certification?: string;
    category: string;
    tags: string[];
    status: 'borrador' | 'activo' | 'archivado';
    createdAt: string;
    updatedAt: string;
    aiSummary?: string;
}

export interface SyllabusModule {
    id: string;
    week?: number;
    title: string;
    description: string;
    topics: string[];
    hours: number;
}

// === Programa (set of courses) ===
export interface Programa {
    id: string;
    title: string;
    subtitle?: string;
    description: string;
    objectives: string[];
    targetAudience: string;
    modality: 'online' | 'presencial' | 'hibrido';
    startDate: string;
    endDate?: string;
    totalDuration: string;
    totalHours: number;
    totalCredits?: number;
    courses: ProgramaCourse[];
    schedule?: string;
    price: number;
    currency: string;
    earlyBirdPrice?: number;
    promotions?: string;
    maxStudents?: number;
    prerequisites?: string;
    certification: string;
    certifyingEntity?: string;
    category: string;
    tags: string[];
    status: 'borrador' | 'activo' | 'archivado';
    createdAt: string;
    updatedAt: string;
    aiSummary?: string;
}

export interface ProgramaCourse {
    id: string;
    order: number;
    title: string;
    description: string;
    hours: number;
    instructor?: string;
    topics: string[];
}

// === Webinar / Taller ===
export interface Webinar {
    id: string;
    title: string;
    subtitle?: string;
    description: string;
    type: 'webinar' | 'taller' | 'masterclass' | 'charla';
    speaker: string;
    speakerBio?: string;
    speakerTitle?: string;
    date: string;
    time: string;
    duration: string; // e.g. "2 horas"
    modality: 'online' | 'presencial' | 'hibrido';
    platform?: string; // Zoom, Meet, etc.
    price: number; // 0 = gratuito
    currency: string;
    maxAttendees?: number;
    keyTopics: string[];
    targetAudience: string;
    callToAction?: string;
    registrationLink?: string;
    category: string;
    tags: string[];
    status: 'borrador' | 'activo' | 'archivado';
    createdAt: string;
    updatedAt: string;
    aiSummary?: string;
}

// === AI Tool Types ===
export interface AITool {
    id: string;
    name: string;
    description: string;
    icon: string;
    status: 'available' | 'coming_soon';
    category: 'onboarding' | 'content' | 'marketing' | 'analytics';
    path: string;
}

// === Generated Content ===
export interface GeneratedContent {
    id: string;
    sourceId: string; // ID of the course/program/webinar
    sourceType: 'curso' | 'programa' | 'webinar';
    toolId: string;
    content: string;
    createdAt: string;
}
