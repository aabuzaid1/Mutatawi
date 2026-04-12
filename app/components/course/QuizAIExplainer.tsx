'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoSparklesOutline,
    IoCloseOutline,
    IoChevronDownOutline,
    IoChevronUpOutline,
} from 'react-icons/io5';
import { QuizQuestion } from '@/app/types';
import { auth } from '@/app/lib/firebase';

interface QuizAIExplainerProps {
    questions: QuizQuestion[];
    quizAnswers: Record<number, any>;
    quizSubmitted: boolean;
}

export default function QuizAIExplainer({ questions, quizAnswers, quizSubmitted }: QuizAIExplainerProps) {
    const [explanation, setExplanation] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [expanded, setExpanded] = useState(true);
    const [tokensUsed, setTokensUsed] = useState<number>(0);

    if (!quizSubmitted || !questions || questions.length === 0) return null;

    const handleExplain = async () => {
        setLoading(true);
        setError('');
        setExplanation('');

        try {
            const token = await auth.currentUser?.getIdToken();
            if (!token) {
                setError('يرجى تسجيل الدخول');
                return;
            }

            const res = await fetch('/api/ai/course-explain', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    type: 'quiz',
                    questions: questions.map((q, idx) => ({
                        question: q.question,
                        options: q.options,
                        correctIndex: q.correctIndex,
                        userAnswer: quizAnswers[idx],
                    })),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'حدث خطأ');
                return;
            }

            setExplanation(data.explanation);
            setTokensUsed(data.tokensUsed || 0);
        } catch (err: any) {
            setError(err.message || 'فشل الاتصال');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-6">
            {!explanation && !loading && (
                <motion.button
                    onClick={handleExplain}
                    disabled={loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white rounded-2xl font-bold text-base shadow-lg shadow-purple-200/50 hover:shadow-xl hover:shadow-purple-300/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <IoSparklesOutline size={22} />
                    <span>🤖 اشرح بالذكاء الاصطناعي</span>
                </motion.button>
            )}

            {loading && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100"
                >
                    <div className="flex flex-col items-center gap-3 py-4">
                        <div className="relative w-12 h-12">
                            <div className="absolute inset-0 rounded-full border-4 border-purple-100" />
                            <div className="absolute inset-0 rounded-full border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                            <div className="absolute inset-2 rounded-full bg-purple-50 flex items-center justify-center">
                                <IoSparklesOutline size={16} className="text-purple-600 animate-pulse" />
                            </div>
                        </div>
                        <p className="font-bold text-purple-800 text-sm">AI يحلل الأسئلة ويجهز الشرح...</p>
                        <p className="text-purple-500 text-xs">هذا قد يستغرق بضع ثوانٍ</p>
                    </div>
                </motion.div>
            )}

            {error && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="bg-red-50 border border-red-200 rounded-xl p-4 text-center"
                >
                    <p className="text-red-600 text-sm font-bold mb-2">{error}</p>
                    <button
                        onClick={handleExplain}
                        className="text-xs text-red-500 hover:text-red-700 font-medium underline"
                    >
                        حاول مرة أخرى
                    </button>
                </motion.div>
            )}

            <AnimatePresence>
                {explanation && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl border border-purple-100 overflow-hidden shadow-lg"
                    >
                        {/* Header */}
                        <div
                            className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white cursor-pointer"
                            onClick={() => setExpanded(!expanded)}
                        >
                            <div className="flex items-center gap-2">
                                <IoSparklesOutline size={20} />
                                <span className="font-bold text-sm">🤖 شرح الذكاء الاصطناعي</span>
                            </div>
                            <div className="flex items-center gap-3">
                                {tokensUsed > 0 && (
                                    <span className="text-xs text-purple-200 bg-white/10 px-2 py-0.5 rounded-full">
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

                                    {/* Actions */}
                                    <div className="px-5 pb-4 flex items-center justify-between border-t border-purple-50 pt-3">
                                        <button
                                            onClick={handleExplain}
                                            className="text-xs text-purple-500 hover:text-purple-700 font-bold flex items-center gap-1 transition-colors"
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
