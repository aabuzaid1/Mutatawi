import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile,
    User,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from '../types';

const googleProvider = new GoogleAuthProvider();

export async function signUp(
    email: string,
    password: string,
    displayName: string,
    role: 'volunteer' | 'organization'
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
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);

    return user;
}

export async function signIn(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
}

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
    }

    return user;
}

export async function signOut(): Promise<void> {
    await firebaseSignOut(auth);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
    }
    return null;
}

export async function resetPassword(email: string): Promise<void> {
    const actionCodeSettings = {
        url: typeof window !== 'undefined'
            ? `${window.location.origin}/login`
            : 'http://localhost:3000/login',
        handleCodeInApp: false,
    };
    try {
        await sendPasswordResetEmail(auth, email, actionCodeSettings);
    } catch (error: any) {
        console.error('Reset password error:', error.code, error.message);
        // If the continue URI is not authorized, try without it
        if (error.code === 'auth/unauthorized-continue-uri') {
            await sendPasswordResetEmail(auth, email);
            return;
        }
        throw error;
    }
}
