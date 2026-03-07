/**
 * POST /api/auth/send-otp
 *
 * Sends a 6-digit OTP code to the given email for registration verification.
 * Stores the code in Firestore with a 5-minute expiry.
 * Rate-limited: max 1 OTP per email per 60 seconds.
 *
 * Body: { email: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/app/lib/firebase-admin';
import { sendOtpEmail } from '@/app/lib/email';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, purpose } = body;

        if (!email || typeof email !== 'string') {
            return NextResponse.json(
                { error: 'البريد الإلكتروني مطلوب' },
                { status: 400 }
            );
        }

        // Basic email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'صيغة البريد الإلكتروني غير صحيحة' },
                { status: 400 }
            );
        }

        const normalizedEmail = email.toLowerCase().trim();
        const docId = normalizedEmail.replace(/[^a-z0-9]/g, '_');

        // Rate limit: check if an OTP was sent recently (within 60s)
        const existingDoc = await adminDb.collection('otpCodes').doc(docId).get();
        if (existingDoc.exists) {
            const data = existingDoc.data()!;
            const createdAt = data.createdAt?.toDate?.() ?? new Date(data.createdAt);
            const elapsed = Date.now() - createdAt.getTime();
            if (elapsed < 60_000) {
                const retryAfter = Math.ceil((60_000 - elapsed) / 1000);
                return NextResponse.json(
                    { error: `يرجى الانتظار ${retryAfter} ثانية قبل إعادة الإرسال` },
                    { status: 429 }
                );
            }
        }

        // If purpose is reset_password, check if user exists
        if (purpose === 'reset_password') {
            try {
                await adminAuth.getUserByEmail(normalizedEmail);
            } catch (error: any) {
                if (error.code === 'auth/user-not-found') {
                    // Temporarily return a real error so testing works without confusion.
                    // Once testing is done, you might want to return a generic message for security.
                    console.log(`[OTP] User not found for reset_password: ${normalizedEmail}`);
                    return NextResponse.json(
                        { error: 'هذا البريد الإلكتروني غير مسجل لدينا' },
                        { status: 404 }
                    );
                }
                console.warn(`[OTP] getUserByEmail warning: ${error.code || error.message} — continuing anyway`);
            }
        }

        // Generate 6-digit OTP
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Store in Firestore with 5-min expiry
        await adminDb.collection('otpCodes').doc(docId).set({
            email: normalizedEmail,
            code,
            purpose: purpose || 'register',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            attempts: 0,
            verified: false,
        });

        // Send email
        await sendOtpEmail(normalizedEmail, code);

        const maskedEmail = normalizedEmail.replace(/(.{2}).*(@.*)/, '$1***$2');
        console.log(`[OTP] ✅ Sent to ${maskedEmail}`);

        return NextResponse.json({
            success: true,
            message: 'تم إرسال رمز التحقق',
        });
    } catch (error: any) {
        console.error('[OTP] Error:', error.message);
        return NextResponse.json(
            { error: 'حدث خطأ أثناء إرسال رمز التحقق' },
            { status: 500 }
        );
    }
}
