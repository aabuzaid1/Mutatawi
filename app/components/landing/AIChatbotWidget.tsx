'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoSparklesOutline, IoClose, IoArrowForward, IoChatbubblesOutline } from 'react-icons/io5';
import Link from 'next/link';

const suggestions = [
    { text: 'اشرح عملية البناء الضوئي 🌿', icon: '🧬' },
    { text: 'لخص أحداث الحرب العالمية 🌍', icon: '📜' },
    { text: 'أنشئ اختباراً في الفيزياء ⚛️', icon: '🎯' },
    { text: 'صمم تقريراً عن البرمجة 📑', icon: '💻' },
];

const typingMessages = [
    'مرحباً! أنا حنظلة 🤖',
    'مساعدك الذكي للدراسة',
    'اسألني أي سؤال وأنا بساعدك!',
];

export default function AIChatbotWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentTypingMsg, setCurrentTypingMsg] = useState(0);
    const [displayedText, setDisplayedText] = useState('');

    // Typing animation for the chat bubble
    useEffect(() => {
        if (!isOpen) return;

        const msg = typingMessages[currentTypingMsg];
        let charIndex = 0;
        setDisplayedText('');

        const typingInterval = setInterval(() => {
            if (charIndex <= msg.length) {
                setDisplayedText(msg.substring(0, charIndex));
                charIndex++;
            } else {
                clearInterval(typingInterval);
                // Move to next message after a pause
                setTimeout(() => {
                    setCurrentTypingMsg((prev) => (prev + 1) % typingMessages.length);
                }, 2000);
            }
        }, 40);

        return () => clearInterval(typingInterval);
    }, [isOpen, currentTypingMsg]);



    return (
        <>
                    {/* Chat Panel */}
                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="fixed bottom-24 left-4 sm:left-6 z-50 w-[320px] sm:w-[360px]"
                            >
                                <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/60 overflow-hidden">
                                    {/* Header */}
                                    <div className="relative bg-gradient-to-l from-primary-600 via-primary-700 to-indigo-800 p-5 overflow-hidden">
                                        {/* Decorative circles */}
                                        <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-white/5" />
                                        <div className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full bg-white/5" />

                                        <div className="relative flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <motion.div
                                                    className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shadow-lg"
                                                    animate={{ rotate: [0, 5, -5, 0] }}
                                                    transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                                                >
                                                    <IoSparklesOutline size={24} className="text-white" />
                                                </motion.div>
                                                <div>
                                                    <h3 className="text-white font-black text-lg tracking-wide">حنظلة</h3>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                                        <span className="text-white/70 text-xs">متصل الآن</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setIsOpen(false)}
                                                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                                            >
                                                <IoClose size={20} className="text-white/80" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Chat Body */}
                                    <div className="p-5 space-y-4">
                                        {/* AI Message */}
                                        <div className="flex gap-2.5">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-100 to-purple-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <IoSparklesOutline size={16} className="text-purple-600" />
                                            </div>
                                            <div className="bg-slate-50 rounded-2xl rounded-tl-md px-4 py-3 max-w-[85%]">
                                                <p className="text-sm text-slate-700 leading-relaxed min-h-[20px]" dir="rtl">
                                                    {displayedText}
                                                    <motion.span
                                                        animate={{ opacity: [1, 0] }}
                                                        transition={{ repeat: Infinity, duration: 0.6 }}
                                                        className="inline-block w-0.5 h-4 bg-primary-500 mr-0.5 align-text-bottom"
                                                    />
                                                </p>
                                            </div>
                                        </div>

                                        {/* Suggestions */}
                                        <div className="grid grid-cols-2 gap-2">
                                            {suggestions.map((s, i) => (
                                                <motion.div
                                                    key={s.text}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.3 + i * 0.1 }}
                                                >
                                                    <Link href="/ai-agent">
                                                        <motion.div
                                                            className="p-3 bg-white rounded-xl border border-slate-100 hover:border-primary-200 hover:shadow-md transition-all cursor-pointer group"
                                                            whileHover={{ scale: 1.03, y: -2 }}
                                                            whileTap={{ scale: 0.97 }}
                                                        >
                                                            <span className="text-lg block mb-1">{s.icon}</span>
                                                            <p className="text-[11px] text-slate-600 group-hover:text-primary-700 font-medium leading-snug" dir="rtl">
                                                                {s.text}
                                                            </p>
                                                        </motion.div>
                                                    </Link>
                                                </motion.div>
                                            ))}
                                        </div>

                                        {/* CTA Button */}
                                        <Link href="/ai-agent">
                                            <motion.div
                                                className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-l from-primary-600 to-primary-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-primary-200/50 hover:shadow-xl hover:shadow-primary-300/50 transition-all cursor-pointer"
                                                whileHover={{ scale: 1.02, y: -1 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <IoChatbubblesOutline size={18} />
                                                <span>افتح حنظلة الكامل</span>
                                                <IoArrowForward size={16} className="mr-1" />
                                            </motion.div>
                                        </Link>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* FAB Button */}
                    <div
                        className="fixed bottom-6 left-4 sm:left-6 z-50"
                    >

                        {/* Notification dot */}
                        {!isOpen && (
                            <motion.div
                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white z-10"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                            />
                        )}

                        <motion.button
                            onClick={() => setIsOpen(!isOpen)}
                            className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-primary-500 via-primary-600 to-indigo-700 text-white shadow-xl shadow-primary-500/30 flex items-center justify-center hover:shadow-2xl hover:shadow-primary-500/40 transition-shadow"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <AnimatePresence mode="wait">
                                {isOpen ? (
                                    <motion.div
                                        key="close"
                                        initial={{ rotate: -90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: 90, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <IoClose size={26} />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="sparkle"
                                        initial={{ rotate: 90, opacity: 0 }}
                                        animate={{ rotate: 0, opacity: 1 }}
                                        exit={{ rotate: -90, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <IoSparklesOutline size={26} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>

                        {/* Label tooltip (shows when closed) */}
                        {!isOpen && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1 }}
                                className="absolute bottom-1/2 translate-y-1/2 left-[calc(100%+12px)] bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg pointer-events-none hidden sm:block"
                            >
                                جرّب حنظلة 🤖
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-slate-900 rotate-45" />
                            </motion.div>
                        )}
                    </div>
        </>
    );
}
