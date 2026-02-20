/**
 * GET /api/debug-env
 * تشخيصي — يعرض أي env vars لـ Firebase موجودة (بدون القيم)
 * احذف هذا الملف بعد حل المشكلة!
 */
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
    const envKeys = Object.keys(process.env);
    const firebaseKeys = envKeys.filter(k => k.toUpperCase().includes('FIREBASE'));
    const smtpKeys = envKeys.filter(k => k.toUpperCase().includes('SMTP'));

    return NextResponse.json({
        message: 'ENV Debug — delete this route after fixing!',
        firebaseEnvVars: firebaseKeys.map(k => ({
            name: k,
            hasValue: !!process.env[k],
            length: process.env[k]?.length || 0,
        })),
        smtpEnvVars: smtpKeys.map(k => ({
            name: k,
            hasValue: !!process.env[k],
        })),
        nodeEnv: process.env.NODE_ENV,
        totalEnvVars: envKeys.length,
    });
}
