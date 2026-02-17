'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    IoLocationOutline,
    IoTimeOutline,
    IoSearchOutline,
    IoFilterOutline,
    IoCloseOutline,
    IoArrowBack,
    IoPeopleOutline,
    IoCalendarOutline,
    IoChevronDownOutline,
} from 'react-icons/io5';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import Badge from '@/app/components/ui/Badge';
import Button from '@/app/components/ui/Button';
import LoadingSpinner from '@/app/components/shared/LoadingSpinner';
import { useAuth } from '@/app/hooks/useAuth';
import { getOpportunities } from '@/app/lib/firestore';
import { Opportunity, OpportunityCategory } from '@/app/types';
import { categoryColors, formatDate } from '@/app/lib/utils';

const categories: OpportunityCategory[] = ['تعليم', 'صحة', 'بيئة', 'مجتمع', 'تقنية', 'رياضة', 'ثقافة', 'إغاثة'];

const categoryEmojis: Record<string, string> = {
    'تعليم': '📚',
    'صحة': '🏥',
    'بيئة': '🌿',
    'مجتمع': '🤝',
    'تقنية': '💻',
    'رياضة': '⚽',
    'ثقافة': '🎭',
    'إغاثة': '🆘',
};

const containerVariants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.08,
        },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.97 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.5,
            ease: [0.25, 0.46, 0.45, 0.94] as const,
        },
    },
};

export default function OpportunitiesPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        async function loadOpportunities() {
            try {
                const filters: any = { status: 'open' };
                if (selectedCategory) {
                    filters.category = selectedCategory;
                }
                const opps = await getOpportunities(filters);
                setOpportunities(opps);
            } catch (error) {
                console.error('Error loading opportunities:', error);
            } finally {
                setLoading(false);
            }
        }
        loadOpportunities();
    }, [selectedCategory]);

    const filteredOpportunities = opportunities.filter((opp) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            opp.title.toLowerCase().includes(query) ||
            opp.organizationName?.toLowerCase().includes(query) ||
            opp.location?.toLowerCase().includes(query) ||
            opp.description?.toLowerCase().includes(query)
        );
    });

    const handleApply = (oppId: string) => {
        if (!user) {
            router.push('/login');
            return;
        }
        // If logged in, could navigate to an apply page or open modal
        router.push(`/opportunities/${oppId}`);
    };

    return (
        <main className="min-h-screen bg-slate-50">
            <Navbar />

            {/* Hero Header */}
            <section className="relative pt-28 sm:pt-36 pb-8 sm:pb-12 overflow-hidden">
                <div className="absolute inset-0 gradient-mesh" />
                <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-primary-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-success-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-8"
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 border border-primary-100 text-primary-600 text-sm font-medium mb-4">
                            🌟 اكتشف الفرص المتاحة
                        </span>
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mb-4">
                            فرص <span className="text-gradient">التطوع</span> المتاحة
                        </h1>
                        <p className="text-base sm:text-lg text-slate-500 max-w-2xl mx-auto">
                            اكتشف فرصاً تطوعية تناسب مهاراتك واهتماماتك وساهم في بناء مجتمع أفضل
                        </p>
                    </motion.div>

                    {/* Search Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="max-w-2xl mx-auto"
                    >
                        <div className="relative">
                            <IoSearchOutline className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="ابحث عن فرصة تطوعية..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pr-12 pl-14 py-4 rounded-2xl bg-white border border-slate-200 shadow-soft focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none text-right text-sm sm:text-base transition-all"
                            />
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${showFilters || selectedCategory
                                    ? 'bg-primary-50 text-primary-600'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                            >
                                <IoFilterOutline size={18} />
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Filters */}
            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
                            <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-4 sm:p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-slate-700 text-sm sm:text-base">تصفية حسب التصنيف</h3>
                                    {selectedCategory && (
                                        <button
                                            onClick={() => setSelectedCategory('')}
                                            className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                                        >
                                            <IoCloseOutline size={14} />
                                            مسح الفلتر
                                        </button>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {categories.map((cat) => (
                                        <button
                                            key={cat}
                                            onClick={() => {
                                                setSelectedCategory(selectedCategory === cat ? '' : cat);
                                                setLoading(true);
                                            }}
                                            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${selectedCategory === cat
                                                ? 'bg-primary-600 text-white shadow-md'
                                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                                                }`}
                                        >
                                            <span>{categoryEmojis[cat]}</span>
                                            <span>{cat}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Category Pills (always visible on mobile) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <button
                        onClick={() => { setSelectedCategory(''); setLoading(true); }}
                        className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${!selectedCategory
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-primary-300'
                            }`}
                    >
                        الكل
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => { setSelectedCategory(selectedCategory === cat ? '' : cat); setLoading(true); }}
                            className={`flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === cat
                                ? 'bg-primary-600 text-white shadow-sm'
                                : 'bg-white text-slate-600 border border-slate-200 hover:border-primary-300'
                                }`}
                        >
                            <span>{categoryEmojis[cat]}</span>
                            <span>{cat}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Results */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
                {/* Results Count */}
                <div className="flex items-center justify-between mb-6">
                    <p className="text-sm text-slate-500">
                        {loading ? 'جارٍ البحث...' : `${filteredOpportunities.length} فرصة متاحة`}
                    </p>
                    {selectedCategory && (
                        <Badge variant="info" size="sm">
                            {categoryEmojis[selectedCategory]} {selectedCategory}
                        </Badge>
                    )}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <LoadingSpinner size="lg" />
                    </div>
                ) : filteredOpportunities.length > 0 ? (
                    <motion.div
                        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {filteredOpportunities.map((opp) => {
                            const colors = categoryColors[opp.category] || categoryColors['مجتمع'];
                            const emoji = categoryEmojis[opp.category] || '🤝';
                            const spotsLeft = opp.spotsTotal - (opp.spotsFilled || 0);
                            const fillPercentage = ((opp.spotsFilled || 0) / opp.spotsTotal) * 100;

                            return (
                                <motion.div
                                    key={opp.id}
                                    variants={cardVariants}
                                    whileHover={{
                                        y: -6,
                                        boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.12)',
                                        transition: { type: 'spring', stiffness: 300, damping: 20 }
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                    className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden group cursor-pointer"
                                    onClick={() => handleApply(opp.id)}
                                >
                                    {/* Image/Emoji Area */}
                                    <div className={`h-36 sm:h-40 ${opp.imageUrl ? '' : colors.bg} flex items-center justify-center relative overflow-hidden`}>
                                        {opp.imageUrl ? (
                                            <img
                                                src={opp.imageUrl}
                                                alt={opp.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <motion.span
                                                className="text-5xl sm:text-6xl"
                                                whileHover={{ scale: 1.2, rotate: -5 }}
                                                transition={{ type: 'spring', stiffness: 250 }}
                                            >
                                                {emoji}
                                            </motion.span>
                                        )}
                                        <div className="absolute top-3 right-3">
                                            <Badge variant="info" size="sm">{opp.category}</Badge>
                                        </div>
                                        {opp.isRemote && (
                                            <div className="absolute top-3 left-3">
                                                <Badge variant="success" size="sm">عن بُعد</Badge>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-4 sm:p-5">
                                        <h3 className="font-bold text-slate-800 mb-1.5 line-clamp-2 group-hover:text-primary-600 transition-colors duration-300 text-sm sm:text-base">
                                            {opp.title}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-slate-400 mb-3">
                                            {opp.organizationName}
                                        </p>

                                        {opp.shortDescription && (
                                            <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">
                                                {opp.shortDescription}
                                            </p>
                                        )}

                                        <div className="space-y-1.5 text-xs sm:text-sm text-slate-500 mb-3">
                                            <div className="flex items-center gap-2">
                                                <IoLocationOutline className="text-slate-400 flex-shrink-0" size={14} />
                                                <span className="truncate">{opp.location}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <IoCalendarOutline className="text-slate-400 flex-shrink-0" size={14} />
                                                <span className="truncate">{opp.date}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <IoTimeOutline className="text-slate-400 flex-shrink-0" size={14} />
                                                <span>{opp.duration} ساعات</span>
                                            </div>
                                        </div>

                                        {/* Progress */}
                                        <div className="mb-3">
                                            <div className="flex items-center justify-between text-xs mb-1.5">
                                                <span className="text-slate-500 flex items-center gap-1">
                                                    <IoPeopleOutline size={13} />
                                                    {opp.spotsFilled || 0}/{opp.spotsTotal}
                                                </span>
                                                <span className={`font-medium ${spotsLeft <= 3 ? 'text-danger-600' : 'text-success-600'}`}>
                                                    {spotsLeft > 0 ? `${spotsLeft} متبقي` : 'ممتلئ'}
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(fillPercentage, 100)}%` }}
                                                    transition={{ duration: 1, delay: 0.3 }}
                                                    className="h-full gradient-primary rounded-full"
                                                />
                                            </div>
                                        </div>

                                        {/* Action */}
                                        <div className="pt-3 border-t border-slate-50">
                                            <Button
                                                variant="primary"
                                                size="sm"
                                                className="w-full"
                                                icon={<IoArrowBack size={14} />}
                                                onClick={(e: React.MouseEvent) => {
                                                    e.stopPropagation();
                                                    handleApply(opp.id);
                                                }}
                                            >
                                                {user ? 'تقدم الآن' : 'سجّل للتقديم'}
                                            </Button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                ) : (
                    /* Empty State */
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-16 sm:py-20"
                    >
                        <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <IoSearchOutline size={36} className="text-slate-400" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-700 mb-2">لا توجد فرص متاحة حالياً</h3>
                        <p className="text-slate-400 mb-6 max-w-md mx-auto text-sm sm:text-base">
                            {searchQuery || selectedCategory
                                ? 'جرّب تغيير معايير البحث أو إزالة الفلاتر'
                                : 'سيتم إضافة فرص تطوعية جديدة قريباً. تابعنا!'}
                        </p>
                        {(searchQuery || selectedCategory) && (
                            <Button
                                variant="outline"
                                onClick={() => { setSearchQuery(''); setSelectedCategory(''); setLoading(true); }}
                            >
                                مسح البحث والفلاتر
                            </Button>
                        )}
                    </motion.div>
                )}
            </section>

            <Footer />
        </main>
    );
}
