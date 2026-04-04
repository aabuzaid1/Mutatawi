'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    IoAddOutline,
    IoCreateOutline,
    IoTrashOutline,
    IoEyeOutline,
    IoEyeOffOutline,
    IoBookOutline,
    IoLayersOutline,
    IoTimeOutline,
    IoShieldCheckmarkOutline,
    IoCloseCircleOutline,
    IoSearchOutline,
    IoMailOutline,
    IoPersonAddOutline,
    IoStatsChartOutline,
} from 'react-icons/io5';
import { useAuth } from '@/app/hooks/useAuth';
import { signOut } from '@/app/lib/auth';
import { loadAdminEmails, isAdmin, getAdminList, addAdminEmail, removeAdminEmail, initAdminEmails, isSuperAdmin, getAdminRole, canEditAllCourses, AdminRole, AdminEntry } from '@/app/lib/adminConfig';
import { getCourses, deleteCourse, updateCourseData } from '@/app/lib/firestore';
import { Course } from '@/app/types';
import LoadingSpinner from '@/app/components/shared/LoadingSpinner';
import Navbar from '@/app/components/layout/Navbar';
import toast from 'react-hot-toast';

export default function AdminCoursesPage() {
    const { user, loading: authLoading } = useAuth();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [authorized, setAuthorized] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);

    // Admin emails management
    const [adminEmails, setAdminEmails] = useState<AdminEntry[]>([]);
    const [newEmail, setNewEmail] = useState('');
    const [newRole, setNewRole] = useState<AdminRole>('creator');
    const [emailLoading, setEmailLoading] = useState(false);
    const [showEmailSection, setShowEmailSection] = useState(false);

    // Check admin access from Firestore
    useEffect(() => {
        if (authLoading || !user) {
            if (!authLoading) setAuthChecked(true);
            return;
        }
        async function checkAccess() {
            await loadAdminEmails();
            await initAdminEmails(); // Ensure fallback email exists in Firestore
            const admin = isAdmin(user?.email);
            setAuthorized(admin);
            setAuthChecked(true);
            if (admin) {
                loadCourses();
                loadEmails();
            } else {
                setLoading(false);
            }
        }
        checkAccess();
    }, [user, authLoading]);

    const loadCourses = async () => {
        setLoading(true);
        try {
            const data = await getCourses();
            setCourses(data);
        } catch (error) {
            console.error('Error loading courses:', error);
            toast.error('خطأ في تحميل الكورسات');
        } finally {
            setLoading(false);
        }
    };

    const loadEmails = async () => {
        try {
            const admins = await getAdminList();
            setAdminEmails(admins);
        } catch (error) {
            console.error('Error loading admin emails:', error);
        }
    };

    const handleAddEmail = async () => {
        const email = newEmail.trim().toLowerCase();
        if (!email) return;
        if (!email.includes('@')) { toast.error('أدخل إيميل صحيح'); return; }
        setEmailLoading(true);
        try {
            await addAdminEmail(email, newRole);
            setAdminEmails(prev => [...prev, { email, role: newRole }]);
            setNewEmail('');
            setNewRole('creator');
            toast.success('تم إضافة المشرف وإرسال إيميل الترحيب ✅');
        } catch (error: any) {
            toast.error(error.message || 'حدث خطأ');
        } finally {
            setEmailLoading(false);
        }
    };

    const handleRemoveEmail = async (email: string) => {
        setEmailLoading(true);
        try {
            await removeAdminEmail(email);
            setAdminEmails(prev => prev.filter(e => e.email !== email));
            toast.success('تم حذف المشرف');
        } catch (error: any) {
            toast.error(error.message || 'حدث خطأ');
        } finally {
            setEmailLoading(false);
        }
    };

    const handleTogglePublish = async (course: Course) => {
        setActionLoading(course.id);
        try {
            const newStatus = course.status === 'published' ? 'draft' : 'published';
            await updateCourseData(course.id, { status: newStatus });
            setCourses(prev =>
                prev.map(c => c.id === course.id ? { ...c, status: newStatus } : c)
            );
            toast.success(newStatus === 'published' ? 'تم نشر الكورس ✅' : 'تم إلغاء نشر الكورس');
        } catch (error) {
            console.error('Error toggling publish:', error);
            toast.error('حدث خطأ');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (courseId: string) => {
        setActionLoading(courseId);
        try {
            await deleteCourse(courseId);
            setCourses(prev => prev.filter(c => c.id !== courseId));
            setDeleteConfirm(null);
            toast.success('تم حذف الكورس');
        } catch (error) {
            console.error('Error deleting course:', error);
            toast.error('حدث خطأ في الحذف');
        } finally {
            setActionLoading(null);
        }
    };

    // Loading
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

    // Not authorized
    if (!user || !authorized) {
        const handleSignOutAndRedirect = async (target: 'login' | 'register') => {
            if (user) {
                await signOut();
            }
            const redirectUrl = encodeURIComponent('/admin/courses');
            if (target === 'login') {
                window.location.href = `/login?redirect=${redirectUrl}`;
            } else {
                window.location.href = `/register?redirect=${redirectUrl}`;
            }
        };

        return (
            <>
                <Navbar />
                <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="bg-white rounded-3xl p-8 sm:p-10 text-center max-w-md w-full shadow-xl border border-slate-100"
                    >
                        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                            <IoCloseCircleOutline size={36} className="text-red-400" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 mb-2">غير مصرح بالدخول</h1>
                        
                        {!user ? (
                            <>
                                <p className="text-slate-500 text-sm leading-relaxed mb-6">
                                    يرجى تسجيل الدخول أو إنشاء حساب جديد للوصول إلى لوحة إدارة الكورسات
                                </p>
                                <div className="space-y-3">
                                    <Link
                                        href={`/login?redirect=${encodeURIComponent('/admin/courses')}`}
                                        className="flex items-center justify-center gap-2 w-full px-5 py-3.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 hover:shadow-xl text-sm"
                                    >
                                        <IoMailOutline size={18} />
                                        تسجيل الدخول
                                    </Link>
                                    <Link
                                        href={`/register?redirect=${encodeURIComponent('/admin/courses')}`}
                                        className="flex items-center justify-center gap-2 w-full px-5 py-3.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all text-sm"
                                    >
                                        <IoPersonAddOutline size={18} />
                                        إنشاء حساب جديد
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <>
                                <p className="text-slate-500 text-sm leading-relaxed mb-3">
                                    الحساب الحالي غير مسموح له بالوصول إلى لوحة الإدارة
                                </p>
                                <div className="bg-slate-50 rounded-xl px-4 py-3 mb-6 border border-slate-100">
                                    <p className="text-xs text-slate-400 mb-1">الإيميل الحالي</p>
                                    <p className="text-sm font-bold text-slate-700" dir="ltr">{user.email}</p>
                                </div>
                                <p className="text-xs text-slate-400 mb-4">
                                    يمكنك تسجيل الخروج والدخول بحساب مصرح أو إنشاء حساب جديد
                                </p>
                                <div className="space-y-3">
                                    <button
                                        onClick={() => handleSignOutAndRedirect('login')}
                                        className="flex items-center justify-center gap-2 w-full px-5 py-3.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 hover:shadow-xl text-sm"
                                    >
                                        <IoMailOutline size={18} />
                                        تسجيل الدخول بحساب آخر
                                    </button>
                                    <button
                                        onClick={() => handleSignOutAndRedirect('register')}
                                        className="flex items-center justify-center gap-2 w-full px-5 py-3.5 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all text-sm"
                                    >
                                        <IoPersonAddOutline size={18} />
                                        إنشاء حساب جديد
                                    </button>
                                </div>
                            </>
                        )}
                    </motion.div>
                </div>
            </>
        );
    }

    const filtered = courses.filter(c =>
        c.title.includes(search) || c.description.includes(search)
    );

    const publishedCount = courses.filter(c => c.status === 'published').length;
    const draftCount = courses.filter(c => c.status !== 'published').length;

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-24 pb-16">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8"
                    >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <IoShieldCheckmarkOutline size={22} className="text-primary-600" />
                                    <span className="text-sm font-bold text-primary-600 bg-primary-50 px-3 py-1 rounded-full">لوحة الإدارة</span>
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-black text-slate-900">إدارة الكورسات</h1>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowEmailSection(!showEmailSection)}
                                    className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all text-sm"
                                >
                                    <IoMailOutline size={18} />
                                    المشرفين
                                </button>
                                <Link
                                    href="/admin/courses/analytics"
                                    className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all text-sm"
                                >
                                    <IoStatsChartOutline size={18} />
                                    تحليلات
                                </Link>
                                <Link
                                    href="/admin/courses/new"
                                    className="flex items-center gap-2 px-5 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 hover:shadow-xl hover:shadow-primary-300"
                                >
                                    <IoAddOutline size={20} />
                                    إضافة كورس جديد
                                </Link>
                            </div>
                        </div>

                        {/* Admin Emails Section */}
                        {showEmailSection && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="bg-white rounded-2xl border border-slate-100 p-5 mb-6 shadow-sm"
                            >
                                <div className="flex items-center gap-2 mb-4">
                                    <IoShieldCheckmarkOutline size={20} className="text-primary-600" />
                                    <h3 className="font-bold text-slate-800">المشرفين وصلاحياتهم</h3>
                                </div>

                                {/* Add Email — only for super_admin */}
                                {isSuperAdmin(user?.email) && (
                                    <div className="flex flex-col sm:flex-row gap-2 mb-4">
                                        <input
                                            type="email"
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            placeholder="أدخل إيميل المشرف الجديد..."
                                            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-primary-500 outline-none text-sm"
                                            dir="ltr"
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
                                        />
                                        <select
                                            value={newRole}
                                            onChange={(e) => setNewRole(e.target.value as AdminRole)}
                                            className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:border-primary-500 outline-none"
                                        >
                                            <option value="creator">📚 منشئ كورسات</option>
                                            <option value="editor">✏️ محرر</option>
                                            <option value="super_admin">👑 مدير عام</option>
                                        </select>
                                        <button
                                            onClick={handleAddEmail}
                                            disabled={emailLoading || !newEmail.trim()}
                                            className="flex items-center gap-1.5 px-4 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-all disabled:opacity-50"
                                        >
                                            <IoPersonAddOutline size={16} />
                                            إضافة
                                        </button>
                                    </div>
                                )}

                                {/* Role Legend */}
                                <div className="flex flex-wrap gap-2 mb-4 text-xs">
                                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full font-bold">👑 مدير عام — كل الصلاحيات</span>
                                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-bold">✏️ محرر — يعدل كل الكورسات</span>
                                    <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-full font-bold">📚 منشئ — كورساته فقط</span>
                                </div>

                                {/* Admin List */}
                                <div className="space-y-2">
                                    {adminEmails.map((admin) => (
                                        <div key={admin.email} className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <IoMailOutline size={16} className="text-slate-400" />
                                                <span className="text-sm text-slate-700 font-medium" dir="ltr">{admin.email}</span>
                                                {admin.email === user?.email?.toLowerCase() && (
                                                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-bold">أنت</span>
                                                )}
                                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                                                    admin.role === 'super_admin' ? 'bg-amber-100 text-amber-700' :
                                                    admin.role === 'editor' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-green-100 text-green-700'
                                                }`}>
                                                    {admin.role === 'super_admin' ? '👑 مدير عام' :
                                                     admin.role === 'editor' ? '✏️ محرر' : '📚 منشئ'}
                                                </span>
                                            </div>
                                            {isSuperAdmin(user?.email) && (
                                                <button
                                                    onClick={() => handleRemoveEmail(admin.email)}
                                                    disabled={emailLoading || admin.email === 'aabuzaid242@gmail.com'}
                                                    className="text-red-400 hover:text-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                    title={admin.email === 'aabuzaid242@gmail.com' ? 'لا يمكن حذف المدير العام الأساسي' : 'حذف'}
                                                >
                                                    <IoTrashOutline size={16} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="bg-white rounded-xl border border-slate-100 p-4 text-center">
                                <p className="text-2xl font-black text-slate-800">{courses.length}</p>
                                <p className="text-xs text-slate-400 font-medium">إجمالي</p>
                            </div>
                            <div className="bg-white rounded-xl border border-green-100 p-4 text-center">
                                <p className="text-2xl font-black text-green-600">{publishedCount}</p>
                                <p className="text-xs text-green-500 font-medium">منشور</p>
                            </div>
                            <div className="bg-white rounded-xl border border-amber-100 p-4 text-center">
                                <p className="text-2xl font-black text-amber-600">{draftCount}</p>
                                <p className="text-xs text-amber-500 font-medium">مسودة</p>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <IoSearchOutline className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="ابحث في الكورسات..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pr-11 pl-4 py-3 rounded-xl border border-slate-200 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none text-sm"
                            />
                        </div>
                    </motion.div>

                    {/* Courses List */}
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <LoadingSpinner size="lg" />
                        </div>
                    ) : filtered.length > 0 ? (
                        <div className="space-y-4">
                            {filtered.map((course, index) => (
                                <motion.div
                                    key={course.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden"
                                >
                                    <div className="flex flex-col sm:flex-row items-stretch">
                                        {/* Thumbnail */}
                                        <div className="sm:w-48 h-32 sm:h-auto bg-gradient-to-br from-primary-100 to-secondary-100 flex-shrink-0 overflow-hidden">
                                            {course.thumbnail ? (
                                                <img
                                                    src={course.thumbnail}
                                                    alt={course.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center min-h-[8rem]">
                                                    <IoBookOutline size={32} className="text-primary-300" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 p-5">
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                            course.status === 'published'
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                            {course.status === 'published' ? '✅ منشور' : '📝 مسودة'}
                                                        </span>
                                                        <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                                                            {course.category}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-bold text-slate-800 text-lg leading-relaxed">{course.title}</h3>
                                                    <p className="text-sm text-slate-500 line-clamp-1 mt-0.5">{course.description}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
                                                <span className="flex items-center gap-1">
                                                    <IoLayersOutline size={14} />
                                                    {course.totalLessons} درس
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <IoTimeOutline size={14} />
                                                    {course.totalDuration}
                                                </span>
                                                {course.level && (
                                                    <span className="text-slate-500">{course.level}</span>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {(canEditAllCourses(user?.email) || course.createdBy === user?.uid) && (
                                                    <>
                                                        <button
                                                            onClick={() => handleTogglePublish(course)}
                                                            disabled={actionLoading === course.id}
                                                            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${
                                                                course.status === 'published'
                                                                    ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                                                    : 'bg-green-50 text-green-700 hover:bg-green-100'
                                                            }`}
                                                        >
                                                            {course.status === 'published' ? (
                                                                <><IoEyeOffOutline size={15} /> إلغاء النشر</>
                                                            ) : (
                                                                <><IoEyeOutline size={15} /> نشر</>
                                                            )}
                                                        </button>
                                                        <Link
                                                            href={`/admin/courses/${course.id}/edit`}
                                                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all"
                                                        >
                                                            <IoCreateOutline size={15} />
                                                            تعديل
                                                        </Link>
                                                    </>
                                                )}
                                                <Link
                                                    href={`/courses/${course.id}`}
                                                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all"
                                                >
                                                    <IoEyeOutline size={15} />
                                                    معاينة
                                                </Link>
                                                {(canEditAllCourses(user?.email) || course.createdBy === user?.uid) && (
                                                    <>
                                                        {deleteConfirm === course.id ? (
                                                            <div className="flex items-center gap-1.5">
                                                                <button
                                                                    onClick={() => handleDelete(course.id)}
                                                                    disabled={actionLoading === course.id}
                                                                    className="px-3 py-2 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-all disabled:opacity-50"
                                                                >
                                                                    تأكيد الحذف
                                                                </button>
                                                                <button
                                                                    onClick={() => setDeleteConfirm(null)}
                                                                    className="px-3 py-2 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all"
                                                                >
                                                                    إلغاء
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => setDeleteConfirm(course.id)}
                                                                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                                                            >
                                                                <IoTrashOutline size={15} />
                                                                حذف
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <IoBookOutline size={48} className="text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-400 text-lg font-medium">لا توجد كورسات</p>
                            <Link
                                href="/admin/courses/new"
                                className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all text-sm"
                            >
                                <IoAddOutline size={18} />
                                أضف أول كورس
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}
