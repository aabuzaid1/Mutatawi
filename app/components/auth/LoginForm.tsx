'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { IoMailOutline, IoLockClosedOutline, IoLogoGoogle } from 'react-icons/io5';
import { signIn, signInWithGoogle } from '@/app/lib/auth';
import { getUserProfile } from '@/app/lib/auth';
import Input from '../ui/Input';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

export default function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const user = await signIn(email, password);
            const profile = await getUserProfile(user.uid);
            toast.success('تم تسجيل الدخول بنجاح!');
            router.push(profile?.role === 'organization' ? '/organization' : '/volunteer');
        } catch (error: any) {
            toast.error('خطأ في تسجيل الدخول. تحقق من بياناتك.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            const user = await signInWithGoogle();
            const profile = await getUserProfile(user.uid);
            toast.success('تم تسجيل الدخول بنجاح!');
            router.push(profile?.role === 'organization' ? '/organization' : '/volunteer');
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
                <h1 className="text-3xl font-black text-slate-900 mb-2">مرحباً بعودتك!</h1>
                <p className="text-slate-500">سجّل دخولك للوصول إلى لوحة التحكم</p>
            </div>

            <div className="bg-white rounded-3xl shadow-card p-8 border border-slate-100">
                <form onSubmit={handleSubmit} className="space-y-5">
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
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        icon={<IoLockClosedOutline size={18} />}
                        required
                    />

                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                            <input type="checkbox" className="rounded border-slate-300 text-primary-500" />
                            <span>تذكرني</span>
                        </label>
                        <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                            نسيت كلمة المرور؟
                        </a>
                    </div>

                    <Button type="submit" variant="primary" className="w-full" loading={loading}>
                        تسجيل الدخول
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
                    الدخول بحساب جوجل
                </Button>

                {/* Register Link */}
                <p className="text-center mt-6 text-slate-500">
                    ليس لديك حساب؟{' '}
                    <Link href="/register" className="text-primary-600 font-bold hover:text-primary-700">
                        سجّل الآن
                    </Link>
                </p>
            </div>
        </motion.div>
    );
}
