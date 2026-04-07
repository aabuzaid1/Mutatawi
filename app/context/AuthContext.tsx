'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { getUserProfile } from '../lib/auth';
import { UserProfile } from '../types';

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    emailVerified: boolean;
    setProfile: (profile: UserProfile | null) => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    emailVerified: false,
    setProfile: () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [emailVerified, setEmailVerified] = useState(false);

    // Helper to set the auth cookie with a 7-day lifetime
    const setAuthCookie = (token: string) => {
        const SEVEN_DAYS = 60 * 60 * 24 * 7;
        document.cookie = `firebase-token=${token}; path=/; max-age=${SEVEN_DAYS}; SameSite=Lax; Secure`;
    };

    useEffect(() => {
        let tokenRefreshInterval: NodeJS.Timeout | null = null;

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            setEmailVerified(firebaseUser?.emailVerified ?? false);

            // Clear any previous refresh interval
            if (tokenRefreshInterval) {
                clearInterval(tokenRefreshInterval);
                tokenRefreshInterval = null;
            }

            if (firebaseUser) {
                const userProfile = await getUserProfile(firebaseUser.uid);
                setProfile(userProfile);
                // Set cookie so middleware knows user is authenticated on refresh
                try {
                    const token = await firebaseUser.getIdToken();
                    setAuthCookie(token);
                } catch { }

                // Refresh the token every 45 minutes to keep the cookie alive
                // (Firebase ID tokens expire after 60 minutes)
                tokenRefreshInterval = setInterval(async () => {
                    try {
                        const freshToken = await firebaseUser.getIdToken(true);
                        setAuthCookie(freshToken);
                    } catch { }
                }, 45 * 60 * 1000);
            } else {
                setProfile(null);
                // Clear cookie on logout
                document.cookie = 'firebase-token=; path=/; max-age=0';
            }
            setLoading(false);
        });

        return () => {
            unsubscribe();
            if (tokenRefreshInterval) {
                clearInterval(tokenRefreshInterval);
            }
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, profile, loading, emailVerified, setProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
