'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    IoSchoolOutline,
    IoBookOutline,
    IoTimeOutline,
    IoLayersOutline,
    IoArrowBack,
} from 'react-icons/io5';
import Button from '../ui/Button';
import LoadingSpinner from '../shared/LoadingSpinner';
import { getCourses } from '@/app/lib/firestore';
import { Course } from '@/app/types';

const levelColors: Record<string, string> = {
    'مبتدئ': 'bg-green-100 text-green-700 border-green-200',
    'متوسط': 'bg-amber-100 text-amber-700 border-amber-200',
    'متقدم': 'bg-red-100 text-red-700 border-red-200',
};

const containerVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.12,
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

export default function FeaturedCourses() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadCourses() {
            try {
                const data = await getCourses();
                // Only show published courses, max 3
                const published = data.filter(c => !c.status || c.status === 'published');
                setCourses(published.slice(0, 3));
            } catch (error) {
                console.error('Error loading courses:', error);
            } finally {
                setLoading(false);
            }
        }
        loadCourses();
    }, []);

    return (
        <section className="section-padding relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50/80 via-primary-50/30 to-white" />
            <div className="absolute top-0 left-0 w-96 h-96 bg-primary-100/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-secondary-100/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />

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
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-600 text-sm font-medium mb-4 border border-primary-100">
                            <IoSchoolOutline size={16} />
                            كورسات تطويرية
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mb-2">
                            طوّر مهاراتك مجاناً 🚀
                        </h2>
                        <p className="text-slate-500 text-lg">كورسات مجانية بالكامل تأهلك للفرص التطوعية</p>
                    </div>
                    <Link href="/courses" className="mt-4 sm:mt-0">
                        <Button variant="outline" size="sm" icon={<IoArrowBack size={14} />}>
                            عرض جميع الكورسات
                        </Button>
                    </Link>
                </motion.div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : courses.length > 0 ? (
                    <motion.div
                        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-60px' }}
                    >
                        {courses.map((course) => (
                            <motion.div
                                key={course.id}
                                variants={cardVariants}
                                whileHover={{
                                    y: -8,
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.12)',
                                    transition: { type: 'spring', stiffness: 300, damping: 20 }
                                }}
                                whileTap={{ scale: 0.98 }}
                                className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden group cursor-pointer smooth-appear"
                            >
                                <Link href={`/courses/${course.id}`}>
                                    {/* Thumbnail */}
                                    <div className="relative h-48 bg-gradient-to-br from-primary-100 via-primary-50 to-secondary-100 overflow-hidden">
                                        {course.thumbnail ? (
                                            <img
                                                src={course.thumbnail}
                                                alt={course.title}
                                                loading="lazy"
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <motion.div
                                                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                                                    transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                                                >
                                                    <IoBookOutline size={56} className="text-primary-300" />
                                                </motion.div>
                                            </div>
                                        )}
                                        {/* Level Badge */}
                                        <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold border ${levelColors[course.level] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                            {course.level}
                                        </span>
                                        {/* Category Badge */}
                                        <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold bg-white/90 backdrop-blur-sm text-primary-600 border border-white/50 shadow-sm">
                                            {course.category}
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5">
                                        <h3 className="font-bold text-slate-800 text-base mb-2 leading-relaxed group-hover:text-primary-700 transition-colors duration-300 line-clamp-2">
                                            {course.title}
                                        </h3>
                                        <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-4">
                                            {course.description}
                                        </p>
                                        <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-50">
                                            <span className="flex items-center gap-1.5">
                                                <IoLayersOutline size={14} />
                                                {course.totalLessons} درس
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <IoTimeOutline size={14} />
                                                {course.totalDuration}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center py-16"
                    >
                        <div className="w-20 h-20 bg-primary-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">📚</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-700 mb-2">لا توجد كورسات متاحة حالياً</h3>
                        <p className="text-slate-400 max-w-md mx-auto">
                            سيتم إضافة كورسات جديدة قريباً
                        </p>
                    </motion.div>
                )}
            </div>
        </section>
    );
}
