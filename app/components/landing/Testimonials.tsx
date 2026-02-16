'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoStarSharp, IoChevronBack, IoChevronForward } from 'react-icons/io5';

const testimonials = [
    {
        name: 'سارة الأحمد',
        role: 'متطوعة - تعليم',
        content: 'تجربة التطوع عبر منصة متطوع غيّرت حياتي. وجدت فرصاً رائعة تناسب جدولي ومهاراتي، والآن أنا جزء من مجتمع مذهل من المتطوعين.',
        rating: 5,
        avatar: '👩‍🏫',
    },
    {
        name: 'محمد العلي',
        role: 'مدير - جمعية النور',
        content: 'كمنظمة، ساعدتنا المنصة في الوصول لمتطوعين متحمسين ومؤهلين. عملية التنسيق أصبحت أسهل بكثير وأكثر تنظيماً.',
        rating: 5,
        avatar: '👨‍💼',
    },
    {
        name: 'ليلى حسن',
        role: 'متطوعة - صحة',
        content: 'أحب كيف أن المنصة تتبع ساعات التطوع وتمنح الشهادات. هذا حفّزني على المشاركة أكثر وأصبح لدي سجل تطوعي مميز.',
        rating: 5,
        avatar: '👩‍⚕️',
    },
    {
        name: 'أحمد الرشيدي',
        role: 'متطوع - بيئة',
        content: 'من أفضل المنصات التي استخدمتها. التصميم سهل والفرص متنوعة. شاركت في ٥ حملات بيئية خلال شهرين فقط!',
        rating: 5,
        avatar: '🧑‍🌾',
    },
];

const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 80 : -80,
        opacity: 0,
        scale: 0.96,
    }),
    center: {
        x: 0,
        opacity: 1,
        scale: 1,
    },
    exit: (direction: number) => ({
        x: direction > 0 ? -80 : 80,
        opacity: 0,
        scale: 0.96,
    }),
};

export default function Testimonials() {
    const [[current, direction], setCurrent] = useState([0, 0]);

    const paginate = useCallback((newDirection: number) => {
        setCurrent(([prev]) => {
            const next = (prev + newDirection + testimonials.length) % testimonials.length;
            return [next, newDirection];
        });
    }, []);

    // Auto-play carousel
    useEffect(() => {
        const timer = setInterval(() => paginate(1), 6000);
        return () => clearInterval(timer);
    }, [paginate]);

    return (
        <section id="testimonials" className="section-padding bg-slate-50 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 gradient-mesh opacity-50" />

            <div className="max-w-4xl mx-auto relative">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                    className="text-center mb-12"
                >
                    <span className="inline-block px-4 py-2 rounded-full bg-primary-50 text-primary-600 text-sm font-medium mb-4">
                        قصص نجاح
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4">
                        ماذا يقول متطوعونا
                    </h2>
                    <p className="text-slate-500 text-lg">تجارب حقيقية من مجتمع المتطوعين</p>
                </motion.div>

                {/* Testimonial Card */}
                <div className="relative">
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={current}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                duration: 0.5,
                                ease: [0.25, 0.46, 0.45, 0.94] as const,
                            }}
                            className="bg-white rounded-3xl shadow-card p-8 sm:p-12 text-center"
                        >
                            {/* Avatar */}
                            <motion.div
                                className="text-6xl mb-6"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 15 }}
                            >
                                {testimonials[current].avatar}
                            </motion.div>

                            {/* Stars — staggered reveal */}
                            <div className="flex items-center justify-center gap-1 mb-6">
                                {Array.from({ length: testimonials[current].rating }).map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, scale: 0, rotate: -30 }}
                                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.2 + i * 0.06, type: 'spring', stiffness: 300 }}
                                    >
                                        <IoStarSharp className="text-yellow-400" size={20} />
                                    </motion.div>
                                ))}
                            </div>

                            {/* Content */}
                            <motion.p
                                className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-8 max-w-2xl mx-auto"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3, duration: 0.5 }}
                            >
                                &ldquo;{testimonials[current].content}&rdquo;
                            </motion.p>

                            {/* Author */}
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.4 }}
                            >
                                <h4 className="font-bold text-slate-800 text-lg">{testimonials[current].name}</h4>
                                <p className="text-slate-400">{testimonials[current].role}</p>
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className="flex items-center justify-center gap-4 mt-8">
                        <motion.button
                            onClick={() => paginate(-1)}
                            className="w-12 h-12 rounded-xl bg-white shadow-soft flex items-center justify-center text-slate-600 hover:bg-primary-50 hover:text-primary-600"
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        >
                            <IoChevronForward size={20} />
                        </motion.button>

                        {/* Dots */}
                        <div className="flex gap-2">
                            {testimonials.map((_, i) => (
                                <motion.button
                                    key={i}
                                    onClick={() => setCurrent([i, i > current ? 1 : -1])}
                                    className="h-2 rounded-full"
                                    animate={{
                                        width: i === current ? 32 : 8,
                                        backgroundColor: i === current ? '#6366f1' : '#cbd5e1',
                                    }}
                                    transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                                />
                            ))}
                        </div>

                        <motion.button
                            onClick={() => paginate(1)}
                            className="w-12 h-12 rounded-xl bg-white shadow-soft flex items-center justify-center text-slate-600 hover:bg-primary-50 hover:text-primary-600"
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        >
                            <IoChevronBack size={20} />
                        </motion.button>
                    </div>
                </div>
            </div>
        </section>
    );
}
