'use client';

import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { IoCloudUploadOutline, IoDocumentOutline, IoDownloadOutline, IoArrowBackOutline } from 'react-icons/io5';
import Link from 'next/link';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';

export default function ExcelToPdfPage() {
    const [file, setFile] = useState<File | null>(null);
    const [converting, setConverting] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const handleFile = (f: File) => {
        if (f.name.match(/\.(xlsx|xls|csv)$/i)) {
            setFile(f);
        } else {
            alert('يرجى اختيار ملف Excel (.xlsx, .xls, .csv)');
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
            const XLSX = await import('xlsx');
            const { jsPDF } = await import('jspdf');
            const html2canvas = (await import('html2canvas')).default;

            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });

            const pdf = new jsPDF('l', 'mm', 'a4'); // landscape for tables
            let isFirstPage = true;

            // Render each sheet as its own page
            for (const sheetName of workbook.SheetNames) {
                const sheet = workbook.Sheets[sheetName];
                const sheetHtml = XLSX.utils.sheet_to_html(sheet);

                // Create isolated container for this sheet
                const container = document.createElement('div');
                container.style.cssText = 'position:fixed;left:-10000px;top:0;z-index:-9999;background:white;width:1100px;padding:20px;font-family:Arial,sans-serif;font-size:10pt;';
                container.innerHTML = `<h2 style="margin:0 0 10px;font-size:14pt;color:#1e293b;">${sheetName}</h2>${sheetHtml}`;

                // Style tables
                const style = document.createElement('style');
                style.textContent = 'table{border-collapse:collapse;width:100%}td,th{border:1px solid #d1d5db;padding:6px 10px;text-align:left}th{background:#f1f5f9;font-weight:700}tr:nth-child(even){background:#f8fafc}';
                container.prepend(style);
                document.body.appendChild(container);

                await new Promise(resolve => setTimeout(resolve, 300));

                const canvas = await html2canvas(container, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                });

                const imgData = canvas.toDataURL('image/jpeg', 0.92);
                const pageW = 297; // A4 landscape
                const pageH = 210;
                const imgW = pageW;
                const imgH = (canvas.height * pageW) / canvas.width;

                if (!isFirstPage) pdf.addPage();
                isFirstPage = false;

                // If sheet fits in one page, add directly
                if (imgH <= pageH) {
                    pdf.addImage(imgData, 'JPEG', 0, 0, imgW, imgH);
                } else {
                    // For very long sheets, add as full-height page
                    pdf.internal.pageSize.height = imgH;
                    pdf.addImage(imgData, 'JPEG', 0, 0, imgW, imgH);
                }

                document.body.removeChild(container);
            }

            pdf.save(file.name.replace(/\.(xlsx|xls|csv)$/i, '') + '.pdf');
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
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-4">
                            <IoDocumentOutline size={32} className="text-green-600" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Excel ← PDF</h1>
                        <p className="text-slate-500">حوّل جداول Excel إلى PDF</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${dragOver ? 'border-green-500 bg-green-50' : file ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-white hover:border-green-300'
                            }`}
                        onClick={() => document.getElementById('file-input')?.click()}
                    >
                        <input id="file-input" type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                        {file ? (
                            <div>
                                <IoDocumentOutline size={40} className="text-green-500 mx-auto mb-3" />
                                <p className="font-bold text-slate-800">{file.name}</p>
                                <p className="text-sm text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                        ) : (
                            <div>
                                <IoCloudUploadOutline size={48} className="text-slate-300 mx-auto mb-3" />
                                <p className="font-bold text-slate-600 mb-1">اسحب ملف Excel هنا</p>
                                <p className="text-sm text-slate-400">أو اضغط لاختيار ملف (.xlsx, .xls, .csv)</p>
                            </div>
                        )}
                    </motion.div>

                    {file && (
                        <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            onClick={handleConvert} disabled={converting}
                            className="w-full mt-6 flex items-center justify-center gap-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-2xl text-lg font-bold hover:shadow-xl transition-all disabled:opacity-50">
                            {converting ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                    جاري التحويل...
                                </span>
                            ) : <><IoDownloadOutline size={22} /> تحويل وتحميل PDF</>}
                        </motion.button>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
