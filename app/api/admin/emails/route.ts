/**
 * Admin Emails Management API
 * 
 * GET  /api/admin/emails — جلب قائمة الإيميلات المصرح لها
 * POST /api/admin/emails — إضافة إيميل جديد
 * DELETE /api/admin/emails — حذف إيميل
 * 
 * الأمان:
 *   - يتحقق من Firebase ID Token
 *   - يتحقق أن المستخدم أدمن حالياً (server-side check)
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';

export const runtime = 'nodejs';

const FALLBACK_ADMIN_EMAIL = 'aabuzaid242@gmail.com';
const COLLECTION = 'adminEmails';

// ── Helper: verify token and check admin ──────────────
async function verifyAdmin(request: NextRequest) {
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

    // Check if caller is admin by querying Firestore server-side
    const snapshot = await adminDb.collection(COLLECTION).get();
    const adminEmails = snapshot.docs.map(d => (d.data().email as string).toLowerCase());
    if (!adminEmails.includes(FALLBACK_ADMIN_EMAIL)) {
        adminEmails.push(FALLBACK_ADMIN_EMAIL);
    }

    const callerEmail = decodedToken.email?.toLowerCase();
    if (!callerEmail || !adminEmails.includes(callerEmail)) {
        return { error: 'Unauthorized: not an admin', status: 403 };
    }

    return { decodedToken, adminEmails };
}

// ── GET: fetch admin emails ───────────────────────────
export async function GET(request: NextRequest) {
    try {
        const result = await verifyAdmin(request);
        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }

        return NextResponse.json({ emails: result.adminEmails });
    } catch (error: any) {
        console.error('[Admin Emails API] GET error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ── POST: add admin email ─────────────────────────────
export async function POST(request: NextRequest) {
    try {
        const result = await verifyAdmin(request);
        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }

        const body = await request.json();
        const email = body.email?.toLowerCase()?.trim();

        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return NextResponse.json({ error: 'إيميل غير صالح' }, { status: 400 });
        }

        if (result.adminEmails.includes(email)) {
            return NextResponse.json({ error: 'هذا الإيميل مضاف مسبقاً' }, { status: 409 });
        }

        await adminDb.collection(COLLECTION).add({ email });
        console.log(`[Admin Emails API] Added: ${email}`);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Admin Emails API] POST error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// ── DELETE: remove admin email ────────────────────────
export async function DELETE(request: NextRequest) {
    try {
        const result = await verifyAdmin(request);
        if ('error' in result) {
            return NextResponse.json({ error: result.error }, { status: result.status });
        }

        const body = await request.json();
        const email = body.email?.toLowerCase()?.trim();

        if (!email) {
            return NextResponse.json({ error: 'إيميل مطلوب' }, { status: 400 });
        }

        if (email === FALLBACK_ADMIN_EMAIL) {
            return NextResponse.json({ error: 'لا يمكن حذف الإيميل الأساسي' }, { status: 403 });
        }

        const q = adminDb.collection(COLLECTION).where('email', '==', email);
        const snapshot = await q.get();
        const deletePromises = snapshot.docs.map(d => d.ref.delete());
        await Promise.all(deletePromises);

        console.log(`[Admin Emails API] Removed: ${email}`);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Admin Emails API] DELETE error:', error.message);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
