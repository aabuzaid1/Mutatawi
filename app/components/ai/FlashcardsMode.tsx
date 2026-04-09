'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoCheckmarkOutline, IoCloseOutline, IoArrowBackOutline, IoArrowForwardOutline } from 'react-icons/io5';
import { AIFlashcardsOutput } from '@/app/types';

interface FlashcardsModeProps {
    data: AIFlashcardsOutput;
    onClose: () => void;
}

export default function FlashcardsMode({ data, onClose }: FlashcardsModeProps) {
    const [currentCard, setCurrentCard] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [known, setKnown] = useState<Set<number>>(new Set());
    const [unknown, setUnknown] = useState<Set<number>>(new Set());

    const card = data.cards[currentCard];
    const total = data.cards.length;
    const reviewed = known.size + unknown.size;

    const handleFlip = () => setIsFlipped(!isFlipped);

    const handleKnow = () => {
        setKnown(prev => new Set(prev).add(currentCard));
        goNext();
    };

    const handleDontKnow = () => {
        setUnknown(prev => new Set(prev).add(currentCard));
        goNext();
    };

    const goNext = () => {
        setIsFlipped(false);
        if (currentCard + 1 < total) {
            setTimeout(() => setCurrentCard(prev => prev + 1), 200);
        }
    };

    const goPrev = () => {
        if (currentCard > 0) {
            setIsFlipped(false);
            setCurrentCard(prev => prev - 1);
        }
    };

    // Final result
    if (reviewed >= total) {
        const knownPercent = Math.round((known.size / total) * 100);
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-5 border border-pink-100 text-center"
            >
                <h3 className="text-lg font-black text-slate-800 mb-2">
                    انتهت المراجعة! 🎉
                </h3>
                <div className="flex justify-center gap-6 mb-4">
                    <div>
                        <p className="text-2xl font-black text-emerald-600">{known.size}</p>
                        <p className="text-[11px] text-slate-500">عرفتها ✓</p>
                    </div>
                    <div>
                        <p className="text-2xl font-black text-red-500">{unknown.size}</p>
                        <p className="text-[11px] text-slate-500">ما عرفتها ✗</p>
                    </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 mb-4 overflow-hidden">
                    <motion.div
                        className="h-full bg-emerald-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${knownPercent}%` }}
                        transition={{ duration: 0.8 }}
                    />
                </div>
                <button
                    onClick={() => {
                        setCurrentCard(0);
                        setKnown(new Set());
                        setUnknown(new Set());
                        setIsFlipped(false);
                    }}
                    className="px-6 py-2 bg-pink-600 text-white rounded-xl font-bold text-sm ml-2 hover:bg-pink-700 transition-colors"
                >
                    إعادة المراجعة
                </button>
                <button
                    onClick={onClose}
                    className="px-6 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-300 transition-colors"
                >
                    إغلاق
                </button>
            </motion.div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-100">
            {/* Progress */}
            <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-pink-700">{currentCard + 1}/{total}</span>
                <div className="flex-1 mx-3 h-1.5 bg-pink-100 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-pink-500 rounded-full"
                        animate={{ width: `${((currentCard + 1) / total) * 100}%` }}
                    />
                </div>
            </div>

            {/* Card */}
            <div className="relative" style={{ perspective: '1000px' }}>
                <motion.div
                    onClick={handleFlip}
                    className="cursor-pointer min-h-[140px] sm:min-h-[160px] rounded-2xl p-5 flex items-center justify-center text-center transition-all"
                    style={{
                        transformStyle: 'preserve-3d',
                        transform: isFlipped ? 'rotateX(180deg)' : 'rotateX(0)',
                        transition: 'transform 0.4s ease',
                    }}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={`${currentCard}-${isFlipped}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className={`absolute inset-0 rounded-2xl p-5 flex items-center justify-center ${
                                isFlipped ? 'bg-emerald-50 border-2 border-emerald-200' : 'bg-white border-2 border-pink-200'
                            }`}
                            style={{ backfaceVisibility: 'hidden' }}
                        >
                            <div>
                                <p className="text-[10px] text-slate-400 mb-2">
                                    {isFlipped ? '💡 الإجابة' : '❓ السؤال — انقر للقلب'}
                                </p>
                                <p className="font-bold text-slate-800 text-sm leading-relaxed" dir="auto">
                                    {isFlipped ? card.back : card.front}
                                </p>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3">
                <button
                    onClick={goPrev}
                    disabled={currentCard === 0}
                    className="p-2 rounded-xl hover:bg-pink-100 text-slate-500 disabled:opacity-30"
                >
                    <IoArrowForwardOutline size={18} />
                </button>

                <button
                    onClick={handleDontKnow}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-red-100 text-red-700 rounded-xl font-bold text-xs hover:bg-red-200 transition-colors"
                >
                    <IoCloseOutline size={16} />
                    ما عرفتها
                </button>

                <button
                    onClick={handleKnow}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-100 text-emerald-700 rounded-xl font-bold text-xs hover:bg-emerald-200 transition-colors"
                >
                    <IoCheckmarkOutline size={16} />
                    عرفتها
                </button>

                <button
                    onClick={() => { setIsFlipped(false); goNext(); }}
                    disabled={currentCard >= total - 1}
                    className="p-2 rounded-xl hover:bg-pink-100 text-slate-500 disabled:opacity-30"
                >
                    <IoArrowBackOutline size={18} />
                </button>
            </div>
        </div>
    );
}
