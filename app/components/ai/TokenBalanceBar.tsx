'use client';

import { motion } from 'framer-motion';
import { IoFlashOutline, IoTrendingUpOutline } from 'react-icons/io5';
import Link from 'next/link';

interface TokenBalanceBarProps {
    balance: number;
    dailyRequests: number;
    maxDaily: number;
}

export default function TokenBalanceBar({ balance, dailyRequests, maxDaily }: TokenBalanceBarProps) {
    const maxTokens = 25000;
    const percentage = Math.min((balance / maxTokens) * 100, 100);
    const isLow = balance < 1000;
    const dailyPercentage = (dailyRequests / maxDaily) * 100;

    const barColor = isLow
        ? 'bg-gradient-to-l from-red-500 to-red-400'
        : percentage > 50
            ? 'bg-gradient-to-l from-emerald-500 to-teal-400'
            : 'bg-gradient-to-l from-amber-500 to-yellow-400';

    return (
        <div className="sticky top-16 sm:top-20 z-30 bg-white/90 backdrop-blur border-b border-slate-100">
            <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3 sm:gap-5">
                {/* Token Balance */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isLow ? 'bg-red-100' : 'bg-emerald-100'}`}>
                        <IoFlashOutline size={16} className={isLow ? 'text-red-600' : 'text-emerald-600'} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[11px] font-bold text-slate-600">
                                {balance.toLocaleString('ar-SA')} توكن
                            </span>
                            <span className="text-[10px] text-slate-400 hidden sm:inline">
                                {Math.round(percentage)}%
                            </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                                className={`h-full rounded-full ${barColor}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${percentage}%` }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Daily Requests */}
                <div className="hidden sm:flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                        <IoTrendingUpOutline size={16} className="text-blue-600" />
                    </div>
                    <div className="text-[11px]">
                        <span className="font-bold text-slate-700">{dailyRequests}/{maxDaily}</span>
                        <span className="text-slate-400 mr-1">طلب يومي</span>
                    </div>
                </div>

                {/* Earn More Button */}
                {isLow && (
                    <Link href="/opportunities" className="flex-shrink-0">
                        <motion.span
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            اكسب المزيد
                        </motion.span>
                    </Link>
                )}
            </div>
        </div>
    );
}
