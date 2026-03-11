'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    IoCalculatorOutline,
    IoTimeOutline,
    IoTrophyOutline,
    IoCalendarOutline,
    IoArrowBackOutline,
} from 'react-icons/io5';
import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';
import { syncVolunteerStats } from '@/app/lib/firestore';
import LoadingSpinner from '@/app/components/shared/LoadingSpinner';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';

interface CompletedOpp {
    opportunityId: string;
    opportunityTitle: string;
    date: string;
    duration: number;
}

export default function HoursCalculatorPage() {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [totalHours, setTotalHours] = useState(0);
    const [completedOpps, setCompletedOpps] = useState<CompletedOpp[]>([]);

    useEffect(() => {
        async function load() {
            if (!user) return;
            try {
                const stats = await syncVolunteerStats(user.uid);
                setTotalHours(stats.hoursVolunteered);
                setCompletedOpps(
                    stats.completedApps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                );
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [user]);

    if (!user) {
        return (
            <>
                <Navbar />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <p className="text-slate-400 text-lg mb-4">يرجى تسجيل الدخول أولاً</p>
                        <Link href="/login" className="text-primary-600 hover:underline font-bold">
                            تسجيل الدخول
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="flex items-center justify-center min-h-screen">
                    <LoadingSpinner size="lg" />
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-24 pb-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    {/* Back */}
                    <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 font-medium mb-6 transition-colors">
                        <IoArrowBackOutline size={16} />
                        العودة للأدوات
                    </Link>

                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-10"
                    >
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mb-4">
                            <IoCalculatorOutline size={32} className="text-emerald-600" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">حاسبة ساعات التطوع</h1>
                        <p className="text-slate-500">ملخص تفصيلي لساعات تطوعك</p>
                    </motion.div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white text-center"
                        >
                            <IoTimeOutline size={28} className="mx-auto mb-2 opacity-80" />
                            <p className="text-3xl font-black mb-1">{totalHours}</p>
                            <p className="text-sm opacity-80">إجمالي الساعات</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white text-center"
                        >
                            <IoTrophyOutline size={28} className="mx-auto mb-2 opacity-80" />
                            <p className="text-3xl font-black mb-1">{completedOpps.length}</p>
                            <p className="text-sm opacity-80">فرص مكتملة</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white text-center"
                        >
                            <IoCalendarOutline size={28} className="mx-auto mb-2 opacity-80" />
                            <p className="text-3xl font-black mb-1">
                                {completedOpps.length > 0
                                    ? Math.round(totalHours / completedOpps.length * 10) / 10
                                    : 0}
                            </p>
                            <p className="text-sm opacity-80">متوسط الساعات/فرصة</p>
                        </motion.div>
                    </div>

                    {/* Detailed List */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                    >
                        <div className="p-5 border-b border-slate-100">
                            <h2 className="font-bold text-slate-800">تفاصيل الفرص المكتملة</h2>
                        </div>

                        {completedOpps.length > 0 ? (
                            <div className="divide-y divide-slate-50">
                                {completedOpps.map((opp, index) => (
                                    <motion.div
                                        key={opp.opportunityId}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.05 * index + 0.5 }}
                                        className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                                <span className="text-xs font-bold text-emerald-700">{index + 1}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-800 text-sm truncate">{opp.opportunityTitle}</p>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    {new Date(opp.date).toLocaleDateString('ar-SA', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-emerald-600 flex-shrink-0 bg-emerald-50 px-3 py-1 rounded-full">
                                            {opp.duration} {opp.duration === 1 ? 'ساعة' : 'ساعات'}
                                        </span>
                                    </motion.div>
                                ))}

                                {/* Total row */}
                                <div className="flex items-center justify-between p-4 bg-slate-50 font-bold">
                                    <span className="text-slate-700">المجموع الكلي</span>
                                    <span className="text-primary-600 text-lg">{totalHours} ساعة</span>
                                </div>
                            </div>
                        ) : (
                            <div className="p-10 text-center">
                                <p className="text-slate-400">لم تكمل أي فرص تطوعية بعد</p>
                                <Link href="/opportunities" className="text-primary-600 hover:underline text-sm font-bold mt-2 inline-block">
                                    استكشف الفرص المتاحة
                                </Link>
                            </div>
                        )}
                    </motion.div>
                </div>
            </main>
            <Footer />
        </>
    );
}
