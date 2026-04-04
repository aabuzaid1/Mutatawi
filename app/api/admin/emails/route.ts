/**
 * Admin Emails Management API — With Role Levels
 * 
 * GET  /api/admin/emails — جلب قائمة المشرفين مع مستوياتهم
 * POST /api/admin/emails — إضافة مشرف جديد (مع مستوى + إيميل ترحيبي)
 * DELETE /api/admin/emails — حذف مشرف
 * 
 * المستويات:
 *   super_admin — يقدر يعمل كل شي (إضافة مشرفين + تعديل كل الكورسات)
 *   editor      — يعدل كل الكورسات بس ما يقدر يضيف مشرفين
 *   creator     — ينشئ كورسات ويعدل بس كورساته
 * 
 * الأمان:
 *   - يتحقق من Firebase ID Token
 *   - فقط super_admin يقدر يضيف/يحذف مشرفين
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';
import { sendAdminInviteEmail } from '@/app/lib/email';

export const runtime = 'nodejs';

const FALLBACK_ADMIN_EMAIL = 'aabuzaid242@gmail.com';
const COLLECTION = 'adminEmails';

type AdminRole = 'super_admin' | 'editor' | 'creator';

interface AdminEntry {
    email: string;
    role: AdminRole;
}

// ── Helper: verify token and get admin list ──────────────
async function getAdminData(request: NextRequest) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return { error: 'Missing or invalid Authorization header', status: 401 };
    }

    const idToken = authHeader.split('Bearer ')[1];
    let decodedToken;
    try {
        decodedToken = await adminAuth.verifyIdToken(idToken);
    } catch {
        return { error: 'Invalid or expired token', status: 401 };
    }

    // Fetch all admin entries with roles (doc ID = email)
    const snapshot = await adminDb.collection(COLLECTION).get();
    const admins: AdminEntry[] = snapshot.docs.map(d => ({
        email: d.id,
        role: (d.data().role as AdminRole) || 'creator',
    }));

    // Ensure fallback admin exists as super_admin
    const fallbackDoc = await adminDb.collection(COLLECTION).doc(FALLBACK_ADMIN_EMAIL).get();
    if (!fallbackDoc.exists) {
        await adminDb.collection(COLLECTION).doc(FALLBACK_ADMIN_EMAIL).set({ role: 'super_admin' });
        admins.push({ email: FALLBACK_ADMIN_EMAIL, role: 'super_admin' });
    } else if (!admins.find(a => a.email === FALLBACK_ADMIN_EMAIL)) {
        admins.push({ email: FALLBACK_ADMIN_EMAIL, role: 'super_admin' });
    }

    const callerEmail = decodedToken.email?.toLowerCase();
    const callerAdmin = admins.find(a => a.email === callerEmail);

    if (!callerEmail || !callerAdmin) {
        return { error: 'Unauthorized: not an admin', status: 403 };
    }

    return { decodedToken, admins, callerAdmin, callerEmail };
}

// ── GET: fetch admin list with roles ───────────────────────────
export async function GET(request: NextRequest) {
    try {
        const result = await getAdminData(request);
        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }

        return NextResponse.json({
            emails: result.admins.map(a => a.email),
            admins: result.admins,
            callerRole: result.callerAdmin.role,
        });
    } catch (error: any) {
        console.error('[Admin Emails API] GET error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ── POST: add admin with role + send invite email ─────────────
export async function POST(request: NextRequest) {
    try {
        const result = await getAdminData(request);
        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }

        // Only super_admin can add new admins
        if (result.callerAdmin.role !== 'super_admin') {
            return NextResponse.json({ error: 'غير مصرح: فقط المدير العام يقدر يضيف مشرفين' }, { status: 403 });
        }

        const body = await request.json();
        const email = body.email?.toLowerCase()?.trim();
        const role: AdminRole = body.role || 'creator';

        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return NextResponse.json({ error: 'إيميل غير صالح' }, { status: 400 });
        }

        if (!['super_admin', 'editor', 'creator'].includes(role)) {
            return NextResponse.json({ error: 'مستوى غير صالح' }, { status: 400 });
        }

        if (result.admins.find(a => a.email === email)) {
            return NextResponse.json({ error: 'هذا الإيميل مضاف مسبقاً' }, { status: 409 });
        }

        await adminDb.collection(COLLECTION).doc(email).set({ role });
        console.log(`[Admin Emails API] Added: ${email} as ${role}`);

        // Send invite email (fire-and-forget)
        sendAdminInviteEmail(email, role).catch(err => {
            console.error('[Admin Emails API] Failed to send invite email:', err.message);
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Admin Emails API] POST error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ── DELETE: remove admin email ────────────────────────
export async function DELETE(request: NextRequest) {
    try {
        const result = await getAdminData(request);
        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }

        // Only super_admin can remove admins
        if (result.callerAdmin.role !== 'super_admin') {
            return NextResponse.json({ error: 'غير مصرح: فقط المدير العام يقدر يحذف مشرفين' }, { status: 403 });
        }

        const body = await request.json();
        const email = body.email?.toLowerCase()?.trim();

        if (!email) {
            return NextResponse.json({ error: 'إيميل مطلوب' }, { status: 400 });
        }

        if (email === FALLBACK_ADMIN_EMAIL) {
            return NextResponse.json({ error: 'لا يمكن حذف المدير العام الأساسي' }, { status: 403 });
        }

        await adminDb.collection(COLLECTION).doc(email).delete();

        console.log(`[Admin Emails API] Removed: ${email}`);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Admin Emails API] DELETE error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
