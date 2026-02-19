'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { IoRocketOutline, IoArrowBack } from 'react-icons/io5';
import Button from '../ui/Button';
import { useAuth } from '@/app/hooks/useAuth';

// Smooth stagger container
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.12,
            delayChildren: 0.2,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.7,
            ease: [0.25, 0.46, 0.45, 0.94] as const,
        },
    },
};

export default function Hero() {
    const { user } = useAuth();

    return (
        <section className="relative min-h-screen flex items-center overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 gradient-mesh" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/0 to-white" />

            {/* Floating Elements — CSS-only for performance */}
            <div className="absolute top-32 left-10 w-20 h-20 rounded-2xl bg-primary-500/10 blur-sm hidden lg:block animate-[float_10s_ease-in-out_infinite]" />
            <div className="absolute bottom-32 right-20 w-32 h-32 rounded-full bg-success-500/10 blur-sm hidden lg:block animate-[float_8s_ease-in-out_infinite_reverse]" />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Text Content — staggered reveal */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <motion.div
                            variants={itemVariants}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-100 text-primary-600 text-sm font-medium mb-6"
                        >
                            <motion.span
                                animate={{ rotate: [0, 15, -15, 0] }}
                                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                            >
                                <IoRocketOutline />
                            </motion.span>
                            <span>منصة التطوع الأولى في المنطقة</span>
                        </motion.div>

                        <motion.h1
                            variants={itemVariants}
                            className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight mb-6"
                        >
                            اصنع فرقاً{' '}
                            <motion.span
                                className="text-gradient inline-block"
                                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                                transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                                style={{ backgroundSize: '200% 200%' }}
                            >
                                حقيقياً
                            </motion.span>
                            <br />
                            في مجتمعك
                        </motion.h1>

                        <motion.p
                            variants={itemVariants}
                            className="text-lg sm:text-xl text-slate-500 leading-relaxed mb-8 max-w-xl"
                        >
                            انضم إلى مجتمع المتطوعين واكتشف فرصاً تطوعية تناسب مهاراتك واهتماماتك.
                            ساهم في بناء مستقبل أفضل وأثّر في حياة الآخرين.
                        </motion.p>

                        <motion.div
                            variants={itemVariants}
                            className="flex flex-wrap gap-4"
                        >
                            <Link href={user ? '/opportunities' : '/login'}>
                                <Button variant="primary" size="lg" icon={<IoArrowBack />}>
                                    ابدأ التطوع الآن
                                </Button>
                            </Link>
                            <Link href="#how-it-works">
                                <Button variant="secondary" size="lg">
                                    كيف يعمل
                                </Button>
                            </Link>
                        </motion.div>

                    </motion.div>

                    {/* Illustration — smoother floating */}
                    <motion.div
                        initial={{ opacity: 0, x: -60, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{
                            duration: 0.9,
                            delay: 0.4,
                            ease: [0.25, 0.46, 0.45, 0.94] as const,
                        }}
                        className="relative hidden lg:block"
                    >
                        <div className="relative w-full aspect-square max-w-lg mx-auto">
                            {/* Main Card */}
                            <motion.div
                                animate={{ y: [-8, 8, -8] }}
                                transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
                                className="absolute inset-8 rounded-3xl gradient-primary shadow-glow flex items-center justify-center"
                            >
                                <div className="text-center text-white p-8">
                                    <motion.div
                                        className="text-7xl mb-4"
                                        animate={{ scale: [1, 1.05, 1] }}
                                        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                                    >
                                        🤝
                                    </motion.div>
                                    <h3 className="text-2xl font-bold mb-2">تواصل • تطوع • أثّر</h3>
                                    <p className="text-white/80">معاً نبني مجتمعاً أفضل</p>
                                </div>
                            </motion.div>

                            {/* Floating mini cards — smoother motion */}
                            <motion.div
                                animate={{ y: [-4, 12, -4], x: [-3, 4, -3] }}
                                transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
                                whileHover={{ scale: 1.05 }}
                                className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-card p-4 flex items-center gap-3"
                            >
                                <motion.div
                                    className="w-10 h-10 rounded-xl bg-success-50 flex items-center justify-center text-success-500 text-xl"
                                    animate={{ scale: [1, 1.15, 1] }}
                                    transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut', delay: 0.5 }}
                                >
                                    ✓
                                </motion.div>
                                <div>
                                    <p className="text-sm font-bold text-slate-700">فرصة جديدة!</p>
                                    <p className="text-xs text-slate-400">تعليم أطفال</p>
                                </div>
                            </motion.div>

                            <motion.div
                                animate={{ y: [4, -12, 4], x: [3, -4, 3] }}
                                transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
                                whileHover={{ scale: 1.05 }}
                                className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-card p-4 flex items-center gap-3"
                            >
                                <motion.div
                                    className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-xl"
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                                >
                                    🏆
                                </motion.div>
                                <div>
                                    <p className="text-sm font-bold text-slate-700">+١٢٠ ساعة</p>
                                    <p className="text-xs text-slate-400">ساعات تطوعية</p>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
