'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IoStarSharp, IoStarOutline, IoChatbubbleEllipsesOutline } from 'react-icons/io5';
import { getFeedbacks } from '@/app/lib/firestore';
import { Feedback } from '@/app/types';

export default function Testimonials() {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadFeedbacks() {
            try {
                const data = await getFeedbacks(6);
                setFeedbacks(data);
            } catch (error) {
                console.error('Error loading feedbacks:', error);
            } finally {
                setLoading(false);
            }
        }
        loadFeedbacks();
    }, []);

    if (loading) {
        return (
            <section className="section-padding bg-slate-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="inline-block px-4 py-2 rounded-full bg-primary-50 text-primary-600 text-sm font-medium mb-4">
                            آراء المتطوعين
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">
                            ماذا يقول متطوعونا؟
                        </h2>
                        <p className="text-slate-500 text-lg">تجارب حقيقية من متطوعين مثلك</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                                <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                                <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
                                <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    // If no feedbacks yet, show a placeholder message
    if (feedbacks.length === 0) {
        return (
            <section className="section-padding bg-slate-50">
                <div className="max-w-7xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                    >
                        <span className="inline-block px-4 py-2 rounded-full bg-primary-50 text-primary-600 text-sm font-medium mb-4">
                            آراء المتطوعين
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">
                            ماذا يقول متطوعونا؟
                        </h2>
                        <div className="max-w-md mx-auto mt-8">
                            <div className="w-20 h-20 mx-auto rounded-full bg-primary-50 flex items-center justify-center mb-4">
                                <IoChatbubbleEllipsesOutline className="text-primary-400" size={36} />
                            </div>
                            <p className="text-slate-400 text-lg">
                                كن أول من يشارك تجربته التطوعية!
                            </p>
                            <p className="text-slate-400 text-sm mt-2">
                                بعد إتمام أول فرصة تطوعية، يمكنك مشاركة رأيك هنا
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>
        );
    }

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    star <= rating ? (
                        <IoStarSharp key={star} className="text-amber-400" size={16} />
                    ) : (
                        <IoStarOutline key={star} className="text-slate-300" size={16} />
                    )
                ))}
            </div>
        );
    };

    return (
        <section className="section-padding bg-slate-50">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                    className="text-center mb-12"
                >
                    <span className="inline-block px-4 py-2 rounded-full bg-primary-50 text-primary-600 text-sm font-medium mb-4">
                        آراء المتطوعين
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">
                        ماذا يقول متطوعونا؟
                    </h2>
                    <p className="text-slate-500 text-lg">تجارب حقيقية من متطوعين مثلك</p>
                </motion.div>

                {/* Feedback Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {feedbacks.map((feedback, index) => (
                        <motion.div
                            key={feedback.id}
                            initial={{ opacity: 0, y: 40, scale: 0.96 }}
                            whileInView={{ opacity: 1, y: 0, scale: 1 }}
                            viewport={{ once: true, margin: '-40px' }}
                            transition={{
                                delay: index * 0.1,
                                duration: 0.6,
                                ease: [0.25, 0.46, 0.45, 0.94] as const,
                            }}
                            whileHover={{
                                y: -5,
                                boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.08)',
                                transition: { type: 'spring', stiffness: 300, damping: 20 }
                            }}
                            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-soft relative overflow-hidden group"
                        >
                            {/* Quote decoration */}
                            <div className="absolute top-4 left-4 text-5xl text-primary-100 font-serif leading-none select-none">
                                "
                            </div>

                            {/* Stars */}
                            <div className="mb-4 relative z-10">
                                {renderStars(feedback.rating)}
                            </div>

                            {/* Comment */}
                            <p className="text-slate-600 leading-relaxed mb-5 text-sm sm:text-base relative z-10 line-clamp-4">
                                {feedback.comment}
                            </p>

                            {/* Volunteer Info */}
                            <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                                    {feedback.volunteerName?.charAt(0) || '؟'}
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-bold text-slate-800 text-sm truncate">{feedback.volunteerName}</h4>
                                    <p className="text-xs text-slate-400 truncate">
                                        {feedback.opportunityTitle}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
