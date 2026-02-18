'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoArrowUpOutline } from 'react-icons/io5';

export default function ScrollToTop() {
    const [visible, setVisible] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        const onScroll = () => {
            setVisible(window.scrollY > 400);
            const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
            setScrollProgress(totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const circumference = 2 * Math.PI * 20;
    const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

    return (
        <AnimatePresence>
            {visible && (
                <motion.button
                    initial={{ opacity: 0, y: 30, scale: 0.3 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 30, scale: 0.3 }}
                    whileHover={{ scale: 1.15, boxShadow: '0 8px 30px rgba(99, 102, 241, 0.45)' }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full flex items-center justify-center cursor-pointer group"
                    style={{
                        background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #7c3aed 100%)',
                        boxShadow: '0 4px 20px rgba(99, 102, 241, 0.35)',
                    }}
                    aria-label="العودة للأعلى"
                >
                    {/* Progress ring */}
                    <svg
                        className="absolute inset-0 w-full h-full -rotate-90"
                        viewBox="0 0 48 48"
                    >
                        <circle
                            cx="24"
                            cy="24"
                            r="20"
                            fill="none"
                            stroke="rgba(255,255,255,0.2)"
                            strokeWidth="2.5"
                        />
                        <circle
                            cx="24"
                            cy="24"
                            r="20"
                            fill="none"
                            stroke="white"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            style={{ transition: 'stroke-dashoffset 0.15s ease-out' }}
                        />
                    </svg>

                    {/* Arrow icon */}
                    <motion.div
                        animate={{ y: [0, -2, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                    >
                        <IoArrowUpOutline className="text-white relative z-10" size={22} />
                    </motion.div>
                </motion.button>
            )}
        </AnimatePresence>
    );
}
