'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    IoDocumentTextOutline,
    IoLocationOutline,
    IoTimeOutline,
    IoCalendarOutline,
    IoPeopleOutline,
    IoImageOutline,
    IoCloseCircleOutline,
} from 'react-icons/io5';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/app/lib/firebase';
import toast from 'react-hot-toast';

interface PostNeedFormProps {
    onSubmit: (data: any) => Promise<void>;
}

const categories = [
    'تعليم', 'صحة', 'بيئة', 'مجتمع', 'تقنية', 'رياضة', 'ثقافة', 'إغاثة'
];

export default function PostNeedForm({ onSubmit }: PostNeedFormProps) {
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        shortDescription: '',
        category: 'مجتمع',
        location: '',
        isRemote: false,
        date: '',
        startTime: '',
        endTime: '',
        duration: 0,
        spotsTotal: 10,
        skills: '',
        requirements: '',
        benefits: '',
    });

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let imageUrl = '';

            // Upload image if provided
            if (imageFile) {
                try {
                    toast.loading('جار رفع الصورة...', { id: 'upload' });
                    const storageRef = ref(storage, `opportunities/${Date.now()}_${imageFile.name}`);
                    const snapshot = await uploadBytes(storageRef, imageFile);
                    imageUrl = await getDownloadURL(snapshot.ref);
                    toast.dismiss('upload');
                } catch (uploadError: any) {
                    toast.dismiss('upload');
                    console.error('Image upload error:', uploadError);
                    toast.error('فشل رفع الصورة. سيتم نشر الفرصة بدون صورة.');
                    // Continue without image
                }
            }

            const data = {
                ...formData,
                imageUrl,
                duration: Number(formData.duration),
                spotsTotal: Number(formData.spotsTotal),
                skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
                requirements: formData.requirements.split(',').map(s => s.trim()).filter(Boolean),
                benefits: formData.benefits.split(',').map(s => s.trim()).filter(Boolean),
            };

            await onSubmit(data);
        } catch (error: any) {
            console.error('Error submitting form:', error);
            toast.error(`خطأ: ${error?.message || 'حدث خطأ غير متوقع'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-soft border border-slate-100 p-5 sm:p-8 space-y-6"
        >
            {/* Image Upload */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">
                    صورة الفرصة
                </label>
                {imagePreview ? (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200">
                        <img
                            src={imagePreview}
                            alt="معاينة الصورة"
                            className="w-full h-48 sm:h-56 object-cover"
                        />
                        <button
                            type="button"
                            onClick={removeImage}
                            className="absolute top-3 left-3 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                        >
                            <IoCloseCircleOutline size={20} />
                        </button>
                    </div>
                ) : (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-all duration-300 group">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <motion.div
                                whileHover={{ scale: 1.1 }}
                                className="w-14 h-14 rounded-full bg-primary-50 flex items-center justify-center mb-3 group-hover:bg-primary-100 transition-colors"
                            >
                                <IoImageOutline className="text-primary-500" size={28} />
                            </motion.div>
                            <p className="text-sm text-slate-500 font-medium">
                                اضغط لرفع صورة للفرصة
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                                PNG, JPG, WEBP (بحد أقصى 5 ميجابايت)
                            </p>
                        </div>
                        <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            onChange={handleImageChange}
                            className="hidden"
                        />
                    </label>
                )}
            </div>

            {/* Title */}
            <Input
                label="عنوان الفرصة"
                name="title"
                placeholder="مثال: حملة تنظيف الحديقة العامة"
                value={formData.title}
                onChange={handleChange}
                icon={<IoDocumentTextOutline size={18} />}
                required
            />

            {/* Short Description */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                    وصف مختصر
                </label>
                <textarea
                    name="shortDescription"
                    placeholder="وصف مختصر للفرصة (جملة أو جملتين)"
                    value={formData.shortDescription}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none resize-none text-sm"
                    required
                />
            </div>

            {/* Full Description */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                    الوصف الكامل
                </label>
                <textarea
                    name="description"
                    placeholder="وصف تفصيلي عن الفرصة التطوعية..."
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none resize-none text-sm"
                    required
                />
            </div>

            {/* Category */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                    التصنيف
                </label>
                <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none bg-white text-sm"
                >
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            {/* Location & Remote */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                    label="الموقع"
                    name="location"
                    placeholder="مثال: عمّان"
                    value={formData.location}
                    onChange={handleChange}
                    icon={<IoLocationOutline size={18} />}
                    required
                />
                <div className="flex items-end pb-1">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            name="isRemote"
                            checked={formData.isRemote}
                            onChange={handleChange}
                            className="w-5 h-5 rounded border-slate-300 text-primary-500"
                        />
                        <span className="text-sm text-slate-700 font-medium">عن بُعد</span>
                    </label>
                </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                    label="التاريخ"
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    icon={<IoCalendarOutline size={18} />}
                    required
                />
                <Input
                    label="وقت البداية"
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    icon={<IoTimeOutline size={18} />}
                    required
                />
                <Input
                    label="وقت النهاية"
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    icon={<IoTimeOutline size={18} />}
                    required
                />
            </div>

            {/* Duration & Spots */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                    label="المدة (بالساعات)"
                    type="number"
                    name="duration"
                    placeholder="3"
                    value={String(formData.duration)}
                    onChange={handleChange}
                    icon={<IoTimeOutline size={18} />}
                    required
                />
                <Input
                    label="عدد المقاعد"
                    type="number"
                    name="spotsTotal"
                    placeholder="10"
                    value={String(formData.spotsTotal)}
                    onChange={handleChange}
                    icon={<IoPeopleOutline size={18} />}
                    required
                />
            </div>

            {/* Skills */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                    المهارات المطلوبة (مفصولة بفاصلة)
                </label>
                <input
                    name="skills"
                    placeholder="مثال: تواصل, عمل جماعي, قيادة"
                    value={formData.skills}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none text-sm"
                />
            </div>

            {/* Requirements */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                    المتطلبات (مفصولة بفاصلة)
                </label>
                <input
                    name="requirements"
                    placeholder="مثال: العمر 18+, التزام بالمواعيد"
                    value={formData.requirements}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none text-sm"
                />
            </div>

            {/* Benefits */}
            <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                    المميزات (مفصولة بفاصلة)
                </label>
                <input
                    name="benefits"
                    placeholder="مثال: شهادة مشاركة, خبرة عملية"
                    value={formData.benefits}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all outline-none text-sm"
                />
            </div>

            {/* Submit */}
            <Button type="submit" variant="primary" className="w-full" loading={loading}>
                نشر الفرصة التطوعية
            </Button>
        </motion.form>
    );
}
