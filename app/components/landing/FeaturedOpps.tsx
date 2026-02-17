'use client';


import { motion } from 'framer-motion';
import { IoLocationOutline, IoTimeOutline } from 'react-icons/io5';
import Badge from '../ui/Badge';

import { categoryColors } from '@/app/lib/utils';

const featuredOpportunities = [
    {
        id: '1',
        title: 'تدريس اللغة العربية للأطفال',
        organization: 'جمعية الأمل',
        category: 'تعليم',
        location: 'عمّان',
        date: '٢٥ فبراير ٢٠٢٤',
        duration: '٣ ساعات',
        spots: 8,
        image: '📚',
    },
    {
        id: '2',
        title: 'حملة تنظيف الشواطئ',
        organization: 'جمعية البيئة الخضراء',
        category: 'بيئة',
        location: 'العقبة',
        date: '١ مارس ٢٠٢٤',
        duration: '٥ ساعات',
        spots: 20,
        image: '🌊',
    },
    {
        id: '3',
        title: 'رعاية المسنين',
        organization: 'دار السلام',
        category: 'مجتمع',
        location: 'إربد',
        date: '١٠ مارس ٢٠٢٤',
        duration: '٤ ساعات',
        spots: 12,
        image: '🤲',
    },
    {
        id: '4',
        title: 'ورشة برمجة للشباب',
        organization: 'تقنيون بلا حدود',
        category: 'تقنية',
        location: 'عن بُعد',
        date: '١٥ مارس ٢٠٢٤',
        duration: '٢ ساعة',
        spots: 30,
        image: '💻',
    },
];

const containerVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.96 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.6,
            ease: [0.25, 0.46, 0.45, 0.94] as const,
        },
    },
};

export default function FeaturedOpps() {
    return (
        <section className="section-padding bg-white">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12"
                >
                    <div>
                        <span className="inline-block px-4 py-2 rounded-full bg-success-50 text-success-600 text-sm font-medium mb-4">
                            فرص مميزة
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">
                            أحدث الفرص التطوعية
                        </h2>
                        <p className="text-slate-500 text-lg">اختر الفرصة التي تناسبك وابدأ التغيير</p>
                    </div>

                </motion.div>

                {/* Cards Grid */}
                <motion.div
                    className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-60px' }}
                >
                    {featuredOpportunities.map((opp) => {
                        const colors = categoryColors[opp.category] || categoryColors['مجتمع'];
                        return (
                            <motion.div
                                key={opp.id}
                                variants={cardVariants}
                                whileHover={{
                                    y: -8,
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
                                    transition: { type: 'spring', stiffness: 300, damping: 20 }
                                }}
                                whileTap={{ scale: 0.98 }}
                                className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden group cursor-pointer smooth-appear"
                            >
                                {/* Image Area */}
                                <div className={`h-40 ${opp.image?.startsWith('http') ? '' : colors.bg} flex items-center justify-center relative overflow-hidden`}>
                                    {opp.image?.startsWith('http') ? (
                                        <img
                                            src={opp.image}
                                            alt={opp.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <motion.span
                                            className="text-6xl"
                                            whileHover={{ scale: 1.2, rotate: -5 }}
                                            transition={{ type: 'spring', stiffness: 250 }}
                                        >
                                            {opp.image}
                                        </motion.span>
                                    )}
                                    <div className="absolute top-3 right-3">
                                        <Badge variant="info" size="sm">{opp.category}</Badge>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    <h3 className="font-bold text-slate-800 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors duration-300">
                                        {opp.title}
                                    </h3>
                                    <p className="text-sm text-slate-400 mb-3">{opp.organization}</p>

                                    <div className="space-y-2 text-sm text-slate-500">
                                        <div className="flex items-center gap-2">
                                            <IoLocationOutline className="text-slate-400" />
                                            <span>{opp.location}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <IoTimeOutline className="text-slate-400" />
                                            <span>{opp.duration}</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                                        <span className="text-xs text-slate-400">{opp.date}</span>
                                        <Badge variant="success" size="sm">{opp.spots} مقعد متاح</Badge>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}
