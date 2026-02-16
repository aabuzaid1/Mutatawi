'use client';

import { motion } from 'framer-motion';
import { IoPersonOutline, IoBusinessOutline } from 'react-icons/io5';
import { cn } from '@/app/lib/utils';

interface RoleSelectorProps {
    selectedRole: 'volunteer' | 'organization';
    onSelect: (role: 'volunteer' | 'organization') => void;
}

const roles = [
    {
        id: 'volunteer' as const,
        title: 'متطوع',
        description: 'أبحث عن فرص تطوعية للمشاركة في خدمة مجتمعي',
        icon: IoPersonOutline,
        emoji: '🙋‍♂️',
        color: 'from-primary-500 to-primary-600',
    },
    {
        id: 'organization' as const,
        title: 'منظمة',
        description: 'أريد نشر فرص تطوعية وإدارة المتطوعين في منظمتي',
        icon: IoBusinessOutline,
        emoji: '🏢',
        color: 'from-success-500 to-success-600',
    },
];

export default function RoleSelector({ selectedRole, onSelect }: RoleSelectorProps) {
    return (
        <div className="grid grid-cols-2 gap-4">
            {roles.map((role) => {
                const isSelected = selectedRole === role.id;
                return (
                    <motion.button
                        key={role.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelect(role.id)}
                        className={cn(
                            'relative p-6 rounded-2xl border-2 text-center transition-all duration-300',
                            isSelected
                                ? 'border-primary-500 bg-primary-50 shadow-glow'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-soft'
                        )}
                    >
                        {isSelected && (
                            <motion.div
                                layoutId="roleIndicator"
                                className="absolute top-3 left-3 w-6 h-6 rounded-full gradient-primary flex items-center justify-center"
                            >
                                <span className="text-white text-xs">✓</span>
                            </motion.div>
                        )}
                        <div className="text-4xl mb-3">{role.emoji}</div>
                        <h3 className={cn(
                            'font-bold mb-1',
                            isSelected ? 'text-primary-700' : 'text-slate-700'
                        )}>
                            {role.title}
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed">{role.description}</p>
                    </motion.button>
                );
            })}
        </div>
    );
}
