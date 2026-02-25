'use client';

/**
 * @fileoverview صفحة إحصائيات المنظمة - تعرض بيانات المشاهدات والتقديمات لكل فرصة.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    IoEyeOutline,
    IoPeopleOutline,
    IoDocumentTextOutline,
    IoTrendingUpOutline,
    IoAnalyticsOutline,
    IoFlashOutline,
    IoCheckmarkCircleOutline,
    IoCloseCircleOutline,
    IoArrowUpOutline,
} from 'react-icons/io5';
import ImpactCard from '@/app/components/dashboard/ImpactCard';
import LoadingSpinner from '@/app/components/shared/LoadingSpinner';
import Badge from '@/app/components/ui/Badge';
import { useAuth } from '@/app/hooks/useAuth';
import { getOpportunities, getApplicationsByOrganization } from '@/app/lib/firestore';
import { getOpportunityViewStats, OpportunityViewStat } from '@/app/lib/analytics';
import { Opportunity, Application } from '@/app/types';

interface OpportunityAnalytics {
    opportunity: Opportunity;
    views: number;
    applicants: number;
    conversionRate: number;
    acceptedCount: number;
    pendingCount: number;
    rejectedCount: number;
}

export default function OrganizationAnalyticsPage() {
    const { user } = useAuth();
    const [analytics, setAnalytics] = useState<OpportunityAnalytics[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalViews, setTotalViews] = useState(0);
    const [totalApplicants, setTotalApplicants] = useState(0);
    const [totalOpportunities, setTotalOpportunities] = useState(0);
    const [overallConversion, setOverallConversion] = useState(0);

    useEffect(() => {
        async function loadAnalytics() {
            if (!user) return;
            try {
                // Fetch organization's opportunities and applications
                const [opps, apps] = await Promise.all([
                    getOpportunities({ organizationId: user.uid }),
                    getApplicationsByOrganization(user.uid),
                ]);

                if (opps.length === 0) {
                    setLoading(false);
                    return;
                }

                // Fetch view stats for all opportunities
                const oppIds = opps.map(o => o.id);
                const viewStats = await getOpportunityViewStats(oppIds);

                // Build per-opportunity analytics
                const analyticsData: OpportunityAnalytics[] = opps.map(opp => {
                    const oppApps = apps.filter(a => a.opportunityId === opp.id);
                    const views = viewStats[opp.id]?.viewCount || 0;
                    const applicants = oppApps.length;
                    const conversionRate = views > 0 ? Math.round((applicants / views) * 100) : 0;
                    const acceptedCount = oppApps.filter(a => a.status === 'accepted').length;
                    const pendingCount = oppApps.filter(a => a.status === 'pending').length;
                    const rejectedCount = oppApps.filter(a => a.status === 'rejected').length;

                    return {
                        opportunity: opp,
                        views,
                        applicants,
                        conversionRate,
                        acceptedCount,
                        pendingCount,
                        rejectedCount,
                    };
                });

                // Sort by views descending
                analyticsData.sort((a, b) => b.views - a.views);

                // Calculate totals
                const sumViews = analyticsData.reduce((s, a) => s + a.views, 0);
                const sumApplicants = analyticsData.reduce((s, a) => s + a.applicants, 0);
                const conversion = sumViews > 0 ? Math.round((sumApplicants / sumViews) * 100) : 0;

                setAnalytics(analyticsData);
                setTotalViews(sumViews);
                setTotalApplicants(sumApplicants);
                setTotalOpportunities(opps.length);
                setOverallConversion(conversion);
            } catch (error) {
                console.error('Error loading organization analytics:', error);
            } finally {
                setLoading(false);
            }
        }
        loadAnalytics();
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

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
                        إحصائيات فرصك 📊
                    </h1>
                </div>
                <p className="text-sm sm:text-base text-slate-500 mr-13">
                    تابع أداء كل فرصة تطوعية: مين شافها ومين سجّل فيها
                </p>
            </motion.div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
                <ImpactCard
                    title="إجمالي المشاهدات"
                    value={String(totalViews)}
                    icon={IoEyeOutline}
                    color="primary"
                />
                <ImpactCard
                    title="إجمالي المتقدمين"
                    value={String(totalApplicants)}
                    icon={IoPeopleOutline}
                    color="success"
                />
                <ImpactCard
                    title="الفرص المنشورة"
                    value={String(totalOpportunities)}
                    icon={IoDocumentTextOutline}
                    color="warning"
                />
                <ImpactCard
                    title="معدل التحويل"
                    value={`${overallConversion}%`}
                    icon={IoTrendingUpOutline}
                    color="danger"
                />
            </div>

            {/* Per-Opportunity Analytics Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden"
            >
                <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                        <IoFlashOutline className="text-primary-600" size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-800">أداء كل فرصة</h2>
                        <p className="text-xs text-slate-400 mt-0.5">مشاهدات، تقديمات، ومعدل التحويل</p>
                    </div>
                </div>

                {analytics.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="text-right p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-500">#</th>
                                    <th className="text-right p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-500">الفرصة</th>
                                    <th className="text-right p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-500">الحالة</th>
                                    <th className="text-right p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <IoEyeOutline size={14} />
                                            المشاهدات
                                        </span>
                                    </th>
                                    <th className="text-right p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <IoPeopleOutline size={14} />
                                            المتقدمين
                                        </span>
                                    </th>
                                    <th className="text-right p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-500">التفاصيل</th>
                                    <th className="text-right p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <IoTrendingUpOutline size={14} />
                                            التحويل
                                        </span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {analytics.map((item, index) => (
                                    <motion.tr
                                        key={item.opportunity.id}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-slate-50 transition-colors"
                                    >
                                        {/* Rank */}
                                        <td className="p-3 sm:p-4">
                                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold ${index === 0 ? 'bg-amber-100 text-amber-700' :
                                                    index === 1 ? 'bg-slate-200 text-slate-600' :
                                                        index === 2 ? 'bg-orange-100 text-orange-700' :
                                                            'bg-slate-50 text-slate-400'
                                                }`}>
                                                {index + 1}
                                            </span>
                                        </td>

                                        {/* Title */}
                                        <td className="p-3 sm:p-4">
                                            <p className="font-semibold text-slate-800 text-sm leading-snug max-w-[200px] truncate">
                                                {item.opportunity.title}
                                            </p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">{item.opportunity.date}</p>
                                        </td>

                                        {/* Status */}
                                        <td className="p-3 sm:p-4">
                                            <Badge variant={item.opportunity.status === 'open' ? 'success' : 'danger'}>
                                                {item.opportunity.status === 'open' ? 'متاح' : 'مغلق'}
                                            </Badge>
                                        </td>

                                        {/* Views */}
                                        <td className="p-3 sm:p-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 font-bold text-sm">
                                                <IoEyeOutline size={14} />
                                                {item.views.toLocaleString('ar-SA')}
                                            </span>
                                        </td>

                                        {/* Applicants */}
                                        <td className="p-3 sm:p-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success-50 text-success-700 font-bold text-sm">
                                                <IoPeopleOutline size={14} />
                                                {item.applicants.toLocaleString('ar-SA')}
                                            </span>
                                        </td>

                                        {/* Details: Accepted / Pending / Rejected */}
                                        <td className="p-3 sm:p-4">
                                            <div className="flex items-center gap-2 text-xs">
                                                {item.acceptedCount > 0 && (
                                                    <span className="flex items-center gap-0.5 text-success-600" title="مقبول">
                                                        <IoCheckmarkCircleOutline size={13} />
                                                        {item.acceptedCount}
                                                    </span>
                                                )}
                                                {item.pendingCount > 0 && (
                                                    <span className="flex items-center gap-0.5 text-warning-600" title="بانتظار المراجعة">
                                                        <IoArrowUpOutline size={13} />
                                                        {item.pendingCount}
                                                    </span>
                                                )}
                                                {item.rejectedCount > 0 && (
                                                    <span className="flex items-center gap-0.5 text-danger-600" title="مرفوض">
                                                        <IoCloseCircleOutline size={13} />
                                                        {item.rejectedCount}
                                                    </span>
                                                )}
                                                {item.applicants === 0 && (
                                                    <span className="text-slate-300">—</span>
                                                )}
                                            </div>
                                        </td>

                                        {/* Conversion Rate */}
                                        <td className="p-3 sm:p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.min(item.conversionRate, 100)}%` }}
                                                        transition={{ duration: 0.8, delay: 0.3 + index * 0.05 }}
                                                        className="h-full gradient-primary rounded-full"
                                                    />
                                                </div>
                                                <span className="text-sm font-bold text-slate-700 min-w-[36px]">
                                                    {item.conversionRate}%
                                                </span>
                                            </div>
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
                        <p className="text-slate-400 text-sm sm:text-base">لا توجد فرص منشورة بعد</p>
                        <p className="text-slate-300 text-xs mt-1">انشر فرصة تطوعية وستظهر إحصائياتها هنا</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
