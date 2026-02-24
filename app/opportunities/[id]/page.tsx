'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoLocationOutline,
    IoTimeOutline,
    IoCalendarOutline,
    IoPeopleOutline,
    IoArrowBackOutline,
    IoCheckmarkCircleOutline,
    IoSendOutline,
    IoMailOutline,
    IoRibbonOutline,
    IoShieldCheckmarkOutline,
    IoStarOutline,
    IoCloseCircleOutline,
} from 'react-icons/io5';
import { db } from '@/app/lib/firebase';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import Badge from '@/app/components/ui/Badge';
import Button from '@/app/components/ui/Button';
import LoadingSpinner from '@/app/components/shared/LoadingSpinner';
import { useAuth } from '@/app/hooks/useAuth';
import { getOpportunity } from '@/app/lib/firestore';
import { Opportunity } from '@/app/types';
import { categoryColors } from '@/app/lib/utils';
import toast from 'react-hot-toast';
import { trackEvent } from '@/app/lib/analytics';

const categoryEmojis: Record<string, string> = {
    'تعليم': '📚', 'صحة': '🏥', 'بيئة': '🌿', 'مجتمع': '🤝',
    'تقنية': '💻', 'رياضة': '⚽', 'ثقافة': '🎭', 'إغاثة': '🆘',
};

export default function OpportunityDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user, profile } = useAuth();
    const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
    const [loading, setLoading] = useState(true);
    const [applyLoading, setApplyLoading] = useState(false);
    const [applied, setApplied] = useState(false);
    const [withdrawLoading, setWithdrawLoading] = useState(false);
    const [applicationId, setApplicationId] = useState<string | null>(null);
    const [checkingApplication, setCheckingApplication] = useState(true);

    const id = params.id as string;

    useEffect(() => {
        async function load() {
            try {
                const opp = await getOpportunity(id);
                setOpportunity(opp);
                if (opp) trackEvent('view_opportunity', { id, title: opp.title });
            } catch (error) {
                console.error('Error loading opportunity:', error);
            } finally {
                setLoading(false);
            }
        }
        if (id) load();
    }, [id]);

    // Check if user already applied
    useEffect(() => {
        async function checkExistingApplication() {
            if (!user || !id) {
                setCheckingApplication(false);
                return;
            }
            try {
                const docId = `${id}_${user.uid}`;
                const { doc: firestoreDoc, getDoc } = await import('firebase/firestore');
                const appDocRef = firestoreDoc(db, 'applications', docId);
                const appDocSnap = await getDoc(appDocRef);
                if (appDocSnap.exists()) {
                    setApplied(true);
                    setApplicationId(docId);
                }
            } catch (error) {
                console.error('Error checking application:', error);
            } finally {
                setCheckingApplication(false);
            }
        }
        checkExistingApplication();
    }, [user, id]);

    const isOwner = user?.uid === opportunity?.organizationId;

    const handleApply = async () => {
        if (!user || !opportunity) return;

        setApplyLoading(true);
        try {
            const idToken = await user.getIdToken();

            const response = await fetch('/api/applications/apply', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    opportunityId: opportunity.id,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail ? `${data.error}: ${data.detail}` : (data.error || 'حدث خطأ في التقديم'));
            }

            setApplied(true);
            trackEvent('click_apply', { opportunityId: opportunity.id, title: opportunity.title });
            toast.success('تم تقديم طلبك بنجاح! 🎉');
        } catch (error: any) {
            if (error.message?.includes('مسبقاً')) {
                toast.error('لقد تقدمت لهذه الفرصة مسبقاً');
            } else {
                toast.error(`حدث خطأ: ${error?.message || 'يرجى المحاولة مرة أخرى'}`);
            }
        } finally {
            setApplyLoading(false);
        }
    };

    const handleWithdraw = async () => {
        if (!user || !opportunity || !applicationId) return;

        // Check 12 hour rule client-side for instant feedback
        const oppDateStr = opportunity.date;
        const oppStartTime = opportunity.startTime;
        let oppDateTime: Date;
        if (oppDateStr && oppStartTime) {
            oppDateTime = new Date(`${oppDateStr}T${oppStartTime}:00`);
        } else if (oppDateStr) {
            oppDateTime = new Date(`${oppDateStr}T00:00:00`);
        } else {
            oppDateTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
        }
        const hoursRemaining = (oppDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursRemaining < 12) {
            toast.error('لا يمكن الانسحاب قبل أقل من 12 ساعة من موعد الفرصة');
            return;
        }

        setWithdrawLoading(true);
        try {
            const idToken = await user.getIdToken();
            const response = await fetch('/api/applications/withdraw', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    applicationId,
                    opportunityId: opportunity.id,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'حدث خطأ');
            }

            setApplied(false);
            setApplicationId(null);
            // Update spots locally
            setOpportunity(prev => prev ? { ...prev, spotsFilled: Math.max(0, (prev.spotsFilled || 1) - 1) } : prev);
            toast.success('تم سحب طلبك بنجاح');
        } catch (error: any) {
            toast.error(error.message || 'حدث خطأ أثناء سحب الطلب');
        } finally {
            setWithdrawLoading(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="flex items-center justify-center py-40">
                    <LoadingSpinner size="lg" />
                </div>
            </main>
        );
    }

    if (!opportunity) {
        return (
            <main className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="text-center py-40">
                    <h2 className="text-2xl font-bold text-slate-700 mb-4">الفرصة غير موجودة</h2>
                    <p className="text-slate-500 mb-6">قد تكون هذه الفرصة حُذفت أو الرابط غير صحيح</p>
                    <Link href="/opportunities">
                        <Button variant="primary">العودة للفرص المتاحة</Button>
                    </Link>
                </div>
                <Footer />
            </main>
        );
    }

    const colors = categoryColors[opportunity.category] || categoryColors['مجتمع'];
    const emoji = categoryEmojis[opportunity.category] || '🤝';
    const spotsLeft = opportunity.spotsTotal - (opportunity.spotsFilled || 0);
    const fillPercentage = ((opportunity.spotsFilled || 0) / opportunity.spotsTotal) * 100;

    return (
        <main className="min-h-screen bg-slate-50">
            <Navbar />

            {/* Hero */}
            <section className="relative pt-24 sm:pt-32">
                <div className={`h-48 sm:h-64 ${opportunity.imageUrl ? '' : colors.bg} relative overflow-hidden`}>
                    {opportunity.imageUrl ? (
                        <img
                            src={opportunity.imageUrl}
                            alt={opportunity.title}
                            loading="lazy"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <span className="text-7xl sm:text-8xl">{emoji}</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

                    {/* Back button */}
                    <Link
                        href="/opportunities"
                        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                    >
                        <IoArrowBackOutline size={20} className="text-slate-700" />
                    </Link>
                </div>
            </section>

            {/* Content */}
            <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10 pb-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl shadow-card border border-slate-100 overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-5 sm:p-8">
                        <div className="flex flex-wrap gap-2 mb-4">
                            <Badge variant="info">{opportunity.category}</Badge>
                            {opportunity.isRemote && <Badge variant="success">عن بُعد</Badge>}
                            {spotsLeft <= 3 && spotsLeft > 0 && (
                                <Badge variant="warning">باقي {spotsLeft} مقاعد فقط!</Badge>
                            )}
                            {spotsLeft === 0 && <Badge variant="danger">ممتلئ</Badge>}
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
                            {opportunity.title}
                        </h1>
                        <p className="text-slate-500 text-sm sm:text-base">
                            {opportunity.organizationName}
                        </p>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-100">
                        <div className="bg-white p-4 text-center">
                            <IoCalendarOutline className="mx-auto text-primary-500 mb-1" size={22} />
                            <p className="text-xs text-slate-400 mb-0.5">التاريخ</p>
                            <p className="text-sm font-bold text-slate-700">{opportunity.date}</p>
                        </div>
                        <div className="bg-white p-4 text-center">
                            <IoTimeOutline className="mx-auto text-primary-500 mb-1" size={22} />
                            <p className="text-xs text-slate-400 mb-0.5">المدة</p>
                            <p className="text-sm font-bold text-slate-700">{opportunity.duration} ساعات</p>
                        </div>
                        <div className="bg-white p-4 text-center">
                            <IoLocationOutline className="mx-auto text-primary-500 mb-1" size={22} />
                            <p className="text-xs text-slate-400 mb-0.5">الموقع</p>
                            <p className="text-sm font-bold text-slate-700">{opportunity.location}</p>
                        </div>
                        <div className="bg-white p-4 text-center">
                            <IoPeopleOutline className="mx-auto text-primary-500 mb-1" size={22} />
                            <p className="text-xs text-slate-400 mb-0.5">المقاعد</p>
                            <p className="text-sm font-bold text-slate-700">
                                {opportunity.spotsFilled || 0}/{opportunity.spotsTotal}
                            </p>
                        </div>
                    </div>

                    {/* Time */}
                    {(opportunity.startTime || opportunity.endTime) && (
                        <div className="px-5 sm:px-8 py-4 bg-primary-50/50 border-y border-primary-100/50">
                            <div className="flex items-center gap-2 text-sm text-primary-700">
                                <IoTimeOutline size={16} />
                                <span className="font-medium">
                                    الوقت: {opportunity.startTime} - {opportunity.endTime}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div className="p-5 sm:p-8 space-y-6">
                        {opportunity.shortDescription && (
                            <div>
                                <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                                    {opportunity.shortDescription}
                                </p>
                            </div>
                        )}

                        <div>
                            <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                                <IoRibbonOutline className="text-primary-500" size={20} />
                                الوصف
                            </h2>
                            <p className="text-slate-600 leading-relaxed whitespace-pre-line text-sm sm:text-base">
                                {opportunity.description}
                            </p>
                        </div>

                        {/* Skills */}
                        {opportunity.skills && opportunity.skills.length > 0 && (
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                                    <IoStarOutline className="text-primary-500" size={20} />
                                    المهارات المطلوبة
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {opportunity.skills.map((skill, i) => (
                                        <span
                                            key={i}
                                            className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium"
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Requirements */}
                        {opportunity.requirements && opportunity.requirements.length > 0 && (
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                                    <IoShieldCheckmarkOutline className="text-primary-500" size={20} />
                                    المتطلبات
                                </h2>
                                <ul className="space-y-2">
                                    {opportunity.requirements.map((req, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                            <IoCheckmarkCircleOutline className="text-success-500 mt-0.5 flex-shrink-0" size={16} />
                                            {req}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Benefits */}
                        {opportunity.benefits && opportunity.benefits.length > 0 && (
                            <div>
                                <h2 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                                    🎁 المميزات
                                </h2>
                                <ul className="space-y-2">
                                    {opportunity.benefits.map((benefit, i) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                            <IoCheckmarkCircleOutline className="text-success-500 mt-0.5 flex-shrink-0" size={16} />
                                            {benefit}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Progress Bar */}
                        <div className="bg-slate-50 rounded-xl p-4">
                            <div className="flex items-center justify-between text-sm mb-2">
                                <span className="text-slate-500 flex items-center gap-1.5">
                                    <IoPeopleOutline size={16} />
                                    المقاعد المقبولة
                                </span>
                                <span className={`font-bold ${spotsLeft <= 3 ? 'text-danger-600' : 'text-success-600'}`}>
                                    {spotsLeft > 0 ? `${spotsLeft} متبقي` : 'ممتلئ'}
                                </span>
                            </div>
                            <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(fillPercentage, 100)}%` }}
                                    transition={{ duration: 1, delay: 0.3 }}
                                    className="h-full gradient-primary rounded-full"
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-1.5 text-center">
                                {opportunity.spotsFilled || 0} من {opportunity.spotsTotal}
                            </p>
                        </div>

                        {/* Apply / Applied Status */}
                        <div className="pt-4">
                            {isOwner ? (
                                <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <p className="text-slate-500 font-medium">أنت صاحب هذه الفرصة — لا يمكنك التقديم عليها</p>
                                </div>
                            ) : applied ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center p-6 bg-success-50 rounded-xl border border-success-100 space-y-3"
                                >
                                    <IoCheckmarkCircleOutline className="mx-auto text-success-500 mb-1" size={40} />
                                    <p className="text-success-700 font-bold text-lg">أنت مقدم على هذه الفرصة ✅</p>
                                    <p className="text-success-600 text-sm">سيتم مراجعة طلبك من قبل المنظمة</p>
                                    <button
                                        onClick={handleWithdraw}
                                        disabled={withdrawLoading}
                                        className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors disabled:opacity-50"
                                    >
                                        {withdrawLoading ? (
                                            <LoadingSpinner size="sm" />
                                        ) : (
                                            <IoCloseCircleOutline size={18} />
                                        )}
                                        سحب الطلب
                                    </button>
                                    <p className="text-xs text-slate-400">يمكنك سحب طلبك قبل 12 ساعة من موعد الفرصة</p>
                                </motion.div>
                            ) : spotsLeft <= 0 ? (
                                <Button variant="outline" className="w-full" disabled>
                                    المقاعد ممتلئة
                                </Button>
                            ) : !user ? (
                                <Link href="/login">
                                    <Button variant="primary" className="w-full" size="lg">
                                        سجّل دخولك للتقديم
                                    </Button>
                                </Link>
                            ) : checkingApplication ? (
                                <div className="flex justify-center py-4">
                                    <LoadingSpinner size="sm" />
                                </div>
                            ) : (
                                <Button
                                    variant="primary"
                                    className="w-full"
                                    size="lg"
                                    onClick={handleApply}
                                    loading={applyLoading}
                                    icon={<IoSendOutline size={18} />}
                                >
                                    تقدم لهذه الفرصة
                                </Button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </section>



            <Footer />
        </main>
    );
}
