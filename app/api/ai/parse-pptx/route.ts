/**
 * PPTX Parser API
 * POST /api/ai/parse-pptx
 * 
 * Parses a PowerPoint (.pptx) file URL and extracts slide content.
 * PPTX files are ZIP archives containing XML files.
 */

import { NextRequest, NextResponse } from 'next/server';
import JSZip from 'jszip';

interface ParsedSlide {
    slideNumber: number;
    title?: string;
    content: string;
    notes?: string;
}

// ── Extract text from XML ──────────────────────
function extractTextFromXml(xml: string): string {
    const textParts: string[] = [];
    // Match all <a:t> text elements in PowerPoint XML
    const textRegex = /<a:t>([\s\S]*?)<\/a:t>/g;
    let match;

    while ((match = textRegex.exec(xml)) !== null) {
        const text = match[1]
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .trim();
        if (text) textParts.push(text);
    }

    return textParts.join(' ');
}

// ── Extract title from slide XML ───────────────
function extractTitle(xml: string): string | undefined {
    // Look for title shape (type="title" or type="ctrTitle")
    const titleMatch = xml.match(/<p:sp>[\s\S]*?<p:nvSpPr>[\s\S]*?(?:type="title"|type="ctrTitle")[\s\S]*?<\/p:nvSpPr>([\s\S]*?)<\/p:sp>/i);
    if (titleMatch) {
        return extractTextFromXml(titleMatch[1]) || undefined;
    }

    // Fallback: first text run in the slide
    const firstTextMatch = xml.match(/<p:txBody>([\s\S]*?)<\/p:txBody>/);
    if (firstTextMatch) {
        const text = extractTextFromXml(firstTextMatch[1]);
        // Only use as title if short enough
        if (text && text.length < 200) return text;
    }

    return undefined;
}

// ── Parse PPTX from buffer ─────────────────────
async function parsePptxBuffer(buffer: ArrayBuffer): Promise<ParsedSlide[]> {
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(buffer);
    const slides: ParsedSlide[] = [];

    // Find all slide files (ppt/slides/slide1.xml, slide2.xml, etc.)
    const slideFiles: string[] = [];
    zipContent.forEach((relativePath) => {
        if (/^ppt\/slides\/slide\d+\.xml$/.test(relativePath)) {
            slideFiles.push(relativePath);
        }
    });

    // Sort by slide number
    slideFiles.sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0');
        const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0');
        return numA - numB;
    });

    // Extract content from each slide
    for (let i = 0; i < slideFiles.length; i++) {
        const slideFile = zipContent.file(slideFiles[i]);
        if (!slideFile) continue;

        const slideXml = await slideFile.async('text');
        const title = extractTitle(slideXml);
        const fullContent = extractTextFromXml(slideXml);

        // Try to find notes for this slide
        const noteFile = zipContent.file(`ppt/notesSlides/notesSlide${i + 1}.xml`);
        let notes: string | undefined;
        if (noteFile) {
            const noteXml = await noteFile.async('text');
            notes = extractTextFromXml(noteXml) || undefined;
        }

        slides.push({
            slideNumber: i + 1,
            title: title || undefined,
            content: fullContent || '(شريحة بدون محتوى نصي)',
            notes,
        });
    }

    return slides;
}

// ── Main POST handler ──────────────────────────
export async function POST(request: NextRequest) {
    try {
        const contentType = request.headers.get('content-type') || '';

        let slides: ParsedSlide[];

        if (contentType.includes('application/json')) {
            // JSON body with file URL
            const { fileUrl } = await request.json();
            if (!fileUrl) {
                return NextResponse.json({ error: 'رابط الملف مطلوب' }, { status: 400 });
            }

            // Download the file
            const fileRes = await fetch(fileUrl);
            if (!fileRes.ok) {
                return NextResponse.json({ error: 'فشل تحميل الملف' }, { status: 400 });
            }

            const buffer = await fileRes.arrayBuffer();
            slides = await parsePptxBuffer(buffer);

        } else if (contentType.includes('multipart/form-data')) {
            // Direct file upload
            const formData = await request.formData();
            const file = formData.get('file') as File;
            if (!file) {
                return NextResponse.json({ error: 'يرجى رفع ملف PowerPoint' }, { status: 400 });
            }

            const buffer = await file.arrayBuffer();
            slides = await parsePptxBuffer(buffer);

        } else {
            return NextResponse.json({ error: 'نوع المحتوى غير مدعوم' }, { status: 400 });
        }

        return NextResponse.json({
            slides,
            totalSlides: slides.length,
        });

    } catch (error: any) {
        console.error('PPTX parse error:', error);
        return NextResponse.json(
            { error: 'فشل تحليل ملف PowerPoint: ' + (error.message || '') },
            { status: 500 }
        );
    }
}
