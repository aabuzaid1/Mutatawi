export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 gradient-mesh" />
            <div className="absolute top-0 left-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-success-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

            <div className="relative flex items-center justify-center min-h-screen py-8 sm:py-12 px-3 sm:px-4">
                {children}
            </div>
        </div>
    );
}
