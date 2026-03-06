'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoStarSharp, IoStarOutline, IoCloseOutline, IoCheckmarkCircleOutline } from 'react-icons/io5';
import Button from '../ui/Button';
import { createFeedback, getFeedbackByVolunteerAndOpp, updateFeedback } from '@/app/lib/firestore';
import { storage } from '@/app/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import toast from 'react-hot-toast';

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    opportunityId: string;
    opportunityTitle: string;
    volunteerId: string;
    volunteerName: string;
    volunteerAvatar?: string;
}

export default function FeedbackModal({
    isOpen,
    onClose,
    opportunityId,
    opportunityTitle,
    volunteerId,
    volunteerName,
    volunteerAvatar,
}: FeedbackModalProps) {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState('');
    const [existingFeedbackId, setExistingFeedbackId] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [submitted, setSubmitted] = useState(false);

    // Load existing feedback if any
    useEffect(() => {
        let mounted = true;
        async function loadExisting() {
            if (!isOpen || !opportunityId || !volunteerId) return;
            setInitializing(true);
            try {
                const existing = await getFeedbackByVolunteerAndOpp(opportunityId, volunteerId);
                if (existing && mounted) {
                    setExistingFeedbackId(existing.id);
                    setRating(existing.rating);
                    setComment(existing.comment);
                    if (existing.imageUrl) setImagePreview(existing.imageUrl);
                } else if (mounted) {
                    // Reset if no existing feedback is found for this new opportunity
                    setExistingFeedbackId(null);
                    setRating(0);
                    setComment('');
                    setImagePreview('');
                    setImageFile(null);
                }
            } catch (error) {
                console.error("Error loading existing feedback:", error);
            } finally {
                if (mounted) setInitializing(false);
            }
        }
        loadExisting();
        return () => { mounted = false; };
    }, [isOpen, opportunityId, volunteerId]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error('حجم الصورة الكبرى هو 5 ميجابايت');
            return;
        }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    };

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
            let photoUrl = imagePreview; // Use existing URL by default if no new file is uploaded

            if (imageFile) {
                const storageRef = ref(storage, `feedbacks/${opportunityId}_${volunteerId}_${Date.now()}`);
                await uploadBytes(storageRef, imageFile);
                photoUrl = await getDownloadURL(storageRef);
            }

            if (existingFeedbackId) {
                await updateFeedback(existingFeedbackId, {
                    rating,
                    comment: comment.trim(),
                    imageUrl: photoUrl || undefined,
                });
                setSubmitted(true);
                toast.success('تم تحديث التقييم بنجاح! 🎉');
            } else {
                await createFeedback({
                    opportunityId,
                    opportunityTitle,
                    volunteerId,
                    volunteerName,
                    volunteerAvatar,
                    rating,
                    comment: comment.trim(),
                    imageUrl: photoUrl || undefined,
                });
                setSubmitted(true);
                toast.success('شكراً لتقييمك! 🎉');
            }
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
        setImageFile(null);
        setImagePreview('');
        setExistingFeedbackId(null);
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

                                    {/* Additional Photo */}
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">
                                            إضافة صورة (اختياري)
                                        </label>
                                        <div className="relative border-2 border-dashed border-slate-200 rounded-xl hover:border-primary-400 transition-colors bg-slate-50 flex items-center justify-center p-4 min-h-[120px] overflow-hidden group">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            />
                                            {imagePreview ? (
                                                <>
                                                    <img src={imagePreview} alt="Feedback preview" className="absolute inset-0 w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                                        <p className="text-white text-sm font-bold">تغيير الصورة</p>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center">
                                                    <span className="text-3xl mb-1 block">📸</span>
                                                    <p className="text-sm text-slate-500 font-medium">اختر صورة أو اسحبها هنا</p>
                                                    <p className="text-xs text-slate-400 mt-1">PNG, JPG حتى 5 ميجابايت</p>
                                                </div>
                                            )}
                                        </div>
                                        {imagePreview && (
                                            <button
                                                type="button"
                                                onClick={() => { setImageFile(null); setImagePreview(''); }}
                                                className="text-xs text-danger-500 hover:text-danger-600 font-bold mt-2"
                                            >
                                                إزالة الصورة
                                            </button>
                                        )}
                                    </div>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        className="w-full"
                                        loading={loading}
                                    >
                                        {existingFeedbackId ? 'تحديث التقييم' : 'إرسال التقييم'}
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
