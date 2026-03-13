/**
 * Admin Configuration — Client-side
 * ✅ يستخدم API Route بدل Firestore مباشرة للحماية من التلاعب
 */

import { auth } from './firebase';

// Fallback email (أول إيميل أساسي)
const FALLBACK_ADMIN_EMAIL = 'aabuzaid242@gmail.com';

// ── Cache ────────────────────────────────────────────
let cachedAdminEmails: string[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 دقائق

/** Helper: get Authorization header */
async function getAuthHeader(): Promise<HeadersInit> {
    const user = auth.currentUser;
    if (!user) throw new Error('غير مسجل الدخول');
    const token = await user.getIdToken();
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    };
}

/**
 * جلب قائمة الإيميلات المصرح لها من السيرفر
 */
export async function getAdminEmails(): Promise<string[]> {
    try {
        const headers = await getAuthHeader();
        const res = await fetch('/api/admin/emails', { headers });
        if (!res.ok) throw new Error('Failed to fetch admin emails');
        const data = await res.json();
        cachedAdminEmails = data.emails;
        cacheTimestamp = Date.now();
        return data.emails;
    } catch (error) {
        console.error('Error fetching admin emails:', error);
        return [FALLBACK_ADMIN_EMAIL];
    }
}

/**
 * التحقق مما إذا كان الإيميل يملك صلاحيات الأدمن
 */
export async function checkIsAdmin(email: string | null | undefined): Promise<boolean> {
    if (!email) return false;
    const emails = await getAdminEmails();
    return emails.includes(email.toLowerCase());
}

/**
 * تحميل وتخزين الإيميلات (مع كاش)
 */
export async function loadAdminEmails(): Promise<string[]> {
    const now = Date.now();
    if (cachedAdminEmails && (now - cacheTimestamp) < CACHE_DURATION) {
        return cachedAdminEmails;
    }
    return await getAdminEmails();
}

/**
 * نسخة متزامنة للتحقق السريع من الكاش
 */
export function isAdmin(email: string | null | undefined): boolean {
    if (!email) return false;
    if (cachedAdminEmails) {
        return cachedAdminEmails.includes(email.toLowerCase());
    }
    return email.toLowerCase() === FALLBACK_ADMIN_EMAIL;
}

/**
 * إضافة إيميل أدمن جديد (عبر السيرفر)
 */
export async function addAdminEmail(email: string): Promise<void> {
    const headers = await getAuthHeader();
    const res = await fetch('/api/admin/emails', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'حدث خطأ');
    }
    // Reset cache
    cachedAdminEmails = null;
}

/**
 * حذف إيميل أدمن (عبر السيرفر)
 */
export async function removeAdminEmail(email: string): Promise<void> {
    const headers = await getAuthHeader();
    const res = await fetch('/api/admin/emails', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ email: email.toLowerCase() }),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'حدث خطأ');
    }
    // Reset cache
    cachedAdminEmails = null;
}

/**
 * تهيئة الإيميل الأساسي — الآن يتم تلقائياً من السيرفر
 */
export async function initAdminEmails(): Promise<void> {
    // No-op: السيرفر يضمن وجود FALLBACK_ADMIN_EMAIL دائماً
}
