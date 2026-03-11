'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    IoRibbonOutline,
    IoDownloadOutline,
    IoArrowBackOutline,
    IoCheckmarkCircle,
} from 'react-icons/io5';
import Link from 'next/link';
import { useAuth } from '@/app/hooks/useAuth';
import { syncVolunteerStats } from '@/app/lib/firestore';
import LoadingSpinner from '@/app/components/shared/LoadingSpinner';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';

interface CompletedOpp {
    opportunityId: string;
    opportunityTitle: string;
    date: string;
    duration: number;
}

function generateCertificateHTML(volunteerName: string, opportunityTitle: string, date: string, duration: number, logoUrl: string) {
    return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
        <meta charset="UTF-8">
        <title>شهادة تطوع - ${volunteerName}</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Tajawal', sans-serif; }
            @media print {
                body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .no-print { display: none !important; }
            }
            .certificate {
                width: 297mm;
                height: 210mm;
                position: relative;
                background: linear-gradient(135deg, #f8fafc, #eef2ff, #f0fdf4);
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                page-break-after: always;
            }
            .border-frame {
                position: absolute;
                inset: 12mm;
                border: 3px solid #6366f1;
                border-radius: 16px;
                pointer-events: none;
            }
            .border-frame::before {
                content: '';
                position: absolute;
                inset: 4px;
                border: 1px solid #c7d2fe;
                border-radius: 14px;
            }
            .corner-ornament {
                position: absolute;
                width: 50px;
                height: 50px;
                border: 3px solid #6366f1;
                opacity: 0.3;
            }
            .corner-ornament.tl { top: 16mm; right: 16mm; border-bottom: none; border-left: none; border-radius: 0 8px 0 0; }
            .corner-ornament.tr { top: 16mm; left: 16mm; border-bottom: none; border-right: none; border-radius: 8px 0 0 0; }
            .corner-ornament.bl { bottom: 16mm; right: 16mm; border-top: none; border-left: none; border-radius: 0 0 0 8px; }
            .corner-ornament.br { bottom: 16mm; left: 16mm; border-top: none; border-right: none; border-radius: 0 0 8px 0; }
            .content {
                text-align: center;
                padding: 20mm 40mm;
                position: relative;
                z-index: 1;
            }
            .logo { width: 60px; height: 60px; border-radius: 12px; margin: 0 auto 10px; }
            .platform-name { font-size: 14px; color: #6366f1; font-weight: 800; letter-spacing: 2px; margin-bottom: 20px; }
            .cert-title { font-size: 32px; font-weight: 900; color: #1e293b; margin-bottom: 8px; }
            .underline { width: 100px; height: 3px; background: linear-gradient(to left, #6366f1, #8b5cf6); margin: 0 auto 24px; border-radius: 2px; }
            .awarded-to { font-size: 16px; color: #64748b; margin-bottom: 8px; }
            .volunteer-name { font-size: 36px; font-weight: 900; color: #6366f1; margin-bottom: 16px; }
            .for-text { font-size: 15px; color: #64748b; margin-bottom: 6px; }
            .opp-title { font-size: 22px; font-weight: 700; color: #1e293b; margin-bottom: 20px; }
            .details { display: flex; justify-content: center; gap: 40px; font-size: 14px; color: #475569; margin-bottom: 28px; }
            .details span { display: flex; align-items: center; gap: 6px; }
            .signature-area { display: flex; justify-content: center; gap: 80px; margin-top: 10px; }
            .sig-block { text-align: center; }
            .sig-line { width: 140px; height: 1px; background: #cbd5e1; margin: 0 auto 6px; }
            .sig-label { font-size: 12px; color: #94a3b8; }
            .footer-text { position: absolute; bottom: 18mm; left: 0; right: 0; text-align: center; font-size: 11px; color: #94a3b8; }
            .btn-print {
                display: block; margin: 20px auto; padding: 12px 40px;
                background: #6366f1; color: white; border: none; border-radius: 12px;
                font-size: 16px; font-weight: 700; cursor: pointer; font-family: 'Tajawal';
            }
            .btn-print:hover { background: #4f46e5; }
        </style>
    </head>
    <body>
        <div class="certificate">
            <div class="border-frame"></div>
            <div class="corner-ornament tl"></div>
            <div class="corner-ornament tr"></div>
            <div class="corner-ornament bl"></div>
            <div class="corner-ornament br"></div>
            <div class="content">
                <img src="${logoUrl}" alt="متطوع" class="logo" onerror="this.style.display='none'" />
                <div class="platform-name">منصة متطوع — MUTATAWI</div>
                <h1 class="cert-title">شهادة تطوع</h1>
                <div class="underline"></div>
                <p class="awarded-to">تشهد منصة متطوع بأن</p>
                <h2 class="volunteer-name">${volunteerName}</h2>
                <p class="for-text">قد أتمّ بنجاح المشاركة في الفرصة التطوعية</p>
                <h3 class="opp-title">"${opportunityTitle}"</h3>
                <div class="details">
                    <span>📅 التاريخ: ${new Date(date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    <span>⏱️ المدة: ${duration} ${duration === 1 ? 'ساعة' : 'ساعات'}</span>
                </div>
                <div class="signature-area">
                    <div class="sig-block">
                        <div class="sig-line"></div>
                        <p class="sig-label">إدارة منصة متطوع</p>
                    </div>
                </div>
            </div>
            <p class="footer-text">mutatawi.com — شهادة إلكترونية صادرة من منصة متطوع © ${new Date().getFullYear()}</p>
        </div>
        <button class="btn-print no-print" onclick="window.print()">🖨️ طباعة / تحميل PDF</button>
    </body>
    </html>`;
}

export default function CertificatePage() {
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(true);
    const [completedOpps, setCompletedOpps] = useState<CompletedOpp[]>([]);

    useEffect(() => {
        async function load() {
            if (!user) return;
            try {
                const stats = await syncVolunteerStats(user.uid);
                setCompletedOpps(
                    stats.completedApps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                );
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [user]);

    const handlePrintCertificate = (opp: CompletedOpp) => {
        const volunteerName = profile?.displayName || 'متطوع';
        const html = generateCertificateHTML(volunteerName, opp.opportunityTitle, opp.date, opp.duration, window.location.origin + '/logo.png');
        const win = window.open('', '_blank');
        if (win) {
            win.document.write(html);
            win.document.close();
        }
    };

    if (!user) {
        return (
            <>
                <Navbar />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <p className="text-slate-400 text-lg mb-4">يرجى تسجيل الدخول أولاً</p>
                        <Link href="/login" className="text-primary-600 hover:underline font-bold">تسجيل الدخول</Link>
                    </div>
                </div>
            </>
        );
    }

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="flex items-center justify-center min-h-screen">
                    <LoadingSpinner size="lg" />
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-24 pb-16">
                <div className="max-w-4xl mx-auto px-4 sm:px-6">
                    <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 font-medium mb-6 transition-colors">
                        <IoArrowBackOutline size={16} />
                        العودة للأدوات
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-10"
                    >
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 rounded-2xl mb-4">
                            <IoRibbonOutline size={32} className="text-amber-600" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">شهادات التطوع</h1>
                        <p className="text-slate-500">اطبع شهادة تطوع رسمية لأي فرصة أكملتها</p>
                    </motion.div>

                    {completedOpps.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {completedOpps.map((opp, index) => (
                                <motion.div
                                    key={opp.opportunityId}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.08 }}
                                    className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-amber-200 transition-all p-5"
                                >
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                                            <IoCheckmarkCircle className="text-amber-600" size={22} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-slate-800 text-sm leading-relaxed">{opp.opportunityTitle}</h3>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {new Date(opp.date).toLocaleDateString('ar-SA', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                                {' · '}
                                                {opp.duration} {opp.duration === 1 ? 'ساعة' : 'ساعات'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handlePrintCertificate(opp)}
                                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white py-2.5 rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-amber-200 transition-all"
                                    >
                                        <IoDownloadOutline size={18} />
                                        طباعة الشهادة
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                            <IoRibbonOutline size={48} className="text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-400 text-lg font-medium">لم تكمل أي فرص تطوعية بعد</p>
                            <Link href="/opportunities" className="text-primary-600 hover:underline text-sm font-bold mt-3 inline-block">
                                استكشف الفرص المتاحة
                            </Link>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
