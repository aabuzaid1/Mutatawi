'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    IoDocumentTextOutline,
    IoLocationOutline,
    IoCalendarOutline,
    IoTimeOutline,
    IoPeopleOutline,
} from 'react-icons/io5';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { OpportunityCategory } from '@/app/types';
import toast from 'react-hot-toast';

interface PostNeedFormProps {
    onSubmit: (data: any) => Promise<void>;
}

const categories: OpportunityCategory[] = ['تعليم', 'صحة', 'بيئة', 'مجتمع', 'تقنية', 'رياضة', 'ثقافة', 'إغاثة'];

export default function PostNeedForm({ onSubmit }: PostNeedFormProps) {
    const [formData, setFormData] = useState({
        title: '',
        shortDescription: '',
        description: '',
        category: 'مجتمع' as OpportunityCategory,
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
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await onSubmit({
                ...formData,
                skills: formData.skills.split('،').map((s) => s.trim()).filter(Boolean),
                requirements: formData.requirements.split('،').map((s) => s.trim()).filter(Boolean),
                benefits: formData.benefits.split('،').map((s) => s.trim()).filter(Boolean),
                spotsFilled: 0,
                status: 'open',
                featured: false,
            });
            toast.success('تم نشر الفرصة بنجاح! 🎉');
        } catch (error) {
            toast.error('حدث خطأ أثناء النشر');
        } finally {
            setLoading(false);
        }
    };

    const updateField = (field: string, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <IoDocumentTextOutline className="text-primary-500" />
                        المعلومات الأساسية
                    </h3>

                    <div className="space-y-4">
                        <Input
                            label="عنوان الفرصة"
                            placeholder="مثال: حملة تنظيف الحدائق العامة"
                            value={formData.title}
                            onChange={(e) => updateField('title', e.target.value)}
                            required
                        />

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">الوصف المختصر</label>
                            <textarea
                                placeholder="وصف مختصر يظهر في بطاقة الفرصة"
                                value={formData.shortDescription}
                                onChange={(e) => updateField('shortDescription', e.target.value)}
                                className="input-field min-h-[80px] resize-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">الوصف التفصيلي</label>
                            <textarea
                                placeholder="وصف تفصيلي للفرصة التطوعية والمهام المطلوبة"
                                value={formData.description}
                                onChange={(e) => updateField('description', e.target.value)}
                                className="input-field min-h-[120px] resize-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">التصنيف</label>
                            <select
                                value={formData.category}
                                onChange={(e) => updateField('category', e.target.value)}
                                className="input-field"
                            >
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Location & Time */}
                <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <IoLocationOutline className="text-primary-500" />
                        الموقع والوقت
                    </h3>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.isRemote}
                                    onChange={(e) => updateField('isRemote', e.target.checked)}
                                    className="rounded border-slate-300 text-primary-500"
                                />
                                <span className="text-sm text-slate-700">عن بُعد</span>
                            </label>
                        </div>

                        {!formData.isRemote && (
                            <Input
                                label="الموقع"
                                placeholder="مثال: عمّان - شارع الجامعة"
                                value={formData.location}
                                onChange={(e) => updateField('location', e.target.value)}
                                icon={<IoLocationOutline size={18} />}
                                required
                            />
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Input
                                label="التاريخ"
                                type="date"
                                value={formData.date}
                                onChange={(e) => updateField('date', e.target.value)}
                                icon={<IoCalendarOutline size={18} />}
                                required
                            />
                            <Input
                                label="وقت البداية"
                                type="time"
                                value={formData.startTime}
                                onChange={(e) => updateField('startTime', e.target.value)}
                                icon={<IoTimeOutline size={18} />}
                                required
                            />
                            <Input
                                label="وقت النهاية"
                                type="time"
                                value={formData.endTime}
                                onChange={(e) => updateField('endTime', e.target.value)}
                                icon={<IoTimeOutline size={18} />}
                                required
                            />
                        </div>

                        <Input
                            label="عدد المقاعد"
                            type="number"
                            min={1}
                            value={formData.spotsTotal}
                            onChange={(e) => updateField('spotsTotal', parseInt(e.target.value))}
                            icon={<IoPeopleOutline size={18} />}
                            required
                        />
                    </div>
                </div>

                {/* Skills & Requirements */}
                <div className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">المهارات والمتطلبات</h3>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                المهارات المطلوبة <span className="text-slate-400">(مفصولة بفاصلة)</span>
                            </label>
                            <input
                                placeholder="مثال: تعليم، تواصل، عمل جماعي"
                                value={formData.skills}
                                onChange={(e) => updateField('skills', e.target.value)}
                                className="input-field"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                المتطلبات <span className="text-slate-400">(مفصولة بفاصلة)</span>
                            </label>
                            <input
                                placeholder="مثال: العمر ١٨+، القدرة على الحركة"
                                value={formData.requirements}
                                onChange={(e) => updateField('requirements', e.target.value)}
                                className="input-field"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                المزايا <span className="text-slate-400">(مفصولة بفاصلة)</span>
                            </label>
                            <input
                                placeholder="مثال: شهادة تطوع، وجبات، مواصلات"
                                value={formData.benefits}
                                onChange={(e) => updateField('benefits', e.target.value)}
                                className="input-field"
                            />
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
                    نشر الفرصة التطوعية
                </Button>
            </form>
        </motion.div>
    );
}
