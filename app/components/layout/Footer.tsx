'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { IoHeartOutline, IoLogoGithub, IoLogoTwitter, IoLogoLinkedin } from 'react-icons/io5';

export default function Footer() {
    const footerLinks = {
        'المنصة': [
            { label: 'كيف يعمل', href: '#how-it-works' },
            { label: 'قصص النجاح', href: '#testimonials' },
        ],
        'للمتطوعين': [
            { label: 'سجل كمتطوع', href: '/register' },
            { label: 'الملف الشخصي', href: '/volunteer/profile' },
        ],
        'للمنظمات': [
            { label: 'سجل منظمتك', href: '/register' },
            { label: 'انشر فرصة تطوعية', href: '/organization/post-opportunity' },
            { label: 'إدارة المتقدمين', href: '/organization/applicants' },
        ],
    };

    return (
        <footer className="bg-slate-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {/* Brand */}
                    <div className="lg:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <img src="/logo.png" alt="متطوع" className="w-10 h-10 rounded-full shadow-lg" />
                            <span className="text-xl font-bold">متطوع</span>
                        </div>
                        <p className="text-slate-400 leading-relaxed mb-6">
                            منصة تربط المتطوعين بالفرص التطوعية في مجتمعاتهم، لبناء مستقبل أفضل معاً.
                        </p>
                        <div className="flex gap-3">
                            {[IoLogoTwitter, IoLogoLinkedin, IoLogoGithub].map((Icon, i) => (
                                <motion.a
                                    key={i}
                                    href="#"
                                    className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-primary-500 transition-colors duration-200"
                                    whileHover={{ scale: 1.1, y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                >
                                    <Icon size={18} />
                                </motion.a>
                            ))}
                        </div>
                    </div>

                    {/* Links */}
                    {Object.entries(footerLinks).map(([title, links]) => (
                        <div key={title}>
                            <h3 className="font-bold text-lg mb-4">{title}</h3>
                            <ul className="space-y-3">
                                {links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-slate-400 hover:text-white hover:pr-1 transition-all duration-200"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom */}
                <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-slate-400 text-sm">
                        © 2024 متطوع. جميع الحقوق محفوظة.
                    </p>
                    <p className="text-slate-400 text-sm flex items-center gap-1">
                        صُنع بـ <motion.span
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                        >
                            <IoHeartOutline className="text-danger-500" />
                        </motion.span> في الأردن
                    </p>
                </div>
            </div>
        </footer>
    );
}
