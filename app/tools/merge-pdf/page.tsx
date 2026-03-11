'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { IoCloudUploadOutline, IoDocumentOutline, IoDownloadOutline, IoArrowBackOutline, IoAddOutline, IoCloseOutline, IoReorderThreeOutline } from 'react-icons/io5';
import Link from 'next/link';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { useAuth } from '@/app/hooks/useAuth';

export default function MergePdfPage() {
    const { user } = useAuth();
    const [files, setFiles] = useState<File[]>([]);
    const [merging, setMerging] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const handleFiles = (fileList: FileList) => {
        const pdfFiles = Array.from(fileList).filter(
            f => f.type === 'application/pdf' || f.name.endsWith('.pdf')
        );
        if (pdfFiles.length > 0) {
            setFiles(prev => [...prev, ...pdfFiles]);
        } else {
            alert('يرجى اختيار ملفات PDF فقط');
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
    }, []);

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const moveFile = (from: number, to: number) => {
        if (to < 0 || to >= files.length) return;
        const updated = [...files];
        const [moved] = updated.splice(from, 1);
        updated.splice(to, 0, moved);
        setFiles(updated);
    };

    const handleMerge = async () => {
        if (files.length < 2) {
            alert('يرجى إضافة ملفين PDF على الأقل');
            return;
        }
        setMerging(true);
        try {
            const { PDFDocument } = await import('pdf-lib');
            const mergedPdf = await PDFDocument.create();

            for (const file of files) {
                const arrayBuffer = await file.arrayBuffer();
                const sourcePdf = await PDFDocument.load(arrayBuffer, {
                    ignoreEncryption: true,
                });

                const pageCount = sourcePdf.getPageCount();

                for (let i = 0; i < pageCount; i++) {
                    // Embed the source page as a form XObject
                    const [embeddedPage] = await mergedPdf.embedPdf(sourcePdf, [i]);

                    // Get exact source page dimensions
                    const sourcePage = sourcePdf.getPage(i);
                    const { width, height } = sourcePage.getSize();
                    const rotation = sourcePage.getRotation().angle;

                    // Create a new blank page matching exact source dimensions
                    let pageWidth = width;
                    let pageHeight = height;
                    // Handle rotated pages
                    if (rotation === 90 || rotation === 270) {
                        pageWidth = height;
                        pageHeight = width;
                    }

                    const newPage = mergedPdf.addPage([pageWidth, pageHeight]);

                    // Draw the embedded page at full size
                    newPage.drawPage(embeddedPage, {
                        x: 0,
                        y: 0,
                        width: pageWidth,
                        height: pageHeight,
                    });
                }
            }

            const mergedBytes = await mergedPdf.save();
            const blob = new Blob([mergedBytes as BlobPart], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'merged.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء الدمج');
        } finally {
            setMerging(false);
        }
    };

    if (user === null) {
        return (
            <>
                <Navbar />
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <p className="text-slate-400 text-lg mb-4">يرجى تسجيل الدخول أولاً لاستخدام هذه الأداة</p>
                        <Link href="/login" className="text-primary-600 hover:underline font-bold">تسجيل الدخول</Link>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-24 pb-16">
                <div className="max-w-2xl mx-auto px-4 sm:px-6">
                    <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 font-medium mb-6 transition-colors">
                        <IoArrowBackOutline size={16} /> العودة للأدوات
                    </Link>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-2xl mb-4">
                            <IoDocumentOutline size={32} className="text-red-600" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">دمج PDF</h1>
                        <p className="text-slate-500">ادمج عدة ملفات PDF في ملف واحد</p>
                    </motion.div>

                    {/* Upload Area */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${dragOver ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-white hover:border-red-300'
                            }`}
                        onClick={() => document.getElementById('file-input')?.click()}
                    >
                        <input id="file-input" type="file" accept=".pdf" multiple className="hidden"
                            onChange={e => e.target.files && handleFiles(e.target.files)} />
                        <IoCloudUploadOutline size={48} className="text-slate-300 mx-auto mb-3" />
                        <p className="font-bold text-slate-600 mb-1">اسحب ملفات PDF هنا</p>
                        <p className="text-sm text-slate-400">أو اضغط لاختيار ملفات (يمكنك اختيار عدة ملفات)</p>
                    </motion.div>

                    {/* File List */}
                    {files.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-slate-800 text-sm">{files.length} ملفات PDF</h3>
                                <button
                                    onClick={() => document.getElementById('file-input')?.click()}
                                    className="text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                                >
                                    <IoAddOutline size={16} /> إضافة المزيد
                                </button>
                            </div>
                            <div className="space-y-2">
                                {files.map((f, i) => (
                                    <div key={`${f.name}-${i}`} className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 shadow-sm p-3">
                                        <span className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                                            <span className="text-xs font-bold text-red-600">{i + 1}</span>
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-800 truncate">{f.name}</p>
                                            <p className="text-xs text-slate-400">{(f.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => moveFile(i, i - 1)} disabled={i === 0}
                                                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 disabled:opacity-30 text-xs">
                                                ▲
                                            </button>
                                            <button onClick={() => moveFile(i, i + 1)} disabled={i === files.length - 1}
                                                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 disabled:opacity-30 text-xs">
                                                ▼
                                            </button>
                                            <button onClick={() => removeFile(i)}
                                                className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-red-400 hover:text-red-600">
                                                <IoCloseOutline size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {files.length >= 2 && (
                        <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            onClick={handleMerge} disabled={merging}
                            className="w-full mt-6 flex items-center justify-center gap-3 bg-gradient-to-r from-red-600 to-rose-600 text-white py-4 rounded-2xl text-lg font-bold hover:shadow-xl transition-all disabled:opacity-50">
                            {merging ? 'جاري الدمج...' : <><IoDownloadOutline size={22} /> دمج وتحميل</>}
                        </motion.button>
                    )}

                    {files.length === 1 && (
                        <p className="text-center text-sm text-amber-600 mt-4 font-medium">أضف ملف PDF آخر على الأقل للدمج</p>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
