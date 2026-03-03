/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['images.unsplash.com', 'firebasestorage.googleapis.com'],
    },
    experimental: {
        serverComponentsExternalPackages: ['firebase-admin', '@google-cloud/firestore', '@opentelemetry/api'],
    },
    // Server-only env vars — forwarded to API routes only (NOT exposed to browser)
    // These are available via process.env in API routes and server components
    serverRuntimeConfig: {
        FIREBASE_SERVICE_ACCOUNT_KEY_BASE64: process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64,
        FIREBASE_SERVICE_ACCOUNT_KEY: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
        FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
        FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    },
    // Forward server env vars to API routes on Vercel
    // ⚠️ Only non-secret vars that API routes need at runtime
    env: {
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_USER: process.env.SMTP_USER,
        SMTP_PASS: process.env.SMTP_PASS,
        SMTP_EMAIL: process.env.SMTP_EMAIL,
        SMTP_PASSWORD: process.env.SMTP_PASSWORD,
        FROM_EMAIL: process.env.FROM_EMAIL,
        FIREBASE_SERVICE_ACCOUNT_KEY_BASE64: process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64,
        FIREBASE_SERVICE_ACCOUNT_KEY: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
    },
    // Security Headers
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: [
                    // منع تضمين الموقع في iframe (حماية من Clickjacking)
                    { key: 'X-Frame-Options', value: 'DENY' },
                    // منع MIME type sniffing
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    // حماية من XSS
                    { key: 'X-XSS-Protection', value: '1; mode=block' },
                    // التحكم بالمعلومات المرسلة عند التنقل
                    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
                    // منع استخدام الكاميرا والمايكروفون بدون إذن
                    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
                    // منع التحميل من مصادر غير موثقة
                    {
                        key: 'Content-Security-Policy',
                        value: [
                            "default-src 'self'",
                            "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://*.firebaseio.com https://*.googleapis.com https://www.googletagmanager.com https://va.vercel-scripts.com",
                            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                            "font-src 'self' https://fonts.gstatic.com",
                            "img-src 'self' data: blob: https://images.unsplash.com https://firebasestorage.googleapis.com https://*.googleusercontent.com",
                            "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://*.firebase.google.com wss://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://vitals.vercel-insights.com",
                            "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com",
                            "object-src 'none'",
                            "base-uri 'self'",
                        ].join('; '),
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;
