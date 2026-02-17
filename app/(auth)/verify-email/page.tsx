'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { IoMailOutline, IoRefreshOutline, IoArrowBackOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';
import { resendVerificationEmail, signOut } from '@/app/lib/auth';
import { auth } from '@/app/lib/firebase';
import Button from '@/app/components/ui/Button';
import toast from 'react-hot-toast';

export default function VerifyEmailPage() {
    const [loading, setLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [verified, setVerified] = useState(false);
    const router = useRouter();

    // Poll for email verification status
    useEffect(() => {
        const interval = setInterval(async () => {
            const user = auth.currentUser;
            if (user) {
                await user.reload();
                if (user.emailVerified) {
                    setVerified(true);
                    clearInterval(interval);
                    toast.success('تم تفعيل حسابك بنجاح! 🎉');
                    setTimeout(() => {
                        router.push('/login');
                    }, 2000);
                }
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [router]);

    // Cooldown timer
    useEffect(() => {
        if (cooldown > 0) {
            const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [cooldown]);

    const handleResend = async () => {
        setLoading(true);
        try {
            // Need to be signed in to resend
            const user = auth.currentUser;
            if (!user) {
                toast.error('يرجى تسجيل الدخول أولاً لإعادة إرسال إيميل التحقق');
                router.push('/login');
                return;
            }
            await resendVerificationEmail();
            toast.success('تم إعادة إرسال إيميل التحقق! ✉️');
            setCooldown(60);
        } catch (error: any) {
            console.error('Resend verification error:', error);
            if (error.code === 'auth/too-many-requests') {
                toast.error('تم إرسال عدة طلبات. يرجى الانتظار قليلاً');
            } else {
                toast.error('حدث خطأ. يرجى المحاولة مرة أخرى');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleBackToLogin = async () => {
        try {
            await signOut();
        } catch { }
        router.push('/login');
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md mx-auto px-1"
        >
            <div className="text-center mb-6 sm:mb-8">
                <Link href="/" className="inline-flex items-center gap-2 mb-4 sm:mb-6">
                    <img src="/logo.png" alt="متطوع" className="w-11 h-11 sm:w-12 sm:h-12 rounded-full shadow-lg" />
                </Link>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-card p-6 sm:p-8 border border-slate-100">
                {verified ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center space-y-5 py-4"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                            className="w-24 h-24 mx-auto rounded-full bg-success-50 flex items-center justify-center"
                        >
                            <IoCheckmarkCircleOutline className="text-success-500" size={48} />
                        </motion.div>
                        <h2 className="text-2xl font-black text-slate-900">تم التفعيل! 🎉</h2>
                        <p className="text-slate-500">جارٍ تحويلك لتسجيل الدخول...</p>
                    </motion.div>
                ) : (
                    <div className="text-center space-y-6">
                        {/* Mail Icon */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                            className="w-24 h-24 mx-auto rounded-full bg-primary-50 flex items-center justify-center"
                        >
                            <motion.div
                                animate={{ y: [0, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                            >
                                <IoMailOutline className="text-primary-600" size={44} />
                            </motion.div>
                        </motion.div>

                        {/* Title & Description */}
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">
                                تحقق من بريدك الإلكتروني
                            </h1>
                            <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
                                أرسلنا رابط تفعيل إلى بريدك الإلكتروني. اضغط على الرابط لتفعيل حسابك.
                            </p>
                        </div>

                        {/* Instructions */}
                        <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-sm text-slate-600">
                            <div className="flex items-start gap-3 text-right">
                                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">١</span>
                                <p>افتح بريدك الإلكتروني (تحقق من البريد الوارد والرسائل غير المرغوبة)</p>
                            </div>
                            <div className="flex items-start gap-3 text-right">
                                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">٢</span>
                                <p>اضغط على رابط تفعيل الحساب في الرسالة</p>
                            </div>
                            <div className="flex items-start gap-3 text-right">
                                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">٣</span>
                                <p>سيتم تفعيل حسابك تلقائياً وتوجيهك لتسجيل الدخول</p>
                            </div>
                        </div>

                        {/* Auto-checking indicator */}
                        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                            >
                                <IoRefreshOutline size={14} />
                            </motion.div>
                            <span>نتحقق تلقائياً من التفعيل...</span>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3 pt-2">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={handleResend}
                                loading={loading}
                                disabled={cooldown > 0}
                                icon={<IoMailOutline size={18} />}
                            >
                                {cooldown > 0
                                    ? `إعادة إرسال بعد ${cooldown} ثانية`
                                    : 'إعادة إرسال إيميل التحقق'}
                            </Button>

                            <button
                                onClick={handleBackToLogin}
                                className="flex items-center justify-center gap-2 w-full text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors py-2"
                            >
                                <IoArrowBackOutline size={16} />
                                العودة لتسجيل الدخول
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
