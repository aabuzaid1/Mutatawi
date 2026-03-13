'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    IoSearchOutline,
    IoBookOutline,
    IoTimeOutline,
    IoSchoolOutline,
    IoLayersOutline,
} from 'react-icons/io5';
import { getCourses } from '@/app/lib/firestore';
import { Course, CourseCategory } from '@/app/types';
import LoadingSpinner from '@/app/components/shared/LoadingSpinner';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';

const categories: { label: string; value: CourseCategory | 'all' }[] = [
    { label: 'الكل', value: 'all' },
    { label: '🎯 قيادة', value: 'قيادة' },
    { label: '💻 تقنية', value: 'تقنية' },
    { label: '🗣️ تواصل', value: 'تواصل' },
    { label: '🩺 إسعافات', value: 'إسعافات' },
    { label: '🌱 تطوير ذات', value: 'تطوير ذات' },
    { label: '📚 أخرى', value: 'أخرى' },
];

const levelColors: Record<string, string> = {
    'مبتدئ': 'bg-green-100 text-green-700',
    'متوسط': 'bg-amber-100 text-amber-700',
    'متقدم': 'bg-red-100 text-red-700',
};

export default function CoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<CourseCategory | 'all'>('all');

    useEffect(() => {
        async function load() {
            try {
                const data = await getCourses(activeCategory === 'all' ? undefined : activeCategory);
                setCourses(data);
            } catch (error) {
                console.error('Error loading courses:', error);
            } finally {
                setLoading(false);
            }
        }
        setLoading(true);
        load();
    }, [activeCategory]);

    const filtered = courses.filter(c => {
        // Only show published courses (or courses without status field for backwards compat)
        if (c.status && c.status !== 'published') return false;
        return c.title.includes(search) || c.description.includes(search);
    });

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-24 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-10"
                    >
                        <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-full text-sm font-bold mb-4">
                            <IoSchoolOutline size={18} />
                            كورسات مجانية للمتطوعين
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3">
                            طوّر مهاراتك 🚀
                        </h1>
                        <p className="text-slate-500 max-w-2xl mx-auto">
                            كورسات مجانية بالكامل تساعدك على تطوير مهاراتك وتأهيلك للفرص
                        </p>
                    </motion.div>

                    {/* Search */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="max-w-lg mx-auto mb-8"
                    >
                        <div className="relative">
                            <IoSearchOutline className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="ابحث عن كورس..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pr-12 pl-4 py-3.5 rounded-2xl border border-slate-200 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm shadow-sm transition-all"
                            />
                        </div>
                    </motion.div>

                    {/* Category Tabs */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="flex flex-wrap justify-center gap-2 mb-10"
                    >
                        {categories.map((cat) => (
                            <button
                                key={cat.value}
                                onClick={() => setActiveCategory(cat.value)}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${activeCategory === cat.value
                                        ? 'bg-primary-600 text-white shadow-md shadow-primary-200'
                                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </motion.div>

                    {/* Courses Grid */}
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : filtered.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filtered.map((course, index) => (
                                <motion.div
                                    key={course.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.08 }}
                                >
                                    <Link href={`/courses/${course.id}`}>
                                        <div className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary-200 transition-all duration-300 overflow-hidden cursor-pointer">
                                            {/* Thumbnail */}
                                            <div className="relative h-44 bg-gradient-to-br from-primary-100 to-secondary-100 overflow-hidden">
                                                {course.thumbnail ? (
                                                    <img
                                                        src={course.thumbnail}
                                                        alt={course.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <IoBookOutline size={48} className="text-primary-300" />
                                                    </div>
                                                )}
                                                {/* Level Badge */}
                                                <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold ${levelColors[course.level] || 'bg-slate-100 text-slate-600'}`}>
                                                    {course.level}
                                                </span>
                                            </div>

                                            {/* Content */}
                                            <div className="p-5">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2.5 py-1 rounded-full">
                                                        {course.category}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-slate-800 text-base mb-2 leading-relaxed group-hover:text-primary-700 transition-colors line-clamp-2">
                                                    {course.title}
                                                </h3>
                                                <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-4">
                                                    {course.description}
                                                </p>
                                                <div className="flex items-center justify-between text-xs text-slate-400">
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
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <IoBookOutline size={48} className="text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-400 text-lg font-medium">لا توجد كورسات متاحة حالياً</p>
                            <p className="text-slate-300 text-sm mt-1">سيتم إضافة كورسات جديدة قريباً</p>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
