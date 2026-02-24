'use client';

/**
 * @fileoverview صفحة الإحصائيات - تعرض بيانات زيارات الموقع والأحداث.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    IoEyeOutline,
    IoGlobeOutline,
    IoTrendingUpOutline,
    IoPersonAddOutline,
    IoHandRightOutline,
    IoDocumentTextOutline,
    IoAnalyticsOutline,
    IoFlashOutline,
} from 'react-icons/io5';
import ImpactCard from '@/app/components/dashboard/ImpactCard';
import LoadingSpinner from '@/app/components/shared/LoadingSpinner';
import { getPageViewStats, getEventStats, getTotalPageViews, PageViewStat, EventStat } from '@/app/lib/analytics';

// Map event names to Arabic labels and icons
const eventLabels: Record<string, { label: string; icon: any; color: 'primary' | 'success' | 'warning' | 'danger' }> = {
    register_success: { label: 'تسجيل ناجح', icon: IoPersonAddOutline, color: 'success' },
    view_opportunity: { label: 'مشاهدة فرصة', icon: IoEyeOutline, color: 'primary' },
    click_apply: { label: 'نقر على تقديم', icon: IoHandRightOutline, color: 'warning' },
};

// Map paths to friendly Arabic names
function getPageName(path: string): string {
    const names: Record<string, string> = {
        '/': 'الصفحة الرئيسية',
        '/opportunities': 'الفرص التطوعية',
        '/login': 'تسجيل الدخول',
        '/register': 'إنشاء حساب',
        '/volunteer': 'لوحة المتطوع',
        '/organization': 'لوحة المنظمة',
        '/analytics': 'الإحصائيات',
        '/verify-email': 'تأكيد البريد',
    };
    if (names[path]) return names[path];
    if (path.startsWith('/opportunities/')) return '📄 تفاصيل فرصة';
    if (path.startsWith('/organization/')) return '🏢 ' + path.split('/').pop();
    if (path.startsWith('/volunteer/')) return '👤 ' + path.split('/').pop();
    return path;
}

export default function AnalyticsDashboard() {
    const [pageViews, setPageViews] = useState<PageViewStat[]>([]);
    const [eventStats, setEventStats] = useState<EventStat[]>([]);
    const [totalViews, setTotalViews] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadAnalytics() {
            try {
                const [views, events, total] = await Promise.all([
                    getPageViewStats(),
                    getEventStats(),
                    getTotalPageViews(),
                ]);
                setPageViews(views);
                setEventStats(events);
                setTotalViews(total);
            } catch (error) {
                console.error('Error loading analytics:', error);
            } finally {
                setLoading(false);
            }
        }
        loadAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const topEvent = eventStats.reduce((max, e) => (e.count > (max?.count || 0) ? e : max), eventStats[0]);

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
                        إحصائيات الموقع 📊
                    </h1>
                </div>
                <p className="text-sm sm:text-base text-slate-500 mr-13">تتبع زيارات الموقع والأحداث المهمة</p>
            </motion.div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
                <ImpactCard
                    title="إجمالي الزيارات"
                    value={String(totalViews)}
                    icon={IoEyeOutline}
                    color="primary"
                />
                <ImpactCard
                    title="صفحات مختلفة"
                    value={String(pageViews.length)}
                    icon={IoGlobeOutline}
                    color="success"
                />
                <ImpactCard
                    title="أكثر صفحة زيارة"
                    value={pageViews[0] ? String(pageViews[0].viewCount) : '0'}
                    icon={IoTrendingUpOutline}
                    color="warning"
                />
                <ImpactCard
                    title="أكثر حدث"
                    value={topEvent ? String(topEvent.count) : '0'}
                    icon={IoFlashOutline}
                    color="danger"
                />
            </div>

            {/* Custom Events */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden mb-6 sm:mb-8"
            >
                <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
                        <IoFlashOutline className="text-primary-600" size={20} />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800">الأحداث المخصصة</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 sm:p-6">
                    {(['register_success', 'view_opportunity', 'click_apply'] as const).map((eventName) => {
                        const stat = eventStats.find(e => e.eventName === eventName);
                        const config = eventLabels[eventName];
                        const Icon = config.icon;

                        return (
                            <motion.div
                                key={eventName}
                                whileHover={{ y: -2 }}
                                className="bg-slate-50 rounded-xl p-4 sm:p-5 border border-slate-100"
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.color === 'success' ? 'bg-success-50' :
                                            config.color === 'primary' ? 'bg-primary-50' :
                                                config.color === 'warning' ? 'bg-warning-50' : 'bg-danger-50'
                                        }`}>
                                        <Icon className={`${config.color === 'success' ? 'text-success-600' :
                                                config.color === 'primary' ? 'text-primary-600' :
                                                    config.color === 'warning' ? 'text-warning-600' : 'text-danger-600'
                                            }`} size={20} />
                                    </div>
                                    <span className="text-sm font-semibold text-slate-700">{config.label}</span>
                                </div>
                                <p className="text-3xl font-black text-slate-800">{stat?.count || 0}</p>
                                {stat?.lastTriggered && (
                                    <p className="text-xs text-slate-400 mt-1">
                                        آخر مرة: {stat.lastTriggered.toLocaleDateString('ar-SA')}
                                    </p>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Page Views Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden"
            >
                <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-success-50 flex items-center justify-center">
                        <IoDocumentTextOutline className="text-success-600" size={20} />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800">زيارات الصفحات</h2>
                </div>

                {pageViews.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="text-right p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-500">#</th>
                                    <th className="text-right p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-500">الصفحة</th>
                                    <th className="text-right p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-500">المسار</th>
                                    <th className="text-right p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-500">الزيارات</th>
                                    <th className="text-right p-3 sm:p-4 text-xs sm:text-sm font-semibold text-slate-500">آخر زيارة</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {pageViews.map((pv, index) => (
                                    <motion.tr
                                        key={pv.path}
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
                                        <td className="p-3 sm:p-4 font-semibold text-slate-800 text-sm">{getPageName(pv.path)}</td>
                                        <td className="p-3 sm:p-4 text-xs text-slate-400 font-mono ltr" dir="ltr">{pv.path}</td>
                                        <td className="p-3 sm:p-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 font-bold text-sm">
                                                {pv.viewCount.toLocaleString('ar-SA')}
                                            </span>
                                        </td>
                                        <td className="p-3 sm:p-4 text-xs text-slate-400">
                                            {pv.lastVisited.toLocaleDateString('ar-SA', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
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
                        <p className="text-slate-400 text-sm sm:text-base">لا توجد بيانات زيارات بعد</p>
                        <p className="text-slate-300 text-xs mt-1">ستظهر الإحصائيات بمجرد زيارة المستخدمين للموقع</p>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
