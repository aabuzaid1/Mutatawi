/**
 * POST /api/auth/first-login
 * 
 * إرسال إيميل ترحيبي عند أول تسجيل دخول — مرة واحدة فقط لكل مستخدم
 * 
 * الأمان:
 *   - يتحقق من Firebase ID Token عبر Authorization header
 *   - يستخدم Firestore flag لمنع الإرسال المتكرر (idempotency)
 * 
 * Body: لا يحتاج body (كل المعلومات تُقرأ من Token + Firestore)
 * Headers: Authorization: Bearer <idToken>
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';
import { sendWelcomeEmail } from '@/app/lib/email';

export async function POST(request: NextRequest) {
    try {
        // ========== 1. استخراج والتحقق من Token ==========
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
            console.error('[First Login API] Token verification failed:', error);
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        const uid = decodedToken.uid;
        console.log(`[First Login API] Processing for user: ${uid}`);

        // ========== 2. قراءة بيانات المستخدم من Firestore ==========
        const userRef = adminDb.collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            return NextResponse.json(
                { error: 'User profile not found in Firestore' },
                { status: 404 }
            );
        }

        const userData = userDoc.data()!;

        // ========== 3. التحقق من الإرسال السابق (Idempotency) ==========
        if (userData.firstLoginEmailSent === true) {
            console.log(`[First Login API] Email already sent for user: ${uid}`);
            return NextResponse.json({ alreadySent: true });
        }

        // ========== 4. تحديث الفلاج أولاً (قبل الإرسال لمنع race conditions) ==========
        await userRef.update({
            firstLoginEmailSent: true,
            firstLoginEmailSentAt: new Date(),
        });

        // ========== 5. إرسال الإيميل الترحيبي ==========
        const displayName = userData.displayName || 'مستخدم';
        const email = userData.email || decodedToken.email;
        const role = userData.role || 'volunteer';

        if (email) {
            try {
                await sendWelcomeEmail(displayName, email, role);
                console.log(`[First Login API] Welcome email sent to: ${email}`);
            } catch (emailError) {
                console.error('[First Login API] Failed to send email:', emailError);
                // لا نرجع الفلاج — الإيميل قد يُرسل لاحقاً
                // لكن نعلم المستخدم بالنجاح الجزئي
                return NextResponse.json({
                    success: true,
                    emailSent: false,
                    message: 'Flag updated but email failed to send',
                });
            }
        }

        return NextResponse.json({ success: true, emailSent: true });
    } catch (error: any) {
        console.error('[First Login API] Unexpected error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
