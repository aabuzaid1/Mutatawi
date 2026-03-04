'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoSearchOutline,
    IoHandRightOutline,
    IoTrophyOutline,
    IoPersonAddOutline,
    IoDocumentTextOutline,
    IoRibbonOutline,
    IoMegaphoneOutline,
    IoPeopleOutline,
    IoStatsChartOutline,
    IoArrowForwardOutline,
} from 'react-icons/io5';
import { useAuth } from '@/app/hooks/useAuth';

const tabs = [
    { id: 'volunteers', label: 'المتطوعون', emoji: '🙋‍♂️' },
    { id: 'organizations', label: 'المنظمات', emoji: '🏢' },
    { id: 'teams', label: 'الفرق التطوعية', emoji: '👥' },
];

const tabContent: Record<string, {
    steps: { icon: any; title: string; description: string; color: string; bgColor: string; number: string }[];
    ctaText: string;
    ctaLink: string;
    ctaGradient: string;
}> = {
    volunteers: {
        steps: [
            {
                icon: IoPersonAddOutline,
                title: 'سجّل وتحقق',
                description: 'أنشئ حسابك على المنصة وأكد بياناتك للبدء في رحلتك التطوعية.',
                color: 'from-blue-500 to-primary-600',
                bgColor: 'bg-blue-50',
                number: '٠١',
            },
            {
                icon: IoDocumentTextOutline,
                title: 'أكمل ملفك الشخصي',
                description: 'أضف بياناتك الشخصية وارفع المستندات المطلوبة لتفعيل حسابك.',
                color: 'from-primary-500 to-purple-600',
                bgColor: 'bg-primary-50',
                number: '٠٢',
            },
            {
                icon: IoSearchOutline,
                title: 'تصفح الفرص وقدّم',
                description: 'اكتشف فرصاً تطوعية تناسب مهاراتك واهتماماتك وقدّم طلبك.',
                color: 'from-amber-500 to-orange-600',
                bgColor: 'bg-amber-50',
                number: '٠٣',
            },
            {
                icon: IoRibbonOutline,
                title: 'اكسب ساعات وشهادة',
                description: 'ساهم ميدانياً أو عن بُعد واحصل على ساعات موثّقة وشهادة معتمدة.',
                color: 'from-success-500 to-emerald-600',
                bgColor: 'bg-success-50',
                number: '٠٤',
            },
        ],
        ctaText: 'سجّل كمتطوع الآن',
        ctaLink: '/register?type=volunteer',
        ctaGradient: 'from-primary-500 to-primary-700',
    },
    organizations: {
        steps: [
            {
                icon: IoPersonAddOutline,
                title: 'سجّل منظمتك',
                description: 'أنشئ حساباً لمنظمتك على المنصة وأكد البريد الإلكتروني.',
                color: 'from-blue-500 to-primary-600',
                bgColor: 'bg-blue-50',
                number: '٠١',
            },
            {
                icon: IoDocumentTextOutline,
                title: 'أكمل بيانات المنظمة',
                description: 'أضف تفاصيل المنظمة والوثائق الرسمية لتوثيق حسابك.',
                color: 'from-primary-500 to-purple-600',
                bgColor: 'bg-primary-50',
                number: '٠٢',
            },
            {
                icon: IoMegaphoneOutline,
                title: 'انشر فرصاً تطوعية',
                description: 'أضف فرصاً تطوعية وحدد المتطلبات والمهارات المطلوبة.',
                color: 'from-amber-500 to-orange-600',
                bgColor: 'bg-amber-50',
                number: '٠٣',
            },
            {
                icon: IoStatsChartOutline,
                title: 'تابع المتطوعين والأداء',
                description: 'راقب أداء المتطوعين وأصدر الشهادات وتابع الإنجازات.',
                color: 'from-success-500 to-emerald-600',
                bgColor: 'bg-success-50',
                number: '٠٤',
            },
        ],
        ctaText: 'سجّل منظمتك الآن',
        ctaLink: '/register?type=organization',
        ctaGradient: 'from-success-500 to-emerald-700',
    },
    teams: {
        steps: [
            {
                icon: IoPersonAddOutline,
                title: 'سجّل فريقك',
                description: 'أنشئ حساباً لفريقك التطوعي على المنصة.',
                color: 'from-blue-500 to-primary-600',
                bgColor: 'bg-blue-50',
                number: '٠١',
            },
            {
                icon: IoPeopleOutline,
                title: 'أكمل بيانات الفريق',
                description: 'أضف تفاصيل الفريق وأعضاءه ومجالات العمل التطوعي.',
                color: 'from-primary-500 to-purple-600',
                bgColor: 'bg-primary-50',
                number: '٠٢',
            },
            {
                icon: IoMegaphoneOutline,
                title: 'نظّم أنشطة وفعاليات',
                description: 'انشر فرصاً تطوعية ونظّم فعاليات للفريق والمجتمع.',
                color: 'from-amber-500 to-orange-600',
                bgColor: 'bg-amber-50',
                number: '٠٣',
            },
            {
                icon: IoTrophyOutline,
                title: 'تابع الإنجازات',
                description: 'راقب ساعات الفريق والأثر المجتمعي وأصدر التقارير.',
                color: 'from-success-500 to-emerald-600',
                bgColor: 'bg-success-50',
                number: '٠٤',
            },
        ],
        ctaText: 'سجّل فريقك الآن',
        ctaLink: '/register?type=organization',
        ctaGradient: 'from-violet-500 to-purple-700',
    },
};

const containerVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.15,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.7,
            ease: [0.25, 0.46, 0.45, 0.94] as const,
        },
    },
};

export default function HowItWorks() {
    const [activeTab, setActiveTab] = useState('volunteers');
    const { user } = useAuth();
    const content = tabContent[activeTab];

    return (
        <section id="how-it-works" className="section-padding bg-slate-50 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-[float_10s_ease-in-out_infinite]" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-success-500/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-[float_12s_ease-in-out_infinite_reverse]" />

            <div className="max-w-7xl mx-auto relative">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                    className="text-center mb-10"
                >
                    <span className="inline-block px-4 py-2 rounded-full bg-primary-50 text-primary-600 text-sm font-medium mb-4">
                        كيف يعمل
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">
                        خطوات بسيطة للبدء
                    </h2>
                    <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                        منصة متطوع تجعل عملية التطوع سهلة وممتعة من البداية حتى النهاية
                    </p>
                </motion.div>

                {/* Tabs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="flex justify-center mb-12"
                >
                    <div className="inline-flex items-center bg-white rounded-2xl p-1.5 shadow-soft border border-slate-100">
                        {tabs.map((tab) => (
                            <motion.button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative px-5 sm:px-7 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${activeTab === tab.id
                                        ? 'text-white shadow-md'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                    }`}
                                whileTap={{ scale: 0.97 }}
                            >
                                {activeTab === tab.id && (
                                    <motion.div
                                        layoutId="activeTabBg"
                                        className="absolute inset-0 gradient-primary rounded-xl"
                                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <span className="relative z-10 hidden sm:inline">{tab.emoji}</span>
                                <span className="relative z-10">{tab.label}</span>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>

                {/* Steps - Animated Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                        <motion.div
                            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative"
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: '-80px' }}
                        >
                            {/* Connecting line */}
                            <motion.div
                                className="hidden lg:block absolute top-20 left-[12%] right-[12%] h-0.5 bg-gradient-to-l from-success-200 via-primary-200 to-blue-200"
                                initial={{ scaleX: 0 }}
                                whileInView={{ scaleX: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1.2, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                                style={{ originX: 1 }}
                            />

                            {content.steps.map((step) => {
                                const Icon = step.icon;
                                return (
                                    <motion.div
                                        key={step.title}
                                        variants={itemVariants}
                                        className="relative text-center group"
                                    >
                                        {/* Step icon */}
                                        <div className="relative inline-block mb-5">
                                            <motion.div
                                                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}
                                                whileHover={{
                                                    scale: 1.12,
                                                    rotate: -5,
                                                    transition: { type: 'spring', stiffness: 300, damping: 15 }
                                                }}
                                            >
                                                <Icon className="text-white" size={28} />
                                            </motion.div>
                                            <motion.span
                                                className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center text-xs font-black text-slate-700"
                                                initial={{ scale: 0 }}
                                                whileInView={{ scale: 1 }}
                                                viewport={{ once: true }}
                                                transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.5 }}
                                            >
                                                {step.number}
                                            </motion.span>
                                        </div>

                                        <h3 className="text-lg font-bold text-slate-800 mb-2">{step.title}</h3>
                                        <p className="text-slate-500 text-sm leading-relaxed max-w-[220px] mx-auto">{step.description}</p>
                                    </motion.div>
                                );
                            })}
                        </motion.div>

                        {/* CTA Button - only for guests */}
                        {!user && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.5, duration: 0.5 }}
                                className="text-center mt-12"
                            >
                                <Link href={content.ctaLink}>
                                    <motion.span
                                        className={`inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-l ${content.ctaGradient} text-white font-bold text-lg shadow-lg cursor-pointer`}
                                        whileHover={{ scale: 1.05, y: -2, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.25)' }}
                                        whileTap={{ scale: 0.97 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                    >
                                        <span>{content.ctaText}</span>
                                        <IoArrowForwardOutline className="rotate-180" size={20} />
                                    </motion.span>
                                </Link>
                            </motion.div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </section>
    );
}
