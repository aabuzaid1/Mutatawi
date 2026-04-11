// User types
export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    role: 'volunteer' | 'organization';
    phone?: string;
    bio?: string;
    location?: string;
    skills?: string[];
    interests?: string[];
    // Organization specific
    organizationName?: string;
    website?: string;
    verified?: boolean;
    emailNotifications?: boolean;
    // Stats
    hoursVolunteered?: number;
    opportunitiesCompleted?: number;
    opportunitiesPosted?: number;
    createdAt: Date;
    updatedAt: Date;
}

// Opportunity types
export interface Opportunity {
    id: string;
    title: string;
    description: string;
    shortDescription: string;
    organizationId: string;
    organizationName: string;
    organizationLogo?: string;
    category: OpportunityCategory;
    location: string;
    isRemote: boolean;
    date: string;
    startTime: string;
    endTime: string;
    duration: number; // in hours
    spotsTotal: number;
    spotsFilled: number;
    skills: string[];
    requirements: string[];
    benefits: string[];
    status: 'open' | 'closed' | 'completed';
    featured: boolean;
    imageUrl?: string;
    imagePosition?: string;
    createdAt: Date;
    updatedAt: Date;
}

export type OpportunityCategory =
    | 'تعليم'
    | 'صحة'
    | 'بيئة'
    | 'مجتمع'
    | 'تقنية'
    | 'رياضة'
    | 'ثقافة'
    | 'إغاثة';

// Application types
export interface Application {
    id: string;
    opportunityId: string;
    opportunityTitle: string;
    volunteerId: string;
    volunteerName: string;
    volunteerEmail: string;
    volunteerPhone?: string;
    message: string;
    status: 'pending' | 'accepted' | 'rejected' | 'deleted';
    appliedAt: Date;
    updatedAt: Date;
}

// Feedback types (from volunteers after completing opportunities)
export interface Feedback {
    id: string;
    opportunityId: string;
    opportunityTitle: string;
    volunteerId: string;
    volunteerName: string;
    volunteerAvatar?: string;
    rating: number;
    comment: string;
    imageUrl?: string;
    createdAt: Date;
}

// Filter types
export interface OpportunityFilters {
    category?: OpportunityCategory;
    location?: string;
    isRemote?: boolean;
    status?: 'open' | 'closed' | 'completed';
    search?: string;
}

// Course types
export interface QuizQuestion {
    question: string;
    options: string[];
    correctIndex: number;
    explanation?: string;
}

export interface Lesson {
    title: string;
    type: 'video' | 'activity' | 'quiz';
    youtubeVideoId?: string;      // For video lessons
    videoUrl?: string;            // For uploaded video lessons
    activityImageUrl?: string;    // For activity lessons (image URL)
    activityText?: string;        // Text content for activity
    questions?: QuizQuestion[];   // For quiz lessons
    duration: string; // e.g. "12:34"
    order: number;
    section?: string;             // Section name (e.g., "Gmail", "Google Calendar")
}

export interface Course {
    id: string;
    title: string;
    description: string;
    category: CourseCategory;
    thumbnail: string;
    totalLessons: number;
    totalDuration: string;
    level: 'مبتدئ' | 'متوسط' | 'متقدم' | '';
    lessons: Lesson[];
    status: 'draft' | 'published';
    createdBy?: string; // UID of the admin who created this course
    createdAt: Date;
}

export type CourseCategory =
    | 'جامعة العلوم التطبيقية'
    | 'جامعة الزيتونة'
    | 'الجامعة الأردنية'
    | 'جامعة الإسراء'
    | 'جامعة البترا'
    | 'جامعة البلقاء التطبيقية'
    | 'تنمية شخصية'
    | 'تقنية'
    | 'أخرى';

export interface CourseProgress {
    id: string;
    courseId: string;
    volunteerId: string;
    completedLessons: number[]; // indices of completed lessons
    completedAt: Date | null;
}

// ===================== AI AGENT TYPES =====================

export type StudyMode = 'chat' | 'explain' | 'summarize' | 'quiz' | 'flashcards' | 'doc' | 'slides' | 'sheet';

export type TokenTransactionType = 'initial' | 'volunteer' | 'course' | 'referral' | 'admin_grant' | 'usage';

export interface AITokenAccount {
    userId: string;
    email: string;
    displayName: string;
    totalTokens: number;
    usedTokens: number;
    remainingTokens: number;
    dailyRequestCount: number;
    dailyResetDate: string;       // YYYY-MM-DD
    lastUsed: Date | null;
    createdAt: Date;
    suspended: boolean;
}

export interface TokenTransaction {
    id: string;
    userId: string;
    type: TokenTransactionType;
    amount: number;               // positive = credit, negative = debit
    description: string;
    timestamp: Date;
    referenceId?: string;
}

export interface AIConversation {
    id: string;
    userId: string;
    title: string;
    messageCount: number;
    tokensUsed: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface AIMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    type: StudyMode;
    attachments?: string[];
    tokensUsed?: number;
    timestamp: Date;
    structuredData?: AIDocOutput | AISlidesOutput | AISheetsOutput | AIQuizOutput | AIFlashcardsOutput;
}

// Structured AI outputs
export interface AIDocOutput {
    title: string;
    sections: Array<{
        heading: string;
        content: string;
        imagePrompt: string;
        imageBase64?: string;
        imageUrl?: string;
    }>;
}

export interface AISlidesOutput {
    title: string;
    slides: Array<{
        title: string;
        points: string[];
        notes?: string;
        imagePrompt: string;
        imageBase64?: string;
        imageUrl?: string;
    }>;
}

export interface AISheetsOutput {
    title: string;
    columns: string[];
    rows: string[][];
}

export interface AIQuizOutput {
    title: string;
    questions: Array<{
        question: string;
        options: string[];
        correctIndex: number;
        explanation: string;
    }>;
}

export interface AIFlashcardsOutput {
    title: string;
    cards: Array<{
        front: string;
        back: string;
    }>;
}

export interface AIReferral {
    id: string;
    inviterUserId: string;
    inviterEmail: string;
    invitedEmail: string;
    status: 'pending' | 'completed';
    createdAt: Date;
    completedAt?: Date;
}
