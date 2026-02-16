'use client';

import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
};

export default function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
    return (
        <div className={`flex items-center justify-center ${className}`}>
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className={`${sizes[size]} border-3 border-slate-200 border-t-primary-500 rounded-full`}
                style={{ borderWidth: size === 'sm' ? 2 : 3 }}
            />
        </div>
    );
}
