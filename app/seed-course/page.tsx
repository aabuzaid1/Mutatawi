'use client';

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';

const gmailLessons = [
    { title: 'Gmail - مقدمة عن البريد الإلكتروني', type: 'video', youtubeVideoId: 'XSHpO93gVfw', duration: '5:00', order: 1, section: 'Gmail' },
    { title: 'Gmail - إرسال واستقبال الرسائل', type: 'video', youtubeVideoId: '-O17jZDAZgo', duration: '5:00', order: 2, section: 'Gmail' },
    { title: 'Gmail - تنظيم البريد الوارد', type: 'video', youtubeVideoId: '-naU3klJxLY', duration: '5:00', order: 3, section: 'Gmail' },
    { title: 'Activity 1: Compose an email message', type: 'activity', activityImageUrl: '/courses/google-workspace/activity-1.png', duration: '10:00', order: 4, section: 'Gmail' },
    { title: 'Gmail - المرفقات والملفات', type: 'video', youtubeVideoId: 'We7RrCH4V0g', duration: '5:00', order: 5, section: 'Gmail' },
    { title: 'Gmail - إعدادات البريد', type: 'video', youtubeVideoId: 'iD0c5VMFX8U', duration: '5:00', order: 6, section: 'Gmail' },
    { title: 'Gmail - فلاتر البريد', type: 'video', youtubeVideoId: 'iD0c5VMFX8U', duration: '5:00', order: 7, section: 'Gmail' },
    { title: 'Gmail - التسميات والتصنيف', type: 'video', youtubeVideoId: 'kgNp0x7Y-ys', duration: '5:00', order: 8, section: 'Gmail' },
    { title: 'Activity 2: Create and use labels', type: 'activity', activityImageUrl: '/courses/google-workspace/activity-2.png', duration: '10:00', order: 9, section: 'Gmail' },
    { title: 'Gmail - البحث المتقدم', type: 'video', youtubeVideoId: 'v4u2EZxyXH8', duration: '5:00', order: 10, section: 'Gmail' },
    { title: 'Gmail - التكامل مع التقويم', type: 'video', youtubeVideoId: 'f1jV90gqaaE', duration: '5:00', order: 11, section: 'Gmail' },
    { title: 'Activity 3: Create an event from Gmail and view it in Calendar', type: 'activity', activityImageUrl: '/courses/google-workspace/activity-3.png', duration: '10:00', order: 12, section: 'Gmail' },
    { title: 'Gmail - قوالب البريد', type: 'video', youtubeVideoId: 'EQQpfZH3wL4', duration: '5:00', order: 13, section: 'Gmail' },
    { title: 'Gmail - التوقيع الإلكتروني', type: 'video', youtubeVideoId: 'nbUIrf2i080', duration: '5:00', order: 14, section: 'Gmail' },
    { title: 'Activity 5: Create a new email signature', type: 'activity', activityImageUrl: '/courses/google-workspace/activity-5.png', duration: '10:00', order: 15, section: 'Gmail' },
    { title: 'Activity 6: Create a canned response template', type: 'activity', activityImageUrl: '/courses/google-workspace/activity-6.png', duration: '10:00', order: 16, section: 'Gmail' },
    { title: 'Activity 7: Enable an Out-of-Office automatic reply', type: 'activity', activityImageUrl: '/courses/google-workspace/activity-7.png', duration: '10:00', order: 17, section: 'Gmail' },
    { title: 'Gmail - الردود التلقائية', type: 'video', youtubeVideoId: 'egNsTkru4dg', duration: '5:00', order: 18, section: 'Gmail' },
    { title: 'Gmail - نصائح متقدمة', type: 'video', youtubeVideoId: 'egNsTkru4dg', duration: '5:00', order: 19, section: 'Gmail' },
    { title: 'Gmail - ملخص ومراجعة', type: 'video', youtubeVideoId: '_yIzc4U7D2g', duration: '5:00', order: 20, section: 'Gmail' },
];

export default function SeedCoursePage() {
    const [status, setStatus] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const seedCourse = async () => {
        setLoading(true);
        setStatus('جاري إضافة الكورس...');
        try {
            const courseData = {
                title: 'Google Workspace - Google',
                description: 'تعلم جميع أدوات Google Workspace بما في ذلك Gmail, Google Calendar, Google Chat, Google Meet, Google Drive, Google Docs, Google Slides, Google Sheets',
                category: 'تقنية',
                thumbnail: '',
                totalLessons: gmailLessons.length,
                totalDuration: '2 ساعة',
                level: 'مبتدئ',
                lessons: gmailLessons,
                createdAt: serverTimestamp(),
            };

            const docRef = await addDoc(collection(db, 'courses'), courseData);
            setStatus(`✅ تم إضافة الكورس بنجاح! ID: ${docRef.id} — عدد الدروس: ${gmailLessons.length}`);
        } catch (error: any) {
            console.error('Seed error:', error);
            setStatus(`❌ خطأ: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full text-center">
                <h1 className="text-2xl font-bold text-slate-800 mb-4">🌐 Seed Google Workspace Course</h1>
                <p className="text-slate-500 mb-6">
                    هذه الصفحة لإضافة كورس Google Workspace مع قسم Gmail ({gmailLessons.length} درس) إلى Firestore
                </p>
                <button
                    onClick={seedCourse}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'جاري الإضافة...' : 'إضافة الكورس'}
                </button>
                {status && (
                    <div className="mt-6 p-4 bg-slate-50 rounded-xl text-sm text-slate-700 text-right" dir="rtl">
                        {status}
                    </div>
                )}
            </div>
        </div>
    );
}
