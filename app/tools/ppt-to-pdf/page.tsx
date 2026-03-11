'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { IoCloudUploadOutline, IoDocumentOutline, IoDownloadOutline, IoArrowBackOutline } from 'react-icons/io5';
import Link from 'next/link';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';

export default function PptToPdfPage() {
    const [file, setFile] = useState<File | null>(null);
    const [converting, setConverting] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const handleFile = (f: File) => {
        if (f.name.match(/\.(pptx|ppt)$/i)) {
            setFile(f);
        } else {
            alert('يرجى اختيار ملف PowerPoint (.pptx)');
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
            const JSZip = (await import('jszip')).default;
            const { jsPDF } = await import('jspdf');
            const html2canvas = (await import('html2canvas')).default;

            const arrayBuffer = await file.arrayBuffer();
            const zip = await JSZip.loadAsync(arrayBuffer);

            // Get sorted slide files
            const slideFiles = Object.keys(zip.files)
                .filter(name => name.match(/^ppt\/slides\/slide\d+\.xml$/i))
                .sort((a, b) => {
                    const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
                    const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
                    return numA - numB;
                });

            // Extract all media images
            const imageFiles = Object.keys(zip.files)
                .filter(name => name.startsWith('ppt/media/') && name.match(/\.(png|jpg|jpeg|gif|bmp)$/i))
                .sort();

            const imageUrls: string[] = [];
            for (const imgPath of imageFiles) {
                const blob = await zip.files[imgPath].async('blob');
                imageUrls.push(URL.createObjectURL(blob));
            }

            // Extract text from each slide
            const slideTexts: string[] = [];
            for (const slidePath of slideFiles) {
                const xml = await zip.files[slidePath].async('text');
                const textMatches = xml.match(/<a:t>([^<]+)<\/a:t>/g);
                if (textMatches) {
                    slideTexts.push(textMatches.map(m => m.replace(/<[^>]+>/g, '')).join(' '));
                } else {
                    slideTexts.push('');
                }
            }

            // Create PDF — each slide = separate page
            const pdf = new jsPDF('l', 'mm', 'a4'); // landscape like slides
            let isFirstPage = true;

            for (let i = 0; i < slideTexts.length; i++) {
                // Create isolated container for this slide
                const container = document.createElement('div');
                container.style.cssText = 'position:fixed;left:-10000px;top:0;z-index:-9999;background:white;width:960px;height:540px;display:flex;align-items:center;justify-content:center;padding:40px;font-family:Arial,sans-serif;';
                container.innerHTML = `
                    <div style="text-align:center;width:100%;">
                        <div style="font-size:10pt;color:#94a3b8;font-weight:700;margin-bottom:12px;">Slide ${i + 1}</div>
                        <div style="font-size:16pt;line-height:1.8;color:#1e293b;">${slideTexts[i]}</div>
                    </div>
                `;
                document.body.appendChild(container);

                await new Promise(resolve => setTimeout(resolve, 200));

                const canvas = await html2canvas(container, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: '#ffffff',
                    width: 960,
                    height: 540,
                });

                const imgData = canvas.toDataURL('image/jpeg', 0.92);

                if (!isFirstPage) pdf.addPage();
                isFirstPage = false;

                pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210); // A4 landscape

                document.body.removeChild(container);
            }

            // Add images as separate pages at the end
            for (const url of imageUrls) {
                const img = new Image();
                await new Promise<void>((resolve) => {
                    img.onload = () => resolve();
                    img.onerror = () => resolve();
                    img.src = url;
                });

                if (img.naturalWidth > 0) {
                    pdf.addPage();
                    const imgW = 297;
                    const imgH = (img.naturalHeight * imgW) / img.naturalWidth;
                    const finalH = Math.min(imgH, 210);
                    const y = (210 - finalH) / 2;
                    pdf.addImage(url, 'JPEG', 0, y, imgW, finalH);
                }
            }

            pdf.save(file.name.replace(/\.(pptx|ppt)$/i, '') + '.pdf');

            // Cleanup
            imageUrls.forEach(url => URL.revokeObjectURL(url));
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
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-2xl mb-4">
                            <IoDocumentOutline size={32} className="text-orange-600" />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">PowerPoint ← PDF</h1>
                        <p className="text-slate-500">حوّل عروض PowerPoint إلى PDF</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${dragOver ? 'border-orange-500 bg-orange-50' : file ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-white hover:border-orange-300'
                            }`}
                        onClick={() => document.getElementById('file-input')?.click()}
                    >
                        <input id="file-input" type="file" accept=".pptx,.ppt" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                        {file ? (
                            <div>
                                <IoDocumentOutline size={40} className="text-green-500 mx-auto mb-3" />
                                <p className="font-bold text-slate-800">{file.name}</p>
                                <p className="text-sm text-slate-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                        ) : (
                            <div>
                                <IoCloudUploadOutline size={48} className="text-slate-300 mx-auto mb-3" />
                                <p className="font-bold text-slate-600 mb-1">اسحب ملف PowerPoint هنا</p>
                                <p className="text-sm text-slate-400">أو اضغط لاختيار ملف (.pptx)</p>
                            </div>
                        )}
                    </motion.div>

                    {file && (
                        <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            onClick={handleConvert} disabled={converting}
                            className="w-full mt-6 flex items-center justify-center gap-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white py-4 rounded-2xl text-lg font-bold hover:shadow-xl transition-all disabled:opacity-50">
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
