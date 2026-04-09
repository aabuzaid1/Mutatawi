/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['images.unsplash.com', 'firebasestorage.googleapis.com'],
    },
    experimental: {
        serverComponentsExternalPackages: ['firebase-admin', '@google-cloud/firestore', '@opentelemetry/api'],
    },
    webpack: (config, { isServer, webpack }) => {
        if (!isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                fs: false,
                path: false,
                os: false,
                net: false,
                tls: false,
                https: false,
                stream: false,
                crypto: false,
                zlib: false,
            };
        }
        
        // Strip out the "node:" prefix from imports so the fallbacks apply
        config.plugins.push(
            new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
                resource.request = resource.request.replace(/^node:/, '');
            })
        );
        
        return config;
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
    // ✅ Secret env vars (SMTP, Firebase Service Account) are accessed via
    // process.env directly in API routes — no need to forward them here.
    // The `env` block exposes vars to the BROWSER, so never put secrets here.
    // Proxy Firebase Auth
    async rewrites() {
        return [
            {
                source: '/__/auth/:path*',
                destination: 'https://mutatawi-2b96f.firebaseapp.com/__/auth/:path*',
            },
        ];
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
                            "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com https://www.youtube.com",
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
