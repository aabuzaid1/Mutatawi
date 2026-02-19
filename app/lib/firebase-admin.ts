/**
 * Firebase Admin SDK — Server-side only
 * يُستخدم للتحقق من Firebase ID Token وقراءة/كتابة Firestore من السيرفر
 * 
 * المتغير المطلوب في .env.local:
 *   FIREBASE_SERVICE_ACCOUNT_KEY = JSON string من Firebase Console
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let app: App;

if (getApps().length === 0) {
    // Parse the service account JSON from env
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccountKey) {
        try {
            const serviceAccount = JSON.parse(serviceAccountKey);
            app = initializeApp({
                credential: cert(serviceAccount),
            });
        } catch (error) {
            console.error('[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', error);
            // Fallback: initialize without credentials (will fail on auth operations)
            app = initializeApp();
        }
    } else {
        console.warn('[Firebase Admin] FIREBASE_SERVICE_ACCOUNT_KEY not set — initializing with default credentials');
        app = initializeApp();
    }
} else {
    app = getApps()[0];
}

/** Firebase Auth Admin — للتحقق من ID Token */
export const adminAuth = getAuth(app);

/** Firestore Admin — للقراءة/الكتابة من السيرفر */
export const adminDb = getFirestore(app);
