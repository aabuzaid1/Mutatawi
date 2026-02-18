'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import PostNeedForm from '@/app/components/dashboard/PostNeedForm';
import LoadingSpinner from '@/app/components/shared/LoadingSpinner';
import { useAuth } from '@/app/hooks/useAuth';
import { getOpportunity, updateOpportunity } from '@/app/lib/firestore';
import { Opportunity } from '@/app/types';
import toast from 'react-hot-toast';

export default function EditOpportunityPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const router = useRouter();
    const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadOpportunity() {
            if (!id || typeof id !== 'string') return;
            try {
                const opp = await getOpportunity(id);
                if (!opp) {
                    toast.error('الفرصة غير موجودة');
                    router.push('/organization');
                    return;
                }
                // Check ownership
                if (opp.organizationId !== user?.uid) {
                    toast.error('ليس لديك صلاحية لتعديل هذه الفرصة');
                    router.push('/organization');
                    return;
                }
                setOpportunity(opp);
            } catch (error) {
                console.error('Error loading opportunity:', error);
                toast.error('حدث خطأ أثناء تحميل الفرصة');
                router.push('/organization');
            } finally {
                setLoading(false);
            }
        }
        if (user) loadOpportunity();
    }, [id, user, router]);

    const handleSubmit = async (data: any) => {
        if (!id || typeof id !== 'string') return;
        try {
            await updateOpportunity(id, {
                ...data,
                updatedAt: new Date(),
            });
            toast.success('تم تحديث الفرصة بنجاح! ✅');
            router.push('/organization');
        } catch (error: any) {
            console.error('Error updating opportunity:', error);
            toast.error(`فشل تحديث الفرصة: ${error?.message || 'خطأ غير معروف'}`);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!opportunity) return null;

    return (
        <div className="max-w-3xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-black text-slate-900 mb-2">تعديل الفرصة التطوعية</h1>
                <p className="text-slate-500">قم بتعديل معلومات الفرصة التطوعية</p>
            </motion.div>

            <PostNeedForm
                onSubmit={handleSubmit}
                initialData={opportunity}
                submitLabel="حفظ التعديلات"
            />
        </div>
    );
}
