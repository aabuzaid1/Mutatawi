'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoSparklesOutline,
    IoCloseOutline,
    IoChevronDownOutline,
    IoChevronUpOutline,
    IoVideocamOutline,
} from 'react-icons/io5';
import { auth } from '@/app/lib/firebase';

interface VideoAIExplainerProps {
    videoTitle: string;
    youtubeVideoId?: string;
    videoUrl?: string;
    lessonDescription?: string;
}

export default function VideoAIExplainer({
    videoTitle,
    youtubeVideoId,
    videoUrl,
    lessonDescription,
}: VideoAIExplainerProps) {
    const [explanation, setExplanation] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [expanded, setExpanded] = useState(true);
    const [tokensUsed, setTokensUsed] = useState<number>(0);
    const [transcriptStatus, setTranscriptStatus] = useState<string>('');

    const handleExplain = async () => {
        setLoading(true);
        setError('');
        setExplanation('');
        setTranscriptStatus('');

        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) {
                setError('يرجى تسجيل الدخول');
                return;
            }

            let transcript: string | undefined;

            // Step 1: Try to fetch YouTube transcript
            if (youtubeVideoId) {
                setTranscriptStatus('جاري استخراج نص الفيديو...');
                try {
                    const transcriptRes = await fetch('/api/ai/youtube-transcript', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ videoId: youtubeVideoId }),
                    });

                    const transcriptData = await transcriptRes.json();
                    if (transcriptData.available && transcriptData.transcript) {
                        transcript = transcriptData.transcript;
                        setTranscriptStatus('تم استخراج نص الفيديو ✅');
                    } else {
                        setTranscriptStatus('لم يتم العثور على نص مكتوب — سيتم الشرح من العنوان');
                    }
                } catch {
                    setTranscriptStatus('فشل استخراج النص — سيتم الشرح من العنوان');
                }
            } else {
                setTranscriptStatus('فيديو مرفوع — سيتم الشرح من العنوان والوصف');
            }

            // Step 2: Call AI to explain
            setTranscriptStatus(prev => prev + '\n🤖 AI يحلل المحتوى...');

            const res = await fetch('/api/ai/course-explain', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    type: 'video',
                    videoTitle,
                    transcript,
                    youtubeVideoId,
                    lessonDescription,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'حدث خطأ');
                return;
            }

            setExplanation(data.explanation);
            setTokensUsed(data.tokensUsed || 0);
            setTranscriptStatus('');
        } catch (err: any) {
            setError(err.message || 'فشل الاتصال');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mb-4">
            {/* Explain Button */}
            {!explanation && !loading && (
                <motion.button
                    onClick={handleExplain}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full flex items-center justify-center gap-3 px-5 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-200/50 hover:shadow-lg hover:shadow-blue-300/50 transition-all"
                >
                    <IoSparklesOutline size={18} />
                    <span>🤖 اشرح هذا الفيديو بالذكاء الاصطناعي</span>
                </motion.button>
            )}

            {/* Loading State */}
            {loading && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-5 border border-blue-100"
                >
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                            <div className="w-5 h-5 border-3 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
                        </div>
                        <div>
                            <p className="font-bold text-blue-800 text-sm mb-1">جاري التحليل...</p>
                            {transcriptStatus && (
                                <p className="text-xs text-blue-600 whitespace-pre-line leading-relaxed">
                                    {transcriptStatus}
                                </p>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Error */}
            {error && !loading && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-red-50 border border-red-200 rounded-xl p-4 text-center"
                >
                    <p className="text-red-600 text-sm font-bold mb-2">{error}</p>
                    <button
                        onClick={handleExplain}
                        className="text-xs text-red-500 hover:underline font-medium"
                    >
                        حاول مرة أخرى
                    </button>
                </motion.div>
            )}

            {/* Explanation Result */}
            <AnimatePresence>
                {explanation && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="bg-gradient-to-br from-white to-blue-50/30 rounded-2xl border border-blue-100 overflow-hidden shadow-lg"
                    >
                        {/* Header */}
                        <div
                            className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white cursor-pointer"
                            onClick={() => setExpanded(!expanded)}
                        >
                            <div className="flex items-center gap-2">
                                <IoVideocamOutline size={18} />
                                <span className="font-bold text-sm">🤖 شرح الفيديو بالذكاء الاصطناعي</span>
                            </div>
                            <div className="flex items-center gap-3">
                                {tokensUsed > 0 && (
                                    <span className="text-xs text-blue-200 bg-white/10 px-2 py-0.5 rounded-full">
                                        {tokensUsed} توكن
                                    </span>
                                )}
                                {expanded ? <IoChevronUpOutline size={18} /> : <IoChevronDownOutline size={18} />}
                            </div>
                        </div>

                        {/* Content */}
                        <AnimatePresence>
                            {expanded && (
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: 'auto' }}
                                    exit={{ height: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-5 sm:p-6">
                                        <div
                                            className="prose prose-slate prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap"
                                            dir="auto"
                                        >
                                            {explanation}
                                        </div>
                                    </div>
                                    <div className="px-5 pb-4 flex items-center justify-between border-t border-blue-50 pt-3">
                                        <button
                                            onClick={handleExplain}
                                            className="text-xs text-blue-500 hover:text-blue-700 font-bold flex items-center gap-1 transition-colors"
                                        >
                                            <IoSparklesOutline size={14} />
                                            شرح مرة أخرى
                                        </button>
                                        <button
                                            onClick={() => setExplanation('')}
                                            className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
                                        >
                                            <IoCloseOutline size={14} />
                                            إخفاء
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
