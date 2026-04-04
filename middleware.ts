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

    // السماح بالمرور إذا في token
    if (token) {
        return NextResponse.next();
    }

    // السماح بالمرور إذا الطلب جاي من صفحة تسجيل/دخول (Referer check)
    // هذا يحل مشكلة race condition بعد التسجيل مباشرة
    const referer = request.headers.get('referer') || '';
    const isComingFromAuth = referer.includes('/register') || 
                              referer.includes('/login') || 
                              referer.includes('/complete-profile');
    
    if (isComingFromAuth) {
        return NextResponse.next();
    }

    // لا يوجد token ولا referer من صفحة auth — أعد التوجيه لتسجيل الدخول
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/organization/:path*',
        '/volunteer/:path*',
    ],
};
