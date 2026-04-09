/**
 * Admin AI Dashboard API
 * GET — stats + user list (super_admin only)
 * POST — grant tokens to user
 * PATCH — suspend/unsuspend user
 */

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';

async function verifySuperAdmin(request: NextRequest): Promise<{ uid: string; email: string } | null> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;

    try {
        const token = authHeader.split('Bearer ')[1];
        const decoded = await adminAuth.verifyIdToken(token);
        const email = decoded.email || '';

        // Check if super_admin
        const adminDoc = await adminDb.collection('adminEmails').doc(email).get();
        if (!adminDoc.exists || adminDoc.data()?.role !== 'super_admin') {
            return null;
        }

        return { uid: decoded.uid, email };
    } catch {
        return null;
    }
}

// GET — Dashboard stats + user list
export async function GET(request: NextRequest) {
    const admin = await verifySuperAdmin(request);
    if (!admin) {
        return NextResponse.json({ error: 'غير مصرح — super_admin فقط' }, { status: 403 });
    }

    try {
        // Get all token accounts
        const accountsSnap = await adminDb.collection('aiTokenAccounts').get();
        const accounts: any[] = accountsSnap.docs.map(d => {
            const data = d.data();
            return {
                ...data,
                userId: d.id,
                lastUsed: data.lastUsed?.toDate?.()?.toISOString() || null,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
            };
        });

        // Calculate stats
        const totalUsers = accounts.length;
        const today = new Date().toISOString().split('T')[0];
        const activeToday = accounts.filter((a: any) => a.dailyResetDate === today && a.dailyRequestCount > 0).length;
        const depleted = accounts.filter((a: any) => (a.remainingTokens || 0) <= 0).length;
        const totalUsedTokens = accounts.reduce((sum: number, a: any) => sum + (a.usedTokens || 0), 0);
        const totalRemainingTokens = accounts.reduce((sum: number, a: any) => sum + (a.remainingTokens || 0), 0);

        // Top users by usage
        const topUsers = [...accounts]
            .sort((a: any, b: any) => (b.usedTokens || 0) - (a.usedTokens || 0))
            .slice(0, 10);

        // Abuse flags (users near daily limit)
        const abuseFlags = accounts.filter((a: any) =>
            a.dailyResetDate === today && a.dailyRequestCount >= 15
        );

        return NextResponse.json({
            stats: {
                totalUsers,
                activeToday,
                depleted,
                totalUsedTokens,
                totalRemainingTokens,
                todayDate: today,
            },
            accounts: accounts.sort((a: any, b: any) => (b.remainingTokens || 0) - (a.remainingTokens || 0)),
            topUsers,
            abuseFlags,
        });
    } catch (error: any) {
        console.error('Admin dashboard error:', error);
        return NextResponse.json({ error: 'خطأ في جلب البيانات' }, { status: 500 });
    }
}

// POST — Grant tokens to a user
export async function POST(request: NextRequest) {
    const admin = await verifySuperAdmin(request);
    if (!admin) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    try {
        const { userId, amount, reason } = await request.json();

        if (!userId || !amount || amount <= 0) {
            return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
        }

        const accountRef = adminDb.collection('aiTokenAccounts').doc(userId);
        const snap = await accountRef.get();

        if (!snap.exists) {
            return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
        }

        await accountRef.update({
            totalTokens: FieldValue.increment(amount),
            remainingTokens: FieldValue.increment(amount),
        });

        await adminDb.collection('aiTokenTransactions').add({
            userId,
            type: 'admin_grant',
            amount,
            description: reason || `منحة من الإدارة (${admin.email})`,
            timestamp: FieldValue.serverTimestamp(),
        });

        return NextResponse.json({ success: true, message: `تم إضافة ${amount} توكن` });
    } catch (error: any) {
        console.error('Grant tokens error:', error);
        return NextResponse.json({ error: 'خطأ في إضافة التوكنات' }, { status: 500 });
    }
}

// PATCH — Suspend/unsuspend user
export async function PATCH(request: NextRequest) {
    const admin = await verifySuperAdmin(request);
    if (!admin) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    try {
        const { userId, suspended } = await request.json();

        if (!userId || typeof suspended !== 'boolean') {
            return NextResponse.json({ error: 'بيانات غير صالحة' }, { status: 400 });
        }

        const accountRef = adminDb.collection('aiTokenAccounts').doc(userId);
        await accountRef.update({ suspended });

        return NextResponse.json({
            success: true,
            message: suspended ? 'تم إيقاف الحساب' : 'تم تفعيل الحساب',
        });
    } catch (error: any) {
        console.error('Suspend user error:', error);
        return NextResponse.json({ error: 'خطأ في تحديث الحالة' }, { status: 500 });
    }
}
