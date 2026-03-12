'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoArrowBackOutline,
    IoCheckmarkCircle,
    IoCheckmarkCircleOutline,
    IoPlayCircleOutline,
    IoTimeOutline,
    IoLayersOutline,
    IoTrophyOutline,
    IoLockClosedOutline,
    IoDocumentTextOutline,
} from 'react-icons/io5';
import Link from 'next/link';
import { getCourse, getCourseProgress, markLessonComplete } from '@/app/lib/firestore';
import { Course, CourseProgress } from '@/app/types';
import { useAuth } from '@/app/hooks/useAuth';
import LoadingSpinner from '@/app/components/shared/LoadingSpinner';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import toast from 'react-hot-toast';

export default function CourseDetailPage() {
    const params = useParams();
    const courseId = params.id as string;
    const { user } = useAuth();
    const [course, setCourse] = useState<Course | null>(null);
    const [progress, setProgress] = useState<CourseProgress | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeLesson, setActiveLesson] = useState(0);
    const [markingLesson, setMarkingLesson] = useState<number | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const c = await getCourse(courseId);
            setCourse(c);
            if (c && user) {
                const p = await getCourseProgress(courseId, user.uid);
                setProgress(p);
            }
        } catch (error) {
            console.error('Error loading course:', error);
        } finally {
            setLoading(false);
        }
    }, [courseId, user]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const isLessonComplete = (index: number) => {
        return progress?.completedLessons?.includes(index) || false;
    };

    const completedCount = progress?.completedLessons?.length || 0;
    const progressPercent = course ? Math.round((completedCount / course.totalLessons) * 100) : 0;

    const handleMarkComplete = async (lessonIndex: number) => {
        if (!user) {
            toast.error('يرجى تسجيل الدخول لتتبع تقدمك');
            return;
        }
        if (!course) return;
        setMarkingLesson(lessonIndex);
        try {
            await markLessonComplete(courseId, user.uid, lessonIndex, course.totalLessons);

            // Update local state
            const wasComplete = isLessonComplete(lessonIndex);
            const newCompleted = wasComplete
                ? (progress?.completedLessons || []).filter(i => i !== lessonIndex)
                : [...(progress?.completedLessons || []), lessonIndex];

            setProgress(prev => ({
                id: prev?.id || '',
                courseId,
                volunteerId: user.uid,
                completedLessons: newCompleted,
                completedAt: newCompleted.length === course.totalLessons ? new Date() : null,
            }));

            if (!wasComplete) {
                toast.success('تم إكمال الدرس ✅');
                // Check if course is now complete
                if (newCompleted.length === course.totalLessons) {
                    setShowCelebration(true);
                    setTimeout(() => setShowCelebration(false), 5000);
                }
            }
        } catch (error) {
            console.error('Error marking lesson:', error);
            toast.error('حدث خطأ');
        } finally {
            setMarkingLesson(null);
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="flex items-center justify-center min-h-screen">
                    <LoadingSpinner size="lg" />
                </div>
            </>
        );
    }

    if (!course) {
        return (
            <>
                <Navbar />
                <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                    <p className="text-slate-400 text-lg">الكورس غير موجود</p>
                    <Link href="/courses" className="text-primary-600 hover:underline font-medium">
                        العودة للكورسات
                    </Link>
                </div>
            </>
        );
    }

    const currentLesson = course.lessons?.[activeLesson];

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-slate-50 pt-20">
                {/* Celebration Overlay */}
                <AnimatePresence>
                    {showCelebration && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
                            onClick={() => setShowCelebration(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                className="bg-white rounded-3xl p-10 text-center shadow-2xl max-w-sm mx-4"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: 'spring' }}
                                    className="text-6xl mb-4"
                                >
                                    🎉
                                </motion.div>
                                <h2 className="text-2xl font-black text-slate-900 mb-2">مبروك!</h2>
                                <p className="text-slate-500 mb-1">أكملت كورس</p>
                                <p className="text-lg font-bold text-primary-600 mb-4">{course.title}</p>
                                <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-bold">
                                    <IoTrophyOutline size={18} />
                                    إنجاز رائع! استمر 💪
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* Back Button */}
                    <Link href="/courses" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 font-medium mb-6 transition-colors">
                        <IoArrowBackOutline size={16} />
                        العودة للكورسات
                    </Link>

                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Main Content — Video/Activity Player */}
                        <div className="flex-1">
                            {/* Content Player */}
                            {currentLesson?.type === 'activity' ? (
                                <div className="bg-white rounded-2xl overflow-hidden shadow-xl mb-6 border border-slate-100">
                                    <div className="max-h-[70vh] overflow-y-auto">
                                        <img
                                            src={currentLesson.activityImageUrl}
                                            alt={currentLesson.title}
                                            className="w-full h-auto"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-black rounded-2xl overflow-hidden shadow-xl mb-6 aspect-video">
                                    {currentLesson ? (
                                        <iframe
                                            src={`https://www.youtube.com/embed/${currentLesson.youtubeVideoId}?rel=0`}
                                            title={currentLesson.title}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                            className="w-full h-full"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                            <p>لا يوجد فيديو</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Current Lesson Info */}
                            {currentLesson && (
                                <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-800 mb-1">
                                                {activeLesson + 1}. {currentLesson.title}
                                            </h2>
                                            <p className="text-sm text-slate-400 flex items-center gap-1.5">
                                                <IoTimeOutline size={14} />
                                                {currentLesson.duration}
                                            </p>
                                        </div>
                                        {user && (
                                            <button
                                                onClick={() => handleMarkComplete(activeLesson)}
                                                disabled={markingLesson === activeLesson}
                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${isLessonComplete(activeLesson)
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        : 'bg-primary-600 text-white hover:bg-primary-700 shadow-md shadow-primary-200'
                                                    } disabled:opacity-50`}
                                            >
                                                {isLessonComplete(activeLesson) ? (
                                                    <>
                                                        <IoCheckmarkCircle size={18} />
                                                        مكتمل
                                                    </>
                                                ) : (
                                                    <>
                                                        <IoCheckmarkCircleOutline size={18} />
                                                        إكمال الدرس
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Sidebar — Course Info + Lessons */}
                        <div className="w-full lg:w-80 xl:w-96 space-y-4">
                            {/* Course Info Card */}
                            <div className="bg-white rounded-2xl border border-slate-100 p-5">
                                <h1 className="text-lg font-black text-slate-900 mb-2 leading-relaxed">{course.title}</h1>
                                <p className="text-sm text-slate-500 leading-relaxed mb-4">{course.description}</p>
                                <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-4">
                                    <span className="flex items-center gap-1">
                                        <IoLayersOutline size={14} />
                                        {course.totalLessons} درس
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <IoTimeOutline size={14} />
                                        {course.totalDuration}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${course.level === 'مبتدئ' ? 'bg-green-100 text-green-700' :
                                            course.level === 'متوسط' ? 'bg-amber-100 text-amber-700' :
                                                'bg-red-100 text-red-700'
                                        }`}>
                                        {course.level}
                                    </span>
                                </div>

                                {/* Progress Bar */}
                                {user && (
                                    <div>
                                        <div className="flex items-center justify-between text-xs mb-2">
                                            <span className="text-slate-500 font-medium">التقدم</span>
                                            <span className="text-primary-600 font-bold">{progressPercent}%</span>
                                        </div>
                                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${progressPercent}%` }}
                                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                                className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"
                                            />
                                        </div>
                                        <p className="text-xs text-slate-400 mt-1.5 text-center">
                                            {completedCount} / {course.totalLessons} درس مكتمل
                                        </p>
                                    </div>
                                )}

                                {!user && (
                                    <div className="flex items-center gap-2 bg-amber-50 text-amber-700 p-3 rounded-xl text-xs font-medium">
                                        <IoLockClosedOutline size={16} />
                                        سجل دخولك لتتبع تقدمك
                                    </div>
                                )}
                            </div>

                            {/* Lessons List */}
                            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                                <div className="p-4 border-b border-slate-100">
                                    <h3 className="font-bold text-slate-800 text-sm">محتوى الكورس</h3>
                                </div>
                                <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
                                    {course.lessons?.map((lesson, index) => {
                                        const showSectionHeader = lesson.section && (index === 0 || course.lessons[index - 1]?.section !== lesson.section);
                                        return (
                                            <div key={index}>
                                                {showSectionHeader && (
                                                    <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                                                        <p className="text-xs font-bold text-slate-600 flex items-center gap-2">
                                                            <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                                                            {lesson.section}
                                                        </p>
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => setActiveLesson(index)}
                                                    className={`w-full flex items-center gap-3 p-3.5 text-right transition-all hover:bg-slate-50 ${activeLesson === index ? 'bg-primary-50 border-r-3 border-primary-500' : ''
                                                        }`}
                                                >
                                                    {/* Completion Check */}
                                                    <div className="flex-shrink-0">
                                                        {isLessonComplete(index) ? (
                                                            <IoCheckmarkCircle className="text-green-500" size={22} />
                                                        ) : (
                                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold ${activeLesson === index
                                                                    ? 'border-primary-500 text-primary-600 bg-primary-50'
                                                                    : 'border-slate-300 text-slate-400'
                                                                }`}>
                                                                {index + 1}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Lesson Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-sm font-medium truncate ${activeLesson === index ? 'text-primary-700' : 'text-slate-700'
                                                            }`}>
                                                            {lesson.type === 'activity' ? '📋 ' : ''}{lesson.title}
                                                        </p>
                                                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                                            {lesson.type === 'activity' ? (
                                                                <><IoDocumentTextOutline size={12} /> نشاط تطبيقي</>
                                                            ) : (
                                                                <><IoTimeOutline size={12} /> {lesson.duration}</>
                                                            )}
                                                        </p>
                                                    </div>

                                                    {/* Play/Activity indicator */}
                                                    {activeLesson === index && (
                                                        lesson.type === 'activity' ?
                                                            <IoDocumentTextOutline className="text-primary-500 flex-shrink-0" size={20} /> :
                                                            <IoPlayCircleOutline className="text-primary-500 flex-shrink-0" size={20} />
                                                    )}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
