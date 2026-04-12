/**
 * YouTube Transcript Extraction API
 * POST /api/ai/youtube-transcript
 * 
 * Extracts auto-generated captions/transcript from YouTube videos
 * using YouTube's timedtext API (no API key required).
 */

import { NextRequest, NextResponse } from 'next/server';

// ── Fetch YouTube transcript ───────────────────
async function fetchYouTubeTranscript(videoId: string): Promise<string | null> {
    try {
        // Step 1: Fetch the YouTube video page to extract caption tracks
        const pageUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const pageRes = await fetch(pageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
            },
        });

        if (!pageRes.ok) return null;

        const pageHtml = await pageRes.text();

        // Step 2: Extract captions URL from the page
        const captionMatch = pageHtml.match(/"captionTracks":\s*(\[.*?\])/);
        if (!captionMatch) return null;

        let captionTracks;
        try {
            captionTracks = JSON.parse(captionMatch[1]);
        } catch {
            return null;
        }

        if (!captionTracks || captionTracks.length === 0) return null;

        // Prefer English or Arabic, fallback to first available
        const preferredTrack =
            captionTracks.find((t: any) => t.languageCode === 'en') ||
            captionTracks.find((t: any) => t.languageCode === 'ar') ||
            captionTracks[0];

        if (!preferredTrack?.baseUrl) return null;

        // Step 3: Fetch the actual transcript XML
        const transcriptRes = await fetch(preferredTrack.baseUrl);
        if (!transcriptRes.ok) return null;

        const transcriptXml = await transcriptRes.text();

        // Step 4: Parse XML to extract text
        const textSegments: string[] = [];
        const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/g;
        let match;

        while ((match = textRegex.exec(transcriptXml)) !== null) {
            let text = match[1]
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/&#39;/g, "'")
                .replace(/<[^>]+>/g, '') // Remove any nested HTML tags
                .trim();

            if (text) textSegments.push(text);
        }

        if (textSegments.length === 0) return null;

        return textSegments.join(' ');
    } catch (error) {
        console.error('YouTube transcript extraction error:', error);
        return null;
    }
}

// ── Main POST handler ──────────────────────────
export async function POST(request: NextRequest) {
    try {
        const { videoId } = await request.json();

        if (!videoId || typeof videoId !== 'string') {
            return NextResponse.json(
                { error: 'Video ID is required' },
                { status: 400 }
            );
        }

        const transcript = await fetchYouTubeTranscript(videoId.trim());

        if (!transcript) {
            return NextResponse.json({
                transcript: null,
                available: false,
                message: 'لم يتم العثور على نص مكتوب لهذا الفيديو',
            });
        }

        return NextResponse.json({
            transcript,
            available: true,
            language: 'auto',
            charCount: transcript.length,
        });

    } catch (error: any) {
        console.error('Transcript API error:', error);
        return NextResponse.json(
            { error: 'فشل استخراج نص الفيديو' },
            { status: 500 }
        );
    }
}
