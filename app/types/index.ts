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
export interface Lesson {
    title: string;
    type: 'video' | 'activity';
    youtubeVideoId?: string;      // For video lessons
    activityImageUrl?: string;    // For activity lessons (image URL)
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
    level: 'مبتدئ' | 'متوسط' | 'متقدم';
    lessons: Lesson[];
    createdAt: Date;
}

export type CourseCategory = 'قيادة' | 'تقنية' | 'تواصل' | 'إسعافات' | 'تطوير ذات' | 'أخرى';

export interface CourseProgress {
    id: string;
    courseId: string;
    volunteerId: string;
    completedLessons: number[]; // indices of completed lessons
    completedAt: Date | null;
}
