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
    IoExtensionPuzzleOutline,
    IoCloseCircle,
} from 'react-icons/io5';
import Link from 'next/link';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';
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
    
    // Quiz state
    const [quizAnswers, setQuizAnswers] = useState<Record<number, any>>({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [draggedItem, setDraggedItem] = useState<{ qIdx: number, value: string } | null>(null);

    useEffect(() => {
        setQuizAnswers({});
        setQuizSubmitted(false);
    }, [activeLesson]);

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

    const isQuizPassed = () => {
        const currentLesson = course?.lessons?.[activeLesson];
        if (!currentLesson || currentLesson.type !== 'quiz' || !currentLesson.questions) return false;
        if (!quizSubmitted) return false;
        let correctCount = 0;
        currentLesson.questions.forEach((q, idx) => {
            if (!q.type || q.type === 'multiple_choice') {
                if (quizAnswers[idx] === q.correctIndex) correctCount++;
            } else if (q.type === 'drag_drop' && q.pairs) {
                const ans = quizAnswers[idx] || {};
                let allPairsCorrect = true;
                q.pairs.forEach((pair, pairIdx) => {
                    if (ans[pairIdx] !== pair.draggable) allPairsCorrect = false;
                });
                if (allPairsCorrect) correctCount++;
            }
        });
        return correctCount === currentLesson.questions.length;
    };

    const isSubmissionReady = () => {
        const currentLesson = course?.lessons?.[activeLesson];
        if (!currentLesson?.questions) return false;
        for (let i = 0; i < currentLesson.questions.length; i++) {
            const q = currentLesson.questions[i];
            if (!q.type || q.type === 'multiple_choice') {
                if (quizAnswers[i] === undefined) return false;
            } else if (q.type === 'drag_drop' && q.pairs) {
                const ans = quizAnswers[i] || {};
                if (Object.keys(ans).length < q.pairs.length) return false;
            }
        }
        return true;
    };

    const handleQuizSubmit = () => {
        const currentLesson = course?.lessons?.[activeLesson];
        if (!currentLesson || currentLesson.type !== 'quiz' || !currentLesson.questions) return;
        
        if (quizSubmitted) {
            // Reset for retry
            setQuizAnswers({});
            setQuizSubmitted(false);
            return;
        }

        let correctCount = 0;
        currentLesson.questions.forEach((q, idx) => {
            if (!q.type || q.type === 'multiple_choice') {
                if (quizAnswers[idx] === q.correctIndex) correctCount++;
            } else if (q.type === 'drag_drop' && q.pairs) {
                const ans = quizAnswers[idx] || {};
                let allPairsCorrect = true;
                q.pairs.forEach((pair, pairIdx) => {
                    if (ans[pairIdx] !== pair.draggable) allPairsCorrect = false;
                });
                if (allPairsCorrect) correctCount++;
            }
        });
        
        setQuizSubmitted(true);
        if (correctCount === currentLesson.questions.length) {
            toast.success('إجابات صحيحة! أحسنت 🎯');
            if (!isLessonComplete(activeLesson)) {
                handleMarkComplete(activeLesson);
            }
        } else {
            toast.error(`لقد أجبت على ${correctCount} من ${currentLesson.questions.length} بشكل صحيح. حاول مرة أخرى!`);
        }
    };

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
                                <div className="bg-white rounded-2xl overflow-hidden shadow-xl mb-6 border border-slate-100 p-6 md:p-10 text-slate-800">
                                    <h2 className="text-2xl font-black mb-6 text-primary-700 border-b border-slate-100 pb-4">
                                        {currentLesson.title}
                                    </h2>
                                    
                                    {currentLesson.activityText && (
                                        <div className="mb-8 prose prose-slate max-w-none text-lg leading-relaxed whitespace-pre-wrap">
                                            {currentLesson.activityText}
                                        </div>
                                    )}

                                    {currentLesson.activityImageUrl && (
                                        <div className="rounded-xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
                                            <img
                                                src={currentLesson.activityImageUrl}
                                                alt={currentLesson.title}
                                                className="w-full h-auto object-contain max-h-[60vh] mx-auto"
                                            />
                                        </div>
                                    )}
                                    
                                    {(!currentLesson.activityImageUrl && !currentLesson.activityText) && (
                                        <div className="text-center py-10 text-slate-400">
                                            <IoDocumentTextOutline size={48} className="mx-auto mb-3 opacity-50" />
                                            <p>لا يوجد تفاصيل إضافية لهذا النشاط</p>
                                        </div>
                                    )}
                                </div>
                            ) : currentLesson?.type === 'quiz' ? (
                                <div className="bg-white rounded-2xl overflow-hidden shadow-xl mb-6 border border-purple-100 p-6 md:p-10 text-slate-800 relative bg-gradient-to-br from-white to-purple-50/30">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-purple-200/40 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-200/30 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>
                                    <div className="relative z-10">
                                        <div className="mb-8 text-center flex flex-col items-center">
                                            <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-purple-200">
                                                <IoExtensionPuzzleOutline size={32} />
                                            </div>
                                            <h2 className="text-3xl font-black text-purple-800 mb-2">
                                                {currentLesson.title}
                                            </h2>
                                            <p className="text-slate-500 font-medium tracking-wide">اختبر معلوماتك لفتح الدرس التالي</p>
                                        </div>
                                        
                                        <div className="space-y-6">
                                            {currentLesson.questions?.map((q, qIdx) => {
                                                const isMC = !q.type || q.type === 'multiple_choice';
                                                
                                                // Precalculate drag items to be rendering for this question
                                                let availableDraggables: string[] = [];
                                                if (q.type === 'drag_drop' && q.pairs) {
                                                    // Get all draggable parts, filter out those already matched by student
                                                    const ans = quizAnswers[qIdx] || {};
                                                    const usedValues = Object.values(ans);
                                                    availableDraggables = q.pairs.map(p => p.draggable).filter(d => !usedValues.includes(d as string));
                                                }

                                                // Determine the question's visual status
                                                let isQCorrect = false;
                                                if (quizSubmitted) {
                                                    if (isMC) {
                                                        isQCorrect = quizAnswers[qIdx] === q.correctIndex;
                                                    } else if (q.pairs) {
                                                        const ans = quizAnswers[qIdx] || {};
                                                        isQCorrect = true;
                                                        q.pairs.forEach((pair, pIdx) => {
                                                            if (ans[pIdx] !== pair.draggable) isQCorrect = false;
                                                        });
                                                    }
                                                }

                                                return (
                                                <div key={qIdx} className={`bg-white border rounded-xl overflow-hidden transition-all ${quizSubmitted ? (isQCorrect ? 'border-green-300 ring-4 ring-green-50' : 'border-red-300 ring-4 ring-red-50') : 'border-slate-200 shadow-sm hover:border-purple-300'}`} dir="ltr">
                                                    <div className="bg-slate-50 px-5 py-4 border-b border-inherit">
                                                        <h3 className="font-bold text-slate-800 pr-2 border-l-4 border-l-purple-500 leading-relaxed text-lg text-left pl-3 ml-2 border-r-0">
                                                            <span className="mr-2 text-purple-600">Q{qIdx + 1}.</span> 
                                                            <Latex>{q.question}</Latex>
                                                        </h3>
                                                    </div>
                                                    <div className="p-5 space-y-4 text-left">
                                                        {isMC ? (
                                                            <div className="space-y-3">
                                                                {q.options.map((opt, optIdx) => (
                                                                    <button
                                                                        key={optIdx}
                                                                        onClick={() => {
                                                                            if (!quizSubmitted) {
                                                                                setQuizAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
                                                                            }
                                                                        }}
                                                                        className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                                                                            quizAnswers[qIdx] === optIdx
                                                                                ? (quizSubmitted 
                                                                                    ? (q.correctIndex === optIdx ? 'bg-green-50 border-green-500 text-green-800 font-bold' : 'bg-red-50 border-red-500 text-red-800 font-bold')
                                                                                    : 'bg-purple-50 border-purple-500 text-purple-800 font-bold shadow-[0_4px_0_0_rgb(168,85,247)] translate-y-[-2px]')
                                                                                : (quizSubmitted && q.correctIndex === optIdx 
                                                                                    ? 'bg-green-50 border-green-500 text-green-800 font-bold'
                                                                                    : 'bg-white border-slate-100 hover:border-purple-200 hover:bg-slate-50 text-slate-600')
                                                                        } ${quizSubmitted ? 'cursor-default' : 'active:translate-y-[2px] active:shadow-none cursor-pointer'}`}
                                                                    >
                                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                                                            quizAnswers[qIdx] === optIdx 
                                                                                ? (quizSubmitted ? (q.correctIndex === optIdx ? 'border-green-500 bg-green-500' : 'border-red-500 bg-red-500') : 'border-purple-500 bg-purple-500')
                                                                                : (quizSubmitted && q.correctIndex === optIdx ? 'border-green-500 bg-green-500' : 'border-slate-300')
                                                                        }`}>
                                                                            {(quizAnswers[qIdx] === optIdx || (quizSubmitted && q.correctIndex === optIdx)) && (
                                                                                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                                                            )}
                                                                        </div>
                                                                        <span className="flex-1"><Latex>{opt}</Latex></span>
                                                                        {quizSubmitted && quizAnswers[qIdx] === optIdx && (
                                                                            q.correctIndex === optIdx ? <IoCheckmarkCircle className="text-green-500" size={24}/> : <IoCloseCircle className="text-red-500" size={24}/>
                                                                        )}
                                                                        {quizSubmitted && quizAnswers[qIdx] !== optIdx && q.correctIndex === optIdx && (
                                                                            <IoCheckmarkCircle className="text-green-500" size={24}/>
                                                                        )}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            q.pairs && (
                                                                <div className="space-y-6 select-none">
                                                                    <div className="flex flex-wrap gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 min-h-[4rem] items-center">
                                                                        {availableDraggables.length === 0 && !quizSubmitted && (
                                                                            <span className="text-slate-400 text-sm mx-auto font-medium">All items placed!</span>
                                                                        )}
                                                                        {availableDraggables.map((draggableValue, i) => (
                                                                            <div
                                                                                key={i}
                                                                                draggable={!quizSubmitted}
                                                                                onDragStart={(e) => {
                                                                                    e.dataTransfer.setData('text/plain', draggableValue);
                                                                                    setDraggedItem({ qIdx, value: draggableValue });
                                                                                }}
                                                                                onDragEnd={() => setDraggedItem(null)}
                                                                                className={`px-4 py-2 bg-white border-2 border-purple-400 text-purple-700 font-bold rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:bg-purple-50 transition-all ${quizSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                            >
                                                                                <Latex>{draggableValue}</Latex>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                    
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                        {q.pairs.map((pair, pIdx) => {
                                                                            const matchAns = (quizAnswers[qIdx] || {})[pIdx];
                                                                            const isPairCorrect = matchAns === pair.draggable;

                                                                            return (
                                                                            <div key={pIdx} className="flex flex-col gap-2">
                                                                                <div className="px-4 py-3 bg-purple-50 border border-purple-100 rounded-lg text-purple-800 font-bold">
                                                                                    <Latex>{pair.target}</Latex>
                                                                                </div>
                                                                                <div 
                                                                                    onDragOver={(e) => { if (!quizSubmitted) e.preventDefault() }}
                                                                                    onDrop={(e) => {
                                                                                        e.preventDefault();
                                                                                        if (quizSubmitted) return;
                                                                                        const value = e.dataTransfer.getData('text/plain');
                                                                                        if (value) {
                                                                                            setQuizAnswers(prev => {
                                                                                                const updatedQAns = { ...(prev[qIdx] || {}) };
                                                                                                updatedQAns[pIdx] = value;
                                                                                                return { ...prev, [qIdx]: updatedQAns };
                                                                                            });
                                                                                        }
                                                                                    }}
                                                                                    className={`min-h-[3.5rem] p-2 flex items-center justify-center rounded-lg border-2 border-dashed transition-all ${
                                                                                        matchAns 
                                                                                            ? (quizSubmitted ? (isPairCorrect ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50') : 'border-purple-400 bg-purple-50/50') 
                                                                                            : 'border-slate-300 bg-slate-50'
                                                                                    }`}
                                                                                >
                                                                                    {matchAns ? (
                                                                                        <div className="relative w-full text-center group">
                                                                                            <span className={`font-bold inline-block px-3 py-1 bg-white rounded shadow-sm border ${quizSubmitted ? (isPairCorrect ? 'text-green-700 border-green-200' : 'text-red-700 border-red-200') : 'text-purple-700 border-purple-200'}`}>
                                                                                                <Latex>{matchAns}</Latex>
                                                                                            </span>
                                                                                            {!quizSubmitted && (
                                                                                                <button
                                                                                                    onClick={() => {
                                                                                                        setQuizAnswers(prev => {
                                                                                                            const updatedQAns = { ...(prev[qIdx] || {}) };
                                                                                                            delete updatedQAns[pIdx];
                                                                                                            return { ...prev, [qIdx]: updatedQAns };
                                                                                                        });
                                                                                                    }}
                                                                                                    className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                                >
                                                                                                    <IoCloseCircle size={20} />
                                                                                                </button>
                                                                                            )}
                                                                                        </div>
                                                                                    ) : (
                                                                                        <span className="text-slate-400 text-sm">Drop here</span>
                                                                                    )}
                                                                                </div>
                                                                                {quizSubmitted && !isPairCorrect && (
                                                                                    <div className="text-sm bg-green-50 text-green-700 border border-green-200 p-2 rounded flex items-center gap-2">
                                                                                        <span><IoCheckmarkCircle /> Correct: </span>
                                                                                        <Latex>{pair.draggable}</Latex>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )})}
                                                                    </div>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            )})}
                                        </div>
                                        
                                        {!isLessonComplete(activeLesson) && (
                                            <div className="mt-8 text-center pt-8 border-t border-purple-100/50">
                                                {!quizSubmitted || !isQuizPassed() ? (
                                                    <button
                                                        onClick={handleQuizSubmit}
                                                        disabled={!isSubmissionReady()}
                                                        className="px-8 py-3.5 bg-gradient-to-r from-purple-600 to-primary-600 text-white rounded-xl font-black text-lg hover:shadow-lg hover:shadow-purple-300/50 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                                                    >
                                                        {quizSubmitted ? 'إعادة المحاولة 🔄' : 'تحقق من الإجابات ✨'}
                                                    </button>
                                                ) : (
                                                    <div className="bg-green-100 text-green-800 p-5 rounded-xl font-bold flex flex-col items-center justify-center gap-2 border border-green-200">
                                                        <span className="text-green-600 text-4xl mb-1">🎯</span>
                                                        <p className="text-lg">ممتاز! كافة إجاباتك صحيحة.</p>
                                                        <p className="text-sm font-medium opacity-80">تم إكمال الدرس بنجاح.</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {isLessonComplete(activeLesson) && (
                                            <div className="mt-8 text-center pt-8 border-t border-purple-100/50">
                                                <div className="bg-green-50 text-green-700 p-4 rounded-xl font-bold border border-green-200 inline-flex items-center gap-2">
                                                    <IoCheckmarkCircle size={24} />
                                                    هذا الاختبار مكتمل
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-black rounded-2xl overflow-hidden shadow-xl mb-6 aspect-video">
                                    {currentLesson ? (
                                        currentLesson.videoUrl ? (
                                            <video
                                                src={currentLesson.videoUrl}
                                                controls
                                                controlsList="nodownload"
                                                autoPlay
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <iframe
                                                src={`https://www.youtube.com/embed/${currentLesson.youtubeVideoId}?rel=0`}
                                                title={currentLesson.title}
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                className="w-full h-full"
                                            />
                                        )
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
                                                disabled={markingLesson === activeLesson || (currentLesson.type === 'quiz' && !isLessonComplete(activeLesson) && !isQuizPassed())}
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
                                                            {lesson.type === 'activity' ? '📋 ' : lesson.type === 'quiz' ? '🧩 ' : ''}{lesson.title}
                                                        </p>
                                                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                                            {lesson.type === 'activity' ? (
                                                                <><IoDocumentTextOutline size={12} /> نشاط تطبيقي</>
                                                            ) : lesson.type === 'quiz' ? (
                                                                <><IoExtensionPuzzleOutline size={12} /> اختبار معلومات</>
                                                            ) : (
                                                                <><IoTimeOutline size={12} /> {lesson.duration}</>
                                                            )}
                                                        </p>
                                                    </div>

                                                    {/* Play/Activity indicator */}
                                                    {activeLesson === index && (
                                                        lesson.type === 'activity' ?
                                                            <IoDocumentTextOutline className="text-primary-500 flex-shrink-0" size={20} /> :
                                                        lesson.type === 'quiz' ?
                                                            <IoExtensionPuzzleOutline className="text-primary-500 flex-shrink-0" size={20} /> :
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
