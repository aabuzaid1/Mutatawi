'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    IoPersonOutline,
    IoMailOutline,
    IoCallOutline,
    IoLocationOutline,
    IoPencilOutline,
    IoSaveOutline,
    IoLockClosedOutline,
} from 'react-icons/io5';
import Input from '@/app/components/ui/Input';
import Button from '@/app/components/ui/Button';
import Badge from '@/app/components/ui/Badge';
import { useAuth } from '@/app/hooks/useAuth';
import { updateUserProfile } from '@/app/lib/firestore';
import { getApplicationsByVolunteer } from '@/app/lib/firestore';
import { changePassword } from '@/app/lib/auth';
import toast from 'react-hot-toast';

export default function ProfilePage() {
    const { user, profile, setProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [stats, setStats] = useState({ total: 0, accepted: 0 });
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        phone: '',
        location: '',
        bio: '',
        skills: '',
    });

    // Password change state
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => {
        if (profile) {
            setFormData({
                displayName: profile.displayName || '',
                email: profile.email || '',
                phone: profile.phone || '',
                location: profile.location || '',
                bio: profile.bio || '',
                skills: profile.skills?.join('، ') || '',
            });
        }
    }, [profile]);

    useEffect(() => {
        async function loadStats() {
            if (!user) return;
            try {
                const apps = await getApplicationsByVolunteer(user.uid);
                setStats({
                    total: apps.length,
                    accepted: apps.filter(a => a.status === 'accepted').length,
                });
            } catch (error) {
                console.error('Error loading stats:', error);
            }
        }
        loadStats();
    }, [user]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        try {
            const updatedData = {
                displayName: formData.displayName,
                phone: formData.phone,
                location: formData.location,
                bio: formData.bio,
                skills: formData.skills.split('،').map(s => s.trim()).filter(Boolean),
            };
            await updateUserProfile(user.uid, updatedData);
            if (profile) {
                setProfile({ ...profile, ...updatedData });
            }
            toast.success('تم حفظ التغييرات بنجاح! ✅');
            setIsEditing(false);
        } catch (error) {
            toast.error('حدث خطأ أثناء الحفظ. حاول مرة أخرى.');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword.length < 6) {
            toast.error('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
            return;
        }
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('كلمات المرور غير متطابقة');
            return;
        }
        setChangingPassword(true);
        try {
            await changePassword(passwordData.currentPassword, passwordData.newPassword);
            toast.success('تم تغيير كلمة المرور بنجاح! 🔒');
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                toast.error('كلمة المرور الحالية غير صحيحة');
            } else if (error.code === 'auth/weak-password') {
                toast.error('كلمة المرور الجديدة ضعيفة جداً');
            } else {
                toast.error('حدث خطأ أثناء تغيير كلمة المرور');
            }
        } finally {
            setChangingPassword(false);
        }
    };

    // Check if user signed in with Google (no password to change)
    const isGoogleUser = user?.providerData?.some(p => p.providerId === 'google.com');

    return (
        <div className="max-w-3xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
            >
                <h1 className="text-3xl font-black text-slate-900 mb-2">الملف الشخصي</h1>
                <p className="text-slate-500">قم بتعديل معلوماتك الشخصية وإدارة حسابك</p>
            </motion.div>

            {/* Profile Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden mb-6"
            >
                {/* Cover */}
                <div className="h-32 gradient-primary relative">
                    <div className="absolute -bottom-12 right-8">
                        <div className="w-24 h-24 rounded-2xl bg-white shadow-card flex items-center justify-center border-4 border-white">
                            {profile?.photoURL ? (
                                <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full rounded-xl object-cover" />
                            ) : (
                                <span className="text-4xl">👤</span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-16 pb-6 px-8">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">{formData.displayName || 'المستخدم'}</h2>
                            <p className="text-slate-400 flex items-center gap-1 mt-1">
                                <IoLocationOutline size={16} />
                                {formData.location || 'لم يتم تحديد الموقع'}
                            </p>
                            <div className="flex gap-2 mt-3">
                                <Badge variant="info">متطوع</Badge>
                                <Badge variant="success">نشط</Badge>
                            </div>
                        </div>
                        <Button
                            variant={isEditing ? 'primary' : 'outline'}
                            size="sm"
                            icon={isEditing ? <IoSaveOutline /> : <IoPencilOutline />}
                            onClick={isEditing ? handleSave : () => setIsEditing(true)}
                            loading={saving}
                        >
                            {isEditing ? 'حفظ' : 'تعديل'}
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Info Form */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6 space-y-5"
            >
                <h3 className="text-lg font-bold text-slate-800 mb-4">المعلومات الشخصية</h3>

                <Input
                    label="الاسم الكامل"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    icon={<IoPersonOutline size={18} />}
                    disabled={!isEditing}
                />

                <Input
                    label="البريد الإلكتروني"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    icon={<IoMailOutline size={18} />}
                    disabled
                />

                <Input
                    label="رقم الهاتف"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    icon={<IoCallOutline size={18} />}
                    disabled={!isEditing}
                />

                <Input
                    label="الموقع"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    icon={<IoLocationOutline size={18} />}
                    disabled={!isEditing}
                />

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">نبذة عني</label>
                    <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        disabled={!isEditing}
                        className="input-field min-h-[100px] resize-none disabled:opacity-60"
                        placeholder="اكتب نبذة مختصرة عن نفسك..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">المهارات (مفصولة بفاصلة)</label>
                    <input
                        value={formData.skills}
                        onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                        disabled={!isEditing}
                        className="input-field disabled:opacity-60"
                        placeholder="تعليم، تواصل، قيادة..."
                    />
                </div>
            </motion.div>

            {/* Change Password Section */}
            {!isGoogleUser && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6 mt-6"
                >
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <IoLockClosedOutline size={20} className="text-primary-500" />
                        تغيير كلمة المرور
                    </h3>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <Input
                            label="كلمة المرور الحالية"
                            type="password"
                            placeholder="••••••••"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            icon={<IoLockClosedOutline size={18} />}
                            required
                        />
                        <Input
                            label="كلمة المرور الجديدة"
                            type="password"
                            placeholder="••••••••"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            icon={<IoLockClosedOutline size={18} />}
                            required
                        />
                        <Input
                            label="تأكيد كلمة المرور الجديدة"
                            type="password"
                            placeholder="••••••••"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            icon={<IoLockClosedOutline size={18} />}
                            required
                        />
                        {passwordData.newPassword && passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                            <p className="text-sm text-danger-500">كلمات المرور غير متطابقة</p>
                        )}
                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            loading={changingPassword}
                            icon={<IoLockClosedOutline size={16} />}
                        >
                            تغيير كلمة المرور
                        </Button>
                    </form>
                </motion.div>
            )}

            {/* Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl shadow-soft border border-slate-100 p-6 mt-6"
            >
                <h3 className="text-lg font-bold text-slate-800 mb-4">إحصائيات التطوع</h3>
                <div className="grid grid-cols-3 gap-6 text-center">
                    <div>
                        <p className="text-3xl font-black text-primary-600">{stats.total}</p>
                        <p className="text-sm text-slate-500 mt-1">طلب تقديم</p>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-success-600">{stats.accepted}</p>
                        <p className="text-sm text-slate-500 mt-1">مشاركة مقبولة</p>
                    </div>
                    <div>
                        <p className="text-3xl font-black text-warning-600">٠</p>
                        <p className="text-sm text-slate-500 mt-1">شهادات</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

