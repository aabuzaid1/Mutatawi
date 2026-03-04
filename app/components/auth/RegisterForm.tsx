'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoMailOutline,
    IoLockClosedOutline,
    IoPersonOutline,
    IoLogoGoogle,
    IoCallOutline,
    IoLocationOutline,
    IoArrowForwardOutline,
    IoCheckmarkCircle,
    IoBusinessOutline,
    IoPeopleOutline,
} from 'react-icons/io5';
import { signUp, signInWithGoogle, signOut } from '@/app/lib/auth';
import Input from '../ui/Input';
import Button from '../ui/Button';
import toast from 'react-hot-toast';
import { trackEvent } from '@/app/lib/analytics';

const governorates = [
    'عمان', 'إربد', 'الزرقاء', 'المفرق', 'عجلون', 'جرش',
    'مادبا', 'البلقاء', 'الكرك', 'الطفيلة', 'معان', 'العقبة',
];

const accountTypes = [
    {
        id: 'volunteer' as const,
        title: 'متطوع فرد',
        subtitle: 'أبحث عن فرص تطوعية للمشاركة في خدمة مجتمعي',
        emoji: '🙋‍♂️',
        gradient: 'from-primary-500 to-primary-700',
        lightBg: 'bg-primary-50',
        borderColor: 'border-primary-200',
        hoverBorder: 'hover:border-primary-400',
        selectedBorder: 'border-primary-500',
        iconColor: 'text-primary-600',
        steps: [
            { num: '١', text: 'سجّل حسابك' },
            { num: '٢', text: 'أكمل ملفك الشخصي' },
            { num: '٣', text: 'تصفح الفرص وقدّم' },
            { num: '٤', text: 'اكسب ساعات وشهادات' },
        ],
    },
    {
        id: 'organization' as const,
        title: 'منظمة / فريق تطوعي',
        subtitle: 'أريد نشر فرص تطوعية وإدارة المتطوعين',
        emoji: '🏢',
        gradient: 'from-success-500 to-emerald-700',
        lightBg: 'bg-success-50',
        borderColor: 'border-success-200',
        hoverBorder: 'hover:border-success-400',
        selectedBorder: 'border-success-500',
        iconColor: 'text-success-600',
        steps: [
            { num: '١', text: 'سجّل منظمتك' },
            { num: '٢', text: 'أكمل بيانات المنظمة' },
            { num: '٣', text: 'انشر فرصاً تطوعية' },
            { num: '٤', text: 'تابع المتطوعين والأداء' },
        ],
    },
];

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 300 : -300,
        opacity: 0,
        scale: 0.95,
    }),
    center: {
        x: 0,
        opacity: 1,
        scale: 1,
    },
    exit: (direction: number) => ({
        x: direction > 0 ? -300 : 300,
        opacity: 0,
        scale: 0.95,
    }),
};

export default function RegisterForm() {
    const [step, setStep] = useState<1 | 2>(1);
    const [direction, setDirection] = useState(1);
    const [selectedType, setSelectedType] = useState<'volunteer' | 'organization'>('volunteer');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [governorate, setGovernorate] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Handle ?type= query param for deep linking from HowItWorks
    useEffect(() => {
        const typeParam = searchParams.get('type');
        if (typeParam === 'volunteer' || typeParam === 'organization') {
            setSelectedType(typeParam);
            setStep(2);
        }
    }, [searchParams]);

    const goToStep2 = (type: 'volunteer' | 'organization') => {
        setSelectedType(type);
        setDirection(1);
        setStep(2);
    };

    const goBack = () => {
        setDirection(-1);
        setStep(1);
    };

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
            await signUp(email, password, name, selectedType, phone, governorate);
            trackEvent('register_success', { role: selectedType });
            toast.success('تم إرسال إيميل التحقق، يرجى تفعيل حسابك لتتمكن من الدخول ✉️', {
                duration: 5000,
            });
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

    const currentTypeInfo = accountTypes.find(t => t.id === selectedType)!;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-3xl mx-auto"
        >
            {/* Logo + Header */}
            <div className="text-center mb-8">
                <Link href="/" className="inline-flex items-center gap-2 mb-6">
                    <img src="/logo.png" alt="متطوع" className="w-12 h-12 rounded-full shadow-lg" />
                </Link>
                <h1 className="text-3xl font-black text-slate-900 mb-2">انضم إلى متطوع</h1>
                <p className="text-slate-500">اختر نوع حسابك وابدأ رحلتك اليوم</p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-3 mb-8">
                {[
                    { num: 1, label: 'نوع الحساب' },
                    { num: 2, label: 'بيانات التسجيل' },
                ].map((s, i) => (
                    <div key={s.num} className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <motion.div
                                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${step >= s.num
                                    ? 'gradient-primary text-white shadow-glow'
                                    : 'bg-slate-100 text-slate-400'
                                    }`}
                                animate={step >= s.num ? { scale: [1, 1.1, 1] } : {}}
                                transition={{ duration: 0.3 }}
                            >
                                {step > s.num ? (
                                    <IoCheckmarkCircle size={20} />
                                ) : (
                                    s.num
                                )}
                            </motion.div>
                            <span className={`text-sm font-medium hidden sm:block ${step >= s.num ? 'text-primary-600' : 'text-slate-400'
                                }`}>
                                {s.label}
                            </span>
                        </div>
                        {i < 1 && (
                            <div className={`w-12 sm:w-20 h-0.5 rounded-full transition-colors duration-500 ${step > 1 ? 'bg-primary-400' : 'bg-slate-200'
                                }`} />
                        )}
                    </div>
                ))}
            </div>

            {/* Step Content */}
            <div className="relative overflow-hidden">
                <AnimatePresence mode="wait" custom={direction}>
                    {step === 1 ? (
                        <motion.div
                            key="step1"
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                            {/* Account Type Cards */}
                            <div className="grid md:grid-cols-2 gap-5">
                                {accountTypes.map((type) => (
                                    <motion.div
                                        key={type.id}
                                        whileHover={{ y: -4, boxShadow: '0 20px 50px -12px rgba(0,0,0,0.12)' }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`relative bg-white rounded-3xl border-2 ${type.borderColor} ${type.hoverBorder} p-6 sm:p-7 cursor-pointer transition-all duration-300 shadow-soft group`}
                                        onClick={() => goToStep2(type.id)}
                                    >
                                        {/* Emoji & Title */}
                                        <div className="text-center mb-5">
                                            <motion.div
                                                className="text-5xl mb-3"
                                                whileHover={{ scale: 1.15, rotate: -5 }}
                                                transition={{ type: 'spring', stiffness: 300 }}
                                            >
                                                {type.emoji}
                                            </motion.div>
                                            <h3 className="text-xl font-bold text-slate-800 mb-1">{type.title}</h3>
                                            <p className="text-sm text-slate-400">{type.subtitle}</p>
                                        </div>

                                        {/* Steps Preview */}
                                        <div className="space-y-2.5 mb-5">
                                            {type.steps.map((s) => (
                                                <div key={s.num} className="flex items-center gap-3">
                                                    <div className={`w-7 h-7 rounded-lg ${type.lightBg} flex items-center justify-center`}>
                                                        <span className={`text-xs font-bold ${type.iconColor}`}>{s.num}</span>
                                                    </div>
                                                    <span className="text-sm text-slate-600">{s.text}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* CTA Button */}
                                        <motion.div
                                            className={`w-full py-3 rounded-xl bg-gradient-to-l ${type.gradient} text-white text-center font-bold text-sm shadow-soft`}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.97 }}
                                        >
                                            ابدأ التسجيل
                                        </motion.div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Login Link */}
                            <p className="text-center mt-6 text-slate-500">
                                لديك حساب بالفعل؟{' '}
                                <Link href="/login" className="text-primary-600 font-bold hover:text-primary-700">
                                    سجّل دخولك
                                </Link>
                            </p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="step2"
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                            <div className="bg-white rounded-3xl shadow-card p-6 sm:p-8 border border-slate-100">
                                {/* Back Button + Type Badge */}
                                <div className="flex items-center justify-between mb-6">
                                    <motion.button
                                        onClick={goBack}
                                        className="flex items-center gap-2 text-slate-500 hover:text-primary-600 transition-colors text-sm font-medium"
                                        whileHover={{ x: 5 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <IoArrowForwardOutline size={18} />
                                        <span>تغيير نوع الحساب</span>
                                    </motion.button>
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${currentTypeInfo.lightBg}`}>
                                        <span className="text-base">{currentTypeInfo.emoji}</span>
                                        <span className={`text-xs font-bold ${currentTypeInfo.iconColor}`}>{currentTypeInfo.title}</span>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <Input
                                        label={selectedType === 'organization' ? 'اسم المنظمة / الفريق' : 'الاسم الكامل'}
                                        type="text"
                                        placeholder={selectedType === 'organization' ? 'اسم المنظمة أو الفريق التطوعي' : 'الاسم الثلاثي'}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        icon={selectedType === 'organization' ? <IoBusinessOutline size={18} /> : <IoPersonOutline size={18} />}
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
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
