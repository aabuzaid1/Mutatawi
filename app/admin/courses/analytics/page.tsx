'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    IoArrowBackOutline,
    IoStatsChartOutline,
    IoPeopleOutline,
    IoTrophyOutline,
    IoChevronDownOutline,
    IoChevronUpOutline,
    IoBookOutline,
    IoCheckmarkCircle,
    IoTimeOutline,
    IoMailOutline,
    IoPersonOutline,
    IoLayersOutline,
    IoShieldCheckmarkOutline,
} from 'react-icons/io5';
import { useAuth } from '@/app/hooks/useAuth';
import { loadAdminEmails, isAdmin } from '@/app/lib/adminConfig';
import { getAllCoursesAnalytics, CourseAnalytics } from '@/app/lib/firestore';
import LoadingSpinner from '@/app/components/shared/LoadingSpinner';
import Navbar from '@/app/components/layout/Navbar';

export default function CourseAnalyticsPage() {
    const { user, loading: authLoading } = useAuth();
    const [analytics, setAnalytics] = useState<CourseAnalytics[]>([]);
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);
    const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading || !user) {
            if (!authLoading) setAuthChecked(true);
            return;
        }
        async function checkAccess() {
            await loadAdminEmails();
            const admin = isAdmin(user?.email);
            setAuthorized(admin);
            setAuthChecked(true);
            if (admin) loadAnalytics();
            else setLoading(false);
        }
        checkAccess();
    }, [user, authLoading]);

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const data = await getAllCoursesAnalytics();
            setAnalytics(data);
        } catch (error) {
            console.error('Error loading analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    // Loading
    if (authLoading || !authChecked) {
        return (
            <>
                <Navbar />
                <div className="flex items-center justify-center min-h-screen">
                    <LoadingSpinner size="lg" />
                </div>
            </>
        );
    }

    // Not authorized
    if (!user || !authorized) {
        return (
            <>
                <Navbar />
                <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
                    <div className="bg-red-50 rounded-2xl p-8 text-center max-w-md">
                        <IoShieldCheckmarkOutline size={48} className="text-red-400 mx-auto mb-4" />
                        <h1 className="text-xl font-bold text-red-700 mb-2">غير مصرح</h1>
                        <p className="text-red-500 text-sm">هذا الحساب غير مسموح له بالوصول</p>
                    </div>
                </div>
            </>
        );
    }

    // Totals
    const totalLearners = analytics.reduce((sum, c) => sum + c.totalLearners, 0);
    const totalCompleters = analytics.reduce((sum, c) => sum + c.totalCompleters, 0);
    const overallAvg = totalLearners > 0
        ? Math.round(analytics.reduce((sum, c) => sum + c.avgProgress * c.totalLearners, 0) / totalLearners)
        : 0;

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-24 pb-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <Link href="/admin/courses" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 font-medium mb-4 transition-colors">
                            <IoArrowBackOutline size={16} />
                            العودة لإدارة الكورسات
                        </Link>
                        <div className="flex items-center gap-2 mb-2">
                            <IoStatsChartOutline size={22} className="text-primary-600" />
                            <span className="text-sm font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">تحليلات</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">تحليلات الكورسات</h1>
                        <p className="text-slate-500 text-sm mt-1">متابعة تقدم المتعلمين وإنجازاتهم</p>
                    </motion.div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
                            >
                                <div className="bg-white rounded-2xl border border-slate-100 p-5 text-center shadow-sm">
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                                        <IoPeopleOutline size={24} className="text-blue-600" />
                                    </div>
                                    <p className="text-3xl font-black text-slate-800">{totalLearners}</p>
                                    <p className="text-xs text-slate-400 font-medium mt-1">إجمالي المتعلمين</p>
                                </div>
                                <div className="bg-white rounded-2xl border border-slate-100 p-5 text-center shadow-sm">
                                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                                        <IoTrophyOutline size={24} className="text-green-600" />
                                    </div>
                                    <p className="text-3xl font-black text-green-600">{totalCompleters}</p>
                                    <p className="text-xs text-slate-400 font-medium mt-1">أنجزوا الكورس</p>
                                </div>
                                <div className="bg-white rounded-2xl border border-slate-100 p-5 text-center shadow-sm">
                                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                                        <IoStatsChartOutline size={24} className="text-amber-600" />
                                    </div>
                                    <p className="text-3xl font-black text-amber-600">{overallAvg}%</p>
                                    <p className="text-xs text-slate-400 font-medium mt-1">معدل التقدم</p>
                                </div>
                            </motion.div>

                            {/* Per-Course Analytics */}
                            {analytics.length === 0 ? (
                                <div className="text-center py-20">
                                    <IoBookOutline size={48} className="text-slate-300 mx-auto mb-4" />
                                    <p className="text-slate-400 text-lg font-medium">لا توجد بيانات بعد</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {analytics.map((course, index) => (
                                        <motion.div
                                            key={course.courseId}
                                            initial={{ opacity: 0, y: 15 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.1 + index * 0.05 }}
                                            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                                        >
                                            {/* Course Header */}
                                            <button
                                                onClick={() => setExpandedCourse(expandedCourse === course.courseId ? null : course.courseId)}
                                                className="w-full flex items-center justify-between p-5 text-right hover:bg-slate-50/50 transition-colors"
                                            >
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-slate-800 text-lg">{course.courseTitle}</h3>
                                                    <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-500">
                                                        <span className="flex items-center gap-1">
                                                            <IoLayersOutline size={14} />
                                                            {course.totalLessons} درس
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <IoPeopleOutline size={14} />
                                                            {course.totalLearners} متعلم
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <IoTrophyOutline size={14} />
                                                            {course.totalCompleters} أنجز
                                                        </span>
                                                        <span className={`px-2.5 py-0.5 rounded-full font-bold ${
                                                            course.avgProgress >= 70 ? 'bg-green-100 text-green-700' :
                                                            course.avgProgress >= 40 ? 'bg-amber-100 text-amber-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                            معدل {course.avgProgress}%
                                                        </span>
                                                    </div>
                                                </div>
                                                {expandedCourse === course.courseId ? (
                                                    <IoChevronUpOutline size={20} className="text-slate-400 flex-shrink-0" />
                                                ) : (
                                                    <IoChevronDownOutline size={20} className="text-slate-400 flex-shrink-0" />
                                                )}
                                            </button>

                                            {/* Expanded Details */}
                                            <AnimatePresence>
                                                {expandedCourse === course.courseId && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="border-t border-slate-100 p-5 space-y-6">
                                                            {/* Lesson Completion Bars */}
                                                            <div>
                                                                <h4 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2">
                                                                    <IoCheckmarkCircle size={16} className="text-green-500" />
                                                                    إكمال كل درس
                                                                </h4>
                                                                <div className="space-y-2">
                                                                    {course.lessonCompletionCounts.map((count, i) => {
                                                                        const percent = course.totalLearners > 0
                                                                            ? Math.round((count / course.totalLearners) * 100)
                                                                            : 0;
                                                                        return (
                                                                            <div key={i} className="flex items-center gap-3">
                                                                                <span className="text-xs text-slate-500 w-8 text-center font-bold">{i + 1}</span>
                                                                                <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden relative">
                                                                                    <div
                                                                                        className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
                                                                                        style={{ width: `${percent}%` }}
                                                                                    />
                                                                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-600">
                                                                                        {count} / {course.totalLearners} ({percent}%)
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>

                                                            {/* Learners List */}
                                                            {course.learners.length > 0 && (
                                                                <div>
                                                                    <h4 className="font-bold text-slate-700 text-sm mb-3 flex items-center gap-2">
                                                                        <IoPersonOutline size={16} className="text-blue-500" />
                                                                        المتعلمين ({course.learners.length})
                                                                    </h4>
                                                                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                                                                        {course.learners.map((learner) => (
                                                                            <div
                                                                                key={learner.visitorId}
                                                                                className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3"
                                                                            >
                                                                                <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                                                                                    <IoPersonOutline size={18} className="text-primary-600" />
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="text-sm font-bold text-slate-700 truncate">{learner.userName}</p>
                                                                                    <p className="text-xs text-slate-400 truncate" dir="ltr">{learner.userEmail}</p>
                                                                                </div>
                                                                                <div className="text-left flex-shrink-0">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                                                                                            <div
                                                                                                className={`h-full rounded-full ${
                                                                                                    learner.percent === 100 ? 'bg-green-500' :
                                                                                                    learner.percent >= 50 ? 'bg-amber-500' :
                                                                                                    'bg-red-400'
                                                                                                }`}
                                                                                                style={{ width: `${learner.percent}%` }}
                                                                                            />
                                                                                        </div>
                                                                                        <span className={`text-xs font-bold min-w-[3rem] text-left ${
                                                                                            learner.percent === 100 ? 'text-green-600' :
                                                                                            learner.percent >= 50 ? 'text-amber-600' :
                                                                                            'text-red-500'
                                                                                        }`}>
                                                                                            {learner.percent}%
                                                                                        </span>
                                                                                    </div>
                                                                                    <p className="text-xs text-slate-400 mt-0.5">
                                                                                        {learner.completedLessons} / {learner.totalLessons} درس
                                                                                    </p>
                                                                                </div>
                                                                                {learner.percent === 100 && (
                                                                                    <IoTrophyOutline size={18} className="text-green-500 flex-shrink-0" />
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>
        </>
    );
}
