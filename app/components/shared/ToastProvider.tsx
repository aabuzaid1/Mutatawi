'use client';

import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
    return (
        <Toaster
            position="top-center"
            toastOptions={{
                duration: 4000,
                style: {
                    background: '#fff',
                    color: '#1e293b',
                    borderRadius: '1rem',
                    boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #f1f5f9',
                    padding: '12px 16px',
                    fontFamily: 'Tajawal, sans-serif',
                    direction: 'rtl',
                },
                success: {
                    iconTheme: {
                        primary: '#10b981',
                        secondary: '#ecfdf5',
                    },
                },
                error: {
                    iconTheme: {
                        primary: '#ef4444',
                        secondary: '#fef2f2',
                    },
                },
            }}
        />
    );
}
