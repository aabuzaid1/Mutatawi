'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { IoCloudUploadOutline, IoImageOutline, IoDownloadOutline, IoArrowBackOutline } from 'react-icons/io5';
import Link from 'next/link';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { useAuth } from '@/app/hooks/useAuth';

export default function PdfToImagePage() {
    const { user } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [converting, setConverting] = useState(false);
    const [images, setImages] = useState<string[]>([]);
    const [dragOver, setDragOver] = useState(false);

    const handleFile = (f: File) => {
        if (f.type === 'application/pdf' || f.name.endsWith('.pdf')) {
            setFile(f);
            setImages([]);
        } else {
            alert('يرجى اختيار ملف PDF');
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    }, []);

    const handleConvert = async () => {
        if (!file) return;
        setConverting(true);
        try {
            const pdfjsLib = await import('pdfjs-dist');
            pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const pageImages: string[] = [];

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const scale = 2; // High quality
                const viewport = page.getViewport({ scale });
                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                const ctx = canvas.getContext('2d')!;
                await page.render({ canvasContext: ctx, viewport, canvas }).promise;
                pageImages.push(canvas.toDataURL('image/png'));
            }

            setImages(pageImages);
        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء التحويل');
        } finally {
            setConverting(false);
        }
    };

    const downloadImage = (dataUrl: string, index: number) => {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `${file?.name.replace('.pdf', '')}_page_${index + 1}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const downloadAll = () => {
        images.forEach((img, i) => {
            setTimeout(() => downloadImage(img, i), i * 300);
        });
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
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-2xl mb-4">
                            <IoImageOutline size={32} className="text-pink-600" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">PDF → صورة</h1>
                        <p className="text-slate-500">حوّل كل صفحة PDF إلى صورة PNG بجودة عالية</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${dragOver ? 'border-pink-500 bg-pink-50' : file ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-white hover:border-pink-300'
                            }`}
                        onClick={() => document.getElementById('file-input')?.click()}
                    >
                        <input id="file-input" type="file" accept=".pdf" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                        {file ? (
                            <div>
                                <IoImageOutline size={40} className="text-green-500 mx-auto mb-3" />
                                <p className="font-bold text-slate-800">{file.name}</p>
                                <p className="text-sm text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                        ) : (
                            <div>
                                <IoCloudUploadOutline size={48} className="text-slate-300 mx-auto mb-3" />
                                <p className="font-bold text-slate-600 mb-1">اسحب ملف PDF هنا</p>
                                <p className="text-sm text-slate-400">أو اضغط لاختيار ملف (.pdf)</p>
                            </div>
                        )}
                    </motion.div>

                    {file && images.length === 0 && (
                        <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            onClick={handleConvert} disabled={converting}
                            className="w-full mt-6 flex items-center justify-center gap-3 bg-gradient-to-r from-pink-600 to-rose-600 text-white py-4 rounded-2xl text-lg font-bold hover:shadow-xl transition-all disabled:opacity-50">
                            {converting ? 'جاري التحويل...' : <><IoDownloadOutline size={22} /> تحويل إلى صور</>}
                        </motion.button>
                    )}

                    {/* Results */}
                    {images.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-bold text-slate-800">الصور المُنتجة ({images.length})</h2>
                                <button onClick={downloadAll} className="text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                                    <IoDownloadOutline size={16} /> تحميل الكل
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {images.map((img, i) => (
                                    <div key={i} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden group">
                                        <img src={img} alt={`Page ${i + 1}`} className="w-full" />
                                        <button onClick={() => downloadImage(img, i)}
                                            className="w-full py-2.5 text-sm font-bold text-primary-600 hover:bg-primary-50 transition-colors flex items-center justify-center gap-1.5">
                                            <IoDownloadOutline size={16} /> صفحة {i + 1}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
