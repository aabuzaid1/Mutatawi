'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { IoSearchOutline, IoLocationOutline } from 'react-icons/io5';
import { cn } from '@/app/lib/utils';
import { OpportunityCategory } from '@/app/types';

interface FilterBarProps {
    onSearch: (search: string) => void;
    onCategoryChange: (category: OpportunityCategory | '') => void;
    onLocationChange: (location: string) => void;
}

const categories: (OpportunityCategory | '')[] = ['', 'تعليم', 'صحة', 'بيئة', 'مجتمع', 'تقنية', 'رياضة', 'ثقافة', 'إغاثة'];

export default function FilterBar({ onSearch, onCategoryChange, onLocationChange }: FilterBarProps) {
    const [activeCategory, setActiveCategory] = useState<OpportunityCategory | ''>('');

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6 mb-8"
        >
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <IoSearchOutline className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="ابحث عن فرص تطوعية..."
                        onChange={(e) => onSearch(e.target.value)}
                        className="input-field pr-12"
                    />
                </div>
                <div className="relative">
                    <IoLocationOutline className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="الموقع"
                        onChange={(e) => onLocationChange(e.target.value)}
                        className="input-field pr-12 sm:w-48"
                    />
                </div>
            </div>

            {/* Category Chips */}
            <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                    <motion.button
                        key={cat || 'all'}
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                        onClick={() => {
                            setActiveCategory(cat);
                            onCategoryChange(cat);
                        }}
                        className={cn(
                            'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                            activeCategory === cat
                                ? 'gradient-primary text-white shadow-sm'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:shadow-sm'
                        )}
                    >
                        {cat || 'الكل'}
                    </motion.button>
                ))}
            </div>
        </motion.div>
    );
}
