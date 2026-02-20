/**
 * @fileoverview Hook Wrap لإستدعاء السياق بشكل مباشر.
 */

'use client';

import { useAuthContext } from '../context/AuthContext';

/**
 * خطاف مخصص (Custom Hook) لاختصار جلب بيانات المصادقة (Context).
 * 
 * @returns {AuthContextType} القيم الحقيقية من `AuthProvider`.
 * @throws {Error} إذا تم استدعاؤه خارج إطار የـ `AuthProvider`.
 */
export function useAuth() {
    return useAuthContext();
}
