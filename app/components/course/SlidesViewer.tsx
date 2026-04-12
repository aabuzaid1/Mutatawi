'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoChevronForwardOutline,
    IoChevronBackOutline,
    IoDocumentTextOutline,
    IoSparklesOutline,
    IoCheckmarkCircleOutline
} from 'react-icons/io5';
import { SlideContent } from '@/app/types';
import { auth } from '@/app/lib/firebase';

interface SlidesViewerProps {
    slidesData: SlideContent[];
    slidesFileUrl?: string; // Kept in case we want to show a download button
    lessonTitle: string;
    courseId?: string;
    lessonIndex?: number;
}

export default function SlidesViewer({ slidesData, slidesFileUrl, lessonTitle, courseId, lessonIndex }: SlidesViewerProps) {
    const [slides, setSlides] = useState<SlideContent[]>(slidesData || []);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [loadingExpl, setLoadingExpl] = useState<{ [key: number]: boolean }>({});
    const [error, setError] = useState<{ [key: number]: string }>({});

    // Sync state if props change
    useEffect(() => {
        if (slidesData && slidesData.length > 0) {
            setSlides(slidesData);
        }
    }, [slidesData]);

    if ((!slides || slides.length === 0) && !slidesFileUrl) {
        return (
            <div className="bg-white rounded-2xl overflow-hidden shadow-xl border border-slate-100 p-10 text-center">
                <IoDocumentTextOutline size={48} className="mx-auto mb-3 text-slate-300" />
                <p className="text-slate-400 font-medium">لم يتم إرفاق ملف عرض تقديمي لهذا الدرس.</p>
            </div>
        );
    }

    const currentSlide = slides && slides.length > 0 ? slides[currentSlideIndex] : null;

    const handleExplainSlide = async (slideIndex: number) => {
        const slide = slides[slideIndex];
        if (!slide || slide.aiExplanation) return;

        setLoadingExpl(prev => ({ ...prev, [slideIndex]: true }));
        setError(prev => ({ ...prev, [slideIndex]: '' }));

        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) {
                setError(prev => ({ ...prev, [slideIndex]: 'يرجى تسجيل الدخول لتوليد الشرح' }));
                return;
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

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'فشل توليد الشرح');
            }

            const data = await res.json();
            if (data.explanation) {
                const updatedSlides = [...slides];
                updatedSlides[slideIndex] = { ...slide, aiExplanation: data.explanation };
                setSlides(updatedSlides);
            }
        } catch (err: any) {
            setError(prev => ({ ...prev, [slideIndex]: err.message || 'حدث خطأ' }));
        } finally {
            setLoadingExpl(prev => ({ ...prev, [slideIndex]: false }));
        }
    };

    const nextSlide = () => {
        if (currentSlideIndex < slides.length - 1) setCurrentSlideIndex(prev => prev + 1);
    };

    const prevSlide = () => {
        if (currentSlideIndex > 0) setCurrentSlideIndex(prev => prev - 1);
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-orange-100 flex flex-col h-[75vh] min-h-[550px] relative">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 flex items-center justify-between shadow-md relative z-10">
                    <div className="flex items-center gap-3 text-white">
                        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                            <IoDocumentTextOutline size={22} className="text-white" />
                        </div>
                        <div>
                            <span className="block text-xs text-white/80 font-medium mb-0.5">عرض تقديمي</span>
                            <span className="font-bold text-sm tracking-wide">{lessonTitle}</span>
                        </div>
                    </div>
                    {slidesFileUrl && (
                        <a href={slidesFileUrl} target="_blank" rel="noopener noreferrer" className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors backdrop-blur-md">
                            عرض الملف الأصلي 📄
                        </a>
                    )}
                </div>

                {/* Slides Main Display & Explanations */}
                <div className="flex-1 overflow-y-auto bg-slate-50 relative custom-scrollbar flex flex-col">
                    {!slides || slides.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                            <IoDocumentTextOutline size={64} className="mx-auto mb-4 text-slate-300" />
                            <p className="text-slate-500 font-bold text-lg mb-2">لا يوجد محتوى نصي مقسم لهذه الشريحة</p>
                            <p className="text-slate-400 text-sm max-w-md mx-auto">
                                لم يتم العثور على شرائح نصية. يمكنك النقر على "عرض الملف الأصلي" بالاعلى لفتح الملف بصيغته الأساسية.
                            </p>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentSlideIndex}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="p-8 max-w-4xl mx-auto flex flex-col gap-8 pb-32 w-full"
                            >
                                {/* Native Text Viewer Render */}
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                    <div className="px-6 py-4 bg-slate-100/50 border-b border-slate-200 flex justify-between items-center">
                                        <h2 className="text-xl font-bold text-slate-800" dir="auto">
                                            {currentSlide?.title || 'بدون عنوان'}
                                        </h2>
                                        <span className="px-3 py-1 bg-white shadow-sm border border-slate-200 rounded-lg text-slate-500 font-bold text-sm">
                                            {currentSlide?.slideNumber} / {slides.length}
                                        </span>
                                    </div>
                                    <div className="p-8">
                                        <div className="prose prose-slate max-w-none prose-lg">
                                            {currentSlide?.content ? (
                                                <p className="whitespace-pre-wrap leading-relaxed text-slate-700" dir="auto">
                                                    {currentSlide.content}
                                                </p>
                                            ) : (
                                                <p className="text-slate-400 italic">لا يوجد محتوى نصي بهذه الشريحة.</p>
                                            )}
                                        </div>
                                        
                                        {currentSlide?.notes && (
                                            <div className="mt-8 pt-6 border-t border-slate-100">
                                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">ملاحظات المُحاضر</h3>
                                                <div className="bg-orange-50/50 border border-orange-100 rounded-xl p-5">
                                                    <p className="text-orange-900/80 text-sm italic leading-relaxed" dir="auto">
                                                        {currentSlide.notes}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Artificial Intelligence Explainer specific to this Slide */}
                                <div className="bg-gradient-to-b from-white to-orange-50/30 rounded-2xl shadow-sm border border-orange-200/60 overflow-hidden">
                                    <div className="px-6 py-4 bg-orange-100/50 border-b border-orange-200/50 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center">
                                            <IoSparklesOutline size={18} />
                                        </div>
                                        <h3 className="font-bold text-slate-800">شرح الذكاء الاصطناعي لهذه الشريحة</h3>
                                    </div>
                                    
                                    <div className="p-6">
                                        {currentSlide?.aiExplanation ? (
                                            <div className="prose prose-slate prose-sm sm:prose-base max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap" dir="auto">
                                                <div className="flex items-center gap-2 text-green-600 mb-4 bg-green-50 w-fit px-3 py-1.5 rounded-lg border border-green-200">
                                                    <IoCheckmarkCircleOutline size={18} />
                                                    <span className="text-xs font-bold">تم توليد الشرح بنجاح واُحتفظ به</span>
                                                </div>
                                                {currentSlide.aiExplanation}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6">
                                                <p className="text-slate-500 mb-5 text-sm">
                                                    لم يتم توليد شرح لهذه الشريحة بعد. كن أول من يطلب الشرح ليُحفظ تلقائياً في السيرفر وتستفيد منه أنت وزملاؤك!
                                                </p>
                                                {error[currentSlideIndex] && (
                                                    <div className="mb-4 text-red-600 text-xs font-bold bg-red-50 p-3 rounded-lg border border-red-100">
                                                        {error[currentSlideIndex]}
                                                    </div>
                                                )}
                                                <button
                                                    onClick={() => handleExplainSlide(currentSlideIndex)}
                                                    disabled={loadingExpl[currentSlideIndex]}
                                                    className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50 shadow-md"
                                                >
                                                    {loadingExpl[currentSlideIndex] ? (
                                                        <>
                                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                            جاري التوليد...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <IoSparklesOutline size={18} />
                                                            اطلب شرح الشريحة رقم {currentSlide?.slideNumber}
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    )}
                </div>

                {/* Footer Navigation */}
                {slides && slides.length > 0 && (
                    <div className="absolute bottom-0 inset-x-0 bg-white/90 backdrop-blur-md border-t border-slate-200 p-4 flex items-center justify-between z-20">
                        <button
                            onClick={prevSlide}
                            disabled={currentSlideIndex === 0}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-slate-100 transition-all"
                        >
                            <IoChevronForwardOutline size={18} />
                            السابق
                        </button>

                        <div className="flex gap-1.5 overflow-x-auto max-w-[50%] no-scrollbar px-2">
                            {slides.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentSlideIndex(idx)}
                                    className={`h-2.5 w-2.5 flex-shrink-0 rounded-full transition-all ${
                                        idx === currentSlideIndex
                                            ? 'bg-orange-500 w-8'
                                            : slides[idx].aiExplanation 
                                                ? 'bg-green-400' 
                                                : 'bg-slate-200 hover:bg-slate-300'
                                    }`}
                                    title={slides[idx].aiExplanation ? 'مشروح' : 'غير مشروح'}
                                />
                            ))}
                        </div>

                        <button
                            onClick={nextSlide}
                            disabled={currentSlideIndex === slides.length - 1}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-orange-500 shadow-md shadow-orange-200 transition-all"
                        >
                            التالي
                            <IoChevronBackOutline size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
