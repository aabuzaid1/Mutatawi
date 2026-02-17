'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { IoMailOutline, IoLockClosedOutline, IoCheckmarkCircleOutline, IoArrowBackOutline } from 'react-icons/io5';
import { resetPassword } from '@/app/lib/auth';
import Input from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';
import toast from 'react-hot-toast';

type Step = 'email' | 'sent';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<Step>('email');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast.error('يرجى إدخال البريد الإلكتروني');
            return;
        }
        setLoading(true);

        try {
            await resetPassword(email);
            setStep('sent');
            toast.success('تم إرسال رابط إعادة تعيين كلمة المرور!');
        } catch (error: any) {
            console.error('Forgot password error:', error);
            const code = error?.code || '';
            if (code === 'auth/user-not-found') {
                toast.error('لا يوجد حساب مرتبط بهذا البريد الإلكتروني');
            } else if (code === 'auth/invalid-email') {
                toast.error('البريد الإلكتروني غير صالح');
            } else if (code === 'auth/too-many-requests') {
                toast.error('تم إرسال عدة طلبات. يرجى المحاولة لاحقاً');
            } else if (code === 'auth/network-request-failed') {
                toast.error('خطأ في الاتصال. تحقق من اتصالك بالإنترنت');
            } else if (code === 'auth/unauthorized-continue-uri') {
                // Still send even without actionCodeSettings
                toast.error('حدث خطأ في الإعدادات. يرجى التواصل مع الدعم');
            } else {
                toast.error(`حدث خطأ: ${error?.message || 'يرجى المحاولة مرة أخرى'}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setLoading(true);
        try {
            await resetPassword(email);
            toast.success('تم إعادة إرسال رابط إعادة التعيين!');
        } catch (error: any) {
            toast.error('حدث خطأ. يرجى المحاولة مرة أخرى');
        } finally {
            setLoading(false);
        }
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
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1.5 sm:mb-2">
                    {step === 'email' ? 'نسيت كلمة المرور؟' : 'تحقق من بريدك!'}
                </h1>
                <p className="text-sm sm:text-base text-slate-500">
                    {step === 'email'
                        ? 'أدخل بريدك الإلكتروني وسنرسل لك رابط لإعادة تعيين كلمة المرور'
                        : 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني'
                    }
                </p>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-card p-5 sm:p-8 border border-slate-100">
                <AnimatePresence mode="wait">
                    {step === 'email' && (
                        <motion.form
                            key="email-step"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                            onSubmit={handleSubmit}
                            className="space-y-5"
                        >
                            <div className="w-20 h-20 mx-auto rounded-full bg-primary-50 flex items-center justify-center mb-2">
                                <IoMailOutline className="text-primary-600" size={36} />
                            </div>

                            <Input
                                label="البريد الإلكتروني"
                                type="email"
                                placeholder="example@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                icon={<IoMailOutline size={18} />}
                                required
                            />

                            <Button type="submit" variant="primary" className="w-full" loading={loading}>
                                إرسال رابط إعادة التعيين
                            </Button>
                        </motion.form>
                    )}

                    {step === 'sent' && (
                        <motion.div
                            key="sent-step"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4 }}
                            className="text-center space-y-5"
                        >
                            {/* Success Icon */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
                                className="w-24 h-24 mx-auto rounded-full bg-success-50 flex items-center justify-center"
                            >
                                <IoCheckmarkCircleOutline className="text-success-500" size={48} />
                            </motion.div>

                            {/* Email display */}
                            <div className="bg-slate-50 rounded-xl p-4">
                                <p className="text-sm text-slate-500 mb-1">تم الإرسال إلى</p>
                                <p className="font-bold text-slate-800" dir="ltr">{email}</p>
                            </div>

                            {/* Instructions */}
                            <div className="space-y-3 text-sm text-slate-600">
                                <div className="flex items-start gap-3 text-right">
                                    <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">١</span>
                                    <p>افتح بريدك الإلكتروني وابحث عن رسالة إعادة تعيين كلمة المرور</p>
                                </div>
                                <div className="flex items-start gap-3 text-right">
                                    <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">٢</span>
                                    <p>اضغط على الرابط في الرسالة وسيتم توجيهك للموقع</p>
                                </div>
                                <div className="flex items-start gap-3 text-right">
                                    <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">٣</span>
                                    <p>أدخل كلمة المرور الجديدة مباشرة في الموقع</p>
                                </div>
                            </div>

                            {/* Resend */}
                            <div className="pt-2">
                                <p className="text-sm text-slate-400 mb-3">لم تصلك الرسالة؟</p>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={handleResend}
                                    loading={loading}
                                >
                                    إعادة إرسال الرابط
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Back to login */}
                <div className="mt-6 pt-4 border-t border-slate-100">
                    <Link
                        href="/login"
                        className="flex items-center justify-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                    >
                        <IoArrowBackOutline size={16} />
                        العودة لتسجيل الدخول
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
