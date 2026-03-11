'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { IoCloudUploadOutline, IoDocumentOutline, IoDownloadOutline, IoArrowBackOutline } from 'react-icons/io5';
import Link from 'next/link';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';

export default function PdfToWordPage() {
    const [file, setFile] = useState<File | null>(null);
    const [converting, setConverting] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const handleFile = (f: File) => {
        if (f.type === 'application/pdf' || f.name.endsWith('.pdf')) {
            setFile(f);
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

            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                    .map((item: any) => item.str)
                    .join(' ');
                fullText += `Page ${i}\n${'='.repeat(40)}\n${pageText}\n\n`;
            }

            // Create downloadable .txt file (most reliable format)
            const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name.replace('.pdf', '') + '.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء التحويل');
        } finally {
            setConverting(false);
        }
    };

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-24 pb-16">
                <div className="max-w-2xl mx-auto px-4 sm:px-6">
                    <Link href="/tools" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 font-medium mb-6 transition-colors">
                        <IoArrowBackOutline size={16} /> العودة للأدوات
                    </Link>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl mb-4">
                            <IoDocumentOutline size={32} className="text-indigo-600" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">PDF → Word</h1>
                        <p className="text-slate-500">استخرج النص من ملفات PDF وحمّله كملف نصي</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${dragOver ? 'border-indigo-500 bg-indigo-50' : file ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-white hover:border-indigo-300'
                            }`}
                        onClick={() => document.getElementById('file-input')?.click()}
                    >
                        <input id="file-input" type="file" accept=".pdf" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                        {file ? (
                            <div>
                                <IoDocumentOutline size={40} className="text-green-500 mx-auto mb-3" />
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

                    {file && (
                        <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            onClick={handleConvert} disabled={converting}
                            className="w-full mt-6 flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-4 rounded-2xl text-lg font-bold hover:shadow-xl transition-all disabled:opacity-50">
                            {converting ? 'جاري التحويل...' : <><IoDownloadOutline size={22} /> استخراج النص</>}
                        </motion.button>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
