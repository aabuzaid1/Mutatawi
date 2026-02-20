/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['images.unsplash.com', 'firebasestorage.googleapis.com'],
    },
    experimental: {
        serverComponentsExternalPackages: ['firebase-admin', '@google-cloud/firestore', '@opentelemetry/api'],
    },
    // Explicitly forward server env vars to API routes
    // (fixes Vercel not delivering non-NEXT_PUBLIC vars to serverless functions)
    env: {
        FIREBASE_SERVICE_ACCOUNT_KEY_BASE64: process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64,
        FIREBASE_SERVICE_ACCOUNT_KEY: process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
        FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
        FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
        FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
        SMTP_HOST: process.env.SMTP_HOST,
        SMTP_PORT: process.env.SMTP_PORT,
        SMTP_USER: process.env.SMTP_USER,
        SMTP_PASS: process.env.SMTP_PASS,
        SMTP_EMAIL: process.env.SMTP_EMAIL,
        SMTP_PASSWORD: process.env.SMTP_PASSWORD,
        FROM_EMAIL: process.env.FROM_EMAIL,
    },
};

module.exports = nextConfig;
