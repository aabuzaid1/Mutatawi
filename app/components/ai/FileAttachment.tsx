'use client';

import { useRef } from 'react';
import { IoImageOutline } from 'react-icons/io5';

interface FileAttachmentProps {
    onAttach: (base64: string) => void;
    disabled: boolean;
}

export default function FileAttachment({ onAttach, disabled }: FileAttachmentProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowedTypes.includes(file.type)) {
            alert('يُسمح بالصور فقط (JPG, PNG, WebP, GIF)');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('الحد الأقصى لحجم الصورة 5 ميجابايت');
            return;
        }

        try {
            // Compress image if needed
            const base64 = await compressImage(file, 1024, 0.8);
            onAttach(base64);
        } catch (err) {
            console.error('Image processing error:', err);
            alert('خطأ في معالجة الصورة');
        }

        // Reset input
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    return (
        <>
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                className="hidden"
            />
            <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={disabled}
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 hover:bg-slate-100 text-slate-500 transition-colors disabled:opacity-40"
            >
                <IoImageOutline size={18} />
            </button>
        </>
    );
}

// Compress image to max dimension and quality
async function compressImage(file: File, maxDim: number, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(url);

            let { width, height } = img;

            // Scale down if needed
            if (width > maxDim || height > maxDim) {
                const ratio = Math.min(maxDim / width, maxDim / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, width, height);

            const base64 = canvas.toDataURL('image/jpeg', quality);
            resolve(base64);
        };

        img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image'));
        };

        img.src = url;
    });
}
