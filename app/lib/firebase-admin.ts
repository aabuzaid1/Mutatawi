/**
 * Firebase Admin SDK — Server-side only
 * يُستخدم للتحقق من Firebase ID Token وقراءة/كتابة Firestore من السيرفر
 * 
 * المتغيرات المطلوبة في .env.local (و Vercel):
 *   FIREBASE_CLIENT_EMAIL
 *   FIREBASE_PRIVATE_KEY
 * 
 * أو بديلاً:
 *   FIREBASE_SERVICE_ACCOUNT_KEY = JSON string كامل
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let app: App;

if (getApps().length === 0) {
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'mutatawi-2b96f';

    if (clientEmail && privateKey) {
        // === الطريقة 1: متغيرات منفصلة (الأفضل لـ Vercel) ===
        try {
            app = initializeApp({
                credential: cert({
                    projectId: projectId,
                    clientEmail: clientEmail,
                    privateKey: privateKey.replace(/\\n/g, '\n'),
                }),
            });
            console.log('[Firebase Admin] Initialized with separate env vars');
        } catch (error) {
            console.error('[Firebase Admin] Failed to init with separate vars:', error);
            app = initializeApp();
        }
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        // === الطريقة 2: JSON كامل (fallback) ===
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
            if (serviceAccount.private_key) {
                serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            }
            app = initializeApp({
                credential: cert(serviceAccount),
            });
            console.log('[Firebase Admin] Initialized with JSON key');
        } catch (error) {
            console.error('[Firebase Admin] Failed to parse JSON key:', error);
            app = initializeApp();
        }
    } else {
        console.warn('[Firebase Admin] No credentials found — token verification will fail');
        app = initializeApp();
    }
} else {
    app = getApps()[0];
}

/** Firebase Auth Admin — للتحقق من ID Token */
export const adminAuth = getAuth(app);

/** Firestore Admin — للقراءة/الكتابة من السيرفر */
export const adminDb = getFirestore(app);
