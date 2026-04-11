/**
 * Token Balance & History API
 * GET /api/ai/tokens — get user's token balance
 * POST /api/ai/tokens — initialize token account (if new)
 */

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';

const INITIAL_TOKENS = 50000;

async function verifyAuth(request: NextRequest) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    try {
        const token = authHeader.split('Bearer ')[1];
        const decoded = await adminAuth.verifyIdToken(token);
        return { uid: decoded.uid, email: decoded.email || '' };
    } catch {
        return null;
    }
}

// GET — get token balance + recent history
export async function GET(request: NextRequest) {
    const auth = await verifyAuth(request);
    if (!auth) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    try {
        const accountRef = adminDb.collection('aiTokenAccounts').doc(auth.uid);
        const snap = await accountRef.get();

        if (!snap.exists) {
            return NextResponse.json({ account: null, history: [] });
        }

        const data = snap.data()!;
        const todayStr = new Date().toISOString().split('T')[0];
        const today = new Date();

        // Check for weekly renewal (every 7 days)
        const lastRenewal = data.lastRenewalDate ? new Date(data.lastRenewalDate) : (data.createdAt?.toDate?.() || today);
        const daysSinceRenewal = Math.floor((today.getTime() - lastRenewal.getTime()) / (1000 * 60 * 60 * 24));

        let needsRenewal = false;
        let renewalAmount = 0;
        if (daysSinceRenewal >= 7 || !data.lastRenewalDate) {
            const newRemaining = Math.max(data.remainingTokens, INITIAL_TOKENS);
            renewalAmount = newRemaining - data.remainingTokens;
            needsRenewal = true;
            data.remainingTokens = newRemaining;
        }

        // Reset daily count if new day OR if we need renewal
        if (data.dailyResetDate !== todayStr || needsRenewal) {
            const updates: any = {};
            if (data.dailyResetDate !== todayStr) {
                updates.dailyRequestCount = 0;
                updates.dailyResetDate = todayStr;
                data.dailyRequestCount = 0;
                data.dailyResetDate = todayStr;
            }
            if (needsRenewal) {
                updates.remainingTokens = data.remainingTokens;
                updates.lastRenewalDate = todayStr;
                data.lastRenewalDate = todayStr;
                
                if (renewalAmount > 0) {
                    await adminDb.collection('aiTokenTransactions').add({
                        userId: auth.uid,
                        type: 'admin_grant',
                        amount: renewalAmount,
                        description: 'تجديد الرصيد الأسبوعي مجاناً',
                        timestamp: FieldValue.serverTimestamp(),
                    });
                }
            }
            await accountRef.update(updates);
        }

        // Get recent history (simple query to avoid composite index requirement)
        let history: any[] = [];
        try {
            const historySnap = await adminDb.collection('aiTokenTransactions')
                .where('userId', '==', auth.uid)
                .limit(50)
                .get();

            history = historySnap.docs.map(d => ({
                id: d.id,
                ...d.data(),
                timestamp: d.data().timestamp?.toDate?.()?.toISOString() || new Date().toISOString(),
            }));
            // Sort client-side to avoid composite index
            history.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            history = history.slice(0, 20);
        } catch (historyError) {
            console.warn('Could not fetch token history:', historyError);
            // Continue without history
        }

        return NextResponse.json({
            account: {
                ...data,
                lastUsed: data.lastUsed?.toDate?.()?.toISOString() || null,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            },
            history,
        });
    } catch (error: any) {
        console.error('Token API error:', error);
        return NextResponse.json({ error: 'خطأ في جلب البيانات' }, { status: 500 });
    }
}

// POST — initialize token account for new user
export async function POST(request: NextRequest) {
    const auth = await verifyAuth(request);
    if (!auth) {
        return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    try {
        const accountRef = adminDb.collection('aiTokenAccounts').doc(auth.uid);
        const snap = await accountRef.get();

        if (snap.exists) {
            return NextResponse.json({
                message: 'الحساب موجود مسبقاً',
                account: snap.data(),
            });
        }

        // Get user profile for display name
        const body = await request.json().catch(() => ({}));
        const displayName = body.displayName || auth.email?.split('@')[0] || 'مستخدم';

        const account = {
            userId: auth.uid,
            email: auth.email,
            displayName,
            totalTokens: INITIAL_TOKENS,
            usedTokens: 0,
            remainingTokens: INITIAL_TOKENS,
            dailyRequestCount: 0,
            dailyResetDate: new Date().toISOString().split('T')[0],
            lastRenewalDate: new Date().toISOString().split('T')[0],
            lastUsed: null,
            createdAt: FieldValue.serverTimestamp(),
            suspended: false,
        };

        await accountRef.set(account);

        await adminDb.collection('aiTokenTransactions').add({
            userId: auth.uid,
            type: 'initial',
            amount: INITIAL_TOKENS,
            description: 'رصيد ترحيبي أولي',
            timestamp: FieldValue.serverTimestamp(),
        });

        return NextResponse.json({
            message: 'تم إنشاء الحساب بنجاح',
            account: { ...account, createdAt: new Date().toISOString() },
        });
    } catch (error: any) {
        console.error('Token init error:', error);
        return NextResponse.json({ error: 'خطأ في إنشاء الحساب' }, { status: 500 });
    }
}
