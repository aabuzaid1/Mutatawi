'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { IoCallOutline, IoLocationOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';
import { useAuth } from '@/app/hooks/useAuth';
import { updateUserProfile } from '@/app/lib/firestore';
import Input from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';
import LoadingSpinner from '@/app/components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

const governorates = [
    'عمان', 'إربد', 'الزرقاء', 'المفرق', 'عجلون', 'جرش',
    'مادبا', 'البلقاء', 'الكرك', 'الطفيلة', 'معان', 'العقبة',
];

export default function CompleteProfilePage() {
    const { user, profile, loading: authLoading } = useAuth();
    const router = useRouter();
    const [phone, setPhone] = useState('');
    const [governorate, setGovernorate] = useState('');
    const [loading, setLoading] = useState(false);

    // If profile already has phone and location, redirect
    if (!authLoading && profile?.phone && profile?.location) {
        router.push(profile.role === 'organization' ? '/organization' : '/volunteer');
        return null;
    }

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!user) {
        router.push('/login');
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!phone) {
            toast.error('يرجى إدخال رقم الهاتف');
            return;
        }
        if (!governorate) {
            toast.error('يرجى اختيار المحافظة');
            return;
        }

        setLoading(true);
        try {
            await updateUserProfile(user.uid, {
                phone,
                location: governorate,
            });
            toast.success('تم حفظ بياناتك بنجاح! 🎉');
            // Redirect based on role
            const redirectPath = profile?.role === 'organization' ? '/organization' : '/volunteer';
            router.push(redirectPath);
        } catch (error: any) {
            console.error('Update profile error:', error);
            toast.error('حدث خطأ. يرجى المحاولة مرة أخرى.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-6">
                    <img src="/logo.png" alt="متطوع" className="w-12 h-12 rounded-full shadow-lg mx-auto mb-4" />
                </div>

                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-card p-6 sm:p-8 border border-slate-100">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                            className="w-16 h-16 mx-auto rounded-full bg-primary-50 flex items-center justify-center mb-4"
                        >
                            <IoCheckmarkCircleOutline className="text-primary-500" size={32} />
                        </motion.div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
                            أُكمل بياناتك
                        </h1>
                        <p className="text-sm sm:text-base text-slate-500">
                            مرحباً {user.displayName || ''}! أدخل بياناتك لإكمال التسجيل
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="رقم الهاتف"
                            type="tel"
                            placeholder="07XXXXXXXX"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            icon={<IoCallOutline size={18} />}
                            required
                        />

                        {/* Governorate Select */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">
                                المحافظة
                            </label>
                            <div className="relative">
                                <IoLocationOutline className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <select
                                    value={governorate}
                                    onChange={(e) => setGovernorate(e.target.value)}
                                    className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none bg-white text-sm appearance-none"
                                    required
                                >
                                    <option value="">اختر المحافظة</option>
                                    {governorates.map(gov => (
                                        <option key={gov} value={gov}>{gov}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <Button type="submit" variant="primary" className="w-full" loading={loading}>
                            حفظ والمتابعة
                        </Button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
