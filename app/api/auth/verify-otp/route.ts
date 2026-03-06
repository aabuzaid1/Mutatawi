/**
 * POST /api/auth/verify-otp
 *
 * Verifies the OTP code entered by the user.
 * Max 5 attempts per code. Deletes code after successful verification.
 *
 * Body: { email: string, code: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebase-admin';

export const runtime = 'nodejs';

const MAX_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, code, keepAlive } = body;

        if (!email || !code) {
            return NextResponse.json(
                { error: 'البريد الإلكتروني والرمز مطلوبان' },
                { status: 400 }
            );
        }

        const normalizedEmail = email.toLowerCase().trim();
        const docId = normalizedEmail.replace(/[^a-z0-9]/g, '_');

        const otpDoc = await adminDb.collection('otpCodes').doc(docId).get();

        if (!otpDoc.exists) {
            return NextResponse.json(
                { valid: false, error: 'لم يتم إرسال رمز تحقق لهذا البريد. يرجى طلب رمز جديد.' },
                { status: 400 }
            );
        }

        const otpData = otpDoc.data()!;

        // Check expiry
        const expiresAt = otpData.expiresAt?.toDate?.() ?? new Date(otpData.expiresAt);
        if (Date.now() > expiresAt.getTime()) {
            // Delete expired code
            await adminDb.collection('otpCodes').doc(docId).delete();
            return NextResponse.json(
                { valid: false, error: 'انتهت صلاحية الرمز. يرجى طلب رمز جديد.' },
                { status: 400 }
            );
        }

        // Check max attempts
        if ((otpData.attempts || 0) >= MAX_ATTEMPTS) {
            await adminDb.collection('otpCodes').doc(docId).delete();
            return NextResponse.json(
                { valid: false, error: 'تم تجاوز عدد المحاولات المسموح. يرجى طلب رمز جديد.' },
                { status: 400 }
            );
        }

        // Verify code
        if (otpData.code !== code.trim()) {
            // Increment attempts
            await adminDb.collection('otpCodes').doc(docId).update({
                attempts: (otpData.attempts || 0) + 1,
            });
            const remaining = MAX_ATTEMPTS - (otpData.attempts || 0) - 1;
            return NextResponse.json(
                { valid: false, error: `الرمز غير صحيح. ${remaining > 0 ? `متبقي ${remaining} محاولات.` : 'يرجى طلب رمز جديد.'}` },
                { status: 400 }
            );
        }

        // Success — either delete the OTP doc or keep it alive (for reset password)
        if (keepAlive) {
            await adminDb.collection('otpCodes').doc(docId).update({
                verified: true,
            });
        } else {
            await adminDb.collection('otpCodes').doc(docId).delete();
        }

        console.log(`[OTP] ✅ Verified for ${normalizedEmail.replace(/(.{2}).*(@.*)/, '$1***$2')}`);

        return NextResponse.json({
            valid: true,
            message: 'تم التحقق بنجاح',
        });
    } catch (error: any) {
        console.error('[OTP] Verify error:', error.message);
        return NextResponse.json(
            { error: 'حدث خطأ أثناء التحقق' },
            { status: 500 }
        );
    }
}
