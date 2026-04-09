'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoClose,
    IoDownloadOutline,
    IoChevronBackOutline,
    IoChevronForwardOutline,
    IoCreateOutline,
} from 'react-icons/io5';
import { AISlidesOutput } from '@/app/types';
import { saveAs } from 'file-saver';

function isArabic(text: string): boolean {
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text || '');
}

interface SlidesPreviewProps {
    data: AISlidesOutput;
    onClose: () => void;
}

export default function SlidesPreview({ data, onClose }: SlidesPreviewProps) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [editMode, setEditMode] = useState(false);
    const [editedData, setEditedData] = useState<AISlidesOutput>(() => JSON.parse(JSON.stringify(data)));

    const total = editedData.slides.length;
    const slide = editedData.slides[currentSlide];

    const goNext = () => currentSlide < total - 1 && setCurrentSlide(prev => prev + 1);
    const goPrev = () => currentSlide > 0 && setCurrentSlide(prev => prev - 1);

    const updateSlideTitle = (value: string) => {
        const newData = { ...editedData };
        newData.slides[currentSlide] = { ...newData.slides[currentSlide], title: value };
        setEditedData(newData);
    };

    const updateSlidePoint = (index: number, value: string) => {
        const newData = { ...editedData };
        const newPoints = [...newData.slides[currentSlide].points];
        newPoints[index] = value;
        newData.slides[currentSlide] = { ...newData.slides[currentSlide], points: newPoints };
        setEditedData(newData);
    };

    const downloadPptx = useCallback(async () => {
        // Dynamic import to avoid SSR issues
        const PptxGenJS = (await import('pptxgenjs')).default;
        const pptx = new PptxGenJS();
        pptx.layout = 'LAYOUT_16x9';

        // Title slide
        const titleSlide = pptx.addSlide();
        titleSlide.background = { color: '1a56db' };
        titleSlide.addText(editedData.title, {
            x: 0.5, y: 1.5, w: 9, h: 2,
            fontSize: 36, color: 'FFFFFF', bold: true,
            align: 'center', rtlMode: isArabic(editedData.title),
            fontFace: 'Arial',
        });

        // Content slides
        for (const s of editedData.slides) {
            const sl = pptx.addSlide();
            sl.background = { color: 'FFFFFF' };

            // Slide title
            const titleIsAr = isArabic(s.title);
            sl.addText(s.title, {
                x: 0.5, y: 0.3, w: 9, h: 1,
                fontSize: 28, color: '1a56db', bold: true,
                align: titleIsAr ? 'right' : 'left', rtlMode: titleIsAr,
                fontFace: 'Arial',
            });

            // Divider line
            sl.addShape(pptx.ShapeType.rect, {
                x: 0.5, y: 1.3, w: 9, h: 0.03,
                fill: { color: '1a56db' },
            });

            if (s.imageBase64 || s.imageUrl) {
                // Handle both base64 and URL images
                if (s.imageBase64) {
                    sl.addImage({
                        data: `image/jpeg;base64,${s.imageBase64}`,
                        x: 0.5,
                        y: 1.5,
                        w: 4,
                        h: 3,
                    });
                } else if (s.imageUrl) {
                    // For URLs, we need to fetch and convert to base64 first
                    try {
                        const response = await fetch(s.imageUrl);
                        const blob = await response.blob();
                        const arrayBuffer = await blob.arrayBuffer();
                        const base64 = Buffer.from(arrayBuffer).toString('base64');
                        sl.addImage({
                            data: `image/jpeg;base64,${base64}`,
                            x: 0.5,
                            y: 1.5,
                            w: 4,
                            h: 3,
                        });
                    } catch (err) {
                        console.error('Failed to load slide image:', err);
                    }
                }
                
                const bulletText = s.points.map(p => ({
                    text: p,
                    options: { fontSize: 18, color: '333333', bullet: true, rtlMode: isArabic(p), fontFace: 'Arial' },
                }));

                sl.addText(bulletText, {
                    x: 5, y: 1.5, w: 4.5, h: 3,
                    align: isArabic(s.points[0]) ? 'right' : 'left',
                    lineSpacingMultiple: 1.5,
                });
            } else {
                const bulletText = s.points.map(p => ({
                    text: p,
                    options: { fontSize: 18, color: '333333', bullet: true, rtlMode: isArabic(p), fontFace: 'Arial' },
                }));

                sl.addText(bulletText, {
                    x: 0.5, y: 1.6, w: 9, h: 3.5,
                    align: isArabic(s.points[0]) ? 'right' : 'left',
                    lineSpacingMultiple: 1.5,
                });
            }
        }

        const blob = await pptx.write({ outputType: 'blob' }) as Blob;
        saveAs(blob, `${editedData.title || 'presentation'}.pptx`);
    }, [editedData]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
        >
            <motion.div
                initial={{ scale: 0.9, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 30 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
                            <IoClose size={20} />
                        </button>
                        <h2 className="font-bold text-slate-800 text-sm truncate">{editedData.title}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setEditMode(!editMode)}
                            className={`hidden sm:flex p-2 rounded-lg text-sm items-center justify-center ${editMode ? 'bg-amber-100 text-amber-700' : 'hover:bg-slate-100 text-slate-500'}`}
                        >
                            <IoCreateOutline size={18} />
                        </button>
                        <button
                            onClick={downloadPptx}
                            className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 text-white rounded-xl font-bold text-sm hover:bg-orange-700 transition-colors"
                        >
                            <IoDownloadOutline size={16} />
                            <span className="hidden sm:inline">PPTX</span>
                        </button>
                    </div>
                </div>

                {/* Slide Preview */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentSlide}
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -30 }}
                            className="bg-gradient-to-br from-white to-slate-50 rounded-xl border-2 border-slate-200 p-6 sm:p-8 aspect-video flex flex-col justify-center"
                        >
                            {editMode ? (
                                <>
                                    <input
                                        value={slide.title}
                                        onChange={(e) => updateSlideTitle(e.target.value)}
                                        className="text-lg sm:text-2xl font-black text-primary-700 bg-transparent border-b-2 border-primary-200 pb-2 mb-4 outline-none w-full text-start"
                                        dir="auto"
                                    />
                                    <div className="space-y-2">
                                        {slide.points.map((point, i) => (
                                            <div key={i} className="flex items-start gap-2">
                                                <span className="text-primary-500 mt-1 flex-shrink-0">●</span>
                                                <input
                                                    value={point}
                                                    onChange={(e) => updateSlidePoint(i, e.target.value)}
                                                    className="flex-1 text-sm sm:text-base text-slate-700 bg-transparent border-b border-slate-200 pb-1 outline-none text-start"
                                                    dir="auto"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h3 dir="auto" className="text-lg sm:text-2xl font-black text-primary-700 mb-4 pb-2 border-b-2 border-primary-100 text-start">
                                        {slide.title}
                                    </h3>
                                    <div className={`flex flex-col-reverse sm:flex-row gap-4 ${slide.imageBase64 || slide.imageUrl ? 'items-start' : ''}`}>
                                        {(slide.imageBase64 || slide.imageUrl) && (
                                            <div className="w-full sm:w-1/3">
                                                <img
                                                    src={slide.imageBase64 ? `data:image/jpeg;base64,${slide.imageBase64}` : slide.imageUrl}
                                                    className="rounded-lg shadow w-full"
                                                    alt="Generated Illustration"
                                                />
                                            </div>
                                        )}
                                        <ul className="space-y-2.5 text-start flex-1 w-full">
                                            {slide.points.map((point, i) => (
                                                <motion.li
                                                    key={i}
                                                    initial={{ opacity: 0, x: 10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.1 }}
                                                    className="flex items-start gap-2 text-sm sm:text-base text-slate-700"
                                                    dir="auto"
                                                >
                                                    <span className="text-primary-500 mt-0.5 flex-shrink-0">●</span>
                                                    <span className="leading-relaxed">{point}</span>
                                                </motion.li>
                                            ))}
                                        </ul>
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
                    <button
                        onClick={goPrev}
                        disabled={currentSlide === 0}
                        className="p-2 rounded-xl hover:bg-slate-200 disabled:opacity-30 transition-colors"
                    >
                        <IoChevronForwardOutline size={20} />
                    </button>
                    <div className="flex items-center gap-2">
                        {editedData.slides.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentSlide(i)}
                                className={`w-2.5 h-2.5 rounded-full transition-all ${
                                    i === currentSlide ? 'bg-primary-600 scale-125' : 'bg-slate-300'
                                }`}
                            />
                        ))}
                    </div>
                    <button
                        onClick={goNext}
                        disabled={currentSlide >= total - 1}
                        className="p-2 rounded-xl hover:bg-slate-200 disabled:opacity-30 transition-colors"
                    >
                        <IoChevronBackOutline size={20} />
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
