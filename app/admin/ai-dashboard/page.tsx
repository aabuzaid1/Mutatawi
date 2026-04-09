'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    IoSparklesOutline,
    IoPeopleOutline,
    IoFlashOutline,
    IoWarningOutline,
    IoTrendingUpOutline,
    IoAddCircleOutline,
    IoPauseCircleOutline,
    IoPlayCircleOutline,
    IoSearchOutline,
    IoLogoWhatsapp,
    IoArrowBackOutline,
} from 'react-icons/io5';
import { useAuth } from '@/app/hooks/useAuth';
import { isSuperAdmin } from '@/app/lib/adminConfig';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface TokenAccount {
    userId: string;
    email: string;
    displayName: string;
    totalTokens: number;
    usedTokens: number;
    remainingTokens: number;
    dailyRequestCount: number;
    suspended: boolean;
    lastUsed: string | null;
}

interface DashboardStats {
    totalUsers: number;
    activeToday: number;
    depleted: number;
    totalUsedTokens: number;
    totalRemainingTokens: number;
}

export default function AIDashboardPage() {
    const { user, profile } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [accounts, setAccounts] = useState<TokenAccount[]>([]);
    const [abuseFlags, setAbuseFlags] = useState<TokenAccount[]>([]);
    const [topUsers, setTopUsers] = useState<TokenAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'active' | 'depleted' | 'suspended'>('all');
    const [grantModal, setGrantModal] = useState<{ open: boolean; userId: string; name: string }>({ open: false, userId: '', name: '' });
    const [grantAmount, setGrantAmount] = useState('');
    const [grantReason, setGrantReason] = useState('');

    const isAllowed = user && profile?.email && isSuperAdmin(profile.email);

    useEffect(() => {
        if (!isAllowed) return;
        fetchDashboard();
    }, [isAllowed]);

    async function fetchDashboard() {
        try {
            const token = await user!.getIdToken();
            const res = await fetch('/api/admin/ai-dashboard', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            setStats(data.stats);
            setAccounts(data.accounts);
            setTopUsers(data.topUsers);
            setAbuseFlags(data.abuseFlags);
        } catch (err) {
            console.error(err);
            toast.error('خطأ في تحميل البيانات');
        } finally {
            setLoading(false);
        }
    }

    async function handleGrantTokens() {
        if (!grantAmount || parseInt(grantAmount) <= 0) return;
        try {
            const token = await user!.getIdToken();
            const res = await fetch('/api/admin/ai-dashboard', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: grantModal.userId,
                    amount: parseInt(grantAmount),
                    reason: grantReason || undefined,
                }),
            });
            if (res.ok) {
                toast.success(`تم إضافة ${grantAmount} توكن`);
                setGrantModal({ open: false, userId: '', name: '' });
                setGrantAmount('');
                setGrantReason('');
                fetchDashboard();
            }
        } catch { toast.error('خطأ'); }
    }

    async function handleToggleSuspend(userId: string, suspend: boolean) {
        try {
            const token = await user!.getIdToken();
            await fetch('/api/admin/ai-dashboard', {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, suspended: suspend }),
            });
            toast.success(suspend ? 'تم الإيقاف' : 'تم التفعيل');
            fetchDashboard();
        } catch { toast.error('خطأ'); }
    }

    if (!isAllowed) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center p-8">
                    <IoWarningOutline size={48} className="text-red-400 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-slate-800 mb-2">غير مصرح</h1>
                    <p className="text-slate-500 mb-4">هذه الصفحة متاحة لـ Super Admin فقط</p>
                    <Link href="/" className="text-primary-600 font-bold">العودة للرئيسية</Link>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
            </div>
        );
    }

    const filteredAccounts = accounts.filter(a => {
        const matchSearch = !search || a.displayName.includes(search) || a.email.includes(search);
        const matchFilter =
            filter === 'all' ? true :
            filter === 'depleted' ? a.remainingTokens <= 0 :
            filter === 'suspended' ? a.suspended :
            filter === 'active' ? a.remainingTokens > 0 && !a.suspended : true;
        return matchSearch && matchFilter;
    });

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Link href="/admin/courses" className="p-2 hover:bg-white rounded-xl">
                        <IoArrowBackOutline size={20} className="rotate-180" />
                    </Link>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                            <IoSparklesOutline className="text-primary-600" />
                            لوحة تحكم AI Agent
                        </h1>
                        <p className="text-sm text-slate-500">إدارة التوكنات والمستخدمين</p>
                    </div>
                </div>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                        <StatCard icon={IoPeopleOutline} label="إجمالي المستخدمين" value={stats.totalUsers} color="blue" />
                        <StatCard icon={IoTrendingUpOutline} label="نشطون اليوم" value={stats.activeToday} color="green" />
                        <StatCard icon={IoWarningOutline} label="خلص رصيدهم" value={stats.depleted} color="red" />
                        <StatCard icon={IoFlashOutline} label="توكنات مستهلكة" value={stats.totalUsedTokens.toLocaleString()} color="amber" />
                    </div>
                )}

                {/* Abuse Flags */}
                {abuseFlags.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
                        <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2">
                            <IoWarningOutline size={18} /> تنبيهات الاستخدام
                        </h3>
                        {abuseFlags.map(u => (
                            <p key={u.userId} className="text-sm text-red-700">
                                ⚠️ {u.displayName} ({u.email}) — {u.dailyRequestCount}/20 طلب اليوم
                            </p>
                        ))}
                    </div>
                )}

                {/* Top Users */}
                {topUsers.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 mb-6">
                        <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <IoTrendingUpOutline size={18} className="text-amber-600" /> أكثر استهلاكاً
                        </h3>
                        <div className="space-y-2">
                            {topUsers.slice(0, 5).map((u, i) => (
                                <div key={u.userId} className="flex items-center gap-3 text-sm">
                                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-[11px]">
                                        {i + 1}
                                    </span>
                                    <span className="flex-1 truncate text-slate-700">{u.displayName}</span>
                                    <span className="font-bold text-slate-800">{u.usedTokens?.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Users Table */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    {/* Filters */}
                    <div className="p-4 border-b border-slate-100 flex flex-wrap gap-3">
                        <div className="relative flex-1 min-w-[200px]">
                            <IoSearchOutline size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="بحث بالاسم أو الإيميل..."
                                className="w-full pr-9 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary-300"
                            />
                        </div>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as any)}
                            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                        >
                            <option value="all">الكل</option>
                            <option value="active">نشطين</option>
                            <option value="depleted">خلص رصيدهم</option>
                            <option value="suspended">موقوفين</option>
                        </select>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-slate-600">
                                <tr>
                                    <th className="text-right px-4 py-3 font-medium">المستخدم</th>
                                    <th className="text-right px-4 py-3 font-medium hidden sm:table-cell">الرصيد</th>
                                    <th className="text-right px-4 py-3 font-medium hidden md:table-cell">مستهلك</th>
                                    <th className="text-right px-4 py-3 font-medium hidden lg:table-cell">آخر استخدام</th>
                                    <th className="text-right px-4 py-3 font-medium">الحالة</th>
                                    <th className="text-right px-4 py-3 font-medium">إجراء</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAccounts.map(a => (
                                    <tr key={a.userId} className="border-t border-slate-50 hover:bg-slate-50">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-slate-800 truncate max-w-[140px]">{a.displayName}</p>
                                            <p className="text-[11px] text-slate-400 truncate max-w-[140px]">{a.email}</p>
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell">
                                            <span className={`font-bold ${a.remainingTokens <= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                                {a.remainingTokens?.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell text-slate-500">
                                            {a.usedTokens?.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 hidden lg:table-cell text-slate-400 text-xs">
                                            {a.lastUsed ? new Date(a.lastUsed).toLocaleDateString('ar-SA') : 'لم يستخدم'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${
                                                a.suspended ? 'bg-red-100 text-red-700' :
                                                a.remainingTokens <= 0 ? 'bg-amber-100 text-amber-700' :
                                                'bg-emerald-100 text-emerald-700'
                                            }`}>
                                                {a.suspended ? 'موقوف' : a.remainingTokens <= 0 ? 'منتهي' : 'نشط'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => setGrantModal({ open: true, userId: a.userId, name: a.displayName })}
                                                    className="p-1.5 hover:bg-emerald-100 rounded-lg text-emerald-600"
                                                    title="إضافة توكنات"
                                                >
                                                    <IoAddCircleOutline size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleSuspend(a.userId, !a.suspended)}
                                                    className={`p-1.5 rounded-lg ${a.suspended ? 'hover:bg-green-100 text-green-600' : 'hover:bg-red-100 text-red-500'}`}
                                                    title={a.suspended ? 'تفعيل' : 'إيقاف'}
                                                >
                                                    {a.suspended ? <IoPlayCircleOutline size={18} /> : <IoPauseCircleOutline size={18} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* WhatsApp Contact */}
                <div className="mt-6 bg-gradient-to-l from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-4 sm:p-5 flex items-center justify-between">
                    <div>
                        <p className="font-bold text-slate-800 text-sm">للتواصل لزيادة التوكنات</p>
                        <p className="text-xs text-slate-500 mt-0.5">00962790796457</p>
                    </div>
                    <a
                        href="https://wa.me/962790796457"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-colors"
                    >
                        <IoLogoWhatsapp size={18} />
                        واتساب
                    </a>
                </div>
            </div>

            {/* Grant Modal */}
            {grantModal.open && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-5"
                    >
                        <h3 className="font-bold text-slate-800 mb-4">
                            إضافة توكنات لـ {grantModal.name}
                        </h3>
                        <input
                            type="number"
                            value={grantAmount}
                            onChange={(e) => setGrantAmount(e.target.value)}
                            placeholder="عدد التوكنات"
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm mb-3 outline-none focus:border-primary-300"
                        />
                        <input
                            value={grantReason}
                            onChange={(e) => setGrantReason(e.target.value)}
                            placeholder="السبب (اختياري)"
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm mb-4 outline-none focus:border-primary-300"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleGrantTokens}
                                className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700"
                            >
                                إضافة
                            </button>
                            <button
                                onClick={() => setGrantModal({ open: false, userId: '', name: '' })}
                                className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-sm hover:bg-slate-200"
                            >
                                إلغاء
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
    const colors: Record<string, string> = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-emerald-50 text-emerald-600',
        red: 'bg-red-50 text-red-600',
        amber: 'bg-amber-50 text-amber-600',
    };
    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className={`w-10 h-10 rounded-xl ${colors[color]} flex items-center justify-center mb-3`}>
                <Icon size={20} />
            </div>
            <p className="text-2xl font-black text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
        </div>
    );
}
