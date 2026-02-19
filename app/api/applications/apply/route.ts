/**
 * POST /api/applications/apply
 * 
 * تقديم متطوع على فرصة تطوعية + إرسال إيميلات
 * 
 * الأمان:
 *   - يتحقق من Firebase ID Token
 *   - يمنع التقديم المكرر (composite doc ID)
 *   - يتحقق أن المستخدم هو المتطوع الفعلي
 * 
 * Body: { opportunityId: string, message: string, phone?: string }
 * Headers: Authorization: Bearer <idToken>
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import {
    sendApplicationConfirmation,
    sendNewApplicationNotification,
} from '@/app/lib/email';

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
        } catch (error) {
            console.error('[Apply API] Token verification failed:', error);
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        const volunteerId = decodedToken.uid;

        // ========== 2. قراءة Body ==========
        const body = await request.json();
        const { opportunityId, message, phone } = body;

        if (!opportunityId || !message) {
            return NextResponse.json(
                { error: 'opportunityId and message are required' },
                { status: 400 }
            );
        }

        console.log(`[Apply API] Volunteer ${volunteerId} applying for opportunity ${opportunityId}`);

        // ========== 3. منع التقديم المكرر (Composite Document ID) ==========
        const applicationDocId = `${opportunityId}_${volunteerId}`;
        const applicationRef = adminDb.collection('applications').doc(applicationDocId);
        const existingApp = await applicationRef.get();

        if (existingApp.exists) {
            return NextResponse.json(
                { error: 'لقد تقدمت لهذه الفرصة مسبقاً' },
                { status: 409 }
            );
        }

        // ========== 4. جلب بيانات الفرصة ==========
        const oppDoc = await adminDb.collection('opportunities').doc(opportunityId).get();
        if (!oppDoc.exists) {
            return NextResponse.json(
                { error: 'الفرصة غير موجودة' },
                { status: 404 }
            );
        }
        const oppData = oppDoc.data()!;
        const opportunityTitle = oppData.title;
        const organizationId = oppData.organizationId;

        // ========== 5. جلب بيانات المتطوع ==========
        const volunteerDoc = await adminDb.collection('users').doc(volunteerId).get();
        if (!volunteerDoc.exists) {
            return NextResponse.json(
                { error: 'بيانات المتطوع غير موجودة' },
                { status: 404 }
            );
        }
        const volunteerData = volunteerDoc.data()!;
        const volunteerName = volunteerData.displayName || 'متطوع';
        const volunteerEmail = volunteerData.email || decodedToken.email || '';

        // ========== 6. جلب بيانات المنظمة ==========
        const orgDoc = await adminDb.collection('users').doc(organizationId).get();
        const orgData = orgDoc.exists ? orgDoc.data()! : null;
        const orgEmail = orgData?.email || '';
        const orgName = orgData?.displayName || oppData.organizationName || 'المنظمة';

        // ========== 7. إنشاء طلب التقديم ==========
        const applicationData: Record<string, any> = {
            opportunityId,
            opportunityTitle,
            volunteerId,
            volunteerName,
            volunteerEmail,
            message,
            status: 'pending',
            appliedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        };

        // إضافة الهاتف فقط إذا تم تقديمه
        if (phone) {
            applicationData.volunteerPhone = phone;
        }

        await applicationRef.set(applicationData);
        console.log(`[Apply API] Application created: ${applicationDocId}`);

        // ========== 8. زيادة عدد المقاعد المملوءة ==========
        await adminDb.collection('opportunities').doc(opportunityId).update({
            spotsFilled: FieldValue.increment(1),
        });

        // ========== 9. إرسال الإيميلات (fire-and-forget — لا تؤخر الاستجابة) ==========
        const emailPromises: Promise<void>[] = [];

        // (A) إيميل تأكيد للمتطوع
        if (volunteerEmail) {
            emailPromises.push(
                sendApplicationConfirmation(volunteerName, volunteerEmail, opportunityTitle)
                    .then(() => console.log(`[Apply API] Confirmation email sent to volunteer: ${volunteerEmail}`))
                    .catch((err) => console.error('[Apply API] Failed to send volunteer email:', err))
            );
        }

        // (B) إيميل إشعار للمنظمة
        if (orgEmail) {
            emailPromises.push(
                sendNewApplicationNotification(orgEmail, orgName, volunteerName, opportunityTitle)
                    .then(() => console.log(`[Apply API] Notification email sent to org: ${orgEmail}`))
                    .catch((err) => console.error('[Apply API] Failed to send org email:', err))
            );
        }

        // انتظار الإيميلات (لكن لا نفشل إذا فشلت)
        await Promise.allSettled(emailPromises);

        return NextResponse.json({
            success: true,
            applicationId: applicationDocId,
        });
    } catch (error: any) {
        console.error('[Apply API] Unexpected error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
