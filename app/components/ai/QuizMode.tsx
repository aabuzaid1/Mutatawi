'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCheckmarkCircle, IoCloseCircle, IoArrowForwardOutline, IoTrophyOutline } from 'react-icons/io5';
import { AIQuizOutput } from '@/app/types';

interface QuizModeProps {
    data: AIQuizOutput;
    onClose: () => void;
}

export default function QuizMode({ data, onClose }: QuizModeProps) {
    const [currentQ, setCurrentQ] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showAnswer, setShowAnswer] = useState(false);
    const [score, setScore] = useState(0);
    const [finished, setFinished] = useState(false);

    const question = data.questions[currentQ];
    const total = data.questions.length;

    const handleSelect = (index: number) => {
        if (showAnswer) return;
        setSelectedOption(index);
        setShowAnswer(true);
        if (index === question.correctIndex) {
            setScore(prev => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentQ + 1 >= total) {
            setFinished(true);
        } else {
            setCurrentQ(prev => prev + 1);
            setSelectedOption(null);
            setShowAnswer(false);
        }
    };

    if (finished) {
        const percentage = Math.round((score / total) * 100);
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-5 border border-amber-100 text-center"
            >
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IoTrophyOutline size={32} className="text-amber-600" />
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-1">
                    نتيجتك: {score}/{total}
                </h3>
                <p className="text-2xl font-black mb-3">
                    {percentage >= 80 ? '🌟 ممتاز!' : percentage >= 60 ? '👍 جيد!' : '📚 راجع أكثر!'}
                </p>
                <div className="w-full bg-slate-100 rounded-full h-3 mb-4 overflow-hidden">
                    <motion.div
                        className={`h-full rounded-full ${
                            percentage >= 80 ? 'bg-emerald-500' : percentage >= 60 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.8 }}
                    />
                </div>
                <button
                    onClick={onClose}
                    className="px-6 py-2 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 transition-colors"
                >
                    إغلاق
                </button>
            </motion.div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
            {/* Progress */}
            <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-amber-700">{currentQ + 1}/{total}</span>
                <div className="flex-1 mx-3 h-1.5 bg-amber-100 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-amber-500 rounded-full"
                        animate={{ width: `${((currentQ + 1) / total) * 100}%` }}
                    />
                </div>
                <span className="text-[11px] font-bold text-emerald-600">{score} ✓</span>
            </div>

            {/* Question */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentQ}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                >
                    <p className="font-bold text-slate-800 text-sm mb-3 leading-relaxed">{question.question}</p>

                    {/* Options */}
                    <div className="space-y-2 mb-3">
                        {question.options.map((opt, i) => {
                            let style = 'bg-white border-slate-200 text-slate-700 hover:border-amber-300';
                            if (showAnswer) {
                                if (i === question.correctIndex) {
                                    style = 'bg-emerald-50 border-emerald-400 text-emerald-800';
                                } else if (i === selectedOption && i !== question.correctIndex) {
                                    style = 'bg-red-50 border-red-400 text-red-800';
                                } else {
                                    style = 'bg-slate-50 border-slate-100 text-slate-400';
                                }
                            }

                            return (
                                <motion.button
                                    key={i}
                                    onClick={() => handleSelect(i)}
                                    disabled={showAnswer}
                                    className={`w-full text-right px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${style}`}
                                    whileTap={!showAnswer ? { scale: 0.98 } : {}}
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full border flex items-center justify-center text-[11px] flex-shrink-0">
                                            {String.fromCharCode(1571 + i)}
                                        </span>
                                        {opt}
                                        {showAnswer && i === question.correctIndex && (
                                            <IoCheckmarkCircle className="text-emerald-500 mr-auto" size={18} />
                                        )}
                                        {showAnswer && i === selectedOption && i !== question.correctIndex && (
                                            <IoCloseCircle className="text-red-500 mr-auto" size={18} />
                                        )}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* Explanation */}
                    {showAnswer && question.explanation && (
                        <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-3"
                        >
                            <p className="text-xs text-blue-800 leading-relaxed">💡 {question.explanation}</p>
                        </motion.div>
                    )}

                    {/* Next button */}
                    {showAnswer && (
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            onClick={handleNext}
                            className="w-full py-2.5 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 transition-colors flex items-center justify-center gap-2"
                        >
                            {currentQ + 1 >= total ? 'النتيجة' : 'التالي'}
                            <IoArrowForwardOutline size={16} className="rotate-180" />
                        </motion.button>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
