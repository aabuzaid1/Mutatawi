/**
 * Admin Configuration — Client-side
 * ✅ يستخدم API Route مع دعم المستويات (super_admin, editor, creator)
 */

import { auth } from './firebase';

export type AdminRole = 'super_admin' | 'editor' | 'creator';

export interface AdminEntry {
    email: string;
    role: AdminRole;
}

// Fallback email (أول إيميل أساسي)
const FALLBACK_ADMIN_EMAIL = 'aabuzaid242@gmail.com';

// ── Cache ────────────────────────────────────────────
let cachedAdmins: AdminEntry[] | null = null;
let cachedCallerRole: AdminRole | null = null;
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
 * جلب قائمة المشرفين مع مستوياتهم من السيرفر
 */
export async function getAdminEmails(): Promise<string[]> {
    const admins = await getAdminList();
    return admins.map(a => a.email);
}

export async function getAdminList(): Promise<AdminEntry[]> {
    try {
        const headers = await getAuthHeader();
        const res = await fetch('/api/admin/emails', { headers });
        if (!res.ok) throw new Error('Failed to fetch admin list');
        const data = await res.json();
        cachedAdmins = data.admins || [];
        cachedCallerRole = data.callerRole || null;
        cacheTimestamp = Date.now();
        return cachedAdmins!;
    } catch (error) {
        console.error('Error fetching admin list:', error);
        return [{ email: FALLBACK_ADMIN_EMAIL, role: 'super_admin' }];
    }
}

/**
 * الحصول على مستوى المستخدم الحالي
 */
export function getCallerRole(): AdminRole | null {
    return cachedCallerRole;
}

/**
 * التحقق مما إذا كان الإيميل يملك صلاحيات الأدمن (أي مستوى)
 */
export async function checkIsAdmin(email: string | null | undefined): Promise<boolean> {
    if (!email) return false;
    const admins = await getAdminList();
    return admins.some(a => a.email === email.toLowerCase());
}

/**
 * تحميل وتخزين الإيميلات (مع كاش)
 */
export async function loadAdminEmails(): Promise<string[]> {
    const now = Date.now();
    if (cachedAdmins && (now - cacheTimestamp) < CACHE_DURATION) {
        return cachedAdmins.map(a => a.email);
    }
    return await getAdminEmails();
}

/**
 * نسخة متزامنة للتحقق السريع من الكاش
 */
export function isAdmin(email: string | null | undefined): boolean {
    if (!email) return false;
    if (cachedAdmins) {
        return cachedAdmins.some(a => a.email === email.toLowerCase());
    }
    return email.toLowerCase() === FALLBACK_ADMIN_EMAIL;
}

/**
 * الحصول على مستوى إيميل معين
 */
export function getAdminRole(email: string | null | undefined): AdminRole | null {
    if (!email || !cachedAdmins) return null;
    const admin = cachedAdmins.find(a => a.email === email.toLowerCase());
    return admin?.role || null;
}

/**
 * هل المستخدم super_admin؟
 */
export function isSuperAdmin(email: string | null | undefined): boolean {
    if (!email) return false;
    if (email.toLowerCase() === FALLBACK_ADMIN_EMAIL) return true;
    return getAdminRole(email) === 'super_admin';
}

/**
 * هل يقدر يعدل كل الكورسات؟ (super_admin + editor)
 */
export function canEditAllCourses(email: string | null | undefined): boolean {
    const role = getAdminRole(email);
    return role === 'super_admin' || role === 'editor';
}

/**
 * إضافة مشرف جديد (عبر السيرفر) — مع مستوى
 */
export async function addAdminEmail(email: string, role: AdminRole = 'creator'): Promise<void> {
    const headers = await getAuthHeader();
    const res = await fetch('/api/admin/emails', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: email.toLowerCase().trim(), role }),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'حدث خطأ');
    }
    // Reset cache
    cachedAdmins = null;
    cachedCallerRole = null;
}

/**
 * حذف مشرف (عبر السيرفر)
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
    cachedAdmins = null;
    cachedCallerRole = null;
}

/**
 * تهيئة الإيميل الأساسي — الآن يتم تلقائياً من السيرفر
 */
export async function initAdminEmails(): Promise<void> {
    // No-op: السيرفر يضمن وجود FALLBACK_ADMIN_EMAIL دائماً
}
