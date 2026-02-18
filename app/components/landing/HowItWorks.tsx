'use client';

import { motion } from 'framer-motion';
import { IoSearchOutline, IoHandRightOutline, IoTrophyOutline } from 'react-icons/io5';

const containerVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.2,
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
    const steps = [
        {
            icon: IoSearchOutline,
            title: 'اكتشف الفرص',
            description: 'تصفح مئات الفرص التطوعية المتاحة في مجتمعك واختر ما يناسب مهاراتك واهتماماتك.',
            color: 'from-blue-500 to-primary-600',
            bgColor: 'bg-blue-50',
            number: '٠١',
        },
        {
            icon: IoHandRightOutline,
            title: 'سجّل وشارك',
            description: 'قدّم طلبك للمشاركة في الفرصة التطوعية التي تناسبك وانتظر الموافقة من المنظمة.',
            color: 'from-primary-500 to-purple-600',
            bgColor: 'bg-primary-50',
            number: '٠٢',
        },
        {
            icon: IoTrophyOutline,
            title: 'أثّر واحصد',
            description: 'ساهم في مجتمعك واحصل على شهادات تطوع وساعات معتمدة تعزز سيرتك الذاتية.',
            color: 'from-success-500 to-emerald-600',
            bgColor: 'bg-success-50',
            number: '٠٣',
        },
    ];

    return (
        <section id="how-it-works" className="section-padding bg-slate-50 relative overflow-hidden">
            {/* Background decoration — CSS-only */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-[float_10s_ease-in-out_infinite]" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-success-500/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 animate-[float_12s_ease-in-out_infinite_reverse]" />

            <div className="max-w-7xl mx-auto relative">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                    className="text-center mb-16"
                >
                    <span className="inline-block px-4 py-2 rounded-full bg-primary-50 text-primary-600 text-sm font-medium mb-4">
                        كيف يعمل
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">
                        ثلاث خطوات بسيطة للبدء
                    </h2>
                    <p className="text-slate-500 text-lg max-w-2xl mx-auto">
                        منصة متطوع تجعل عملية التطوع سهلة وممتعة من البداية حتى النهاية
                    </p>
                </motion.div>

                {/* Steps */}
                <motion.div
                    className="grid md:grid-cols-3 gap-8 relative"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-80px' }}
                >
                    {/* Connecting line — animated */}
                    <motion.div
                        className="hidden md:block absolute top-24 left-1/6 right-1/6 h-0.5 bg-gradient-to-l from-success-200 via-primary-200 to-blue-200"
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                        style={{ originX: 1 }}
                    />

                    {steps.map((step) => {
                        const Icon = step.icon;
                        return (
                            <motion.div
                                key={step.title}
                                variants={itemVariants}
                                className="relative text-center group"
                            >
                                {/* Step number */}
                                <div className="relative inline-block mb-6">
                                    <motion.div
                                        className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}
                                        whileHover={{
                                            scale: 1.12,
                                            rotate: -5,
                                            transition: { type: 'spring', stiffness: 300, damping: 15 }
                                        }}
                                    >
                                        <Icon className="text-white" size={32} />
                                    </motion.div>
                                    <motion.span
                                        className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-xs font-black text-slate-700"
                                        initial={{ scale: 0 }}
                                        whileInView={{ scale: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.5 }}
                                    >
                                        {step.number}
                                    </motion.span>
                                </div>

                                <h3 className="text-xl font-bold text-slate-800 mb-3">{step.title}</h3>
                                <p className="text-slate-500 leading-relaxed max-w-xs mx-auto">{step.description}</p>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}
