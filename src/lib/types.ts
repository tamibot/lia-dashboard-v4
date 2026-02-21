// Forces cache invalidation
// === Organization Types ===
export type OrgType = 'universidad' | 'instituto' | 'infoproductor';

export interface ContactInfo {
    name: string;
    email: string;
    phone?: string;
    whatsapp?: string;
    role?: string;
    availability?: string; // e.g. '09:00 - 18:00'
    vacations?: string[]; // e.g. ['2024-12-20 to 2024-12-31']
}

export interface Attachment {
    id: string;
    name: string;
    url: string;
    type: 'pdf' | 'video' | 'image' | 'link';
    size?: string;
    createdAt?: string;
}

export interface BrandingConfig {
    logo?: string;
    colors: Partial<{
        primary: string;
        secondary: string;
        accent: string;
        neutral: string;
    }>;
    typography: Partial<{
        headings: string;
        body: string;
    }>;
    voice: Partial<{
        tone: 'formal' | 'cercano' | 'inspiracional' | 'disruptivo' | 'profesional';
        style: string;
        keywords: string[];
    }>;
    visualIdentity: Partial<{
        mood: string;
        shapes: 'rounded' | 'sharp' | 'organic';
    }>;
    // Legacy fields for backward compatibility
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    fontPreference?: 'moderna' | 'clasica' | 'minimalista' | 'Helvetica';
    toneOfVoice?: 'formal' | 'cercano' | 'inspiracional' | 'inspirador' | 'disruptivo' | 'profesional';
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
    niche?: string;
    // Common
    branding: BrandingConfig;
    targetAudience?: string;
    onboardingComplete: boolean;
    botConfig?: BotConfig; // Legacy, moving to Agents
    // New Expanded Fields
    location?: string; // e.g. "Av. Javier Prado Este 123, San Isidro, Lima"
    contactEmail?: string; // General contact email
    socialMedia?: {
        instagram?: string;
        facebook?: string;
        linkedin?: string;
        tiktok?: string;
        youtube?: string;
        website?: string;
    };
    locations?: {
        id: string; // Added ID for management
        name: string;
        address: string;
        mapUrl?: string;
    }[];
    operatingHours?: {
        days: string;
        hours: string;
    }[];
    courseCategories?: string[]; // Types of courses offered
    history?: string; // Story/About Us
}

// === Teams ===
export interface Team {
    id: string;
    name: string;
    description?: string;
    members: ContactInfo[]; // Users in this team
    assignedCourses: string[]; // IDs of courses this team sells
    createdAt: string;
}



// === Agent Types ===
export type AiAgent = {
    id: string;
    name: string;
    role: string; // e.g., "Sales Representative", "Academic Advisor"
    personality: 'professional' | 'friendly' | 'empathetic' | 'strict' | 'enthusiastic';
    tone: string; // precise description
    language: string;
    expertise: string[]; // e.g. ["Sales", "Tech"]
    specificCourses?: string[]; // IDs of courses this agent focuses on. Empty = All.
    systemPrompt?: string;
    avatar?: string;
    isActive: boolean;
    teamId?: string; // Linked team
    createdAt: string;
};

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
    totalHours?: number;
    hours?: number; // Alias for compatibility
    schedule?: string;
    syllabus: SyllabusModule[] | string[];
    instructor: string;
    instructorBio?: string;
    price: number;
    currency: string;
    earlyBirdPrice?: number;
    earlyBirdDeadline?: string;
    promotions?: string;
    requirements?: string[];
    contactInfo?: ContactInfo;
    // Commercial Fields
    benefits?: string[];
    painPoints?: string[];
    guarantee?: string;
    socialProof?: string[];
    faqs?: { question: string; answer: string }[];
    bonuses?: string[];
    attachments?: Attachment[];
    maxStudents?: number;
    prerequisites?: string;
    certification?: string;
    category: string;
    tags?: string[];
    tools?: string[];
    status: 'borrador' | 'activo' | 'archivado';
    createdAt: string;
    updatedAt: string;
    aiSummary?: string;
    teamId?: string;
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

    courses: ProgramaCourse[];
    coordinator?: string; // Added for demo data
    schedule?: string;
    price: number;
    currency: string;
    earlyBirdPrice?: number;
    promotions?: string;
    requirements?: string[];
    contactInfo?: ContactInfo;
    // Commercial Fields
    benefits?: string[];
    painPoints?: string[];
    guarantee?: string;
    socialProof?: string[];
    faqs?: { question: string; answer: string }[];
    bonuses?: string[];
    attachments?: Attachment[];
    maxStudents?: number;
    prerequisites?: string;
    certification: string;
    certifyingEntity?: string;
    category: string;
    tags?: string[];
    tools?: string[];
    status: 'borrador' | 'activo' | 'archivado';
    createdAt: string;
    updatedAt: string;
    aiSummary?: string;
    teamId?: string;
}

export interface ProgramaCourse {
    id: string;
    order: number;
    title: string;
    description?: string;
    hours: number;
    instructor?: string;
    topics?: string[];
}

// === Webinar / Taller ===
export interface Webinar {
    id: string;
    title: string;
    subtitle?: string;
    description: string;
    type?: 'webinar' | 'taller' | 'masterclass' | 'charla';
    speaker: string;
    speakerBio?: string;
    speakerTitle?: string;
    date: string;
    time: string;
    duration: string; // e.g. "2 horas"
    modality?: 'online' | 'presencial' | 'hibrido';
    platform?: string; // Zoom, Meet, etc.
    price: number; // 0 = gratuito
    currency: string;
    maxAttendees?: number;
    topics?: string[];
    keyTopics?: string[];
    targetAudience: string;
    callToAction?: string;
    requirements?: string[];
    contactInfo?: ContactInfo;
    // Commercial Fields
    benefits?: string[];
    painPoints?: string[];
    guarantee?: string;
    socialProof?: string[];
    faqs?: { question: string; answer: string }[];
    bonuses?: string[];
    attachments?: Attachment[];
    registrationLink?: string;
    promotions?: string;
    category: string;
    tags?: string[];
    tools?: string[];
    status: 'borrador' | 'activo' | 'archivado';
    createdAt: string;
    updatedAt: string;
    aiSummary?: string;
    teamId?: string;
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

export type CourseData = CursoLibre | Programa | Webinar;
