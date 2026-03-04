'use client';

import { motion } from 'framer-motion';
import { IoCheckmarkCircleOutline, IoCloseCircleOutline, IoMailOutline, IoCallOutline, IoDocumentTextOutline } from 'react-icons/io5';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { Application } from '@/app/types';
import { getInitials, formatRelativeTime } from '@/app/lib/utils';

interface ApplicationBoardProps {
    applications: Application[];
    onAccept: (id: string) => void;
    onReject: (id: string) => void;
}

export default function ApplicationBoard({ applications, onAccept, onReject }: ApplicationBoardProps) {
    return (
        <div className="space-y-4">
            {applications.map((app, index) => (
                <motion.div
                    key={app.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, type: 'spring', stiffness: 200, damping: 20 }}
                    whileHover={{
                        y: -2,
                        boxShadow: '0 12px 40px -10px rgba(0, 0, 0, 0.1)',
                        transition: { type: 'spring', stiffness: 300, damping: 20 }
                    }}
                    className="bg-white rounded-2xl shadow-soft border border-slate-100 p-4 sm:p-6 transition-colors duration-200 cursor-default"
                >
                    {/* Top Row: Avatar + Name + Status */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                            <motion.div
                                className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl gradient-primary flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0"
                                whileHover={{ scale: 1.1, rotate: -5 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                            >
                                {getInitials(app.volunteerName)}
                            </motion.div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-slate-800 text-sm sm:text-base truncate">{app.volunteerName}</h3>
                                <p className="text-xs sm:text-sm text-slate-400 truncate">{app.opportunityTitle}</p>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <Badge
                            variant={
                                app.status === 'accepted' ? 'success' :
                                    app.status === 'rejected' ? 'danger' : 'warning'
                            }
                        >
                            {app.status === 'accepted' ? 'مقبول' :
                                app.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                        </Badge>
                    </div>

                    {/* Contact Info - Mobile-friendly stacked layout */}
                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <a
                            href={`mailto:${app.volunteerEmail}`}
                            className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 hover:text-primary-600 transition-colors"
                        >
                            <IoMailOutline size={15} className="flex-shrink-0" />
                            <span className="truncate" dir="ltr">{app.volunteerEmail}</span>
                        </a>
                        {app.volunteerPhone && (
                            <a
                                href={`tel:${app.volunteerPhone}`}
                                className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 hover:text-primary-600 transition-colors"
                            >
                                <IoCallOutline size={15} className="flex-shrink-0" />
                                <span dir="ltr">{app.volunteerPhone}</span>
                            </a>
                        )}
                    </div>

                    {/* Message / CV Section */}
                    {app.message && (
                        <motion.div
                            className="mt-4 p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-100"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.05 + 0.2 }}
                        >
                            <div className="flex items-center gap-1.5 mb-2">
                                <IoDocumentTextOutline size={14} className="text-slate-400" />
                                <span className="text-xs font-semibold text-slate-400">السيرة الذاتية / الرسالة</span>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{app.message}</p>
                        </motion.div>
                    )}

                    {/* Actions */}
                    {app.status === 'pending' && (
                        <motion.div
                            className="flex gap-2 sm:gap-3 mt-4"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 + 0.3 }}
                        >
                            <Button
                                variant="primary"
                                size="sm"
                                icon={<IoCheckmarkCircleOutline />}
                                onClick={() => onAccept(app.id)}
                            >
                                قبول
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                icon={<IoCloseCircleOutline />}
                                onClick={() => onReject(app.id)}
                            >
                                رفض
                            </Button>
                        </motion.div>
                    )}

                    {/* Timestamp */}
                    <p className="text-xs text-slate-400 mt-3">
                        {formatRelativeTime(app.appliedAt)}
                    </p>
                </motion.div>
            ))}
        </div>
    );
}
