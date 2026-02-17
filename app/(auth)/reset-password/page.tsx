'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoLockClosedOutline,
    IoCheckmarkCircleOutline,
    IoArrowBackOutline,
    IoAlertCircleOutline,
    IoShieldCheckmarkOutline,
} from 'react-icons/io5';
import { verifyResetCode, confirmReset } from '@/app/lib/auth';
import Input from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';
import LoadingSpinner from '@/app/components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

type Step = 'verifying' | 'new-password' | 'success' | 'error';

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const oobCode = searchParams.get('oobCode');

    const [step, setStep] = useState<Step>('verifying');
    const [email, setEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        async function verify() {
            if (!oobCode) {
                setStep('error');
                setErrorMessage('رابط إعادة التعيين غير صالح أو منتهي الصلاحية');
                return;
            }
            try {
                const userEmail = await verifyResetCode(oobCode);
                setEmail(userEmail);
                setStep('new-password');
            } catch (error: any) {
                console.error('Verify reset code error:', error);
                setStep('error');
                if (error.code === 'auth/expired-action-code') {
                    setErrorMessage('انتهت صلاحية رابط إعادة التعيين. يرجى طلب رابط جديد');
                } else if (error.code === 'auth/invalid-action-code') {
                    setErrorMessage('رابط إعادة التعيين غير صالح أو تم استخدامه مسبقاً');
                } else {
                    setErrorMessage('حدث خطأ أثناء التحقق. يرجى المحاولة مرة أخرى');
                }
            }
        }
        verify();
    }, [oobCode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword.length < 6) {
            toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('كلمات المرور غير متطابقة');
            return;
        }
        if (!oobCode) return;

        setLoading(true);
        try {
            await confirmReset(oobCode, newPassword);
            setStep('success');
            toast.success('تم تغيير كلمة المرور بنجاح! 🎉');
        } catch (error: any) {
            console.error('Confirm reset error:', error);
            if (error.code === 'auth/expired-action-code') {
                toast.error('انتهت صلاحية الرابط. يرجى طلب رابط جديد');
            } else if (error.code === 'auth/weak-password') {
                toast.error('كلمة المرور ضعيفة جداً');
            } else {
                toast.error('حدث خطأ. يرجى المحاولة مرة أخرى');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 gradient-mesh" />
            <div className="absolute top-0 left-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-success-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

            <div className="relative flex items-center justify-center min-h-screen py-8 sm:py-12 px-3 sm:px-4">
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

                    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-card p-5 sm:p-8 border border-slate-100">
                        <AnimatePresence mode="wait">
                            {/* Verifying Step */}
                            {step === 'verifying' && (
                                <motion.div
                                    key="verifying"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="text-center py-8"
                                >
                                    <LoadingSpinner size="lg" />
                                    <p className="mt-4 text-slate-500 font-medium">جارٍ التحقق من الرابط...</p>
                                </motion.div>
                            )}

                            {/* New Password Step */}
                            {step === 'new-password' && (
                                <motion.form
                                    key="new-password"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ duration: 0.3 }}
                                    onSubmit={handleSubmit}
                                    className="space-y-5"
                                >
                                    <div className="text-center mb-4">
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                                            className="w-20 h-20 mx-auto rounded-full bg-primary-50 flex items-center justify-center mb-3"
                                        >
                                            <IoShieldCheckmarkOutline className="text-primary-600" size={36} />
                                        </motion.div>
                                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1.5">
                                            تعيين كلمة مرور جديدة
                                        </h1>
                                        <p className="text-sm text-slate-500">
                                            للحساب: <span className="font-medium text-slate-700" dir="ltr">{email}</span>
                                        </p>
                                    </div>

                                    <Input
                                        label="كلمة المرور الجديدة"
                                        type="password"
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        icon={<IoLockClosedOutline size={18} />}
                                        required
                                    />

                                    <Input
                                        label="تأكيد كلمة المرور"
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        icon={<IoLockClosedOutline size={18} />}
                                        required
                                    />

                                    {newPassword && confirmPassword && newPassword !== confirmPassword && (
                                        <p className="text-sm text-danger-500">كلمات المرور غير متطابقة</p>
                                    )}

                                    <Button type="submit" variant="primary" className="w-full" loading={loading}>
                                        تغيير كلمة المرور
                                    </Button>
                                </motion.form>
                            )}

                            {/* Success Step */}
                            {step === 'success' && (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center space-y-5 py-4"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
                                        className="w-24 h-24 mx-auto rounded-full bg-success-50 flex items-center justify-center"
                                    >
                                        <IoCheckmarkCircleOutline className="text-success-500" size={48} />
                                    </motion.div>

                                    <div>
                                        <h2 className="text-2xl font-black text-slate-900 mb-2">تم بنجاح! 🎉</h2>
                                        <p className="text-sm text-slate-500">
                                            تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.
                                        </p>
                                    </div>

                                    <Link href="/login">
                                        <Button variant="primary" className="w-full">
                                            تسجيل الدخول
                                        </Button>
                                    </Link>
                                </motion.div>
                            )}

                            {/* Error Step */}
                            {step === 'error' && (
                                <motion.div
                                    key="error"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center space-y-5 py-4"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                                        className="w-24 h-24 mx-auto rounded-full bg-danger-50 flex items-center justify-center"
                                    >
                                        <IoAlertCircleOutline className="text-danger-500" size={48} />
                                    </motion.div>

                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 mb-2">حدث خطأ</h2>
                                        <p className="text-sm text-slate-500">{errorMessage}</p>
                                    </div>

                                    <div className="space-y-3">
                                        <Link href="/forgot-password">
                                            <Button variant="primary" className="w-full">
                                                طلب رابط جديد
                                            </Button>
                                        </Link>
                                        <Link href="/login">
                                            <Button variant="outline" className="w-full">
                                                العودة لتسجيل الدخول
                                            </Button>
                                        </Link>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Back to login (only in new-password step) */}
                        {step === 'new-password' && (
                            <div className="mt-6 pt-4 border-t border-slate-100">
                                <Link
                                    href="/login"
                                    className="flex items-center justify-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                                >
                                    <IoArrowBackOutline size={16} />
                                    العودة لتسجيل الدخول
                                </Link>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
