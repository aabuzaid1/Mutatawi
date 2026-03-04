'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    IoDocumentTextOutline,
    IoPeopleOutline,
    IoEyeOutline,
    IoTrendingUpOutline,
    IoAddOutline,
    IoPencilOutline,
} from 'react-icons/io5';
import ImpactCard from '@/app/components/dashboard/ImpactCard';
import Badge from '@/app/components/ui/Badge';
import Button from '@/app/components/ui/Button';
import LoadingSpinner from '@/app/components/shared/LoadingSpinner';
import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';
import { getOpportunities, getApplicationsByOrganization, deleteOpportunity } from '@/app/lib/firestore';
import { Opportunity, Application } from '@/app/types';
import toast from 'react-hot-toast';

export default function OrganizationDashboard() {
    const { user, profile } = useAuth();
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            if (!user) return;
            try {
                const [opps, apps] = await Promise.all([
                    getOpportunities({ organizationId: user.uid }),
                    getApplicationsByOrganization(user.uid),
                ]);
                setOpportunities(opps);
                setApplications(apps);
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [user]);

    const handleDelete = async (oppId: string) => {
        // Check 48-hour rule
        const opp = opportunities.find(o => o.id === oppId);
        if (opp) {
            const startDateTime = new Date(`${opp.date}T${opp.startTime || '00:00'}`);
            const hoursUntilStart = (startDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
            if (hoursUntilStart <= 48 && hoursUntilStart > 0) {
                toast.error('لا يمكن حذف الفرصة قبل أقل من 48 ساعة من موعد البداية ⏰');
                return;
            }
        }

        if (!confirm('هل أنت متأكد من حذف هذه الفرصة؟')) return;
        try {
            await deleteOpportunity(oppId);
            setOpportunities(prev => prev.filter(o => o.id !== oppId));
            toast.success('تم حذف الفرصة بنجاح');
        } catch (error: any) {
            console.error('Delete error:', error);
            toast.error('فشل حذف الفرصة');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const totalApplicants = applications.length;
    const pendingApplicants = applications.filter(a => a.status === 'pending').length;
    const acceptRate = totalApplicants > 0
        ? Math.round((applications.filter(a => a.status === 'accepted').length / totalApplicants) * 100)
        : 0;

    return (
        <div className="max-w-7xl mx-auto">
            {/* Welcome Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col gap-4 mb-6 sm:mb-8"
            >
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1 sm:mb-2">
                        مرحباً {profile?.displayName || 'بالمنظمة'}! 🏢
                    </h1>
                    <p className="text-sm sm:text-base text-slate-500">تابع فرصك التطوعية وأدر المتقدمين</p>
                </div>
                <Link href="/organization/post-opportunity" className="self-start">
                    <Button variant="primary" icon={<IoAddOutline />}>
                        نشر فرصة جديدة
                    </Button>
                </Link>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
                <ImpactCard
                    title="الفرص المنشورة"
                    value={String(opportunities.length)}
                    icon={IoDocumentTextOutline}
                    color="primary"
                />
                <ImpactCard
                    title="إجمالي المتقدمين"
                    value={String(totalApplicants)}
                    icon={IoPeopleOutline}
                    color="success"
                />
                <ImpactCard
                    title="بانتظار المراجعة"
                    value={String(pendingApplicants)}
                    icon={IoEyeOutline}
                    color="warning"
                />
                <ImpactCard
                    title="معدل القبول"
                    value={`${acceptRate}%`}
                    icon={IoTrendingUpOutline}
                    color="danger"
                />
            </div>

            {/* Posted Opportunities */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden"
            >
                <div className="p-4 sm:p-6 border-b border-slate-100">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800">الفرص المنشورة</h2>
                </div>

                {opportunities.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                        {opportunities.map((opp, index) => (
                            <motion.div
                                key={opp.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-4 sm:p-6 hover:bg-slate-50 transition-colors"
                            >
                                {/* Mobile: Stack layout */}
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-relaxed">{opp.title}</h3>
                                        <Badge
                                            variant={opp.status === 'open' ? 'success' : 'danger'}
                                        >
                                            {opp.status === 'open' ? 'متاح' : 'مغلق'}
                                        </Badge>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-500">
                                        <span>{opp.spotsFilled || 0} متقدم</span>
                                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                                        <span>{opp.spotsFilled || 0}/{opp.spotsTotal} مقعد ممتلئ</span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${((opp.spotsFilled || 0) / opp.spotsTotal) * 100}%` }}
                                                transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                                                className="h-full gradient-primary rounded-full"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2 self-start">
                                        <Link href={`/organization/applicants?opportunityId=${opp.id}`}>
                                            <Button variant="ghost" size="sm">
                                                عرض المتقدمين
                                            </Button>
                                        </Link>

                                        <Link href={`/organization/edit-opportunity/${opp.id}`}>
                                            <Button variant="outline" size="sm" icon={<IoPencilOutline />}>
                                                تعديل الفرصة
                                            </Button>
                                        </Link>

                                        {/* Delete Button */}
                                        <button
                                            onClick={() => handleDelete(opp.id)}
                                            className="text-xs text-danger-600 hover:text-danger-700 font-medium hover:underline transition-colors px-3 py-1.5"
                                        >
                                            حذف الفرصة
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 sm:p-12 text-center">
                        <p className="text-slate-400 mb-4 text-sm sm:text-base">لم تنشر أي فرص تطوعية بعد</p>
                        <Link href="/organization/post-opportunity">
                            <Button variant="primary" icon={<IoAddOutline />}>
                                نشر فرصة جديدة
                            </Button>
                        </Link>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
