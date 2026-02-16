'use client';

import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/app/lib/utils';

interface CardProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    onClick?: () => void;
    delay?: number;
}

const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
};

export default function Card({
    children,
    className,
    hover = true,
    padding = 'md',
    onClick,
    delay = 0,
}: CardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{
                duration: 0.6,
                delay,
                ease: [0.25, 0.46, 0.45, 0.94] as const,
            }}
            whileHover={hover ? {
                y: -6,
                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.08)',
                transition: {
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                }
            } : {}}
            className={cn(
                'bg-white rounded-2xl shadow-soft border border-slate-100 smooth-appear',
                paddings[padding],
                onClick && 'cursor-pointer',
                className
            )}
            onClick={onClick}
        >
            {children}
        </motion.div>
    );
}
