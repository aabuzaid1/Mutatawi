import { NextResponse, NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
        return new NextResponse('Missing url parameter', { status: 400 });
    }

    try {
        // Fetch the file as a stream from Firebase Storage
        const response = await fetch(url);
        if (!response.ok) {
            return new NextResponse(`Failed to fetch from source: ${response.status}`, { status: response.status });
        }

        // Pass the stream directly to the client with highly optimized and standard headers for Microsoft Office Viewers
        return new NextResponse(response.body, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                // forcing inline display with a strictly standard .pptx filename enables bypassing strict MS office blocks
                'Content-Disposition': 'inline; filename="presentation.pptx"',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=86400'
            }
        });
    } catch (error) {
        return new NextResponse('Internal Proxy Error', { status: 500 });
    }
}
