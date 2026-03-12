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
    website?: string;
    contactEmail?: string;
    contactPhone?: string;
    whatsapp?: string;
    // Universidad-specific
    accreditations?: string;
    // Instituto-specific
    specialty?: string;
    // Infoproductor-specific
    personalBrand?: string;
    niche?: string;
    // Common
    branding: BrandingConfig;
    targetAudience?: string;
    onboardingComplete: boolean;
    history?: string;
    // Complex nested data (stored as JSONB in DB)
    socialMedia?: {
        instagram?: string;
        facebook?: string;
        linkedin?: string;
        tiktok?: string;
        youtube?: string;
        website?: string;
    };
    locations?: {
        id: string;
        name: string;
        address: string;
        phone?: string;
        schedule?: string;
    }[];
    operatingHours?: {
        days: string;
        hours: string;
    }[];
    paymentMethods?: {
        type: 'bank_transfer' | 'gateway' | 'cash';
        name: string;
        details: string;
        currency?: string;
    }[];
    certificates?: string[];
    modalities?: string[];
    courseCategories?: string[];
}

// === Teams ===
export interface TeamMember {
    id?: string;
    name: string;
    email: string;
    phone?: string;
    whatsapp?: string;
    role?: string;
    availability?: string;
    vacationStart?: string;
    vacationEnd?: string;
    isAvailable: boolean;
    specialties: string[];
    maxLeads?: number;
    userId?: string;
}

export interface TeamProductAssignment {
    id?: string;
    entityType: 'course' | 'program' | 'webinar' | 'taller' | 'subscription' | 'asesoria' | 'application';
    entityId: string;
}

export interface Team {
    id: string;
    name: string;
    description?: string;
    members: TeamMember[];
    productAssignments: TeamProductAssignment[];
    createdAt: string;
}



// === Agent Types ===
export type AiAgent = {
    id: string;
    name: string;
    role: string;
    personality: 'professional' | 'friendly' | 'empathetic' | 'strict' | 'enthusiastic';
    tone: string;
    language: string;
    expertise: string[];
    specificCourses?: string[];
    systemPrompt?: string;
    avatar?: string;
    isActive: boolean;
    teamId?: string;
    funnelId?: string;
    extractionFieldIds?: string[];
    createdAt: string;
};

// === Curso Libre (standalone course) ===
export interface CursoLibre {
    id: string;
    code: string;
    title: string;
    subtitle?: string;
    description: string;
    objectives: string[];
    targetAudience: string;
    modality: 'online' | 'presencial' | 'hibrido';
    location?: string;
    startDate: string;
    endDate?: string;
    duration: string;
    totalHours?: number;
    hours?: number;
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
    callToAction?: string;
    idealStudentProfile?: string;
    competitiveAdvantage?: string;
    urgencyTriggers?: string[];
    objectionHandlers?: { objection: string; response: string }[];
    successStories?: { name: string; quote: string; result?: string }[];
    attachments?: Attachment[];
    maxStudents?: number;
    prerequisites?: string;
    certification?: string;
    registrationLink?: string;
    paymentMethods?: string[];
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
    code: string;
    title: string;
    subtitle?: string;
    description: string;
    objectives: string[];
    targetAudience: string;
    modality: 'online' | 'presencial' | 'hibrido';
    location?: string;
    startDate: string;
    endDate?: string;
    totalDuration: string;
    totalHours: number;
    courses: ProgramaCourse[];
    coordinator?: string;
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
    callToAction?: string;
    idealStudentProfile?: string;
    competitiveAdvantage?: string;
    urgencyTriggers?: string[];
    objectionHandlers?: { objection: string; response: string }[];
    successStories?: { name: string; quote: string; result?: string }[];
    attachments?: Attachment[];
    maxStudents?: number;
    prerequisites?: string;
    certification: string;
    certifyingEntity?: string;
    registrationLink?: string;
    paymentMethods?: string[];
    whatsappGroup?: string;
    includesProject?: boolean;
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

// === Webinar ===
export interface Webinar {
    id: string;
    code: string;
    title: string;
    subtitle?: string;
    description: string;
    webinarFormat?: string;
    speaker: string;
    speakerBio?: string;
    speakerTitle?: string;
    date: string;
    time: string;
    duration: string;
    modality?: 'online' | 'presencial' | 'hibrido';
    location?: string;
    platform?: string;
    price: number;
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
    idealStudentProfile?: string;
    competitiveAdvantage?: string;
    urgencyTriggers?: string[];
    objectionHandlers?: { objection: string; response: string }[];
    successStories?: { name: string; quote: string; result?: string }[];
    attachments?: Attachment[];
    registrationLink?: string;
    paymentMethods?: string[];
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

// === Taller (Workshop) ===
export interface Taller {
    id: string;
    code: string;
    title: string;
    subtitle?: string;
    description: string;
    objectives: string[];
    targetAudience: string;
    modality: 'online' | 'presencial' | 'hibrido';
    eventDate?: string;
    eventTime?: string;
    duration: string;
    totalHours?: number;
    schedule?: string;
    instructor: string;
    instructorBio?: string;
    venue?: string;
    venueAddress?: string;
    venueCapacity?: number;
    location?: string;
    price: number;
    currency: string;
    earlyBirdPrice?: number;
    earlyBirdDeadline?: string;
    promotions?: string;
    registrationLink?: string;
    paymentMethods?: string[];
    maxParticipants?: number;
    availableSpots?: number;
    waitlistEnabled?: boolean;
    materials?: string[];
    deliverables?: string[];
    certification?: string;
    requirements?: string[];
    contactInfo?: ContactInfo;
    // Commercial Fields
    benefits?: string[];
    painPoints?: string[];
    guarantee?: string;
    socialProof?: string[];
    faqs?: { question: string; answer: string }[];
    bonuses?: string[];
    callToAction?: string;
    idealStudentProfile?: string;
    competitiveAdvantage?: string;
    urgencyTriggers?: string[];
    objectionHandlers?: { objection: string; response: string }[];
    successStories?: { name: string; quote: string; result?: string }[];
    attachments?: Attachment[];
    tools?: string[];
    category: string;
    tags?: string[];
    status: 'borrador' | 'activo' | 'archivado';
    createdAt: string;
    updatedAt: string;
    aiSummary?: string;
    teamId?: string;
}

// === Asesoría (Consulting) ===
export interface Asesoria {
    id: string;
    code: string;
    title: string;
    subtitle?: string;
    description: string;
    objectives: string[];
    targetAudience: string;
    modality: 'online' | 'presencial' | 'hibrido';
    pricePerHour: number;
    currency: string;
    minimumHours: number;
    packageHours?: number;
    packagePrice?: number;
    promotions?: string;
    paymentMethods?: string[];
    advisor: string;
    advisorBio?: string;
    advisorTitle?: string;
    specialties?: string[];
    bookingLink?: string;
    registrationLink?: string;
    minAdvanceBooking?: string;
    availableSchedule?: string;
    sessionDuration?: string;
    topicsCovered?: string[];
    deliverables?: string[];
    requirements?: string[];
    contactInfo?: ContactInfo;
    needsDescription?: boolean;
    // Commercial Fields
    benefits?: string[];
    painPoints?: string[];
    guarantee?: string;
    socialProof?: string[];
    faqs?: { question: string; answer: string }[];
    bonuses?: string[];
    callToAction?: string;
    idealStudentProfile?: string;
    competitiveAdvantage?: string;
    urgencyTriggers?: string[];
    objectionHandlers?: { objection: string; response: string }[];
    successStories?: { name: string; quote: string; result?: string }[];
    attachments?: Attachment[];
    tools?: string[];
    location?: string;
    category: string;
    tags?: string[];
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
    category: 'onboarding' | 'content' | 'marketing' | 'analytics' | 'content-ia' | 'educational-ia';
    path: string;
}

// === Generated Content ===
export interface GeneratedContent {
    id: string;
    sourceId: string;
    sourceType: 'curso' | 'programa' | 'webinar' | 'taller' | 'subscripcion' | 'asesoria' | 'postulacion';
    toolId: string;
    content: string;
    createdAt: string;
}

export type CourseData = CursoLibre | Programa | Webinar | Taller | Asesoria;
