'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

interface AuthGuardProps {
    children: React.ReactNode;
    requiredRole?: 'volunteer' | 'organization';
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
    const { user, profile, loading, emailVerified } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
                return;
            }
            // Check email verification (skip for Google-authenticated users)
            const isGoogleUser = user.providerData?.some(p => p.providerId === 'google.com');
            if (!emailVerified && !isGoogleUser) {
                router.push('/verify-email');
                return;
            }
            // Check profile completeness (phone + location)
            if (profile && (!profile.phone || !profile.location)) {
                if (pathname !== '/complete-profile') {
                    router.push('/complete-profile');
                    return;
                }
            }
            if (requiredRole && profile?.role !== requiredRole) {
                router.push(profile?.role === 'organization' ? '/organization' : '/volunteer');
            }
        }
    }, [user, profile, loading, requiredRole, emailVerified, router, pathname]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <LoadingSpinner size="lg" />
                    <p className="mt-4 text-slate-500 font-medium">جارٍ التحميل...</p>
                </div>
            </div>
        );
    }

    if (!user) return null;

    const isGoogleUser = user.providerData?.some(p => p.providerId === 'google.com');
    if (!emailVerified && !isGoogleUser) return null;
    // Allow rendering if on complete-profile page itself
    if (profile && (!profile.phone || !profile.location) && pathname !== '/complete-profile') return null;
    if (requiredRole && profile?.role !== requiredRole) return null;

    return <>{children}</>;
}
