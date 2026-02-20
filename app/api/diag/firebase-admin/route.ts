/**
 * GET /api/diag/firebase-admin
 *
 * Diagnostic endpoint to verify Firebase Admin SDK initialisation on Vercel.
 * Returns { ok, projectId, hasPrivateKey } on success,
 * or { ok: false, error } on failure.
 *
 * DELETE THIS FILE after confirming production works.
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
    try {
        // Check env vars without importing firebase-admin (avoids crash if missing)
        const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
        const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

        if (!b64 && !raw) {
            const envKeys = Object.keys(process.env)
                .filter((k) => /firebase/i.test(k))
                .join(', ');

            return NextResponse.json(
                {
                    ok: false,
                    error: 'No credentials env var found',
                    detectedFirebaseVars: envKeys || 'NONE',
                    hint: 'Set FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 on Vercel and redeploy',
                },
                { status: 500 },
            );
        }

        // Try parsing
        let sa: any;
        if (b64) {
            sa = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
        } else {
            sa = JSON.parse(raw!);
        }

        return NextResponse.json({
            ok: true,
            source: b64 ? 'BASE64' : 'JSON',
            projectId: sa.project_id,
            clientEmail: sa.client_email,
            hasPrivateKey: typeof sa.private_key === 'string' && sa.private_key.length > 100,
            privateKeyLength: sa.private_key?.length || 0,
        });
    } catch (err: any) {
        return NextResponse.json(
            { ok: false, error: err.message },
            { status: 500 },
        );
    }
}
