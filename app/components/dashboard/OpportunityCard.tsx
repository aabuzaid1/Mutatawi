'use client';

import { motion } from 'framer-motion';
import { IoLocationOutline, IoTimeOutline, IoCalendarOutline, IoPeopleOutline } from 'react-icons/io5';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { Opportunity } from '@/app/types';
import { categoryColors } from '@/app/lib/utils';

interface OpportunityCardProps {
    opportunity: Opportunity;
    onApply?: (id: string) => void;
    showApply?: boolean;
}

export default function OpportunityCard({ opportunity, onApply, showApply = true }: OpportunityCardProps) {
    const colors = categoryColors[opportunity.category] || categoryColors['مجتمع'];
    const spotsLeft = opportunity.spotsTotal - (opportunity.spotsFilled || 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{
                y: -6,
                boxShadow: '0 20px 50px -12px rgba(0, 0, 0, 0.1)',
                transition: { type: 'spring', stiffness: 300, damping: 20 }
            }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden group smooth-appear"
        >
            {/* Header */}
            <div className={`h-3 bg-gradient-to-l ${opportunity.status === 'open' ? 'from-success-500 to-success-400' :
                opportunity.status === 'closed' ? 'from-danger-500 to-danger-400' :
                    'from-slate-400 to-slate-300'
                }`} />

            <div className="p-6">
                {/* Category & Status */}
                <div className="flex items-center justify-between mb-4">
                    <Badge variant="info" size="sm">{opportunity.category}</Badge>
                    <Badge
                        variant={opportunity.status === 'open' ? 'success' : opportunity.status === 'closed' ? 'danger' : 'default'}
                        size="sm"
                    >
                        {opportunity.status === 'open' ? 'متاح' : opportunity.status === 'closed' ? 'مغلق' : 'مكتمل'}
                    </Badge>
                </div>

                {/* Title & Org */}
                <h3 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-primary-600 transition-colors duration-200">
                    {opportunity.title}
                </h3>
                <p className="text-sm text-slate-400 mb-4">{opportunity.organizationName}</p>

                {/* Description */}
                <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-2">
                    {opportunity.shortDescription}
                </p>

                {/* Meta */}
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-500 mb-4">
                    <div className="flex items-center gap-2">
                        <IoLocationOutline className="text-slate-400 flex-shrink-0" size={16} />
                        <span className="truncate">{opportunity.isRemote ? 'عن بُعد' : opportunity.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <IoCalendarOutline className="text-slate-400 flex-shrink-0" size={16} />
                        <span className="truncate">{opportunity.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <IoTimeOutline className="text-slate-400 flex-shrink-0" size={16} />
                        <span>{opportunity.duration} ساعات</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <IoPeopleOutline className="text-slate-400 flex-shrink-0" size={16} />
                        <span>{spotsLeft > 0 ? `${spotsLeft} مقعد متبقي` : 'ممتلئ'}</span>
                    </div>
                </div>

                {/* Skills */}
                {opportunity.skills && opportunity.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {opportunity.skills.slice(0, 3).map((skill) => (
                            <motion.span
                                key={skill}
                                className="px-2 py-1 rounded-lg bg-slate-50 text-xs text-slate-600"
                                whileHover={{ scale: 1.05, backgroundColor: 'rgb(238, 242, 255)' }}
                                transition={{ type: 'spring', stiffness: 400 }}
                            >
                                {skill}
                            </motion.span>
                        ))}
                        {opportunity.skills.length > 3 && (
                            <span className="px-2 py-1 rounded-lg bg-slate-50 text-xs text-slate-400">
                                +{opportunity.skills.length - 3}
                            </span>
                        )}
                    </div>
                )}

                {/* Apply Button */}
                {showApply && opportunity.status === 'open' && spotsLeft > 0 && (
                    <Button
                        variant="primary"
                        size="sm"
                        className="w-full"
                        onClick={() => onApply?.(opportunity.id)}
                    >
                        تقدّم الآن
                    </Button>
                )}
            </div>
        </motion.div>
    );
}
