'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    IoDocumentTextOutline,
    IoPeopleOutline,
    IoEyeOutline,
    IoTrendingUpOutline,
    IoAddOutline,
} from 'react-icons/io5';
import ImpactCard from '@/app/components/dashboard/ImpactCard';
import Badge from '@/app/components/ui/Badge';
import Button from '@/app/components/ui/Button';
import LoadingSpinner from '@/app/components/shared/LoadingSpinner';
import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';
import { getOpportunities, getApplicationsByOrganization } from '@/app/lib/firestore';
import { Opportunity, Application } from '@/app/types';

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
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8"
            >
                <div>
                    <h1 className="text-3xl font-black text-slate-900 mb-2">
                        مرحباً {profile?.displayName || 'بالمنظمة'}! 🏢
                    </h1>
                    <p className="text-slate-500">تابع فرصك التطوعية وأدر المتقدمين</p>
                </div>
                <Link href="/organization/post-opportunity">
                    <Button variant="primary" className="mt-4 sm:mt-0" icon={<IoAddOutline />}>
                        نشر فرصة جديدة
                    </Button>
                </Link>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800">الفرص المنشورة</h2>
                </div>

                {opportunities.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                        {opportunities.map((opp, index) => (
                            <motion.div
                                key={opp.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="p-6 hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-slate-800 mb-1">{opp.title}</h3>
                                        <div className="flex items-center gap-4 text-sm text-slate-500">
                                            <span>{opp.spotsFilled || 0} متقدم</span>
                                            <span>{opp.spotsFilled || 0}/{opp.spotsTotal} مقعد ممتلئ</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge
                                            variant={opp.status === 'open' ? 'success' : 'danger'}
                                        >
                                            {opp.status === 'open' ? 'متاح' : 'مغلق'}
                                        </Badge>
                                        <Link href="/organization/applicants">
                                            <Button variant="ghost" size="sm">
                                                عرض المتقدمين
                                            </Button>
                                        </Link>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mt-3">
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${((opp.spotsFilled || 0) / opp.spotsTotal) * 100}%` }}
                                            transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                                            className="h-full gradient-primary rounded-full"
                                        />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <p className="text-slate-400 mb-4">لم تنشر أي فرص تطوعية بعد</p>
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
