'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { IoLogoInstagram, IoCallOutline, IoMailOutline, IoGlobeOutline, IoHeartSharp } from 'react-icons/io5';
import { useAuth } from '@/app/hooks/useAuth';

export default function Footer() {
    const { user } = useAuth();

    return (
        <footer className="bg-slate-900 text-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0aDR2MWgtNHYtMXptMC0yaDF2NGgtMXYtNHptMi0yaDF2MWgtMXYtMXptLTIgMGgxdjFoLTF2LTF6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                {/* Main Footer Content */}
                <div className="py-12 sm:py-16">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {/* Brand */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <img src="/logo.png" alt="متطوعي" className="w-10 h-10 rounded-full" />
                                <h3 className="text-xl font-bold">متطوعي</h3>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                                منصة متطوعي تربط المتطوعين بالفرص التطوعية في مجتمعاتهم.
                                اكتشف فرصاً تطوعية تناسب مهاراتك وساهم في بناء مستقبل أفضل.
                            </p>
                        </motion.div>

                        {/* Quick Links + Contact */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                        >
                            <h4 className="text-lg font-bold mb-4">روابط سريعة</h4>
                            <ul className="space-y-3">
                                <li>
                                    <Link href="/" className="text-slate-400 hover:text-white transition-colors text-sm">
                                        الرئيسية
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/opportunities" className="text-slate-400 hover:text-white transition-colors text-sm">
                                        الفرص التطوعية
                                    </Link>
                                </li>
                                {!user && (
                                    <>
                                        <li>
                                            <Link href="/register" className="text-slate-400 hover:text-white transition-colors text-sm">
                                                سجّل كمتطوع
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href="/register" className="text-slate-400 hover:text-white transition-colors text-sm">
                                                سجّل منظمتك
                                            </Link>
                                        </li>
                                        <li>
                                            <Link href="/login" className="text-slate-400 hover:text-white transition-colors text-sm">
                                                تسجيل الدخول
                                            </Link>
                                        </li>
                                    </>
                                )}
                            </ul>
                        </motion.div>

                        {/* Contact */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <h4 className="text-lg font-bold mb-4">تواصل معنا</h4>
                            <ul className="space-y-3">
                                <li>
                                    <a
                                        href="tel:+962790796457"
                                        className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors text-sm"
                                    >
                                        <IoCallOutline size={18} />
                                        <span dir="ltr">+962790796457</span>
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="mailto:mutatawi@gmail.com"
                                        className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors text-sm"
                                    >
                                        <IoMailOutline size={18} />
                                        <span>mutatawi@gmail.com</span>
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="https://www.instagram.com/mutatawi?igsh=M290bHUwMmR4dzRr"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors text-sm"
                                    >
                                        <IoLogoInstagram size={18} />
                                        <span>@mutatawi</span>
                                    </a>
                                </li>
                            </ul>
                        </motion.div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-slate-800 py-6">
                    <div className="flex flex-col items-center gap-3 text-sm text-slate-400">
                        <motion.p
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className="flex items-center gap-1.5 flex-wrap justify-center"
                        >
                            تم تصميم وتطوير الموقع بواسطة
                            <a
                                href="https://abdelrahman-abuzaid-protofolio.vercel.app/?fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQPNTY3MDY3MzQzMzUyNDI3AAGnlSlTcIb8dlkpOQSrzMVCIylzaNjTXcPO2aQ6O0ANveFC4Kc3W5sjbEmkO7g_aem_Zq8HwN_nf28yZjb_TE7Paw"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-400 hover:text-primary-300 font-bold transition-colors"
                            >
                                عبدالرحمن ابوزيد
                            </a>
                            <IoHeartSharp className="text-red-400" size={14} />
                        </motion.p>
                        {/* Developer Contact */}
                        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
                            <a href="tel:+962790796457" className="hover:text-slate-300 transition-colors flex items-center gap-1">
                                <IoCallOutline size={14} />
                                <span dir="ltr">+962790796457</span>
                            </a>
                            <a
                                href="https://www.instagram.com/mutatawi?igsh=M290bHUwMmR4dzRr"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-slate-300 transition-colors flex items-center gap-1"
                            >
                                <IoLogoInstagram size={14} />
                                @mutatawi
                            </a>
                            <a
                                href="https://abdelrahman-abuzaid-protofolio.vercel.app/?fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQPNTY3MDY3MzQzMzUyNDI3AAGnlSlTcIb8dlkpOQSrzMVCIylzaNjTXcPO2aQ6O0ANveFC4Kc3W5sjbEmkO7g_aem_Zq8HwN_nf28yZjb_TE7Paw"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-slate-300 transition-colors flex items-center gap-1"
                            >
                                <IoGlobeOutline size={14} />
                                البورتفوليو
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
