'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ApplicationBoard from '@/app/components/dashboard/ApplicationBoard';
import EmptyState from '@/app/components/shared/EmptyState';
import LoadingSpinner from '@/app/components/shared/LoadingSpinner';
import Badge from '@/app/components/ui/Badge';
import { Application } from '@/app/types';
import { useAuth } from '@/app/hooks/useAuth';
import { getApplicationsByOrganization, updateApplicationStatus } from '@/app/lib/firestore';
import toast from 'react-hot-toast';

export default function ApplicantsPage() {
    const { user } = useAuth();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadApplications() {
            if (!user) return;
            try {
                const apps = await getApplicationsByOrganization(user.uid);
                setApplications(apps);
            } catch (error) {
                console.error('Error loading applications:', error);
                toast.error('حدث خطأ في تحميل الطلبات');
            } finally {
                setLoading(false);
            }
        }
        loadApplications();
    }, [user]);

    const handleAccept = async (id: string) => {
        try {
            await updateApplicationStatus(id, 'accepted');
            setApplications((prev) =>
                prev.map((app) => (app.id === id ? { ...app, status: 'accepted' as const } : app))
            );
            toast.success('تم قبول المتقدم بنجاح ✅');
        } catch (error) {
            toast.error('حدث خطأ أثناء قبول المتقدم');
        }
    };

    const handleReject = async (id: string) => {
        try {
            await updateApplicationStatus(id, 'rejected');
            setApplications((prev) =>
                prev.map((app) => (app.id === id ? { ...app, status: 'rejected' as const } : app))
            );
            toast.success('تم رفض المتقدم');
        } catch (error) {
            toast.error('حدث خطأ أثناء رفض المتقدم');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const pendingCount = applications.filter((a) => a.status === 'pending').length;

    return (
        <div className="max-w-4xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between mb-8"
            >
                <div>
                    <h1 className="text-3xl font-black text-slate-900 mb-2">المتقدمون</h1>
                    <p className="text-slate-500">إدارة طلبات المتطوعين المتقدمين لفرصك التطوعية</p>
                </div>
                {pendingCount > 0 && (
                    <Badge variant="warning" size="md">
                        {pendingCount} طلب بانتظار المراجعة
                    </Badge>
                )}
            </motion.div>

            {applications.length > 0 ? (
                <ApplicationBoard
                    applications={applications}
                    onAccept={handleAccept}
                    onReject={handleReject}
                />
            ) : (
                <EmptyState
                    title="لا يوجد متقدمون"
                    description="لم يتقدم أي متطوع لفرصك التطوعية بعد"
                />
            )}
        </div>
    );
}
