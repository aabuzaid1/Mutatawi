import { cn } from '@/app/lib/utils';

interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
    size?: 'sm' | 'md';
    className?: string;
}

const badgeVariants = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-success-50 text-success-600 border border-success-500/20',
    warning: 'bg-warning-50 text-warning-600 border border-warning-500/20',
    danger: 'bg-danger-50 text-danger-600 border border-danger-500/20',
    info: 'bg-primary-50 text-primary-600 border border-primary-500/20',
};

const badgeSizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
};

export default function Badge({
    children,
    variant = 'default',
    size = 'md',
    className,
}: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center font-medium rounded-full',
                badgeVariants[variant],
                badgeSizes[size],
                className
            )}
        >
            {children}
        </span>
    );
}
