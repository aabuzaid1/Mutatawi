'use client';

import { motion } from 'framer-motion';
import { IoSearchOutline } from 'react-icons/io5';

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
}

export default function EmptyState({
    title,
    description,
    icon,
    action,
}: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="flex flex-col items-center justify-center py-16 px-4 text-center"
        >
            <motion.div
                className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-6 text-slate-400"
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            >
                {icon || <IoSearchOutline size={32} />}
            </motion.div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">{title}</h3>
            <p className="text-slate-400 max-w-sm mb-6">{description}</p>
            {action}
        </motion.div>
    );
}
