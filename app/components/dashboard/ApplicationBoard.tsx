'use client';

import { motion } from 'framer-motion';
import { IoCheckmarkCircleOutline, IoCloseCircleOutline, IoMailOutline, IoCallOutline } from 'react-icons/io5';
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
                    className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6 transition-colors duration-200 cursor-default"
                >
                    <div className="flex items-start justify-between">
                        {/* Applicant Info */}
                        <div className="flex items-start gap-4">
                            <motion.div
                                className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-white font-bold"
                                whileHover={{ scale: 1.1, rotate: -5 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                            >
                                {getInitials(app.volunteerName)}
                            </motion.div>
                            <div>
                                <h3 className="font-bold text-slate-800">{app.volunteerName}</h3>
                                <p className="text-sm text-slate-400">{app.opportunityTitle}</p>
                                <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <IoMailOutline size={14} />
                                        {app.volunteerEmail}
                                    </span>
                                    {app.volunteerPhone && (
                                        <span className="flex items-center gap-1">
                                            <IoCallOutline size={14} />
                                            {app.volunteerPhone}
                                        </span>
                                    )}
                                </div>
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

                    {/* Message */}
                    {app.message && (
                        <motion.div
                            className="mt-4 p-4 bg-slate-50 rounded-xl"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.05 + 0.2 }}
                        >
                            <p className="text-sm text-slate-600 leading-relaxed">{app.message}</p>
                        </motion.div>
                    )}

                    {/* Actions */}
                    {app.status === 'pending' && (
                        <motion.div
                            className="flex gap-3 mt-4"
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
