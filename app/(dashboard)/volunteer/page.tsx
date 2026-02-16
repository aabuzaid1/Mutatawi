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
                className="mb-6 sm:mb-8"
            >
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1 sm:mb-2">
                    مرحباً {profile?.displayName || 'بك'}! 👋
                </h1>
                <p className="text-sm sm:text-base text-slate-500">تابع نشاطك التطوعي ومساهماتك في المجتمع</p>
            </motion.div>

            {/* Impact Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
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
                className="bg-white rounded-2xl shadow-soft border border-slate-100 p-4 sm:p-6"
            >
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-4 sm:mb-6">النشاط الأخير</h2>
                {applications.length > 0 ? (
                    <div className="space-y-2 sm:space-y-4">
                        {applications.map((app, index) => (
                            <motion.div
                                key={app.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                            >
                                <div className="flex items-start sm:items-center gap-3">
                                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 sm:mt-0 flex-shrink-0 ${app.status === 'accepted' ? 'bg-success-500' :
                                            app.status === 'pending' ? 'bg-warning-500' :
                                                app.status === 'rejected' ? 'bg-danger-500' : 'bg-primary-500'
                                        }`} />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-slate-700 leading-relaxed">
                                            تقدمت لفرصة &quot;{app.opportunityTitle}&quot;
                                        </p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {formatRelativeTime(app.appliedAt)}
                                        </p>
                                    </div>
                                </div>
                                <div className="self-start sm:self-center mr-5 sm:mr-0">
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
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <IoTimeOutline size={28} className="text-slate-400" />
                        </div>
                        <p className="text-slate-400 text-sm sm:text-base">لا يوجد نشاط بعد. تقدم لفرصة تطوعية لتبدأ!</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
