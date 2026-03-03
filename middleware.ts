/**
 * Next.js Middleware — حماية صفحات الداشبورد
 * 
 * يتحقق من وجود session cookie قبل السماح بالوصول لصفحات:
 *   - /organization/*
 *   - /volunteer/*
 * 
 * ملاحظة: هذا يوفر حماية server-side بالإضافة لحماية client-side
 * الموجودة في AuthContext. إذا لم يكن هناك cookie، يتم التحويل لصفحة الدخول.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // الصفحات المحمية
    const protectedPaths = ['/organization', '/volunteer'];
    const isProtected = protectedPaths.some(path => pathname.startsWith(path));

    if (!isProtected) {
        return NextResponse.next();
    }

    // تحقق من وجود Firebase auth session
    // Firebase يخزن الـ token في IndexedDB على العميل
    // يمكن استخدام session cookie مخصص إذا تم إعداده
    const sessionCookie = request.cookies.get('__session')?.value;
    const firebaseToken = request.cookies.get('firebase-token')?.value;

    // إذا لم يوجد أي token، حوّل لصفحة الدخول
    if (!sessionCookie && !firebaseToken) {
        // السماح بالطلبات من العميل التي تحمل Authorization header
        // (API calls, AJAX requests)
        const authHeader = request.headers.get('Authorization');
        if (authHeader) {
            return NextResponse.next();
        }

        // للطلبات العادية (صفحات HTML)، تحقق إذا كان الطلب من المتصفح
        const accept = request.headers.get('accept') || '';
        if (accept.includes('text/html')) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('redirect', pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    // إضافة Security Headers لكل الاستجابات
    const response = NextResponse.next();

    // منع تضمين الموقع في iframe (Clickjacking protection)
    response.headers.set('X-Frame-Options', 'DENY');

    // منع MIME type sniffing
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // حماية من XSS
    response.headers.set('X-XSS-Protection', '1; mode=block');

    // التحكم في المعلومات المرسلة عند التنقل
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // منع تسريب معلومات حساسة
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

    return response;
}

export const config = {
    matcher: [
        // حماية صفحات الداشبورد
        '/organization/:path*',
        '/volunteer/:path*',
    ],
};
