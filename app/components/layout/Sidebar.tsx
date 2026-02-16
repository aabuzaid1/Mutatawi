'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    IoHomeOutline,
    IoPersonOutline,
    IoAddCircleOutline,
    IoPeopleOutline,
    IoStatsChartOutline,
    IoLogOutOutline,
    IoSettingsOutline,
} from 'react-icons/io5';
import { useAuth } from '@/app/hooks/useAuth';
import { signOut } from '@/app/lib/auth';
import { cn } from '@/app/lib/utils';

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { profile } = useAuth();

    const isOrg = profile?.role === 'organization';

    const volunteerLinks = [
        { href: '/volunteer', label: 'لوحة التحكم', icon: IoHomeOutline },
        { href: '/volunteer/profile', label: 'الملف الشخصي', icon: IoPersonOutline },
    ];

    const orgLinks = [
        { href: '/organization', label: 'لوحة التحكم', icon: IoHomeOutline },
        { href: '/organization/post-opportunity', label: 'نشر فرصة', icon: IoAddCircleOutline },
        { href: '/organization/applicants', label: 'المتقدمون', icon: IoPeopleOutline },
    ];

    const links = isOrg ? orgLinks : volunteerLinks;

    return (
        <aside className="fixed right-0 top-0 h-screen w-64 bg-white border-l border-slate-100 shadow-soft z-40 flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-slate-100">
                <Link href="/" className="flex items-center gap-3">
                    <img src="/logo.png" alt="متطوع" className="w-10 h-10 rounded-full shadow-md" />
                    <div>
                        <h2 className="font-bold text-slate-800">متطوع</h2>
                        <p className="text-xs text-slate-400">
                            {isOrg ? 'حساب المنظمة' : 'حساب المتطوع'}
                        </p>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {links.map((link) => {
                    const isActive = pathname === link.href;
                    const Icon = link.icon;
                    return (
                        <Link key={link.href} href={link.href}>
                            <motion.div
                                whileHover={{ x: -4 }}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200',
                                    isActive
                                        ? 'bg-primary-50 text-primary-600 shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                                )}
                            >
                                <Icon size={20} />
                                <span>{link.label}</span>
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
            <div className="p-4 border-t border-slate-100 space-y-1">
                <button
                    onClick={async () => { await signOut(); router.push('/'); }}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-slate-500 hover:bg-danger-50 hover:text-danger-600 font-medium transition-all duration-200"
                >
                    <IoLogOutOutline size={20} />
                    <span>تسجيل الخروج</span>
                </button>
            </div>
        </aside>
    );
}
