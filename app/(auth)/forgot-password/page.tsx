'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { IoMailOutline, IoCheckmarkCircleOutline, IoArrowBackOutline, IoLockClosedOutline, IoShieldCheckmarkOutline } from 'react-icons/io5';
import Input from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';
import toast from 'react-hot-toast';

type Step = 'email' | 'otp' | 'new-password' | 'success';

export default function ForgotPasswordPage() {
    const [step, setStep] = useState<Step>('email');
    const [loading, setLoading] = useState(false);

    // Form States
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleBoxChange = (idx: number, val: string) => {
        const d = val.replace(/\D/g, '').slice(-1);
        const next = [...otp];
        next[idx] = d;
        setOtp(next);
        if (d && idx < 5) inputRefs.current[idx + 1]?.focus();
    };
    const handleBoxKey = (idx: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[idx] && idx > 0) inputRefs.current[idx - 1]?.focus();
    };
    const handleBoxPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const next = ['', '', '', '', '', ''];
        for (let i = 0; i < p.length; i++) next[i] = p[i];
        setOtp(next);
        inputRefs.current[Math.min(p.length, 5)]?.focus();
    };

    // --- Step 1: Send OTP to Email ---
    const handleSendOtp = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!email) {
            toast.error('يرجى إدخال البريد الإلكتروني');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, purpose: 'reset_password' }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'حدث خطأ أثناء الإرسال');

            toast.success('تم إرسال رمز التحقق إلى بريدك الإلكتروني!');
            setStep('otp');
            setOtp(['', '', '', '', '', '']); // Reset code input when moving to OTP step
        } catch (error: any) {
            toast.error(error.message || 'حدث خطأ أثناء الإرسال');
        } finally {
            setLoading(false);
        }
    };

    // --- Step 2: Verify OTP ---
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length < 6) {
            toast.error('يرجى إدخال رمز التحقق المكون من 6 أرقام');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code, keepAlive: true }),
            });

            const data = await res.json();
            if (!res.ok || !data.valid) {
                throw new Error(data.error || 'رمز التحقق غير صحيح');
            }

            // Move to the next step
            setStep('new-password');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    // --- Step 3: Set New Password ---
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (newPassword.length < 6) {
            toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('كلمتا المرور غير متطابقتين');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/reset-password-confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, newPassword }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'حدث خطأ أثناء إعادة التعيين');
            }

            setStep('success');
        } catch (error: any) {
            toast.error(error.message);
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
                    {step === 'email' ? 'نسيت كلمة المرور؟' :
                        step === 'otp' ? 'تحقق من بريدك!' :
                            step === 'new-password' ? 'كلمة مرور جديدة' : 'تم بنجاح!'}
                </h1>
                <p className="text-sm sm:text-base text-slate-500">
                    {step === 'email' ? 'أدخل بريدك الإلكتروني وسنرسل لك رمزاً لتغيير كلمة المرور' :
                        step === 'otp' ? 'أدخل رمز التحقق (OTP) المكون من 6 أرقام المرسل إلى بريدك' :
                            step === 'new-password' ? 'أدخل كلمة مرور قوية جديدة لحسابك' : 'تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول'
                    }
                </p>
            </div>

            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-card p-5 sm:p-8 border border-slate-100">
                <AnimatePresence mode="wait">

                    {/* STEP 1: Email */}
                    {step === 'email' && (
                        <motion.form
                            key="email-step"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                            onSubmit={handleSendOtp}
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
                                disabled={loading}
                            />

                            <Button type="submit" variant="primary" className="w-full" loading={loading}>
                                إرسال رمز التحقق
                            </Button>
                        </motion.form>
                    )}

                    {/* STEP 2: OTP Verification */}
                    {step === 'otp' && (
                        <motion.form
                            key="otp-step"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                            onSubmit={handleVerifyOtp}
                            className="space-y-5"
                        >
                            <div className="w-20 h-20 mx-auto rounded-full bg-primary-50 flex items-center justify-center mb-2">
                                <IoShieldCheckmarkOutline className="text-primary-600" size={36} />
                            </div>

                            <div className="bg-slate-50 rounded-xl p-3 text-center mb-4">
                                <p className="text-sm text-slate-500 mb-1">تم الإرسال إلى</p>
                                <p className="font-bold text-slate-800" dir="ltr">{email}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-3 text-center">رمز التحقق</label>
                                <div className="flex gap-2 sm:gap-3 justify-center" dir="ltr" onPaste={handleBoxPaste}>
                                    {otp.map((d, i) => (
                                        <input
                                            key={i}
                                            ref={el => { inputRefs.current[i] = el; }}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={d}
                                            onChange={e => handleBoxChange(i, e.target.value)}
                                            onKeyDown={e => handleBoxKey(i, e)}
                                            disabled={loading}
                                            className="w-11 h-12 sm:w-12 sm:h-14 border-2 border-slate-200 rounded-xl text-center text-xl sm:text-2xl font-bold text-slate-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition-all disabled:opacity-50 bg-slate-50 focus:bg-white"
                                        />
                                    ))}
                                </div>
                            </div>

                            <Button type="submit" variant="primary" className="w-full" loading={loading}>
                                التحقق والمتابعة
                            </Button>

                            <div className="pt-2 text-center">
                                <p className="text-sm text-slate-400 mb-2">لم يصلك الرمز؟</p>
                                <button
                                    type="button"
                                    onClick={() => handleSendOtp()}
                                    disabled={loading}
                                    className="text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50 transition-colors"
                                >
                                    إعادة إرسال الرمز
                                </button>
                            </div>
                        </motion.form>
                    )}

                    {/* STEP 3: New Password */}
                    {step === 'new-password' && (
                        <motion.form
                            key="new-password-step"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                            onSubmit={handleResetPassword}
                            className="space-y-5"
                        >
                            <div className="w-20 h-20 mx-auto rounded-full bg-primary-50 flex items-center justify-center mb-2">
                                <IoLockClosedOutline className="text-primary-600" size={36} />
                            </div>

                            <Input
                                label="كلمة المرور الجديدة"
                                type="password"
                                placeholder="••••••••"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                icon={<IoLockClosedOutline size={18} />}
                                required
                                disabled={loading}
                            />

                            <Input
                                label="تأكيد كلمة المرور الجديدة"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                icon={<IoLockClosedOutline size={18} />}
                                required
                                disabled={loading}
                            />

                            <Button type="submit" variant="primary" className="w-full" loading={loading}>
                                حفظ كلمة المرور الجديدة
                            </Button>
                        </motion.form>
                    )}

                    {/* STEP 4: Success Message */}
                    {step === 'success' && (
                        <motion.div
                            key="success-step"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.4 }}
                            className="text-center space-y-5"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
                                className="w-24 h-24 mx-auto rounded-full bg-success-50 flex items-center justify-center"
                            >
                                <IoCheckmarkCircleOutline className="text-success-500" size={48} />
                            </motion.div>

                            <Button
                                variant="primary"
                                className="w-full mt-4"
                                onClick={() => window.location.href = '/login'}
                            >
                                الانتقال لتسجيل الدخول
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Back Link */}
                {step !== 'success' && (
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
    );
}
