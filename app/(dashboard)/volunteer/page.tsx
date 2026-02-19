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
} from 'react-icons/io5';
import ImpactCard from '@/app/components/dashboard/ImpactCard';
import Badge from '@/app/components/ui/Badge';
import Button from '@/app/components/ui/Button';
import LoadingSpinner from '@/app/components/shared/LoadingSpinner';
import FeedbackModal from '@/app/components/dashboard/FeedbackModal';
import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';
import { getApplicationsByVolunteer, getOpportunity, withdrawApplication } from '@/app/lib/firestore';
import { Application } from '@/app/types';
import toast from 'react-hot-toast';

export default function VolunteerDashboard() {
    const { user, profile } = useAuth();
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
    const [oppDates, setOppDates] = useState<Record<string, string>>({});
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
                setApplications(apps);

                // Fetch dates for accepted apps to know when rating is allowed
                const acceptedApps = apps.filter(a => a.status === 'accepted');
                const dates: Record<string, string> = {};
                await Promise.all(
                    acceptedApps.map(async (app) => {
                        const opp = await getOpportunity(app.opportunityId);
                        if (opp?.date) dates[app.opportunityId] = opp.date;
                    })
                );
                setOppDates(dates);
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
            // Fetch the opportunity to check its date
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
                    value={String(profile?.hoursVolunteered || 0)}
                    icon={IoHeartOutline}
                    color="danger"
                />
            </div>

            {/* Applications List */}
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

                                        {app.status === 'accepted' && oppDates[app.opportunityId] && new Date(oppDates[app.opportunityId]) < new Date() && (
                                            <button
                                                onClick={() => setFeedbackModal({
                                                    isOpen: true,
                                                    opportunityId: app.opportunityId,
                                                    opportunityTitle: app.opportunityTitle,
                                                })}
                                                className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
                                            >
                                                <IoStarOutline size={14} />
                                                قيّم تجربتك
                                            </button>
                                        )}

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
                        <p className="text-slate-400 mb-4 text-sm sm:text-base">لم تتقدم لأي فرص تطوعية بعد</p>
                        <Link href="/opportunities">
                            <Button variant="primary">
                                استكشف الفرص المتاحة
                            </Button>
                        </Link>
                    </div>
                )}
            </motion.div>

            {/* Feedback Modal */}
            {user && (
                <FeedbackModal
                    isOpen={feedbackModal.isOpen}
                    onClose={() => setFeedbackModal({ isOpen: false, opportunityId: '', opportunityTitle: '' })}
                    opportunityId={feedbackModal.opportunityId}
                    opportunityTitle={feedbackModal.opportunityTitle}
                    volunteerId={user.uid}
                    volunteerName={profile?.displayName || 'متطوع'}
                />
            )}
        </div>
    );
}

