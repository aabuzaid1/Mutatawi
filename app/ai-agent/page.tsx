'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoSparklesOutline,
    IoMenuOutline,
    IoAddOutline,
    IoClose,
    IoDocumentTextOutline,
} from 'react-icons/io5';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { useAuth } from '@/app/hooks/useAuth';
import AIChatPanel from '@/app/components/ai/AIChatPanel';
import ConversationSidebar from '@/app/components/ai/ConversationSidebar';
import Link from 'next/link';

/* ─── Scarf Pattern (Keffiyeh / Shemagh) ─── */
function ScarfPattern({ color, side }: { color: string; side: 'left' | 'right' }) {
    return (
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
                {/* Houndstooth weave tile — smaller, tighter knots */}
                <pattern id={`weave-${side}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                    <g fill={color}>
                        <rect x="7" y="7" width="6" height="6" rx="0.5" />
                        <rect x="-3" y="-3" width="6" height="6" rx="0.5" />
                        <rect x="17" y="17" width="6" height="6" rx="0.5" />
                        <rect x="-3" y="17" width="6" height="6" rx="0.5" />
                        <rect x="17" y="-3" width="6" height="6" rx="0.5" />
                    </g>
                    <g stroke={color} strokeWidth="1.5" strokeLinecap="round">
                        <line x1="3" y1="3" x2="7" y2="7" />
                        <line x1="13" y1="13" x2="17" y2="17" />
                        <line x1="3" y1="17" x2="7" y2="13" />
                        <line x1="13" y1="7" x2="17" y2="3" />
                    </g>
                </pattern>

                {/* Smooth horizontal fade: strong at edge → transparent inward */}
                <linearGradient id={`fx-${side}`} x1={side === 'left' ? '0' : '1'} y1="0" x2={side === 'left' ? '1' : '0'} y2="0">
                    <stop offset="0%" stopColor="white" stopOpacity="1" />
                    <stop offset="35%" stopColor="white" stopOpacity="0.55" />
                    <stop offset="70%" stopColor="white" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                </linearGradient>
                {/* Vertical fade: transparent at top/bottom edges */}
                <linearGradient id={`fy-${side}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="white" stopOpacity="0" />
                    <stop offset="8%" stopColor="white" stopOpacity="0.6" />
                    <stop offset="25%" stopColor="white" stopOpacity="1" />
                    <stop offset="75%" stopColor="white" stopOpacity="1" />
                    <stop offset="92%" stopColor="white" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                </linearGradient>
                <mask id={`m-${side}`}>
                    <rect width="100%" height="100%" fill={`url(#fx-${side})`} />
                    <rect width="100%" height="100%" fill={`url(#fy-${side})`} style={{ mixBlendMode: 'multiply' } as any} />
                </mask>
            </defs>
            <rect width="100%" height="100%" fill={`url(#weave-${side})`} mask={`url(#m-${side})`} />
        </svg>
    );
}

export default function AIAgentPage() {
    const { user, profile, loading } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();
    const [tokenBalance, setTokenBalance] = useState<number>(0);
    const [dailyRequests, setDailyRequests] = useState<number>(0);

    // Fetch token balance
    const fetchBalance = useCallback(async () => {
        if (!user) return;
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/ai/tokens', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                if (data.account) {
                    setTokenBalance(data.account.remainingTokens);
                    setDailyRequests(data.account.dailyRequestCount);
                }
            }
        } catch (err) {
            console.error('Failed to fetch balance:', err);
        }
    }, [user]);

    // Initialize token account if needed
    useEffect(() => {
        async function initAccount() {
            if (!user || !profile) return;
            try {
                const token = await user.getIdToken();
                // Try to get balance first
                const res = await fetch('/api/ai/tokens', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                const data = await res.json();

                if (!data.account) {
                    // Initialize new account
                    await fetch('/api/ai/tokens', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ displayName: profile.displayName }),
                    });
                    await fetchBalance();
                } else {
                    setTokenBalance(data.account.remainingTokens);
                    setDailyRequests(data.account.dailyRequestCount);
                }
            } catch (err) {
                console.error('Init account error:', err);
            }
        }
        initAccount();
    }, [user, profile, fetchBalance]);

    const handleNewChat = () => {
        setCurrentConversationId(undefined);
        setSidebarOpen(false);
    };

    const handleSelectConversation = (id: string) => {
        setCurrentConversationId(id);
        setSidebarOpen(false);
    };

    const handleTokenUpdate = (newBalance: number, newDailyCount: number) => {
        setTokenBalance(newBalance);
        setDailyRequests(newDailyCount);
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-20 flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                </main>
            </>
        );
    }

    if (!user) {
        return (
            <>
                <Navbar />
                <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-24 pb-16">
                    <div className="max-w-lg mx-auto px-4 text-center">
                        <div className="w-20 h-20 bg-primary-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <IoSparklesOutline size={40} className="text-primary-600" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">🤖 حنظلة</h1>
                        <p className="text-slate-500 mb-8">سجّل دخولك للوصول لحنظلة</p>
                        <Link href="/login?redirect=/ai-agent">
                            <motion.span
                                className="inline-block px-8 py-3 bg-primary-600 text-white rounded-xl font-bold cursor-pointer"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                تسجيل الدخول
                            </motion.span>
                        </Link>
                    </div>
                </main>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pt-16 sm:pt-20 relative overflow-hidden">
                {/* ─── Keffiyeh — Left side (Palestinian) ─── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.8, delay: 0.5 }}
                    className="absolute left-0 top-0 w-[5%] sm:w-[8%] md:w-[10%] lg:w-[12%] h-full opacity-[0.035] sm:opacity-[0.06] pointer-events-none z-0"
                >
                    <ScarfPattern color="#111111" side="left" />
                </motion.div>

                {/* ─── Shemagh — Right side (Jordanian) ─── */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1.8, delay: 0.7 }}
                    className="absolute right-0 top-0 w-[5%] sm:w-[8%] md:w-[10%] lg:w-[12%] h-full opacity-[0.035] sm:opacity-[0.06] pointer-events-none z-0"
                >
                    <ScarfPattern color="#b91c1c" side="right" />
                </motion.div>

                <div className="max-w-7xl mx-auto flex h-[calc(100vh-8rem)] sm:h-[calc(100vh-9.5rem)] relative z-10">
                    {/* Sidebar — Desktop */}
                    <div className="hidden lg:flex w-72 flex-shrink-0 border-l border-slate-200 bg-white/80 backdrop-blur flex-col">
                        <div className="p-4 border-b border-slate-100 flex flex-col gap-3">
                            <button
                                onClick={handleNewChat}
                                className="w-full flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors"
                            >
                                <IoAddOutline size={20} />
                                محادثة جديدة
                            </button>
                            <Link
                                href="/ai-agent/study"
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-l from-primary-100 to-white text-primary-700 border border-primary-200 rounded-xl font-bold hover:bg-primary-50 transition-colors shadow-sm"
                            >
                                <IoDocumentTextOutline size={18} />
                                وكيل الدراسة الذكي
                            </Link>
                        </div>
                        <ConversationSidebar
                            userId={user.uid}
                            currentConversationId={currentConversationId}
                            onSelectConversation={handleSelectConversation}
                        />
                    </div>

                    {/* Mobile Sidebar Overlay */}
                    <AnimatePresence>
                        {sidebarOpen && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                                    onClick={() => setSidebarOpen(false)}
                                />
                                <motion.div
                                    initial={{ x: '100%' }}
                                    animate={{ x: 0 }}
                                    exit={{ x: '100%' }}
                                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                    className="fixed right-0 top-0 bottom-0 w-72 bg-white z-50 flex flex-col shadow-2xl lg:hidden"
                                >
                                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                        <button
                                            onClick={handleNewChat}
                                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl font-bold text-sm"
                                        >
                                            <IoAddOutline size={18} />
                                            محادثة جديدة
                                        </button>
                                        <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                                            <IoClose size={20} />
                                        </button>
                                    </div>
                                    <ConversationSidebar
                                        userId={user.uid}
                                        currentConversationId={currentConversationId}
                                        onSelectConversation={handleSelectConversation}
                                    />
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>

                    {/* Chat Panel */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {/* Mobile Menu Button */}
                        <div className="lg:hidden flex items-center justify-between px-4 py-2 bg-white/80 backdrop-blur border-b border-slate-100">
                            <span className="text-base font-black text-slate-800 flex items-center gap-1.5 tracking-wide">
                                <IoSparklesOutline size={18} className="text-primary-600" />
                                حنظلة
                            </span>
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="p-2 hover:bg-slate-100 rounded-lg"
                            >
                                <IoMenuOutline size={22} />
                            </button>
                        </div>

                        <AIChatPanel
                            userId={user.uid}
                            userDisplayName={profile?.displayName || 'طالب'}
                            conversationId={currentConversationId}
                            onConversationCreated={(id) => setCurrentConversationId(id)}
                            onTokenUpdate={handleTokenUpdate}
                        />
                    </div>
                </div>
            </main>
        </>
    );
}
