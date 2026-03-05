'use client';

import { motion } from 'framer-motion';
import PostNeedForm from '@/app/components/dashboard/PostNeedForm';
import { useAuth } from '@/app/hooks/useAuth';
import { createOpportunity } from '@/app/lib/firestore';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { auth } from '@/app/lib/firebase';

/**
 * Trigger volunteer notifications:
 *  - Start job: AWAITED (fast, ensures job is created before page closes)
 *  - Process batches: fire-and-forget (runs in background)
 */
async function triggerVolunteerNotifications(opportunityId: string) {
    try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) return;

        const headers = {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json',
        };

        // 1. Create the job — await this (it's fast)
        const startRes = await fetch('/api/notifications/opportunity/start', {
            method: 'POST',
            headers,
            body: JSON.stringify({ opportunityId }),
        });
        const startData = await startRes.json();
        if (!startRes.ok || !startData.jobId) {
            console.warn('[Notify] Failed to start job:', startData);
            return;
        }

        console.log('[Notify] Job started:', startData.jobId);

        // 2. Process batches — fire-and-forget (don't block)
        processJobBatches(startData.jobId, headers);
    } catch (err) {
        console.error('[Notify] Error:', err);
    }
}

/** Process notification batches in background. Does not block caller. */
function processJobBatches(jobId: string, headers: Record<string, string>) {
    (async () => {
        try {
            let done = false;
            while (!done) {
                const res = await fetch('/api/notifications/opportunity/process', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ jobId, batchSize: 50 }),
                });
                const data = await res.json();
                console.log('[Notify] Batch result:', data);
                done = data.done ?? true;
            }
        } catch (err) {
            console.error('[Notify] Process error:', err);
        }
    })();
}

export default function PostOpportunityPage() {
    const { user, profile } = useAuth();
    const router = useRouter();

    const handleSubmit = async (data: any) => {
        try {
            console.log('PostOpportunityPage: submitting...', data);
            const oppId = await createOpportunity({
                ...data,
                organizationId: user?.uid || '',
                organizationName: profile?.organizationName || profile?.displayName || '',
                spotsFilled: 0,
                status: 'open',
                featured: false,
            });
            console.log('PostOpportunityPage: success! ID:', oppId);
            toast.success('تم نشر الفرصة التطوعية بنجاح! 🎉');

            // Fire-and-forget: notify subscribed volunteers
            if (oppId) {
                triggerVolunteerNotifications(oppId).catch(() => { });
            }

            router.push('/organization');
        } catch (error: any) {
            console.error('PostOpportunityPage error:', error);
            toast.error(`فشل نشر الفرصة: ${error?.message || 'خطأ غير معروف'}`);
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

