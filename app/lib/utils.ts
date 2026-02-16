// Simple classname merger
export function cn(...inputs: any[]): string {
    return inputs.filter(Boolean).join(' ');
}

// Format date to Arabic
export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

// Format relative time in Arabic
export function formatRelativeTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 30) return `منذ ${days} يوم`;
    return formatDate(d);
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
}

// Generate initials from name
export function getInitials(name: string): string {
    return name
        .split(' ')
        .map((word) => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
}

// Category colors mapping
export const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
    'تعليم': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    'صحة': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    'بيئة': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
    'مجتمع': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    'تقنية': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    'رياضة': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    'ثقافة': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
    'إغاثة': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
};
