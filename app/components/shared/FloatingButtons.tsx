'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoArrowUpOutline, IoShareSocialOutline, IoLogoFacebook, IoLogoInstagram, IoLogoWhatsapp, IoLogoLinkedin } from 'react-icons/io5';

const shareLinks = [
    {
        id: 'linkedin',
        icon: IoLogoLinkedin,
        label: 'لينكد إن',
        color: '#0A66C2',
        glow: 'rgba(10, 102, 194, 0.4)',
        getUrl: (url: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
        id: 'whatsapp',
        icon: IoLogoWhatsapp,
        label: 'واتساب',
        color: '#25D366',
        glow: 'rgba(37, 211, 102, 0.4)',
        getUrl: (url: string) => `https://wa.me/?text=${encodeURIComponent('تعرّف على منصة متطوع - ' + url)}`,
    },
    {
        id: 'instagram',
        icon: IoLogoInstagram,
        label: 'انستقرام',
        color: '#E4405F',
        glow: 'rgba(228, 64, 95, 0.4)',
        getUrl: (_url: string) => `https://www.instagram.com/`,
    },
    {
        id: 'facebook',
        icon: IoLogoFacebook,
        label: 'فيسبوك',
        color: '#1877F2',
        glow: 'rgba(24, 119, 242, 0.4)',
        getUrl: (url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
];

const BUTTON_GRADIENT = 'linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #7c3aed 100%)';
const BUTTON_SHADOW = '0 4px 20px rgba(99, 102, 241, 0.35)';

export default function FloatingButtons() {
    const [showScroll, setShowScroll] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [shareOpen, setShareOpen] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const onScroll = () => {
            setShowScroll(window.scrollY > 400);
            const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
            setScrollProgress(totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Progress ring – r=24 fits a 56px (w-14) button with 4px padding
    const radius = 24;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

    const handleShareEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setShareOpen(true);
    };

    const handleShareLeave = () => {
        timeoutRef.current = setTimeout(() => setShareOpen(false), 400);
    };

    const handleShare = (getUrl: (url: string) => string) => {
        const siteUrl = 'https://mutatawi.com/';
        window.open(getUrl(siteUrl), '_blank', 'noopener,noreferrer,width=600,height=400');
    };

    return (
        <div className="fixed bottom-6 left-6 z-50 flex flex-col items-center gap-3">

            {/* ── Scroll-to-Top Button ── */}
            <AnimatePresence>
                {showScroll && !shareOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.3, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.3, y: 20 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                        className="relative w-14 h-14"
                    >
                        {/* Progress ring – outside the button, perfectly aligned */}
                        <svg className="absolute -inset-[3px] w-[62px] h-[62px] -rotate-90 pointer-events-none" viewBox="0 0 62 62">
                            <circle cx="31" cy="31" r={radius} fill="none" stroke="rgba(99,102,241,0.15)" strokeWidth="3" />
                            <circle
                                cx="31" cy="31" r={radius} fill="none" stroke="#6366f1" strokeWidth="3"
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                style={{ transition: 'stroke-dashoffset 0.15s ease-out' }}
                            />
                        </svg>

                        {/* Button */}
                        <motion.button
                            whileHover={{ scale: 1.1, boxShadow: '0 8px 30px rgba(99, 102, 241, 0.45)' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="w-14 h-14 rounded-full flex items-center justify-center cursor-pointer"
                            style={{ background: BUTTON_GRADIENT, boxShadow: BUTTON_SHADOW }}
                            aria-label="العودة للأعلى"
                        >
                            <IoArrowUpOutline className="text-white" size={22} />
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Share Button + Social Icons ── */}
            <div
                className="flex flex-col items-center"
                onMouseEnter={handleShareEnter}
                onMouseLeave={handleShareLeave}
            >
                {/* Social Icons – expand upward */}
                <AnimatePresence>
                    {shareOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="flex flex-col items-center gap-3 mb-3"
                        >
                            {/* Glass label */}
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 5, scale: 0.9 }}
                                transition={{ delay: 0.2, duration: 0.3 }}
                                className="px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-white/40 shadow-sm"
                            >
                                <span className="text-xs font-bold text-slate-600">شارك الموقع ✨</span>
                            </motion.div>

                            {shareLinks.map((link, i) => {
                                const Icon = link.icon;
                                return (
                                    <motion.button
                                        key={link.id}
                                        initial={{ opacity: 0, scale: 0, y: 40 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{
                                            opacity: 0, scale: 0.3, y: 20,
                                            transition: { delay: (shareLinks.length - 1 - i) * 0.03, duration: 0.2 },
                                        }}
                                        transition={{ delay: i * 0.06, type: 'spring', stiffness: 450, damping: 18 }}
                                        whileHover={{ scale: 1.22, y: -3, boxShadow: `0 6px 24px ${link.glow}` }}
                                        whileTap={{ scale: 0.85 }}
                                        onClick={() => handleShare(link.getUrl)}
                                        className="w-12 h-12 rounded-full flex items-center justify-center cursor-pointer group relative ring-2 ring-white/30"
                                        style={{ backgroundColor: link.color, boxShadow: `0 4px 15px ${link.glow}` }}
                                        title={link.label}
                                    >
                                        <Icon className="text-white" size={21} />
                                        <span className="absolute right-[3.8rem] bg-slate-900/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none shadow-lg border border-white/10">
                                            {link.label}
                                        </span>
                                    </motion.button>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Share Button */}
                <div className="relative">
                    {/* Pulse ring */}
                    <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{ background: BUTTON_GRADIENT }}
                        animate={!shareOpen ? { scale: [1, 1.5, 1.5], opacity: [0.4, 0.15, 0] } : { scale: 1, opacity: 0 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                    />
                    <motion.button
                        initial={{ opacity: 0, scale: 0.3 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
                        whileHover={{ scale: 1.12, boxShadow: '0 8px 35px rgba(99, 102, 241, 0.5)' }}
                        whileTap={{ scale: 0.9 }}
                        className="relative w-14 h-14 rounded-full flex items-center justify-center cursor-pointer"
                        style={{ background: BUTTON_GRADIENT, boxShadow: BUTTON_SHADOW }}
                        aria-label="مشاركة الموقع"
                    >
                        <motion.div
                            animate={shareOpen ? { rotate: 180, scale: 1.1 } : { rotate: 0, scale: 1 }}
                            transition={{ duration: 0.4, type: 'spring', stiffness: 300, damping: 20 }}
                        >
                            <IoShareSocialOutline className="text-white" size={22} />
                        </motion.div>
                    </motion.button>
                </div>
            </div>
        </div>
    );
}
