import { Suspense } from 'react';
import LoginForm from '@/app/components/auth/LoginForm';

export const metadata = {
    title: 'تسجيل الدخول | متطوع',
    description: 'سجّل دخولك إلى منصة متطوع للوصول إلى لوحة التحكم والفرص التطوعية.',
};

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
