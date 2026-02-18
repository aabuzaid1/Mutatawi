import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from './context/AuthContext';
import ToastProvider from './components/shared/ToastProvider';
import ScrollToTop from './components/shared/ScrollToTop';

export const metadata: Metadata = {
    title: 'متطوع | منصة التطوع الأولى',
    description: 'منصة متطوع تربط المتطوعين بالفرص التطوعية في مجتمعاتهم. اكتشف فرصاً تطوعية تناسب مهاراتك وساهم في بناء مستقبل أفضل.',
    keywords: ['تطوع', 'متطوع', 'فرص تطوعية', 'مجتمع', 'عمل خيري'],
};

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
                    {children}
                </AuthProvider>
            </body>
        </html>
    );
}
