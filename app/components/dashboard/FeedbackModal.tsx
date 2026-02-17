'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoStarSharp, IoStarOutline, IoCloseOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';
import Button from '../ui/Button';
import { createFeedback } from '@/app/lib/firestore';
import toast from 'react-hot-toast';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    opportunityId: string;
    opportunityTitle: string;
    volunteerId: string;
    volunteerName: string;
}

export default function FeedbackModal({
    isOpen,
    onClose,
    opportunityId,
    opportunityTitle,
    volunteerId,
    volunteerName,
}: FeedbackModalProps) {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error('يرجى اختيار تقييم');
            return;
        }
        if (!comment.trim()) {
            toast.error('يرجى كتابة تعليق');
            return;
        }

        setLoading(true);
        try {
            await createFeedback({
                opportunityId,
                opportunityTitle,
                volunteerId,
                volunteerName,
                rating,
                comment: comment.trim(),
            });
            setSubmitted(true);
            toast.success('شكراً لتقييمك! 🎉');
        } catch (error: any) {
            if (error.message?.includes('مسبقاً')) {
                toast.error('لقد أرسلت تقييمك لهذه الفرصة مسبقاً');
            } else {
                toast.error('حدث خطأ. يرجى المحاولة مرة أخرى');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setRating(0);
        setHoveredRating(0);
        setComment('');
        setSubmitted(false);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-md mx-4 z-10"
                    >
                        {/* Close button */}
                        <button
                            onClick={handleClose}
                            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                        >
                            <IoCloseOutline size={20} className="text-slate-500" />
                        </button>

                        <AnimatePresence mode="wait">
                            {!submitted ? (
                                <motion.form
                                    key="form"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    onSubmit={handleSubmit}
                                    className="space-y-5"
                                >
                                    <div className="text-center">
                                        <h2 className="text-xl font-black text-slate-900 mb-1">قيّم تجربتك</h2>
                                        <p className="text-sm text-slate-500">
                                            {opportunityTitle}
                                        </p>
                                    </div>

                                    {/* Star Rating */}
                                    <div className="flex justify-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <motion.button
                                                key={star}
                                                type="button"
                                                onClick={() => setRating(star)}
                                                onMouseEnter={() => setHoveredRating(star)}
                                                onMouseLeave={() => setHoveredRating(0)}
                                                whileHover={{ scale: 1.2 }}
                                                whileTap={{ scale: 0.9 }}
                                                className="focus:outline-none"
                                            >
                                                {star <= (hoveredRating || rating) ? (
                                                    <IoStarSharp className="text-amber-400" size={36} />
                                                ) : (
                                                    <IoStarOutline className="text-slate-300" size={36} />
                                                )}
                                            </motion.button>
                                        ))}
                                    </div>
                                    <p className="text-center text-sm text-slate-400">
                                        {rating === 0 && 'اختر تقييمك'}
                                        {rating === 1 && 'سيء 😞'}
                                        {rating === 2 && 'مقبول 😐'}
                                        {rating === 3 && 'جيد 🙂'}
                                        {rating === 4 && 'ممتاز 😊'}
                                        {rating === 5 && 'رائع! 🤩'}
                                    </p>

                                    {/* Comment */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">
                                            شاركنا تجربتك
                                        </label>
                                        <textarea
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            placeholder="اكتب عن تجربتك في هذه الفرصة التطوعية..."
                                            rows={4}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none resize-none text-sm"
                                            required
                                        />
                                    </div>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="w-full"
                                        loading={loading}
                                    >
                                        إرسال التقييم
                                    </Button>
                                </motion.form>
                            ) : (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-6 space-y-4"
                                >
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
                                    >
                                        <IoCheckmarkCircleOutline className="text-success-500 mx-auto" size={64} />
                                    </motion.div>
                                    <h2 className="text-xl font-black text-slate-900">شكراً لك! 🎉</h2>
                                    <p className="text-sm text-slate-500">
                                        تقييمك يساعد المتطوعين الآخرين في اختيار الفرص المناسبة
                                    </p>
                                    <Button variant="outline" onClick={handleClose}>
                                        إغلاق
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
