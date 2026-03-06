/**
 * @fileoverview وحدة إدارة المصادقة والمستخدمين (Authentication & User Management)
 * تحتوي هذه الوحدة على دوال للتعامل مع Firebase Auth لبناء الحسابات، الدخول، الخروج، واستعادة كلمة المرور.
 */

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    sendEmailVerification,
    verifyPasswordResetCode,
    confirmPasswordReset,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile,
    updatePassword,
    updateEmail as firebaseUpdateEmail,
    reauthenticateWithCredential,
    EmailAuthProvider,
    User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from '../types';

const googleProvider = new GoogleAuthProvider();

/**
 * تستدعي مسار الـ API الخاص بأول تسجيل دخول للمستخدم.
 * تقوم بإرسال إيميل ترحيبي مرة واحدة فقط (Idempotent).
 * وتعمل بنظام (Fire-and-Forget) بحيث لا تؤخر واجهة المستخدم حتى لو فشلت.
 * 
 * @param {User} user - كائن المستخدم من Firebase Auth.
 * @returns {Promise<void>} 
 */
async function triggerFirstLoginEmail(user: User): Promise<void> {
    try {
        const idToken = await user.getIdToken();
        const response = await fetch('/api/auth/first-login', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json',
            },
        });
        const data = await response.json();
        console.log('[First Login Email]', data);
    } catch (error) {
        console.error('[First Login Email] Failed:', error);
    }
}

/**
 * إنشاء حساب جديد للمستخدم (تسجيل - Sign Up).
 * تقوم الدالة بإنشاء החשבון في Firebase Auth، ثم بناء وثيقة التعريف (Profile)
 * في Firestore، وأخيراً ترسل رسائل الترحيب والتحقق.
 * 
 * @param {string} email - البريد الإلكتروني للمستخدم.
 * @param {string} password - كلمة المرور.
 * @param {string} displayName - الاسم الكامل (للمتطوع أو المنظمة).
 * @param {'volunteer' | 'organization'} role - نوع الحساب لتحديد الصلاحيات.
 * @param {string} [phone] - رقم الهاتف (اختياري).
 * @param {string} [governorate] - المحافظة أو الموقع المدخل (اختياري).
 * @returns {Promise<User>} كائن المستخدم المُنشأ للتو.
 * @throws {Error} في حال كان الإيميل مستخدماً أو كلمة المرور ضعيفة.
 */
export async function signUp(
    email: string,
    password: string,
    displayName: string,
    role: 'volunteer' | 'organization',
    phone?: string,
    governorate?: string,
    emailNotifications?: boolean
): Promise<User> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName });

    // Create user profile in Firestore
    const userProfile: Partial<UserProfile> = {
        uid: user.uid,
        email: user.email!,
        displayName,
        role,
        emailNotifications: role === 'volunteer' ? (emailNotifications ?? false) : false,
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    if (phone) userProfile.phone = phone;
    if (governorate) userProfile.location = governorate;

    await setDoc(doc(db, 'users', user.uid), userProfile);

    // إرسال إيميل ترحيبي آمن عبر السيرفر (fire-and-forget)
    triggerFirstLoginEmail(user).catch(() => { });

    return user;
}

/**
 * تسجيل الدخول باستخدام البريد الإلكتروني وكلمة المرور.
 * 
 * @param {string} email - البريد الإلكتروني المُسجل.
 * @param {string} password - كلمة المرور المطابقة.
 * @returns {Promise<User>} كائن المستخدم بعد نجاح الدخول.
 * @throws {Error} في حال كانت بيانات الدخول خاطئة أو الحساب غير موجود.
 */
export async function signIn(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

/**
 * تسجيل الدخول وإنشاء الحساب باستخدام نافذة جوجل المنبثقة (Google OAuth).
 * تقوم بإنشاء حساب في قاعدة البيانات (Firestore) إذا كان الدخول لأول مرة.
 * 
 * @returns {Promise<User>} كائن المستخدم المصادق عليه من جوجل.
 */
export async function signInWithGoogle(): Promise<User> {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Check if user profile exists
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) {
        const userProfile: Partial<UserProfile> = {
            uid: user.uid,
            email: user.email!,
            displayName: user.displayName || 'مستخدم جديد',
            photoURL: user.photoURL || undefined,
            role: 'volunteer',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await setDoc(doc(db, 'users', user.uid), userProfile);

        // إرسال إيميل ترحيبي آمن للمستخدمين الجدد عبر جوجل (fire-and-forget)
        triggerFirstLoginEmail(user).catch(() => { });
    }

    return user;
}

/**
 * تسجيل الخروج من النظام (Sign Out).
 * 
 * @returns {Promise<void>}
 */
export async function signOut(): Promise<void> {
    await firebaseSignOut(auth);
}

/**
 * الحصول على البيانات التفصيلية لملف المستخدم من قاعدة البيانات (Firestore).
 * 
 * @param {string} uid - المعرف الفريد للمستخدم (User ID).
 * @returns {Promise<UserProfile | null>} بيانات المستخدم إن وجدت، أو null إن لم يكن لديه وثيقة.
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
    }
    return null;
}

/**
 * إرسال رابط إعادة تعيين كلمة المرور إلى البريد الإلكتروني للمستخدم،
 * مع تحديد إعادة التوجيه للرابط المناسب محلياً أو حياً للتطبيق.
 * 
 * @param {string} email - البريد المراد استعادة المرور له.
 * @returns {Promise<void>}
 * @throws {Error} إذا كان البريد غير مسجل.
 */
export async function resetPassword(email: string): Promise<void> {
    const actionCodeSettings = {
        url: typeof window !== 'undefined'
            ? `${window.location.origin}/reset-password`
            : 'http://localhost:3000/reset-password',
        handleCodeInApp: true,
    };

    console.log('🔑 [resetPassword] Sending to:', email);
    console.log('🔑 [resetPassword] Action URL:', actionCodeSettings.url);

    try {
        await sendPasswordResetEmail(auth, email, actionCodeSettings);
        console.log('✅ [resetPassword] Firebase accepted the request — email should be sent');
    } catch (error: any) {
        console.error('❌ [resetPassword] Error:', error.code, error.message);

        if (error.code === 'auth/unauthorized-continue-uri') {
            console.warn('⚠️ [resetPassword] Continue URI not authorized — retrying WITHOUT actionCodeSettings...');
            try {
                await sendPasswordResetEmail(auth, email);
                console.log('✅ [resetPassword] Fallback succeeded — email should be sent (no custom redirect)');
            } catch (fallbackError: any) {
                console.error('❌ [resetPassword] Fallback also failed:', fallbackError.code, fallbackError.message);
                throw fallbackError;
            }
            return;
        }
        throw error;
    }
}

/**
 * إرسال رابط إعادة تعيين كلمة المرور عبر السيرفر (Admin SDK + SMTP).
 * هذه الطريقة أكثر موثوقية من Firebase Client SDK لأنها ترسل الإيميل
 * مباشرة عبر Gmail SMTP بدلاً من نظام Firebase المدمج.
 */
export async function resetPasswordViaServer(email: string): Promise<{ success: boolean }> {
    console.log('📧 [resetPasswordViaServer] Calling server API for:', email);
    const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok) {
        console.error('❌ [resetPasswordViaServer] Server error:', data);
        throw new Error(data.error || 'Server error');
    }
    console.log('✅ [resetPasswordViaServer] Server responded:', data);
    return data;
}
/**
 * التحقق من رمز الاسترداد (Reset Code) القادم من رابط الإيميل.
 * 
 * @param { string } code - الرمز المرسل ضمن الـ URL.
 * @returns { Promise<string> } البريد الإلكتروني المرتبط بالرمز إذا كان صالحاً.
 * @throws { Error } إذا كان الرمز منتهي الصلاحية أو غير صحيح.
 */
export async function verifyResetCode(code: string): Promise<string> {
    const email = await verifyPasswordResetCode(auth, code);
    return email;
}

/**
 * تأكيد تعيين كلمة المرور الجديدة باستخدام رمز الاسترداد المقبول.
 * 
 * @param {string} code - رمز الاسترداد.
 * @param {string} newPassword - الكلمة السرية الجديدة المرغوبة.
 * @returns {Promise<void>}
 */
export async function confirmReset(code: string, newPassword: string): Promise<void> {
    await confirmPasswordReset(auth, code, newPassword);
}

/**
 * إعادة إرسال إيميل تفعيل الحساب (Verification Email) للمستخدم المسجل الدخول حالياً
 * إذا لم يقم بتفعيل حسابه مسبقاً.
 * 
 * @returns {Promise<void>}
 */
export async function resendVerificationEmail(): Promise<void> {
    const user = auth.currentUser;
    if (user && !user.emailVerified) {
        await sendEmailVerification(user);
    }
}

/**
 * تغيير كلمة المرور للمستخدم النشط حالياً (من لوحة التحكم).
 * يتطلب إعادة المصادقة (Re-authentication) بالكلمة القديمة لضمان الأمان.
 * 
 * @param {string} currentPassword - الكلمة السرية الحالية للتحقق من هويته.
 * @param {string} newPassword - الكلمة السرية الجديدة.
 * @returns {Promise<void>}
 * @throws {Error} إذا كانت كلمة المرور القديمة خاطئة أو لم يُعثر على مُستخدم.
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email) {
        throw new Error('لم يتم العثور على المستخدم');
    }
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
}

/**
 * تغيير البريد الإلكتروني للمستخدم النشط حالياً.
 * يتطلب إعادة المصادقة (Re-authentication) بكلمة المرور الحالية لضمان الأمان.
 * يقوم بتحديث الإيميل في Firebase Auth وفي Firestore.
 * 
 * @param {string} currentPassword - كلمة المرور الحالية للتحقق.
 * @param {string} newEmail - البريد الإلكتروني الجديد.
 * @returns {Promise<void>}
 * @throws {Error} إذا كانت كلمة المرور خاطئة أو الإيميل الجديد مستخدم.
 */
export async function changeEmail(currentPassword: string, newEmail: string): Promise<void> {
    const user = auth.currentUser;
    if (!user || !user.email) {
        throw new Error('لم يتم العثور على المستخدم');
    }
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await firebaseUpdateEmail(user, newEmail);
    // Send verification email to the new address
    await sendEmailVerification(user);
    // Update email in Firestore profile
    await updateDoc(doc(db, 'users', user.uid), {
        email: newEmail,
        updatedAt: new Date(),
    });
}
