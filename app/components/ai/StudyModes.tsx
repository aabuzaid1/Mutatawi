'use client';

import { motion } from 'framer-motion';
import {
    IoSchoolOutline,
    IoListOutline,
    IoHelpCircleOutline,
    IoLayersOutline,
    IoDocumentTextOutline,
    IoEaselOutline,
    IoGridOutline,
    IoCloseOutline,
} from 'react-icons/io5';
import { StudyMode } from '@/app/types';

interface StudyModesProps {
    onSelectMode: (mode: StudyMode, prefix?: string) => void;
    activeMode?: StudyMode | null;
    onClearMode?: () => void;
    disabled: boolean;
    hasInput: boolean;
}

const modes = [
    {
        mode: 'explain' as StudyMode,
        label: 'اشرح',
        icon: IoSchoolOutline,
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        prefix: 'اشرح لي بالتفصيل',
    },
    {
        mode: 'summarize' as StudyMode,
        label: 'لخّص',
        icon: IoListOutline,
        color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        prefix: 'لخّص لي',
    },
    {
        mode: 'quiz' as StudyMode,
        label: 'اختبرني',
        icon: IoHelpCircleOutline,
        color: 'text-amber-600 bg-amber-50 border-amber-200',
        prefix: 'أنشئ اختبار عن',
    },
    {
        mode: 'flashcards' as StudyMode,
        label: 'بطاقات',
        icon: IoLayersOutline,
        color: 'text-pink-600 bg-pink-50 border-pink-200',
        prefix: 'أنشئ بطاقات مراجعة عن',
    },
    {
        mode: 'doc' as StudyMode,
        label: 'Docs',
        icon: IoDocumentTextOutline,
        color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
        prefix: 'أنشئ مستند عن',
    },
    {
        mode: 'slides' as StudyMode,
        label: 'Slides',
        icon: IoEaselOutline,
        color: 'text-orange-600 bg-orange-50 border-orange-200',
        prefix: 'أنشئ عرض تقديمي عن',
    },
    {
        mode: 'sheet' as StudyMode,
        label: 'Sheet',
        icon: IoGridOutline,
        color: 'text-green-600 bg-green-50 border-green-200',
        prefix: 'أنشئ جدول بيانات عن',
    },
];

export default function StudyModes({ onSelectMode, activeMode, onClearMode, disabled, hasInput }: StudyModesProps) {
    return (
        <div className="px-3 sm:px-6 py-2 overflow-x-auto">
            <div className="flex gap-1.5 sm:gap-2 min-w-max">
                {modes.map((m) => {
                    // If a mode is active and it's not this one, hide it
                    if (activeMode && activeMode !== m.mode) return null;

                    const Icon = m.icon;
                    const isActive = activeMode === m.mode;

                    return (
                        <motion.button
                            key={m.mode}
                            onClick={() => {
                                if (isActive && onClearMode) {
                                    onClearMode();
                                } else {
                                    onSelectMode(m.mode, m.prefix);
                                }
                            }}
                            disabled={disabled}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] sm:text-xs font-bold transition-all disabled:opacity-40 hover:shadow-sm ${
                                isActive ? `${m.color} ring-2 ring-offset-1` : 'text-slate-600 bg-white border-slate-200'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Icon size={14} />
                            {m.label}
                            {isActive && <div className="ml-1 pl-1 border-l border-current opacity-70"><IoCloseOutline size={14} /></div>}
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
