'use client';

/**
 * @fileoverview صفحة إحصائيات المنظمة - تعرض بيانات مشاهدات الفرص والطلبات الخاصة بالمنظمة.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    IoEyeOutline,
    IoPeopleOutline,
    IoTrendingUpOutline,
    IoCalendarOutline,
    IoAnalyticsOutline,
    IoCheckmarkCircleOutline,
    IoTimeOutline,
    IoCloseCircleOutline,
    IoHourglassOutline,
} from 'react-icons/io5';
import ImpactCard from '@/app/components/dashboard/ImpactCard';
import LoadingSpinner from '@/app/components/shared/LoadingSpinner';
import { useAuth } from '@/app/hooks/useAuth';
import { getApplicationsByOrganization } from '@/app/lib/firestore';
import { getOrganizationViewStats, OpportunityViewStat } from '@/app/lib/analytics';
import { Application } from '@/app/types';

export default function OrganizationAnalytics() {
    const { user } = useAuth();
    const [viewStats, setViewStats] = useState<OpportunityViewStat[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            if (!user) return;
            try {
                const [views, apps] = await Promise.all([
                    getOrganizationViewStats(user.uid),
                    getApplicationsByOrganization(user.uid),
                ]);
                setViewStats(views);
                setApplications(apps);
            } catch (error) {
                console.error('Error loading analytics:', error);
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

    // Compute stats
    const totalViews = viewStats.reduce((sum, v) => sum + v.viewCount, 0);
    const totalApplicants = applications.length;

    // Monthly applicants (current month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyApplicants = applications.filter(a => {
        const appliedDate = a.appliedAt instanceof Date ? a.appliedAt : new Date(a.appliedAt);
        return appliedDate >= startOfMonth;
    }).length;

    const pendingApplicants = applications.filter(a => a.status === 'pending').length;
    const acceptedApplicants = applications.filter(a => a.status === 'accepted').length;
    const rejectedApplicants = applications.filter(a => a.status === 'rejected').length;

    const conversionRate = totalViews > 0
        ? Math.round((totalApplicants / totalViews) * 100)
        : 0;

    // Per-opportunity breakdown
    const opportunityBreakdown = viewStats.map(v => {
        const oppApplicants = applications.filter(a => a.opportunityId === v.opportunityId).length;
        return {
            ...v,
            applicants: oppApplicants,
            conversionRate: v.viewCount > 0 ? Math.round((oppApplicants / v.viewCount) * 100) : 0,
        };
    }).sort((a, b) => b.viewCount - a.viewCount);

    // Opportunities with applicants but no tracked views yet
    const trackedIds = new Set(viewStats.map(v => v.opportunityId));
    const untrackedOpps = new Map<string, { title: string; count: number }>();
    applications.forEach(app => {
        if (!trackedIds.has(app.opportunityId)) {
            const existing = untrackedOpps.get(app.opportunityId);
            if (existing) {
                existing.count++;
            } else {
                untrackedOpps.set(app.opportunityId, { title: app.opportunityTitle, count: 1 });
            }
        }
    });

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 sm:mb-8"
            >
                <div className="flex items-center gap-3 mb-1 sm:mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                        <IoAnalyticsOutline className="text-white" size={22} />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
                        إحصائيات منظمتك 📊
                    </h1>
                </div>
                <p className="text-sm sm:text-base text-slate-500 mr-13">تتبع أداء فرصك التطوعية ومعدلات التقديم</p>
            </motion.div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
                <ImpactCard
                    title="مشاهدات الفرص"
                    value={String(totalViews)}
                    icon={IoEyeOutline}
                    color="primary"
                />
                <ImpactCard
                    title="متقدمين هذا الشهر"
                    value={String(monthlyApplicants)}
                    icon={IoCalendarOutline}
                    color="success"
                />
                <ImpactCard
                    title="إجمالي المتقدمين"
                    value={String(totalApplicants)}
                    icon={IoPeopleOutline}
                    color="warning"
                />
                <ImpactCard
                    title="معدل التحويل"
                    value={`${conversionRate}%`}
                    icon={IoTrendingUpOutline}
                    color="danger"
                />
            </div>

            {/* Application Status Breakdown */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden mb-6 sm:mb-8"
            >
                <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                        <IoPeopleOutline className="text-primary-600" size={20} />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800">حالة الطلبات</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 sm:p-6">
                    {/* Pending */}
                    <motion.div
                        whileHover={{ y: -2 }}
                        className="bg-warning-50 rounded-xl p-4 sm:p-5 border border-warning-100"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                                <IoHourglassOutline className="text-warning-600" size={20} />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">بانتظار المراجعة</span>
                        </div>
                        <p className="text-3xl font-black text-slate-800">{pendingApplicants}</p>
                    </motion.div>

                    {/* Accepted */}
                    <motion.div
                        whileHover={{ y: -2 }}
                        className="bg-success-50 rounded-xl p-4 sm:p-5 border border-success-100"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                                <IoCheckmarkCircleOutline className="text-success-600" size={20} />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">مقبولين</span>
                        </div>
                        <p className="text-3xl font-black text-slate-800">{acceptedApplicants}</p>
                    </motion.div>

                    {/* Rejected */}
                    <motion.div
                        whileHover={{ y: -2 }}
                        className="bg-danger-50 rounded-xl p-4 sm:p-5 border border-danger-100"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center">
                                <IoCloseCircleOutline className="text-danger-600" size={20} />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">مرفوضين</span>
                        </div>
                        <p className="text-3xl font-black text-slate-800">{rejectedApplicants}</p>
                    </motion.div>
                </div>
            </motion.div>

            {/* Per-Opportunity Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden"
            >
                <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-success-50 flex items-center justify-center">
                        <IoAnalyticsOutline className="text-success-600" size={20} />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800">أداء كل فرصة</h2>
                </div>

                {(opportunityBreakdown.length > 0 || untrackedOpps.size > 0) ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="text-right p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-500">#</th>
                                    <th className="text-right p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-500">الفرصة</th>
                                    <th className="text-right p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-500">المشاهدات</th>
                                    <th className="text-right p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-500">المتقدمين</th>
                                    <th className="text-right p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-500">معدل التحويل</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {opportunityBreakdown.map((opp, index) => (
                                    <motion.tr
                                        key={opp.opportunityId}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-slate-50 transition-colors"
                                    >
                                        <td className="p-3 sm:p-4">
                                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${index === 0 ? 'bg-amber-100 text-amber-700' :
                                                index === 1 ? 'bg-slate-200 text-slate-600' :
                                                    index === 2 ? 'bg-orange-100 text-orange-700' :
                                                        'bg-slate-50 text-slate-400'
                                                }`}>
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td className="p-3 sm:p-4 font-semibold text-slate-800 text-sm max-w-[200px] truncate">
                                            {opp.opportunityTitle || 'فرصة بدون عنوان'}
                                        </td>
                                        <td className="p-3 sm:p-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 font-bold text-sm">
                                                <IoEyeOutline size={14} />
                                                {opp.viewCount.toLocaleString('ar-SA')}
                                            </span>
                                        </td>
                                        <td className="p-3 sm:p-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success-50 text-success-700 font-bold text-sm">
                                                <IoPeopleOutline size={14} />
                                                {opp.applicants}
                                            </span>
                                        </td>
                                        <td className="p-3 sm:p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(opp.conversionRate, 100)}%` }}
                                                        transition={{ duration: 1, delay: 0.3 + index * 0.1 }}
                                                        className="h-full gradient-primary rounded-full"
                                                    />
                                                </div>
                                                <span className="text-sm font-bold text-slate-600">{opp.conversionRate}%</span>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}

                                {/* Untracked opportunities (have applicants but no view data yet) */}
                                {Array.from(untrackedOpps.entries()).map(([oppId, data], index) => (
                                    <motion.tr
                                        key={oppId}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: (opportunityBreakdown.length + index) * 0.05 }}
                                        className="hover:bg-slate-50 transition-colors"
                                    >
                                        <td className="p-3 sm:p-4">
                                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold bg-slate-50 text-slate-400">
                                                {opportunityBreakdown.length + index + 1}
                                            </span>
                                        </td>
                                        <td className="p-3 sm:p-4 font-semibold text-slate-800 text-sm max-w-[200px] truncate">
                                            {data.title}
                                        </td>
                                        <td className="p-3 sm:p-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 text-slate-400 font-bold text-sm">
                                                <IoEyeOutline size={14} />
                                                —
                                            </span>
                                        </td>
                                        <td className="p-3 sm:p-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success-50 text-success-700 font-bold text-sm">
                                                <IoPeopleOutline size={14} />
                                                {data.count}
                                            </span>
                                        </td>
                                        <td className="p-3 sm:p-4">
                                            <span className="text-sm text-slate-400">—</span>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-8 sm:p-12 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                            <IoAnalyticsOutline className="text-slate-400" size={32} />
                        </div>
                        <p className="text-slate-400 text-sm sm:text-base">لا توجد بيانات بعد</p>
                        <p className="text-slate-300 text-xs mt-1">ستظهر الإحصائيات بمجرد مشاهدة المتطوعين لفرصك التطوعية</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
