'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { IoMailOutline, IoLockClosedOutline, IoPersonOutline, IoLogoGoogle, IoCallOutline, IoLocationOutline } from 'react-icons/io5';
import { signUp, signInWithGoogle, signOut } from '@/app/lib/auth';
import Input from '../ui/Input';
import Button from '../ui/Button';
import RoleSelector from './RoleSelector';
import toast from 'react-hot-toast';
import { trackEvent } from '@/app/lib/analytics';

const governorates = [
    'عمان', 'إربد', 'الزرقاء', 'المفرق', 'عجلون', 'جرش',
    'مادبا', 'البلقاء', 'الكرك', 'الطفيلة', 'معان', 'العقبة',
];

export default function RegisterForm() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [governorate, setGovernorate] = useState('');
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
            await signUp(email, password, name, role, phone, governorate);
            trackEvent('register_success', { role });
            toast.success('تم إرسال إيميل التحقق، يرجى تفعيل حسابك لتتمكن من الدخول ✉️', {
                duration: 5000,
            });
            // Sign out so user must verify email before accessing dashboard
            await signOut();
            router.push('/verify-email');
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
            router.push('/complete-profile');
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
