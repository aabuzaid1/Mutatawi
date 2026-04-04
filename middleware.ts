/**
 * Next.js Middleware — حماية المسارات الحساسة
 * 
 * يتحقق من وجود Firebase token cookie قبل السماح بالوصول
 * للمسارات المحمية (لوحات التحكم، الأدمن).
 * 
 * ⚠️ هذا فحص أولي — التحقق الكامل من صحة الـ Token يتم في API routes
 */

import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('firebase-token')?.value;
    const { pathname } = request.nextUrl;

    // المسارات المحمية — تتطلب تسجيل دخول
    const protectedPaths = ['/admin', '/organization', '/volunteer'];
    const isProtected = protectedPaths.some(p => pathname.startsWith(`/${p.replace('/', '')}`));

    if (isProtected && !token) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/organization/:path*',
        '/volunteer/:path*',
    ],
};
