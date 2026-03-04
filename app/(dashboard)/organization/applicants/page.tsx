'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import ApplicationBoard from '@/app/components/dashboard/ApplicationBoard';
import EmptyState from '@/app/components/shared/EmptyState';
import LoadingSpinner from '@/app/components/shared/LoadingSpinner';
import Badge from '@/app/components/ui/Badge';
import Button from '@/app/components/ui/Button';
import { Application } from '@/app/types';
import { useAuth } from '@/app/hooks/useAuth';
import { getApplicationsByOrganization, updateApplicationStatus } from '@/app/lib/firestore';
import { exportApplicationsToExcel } from '@/app/lib/exportToExcel';
import { IoDownloadOutline, IoArrowBackOutline } from 'react-icons/io5';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ApplicantsPage() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const opportunityId = searchParams.get('opportunityId');

    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadApplications() {
            if (!user) return;
            try {
                const apps = await getApplicationsByOrganization(user.uid);
                setApplications(apps);
            } catch (error) {
                console.error('Error loading applications:', error);
                toast.error('حدث خطأ في تحميل الطلبات');
            } finally {
                setLoading(false);
            }
        }
        loadApplications();
    }, [user]);

    // Filter by opportunity if param is present
    const filteredApplications = useMemo(() => {
        if (!opportunityId) return applications;
        return applications.filter(app => app.opportunityId === opportunityId);
    }, [applications, opportunityId]);

    // Get the opportunity title for the header
    const opportunityTitle = useMemo(() => {
        if (!opportunityId || filteredApplications.length === 0) return null;
        return filteredApplications[0].opportunityTitle;
    }, [opportunityId, filteredApplications]);

    const handleAccept = async (id: string) => {
        try {
            await updateApplicationStatus(id, 'accepted');
            const app = applications.find(a => a.id === id);
            setApplications((prev) =>
                prev.map((app) => (app.id === id ? { ...app, status: 'accepted' as const } : app))
            );
            toast.success('تم قبول المتقدم بنجاح ✅');

            // Send acceptance email (fire-and-forget)
            if (app?.volunteerEmail) {
                fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'application-accepted',
                        data: {
                            volunteerName: app.volunteerName,
                            volunteerEmail: app.volunteerEmail,
                            opportunityTitle: app.opportunityTitle,
                        },
                    }),
                }).catch(() => { });
            }
        } catch (error) {
            toast.error('حدث خطأ أثناء قبول المتقدم');
        }
    };

    const handleReject = async (id: string) => {
        try {
            await updateApplicationStatus(id, 'rejected');
            const app = applications.find(a => a.id === id);
            setApplications((prev) =>
                prev.map((app) => (app.id === id ? { ...app, status: 'rejected' as const } : app))
            );
            toast.success('تم رفض المتقدم');

            // Send rejection email (fire-and-forget)
            if (app?.volunteerEmail) {
                fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'application-rejected',
                        data: {
                            volunteerName: app.volunteerName,
                            volunteerEmail: app.volunteerEmail,
                            opportunityTitle: app.opportunityTitle,
                        },
                    }),
                }).catch(() => { });
            }
        } catch (error) {
            toast.error('حدث خطأ أثناء رفض المتقدم');
        }
    };

    const handleExport = () => {
        if (filteredApplications.length === 0) {
            toast.error('لا يوجد متقدمين لتصديرهم');
            return;
        }
        exportApplicationsToExcel(filteredApplications, opportunityTitle || undefined);
        toast.success('تم تصدير الملف بنجاح 📥');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const pendingCount = filteredApplications.filter((a) => a.status === 'pending').length;

    return (
        <div className="max-w-4xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                {/* Back Button when filtered */}
                {opportunityId && (
                    <Link href="/organization/applicants" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 transition-colors mb-4">
                        <IoArrowBackOutline />
                        عرض جميع المتقدمين
                    </Link>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1 sm:mb-2">
                            {opportunityTitle ? `متقدمو: ${opportunityTitle}` : 'المتقدمون'}
                        </h1>
                        <p className="text-sm sm:text-base text-slate-500">
                            {opportunityTitle
                                ? `عرض المتقدمين لفرصة "${opportunityTitle}"`
                                : 'إدارة طلبات المتطوعين المتقدمين لفرصك التطوعية'
                            }
                        </p>
                    </div>

                    <div className="flex items-center gap-3 self-start">
                        {pendingCount > 0 && (
                            <Badge variant="warning" size="md">
                                {pendingCount} بانتظار المراجعة
                            </Badge>
                        )}

                        {filteredApplications.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                icon={<IoDownloadOutline />}
                                onClick={handleExport}
                            >
                                تصدير Excel
                            </Button>
                        )}
                    </div>
                </div>
            </motion.div>

            {filteredApplications.length > 0 ? (
                <ApplicationBoard
                    applications={filteredApplications}
                    onAccept={handleAccept}
                    onReject={handleReject}
                />
            ) : (
                <EmptyState
                    title="لا يوجد متقدمون"
                    description={
                        opportunityId
                            ? 'لم يتقدم أي متطوع لهذه الفرصة بعد'
                            : 'لم يتقدم أي متطوع لفرصك التطوعية بعد'
                    }
                />
            )}
        </div>
    );
}
