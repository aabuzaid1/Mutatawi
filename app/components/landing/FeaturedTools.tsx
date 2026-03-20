'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    IoDocumentTextOutline,
    IoRibbonOutline,
    IoCalculatorOutline,
    IoSwapHorizontalOutline,
    IoImageOutline,
    IoGitMergeOutline,
    IoArrowBack,
    IoArrowForwardOutline,
    IoConstructOutline,
} from 'react-icons/io5';
import Button from '../ui/Button';
import { useAuth } from '@/app/hooks/useAuth';

const tools = [
    {
        id: 'cv-builder',
        title: 'منشئ السيرة الذاتية',
        description: 'أنشئ سيرة ذاتية احترافية بصيغة PDF',
        icon: IoDocumentTextOutline,
        gradient: 'from-blue-500 to-indigo-600',
        bgLight: 'bg-blue-50',
        iconColor: 'text-blue-600',
        href: '/tools/cv-builder',
        requiresAuth: true,
    },
    {
        id: 'certificate',
        title: 'شهادات التطوع',
        description: 'اطبع شهادة تطوع بعد إكمال فرصة',
        icon: IoRibbonOutline,
        gradient: 'from-amber-500 to-orange-600',
        bgLight: 'bg-amber-50',
        iconColor: 'text-amber-600',
        href: '/tools/certificate',
        requiresAuth: true,
    },
    {
        id: 'hours-calculator',
        title: 'حاسبة الساعات',
        description: 'احسب إجمالي ساعاتك التطوعية',
        icon: IoCalculatorOutline,
        gradient: 'from-emerald-500 to-teal-600',
        bgLight: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
        href: '/tools/hours-calculator',
        requiresAuth: true,
    },
    {
        id: 'word-to-pdf',
        title: 'Word إلى PDF',
        description: 'حوّل مستندات Word إلى PDF بسهولة',
        icon: IoSwapHorizontalOutline,
        gradient: 'from-violet-500 to-purple-600',
        bgLight: 'bg-violet-50',
        iconColor: 'text-violet-600',
        href: '/tools/word-to-pdf',
        requiresAuth: true,
    },
    {
        id: 'image-to-pdf',
        title: 'صورة إلى PDF',
        description: 'حوّل الصور إلى ملف PDF',
        icon: IoImageOutline,
        gradient: 'from-cyan-500 to-blue-600',
        bgLight: 'bg-cyan-50',
        iconColor: 'text-cyan-600',
        href: '/tools/image-to-pdf',
        requiresAuth: true,
    },
    {
        id: 'merge-pdf',
        title: 'دمج PDF',
        description: 'ادمج عدة ملفات PDF في ملف واحد',
        icon: IoGitMergeOutline,
        gradient: 'from-rose-500 to-red-600',
        bgLight: 'bg-rose-50',
        iconColor: 'text-rose-600',
        href: '/tools/merge-pdf',
        requiresAuth: true,
    },
];

const containerVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.08,
        },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.97 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.5,
            ease: [0.25, 0.46, 0.45, 0.94] as const,
        },
    },
};

export default function FeaturedTools() {
    const { user } = useAuth();

    return (
        <section className="section-padding bg-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-1/2 left-0 w-64 h-64 bg-primary-50/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute top-0 right-0 w-72 h-72 bg-amber-50/30 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />

            <div className="max-w-7xl mx-auto relative">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12"
                >
                    <div>
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-600 text-sm font-medium mb-4 border border-amber-100">
                            <IoConstructOutline size={16} />
                            أدوات مجانية
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">
                            أدوات تساعدك في رحلتك 🔧
                        </h2>
                        <p className="text-slate-500 text-lg">أدوات مجانية لإدارة نشاطك التطوعي وتحويل ملفاتك</p>
                    </div>
                    <Link href="/tools" className="mt-4 sm:mt-0">
                        <Button variant="outline" size="sm" icon={<IoArrowBack size={14} />}>
                            عرض جميع الأدوات
                        </Button>
                    </Link>
                </motion.div>

                {/* Tools Grid */}
                <motion.div
                    className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-60px' }}
                >
                    {tools.map((tool) => {
                        const Icon = tool.icon;
                        return (
                            <motion.div
                                key={tool.id}
                                variants={cardVariants}
                                whileHover={{
                                    y: -6,
                                    boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.1)',
                                    transition: { type: 'spring', stiffness: 300, damping: 20 }
                                }}
                                whileTap={{ scale: 0.98 }}
                                className="smooth-appear"
                            >
                                <Link href={tool.requiresAuth && !user ? '/login' : tool.href}>
                                    <div className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-slate-200 transition-all duration-300 p-6 cursor-pointer h-full flex flex-col relative overflow-hidden">
                                        {/* Hover gradient overlay */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${tool.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />

                                        <div className="relative">
                                            <div className={`w-14 h-14 rounded-2xl ${tool.bgLight} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                                                <Icon size={28} className={tool.iconColor} />
                                            </div>
                                            <h3 className="text-base font-bold text-slate-800 mb-2 group-hover:text-primary-700 transition-colors duration-300">
                                                {tool.title}
                                            </h3>
                                            <p className="text-sm text-slate-500 leading-relaxed flex-1 mb-4">
                                                {tool.description}
                                            </p>
                                            <div className="flex items-center gap-2 text-sm font-bold text-primary-600 group-hover:gap-3 transition-all duration-300">
                                                <span>استخدم الأداة</span>
                                                <IoArrowForwardOutline size={16} className="rotate-180" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}
