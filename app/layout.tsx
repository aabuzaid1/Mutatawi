/**
 * @fileoverview المخطط الهيكلي الجذري للتطبيق (Root Layout).
 * يتحكم بهيكل الـ HTML الأساسي ويرفق Providers العامة مثل `AuthProvider` 
 * لضمان وصول السياق (Context) لجميع مسارات التطبيق.
 */

import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from './context/AuthContext';
import ToastProvider from './components/shared/ToastProvider';
import ScrollToTop from './components/shared/ScrollToTop';
import AnalyticsTracker from './components/shared/AnalyticsTracker';
import { Analytics } from '@vercel/analytics/react';

/**
 * البيانات الوصفية (Metadata) لـ SEO والتحسين في محركات البحث.
 * @type {Metadata}
 */
export const metadata: Metadata = {
    title: 'متطوع | منصة التطوع الأولى',
    description: 'منصة متطوع تربط المتطوعين بالفرص التطوعية في مجتمعاتهم. اكتشف فرصاً تطوعية تناسب مهاراتك وساهم في بناء مستقبل أفضل.',
    keywords: ['تطوع', 'متطوع', 'فرص تطوعية', 'مجتمع', 'عمل خيري'],
};

/**
 * مكون التخطيط الجذري (Root Layout).
 * يُغلف كامل التطبيق ويوفر Providers اللازمة ويدير إعدادات اللغة والتمرير.
 * 
 * @param {Object} props - خصائص المكون.
 * @param {React.ReactNode} props.children - مكونات المسار الداخلي (Pages/Components).
 * @returns {JSX.Element} كود الـ HTML الأساسي المغلف بالـ Providers.
 */
export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ar" dir="rtl">
            <body className="font-tajawal antialiased">
                <AuthProvider>
                    <ToastProvider />
                    <ScrollToTop />
                    <AnalyticsTracker />
                    {children}
                </AuthProvider>
                <Analytics />
            </body>
        </html>
    );
}
