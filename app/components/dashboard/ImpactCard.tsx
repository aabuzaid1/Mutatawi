'use client';

import { motion } from 'framer-motion';
import { cn } from '@/app/lib/utils';
import { IconType } from 'react-icons';

interface ImpactCardProps {
    title: string;
    value: string | number;
    icon: IconType;
    trend?: { value: number; positive: boolean };
    color: 'primary' | 'success' | 'warning' | 'danger';
}

const colors = {
    primary: { bg: 'bg-primary-50', icon: 'text-primary-600', trend: 'text-primary-600' },
    success: { bg: 'bg-success-50', icon: 'text-success-600', trend: 'text-success-600' },
    warning: { bg: 'bg-warning-50', icon: 'text-warning-600', trend: 'text-warning-600' },
    danger: { bg: 'bg-danger-50', icon: 'text-danger-600', trend: 'text-danger-600' },
};

export default function ImpactCard({ title, value, icon: Icon, trend, color }: ImpactCardProps) {
    const c = colors[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2, boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.08)' }}
            className="bg-white rounded-2xl p-6 shadow-soft border border-slate-100 transition-all duration-300"
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-slate-500 mb-1">{title}</p>
                    <h3 className="text-3xl font-black text-slate-800">{value}</h3>
                    {trend && (
                        <p className={cn('text-sm font-medium mt-2', trend.positive ? 'text-success-600' : 'text-danger-500')}>
                            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%{' '}
                            <span className="text-slate-400">هذا الشهر</span>
                        </p>
                    )}
                </div>
                <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', c.bg)}>
                    <Icon className={c.icon} size={24} />
                </div>
            </div>
        </motion.div>
    );
}
