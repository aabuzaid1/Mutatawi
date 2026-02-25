'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoHomeOutline,
    IoPersonOutline,
    IoAddCircleOutline,
    IoPeopleOutline,
    IoLogOutOutline,
    IoMenuOutline,
    IoCloseOutline,
    IoAnalyticsOutline,
} from 'react-icons/io5';
import { useAuth } from '@/app/hooks/useAuth';
import { signOut } from '@/app/lib/auth';
import { cn } from '@/app/lib/utils';

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { profile } = useAuth();
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    const isOrg = profile?.role === 'organization';

    // Close sidebar on route change
    useEffect(() => {
        setIsMobileOpen(false);
    }, [pathname]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isMobileOpen]);

    const volunteerLinks = [
        { href: '/volunteer', label: 'لوحة التحكم', icon: IoHomeOutline },
        { href: '/volunteer/profile', label: 'الملف الشخصي', icon: IoPersonOutline },
    ];

    const orgLinks = [
        { href: '/organization', label: 'لوحة التحكم', icon: IoHomeOutline },
        { href: '/organization/post-opportunity', label: 'نشر فرصة', icon: IoAddCircleOutline },
        { href: '/organization/applicants', label: 'المتقدمون', icon: IoPeopleOutline },
        { href: '/organization/analytics', label: 'الإحصائيات', icon: IoAnalyticsOutline },
    ];

    const links = isOrg ? orgLinks : volunteerLinks;

    const SidebarContent = () => (
        <>
            {/* Logo */}
            <div className="p-5 sm:p-6 border-b border-slate-100">
                <button
                    onClick={() => {
                        setIsMobileOpen(false);
                        router.push('/');
                        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 100);
                    }}
                    className="flex items-center gap-3 cursor-pointer"
                >
                    <img src="/logo.png" alt="متطوع" className="w-10 h-10 rounded-full shadow-md" />
                    <div>
                        <h2 className="font-bold text-slate-800">متطوع</h2>
                        <p className="text-xs text-slate-400">
                            {isOrg ? 'حساب المنظمة' : 'حساب المتطوع'}
                        </p>
                    </div>
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 sm:p-4 space-y-1">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;
                    return (
                        <Link key={link.href} href={link.href} onClick={() => setIsMobileOpen(false)}>
                            <motion.div
                                whileHover={{ x: -4 }}
                                whileTap={{ scale: 0.97 }}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-3.5 sm:py-3 rounded-xl font-medium transition-all duration-200 relative',
                                    isActive
                                        ? 'bg-primary-50 text-primary-600 shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                                )}
                            >
                                <Icon size={22} className="sm:w-5 sm:h-5" />
                                <span className="text-[15px] sm:text-sm">{link.label}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute right-0 w-1 h-8 bg-primary-500 rounded-l-full"
                                    />
                                )}
                            </motion.div>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-100 space-y-1">
                <button
                    onClick={async () => {
                        setIsMobileOpen(false);
                        await signOut();
                        router.push('/');
                    }}
                    className="flex items-center gap-3 px-4 py-3.5 sm:py-3 rounded-xl w-full text-slate-500 hover:bg-danger-50 hover:text-danger-600 font-medium transition-all duration-200"
                >
                    <IoLogOutOutline size={22} className="sm:w-5 sm:h-5" />
                    <span className="text-[15px] sm:text-sm">تسجيل الخروج</span>
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile Menu Button */}
            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setIsMobileOpen(true)}
                className="md:hidden fixed top-4 right-4 z-50 w-12 h-12 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
                aria-label="فتح القائمة"
            >
                <IoMenuOutline size={24} />
            </motion.button>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            onClick={() => setIsMobileOpen(false)}
                            className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[55]"
                        />

                        {/* Mobile Sidebar */}
                        <motion.aside
                            initial={{ x: 300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 300, opacity: 0 }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="md:hidden fixed right-0 top-0 h-screen w-[280px] bg-white shadow-2xl z-[60] flex flex-col"
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setIsMobileOpen(false)}
                                className="absolute top-4 left-4 w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                                aria-label="إغلاق القائمة"
                            >
                                <IoCloseOutline size={22} />
                            </button>
                            <SidebarContent />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex fixed right-0 top-0 h-screen w-64 bg-white border-l border-slate-100 shadow-soft z-40 flex-col">
                <SidebarContent />
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-slate-100 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)]">
                <div className="flex items-center justify-around py-2 px-2">
                    {links.map((link) => {
                        const isActive = pathname === link.href;
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={cn(
                                    'flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 min-w-[64px]',
                                    isActive
                                        ? 'text-primary-600'
                                        : 'text-slate-400 hover:text-slate-600'
                                )}
                            >
                                <div className={cn(
                                    'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200',
                                    isActive ? 'bg-primary-50 shadow-sm' : ''
                                )}>
                                    <Icon size={22} />
                                </div>
                                <span className={cn(
                                    'text-[11px] font-medium',
                                    isActive ? 'text-primary-600' : 'text-slate-400'
                                )}>
                                    {link.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>

                {/* Safe area for bottom notch */}
                <div className="h-[env(safe-area-inset-bottom)]" />
            </nav>
        </>
    );
}
