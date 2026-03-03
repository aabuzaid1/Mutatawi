/**
 * @fileoverview مخططات التحقق من المدخلات (Input Validation Schemas)
 * تستخدم مكتبة Zod للتحقق من صحة البيانات في API routes.
 */

import { z } from 'zod';

// ===================== APPLICATION SCHEMAS =====================

/** مخطط التقديم على فرصة تطوعية */
export const applySchema = z.object({
    opportunityId: z.string().min(1, 'معرف الفرصة مطلوب').max(128),
    message: z.string().max(1000, 'الرسالة طويلة جداً (الحد: 1000 حرف)').optional(),
    phone: z.string().regex(/^[0-9+\-\s()]{7,20}$/, 'رقم الهاتف غير صالح').optional(),
});

/** مخطط سحب طلب */
export const withdrawSchema = z.object({
    applicationId: z.string().min(1, 'معرف الطلب مطلوب').max(128),
    opportunityId: z.string().min(1, 'معرف الفرصة مطلوب').max(128),
});

// ===================== AUTH SCHEMAS =====================

/** مخطط إعادة تعيين كلمة المرور */
export const resetPasswordSchema = z.object({
    email: z.string().email('البريد الإلكتروني غير صالح').max(254),
});

// ===================== EMAIL SCHEMAS =====================

/** مخطط إرسال الإيميلات */
export const sendEmailSchema = z.object({
    type: z.enum([
        'welcome',
        'application-confirmation',
        'new-application',
        'application-accepted',
        'application-rejected',
    ], { error: 'نوع الإيميل غير صالح' }),
    data: z.record(z.string(), z.unknown()),
});

// ===================== HELPERS =====================

/**
 * تحقق من البيانات باستخدام مخطط Zod وأرجع النتيجة أو الأخطاء.
 */
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): {
    success: true;
    data: T;
} | {
    success: false;
    errors: string[];
} {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return {
        success: false,
        errors: result.error.issues.map(i => i.message),
    };
}
