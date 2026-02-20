/**
 * @fileoverview الصفحة الرئيسية للتطبيق (Landing Page).
 * تستعرض الواجهة التسويقية والخدمات باستخدام تقنيات التحميل الكسول (Lazy-loading)
 * لعرض الأقسام غير الظاهرة مبدئياً وتسريع وقت التحميل (LCP).
 */

'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import Navbar from './components/layout/Navbar';
import Hero from './components/landing/Hero';
import Footer from './components/layout/Footer';
import { useAuth } from './hooks/useAuth';

// Lazy-load below-the-fold sections for faster initial page load
const Stats = dynamic(() => import('./components/landing/Stats'));
const HowItWorks = dynamic(() => import('./components/landing/HowItWorks'));
const FeaturedOpps = dynamic(() => import('./components/landing/FeaturedOpps'));
const Testimonials = dynamic(() => import('./components/landing/Testimonials'));

/**
 * مكون الصفحة الرئيسية.
 * يعرض الترويسة، الإحصائيات، طريقة العمل، وآراء المستخدمين.
 * يراقب حالة المصادقة عبر `useAuth` لإخفاء قسم "الدعوة للتسجيل (CTA)" للمستخدمين المسجلين مسبقاً.
 * 
 * @returns {JSX.Element} واجهة الصفحة الرئيسية.
 */
export default function Home() {
    const { user } = useAuth();

    return (
        <main className="min-h-screen">
            <Navbar />
            <Hero />
            <Stats />
            <HowItWorks />
            <FeaturedOpps />
            <Testimonials />

            {/* CTA Section - only for guests */}
            {!user && (
                <section className="section-padding bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0aDR2MWgtNHYtMXptMC0yaDF2NGgtMXYtNHptMi0yaDF2MWgtMXYtMXptLTIgMGgxdjFoLTF2LTF6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />
                    <motion.div
                        className="max-w-4xl mx-auto text-center relative"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                    >
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-6">
                            مستعد لإحداث فرق؟
                        </h2>
                        <p className="text-lg sm:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
                            انضم إلى مجتمع المتطوعين الذين يصنعون التغيير كل يوم. سجّل الآن وابدأ رحلتك التطوعية.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-4">
                            <Link href="/register">
                                <motion.span
                                    className="inline-block px-8 py-4 rounded-xl bg-white text-primary-600 font-bold text-lg shadow-lg cursor-pointer"
                                    whileHover={{ scale: 1.05, y: -2, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)' }}
                                    whileTap={{ scale: 0.97 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                >
                                    سجّل كمتطوع
                                </motion.span>
                            </Link>
                            <Link href="/register">
                                <motion.span
                                    className="inline-block px-8 py-4 rounded-xl bg-white/10 backdrop-blur text-white font-bold text-lg border border-white/20 cursor-pointer"
                                    whileHover={{ scale: 1.05, y: -2, backgroundColor: 'rgba(255,255,255,0.2)' }}
                                    whileTap={{ scale: 0.97 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                >
                                    سجّل منظمتك
                                </motion.span>
                            </Link>
                        </div>
                    </motion.div>
                </section>
            )}

            <Footer />
        </main>
    );
}
