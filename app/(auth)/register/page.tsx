import { Suspense } from 'react';
import RegisterForm from '@/app/components/auth/RegisterForm';

export const metadata = {
    title: 'إنشاء حساب | متطوع',
    description: 'أنشئ حسابك في منصة متطوع وابدأ رحلتك التطوعية اليوم.',
};

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
        }>
            <RegisterForm />
        </Suspense>
    );
}
