import * as pdfjsLib from 'pdfjs-dist';
import { SlideContent } from '@/app/types';

// Configure the worker to use the CDN, bypassing Next.js edge/webpack bundling limits for the worker
if (typeof window !== 'undefined') {
    // Ensure the version matches the installed pdfjs-dist version
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export async function extractTextFromPDF(file: File): Promise<SlideContent[]> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        const slides: SlideContent[] = [];
        const numPages = pdf.numPages;

        for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            // Reconstruct text closely adhering to positional logic
            // pdf.js returns text items as an array. Items on the same line have similar Y coordinates.
            let pageText = '';
            let lastY = -1;
            
            for (const item of textContent.items as any[]) {
                if (lastY !== item.transform[5] && lastY !== -1) {
                    // New line if Y coordinate changed
                    pageText += '\n';
                } else if (lastY !== -1) {
                    // Space between elements on same line if intended
                    // PDF.js often separates words, checking width might be needed but simple join is ok for AI
                    pageText += ' '; 
                }
                pageText += item.str;
                lastY = item.transform[5];
            }
            
            const rawText = pageText.trim();
            const titleMatch = rawText.slice(0, 50).trim().split(/\s+/).slice(0, 5).join(' '); // first few words as title
            
            if (rawText.length > 0) {
                slides.push({
                    slideNumber: i,
                    title: titleMatch || `شريحة ${i}`,
                    content: rawText
                });
            } else {
                 slides.push({
                    slideNumber: i,
                    title: `شريحة ${i}`,
                    content: 'لا يوجد نص قابل للقراءة المباشرة في هذه الشريحة (قد تتكون من صور فقط).'
                });
            }
        }

        return slides;
    } catch (err) {
        console.error('Error parsing PDF:', err);
        throw err;
    }
}
