import { cn } from '@/app/lib/utils';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circle' | 'rect';
    width?: string;
    height?: string;
}

export default function Skeleton({
    className,
    variant = 'rect',
    width,
    height,
}: SkeletonProps) {
    const variants = {
        text: 'h-4 rounded',
        circle: 'rounded-full',
        rect: 'rounded-2xl',
    };

    return (
        <div
            className={cn(
                'animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200',
                'bg-[length:200%_100%] animate-shimmer',
                variants[variant],
                className
            )}
            style={{ width, height }}
        />
    );
}
