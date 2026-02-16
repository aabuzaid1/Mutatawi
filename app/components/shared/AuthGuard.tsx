'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

interface AuthGuardProps {
    children: React.ReactNode;
    requiredRole?: 'volunteer' | 'organization';
}

export default function AuthGuard({ children, requiredRole }: AuthGuardProps) {
    const { user, profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
                return;
            }
            if (requiredRole && profile?.role !== requiredRole) {
                router.push(profile?.role === 'organization' ? '/organization' : '/volunteer');
            }
        }
    }, [user, profile, loading, requiredRole, router]);

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
    if (requiredRole && profile?.role !== requiredRole) return null;

    return <>{children}</>;
}
