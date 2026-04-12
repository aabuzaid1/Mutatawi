import { ref, uploadBytes, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Upload a course thumbnail image to Firebase Storage
 * Returns the download URL
 */
export async function uploadCourseThumbnail(file: File, courseId?: string): Promise<string> {
    // Generate a unique filename
    const uniqueId = courseId || `temp_${Date.now()}`;
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `course-thumbnails/${uniqueId}_${Date.now()}.${ext}`;

    const storageRef = ref(storage, fileName);

    // Upload the file
    const snapshot = await uploadBytes(storageRef, file, {
        contentType: file.type,
    });

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
}

/**
 * Upload a course video to Firebase Storage (supports large files up to 500MB)
 */
export async function uploadCourseVideo(file: File, courseId?: string, onProgress?: (progress: number) => void): Promise<string> {
    return new Promise((resolve, reject) => {
        const uniqueId = courseId || `temp_${Date.now()}`;
        const ext = file.name.split('.').pop() || 'mp4';
        const fileName = `course-videos/${uniqueId}_${Date.now()}.${ext}`;
        const storageRef = ref(storage, fileName);

        const uploadTask = uploadBytesResumable(storageRef, file, {
            contentType: file.type,
        });

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                if (onProgress) onProgress(progress);
            },
            (error) => {
                reject(error);
            },
            async () => {
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadURL);
            }
        );
    });
}

/**
 * Upload a course PowerPoint file to Firebase Storage
 */
export async function uploadCoursePPTX(file: File, courseId?: string): Promise<string> {
    const uniqueId = courseId || `temp_${Date.now()}`;
    const fileName = `course-slides/${uniqueId}_${Date.now()}.pptx`;
    const storageRef = ref(storage, fileName);

    const snapshot = await uploadBytes(storageRef, file, {
        contentType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    });

    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
}

/**
 * Delete a course thumbnail from Firebase Storage
 */
export async function deleteCourseThumbnail(url: string): Promise<void> {
    try {
        // Extract the path from the URL
        const storageRef = ref(storage, url);
        await deleteObject(storageRef);
    } catch (error) {
        // Ignore errors (file might not exist or URL might be external)
        console.warn('Could not delete thumbnail:', error);
    }
}

/**
 * Compress and resize an image file before upload
 * Returns a new File object with reduced size
 */
export function compressImage(file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Resize if needed
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) { reject(new Error('Canvas not supported')); return; }

                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) { reject(new Error('Compression failed')); return; }
                        const compressedFile = new File([blob], file.name, {
                            type: 'image/webp',
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    },
                    'image/webp',
                    quality
                );
            };
            img.onerror = reject;
            img.src = e.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
