import LoginForm from '@/app/components/auth/LoginForm';

export const metadata = {
    title: 'تسجيل الدخول | متطوع',
    description: 'سجّل دخولك إلى منصة متطوع للوصول إلى لوحة التحكم والفرص التطوعية.',
};

export default function LoginPage() {
    return <LoginForm />;
}
