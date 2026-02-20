/**
 * Firebase Admin SDK — Server-side only
 * Lazy initialization — يتم التهيئة عند أول استدعاء، مش وقت الـ import
 * هذا يحل مشكلة Vercel حيث env vars ما تكون جاهزة وقت الـ build
 */

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

const PROJECT_ID = 'mutatawi-2b96f';

let _app: App | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

function getApp(): App {
    if (_app) return _app;

    if (getApps().length > 0) {
        _app = getApps()[0];
        return _app;
    }

    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    console.log('[Firebase Admin] Initializing...');
    console.log('[Firebase Admin] clientEmail:', clientEmail ? '✅ set' : '❌ missing');
    console.log('[Firebase Admin] privateKey:', privateKey ? `✅ set (${privateKey.length} chars)` : '❌ missing');

    if (clientEmail && privateKey) {
        _app = initializeApp({
            credential: cert({
                projectId: PROJECT_ID,
                clientEmail,
                privateKey: privateKey.replace(/\\n/g, '\n'),
            }),
            projectId: PROJECT_ID,
        });
        console.log('[Firebase Admin] ✅ Initialized with credentials');
    } else {
        throw new Error(
            `Firebase Admin credentials missing! clientEmail=${!!clientEmail}, privateKey=${!!privateKey}. ` +
            `Set FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY environment variables.`
        );
    }

    return _app;
}

/** Firebase Auth Admin — lazy init */
export function getAdminAuth(): Auth {
    if (!_auth) _auth = getAuth(getApp());
    return _auth;
}

/** Firestore Admin — lazy init */
export function getAdminDb(): Firestore {
    if (!_db) _db = getFirestore(getApp());
    return _db;
}

// Backward compatibility
export const adminAuth = { verifyIdToken: (token: string) => getAdminAuth().verifyIdToken(token) };
export const adminDb = {
    collection: (name: string) => getAdminDb().collection(name),
};
