'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { IoLocationOutline, IoTimeOutline, IoPeopleOutline, IoArrowBack } from 'react-icons/io5';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import LoadingSpinner from '../shared/LoadingSpinner';
import { getOpportunities } from '@/app/lib/firestore';
import { Opportunity } from '@/app/types';
import { categoryColors } from '@/app/lib/utils';

const categoryEmojis: Record<string, string> = {
    'تعليم': '📚',
    'صحة': '🏥',
    'بيئة': '🌿',
    'مجتمع': '🤝',
    'تقنية': '💻',
    'رياضة': '⚽',
    'ثقافة': '🎭',
    'إغاثة': '🆘',
};

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
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadOpportunities() {
            try {
                const opps = await getOpportunities({ status: 'open', excludePast: true });
                setOpportunities(opps.slice(0, 4)); // Show max 4 on landing
            } catch (error) {
                console.error('Error loading opportunities:', error);
            } finally {
                setLoading(false);
            }
        }
        loadOpportunities();
    }, []);

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
                    <Link href="/opportunities" className="mt-4 sm:mt-0">
                        <Button variant="outline" size="sm" icon={<IoArrowBack size={14} />}>
                            عرض الكل
                        </Button>
                    </Link>
                </motion.div>

                {/* Loading */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : opportunities.length > 0 ? (
                    /* Cards Grid */
                    <motion.div
                        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-60px' }}
                    >
                        {opportunities.map((opp) => {
                            const colors = categoryColors[opp.category] || categoryColors['مجتمع'];
                            const emoji = categoryEmojis[opp.category] || '🤝';
                            const spotsLeft = opp.spotsTotal - (opp.spotsFilled || 0);

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
                                    <Link href={`/opportunities/${opp.id}`}>
                                        {/* Image Area */}
                                        <div className={`h-40 ${opp.imageUrl ? '' : colors.bg} flex items-center justify-center relative overflow-hidden`}>
                                            {opp.imageUrl ? (
                                                <img
                                                    src={opp.imageUrl}
                                                    alt={opp.title}
                                                    loading="lazy"
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <motion.span
                                                    className="text-6xl"
                                                    whileHover={{ scale: 1.2, rotate: -5 }}
                                                    transition={{ type: 'spring', stiffness: 250 }}
                                                >
                                                    {emoji}
                                                </motion.span>
                                            )}
                                            <div className="absolute top-3 right-3">
                                                <Badge variant="info" size="sm">{opp.category}</Badge>
                                            </div>
                                            {opp.isRemote && (
                                                <div className="absolute top-3 left-3">
                                                    <Badge variant="success" size="sm">عن بُعد</Badge>
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="p-5">
                                            <h3 className="font-bold text-slate-800 mb-1.5 line-clamp-2 group-hover:text-primary-600 transition-colors duration-300">
                                                {opp.title}
                                            </h3>
                                            <p className="text-sm text-slate-400 mb-3">{opp.organizationName}</p>

                                            <div className="space-y-2 text-sm text-slate-500">
                                                <div className="flex items-center gap-2">
                                                    <IoLocationOutline className="text-slate-400" />
                                                    <span>{opp.location}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <IoTimeOutline className="text-slate-400" />
                                                    <span>{opp.duration} ساعات</span>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                                    <IoPeopleOutline size={13} />
                                                    {opp.spotsFilled || 0}/{opp.spotsTotal}
                                                </span>
                                                <Badge
                                                    variant={spotsLeft <= 3 ? 'danger' : 'success'}
                                                    size="sm"
                                                >
                                                    {spotsLeft > 0 ? `${spotsLeft} متبقي` : 'ممتلئ'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                ) : (
                    /* Empty State */
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center py-16"
                    >
                        <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">🌱</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-700 mb-2">لا توجد فرص متاحة حالياً</h3>
                        <p className="text-slate-400 max-w-md mx-auto">
                            سيتم إضافة فرص تطوعية جديدة قريباً عند نشرها من قبل المنظمات
                        </p>
                    </motion.div>
                )}
            </div>
        </section>
    );
}
