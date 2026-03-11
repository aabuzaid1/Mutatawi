'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { IoCloudUploadOutline, IoImageOutline, IoDownloadOutline, IoArrowBackOutline, IoCloseOutline, IoAddOutline } from 'react-icons/io5';
import Link from 'next/link';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { useAuth } from '@/app/hooks/useAuth';

export default function ImageToPdfPage() {
    const { user } = useAuth();
    const [files, setFiles] = useState<{ file: File; preview: string }[]>([]);
    const [converting, setConverting] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const handleFiles = (fileList: FileList) => {
        const newFiles: { file: File; preview: string }[] = [];
        Array.from(fileList).forEach(f => {
            if (f.type.startsWith('image/')) {
                newFiles.push({ file: f, preview: URL.createObjectURL(f) });
            }
        });
        if (newFiles.length > 0) {
            setFiles(prev => [...prev, ...newFiles]);
        } else {
            alert('يرجى اختيار صور فقط');
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
    }, []);

    const removeFile = (index: number) => {
        setFiles(prev => {
            URL.revokeObjectURL(prev[index].preview);
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleConvert = async () => {
        if (files.length === 0) return;
        setConverting(true);
        try {
            const { jsPDF } = await import('jspdf');

            // Load all images first
            const loadedImages = await Promise.all(
                files.map(({ file }) => {
                    return new Promise<HTMLImageElement>((resolve) => {
                        const img = new Image();
                        img.onload = () => resolve(img);
                        img.src = URL.createObjectURL(file);
                    });
                })
            );

            // Create PDF with first image dimensions
            const firstImg = loadedImages[0];
            const pdf = new jsPDF({
                orientation: firstImg.width > firstImg.height ? 'landscape' : 'portrait',
                unit: 'px',
                format: [firstImg.width, firstImg.height],
            });

            loadedImages.forEach((img, i) => {
                if (i > 0) {
                    pdf.addPage([img.width, img.height], img.width > img.height ? 'landscape' : 'portrait');
                }
                pdf.addImage(img, 'JPEG', 0, 0, img.width, img.height);
            });

            pdf.save('images.pdf');
        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء التحويل');
        } finally {
            setConverting(false);
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
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-100 rounded-2xl mb-4">
                            <IoImageOutline size={32} className="text-cyan-600" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">صورة → PDF</h1>
                        <p className="text-slate-500">ادمج عدة صور في ملف PDF واحد</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${dragOver ? 'border-cyan-500 bg-cyan-50' : files.length > 0 ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-white hover:border-cyan-300'
                            }`}
                        onClick={() => document.getElementById('file-input')?.click()}
                    >
                        <input id="file-input" type="file" accept="image/*" multiple className="hidden"
                            onChange={e => e.target.files && handleFiles(e.target.files)} />
                        <IoCloudUploadOutline size={48} className="text-slate-300 mx-auto mb-3" />
                        <p className="font-bold text-slate-600 mb-1">اسحب الصور هنا</p>
                        <p className="text-sm text-slate-400">أو اضغط لاختيار صور (يمكنك اختيار عدة صور)</p>
                    </motion.div>

                    {/* Image previews */}
                    {files.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-bold text-slate-800 text-sm">{files.length} صور مختارة</h3>
                                <button
                                    onClick={() => document.getElementById('file-input')?.click()}
                                    className="text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
                                >
                                    <IoAddOutline size={16} /> إضافة المزيد
                                </button>
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {files.map((f, i) => (
                                    <div key={i} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-white">
                                        <img src={f.preview} alt={f.file.name} className="w-full h-24 object-cover" />
                                        <button onClick={() => removeFile(i)}
                                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <IoCloseOutline size={14} />
                                        </button>
                                        <p className="text-[10px] text-slate-400 text-center py-1 truncate px-1">{i + 1}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {files.length > 0 && (
                        <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            onClick={handleConvert} disabled={converting}
                            className="w-full mt-6 flex items-center justify-center gap-3 bg-gradient-to-r from-cyan-600 to-teal-600 text-white py-4 rounded-2xl text-lg font-bold hover:shadow-xl transition-all disabled:opacity-50">
                            {converting ? 'جاري التحويل...' : <><IoDownloadOutline size={22} /> تحويل إلى PDF</>}
                        </motion.button>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
