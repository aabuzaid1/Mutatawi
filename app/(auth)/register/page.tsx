import RegisterForm from '@/app/components/auth/RegisterForm';

export const metadata = {
    title: 'إنشاء حساب | متطوع',
    description: 'أنشئ حسابك في منصة متطوع وابدأ رحلتك التطوعية اليوم.',
};

export default function RegisterPage() {
    return <RegisterForm />;
}
