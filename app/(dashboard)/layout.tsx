'use client';

import Sidebar from '@/app/components/layout/Sidebar';
import AuthGuard from '@/app/components/shared/AuthGuard';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard>
            <div className="min-h-screen bg-slate-50">
                <Sidebar />
                <main className="mr-0 md:mr-64 transition-all duration-300">
                    <div className="p-4 sm:p-6 lg:p-8 pt-8">
                        {children}
                    </div>
                </main>
            </div>
        </AuthGuard>
    );
}
