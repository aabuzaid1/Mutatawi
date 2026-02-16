'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { IoMailOutline, IoLockClosedOutline, IoPersonOutline, IoLogoGoogle } from 'react-icons/io5';
import { signUp, signInWithGoogle } from '@/app/lib/auth';
import Input from '../ui/Input';
import Button from '../ui/Button';
import RoleSelector from './RoleSelector';
import toast from 'react-hot-toast';

export default function RegisterForm() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState<'volunteer' | 'organization'>('volunteer');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('كلمات المرور غير متطابقة');
            return;
        }

        if (password.length < 6) {
            toast.error('كلمة المرور يجب أن تكون ٦ أحرف على الأقل');
            return;
        }

        setLoading(true);

        try {
            await signUp(email, password, name, role);
            toast.success('تم إنشاء حسابك بنجاح! 🎉');
            router.push(role === 'organization' ? '/organization' : '/volunteer');
        } catch (error: any) {
            if (error.code === 'auth/email-already-in-use') {
                toast.error('هذا البريد الإلكتروني مستخدم بالفعل');
            } else {
                toast.error('حدث خطأ أثناء التسجيل. حاول مرة أخرى.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
            toast.success('تم تسجيل الدخول بنجاح!');
            router.push('/volunteer');
        } catch (error: any) {
            toast.error('حدث خطأ أثناء تسجيل الدخول بجوجل.');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md mx-auto"
        >
            <div className="text-center mb-8">
                <Link href="/" className="inline-flex items-center gap-2 mb-6">
                    <img src="/logo.png" alt="متطوع" className="w-12 h-12 rounded-full shadow-lg" />
                </Link>
                <h1 className="text-3xl font-black text-slate-900 mb-2">إنشاء حساب جديد</h1>
                <p className="text-slate-500">انضم إلى مجتمع المتطوعين اليوم</p>
            </div>

            <div className="bg-white rounded-3xl shadow-card p-8 border border-slate-100">
                {/* Role Selector */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-3">
                        نوع الحساب
                    </label>
                    <RoleSelector selectedRole={role} onSelect={setRole} />
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <Input
                        label={role === 'organization' ? 'اسم المنظمة' : 'الاسم الكامل'}
                        type="text"
                        placeholder={role === 'organization' ? 'اسم المنظمة' : 'الاسم الثلاثي'}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        icon={<IoPersonOutline size={18} />}
                        required
                    />

                    <Input
                        label="البريد الإلكتروني"
                        type="email"
                        placeholder="example@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        icon={<IoMailOutline size={18} />}
                        required
                    />

                    <Input
                        label="كلمة المرور"
                        type="password"
                        placeholder="٦ أحرف على الأقل"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        icon={<IoLockClosedOutline size={18} />}
                        required
                    />

                    <Input
                        label="تأكيد كلمة المرور"
                        type="password"
                        placeholder="أعد كتابة كلمة المرور"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        icon={<IoLockClosedOutline size={18} />}
                        required
                    />

                    <Button type="submit" variant="primary" className="w-full" loading={loading}>
                        إنشاء الحساب
                    </Button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 h-px bg-slate-200" />
                    <span className="text-sm text-slate-400">أو</span>
                    <div className="flex-1 h-px bg-slate-200" />
                </div>

                {/* Google Sign In */}
                <Button
                    variant="outline"
                    className="w-full"
                    icon={<IoLogoGoogle />}
                    onClick={handleGoogleSignIn}
                >
                    التسجيل بحساب جوجل
                </Button>

                {/* Login Link */}
                <p className="text-center mt-6 text-slate-500">
                    لديك حساب بالفعل؟{' '}
                    <Link href="/login" className="text-primary-600 font-bold hover:text-primary-700">
                        سجّل دخولك
                    </Link>
                </p>
            </div>
        </motion.div>
    );
}
