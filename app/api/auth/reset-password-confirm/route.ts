/**
 * POST /api/auth/reset-password-confirm
 *
 * Verifies that the OTP for this email was successfully validated,
 * then updates the user's password using Firebase Admin SDK.
 *
 * Body: { email: string, newPassword: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/app/lib/firebase-admin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, newPassword } = body;

        if (!email || !newPassword) {
            return NextResponse.json(
                { error: 'البريد الإلكتروني وكلمة المرور الجديدة مطلوبان' },
                { status: 400 }
            );
        }

        const normalizedEmail = email.toLowerCase().trim();
        const docId = normalizedEmail.replace(/[^a-z0-9]/g, '_');

        // 1. Fetch the OTP document
        const otpDoc = await adminDb.collection('otpCodes').doc(docId).get();

        if (!otpDoc.exists) {
            return NextResponse.json(
                { error: 'جلسة إعادة التعيين غير صالحة أو منتهية. يرجى البدء من جديد.' },
                { status: 400 }
            );
        }

        const otpData = otpDoc.data()!;

        // 2. Verify that it was successfully validated and not expired
        const expiresAt = otpData.expiresAt?.toDate?.() ?? new Date(otpData.expiresAt);
        if (Date.now() > expiresAt.getTime()) {
            await adminDb.collection('otpCodes').doc(docId).delete();
            return NextResponse.json(
                { error: 'انتهت صلاحية جلسة إعادة التعيين. يرجى البدء من جديد.' },
                { status: 400 }
            );
        }

        if (otpData.verified !== true || otpData.purpose !== 'reset_password') {
            return NextResponse.json(
                { error: 'لم يتم التحقق من الرمز المدخل بشكل صحيح.' },
                { status: 403 }
            );
        }

        // 3. Find the user by email
        let userRecord;
        try {
            userRecord = await adminAuth.getUserByEmail(normalizedEmail);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                return NextResponse.json(
                    { error: 'لم يتم العثور على الحساب.' },
                    { status: 404 }
                );
            }
            throw error;
        }

        // 4. Update the password
        await adminAuth.updateUser(userRecord.uid, {
            password: newPassword,
        });

        // 5. Delete the OTP document so it cannot be reused
        await adminDb.collection('otpCodes').doc(docId).delete();

        console.log(`[Password Reset] ✅ Successfully reset password for ${normalizedEmail.replace(/(.{2}).*(@.*)/, '$1***$2')}`);

        return NextResponse.json({
            success: true,
            message: 'تم إعادة تعيين كلمة المرور بنجاح',
        });
    } catch (error: any) {
        console.error('[Password Reset] Error:', error.message);
        return NextResponse.json(
            { error: 'حدث خطأ أثناء إعادة تعيين كلمة المرور' },
            { status: 500 }
        );
    }
}
