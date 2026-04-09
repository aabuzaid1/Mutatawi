'use client';

import { motion } from 'framer-motion';
import {
    IoDocumentTextOutline,
    IoRibbonOutline,
    IoCalculatorOutline,
    IoArrowForwardOutline,
    IoSwapHorizontalOutline,
    IoImageOutline,
    IoGitMergeOutline,
    IoSparklesOutline,
} from 'react-icons/io5';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { useAuth } from '@/app/hooks/useAuth';
import Link from 'next/link';

const aiTools = [
    {
        id: 'ai-agent',
        title: 'مساعد الدراسة الذكي',
        description: 'مساعد مدعوم بالذكاء الاصطناعي يلخص، يختبرك، ويصمم لك عروضاً وملفات.',
        icon: IoSparklesOutline,
        bgColor: 'bg-primary-50',
        iconColor: 'text-primary-600',
        borderColor: 'border-primary-100 hover:border-primary-300',
        href: '/ai-agent',
        requiresAuth: true,
    },
];

const volunteerTools = [
    {
        id: 'cv-builder',
        title: 'منشئ السيرة الذاتية',
        description: 'أنشئ سيرة ذاتية احترافية بصيغة PDF.',
        icon: IoDocumentTextOutline,
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
        borderColor: 'hover:border-blue-200',
        href: '/tools/cv-builder',
        requiresAuth: true,
    },
    {
        id: 'certificate',
        title: 'شهادات التطوع',
        description: 'اطبع شهادة تطوع بعد إكمال فرصة تطوعية.',
        icon: IoRibbonOutline,
        bgColor: 'bg-amber-50',
        iconColor: 'text-amber-600',
        borderColor: 'hover:border-amber-200',
        href: '/tools/certificate',
        requiresAuth: true,
    },
    {
        id: 'hours-calculator',
        title: 'حاسبة ساعات التطوع',
        description: 'احسب إجمالي ساعاتك مع ملخص تفصيلي.',
        icon: IoCalculatorOutline,
        bgColor: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
        borderColor: 'hover:border-emerald-200',
        href: '/tools/hours-calculator',
        requiresAuth: true,
    },
];

const converterTools = [
    {
        id: 'pdf-to-word',
        title: 'PDF إلى Word',
        description: 'حوّل ملفات PDF إلى مستندات Word.',
        icon: IoSwapHorizontalOutline,
        bgColor: 'bg-indigo-50',
        iconColor: 'text-indigo-600',
        borderColor: 'hover:border-indigo-200',
        href: '/tools/pdf-to-word',
        requiresAuth: true,
    },
    {
        id: 'word-to-pdf',
        title: 'Word إلى PDF',
        description: 'حوّل مستندات Word إلى PDF.',
        icon: IoSwapHorizontalOutline,
        bgColor: 'bg-violet-50',
        iconColor: 'text-violet-600',
        borderColor: 'hover:border-violet-200',
        href: '/tools/word-to-pdf',
        requiresAuth: true,
    },
    {
        id: 'ppt-to-pdf',
        title: 'PowerPoint إلى PDF',
        description: 'حوّل عروض PowerPoint إلى PDF.',
        icon: IoSwapHorizontalOutline,
        bgColor: 'bg-orange-50',
        iconColor: 'text-orange-600',
        borderColor: 'hover:border-orange-200',
        href: '/tools/ppt-to-pdf',
        requiresAuth: true,
    },
    {
        id: 'excel-to-pdf',
        title: 'Excel إلى PDF',
        description: 'حوّل جداول Excel إلى PDF.',
        icon: IoSwapHorizontalOutline,
        bgColor: 'bg-green-50',
        iconColor: 'text-green-600',
        borderColor: 'hover:border-green-200',
        href: '/tools/excel-to-pdf',
        requiresAuth: true,
    },
    {
        id: 'pdf-to-image',
        title: 'PDF إلى صورة',
        description: 'حوّل صفحات PDF إلى صور PNG.',
        icon: IoImageOutline,
        bgColor: 'bg-pink-50',
        iconColor: 'text-pink-600',
        borderColor: 'hover:border-pink-200',
        href: '/tools/pdf-to-image',
        requiresAuth: true,
    },
    {
        id: 'image-to-pdf',
        title: 'صورة إلى PDF',
        description: 'حوّل الصور إلى ملف PDF.',
        icon: IoImageOutline,
        bgColor: 'bg-cyan-50',
        iconColor: 'text-cyan-600',
        borderColor: 'hover:border-cyan-200',
        href: '/tools/image-to-pdf',
        requiresAuth: true,
    },
    {
        id: 'merge-pdf',
        title: 'دمج PDF',
        description: 'ادمج عدة ملفات PDF في ملف واحد.',
        icon: IoGitMergeOutline,
        bgColor: 'bg-red-50',
        iconColor: 'text-red-600',
        borderColor: 'hover:border-red-200',
        href: '/tools/merge-pdf',
        requiresAuth: true,
    },
];

function ToolCard({ tool, requiresAuth, user }: { tool: any; requiresAuth?: boolean; user: any }) {
    const Icon = tool.icon;
    return (
        <Link href={requiresAuth && !user ? '/login' : tool.href}>
            <div className={`group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl ${tool.borderColor} transition-all duration-300 p-6 cursor-pointer h-full flex flex-col`}>
                <div className={`w-14 h-14 rounded-2xl ${tool.bgColor} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={28} className={tool.iconColor} />
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-2 group-hover:text-primary-700 transition-colors">
                    {tool.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed flex-1 mb-4">
                    {tool.description}
                </p>
                <div className="flex items-center gap-2 text-sm font-bold text-primary-600 group-hover:gap-3 transition-all">
                    <span>استخدم الأداة</span>
                    <IoArrowForwardOutline size={16} className="rotate-180" />
                </div>
            </div>
        </Link>
    );
}

export default function ToolsPage() {
    const { user } = useAuth();

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-24 pb-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-full text-sm font-bold mb-4">
                            🔧 أدوات مجانية
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">
                            أدوات تساعدك في رحلتك
                        </h1>
                        <p className="text-slate-500 max-w-2xl mx-auto">
                            مجموعة من الأدوات المجانية لإدارة نشاطك التطوعي وتحويل ملفاتك
                        </p>
                    </motion.div>

                    {/* AI Tools Section */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 }}>
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            ✨ أدوات الذكاء الاصطناعي
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
                            {aiTools.map((tool, i) => (
                                <motion.div key={tool.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                                    <ToolCard tool={tool} requiresAuth={tool.requiresAuth} user={user} />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Volunteer Tools Section */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            🎯 أدوات المتطوعين
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
                            {volunteerTools.map((tool, i) => (
                                <motion.div key={tool.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                                    <ToolCard tool={tool} requiresAuth={tool.requiresAuth} user={user} />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Converter Tools Section */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            🔄 أدوات تحويل الملفات
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                            {converterTools.map((tool, i) => (
                                <motion.div key={tool.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 + 0.2 }}>
                                    <ToolCard tool={tool} requiresAuth={tool.requiresAuth} user={user} />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </main>
            <Footer />
        </>
    );
}
