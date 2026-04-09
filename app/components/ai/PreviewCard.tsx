'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    IoDocumentTextOutline,
    IoEaselOutline,
    IoGridOutline,
    IoHelpCircleOutline,
    IoLayersOutline,
    IoEyeOutline,
    IoCreateOutline,
    IoDownloadOutline,
} from 'react-icons/io5';
import { StudyMode, AIDocOutput, AISlidesOutput, AISheetsOutput, AIQuizOutput, AIFlashcardsOutput } from '@/app/types';
import dynamic from 'next/dynamic';

// Lazy load editors for performance
const DocsEditorModal = dynamic(() => import('./editors/DocsEditorModal'), { ssr: false });
const SlidesPreview = dynamic(() => import('./editors/SlidesPreview'), { ssr: false });
const SheetsPreview = dynamic(() => import('./editors/SheetsPreview'), { ssr: false });
const QuizMode = dynamic(() => import('./QuizMode'), { ssr: false });
const FlashcardsMode = dynamic(() => import('./FlashcardsMode'), { ssr: false });

interface PreviewCardProps {
    data: any;
    type: StudyMode;
}

export default function PreviewCard({ data, type }: PreviewCardProps) {
    const [editorOpen, setEditorOpen] = useState(false);
    const [previewMode, setPreviewMode] = useState<'preview' | 'quiz' | 'flashcards' | null>(null);

    const getIcon = () => {
        switch (type) {
            case 'doc': return IoDocumentTextOutline;
            case 'slides': return IoEaselOutline;
            case 'sheet': return IoGridOutline;
            case 'quiz': return IoHelpCircleOutline;
            case 'flashcards': return IoLayersOutline;
            default: return IoDocumentTextOutline;
        }
    };

    const getLabel = () => {
        switch (type) {
            case 'doc': return 'مستند';
            case 'slides': return 'عرض تقديمي';
            case 'sheet': return 'جدول بيانات';
            case 'quiz': return 'اختبار';
            case 'flashcards': return 'بطاقات مراجعة';
            default: return 'محتوى';
        }
    };

    const getStats = () => {
        if (type === 'doc') {
            const d = data as AIDocOutput;
            return `${d.sections?.length || 0} أقسام`;
        }
        if (type === 'slides') {
            const d = data as AISlidesOutput;
            return `${d.slides?.length || 0} سلايد`;
        }
        if (type === 'sheet') {
            const d = data as AISheetsOutput;
            return `${d.rows?.length || 0} صف × ${d.columns?.length || 0} أعمدة`;
        }
        if (type === 'quiz') {
            const d = data as AIQuizOutput;
            return `${d.questions?.length || 0} أسئلة`;
        }
        if (type === 'flashcards') {
            const d = data as AIFlashcardsOutput;
            return `${d.cards?.length || 0} بطاقات`;
        }
        return '';
    };

    const Icon = getIcon();

    // Direct open for quiz and flashcards
    if (type === 'quiz' && data?.questions) {
        return (
            <div className="mt-2">
                {previewMode === 'quiz' ? (
                    <QuizMode data={data as AIQuizOutput} onClose={() => setPreviewMode(null)} />
                ) : (
                    <motion.div
                        className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                                <IoHelpCircleOutline size={22} className="text-amber-600" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-800 text-sm">{data.title || 'اختبار'}</p>
                                <p className="text-[11px] text-slate-500">{getStats()}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setPreviewMode('quiz')}
                            className="w-full py-2.5 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 transition-colors"
                        >
                            ابدأ الاختبار 🎯
                        </button>
                    </motion.div>
                )}
            </div>
        );
    }

    if (type === 'flashcards' && data?.cards) {
        return (
            <div className="mt-2">
                {previewMode === 'flashcards' ? (
                    <FlashcardsMode data={data as AIFlashcardsOutput} onClose={() => setPreviewMode(null)} />
                ) : (
                    <motion.div
                        className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-100"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
                                <IoLayersOutline size={22} className="text-pink-600" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-800 text-sm">{data.title || 'بطاقات مراجعة'}</p>
                                <p className="text-[11px] text-slate-500">{getStats()}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setPreviewMode('flashcards')}
                            className="w-full py-2.5 bg-pink-600 text-white rounded-xl font-bold text-sm hover:bg-pink-700 transition-colors"
                        >
                            ابدأ المراجعة 🃏
                        </button>
                    </motion.div>
                )}
            </div>
        );
    }

    // Doc / Slides / Sheet preview card
    return (
        <>
            <motion.div
                className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-4 border border-slate-100 mt-2"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
            >
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
                        <Icon size={22} className="text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-sm truncate">
                            {data.title || getLabel()}
                        </p>
                        <p className="text-[11px] text-slate-500">{getStats()}</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {type === 'doc' && (
                        <button
                            onClick={() => setEditorOpen(true)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-primary-600 text-white rounded-xl font-bold text-xs hover:bg-primary-700 transition-colors"
                        >
                            <IoCreateOutline size={14} />
                            فتح في المحرر
                        </button>
                    )}
                    {type === 'slides' && (
                        <button
                            onClick={() => setEditorOpen(true)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-orange-600 text-white rounded-xl font-bold text-xs hover:bg-orange-700 transition-colors"
                        >
                            <IoEyeOutline size={14} />
                            معاينة وتحميل
                        </button>
                    )}
                    {type === 'sheet' && (
                        <button
                            onClick={() => setEditorOpen(true)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-600 text-white rounded-xl font-bold text-xs hover:bg-green-700 transition-colors"
                        >
                            <IoEyeOutline size={14} />
                            معاينة وتحميل
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Modals */}
            {editorOpen && type === 'doc' && (
                <DocsEditorModal data={data as AIDocOutput} onClose={() => setEditorOpen(false)} />
            )}
            {editorOpen && type === 'slides' && (
                <SlidesPreview data={data as AISlidesOutput} onClose={() => setEditorOpen(false)} />
            )}
            {editorOpen && type === 'sheet' && (
                <SheetsPreview data={data as AISheetsOutput} onClose={() => setEditorOpen(false)} />
            )}
        </>
    );
}
