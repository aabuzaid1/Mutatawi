'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/app/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    icon?: ReactNode;
    children: ReactNode;
}

const variants = {
    primary: 'gradient-primary text-white shadow-soft hover:shadow-glow',
    secondary: 'bg-white text-primary-600 border border-primary-200 hover:bg-primary-50',
    outline: 'bg-transparent text-slate-700 border border-slate-200 hover:bg-slate-50',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100',
    danger: 'bg-danger-500 text-white hover:bg-danger-600',
};

const sizes = {
    sm: 'px-4 py-2 text-sm rounded-lg',
    md: 'px-6 py-3 text-base rounded-xl',
    lg: 'px-8 py-4 text-lg rounded-xl',
};

export default function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    children,
    className,
    disabled,
    ...props
}: ButtonProps) {
    return (
        <motion.button
            whileHover={{
                scale: disabled || loading ? 1 : 1.03,
                y: disabled || loading ? 0 : -1,
            }}
            whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
            transition={{
                type: 'spring',
                stiffness: 400,
                damping: 17,
            }}
            className={cn(
                'font-medium flex items-center justify-center gap-2 smooth-appear',
                'transition-colors duration-300',
                variants[variant],
                sizes[size],
                (disabled || loading) && 'opacity-60 cursor-not-allowed',
                className
            )}
            disabled={disabled || loading}
            {...(props as any)}
        >
            {loading ? (
                <motion.svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                    <circle
                        className="opacity-25"
                        cx="12" cy="12" r="10"
                        stroke="currentColor" strokeWidth="4" fill="none"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                </motion.svg>
            ) : icon ? (
                <motion.span
                    className="text-lg"
                    initial={{ scale: 1 }}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                >
                    {icon}
                </motion.span>
            ) : null}
            {children}
        </motion.button>
    );
}
