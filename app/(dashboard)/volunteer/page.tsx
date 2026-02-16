'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    IoTimeOutline,
    IoCheckmarkDoneOutline,
    IoTrophyOutline,
    IoCalendarOutline,
} from 'react-icons/io5';
import ImpactCard from '@/app/components/dashboard/ImpactCard';
import Badge from '@/app/components/ui/Badge';
import LoadingSpinner from '@/app/components/shared/LoadingSpinner';
import { useAuth } from '@/app/hooks/useAuth';
import { getApplicationsByVolunteer } from '@/app/lib/firestore';
import { Application } from '@/app/types';
import { formatRelativeTime } from '@/app/lib/utils';

export default function VolunteerDashboard() {
    const { user, profile } = useAuth();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            if (!user) return;
            try {
                const apps = await getApplicationsByVolunteer(user.uid);
                setApplications(apps);
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const acceptedCount = applications.filter(a => a.status === 'accepted').length;
    const pendingCount = applications.filter(a => a.status === 'pending').length;

    return (
        <div className="max-w-7xl mx-auto">
            {/* Welcome Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-black text-slate-900 mb-2">
                    مرحباً {profile?.displayName || 'بك'}! 👋
                </h1>
                <p className="text-slate-500">تابع نشاطك التطوعي ومساهماتك في المجتمع</p>
            </motion.div>

            {/* Impact Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <ImpactCard
                    title="إجمالي الطلبات"
                    value={String(applications.length)}
                    icon={IoTimeOutline}
                    color="primary"
                />
                <ImpactCard
                    title="المشاركات المقبولة"
                    value={String(acceptedCount)}
                    icon={IoCheckmarkDoneOutline}
                    color="success"
                />
                <ImpactCard
                    title="الشهادات"
                    value="٠"
                    icon={IoTrophyOutline}
                    color="warning"
                />
                <ImpactCard
                    title="الطلبات النشطة"
                    value={String(pendingCount)}
                    icon={IoCalendarOutline}
                    color="danger"
                />
            </div>

            {/* Recent Activity */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6"
            >
                <h2 className="text-xl font-bold text-slate-800 mb-6">النشاط الأخير</h2>
                {applications.length > 0 ? (
                    <div className="space-y-4">
                        {applications.map((app, index) => (
                            <motion.div
                                key={app.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-2 rounded-full ${app.status === 'accepted' ? 'bg-success-500' :
                                            app.status === 'pending' ? 'bg-warning-500' :
                                                app.status === 'rejected' ? 'bg-danger-500' : 'bg-primary-500'
                                        }`} />
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">
                                            تقدمت لفرصة &quot;{app.opportunityTitle}&quot;
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {formatRelativeTime(app.appliedAt)}
                                        </p>
                                    </div>
                                </div>
                                <Badge
                                    variant={
                                        app.status === 'accepted' ? 'success' :
                                            app.status === 'pending' ? 'warning' :
                                                app.status === 'rejected' ? 'danger' : 'info'
                                    }
                                    size="sm"
                                >
                                    {app.status === 'accepted' ? 'مقبول' :
                                        app.status === 'pending' ? 'قيد المراجعة' :
                                            app.status === 'rejected' ? 'مرفوض' : 'مكتمل'}
                                </Badge>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-slate-400">لا يوجد نشاط بعد. تقدم لفرصة تطوعية لتبدأ!</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
