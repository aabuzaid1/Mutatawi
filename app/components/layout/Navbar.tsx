'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { IoMenuOutline, IoCloseOutline, IoPersonOutline, IoLogInOutline } from 'react-icons/io5';
import { useAuth } from '@/app/hooks/useAuth';
import Button from '../ui/Button';

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user, profile } = useAuth();

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { href: '/', label: 'الرئيسية' },
        { href: '#how-it-works', label: 'كيف يعمل' },
        { href: '#about', label: 'من نحن' },
    ];

    return (
        <>
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                    type: 'spring',
                    damping: 25,
                    stiffness: 120,
                    mass: 0.8,
                }}
                className={`fixed top-0 left-0 right-0 z-50 ${isScrolled
                    ? 'bg-white/80 backdrop-blur-2xl border-b border-white/30 shadow-glass'
                    : 'bg-transparent'
                    }`}
                style={{
                    transition: 'background-color 0.6s cubic-bezier(0.4, 0, 0.2, 1), backdrop-filter 0.6s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.6s ease, box-shadow 0.6s ease',
                }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 sm:h-20">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-3 group">
                            <motion.div
                                className="relative"
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                            >
                                <motion.img
                                    src="/logo.png"
                                    alt="متطوع"
                                    className="w-12 h-12 rounded-full shadow-lg group-hover:shadow-xl transition-shadow duration-300"
                                    whileHover={{ rotate: -5 }}
                                    transition={{ type: 'spring', stiffness: 400 }}
                                />
                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary-400/20 to-secondary-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </motion.div>
                            <span className="text-xl sm:text-2xl font-bold text-gradient">متطوع</span>
                        </Link>

                        {/* Desktop Nav Links */}
                        <div className="hidden md:flex items-center gap-8">
                            {navLinks.map((link, i) => (
                                <motion.div
                                    key={link.href}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * i + 0.3, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                                >
                                    <Link
                                        href={link.href}
                                        className="text-slate-600 hover:text-primary-600 font-medium link-underline py-1"
                                    >
                                        {link.label}
                                    </Link>
                                </motion.div>
                            ))}
                        </div>

                        {/* Auth Buttons */}
                        <motion.div
                            className="hidden md:flex items-center gap-3"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                        >
                            {user ? (
                                <Link href={profile?.role === 'organization' ? '/organization' : '/volunteer'}>
                                    <Button variant="primary" size="sm" icon={<IoPersonOutline />}>
                                        لوحة التحكم
                                    </Button>
                                </Link>
                            ) : (
                                <>
                                    <Link href="/login">
                                        <Button variant="ghost" size="sm">
                                            تسجيل الدخول
                                        </Button>
                                    </Link>
                                    <Link href="/register">
                                        <Button variant="primary" size="sm" icon={<IoLogInOutline />}>
                                            انضم الآن
                                        </Button>
                                    </Link>
                                </>
                            )}
                        </motion.div>

                        {/* Mobile Menu Toggle */}
                        <motion.button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 rounded-xl hover:bg-slate-100/80"
                            whileTap={{ scale: 0.9 }}
                            transition={{ type: 'spring', stiffness: 400 }}
                        >
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={isMobileMenuOpen ? 'close' : 'menu'}
                                    initial={{ rotate: -90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: 90, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {isMobileMenuOpen ? <IoCloseOutline size={24} /> : <IoMenuOutline size={24} />}
                                </motion.div>
                            </AnimatePresence>
                        </motion.button>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />

                        {/* Menu Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            transition={{
                                duration: 0.35,
                                ease: [0.25, 0.46, 0.45, 0.94] as const,
                            }}
                            className="fixed inset-x-0 top-16 z-40 bg-white/95 backdrop-blur-2xl border-b border-slate-100 shadow-card md:hidden"
                        >
                            <div className="p-4 space-y-1">
                                {navLinks.map((link, i) => (
                                    <motion.div
                                        key={link.href}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 + 0.1, duration: 0.3 }}
                                    >
                                        <Link
                                            href={link.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="block px-4 py-3 rounded-xl text-slate-700 hover:bg-primary-50 hover:text-primary-600 font-medium"
                                        >
                                            {link.label}
                                        </Link>
                                    </motion.div>
                                ))}
                                <motion.div
                                    className="pt-3 border-t border-slate-100 space-y-2"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    {user ? (
                                        <Link href={profile?.role === 'organization' ? '/organization' : '/volunteer'}>
                                            <Button variant="primary" className="w-full">
                                                لوحة التحكم
                                            </Button>
                                        </Link>
                                    ) : (
                                        <>
                                            <Link href="/login" className="block">
                                                <Button variant="outline" className="w-full">
                                                    تسجيل الدخول
                                                </Button>
                                            </Link>
                                            <Link href="/register" className="block">
                                                <Button variant="primary" className="w-full">
                                                    انضم الآن
                                                </Button>
                                            </Link>
                                        </>
                                    )}
                                </motion.div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
