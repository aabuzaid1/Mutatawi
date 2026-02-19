/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: ['images.unsplash.com', 'firebasestorage.googleapis.com'],
    },
    experimental: {
        serverComponentsExternalPackages: ['firebase-admin', '@google-cloud/firestore', '@opentelemetry/api'],
    },
};

module.exports = nextConfig;
