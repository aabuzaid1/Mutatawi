'use client';

import { motion } from 'framer-motion';
import PostNeedForm from '@/app/components/dashboard/PostNeedForm';
import { useAuth } from '@/app/hooks/useAuth';
import { createOpportunity } from '@/app/lib/firestore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function PostOpportunityPage() {
    const { user, profile } = useAuth();
    const router = useRouter();

    const handleSubmit = async (data: any) => {
        try {
            await createOpportunity({
                ...data,
                organizationId: user?.uid || '',
                organizationName: profile?.organizationName || profile?.displayName || '',
                spotsFilled: 0,
                status: 'open',
                featured: false,
            });
            toast.success('تم نشر الفرصة التطوعية بنجاح! 🎉');
            router.push('/organization');
        } catch (error: any) {
            toast.error('حدث خطأ أثناء نشر الفرصة. حاول مرة أخرى.');
            throw error;
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-black text-slate-900 mb-2">نشر فرصة تطوعية</h1>
                <p className="text-slate-500">أنشئ فرصة تطوعية جديدة واجذب متطوعين متحمسين</p>
            </motion.div>

            <PostNeedForm onSubmit={handleSubmit} />
        </div>
    );
}
