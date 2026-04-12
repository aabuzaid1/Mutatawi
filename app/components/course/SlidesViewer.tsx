'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoSparklesOutline,
    IoDocumentTextOutline,
    IoCheckmarkCircleOutline,
} from 'react-icons/io5';
import { SlideContent } from '@/app/types';
import { auth } from '@/app/lib/firebase';

interface SlidesViewerProps {
    slidesData: SlideContent[];
    slidesFileUrl?: string;
    lessonTitle: string;
    courseId?: string;
    lessonIndex?: number;
}

export default function SlidesViewer({ slidesData, slidesFileUrl, lessonTitle, courseId, lessonIndex }: SlidesViewerProps) {
    const [slides, setSlides] = useState<SlideContent[]>(slidesData || []);
    const [loadingExpl, setLoadingExpl] = useState(false);
    const [error, setError] = useState('');
    const [progress, setProgress] = useState({ current: 0, total: 0 });

    // Clean Firebase URL to prevent external viewers from blocking the request due to token params
    const getCleanedUrl = (url: string) => {
        if (!url) return '';
        try {
            const u = new URL(url);
            if (u.hostname.includes('firebasestorage.googleapis.com')) {
                u.searchParams.delete('token');
                return u.toString();
            }
            return url;
        } catch {
            return url;
        }
    };

    // Sync state if props change
    useEffect(() => {
        if (slidesData && slidesData.length > 0) {
            setSlides(slidesData);
        }
    }, [slidesData]);

    const handleExplainAllSlides = async () => {
        if (!slides || slides.length === 0) return;
        setLoadingExpl(true);
        setError('');
        setProgress({ current: 0, total: slides.length });

        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) {
                setError('يرجى تسجيل الدخول لتوليد الشرح');
                setLoadingExpl(false);
                return;
            }

            const updatedSlides = [...slides];
            
            // Loop through each slide individually to generate explanations dynamically
            // and save them securely on the server-side via the route logic
            for (let i = 0; i < slides.length; i++) {
                setProgress({ current: i + 1, total: slides.length });
                const slide = slides[i];

                // Skip if already explained
                if (slide.aiExplanation && slide.aiExplanation.trim().length > 10) {
                    continue;
                }

                const res = await fetch('/api/ai/course-explain', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        type: 'slide',
                        courseId,
                        lessonIndex,
                        slideTitle: slide.title,
                        slideContent: slide.content,
                        slideNotes: slide.notes,
                        slideNumber: slide.slideNumber,
                    }),
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.explanation) {
                        updatedSlides[i] = { ...slide, aiExplanation: data.explanation };
                        // Update local state partially to show progress directly to user
                        setSlides([...updatedSlides]);
                    }
                } else {
                    const errorData = await res.json();
                    console.error('Slide generation error:', errorData.error);
                    // Stop on token limit or crucial API error to avoid looping bans
                    if (res.status === 429 || res.status === 500) {
                       throw new Error(errorData.error || 'توقف التوليد لخطأ بالسيرفر أو بالرصيد.');
                    }
                }
            }
        } catch (err: any) {
            setError(err.message || 'حدث خطأ أثناء التوليد');
        } finally {
            setLoadingExpl(false);
            setProgress({ current: 0, total: 0 });
        }
    };

    const hasAnyExplanations = slides.some(s => s.aiExplanation && s.aiExplanation.trim().length > 10);
    const isFinishedAll = slides.every(s => s.aiExplanation && s.aiExplanation.trim().length > 10);

    return (
        <div className="flex flex-col gap-6">
            {/* 1. Native PowerPoint IFrame Viewer */}
            {slidesFileUrl ? (
                <div className="bg-white rounded-2xl overflow-hidden shadow-xl border border-orange-100 flex flex-col h-[70vh] min-h-[500px]">
                    <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 flex flex-wrap items-center justify-between shadow-sm gap-2">
                        <div className="flex items-center gap-2 text-white">
                            <IoDocumentTextOutline size={18} />
                            <span className="font-bold text-sm">العرض التقديمي: {lessonTitle}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <a href={`https://docs.google.com/viewer?url=${encodeURIComponent(getCleanedUrl(slidesFileUrl))}`} target="_blank" rel="noopener noreferrer" className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                                🔗 فتح في نافذة جديدة
                            </a>
                            <a href={slidesFileUrl} target="_blank" rel="noopener noreferrer" className="text-white hover:text-orange-100 text-xs font-bold underline px-2">
                                تحميل
                            </a>
                        </div>
                    </div>
                    <div className="w-full h-full flex-1 bg-slate-50 relative group">
                        {/* Fallback overlay in case iframe fails (Localhost CORS/Block issue) */}
                        <div className="absolute inset-x-0 top-0 p-3 flex justify-center pointer-events-none z-20">
                             <div className="bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-orange-200 pointer-events-auto text-center max-w-sm">
                                 <p className="text-sm font-bold text-slate-800 mb-2">هل يظهر لك محتوى محظور (Blocked)؟ 🚫</p>
                                 <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                                     يحدث هذا بسبب حماية المتصفح أثناء التطوير على <b>localhost</b>. 
                                     عند رفع الموقع ستعمل بشكل طبيعي. الآن اضغط الزر بالأسفل.
                                 </p>
                                 <a href={`https://docs.google.com/viewer?url=${encodeURIComponent(getCleanedUrl(slidesFileUrl))}`} target="_blank" rel="noopener noreferrer" className="block w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold py-2 rounded-lg transition-colors">
                                     عرض السلايدات خارج الإطار
                                 </a>
                             </div>
                        </div>
                        <iframe
                            src={`https://docs.google.com/viewer?url=${encodeURIComponent(getCleanedUrl(slidesFileUrl))}&embedded=true`}
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            title={lessonTitle}
                            className="w-full h-full relative z-10"
                            onError={(e) => console.error("Iframe load error", e)}
                        />
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-100 p-10 text-center">
                    <IoDocumentTextOutline size={48} className="mx-auto mb-3 text-slate-300" />
                    <p className="text-slate-400 font-medium">لم يتم إرفاق ملف عرض تقديمي لهذا الدرس.</p>
                </div>
            )}

            {/* 2. AI Explanations Section */}
            {slides.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl border border-orange-100/50 p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
                        <div className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                                <IoSparklesOutline size={22} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">الشرح الذكي للشرائح</h3>
                                <p className="text-sm text-slate-500">مساعدك الشخصي لشرح وتوضيح كل شريحة بالتفصيل</p>
                            </div>
                        </div>

                        {!isFinishedAll && (
                            <motion.button
                                onClick={handleExplainAllSlides}
                                disabled={loadingExpl}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-200 hover:shadow-lg disabled:opacity-50 transition-all min-w-[200px]"
                            >
                                {loadingExpl ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        جاري شرح شريحة {progress.current} من {progress.total}...
                                    </>
                                ) : (
                                    <>
                                        <IoSparklesOutline size={18} />
                                        {hasAnyExplanations ? 'إكمال شرح باقي الشرائح' : 'توليد الشرح لجميع الشرائح'}
                                    </>
                                )}
                            </motion.button>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 text-sm font-bold border border-red-100">
                            🚨 {error}
                        </div>
                    )}

                    {!hasAnyExplanations && !loadingExpl ? (
                        <div className="text-center py-10 bg-orange-50/50 rounded-xl border border-orange-100/50">
                            <IoSparklesOutline size={40} className="mx-auto text-orange-200 mb-3" />
                            <p className="text-slate-500 font-medium">لم يتم توليد أي شروحات لهذه السلايدات بعد.</p>
                            <p className="text-sm text-slate-400 mt-1">كن أول من يطلب الشرح ليتم حفظه لك وللجميع!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {slides.map((slide, idx) => (
                                slide.aiExplanation ? (
                                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-all">
                                        <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                                            <span className="font-bold text-slate-700 flex items-center gap-2 text-sm">
                                                <span className="w-6 h-6 bg-orange-500 text-white rounded-md flex items-center justify-center text-xs">
                                                    {slide.slideNumber}
                                                </span>
                                                {slide.title || 'بدون عنوان'}
                                            </span>
                                            <IoCheckmarkCircleOutline size={18} className="text-green-500" />
                                        </div>
                                        <div className="p-5 text-sm leading-relaxed text-slate-700 whitespace-pre-wrap" dir="auto">
                                            {slide.aiExplanation}
                                        </div>
                                    </div>
                                ) : (
                                    <div key={idx} className="opacity-50 flex items-center justify-between px-4 py-3 bg-slate-50 border border-slate-200 border-dashed rounded-xl grayscale">
                                        <span className="font-bold text-slate-500 text-sm">الشريحة {slide.slideNumber} - {slide.title || 'بدون عنوان'}</span>
                                        <span className="text-xs font-medium px-2 py-1 bg-slate-200 rounded-md text-slate-500">بانتظار الشرح...</span>
                                    </div>
                                )
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
