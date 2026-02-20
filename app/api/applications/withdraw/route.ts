/**
 * POST /api/applications/withdraw
 * 
 * سحب طلب تقديم متطوع — فقط إذا باقي 12 ساعة أو أكثر على موعد الفرصة
 * 
 * Body: { applicationId: string, opportunityId: string }
 * Headers: Authorization: Bearer <idToken>
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        // ========== 1. التحقق من Token ==========
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Missing or invalid Authorization header' },
                { status: 401 }
            );
        }

        const idToken = authHeader.split('Bearer ')[1];
        let decodedToken;
        try {
            decodedToken = await adminAuth.verifyIdToken(idToken);
        } catch {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        const userId = decodedToken.uid;

        // ========== 2. قراءة Body ==========
        const body = await request.json();
        const { applicationId, opportunityId } = body;

        if (!applicationId || !opportunityId) {
            return NextResponse.json(
                { error: 'applicationId and opportunityId are required' },
                { status: 400 }
            );
        }

        // ========== 3. التحقق من أن الطلب موجود وملك المستخدم ==========
        const appRef = adminDb.collection('applications').doc(applicationId);
        const appDoc = await appRef.get();

        if (!appDoc.exists) {
            return NextResponse.json(
                { error: 'الطلب غير موجود' },
                { status: 404 }
            );
        }

        const appData = appDoc.data()!;
        if (appData.volunteerId !== userId) {
            return NextResponse.json(
                { error: 'ليس لديك صلاحية لسحب هذا الطلب' },
                { status: 403 }
            );
        }

        // ========== 4. التحقق من شرط 12 ساعة ==========
        const oppDoc = await adminDb.collection('opportunities').doc(opportunityId).get();
        if (!oppDoc.exists) {
            return NextResponse.json(
                { error: 'الفرصة غير موجودة' },
                { status: 404 }
            );
        }

        const oppData = oppDoc.data()!;
        const oppDateStr = oppData.date; // e.g. "2026-03-01"
        const oppStartTime = oppData.startTime; // e.g. "09:00"

        // بناء تاريخ الفرصة
        let oppDateTime: Date;
        if (oppDateStr && oppStartTime) {
            oppDateTime = new Date(`${oppDateStr}T${oppStartTime}:00`);
        } else if (oppDateStr) {
            oppDateTime = new Date(`${oppDateStr}T00:00:00`);
        } else {
            // إذا ما في تاريخ، نسمح بالانسحاب
            oppDateTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
        }

        const now = new Date();
        const hoursRemaining = (oppDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursRemaining < 12) {
            return NextResponse.json(
                { error: 'لا يمكن الانسحاب قبل أقل من 12 ساعة من موعد الفرصة' },
                { status: 400 }
            );
        }

        // ========== 5. حذف الطلب وتقليل عدد المقاعد ==========
        await appRef.delete();
        await adminDb.collection('opportunities').doc(opportunityId).update({
            spotsFilled: FieldValue.increment(-1),
        });

        console.log(`[Withdraw API] User ${userId} withdrew from opportunity ${opportunityId}`);

        return NextResponse.json({
            success: true,
            message: 'تم سحب طلبك بنجاح',
        });
    } catch (error: any) {
        console.error('[Withdraw API] Unexpected error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
