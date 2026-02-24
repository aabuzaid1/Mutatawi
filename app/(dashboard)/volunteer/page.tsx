'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    IoDocumentTextOutline,
    IoCheckmarkCircleOutline,
    IoTimeOutline,
    IoHeartOutline,
    IoStarOutline,
    IoCloseCircleOutline,
    IoTrophyOutline,
    IoCalendarOutline,
    IoTimerOutline,
} from 'react-icons/io5';
import ImpactCard from '@/app/components/dashboard/ImpactCard';
import Badge from '@/app/components/ui/Badge';
import Button from '@/app/components/ui/Button';
import LoadingSpinner from '@/app/components/shared/LoadingSpinner';
import FeedbackModal from '@/app/components/dashboard/FeedbackModal';
import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';
import { getApplicationsByVolunteer, getOpportunity, withdrawApplication, syncVolunteerStats, hasVolunteerRated } from '@/app/lib/firestore';
import { Application } from '@/app/types';
import toast from 'react-hot-toast';

interface CompletedOpp {
    opportunityId: string;
    opportunityTitle: string;
    date: string;
    duration: number;
    hasRated: boolean;
}

export default function VolunteerDashboard() {
    const { user, profile } = useAuth();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
    const [completedOpps, setCompletedOpps] = useState<CompletedOpp[]>([]);
    const [totalHours, setTotalHours] = useState(0);
    const [feedbackModal, setFeedbackModal] = useState<{
        isOpen: boolean;
        opportunityId: string;
        opportunityTitle: string;
    }>({ isOpen: false, opportunityId: '', opportunityTitle: '' });

    useEffect(() => {
        async function loadData() {
            if (!user) return;
            try {
                const apps = await getApplicationsByVolunteer(user.uid);

                // Sync volunteer stats & get completed opportunities
                const stats = await syncVolunteerStats(user.uid);
                setTotalHours(stats.hoursVolunteered);

                // Build completed opportunities list with rating status
                const completedWithRating: CompletedOpp[] = await Promise.all(
                    stats.completedApps.map(async (opp) => {
                        const rated = await hasVolunteerRated(opp.opportunityId, user.uid);
                        return { ...opp, hasRated: rated };
                    })
                );
                setCompletedOpps(
                    completedWithRating.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                );

                // Filter out applications that are in completed opportunities (already ended)
                const completedIds = new Set(stats.completedApps.map(o => o.opportunityId));
                const activeApps = apps.filter(a => !completedIds.has(a.opportunityId));
                setApplications(activeApps);
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [user]);

    const handleWithdraw = async (app: Application) => {
        setWithdrawingId(app.id);
        try {
            const opp = await getOpportunity(app.opportunityId);
            if (opp && opp.date) {
                const oppDate = new Date(opp.date);
                const now = new Date();
                const hoursUntilStart = (oppDate.getTime() - now.getTime()) / (1000 * 60 * 60);
                if (hoursUntilStart < 24) {
                    toast.error('لا يمكن الانسحاب قبل أقل من 24 ساعة من بدء الفرصة ⏰', { duration: 4000 });
                    setWithdrawingId(null);
                    return;
                }
            }
            await withdrawApplication(app.id, app.opportunityId);
            setApplications(prev => prev.filter(a => a.id !== app.id));
            toast.success('تم سحب طلبك بنجاح');
        } catch (error) {
            console.error('Error withdrawing:', error);
            toast.error('حدث خطأ أثناء سحب الطلب');
        } finally {
            setWithdrawingId(null);
        }
    };

    const handleFeedbackClose = (opportunityId: string) => {
        setFeedbackModal({ isOpen: false, opportunityId: '', opportunityTitle: '' });
        // Mark as rated locally to hide button immediately
        setCompletedOpps(prev =>
            prev.map(o => o.opportunityId === opportunityId ? { ...o, hasRated: true } : o)
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const totalApps = applications.length;
    const accepted = applications.filter(a => a.status === 'accepted').length;
    const pending = applications.filter(a => a.status === 'pending').length;

    return (
        <div className="max-w-7xl mx-auto">
            {/* Welcome Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 sm:mb-8"
            >
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1 sm:mb-2">
                    مرحباً {profile?.displayName || 'بالمتطوع'}! 👋
                </h1>
                <p className="text-sm sm:text-base text-slate-500">تابع طلباتك ونشاطك التطوعي</p>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
                <ImpactCard
                    title="طلبات التقديم"
                    value={String(totalApps)}
                    icon={IoDocumentTextOutline}
                    color="primary"
                />
                <ImpactCard
                    title="مقبولة"
                    value={String(accepted)}
                    icon={IoCheckmarkCircleOutline}
                    color="success"
                />
                <ImpactCard
                    title="بانتظار المراجعة"
                    value={String(pending)}
                    icon={IoTimeOutline}
                    color="warning"
                />
                <ImpactCard
                    title="ساعات التطوع"
                    value={String(totalHours)}
                    icon={IoHeartOutline}
                    color="danger"
                />
            </div>

            {/* Completed Opportunities Section */}
            {completedOpps.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100 overflow-hidden mb-6 sm:mb-8"
                >
                    <div className="p-4 sm:p-6 border-b border-green-100 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center">
                            <IoTrophyOutline className="text-green-600" size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-xl font-bold text-slate-800">فرصي المكتملة 🎉</h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                أتممت {completedOpps.length} فرصة بإجمالي{' '}
                                <span className="font-bold text-green-600">{totalHours} ساعة</span> تطوع
                            </p>
                        </div>
                    </div>

                    <div className="divide-y divide-green-100">
                        {completedOpps.map((opp, index) => (
                            <motion.div
                                key={opp.opportunityId}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.08 }}
                                className="p-4 sm:p-5 flex items-center justify-between gap-3"
                            >
                                <div className="flex items-start gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <IoCheckmarkCircleOutline className="text-green-600" size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-800 text-sm sm:text-base leading-snug truncate">
                                            {opp.opportunityTitle}
                                        </p>
                                        <div className="flex flex-wrap items-center gap-3 mt-1.5">
                                            <span className="flex items-center gap-1 text-xs text-slate-500">
                                                <IoCalendarOutline size={12} />
                                                {new Date(opp.date).toLocaleDateString('ar-SA', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </span>
                                            {opp.duration > 0 && (
                                                <span className="flex items-center gap-1 text-xs text-green-700 font-medium">
                                                    <IoTimerOutline size={12} />
                                                    {opp.duration} {opp.duration === 1 ? 'ساعة' : 'ساعات'}
                                                </span>
                                            )}
                                            {/* Rating button - only if not yet rated */}
                                            {!opp.hasRated && (
                                                <button
                                                    onClick={() => setFeedbackModal({
                                                        isOpen: true,
                                                        opportunityId: opp.opportunityId,
                                                        opportunityTitle: opp.opportunityTitle,
                                                    })}
                                                    className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium transition-colors"
                                                >
                                                    <IoStarOutline size={13} />
                                                    قيّم تجربتك
                                                </button>
                                            )}
                                            {opp.hasRated && (
                                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                                    <IoStarOutline size={13} />
                                                    تم التقييم
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <span className="flex-shrink-0 text-[11px] font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                                    مكتملة ✅
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Active Applications List */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden"
            >
                <div className="p-4 sm:p-6 border-b border-slate-100">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800">طلباتي</h2>
                </div>

                {applications.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                        {applications.map((app, index) => (
                            <motion.div
                                key={app.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-4 sm:p-6 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-relaxed">
                                            {app.opportunityTitle}
                                        </h3>
                                        <Badge
                                            variant={
                                                app.status === 'accepted' ? 'success' :
                                                    app.status === 'rejected' ? 'danger' :
                                                        app.status === 'deleted' ? 'default' : 'warning'
                                            }
                                        >
                                            {app.status === 'accepted' ? 'مقبول' :
                                                app.status === 'rejected' ? 'مرفوض' :
                                                    app.status === 'deleted' ? 'محذوفة' : 'قيد المراجعة'}
                                        </Badge>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="text-xs sm:text-sm text-slate-400">
                                            تقدمت بتاريخ {app.appliedAt?.toLocaleDateString?.('ar-SA') || ''}
                                        </span>

                                        {(app.status === 'pending' || app.status === 'accepted') && (
                                            <button
                                                onClick={() => handleWithdraw(app)}
                                                disabled={withdrawingId === app.id}
                                                className="inline-flex items-center gap-1.5 text-xs text-danger-600 hover:text-danger-700 font-medium transition-colors disabled:opacity-50"
                                            >
                                                <IoCloseCircleOutline size={14} />
                                                {withdrawingId === app.id ? 'جاري السحب...' : 'سحب الطلب'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 sm:p-12 text-center">
                        <p className="text-slate-400 mb-4 text-sm sm:text-base">
                            {completedOpps.length > 0
                                ? 'ليس لديك طلبات نشطة حالياً'
                                : 'لم تتقدم لأي فرص تطوعية بعد'}
                        </p>
                        {completedOpps.length === 0 && (
                            <Link href="/opportunities">
                                <Button variant="primary">
                                    استكشف الفرص المتاحة
                                </Button>
                            </Link>
                        )}
                    </div>
                )}
            </motion.div>

            {/* Feedback Modal */}
            {user && (
                <FeedbackModal
                    isOpen={feedbackModal.isOpen}
                    onClose={() => handleFeedbackClose(feedbackModal.opportunityId)}
                    opportunityId={feedbackModal.opportunityId}
                    opportunityTitle={feedbackModal.opportunityTitle}
                    volunteerId={user.uid}
                    volunteerName={profile?.displayName || 'متطوع'}
                />
            )}
        </div>
    );
}
