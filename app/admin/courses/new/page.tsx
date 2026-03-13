'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    IoArrowBackOutline,
    IoAddOutline,
    IoTrashOutline,
    IoSaveOutline,
    IoRocketOutline,
    IoVideocamOutline,
    IoDocumentTextOutline,
    IoChevronUpOutline,
    IoChevronDownOutline,
} from 'react-icons/io5';
import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';
import { isAdmin, loadAdminEmails } from '@/app/lib/adminConfig';
import { createCourse } from '@/app/lib/firestore';
import { Lesson, CourseCategory } from '@/app/types';
import Navbar from '@/app/components/layout/Navbar';
import LoadingSpinner from '@/app/components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

const categories: { label: string; value: CourseCategory }[] = [
    { label: '💻 تقنية', value: 'تقنية' },
    { label: '🎯 قيادة', value: 'قيادة' },
    { label: '🗣️ تواصل', value: 'تواصل' },
    { label: '🩺 إسعافات', value: 'إسعافات' },
    { label: '🌱 تطوير ذات', value: 'تطوير ذات' },
    { label: '📚 أخرى', value: 'أخرى' },
];

const levels = [
    { label: 'بدون مستوى', value: '' },
    { label: 'مبتدئ', value: 'مبتدئ' },
    { label: 'متوسط', value: 'متوسط' },
    { label: 'متقدم', value: 'متقدم' },
];

interface LessonForm {
    title: string;
    type: 'video' | 'activity';
    youtubeVideoId: string;
    activityImageUrl: string;
    duration: string;
    section: string;
}

const emptyLesson: LessonForm = {
    title: '',
    type: 'video',
    youtubeVideoId: '',
    activityImageUrl: '',
    duration: '',
    section: '',
};

export default function NewCoursePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        if (authLoading || !user) { if (!authLoading) setAuthChecked(true); return; }
        loadAdminEmails().then(() => { setAuthorized(isAdmin(user?.email)); setAuthChecked(true); });
    }, [user, authLoading]);

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<CourseCategory>('تقنية');
    const [level, setLevel] = useState<string>('');
    const [thumbnail, setThumbnail] = useState('');
    const [totalDuration, setTotalDuration] = useState('');
    const [lessons, setLessons] = useState<LessonForm[]>([{ ...emptyLesson }]);
    const [saving, setSaving] = useState(false);

    const addLesson = () => {
        const lastSection = lessons.length > 0 ? lessons[lessons.length - 1].section : '';
        setLessons([...lessons, { ...emptyLesson, section: lastSection }]);
    };

    const removeLesson = (index: number) => {
        setLessons(lessons.filter((_, i) => i !== index));
    };

    const updateLesson = (index: number, field: keyof LessonForm, value: string) => {
        const updated = [...lessons];
        updated[index] = { ...updated[index], [field]: value };
        setLessons(updated);
    };

    const moveLesson = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= lessons.length) return;
        const updated = [...lessons];
        [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
        setLessons(updated);
    };

    const handleSave = async (publish: boolean) => {
        if (!title.trim()) { toast.error('أدخل عنوان الكورس'); return; }
        if (!description.trim()) { toast.error('أدخل وصف الكورس'); return; }
        if (lessons.length === 0) { toast.error('أضف درس واحد على الأقل'); return; }
        
        const validLessons = lessons.filter(l => l.title.trim());
        if (validLessons.length === 0) { toast.error('أضف عنوان لدرس واحد على الأقل'); return; }

        setSaving(true);
        try {
            const courseLessons: Lesson[] = validLessons.map((l, i) => ({
                title: l.title,
                type: l.type,
                ...(l.type === 'video' ? { youtubeVideoId: l.youtubeVideoId } : { activityImageUrl: l.activityImageUrl }),
                duration: l.duration || '0:00',
                order: i + 1,
                section: l.section || undefined,
            }));

            await createCourse({
                title,
                description,
                category,
                thumbnail,
                totalLessons: courseLessons.length,
                totalDuration: totalDuration || calculateTotalDuration(courseLessons),
                level: level as any,
                lessons: courseLessons,
                status: publish ? 'published' : 'draft',
            });

            toast.success(publish ? 'تم نشر الكورس بنجاح! 🎉' : 'تم حفظ المسودة ✅');
            router.push('/admin/courses');
        } catch (error) {
            console.error('Error creating course:', error);
            toast.error('حدث خطأ في الحفظ');
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || !authChecked) {
        return (
            <>
                <Navbar />
                <div className="flex items-center justify-center min-h-screen">
                    <LoadingSpinner size="lg" />
                </div>
            </>
        );
    }

    if (!user || !authorized) {
        return (
            <>
                <Navbar />
                <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                    <p className="text-red-500 font-bold">غير مصرح بالوصول</p>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-slate-50 pt-24 pb-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <Link href="/admin/courses" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-primary-600 font-medium mb-2 transition-colors">
                                <IoArrowBackOutline size={16} />
                                العودة للوحة الإدارة
                            </Link>
                            <h1 className="text-2xl font-black text-slate-900">إضافة كورس جديد</h1>
                        </div>
                    </div>

                    {/* Course Info Form */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-800 mb-5">معلومات الكورس</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">عنوان الكورس *</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="مثال: Google Workspace - Google"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1.5">وصف الكورس *</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="وصف مختصر عن محتوى الكورس..."
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm resize-none"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1.5">التصنيف</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value as CourseCategory)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm bg-white"
                                    >
                                        {categories.map(c => (
                                            <option key={c.value} value={c.value}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1.5">المستوى</label>
                                    <select
                                        value={level}
                                        onChange={(e) => setLevel(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm bg-white"
                                    >
                                        {levels.map(l => (
                                            <option key={l.value} value={l.value}>{l.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1.5">رابط صورة الغلاف</label>
                                    <input
                                        type="text"
                                        value={thumbnail}
                                        onChange={(e) => setThumbnail(e.target.value)}
                                        placeholder="/courses/..."
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1.5">المدة الإجمالية</label>
                                    <input
                                        type="text"
                                        value={totalDuration}
                                        onChange={(e) => setTotalDuration(e.target.value)}
                                        placeholder="مثال: 2 ساعة"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lessons */}
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6 shadow-sm">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-bold text-slate-800">الدروس ({lessons.length})</h2>
                            <button
                                onClick={addLesson}
                                className="flex items-center gap-1.5 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-bold hover:bg-primary-100 transition-all"
                            >
                                <IoAddOutline size={18} />
                                إضافة درس
                            </button>
                        </div>

                        <div className="space-y-4">
                            {lessons.map((lesson, index) => (
                                <div key={index} className="border border-slate-100 rounded-xl p-4 bg-slate-50/50">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm font-bold text-slate-600">درس {index + 1}</span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => moveLesson(index, 'up')}
                                                disabled={index === 0}
                                                className="p-1.5 rounded-lg hover:bg-slate-200 transition-all disabled:opacity-30"
                                            >
                                                <IoChevronUpOutline size={16} />
                                            </button>
                                            <button
                                                onClick={() => moveLesson(index, 'down')}
                                                disabled={index === lessons.length - 1}
                                                className="p-1.5 rounded-lg hover:bg-slate-200 transition-all disabled:opacity-30"
                                            >
                                                <IoChevronDownOutline size={16} />
                                            </button>
                                            <button
                                                onClick={() => removeLesson(index)}
                                                className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-all"
                                            >
                                                <IoTrashOutline size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                value={lesson.title}
                                                onChange={(e) => updateLesson(index, 'title', e.target.value)}
                                                placeholder="عنوان الدرس"
                                                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-primary-500 outline-none text-sm"
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => updateLesson(index, 'type', 'video')}
                                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                                                        lesson.type === 'video'
                                                            ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                                                            : 'bg-white text-slate-500 border border-slate-200'
                                                    }`}
                                                >
                                                    <IoVideocamOutline size={16} />
                                                    فيديو
                                                </button>
                                                <button
                                                    onClick={() => updateLesson(index, 'type', 'activity')}
                                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                                                        lesson.type === 'activity'
                                                            ? 'bg-green-100 text-green-700 border-2 border-green-300'
                                                            : 'bg-white text-slate-500 border border-slate-200'
                                                    }`}
                                                >
                                                    <IoDocumentTextOutline size={16} />
                                                    نشاط
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {lesson.type === 'video' ? (
                                                <input
                                                    type="text"
                                                    value={lesson.youtubeVideoId}
                                                    onChange={(e) => updateLesson(index, 'youtubeVideoId', e.target.value)}
                                                    placeholder="YouTube Video ID"
                                                    className="sm:col-span-1 w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-primary-500 outline-none text-sm"
                                                    dir="ltr"
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={lesson.activityImageUrl}
                                                    onChange={(e) => updateLesson(index, 'activityImageUrl', e.target.value)}
                                                    placeholder="رابط صورة النشاط"
                                                    className="sm:col-span-1 w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-primary-500 outline-none text-sm"
                                                    dir="ltr"
                                                />
                                            )}
                                            <input
                                                type="text"
                                                value={lesson.duration}
                                                onChange={(e) => updateLesson(index, 'duration', e.target.value)}
                                                placeholder="المدة (مثال: 5:30)"
                                                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-primary-500 outline-none text-sm"
                                                dir="ltr"
                                            />
                                            <input
                                                type="text"
                                                value={lesson.section}
                                                onChange={(e) => updateLesson(index, 'section', e.target.value)}
                                                placeholder="القسم (مثال: Gmail)"
                                                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-primary-500 outline-none text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <button
                            onClick={() => handleSave(false)}
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all disabled:opacity-50"
                        >
                            <IoSaveOutline size={20} />
                            {saving ? 'جاري الحفظ...' : 'حفظ كمسودة'}
                        </button>
                        <button
                            onClick={() => handleSave(true)}
                            disabled={saving}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-200 disabled:opacity-50"
                        >
                            <IoRocketOutline size={20} />
                            {saving ? 'جاري النشر...' : 'حفظ ونشر'}
                        </button>
                    </div>
                </div>
            </main>
        </>
    );
}

function calculateTotalDuration(lessons: Lesson[]): string {
    let totalSeconds = 0;
    lessons.forEach(l => {
        const parts = l.duration.split(':');
        if (parts.length === 2) {
            totalSeconds += parseInt(parts[0]) * 60 + parseInt(parts[1]);
        }
    });
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.ceil((totalSeconds % 3600) / 60);
    if (hours > 0) return `${hours} ساعة ${minutes} دقيقة`;
    return `${minutes} دقيقة`;
}
