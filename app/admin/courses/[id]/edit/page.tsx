'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
    IoCloudUploadOutline,
    IoCloseOutline,
    IoExtensionPuzzleOutline,
} from 'react-icons/io5';
import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';
import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';
import { isAdmin, loadAdminEmails } from '@/app/lib/adminConfig';
import { getCourse, updateCourseData } from '@/app/lib/firestore';
import { uploadCourseThumbnail, compressImage, uploadCourseVideo } from '@/app/lib/storage';
import { Lesson, CourseCategory, Course, QuizQuestion } from '@/app/types';
import Navbar from '@/app/components/layout/Navbar';
import LoadingSpinner from '@/app/components/shared/LoadingSpinner';
import toast from 'react-hot-toast';

const categories: { label: string; value: CourseCategory }[] = [
    { label: '🏫 جامعة العلوم التطبيقية', value: 'جامعة العلوم التطبيقية' },
    { label: '🏫 جامعة الزيتونة', value: 'جامعة الزيتونة' },
    { label: '🏫 الجامعة الأردنية', value: 'الجامعة الأردنية' },
    { label: '🏫 جامعة الإسراء', value: 'جامعة الإسراء' },
    { label: '🏫 جامعة البترا', value: 'جامعة البترا' },
    { label: '🏫 جامعة البلقاء التطبيقية', value: 'جامعة البلقاء التطبيقية' },
    { label: '🌱 تنمية شخصية', value: 'تنمية شخصية' },
    { label: '💻 تقنية', value: 'تقنية' },
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
    type: 'video' | 'activity' | 'quiz';
    videoSource: 'youtube' | 'upload';
    youtubeVideoId: string;
    videoUrl: string;
    videoFile?: File | null;
    activityImageSource: 'url' | 'upload';
    activityImageFile?: File | null;
    activityImageUrl: string;
    activityText: string;
    questions: QuizQuestion[];
    duration: string;
    section: string;
}

export default function EditCoursePage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const params = useParams();
    const courseId = params.id as string;
    const [authorized, setAuthorized] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);

    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<CourseCategory>('جامعة العلوم التطبيقية');
    const [level, setLevel] = useState<string>('');
    const [thumbnail, setThumbnail] = useState('');
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [totalDuration, setTotalDuration] = useState('');
    const [status, setStatus] = useState<'draft' | 'published'>('draft');
    const [lessons, setLessons] = useState<LessonForm[]>([]);
    const [saving, setSaving] = useState(false);

    const handleFileSelect = (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('يرجى اختيار ملف صورة');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error('حجم الصورة كبير جداً (الحد الأقصى 10MB)');
            return;
        }
        setThumbnailFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
            setThumbnailPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    };

    const removeThumbnail = () => {
        setThumbnailFile(null);
        setThumbnailPreview('');
        setThumbnail('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    useEffect(() => {
        if (authLoading || !user) return;
        loadAdminEmails().then(() => {
            const admin = isAdmin(user?.email);
            setAuthorized(admin);
            setAuthChecked(true);
            if (admin) loadCourse();
        });
    }, [authLoading, user, courseId]);

    const loadCourse = async () => {
        try {
            const course = await getCourse(courseId);
            if (!course) {
                toast.error('الكورس غير موجود');
                router.push('/admin/courses');
                return;
            }
            setTitle(course.title);
            setDescription(course.description);
            setCategory(course.category);
            setLevel(course.level || '');
            setThumbnail(course.thumbnail || '');
            setTotalDuration(course.totalDuration || '');
            setStatus(course.status || 'draft');
            setLessons(course.lessons?.map(l => ({
                title: l.title,
                type: l.type,
                videoSource: l.videoUrl ? 'upload' : 'youtube',
                youtubeVideoId: l.youtubeVideoId || '',
                videoUrl: l.videoUrl || '',
                activityImageSource: 'upload',
                activityImageUrl: l.activityImageUrl || '',
                activityText: l.activityText || '',
                questions: l.questions || [],
                duration: l.duration || '',
                section: l.section || '',
            })) || []);
        } catch (error) {
            console.error('Error loading course:', error);
            toast.error('خطأ في تحميل الكورس');
        } finally {
            setLoading(false);
        }
    };

    const addLesson = () => {
        const lastSection = lessons.length > 0 ? lessons[lessons.length - 1].section : '';
        setLessons([...lessons, { title: '', type: 'video', videoSource: 'youtube', youtubeVideoId: '', videoUrl: '', activityImageSource: 'upload', activityImageUrl: '', activityText: '', questions: [], duration: '', section: lastSection }]);
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

    const addQuestion = (lessonIndex: number) => {
        const updated = [...lessons];
        updated[lessonIndex].questions.push({ type: 'multiple_choice', question: '', options: ['', ''], correctIndex: 0, pairs: [] });
        setLessons(updated);
    };
    const updateQuestion = (lessonIndex: number, qIndex: number, field: string, value: any) => {
        const updated = [...lessons];
        updated[lessonIndex].questions[qIndex] = { ...updated[lessonIndex].questions[qIndex], [field]: value };
        setLessons(updated);
    };
    const updateOption = (lessonIndex: number, qIndex: number, optIndex: number, value: string) => {
        const updated = [...lessons];
        updated[lessonIndex].questions[qIndex].options[optIndex] = value;
        setLessons(updated);
    };
    const addOption = (lessonIndex: number, qIndex: number) => {
        const updated = [...lessons];
        updated[lessonIndex].questions[qIndex].options.push('');
        setLessons(updated);
    };
    const removeOption = (lessonIndex: number, qIndex: number, optIndex: number) => {
        const updated = [...lessons];
        updated[lessonIndex].questions[qIndex].options.splice(optIndex, 1);
        if (updated[lessonIndex].questions[qIndex].correctIndex >= updated[lessonIndex].questions[qIndex].options.length) {
            updated[lessonIndex].questions[qIndex].correctIndex = 0;
        }
        setLessons(updated);
    }
    const removeQuestion = (lessonIndex: number, qIndex: number) => {
        const updated = [...lessons];
        updated[lessonIndex].questions.splice(qIndex, 1);
        setLessons(updated);
    };
    const addPair = (lessonIndex: number, qIndex: number) => {
        const updated = [...lessons];
        if (!updated[lessonIndex].questions[qIndex].pairs) updated[lessonIndex].questions[qIndex].pairs = [];
        updated[lessonIndex].questions[qIndex].pairs!.push({ target: '', draggable: '' });
        setLessons(updated);
    };
    const updatePair = (lessonIndex: number, qIndex: number, pairIndex: number, field: 'target' | 'draggable', value: string) => {
        const updated = [...lessons];
        updated[lessonIndex].questions[qIndex].pairs![pairIndex][field] = value;
        setLessons(updated);
    };
    const removePair = (lessonIndex: number, qIndex: number, pairIndex: number) => {
        const updated = [...lessons];
        updated[lessonIndex].questions[qIndex].pairs!.splice(pairIndex, 1);
        setLessons(updated);
    };

    const handleSave = async (publish?: boolean) => {
        if (!title.trim()) { toast.error('أدخل عنوان الكورس'); return; }
        if (!description.trim()) { toast.error('أدخل وصف الكورس'); return; }

        const validLessons = lessons.filter(l => l.title.trim());

        setSaving(true);
        try {
            // Upload new thumbnail if a file was selected
            let thumbnailUrl = thumbnail;
            if (thumbnailFile) {
                setUploadingImage(true);
                try {
                    const compressed = await compressImage(thumbnailFile);
                    thumbnailUrl = await uploadCourseThumbnail(compressed, courseId);
                } catch (uploadError) {
                    console.error('Error uploading thumbnail:', uploadError);
                    toast.error('خطأ في رفع الصورة');
                    setSaving(false);
                    setUploadingImage(false);
                    return;
                }
                setUploadingImage(false);
            }

            // Upload videos if needed
            for (let i = 0; i < validLessons.length; i++) {
                const l = validLessons[i];
                if (l.type === 'video' && l.videoSource === 'upload' && l.videoFile) {
                    toast.loading(`جاري رفع فيديو درس ${i + 1}...`, { id: 'uploading-video' });
                    try {
                        const url = await uploadCourseVideo(l.videoFile, courseId);
                        l.videoUrl = url;
                    } catch (err) {
                        toast.dismiss('uploading-video');
                        toast.error(`فشل رفع فيديو درس ${i + 1}`);
                        setSaving(false);
                        return;
                    }
                }

                if (l.type === 'activity' && l.activityImageSource === 'upload' && l.activityImageFile) {
                    toast.loading(`جاري رفع صورة نشاط درس ${i + 1}...`, { id: 'uploading-image' });
                    try {
                        const compressed = await compressImage(l.activityImageFile);
                        const url = await uploadCourseThumbnail(compressed);
                        l.activityImageUrl = url;
                    } catch (err) {
                        toast.dismiss('uploading-image');
                        toast.error(`فشل رفع صورة نشاط درس ${i + 1}`);
                        setSaving(false);
                        return;
                    }
                }
            }
            toast.dismiss('uploading-video');
            toast.dismiss('uploading-image');

            const courseLessons: Lesson[] = validLessons.map((l, i) => ({
                title: l.title,
                type: l.type,
                ...(l.type === 'video' 
                      ? (l.videoSource === 'youtube' ? { youtubeVideoId: l.youtubeVideoId } : { videoUrl: l.videoUrl }) 
                      : l.type === 'activity' 
                      ? { activityImageUrl: l.activityImageUrl, activityText: l.activityText }
                      : { questions: l.questions.filter(q => q.question.trim().length > 0) }),
                duration: l.duration || '0:00',
                order: i + 1,
                section: l.section || undefined,
            }));

            const newStatus = publish !== undefined ? (publish ? 'published' : 'draft') : status;

            await updateCourseData(courseId, {
                title,
                description,
                category,
                thumbnail: thumbnailUrl,
                totalLessons: courseLessons.length,
                totalDuration: totalDuration || calculateTotalDuration(courseLessons),
                level: level as any,
                lessons: courseLessons,
                status: newStatus,
            });

            toast.success('تم حفظ التعديلات ✅');
            router.push('/admin/courses');
        } catch (error) {
            console.error('Error updating course:', error);
            toast.error('حدث خطأ في الحفظ');
        } finally {
            setSaving(false);
        }
    };

    if (authLoading || loading || !authChecked) {
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
                            <h1 className="text-2xl font-black text-slate-900">تعديل الكورس</h1>
                        </div>
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                            status === 'published'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                        }`}>
                            {status === 'published' ? '✅ منشور' : '📝 مسودة'}
                        </span>
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
                                <div className="sm:col-span-2">
                                    <label className="block text-sm font-medium text-slate-600 mb-1.5">صورة الغلاف</label>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileSelect(file);
                                        }}
                                        className="hidden"
                                    />
                                    {thumbnailPreview || thumbnail ? (
                                        <div className="relative group rounded-xl overflow-hidden border-2 border-primary-200 bg-slate-50">
                                            <img
                                                src={thumbnailPreview || thumbnail}
                                                alt="معاينة الغلاف"
                                                className="w-full h-48 object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="px-4 py-2 bg-white text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-100 transition-all"
                                                >
                                                    تغيير الصورة
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={removeThumbnail}
                                                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
                                                >
                                                    <IoCloseOutline size={20} />
                                                </button>
                                            </div>
                                            {uploadingImage && (
                                                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <LoadingSpinner size="md" />
                                                        <span className="text-sm font-bold text-primary-600">جاري رفع الصورة...</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={handleDrop}
                                            className="w-full h-48 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-all group"
                                        >
                                            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center group-hover:bg-primary-100 transition-all">
                                                <IoCloudUploadOutline size={28} className="text-slate-400 group-hover:text-primary-500 transition-all" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-bold text-slate-600">اضغط لاختيار صورة أو اسحبها هنا</p>
                                                <p className="text-xs text-slate-400 mt-1">PNG, JPG, WebP (الحد الأقصى 10MB)</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
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
                                            <div className="flex flex-col sm:flex-row gap-2">
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
                                                <button
                                                    onClick={() => updateLesson(index, 'type', 'quiz')}
                                                    className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                                                        lesson.type === 'quiz'
                                                            ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                                                            : 'bg-white text-slate-500 border border-slate-200'
                                                    }`}
                                                >
                                                    <IoExtensionPuzzleOutline size={16} />
                                                    اختبار
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {lesson.type === 'video' && (
                                                <div className="sm:col-span-3 flex bg-slate-100 p-1 rounded-lg mb-1">
                                                    <button
                                                        onClick={() => updateLesson(index, 'videoSource', 'youtube')}
                                                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${lesson.videoSource === 'youtube' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                    >
                                                        YouTube ID
                                                    </button>
                                                    <button
                                                        onClick={() => updateLesson(index, 'videoSource', 'upload')}
                                                        className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${lesson.videoSource === 'upload' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                    >
                                                        رفع فيديو
                                                    </button>
                                                </div>
                                            )}

                                            {lesson.type === 'video' ? (
                                                lesson.videoSource === 'youtube' ? (
                                                    <input
                                                        type="text"
                                                        value={lesson.youtubeVideoId}
                                                        onChange={(e) => updateLesson(index, 'youtubeVideoId', e.target.value)}
                                                        placeholder="YouTube Video ID"
                                                        className="sm:col-span-1 w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-primary-500 outline-none text-sm"
                                                        dir="ltr"
                                                    />
                                                ) : (
                                                    <div className="sm:col-span-1 flex flex-col gap-1">
                                                        <input
                                                            type="file"
                                                            accept="video/*"
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file && file.size > 500 * 1024 * 1024) {
                                                                    toast.error('حجم الفيديو كبير جداً (الحد الأقصى 500MB)');
                                                                    e.target.value = '';
                                                                    return;
                                                                }
                                                                if (file) {
                                                                    const updated = [...lessons];
                                                                    updated[index] = { ...updated[index], videoFile: file, videoUrl: '' };
                                                                    setLessons(updated);
                                                                }
                                                            }}
                                                            className="w-full text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                                        />
                                                        {(lesson.videoFile || lesson.videoUrl) && (
                                                            <span className="text-xs text-green-600 font-bold px-1 mt-1 block">
                                                                {lesson.videoFile ? 'تم اختيار الفيديو' : 'يوجد فيديو جاهز'}
                                                            </span>
                                                        )}
                                                    </div>
                                                )
                                            ) : null}
                                            
                                            {lesson.type === 'activity' && (
                                                <div className="sm:col-span-3 space-y-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">نص النشاط / التعليمات</label>
                                                        <textarea
                                                            value={lesson.activityText || ''}
                                                            onChange={(e) => updateLesson(index, 'activityText', e.target.value)}
                                                            placeholder="اكتب تعليمات أو الكلمات الخاصة بالنشاط هنا (اختياري)..."
                                                            rows={3}
                                                            className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-primary-500 outline-none text-sm resize-y"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-600 mb-1.5">صورة النشاط (اختياري)</label>
                                                        <div className="flex bg-slate-100 p-1 rounded-lg mb-2 w-fit">
                                                            <button
                                                                onClick={() => updateLesson(index, 'activityImageSource', 'upload')}
                                                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${lesson.activityImageSource === 'upload' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                            >
                                                                رفع صورة
                                                            </button>
                                                            <button
                                                                onClick={() => updateLesson(index, 'activityImageSource', 'url')}
                                                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${lesson.activityImageSource === 'url' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                                            >
                                                                رابط صورة
                                                            </button>
                                                        </div>
                                                        {lesson.activityImageSource === 'url' ? (
                                                            <input
                                                                type="text"
                                                                value={lesson.activityImageUrl}
                                                                onChange={(e) => updateLesson(index, 'activityImageUrl', e.target.value)}
                                                                placeholder="رابط صورة النشاط (مثال: https://...)"
                                                                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 focus:border-primary-500 outline-none text-sm"
                                                                dir="ltr"
                                                            />
                                                        ) : (
                                                            <div className="flex flex-col gap-1">
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) {
                                                                            if (file.size > 10 * 1024 * 1024) {
                                                                                toast.error('حجم الصورة كبير جداً (الحد الأقصى 10MB)');
                                                                                e.target.value = '';
                                                                                return;
                                                                            }
                                                                            const updated = [...lessons];
                                                                            updated[index] = { ...updated[index], activityImageFile: file, activityImageUrl: '' };
                                                                            setLessons(updated);
                                                                        }
                                                                    }}
                                                                    className="w-full text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                                                />
                                                                {(lesson.activityImageFile || lesson.activityImageUrl) && (
                                                                    <span className="text-xs text-green-600 font-bold px-1 mt-1 block">
                                                                        {lesson.activityImageFile ? 'تم اختيار الصورة' : 'يوجد صورة مسجلة'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {lesson.type === 'quiz' && (
                                                <div className="sm:col-span-3 space-y-4 p-4 bg-purple-50/50 rounded-xl border border-purple-100 mb-2">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-sm font-bold text-purple-800">أسئلة الاختبار</h4>
                                                        <button 
                                                            onClick={() => addQuestion(index)}
                                                            className="text-xs flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200 transition-all font-bold"
                                                        >
                                                            <IoAddOutline size={14} /> إضافة سؤال
                                                        </button>
                                                    </div>
                                                    
                                                    {lesson.questions.map((q, qIndex) => (
                                                        <div key={qIndex} className="bg-white p-4 rounded-lg border border-slate-200 space-y-3 relative shadow-sm">
                                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2">
                                                                <span className="text-sm font-bold text-slate-800">السؤال {qIndex + 1}</span>
                                                                <div className="flex items-center gap-2">
                                                                    <select
                                                                        value={q.type || 'multiple_choice'}
                                                                        onChange={(e) => updateQuestion(index, qIndex, 'type', e.target.value)}
                                                                        className="text-xs font-bold border border-slate-200 rounded-md py-1.5 px-2 outline-none text-slate-600 focus:border-purple-400 focus:ring-1 focus:ring-purple-200"
                                                                    >
                                                                        <option value="multiple_choice">اختيار من متعدد</option>
                                                                        <option value="drag_drop">سحب وإفلات (مطابقة)</option>
                                                                    </select>
                                                                    <button 
                                                                        onClick={() => removeQuestion(index, qIndex)}
                                                                        className="text-red-400 hover:text-red-500 p-1.5 bg-red-50/50 rounded hover:bg-red-50 transition-all"
                                                                        title="حذف السؤال"
                                                                    >
                                                                        <IoTrashOutline size={16} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-slate-500 mb-1.5">نص السؤال</label>
                                                                <input
                                                                    type="text"
                                                                    value={q.question}
                                                                    onChange={(e) => updateQuestion(index, qIndex, 'question', e.target.value)}
                                                                    placeholder="اكتب السؤال هنا (باللغة الإنجليزية)..."
                                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-purple-500 outline-none text-sm font-bold font-mono text-left"
                                                                    dir="ltr"
                                                                />
                                                                {q.question.includes('$') && (
                                                                    <div className="mt-2 p-3 bg-slate-50 rounded-lg border border-slate-100 text-sm text-left overflow-x-auto" dir="ltr">
                                                                        <Latex>{q.question}</Latex>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {(!q.type || q.type === 'multiple_choice') && (
                                                                <div className="space-y-2.5 pt-2 pl-4 border-r-2 border-purple-100 pr-2">
                                                                    <label className="block text-xs font-bold text-slate-500 mb-1">الخيارات (باللغة الإنجليزية)</label>
                                                                    {q.options?.map((opt, optIndex) => (
                                                                        <div key={optIndex} className="flex flex-col gap-1">
                                                                            <div className="flex items-center gap-2">
                                                                                <div className="flex items-center justify-center p-1 cursor-pointer">
                                                                                    <input 
                                                                                        type="radio" 
                                                                                        name={`correct-${index}-${qIndex}`}
                                                                                        checked={q.correctIndex === optIndex}
                                                                                        onChange={() => updateQuestion(index, qIndex, 'correctIndex', optIndex)}
                                                                                        className="w-4 h-4 text-purple-600 focus:ring-purple-500 cursor-pointer accent-purple-600"
                                                                                        title="تحديد كإجابة صحيحة"
                                                                                    />
                                                                                </div>
                                                                                <input
                                                                                    type="text"
                                                                                    value={opt}
                                                                                    onChange={(e) => updateOption(index, qIndex, optIndex, e.target.value)}
                                                                                    placeholder={`Option ${optIndex + 1}`}
                                                                                    className={`flex-1 px-3 py-1.5 rounded-lg border text-sm outline-none transition-all font-mono text-left ${q.correctIndex === optIndex ? 'border-purple-400 bg-purple-50/30' : 'border-slate-200 focus:border-purple-300'}`}
                                                                                    dir="ltr"
                                                                                />
                                                                                <button 
                                                                                    onClick={() => removeOption(index, qIndex, optIndex)}
                                                                                    disabled={(q.options?.length || 0) <= 2}
                                                                                    className="text-slate-400 hover:text-red-500 disabled:opacity-30 p-1"
                                                                                >
                                                                                    <IoCloseOutline size={18} />
                                                                                </button>
                                                                            </div>
                                                                            {opt.includes('$') && (
                                                                                <div className="ml-8 text-xs text-left text-slate-500 bg-slate-50 p-2 rounded" dir="ltr">
                                                                                    <Latex>{opt}</Latex>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                    <button 
                                                                        onClick={() => addOption(index, qIndex)}
                                                                        className="text-xs text-purple-600 font-bold hover:bg-purple-50 px-2 py-1 rounded transition-all mt-1 flex items-center gap-1 w-fit"
                                                                    >
                                                                        <IoAddOutline size={14} /> إضافة خيار
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {q.type === 'drag_drop' && (
                                                                <div className="space-y-2.5 pt-2 pl-4 border-r-2 border-purple-100 pr-2">
                                                                    <label className="block text-xs font-bold text-slate-500 mb-1">أزواج المطابقة (الجزء الثابت / الجزء المتحرك)</label>
                                                                    {q.pairs?.map((pair, pIndex) => (
                                                                        <div key={pIndex} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                                                            <input
                                                                                type="text"
                                                                                value={pair.target}
                                                                                onChange={(e) => updatePair(index, qIndex, pIndex, 'target', e.target.value)}
                                                                                placeholder="Target (e.g. Definition or variable)"
                                                                                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 focus:border-purple-300 text-sm outline-none font-mono text-left bg-slate-50"
                                                                                dir="ltr"
                                                                            />
                                                                            <span className="hidden sm:block text-slate-300 text-sm">⬅️</span>
                                                                            <span className="block sm:hidden text-center text-slate-300 text-xs">⬇️</span>
                                                                            <input
                                                                                type="text"
                                                                                value={pair.draggable}
                                                                                onChange={(e) => updatePair(index, qIndex, pIndex, 'draggable', e.target.value)}
                                                                                placeholder="Draggable (e.g. Term or Value)"
                                                                                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 focus:border-purple-300 text-sm outline-none font-mono text-left bg-purple-50"
                                                                                dir="ltr"
                                                                            />
                                                                            <button 
                                                                                onClick={() => removePair(index, qIndex, pIndex)}
                                                                                className="text-slate-400 hover:text-red-500 p-1 self-end sm:self-center bg-slate-100 rounded hover:bg-red-50"
                                                                            >
                                                                                <IoTrashOutline size={16} />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                    <button 
                                                                        onClick={() => addPair(index, qIndex)}
                                                                        className="text-xs text-purple-600 font-bold hover:bg-purple-50 px-2 py-1 rounded transition-all mt-1 flex items-center gap-1 w-fit"
                                                                    >
                                                                        <IoAddOutline size={14} /> إضافة زوج مطابقة
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {lesson.questions.length === 0 && (
                                                        <p className="text-xs text-center text-slate-400 py-6 font-medium">لا توجد أسئلة، اضغط على <b>إضافة سؤال</b> من الأعلى للبدء.</p>
                                                    )}
                                                </div>
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
                            {saving ? 'جاري الحفظ...' : 'حفظ ونشر'}
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
