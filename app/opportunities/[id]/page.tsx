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
    IoCloseOutline,
    IoSendOutline,
    IoCallOutline,
    IoMailOutline,
    IoRibbonOutline,
    IoShieldCheckmarkOutline,
    IoStarOutline,
} from 'react-icons/io5';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import Badge from '@/app/components/ui/Badge';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import LoadingSpinner from '@/app/components/shared/LoadingSpinner';
import { useAuth } from '@/app/hooks/useAuth';
import { getOpportunity } from '@/app/lib/firestore';
import { Opportunity } from '@/app/types';
import { categoryColors } from '@/app/lib/utils';
import toast from 'react-hot-toast';

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
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [applyLoading, setApplyLoading] = useState(false);
    const [applied, setApplied] = useState(false);
    const [formData, setFormData] = useState({
        message: '',
        phone: '',
    });

    const id = params.id as string;

    useEffect(() => {
        async function load() {
            try {
                const opp = await getOpportunity(id);
                setOpportunity(opp);
            } catch (error) {
                console.error('Error loading opportunity:', error);
            } finally {
                setLoading(false);
            }
        }
        if (id) load();
    }, [id]);

    const isOwner = user?.uid === opportunity?.organizationId;

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !opportunity) return;

        setApplyLoading(true);
        try {
            // الحصول على Firebase ID Token
            const idToken = await user.getIdToken();

            // استدعاء API الآمن — السيرفر يتولى كل شيء
            const response = await fetch('/api/applications/apply', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    opportunityId: opportunity.id,
                    message: formData.message,
                    phone: formData.phone || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'حدث خطأ في التقديم');
            }

            setApplied(true);
            setShowApplyModal(false);
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

                        {/* Apply Button */}
                        <div className="pt-4">
                            {isOwner ? (
                                <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                                    <p className="text-slate-500 font-medium">أنت صاحب هذه الفرصة — لا يمكنك التقديم عليها</p>
                                </div>
                            ) : applied ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center p-6 bg-success-50 rounded-xl border border-success-100"
                                >
                                    <IoCheckmarkCircleOutline className="mx-auto text-success-500 mb-2" size={40} />
                                    <p className="text-success-700 font-bold">تم تقديم طلبك بنجاح! ✅</p>
                                    <p className="text-success-600 text-sm mt-1">سيتم مراجعة طلبك من قبل المنظمة</p>
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
                            ) : (
                                <Button
                                    variant="primary"
                                    className="w-full"
                                    size="lg"
                                    onClick={() => setShowApplyModal(true)}
                                    icon={<IoSendOutline size={18} />}
                                >
                                    تقدم لهذه الفرصة
                                </Button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Apply Modal */}
            <AnimatePresence>
                {showApplyModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowApplyModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-5 border-b border-slate-100">
                                <h3 className="text-lg font-bold text-slate-800">التقديم للفرصة</h3>
                                <button
                                    onClick={() => setShowApplyModal(false)}
                                    className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                                >
                                    <IoCloseOutline size={18} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <form onSubmit={handleApply} className="p-5 space-y-4">
                                <div className="bg-primary-50 rounded-xl p-3 text-sm text-primary-700">
                                    <p className="font-bold mb-1">{opportunity.title}</p>
                                    <p className="text-primary-500">{opportunity.organizationName}</p>
                                </div>

                                <Input
                                    label="رقم الهاتف (اختياري)"
                                    type="tel"
                                    placeholder="05XXXXXXXX"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    icon={<IoCallOutline size={18} />}
                                />

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        رسالة التقديم *
                                    </label>
                                    <textarea
                                        placeholder="اكتب لماذا ترغب بالانضمام لهذه الفرصة..."
                                        value={formData.message}
                                        onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                                        rows={4}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none resize-none text-sm"
                                        required
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => setShowApplyModal(false)}
                                    >
                                        إلغاء
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="flex-1"
                                        loading={applyLoading}
                                        icon={<IoSendOutline size={16} />}
                                    >
                                        إرسال الطلب
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Footer />
        </main>
    );
}
