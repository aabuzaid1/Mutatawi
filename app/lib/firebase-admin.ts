/**
 * Firebase Admin SDK — Server-side only
 * يُستخدم للتحقق من Firebase ID Token وقراءة/كتابة Firestore من السيرفر
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = 'mutatawi-2b96f';

let app: App;

if (getApps().length === 0) {
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    console.log('[Firebase Admin] ENV CHECK — clientEmail set?', !!clientEmail);
    console.log('[Firebase Admin] ENV CHECK — privateKey set?', !!privateKey);
    console.log('[Firebase Admin] ENV CHECK — privateKey length:', privateKey?.length || 0);

    if (clientEmail && privateKey) {
        try {
            app = initializeApp({
                credential: cert({
                    projectId: PROJECT_ID,
                    clientEmail: clientEmail,
                    privateKey: privateKey.replace(/\\n/g, '\n'),
                }),
                projectId: PROJECT_ID,
            });
            console.log('[Firebase Admin] ✅ Initialized with separate env vars');
        } catch (error: any) {
            console.error('[Firebase Admin] ❌ Failed to init:', error?.message);
            app = initializeApp({ projectId: PROJECT_ID });
        }
    } else {
        console.error('[Firebase Admin] ❌ FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY missing!');
        console.error('[Firebase Admin] All env keys:', Object.keys(process.env).filter(k => k.includes('FIREBASE')).join(', '));
        app = initializeApp({ projectId: PROJECT_ID });
    }
} else {
    app = getApps()[0];
}

/** Firebase Auth Admin — للتحقق من ID Token */
export const adminAuth = getAuth(app);

/** Firestore Admin — للقراءة/الكتابة من السيرفر */
export const adminDb = getFirestore(app);
