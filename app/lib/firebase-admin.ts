/**
 * Firebase Admin SDK — Server-side only
 *
 * Reads credentials from (in priority order):
 *   1. FIREBASE_SERVICE_ACCOUNT_KEY_BASE64  — recommended for Vercel
 *      Set on Vercel: base64 of the downloaded serviceAccountKey.json
 *      PowerShell:  [Convert]::ToBase64String([IO.File]::ReadAllBytes("serviceAccountKey.json"))
 *      Mac/Linux:   base64 -i serviceAccountKey.json | tr -d '\n'
 *
 *   2. FIREBASE_SERVICE_ACCOUNT_KEY — raw JSON string (one line)
 *
 * Singleton: guarded by getApps().length === 0.
 * NEVER logs the key itself, only whether it is present.
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

// --------------- helpers ---------------

interface ServiceAccount {
    type: string;
    project_id: string;
    private_key_id: string;
    private_key: string;
    client_email: string;
    [key: string]: unknown;
}

function parseServiceAccount(): ServiceAccount {
    // Method 1 — Base64
    const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
    if (b64) {
        try {
            const json = Buffer.from(b64, 'base64').toString('utf8');
            const sa = JSON.parse(json) as ServiceAccount;
            sa.private_key = sa.private_key.replace(/\\n/g, '\n');
            console.log('[firebase-admin] ✅ Credentials loaded from FIREBASE_SERVICE_ACCOUNT_KEY_BASE64');
            return sa;
        } catch (err: any) {
            console.error('[firebase-admin] ❌ BASE64 parse failed:', err.message);
        }
    }

    // Method 2 — Raw JSON
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (raw) {
        try {
            const sa = JSON.parse(raw) as ServiceAccount;
            sa.private_key = sa.private_key.replace(/\\n/g, '\n');
            console.log('[firebase-admin] ✅ Credentials loaded from FIREBASE_SERVICE_ACCOUNT_KEY');
            return sa;
        } catch (err: any) {
            console.error('[firebase-admin] ❌ JSON parse failed:', err.message);
        }
    }

    // Nothing found — throw with diagnostic info
    const keys = Object.keys(process.env)
        .filter((k) => /firebase/i.test(k))
        .join(', ');

    throw new Error(
        `Firebase Admin credentials missing. ` +
        `Set FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 (preferred) or FIREBASE_SERVICE_ACCOUNT_KEY. ` +
        `Detected FIREBASE env vars: [${keys || 'NONE'}]`,
    );
}

// --------------- singleton ---------------

function initAdmin() {
    if (getApps().length > 0) return getApps()[0];

    const sa = parseServiceAccount();

    const app = initializeApp({
        credential: cert({
            projectId: sa.project_id,
            clientEmail: sa.client_email,
            privateKey: sa.private_key,
        }),
        projectId: sa.project_id,
    });

    console.log(`[firebase-admin] ✅ Initialized — project: ${sa.project_id}`);
    return app;
}

// --------------- exports ---------------

let _adminApp: ReturnType<typeof initializeApp> | null = null;

function getApp() {
    if (!_adminApp) _adminApp = initAdmin();
    return _adminApp;
}

/** Verify ID tokens, manage users */
export const adminAuth = new Proxy({} as ReturnType<typeof getAuth>, {
    get(_, prop) {
        return (getAuth(getApp()) as any)[prop];
    },
});

/** Server-side Firestore access */
export const adminDb = new Proxy({} as ReturnType<typeof getFirestore>, {
    get(_, prop) {
        return (getFirestore(getApp()) as any)[prop];
    },
});
