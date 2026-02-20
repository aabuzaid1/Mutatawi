/**
 * Firebase Admin SDK — Server-side only
 *
 * Credentials are read from env vars in priority order:
 *   1. FIREBASE_SERVICE_ACCOUNT_KEY_BASE64  (recommended on Vercel)
 *   2. FIREBASE_SERVICE_ACCOUNT_KEY         (raw JSON string)
 *   3. FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY  (separate vars)
 *
 * The module lazily initializes on first call to getAdminAuth() / getAdminDb()
 * so Vercel runtime env vars are guaranteed to be available.
 */

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

// Hardcoded fallback — safe because this is already public in NEXT_PUBLIC_ vars
const FALLBACK_PROJECT_ID = 'mutatawi-2b96f';

/* ---------- helpers ---------- */

function normalizePrivateKey(key: string): string {
    return key.replace(/\\n/g, '\n');
}

interface ServiceAccount {
    project_id?: string;
    client_email: string;
    private_key: string;
}

function tryBase64(): ServiceAccount | null {
    const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
    if (!b64) return null;

    try {
        const json = Buffer.from(b64, 'base64').toString('utf8');
        const sa = JSON.parse(json) as ServiceAccount;
        sa.private_key = normalizePrivateKey(sa.private_key);
        console.log('[Firebase Admin] ✅ Parsed credentials from FIREBASE_SERVICE_ACCOUNT_KEY_BASE64');
        return sa;
    } catch (err: any) {
        console.error('[Firebase Admin] ❌ Failed to parse BASE64 key:', err?.message);
        return null;
    }
}

function tryJsonString(): ServiceAccount | null {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!raw) return null;

    try {
        const sa = JSON.parse(raw) as ServiceAccount;
        sa.private_key = normalizePrivateKey(sa.private_key);
        console.log('[Firebase Admin] ✅ Parsed credentials from FIREBASE_SERVICE_ACCOUNT_KEY');
        return sa;
    } catch (err: any) {
        console.error('[Firebase Admin] ❌ Failed to parse JSON key:', err?.message);
        return null;
    }
}

function trySeparateVars(): ServiceAccount | null {
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!clientEmail || !privateKey) return null;

    console.log('[Firebase Admin] ✅ Using FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY');
    return {
        project_id: process.env.FIREBASE_PROJECT_ID || FALLBACK_PROJECT_ID,
        client_email: clientEmail,
        private_key: normalizePrivateKey(privateKey),
    };
}

/* ---------- lazy singleton ---------- */

let _app: App | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

function ensureApp(): App {
    if (_app) return _app;

    if (getApps().length > 0) {
        _app = getApps()[0];
        return _app;
    }

    // Try each credential source in priority order
    const sa = tryBase64() || tryJsonString() || trySeparateVars();

    if (!sa) {
        // Log every FIREBASE-related env var name (not value!) for debugging
        const firebaseKeys = Object.keys(process.env).filter((k) =>
            k.toUpperCase().includes('FIREBASE'),
        );
        console.error(
            '[Firebase Admin] ❌ No credentials found! ' +
            'Set one of: FIREBASE_SERVICE_ACCOUNT_KEY_BASE64, FIREBASE_SERVICE_ACCOUNT_KEY, ' +
            'or FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY. ' +
            `Detected FIREBASE env vars: [${firebaseKeys.join(', ')}]`,
        );
        throw new Error(
            'Firebase Admin credentials missing. Check server logs for details.',
        );
    }

    const projectId = sa.project_id || FALLBACK_PROJECT_ID;

    _app = initializeApp({
        credential: cert({
            projectId,
            clientEmail: sa.client_email,
            privateKey: sa.private_key,
        }),
        projectId,
    });

    console.log(`[Firebase Admin] ✅ Initialized (project: ${projectId})`);
    return _app;
}

/* ---------- public API ---------- */

export function getAdminAuth(): Auth {
    if (!_auth) _auth = getAuth(ensureApp());
    return _auth;
}

export function getAdminDb(): Firestore {
    if (!_db) _db = getFirestore(ensureApp());
    return _db;
}

/**
 * Backward-compatible proxy objects.
 * API routes can keep using `adminAuth.verifyIdToken(...)` and
 * `adminDb.collection(...)` without any changes.
 */
export const adminAuth = new Proxy({} as Auth, {
    get(_, prop) {
        return (getAdminAuth() as any)[prop];
    },
});

export const adminDb = new Proxy({} as Firestore, {
    get(_, prop) {
        return (getAdminDb() as any)[prop];
    },
});
