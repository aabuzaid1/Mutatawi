/**
 * POST /api/auth/reset-password
 * 
 * Server-side password reset email using Firebase Admin SDK + SMTP.
 * 
 * الحماية:
 *   - Rate Limiting: حد أقصى 3 طلبات لكل IP كل 15 دقيقة
 *   - لا يكشف إذا الإيميل موجود أو لا (user enumeration protection)
 * 
 * Body: { email: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/app/lib/firebase-admin';
import nodemailer from 'nodemailer';

export const runtime = 'nodejs';

// ── Rate Limiter (In-Memory) ────────────────────────
const rateLimitMap = new Map<string, { count: number; firstRequest: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 دقيقة
const RATE_LIMIT_MAX_REQUESTS = 3;

function cleanupRateLimit() {
  const now = Date.now();
  for (const [key, value] of Array.from(rateLimitMap.entries())) {
    if (now - value.firstRequest > RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.delete(key);
    }
  }
}

function isRateLimited(ip: string): boolean {
  cleanupRateLimit();
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry) {
    rateLimitMap.set(ip, { count: 1, firstRequest: now });
    return false;
  }

  if (now - entry.firstRequest > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, firstRequest: now });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

// ── SMTP ────────────────────────────────────────────
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  return transporter;
}

const FROM_EMAIL = `متطوع <${process.env.SMTP_EMAIL}>`;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mutatawi.com';
const LOGO_URL = `${SITE_URL}/logo.png`;

// ── Email HTML Template ─────────────────────────────
function buildResetEmailHtml(resetLink: string) {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f0f2f5;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f2f5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
          <!-- Logo -->
          <tr>
            <td style="padding:28px 32px 12px;text-align:center;">
              <img src="${LOGO_URL}" alt="متطوع" width="60" height="60" style="border-radius:12px;" />
              <p style="margin:10px 0 0;font-size:22px;font-weight:800;color:#1e293b;">متطوع</p>
            </td>
          </tr>
          <tr><td style="padding:0 32px;"><div style="height:1px;background:#e2e8f0;"></div></td></tr>
          <!-- Header -->
          <tr>
            <td style="padding:28px 32px 20px;text-align:center;">
              <div style="display:inline-block;width:56px;height:56px;line-height:56px;border-radius:50%;background:#fef3c7;font-size:28px;text-align:center;">🔑</div>
              <h1 style="margin:16px 0 0;font-size:22px;font-weight:700;color:#1e293b;">إعادة تعيين كلمة المرور</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:0 32px 28px;">
              <p style="font-size:15px;color:#475569;line-height:1.9;margin:0 0 12px;">
                تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك. اضغط على الزر أدناه لإنشاء كلمة مرور جديدة:
              </p>
              <div style="text-align:center;margin:28px 0;">
                <a href="${resetLink}"
                   style="display:inline-block;background:#6366f1;color:#ffffff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;box-shadow:0 4px 12px rgba(99,102,241,0.25);">
                  إعادة تعيين كلمة المرور
                </a>
              </div>
              <p style="font-size:13px;color:#94a3b8;line-height:1.8;margin:0;">
                إذا لم تطلب إعادة تعيين كلمة المرور، تجاهل هذه الرسالة. الرابط صالح لمدة ساعة واحدة.
              </p>
            </td>
          </tr>
          <tr><td style="padding:0 32px;"><div style="height:1px;background:#e2e8f0;"></div></td></tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#cbd5e1;">
                <a href="${SITE_URL}" style="color:#6366f1;text-decoration:none;">mutatawi.com</a>
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#cbd5e1;">© ${new Date().getFullYear()} متطوع — جميع الحقوق محفوظة</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Validation ──────────────────────────────────────
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Route Handler ───────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // ========== 1. Rate Limiting ==========
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    if (isRateLimited(ip)) {
      console.warn(`[reset-password API] Rate limited IP: ${ip}`);
      return NextResponse.json(
        { error: 'تم تجاوز الحد المسموح. حاول مرة أخرى بعد 15 دقيقة.' },
        { status: 429 }
      );
    }

    // ========== 2. Validate Input ==========
    const { email } = await request.json();

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'البريد الإلكتروني غير صالح' }, { status: 400 });
    }

    // Sanitize email
    const sanitizedEmail = email.trim().toLowerCase();

    // ✅ دائماً نستخدم SITE_URL الرسمي — لا نثق بـ Origin header لأنه قابل للتزوير
    const origin = SITE_URL;

    console.log('[reset-password API] Generating reset link for:', sanitizedEmail);

    // Generate password reset link via Firebase Admin SDK
    const actionCodeSettings = {
      url: `${origin}/reset-password`,
      handleCodeInApp: true,
    };

    const firebaseLink = await adminAuth.generatePasswordResetLink(sanitizedEmail, actionCodeSettings);

    // استخراج oobCode من رابط Firebase وبناء رابط مباشر لصفحتنا
    const firebaseUrl = new URL(firebaseLink);
    const oobCode = firebaseUrl.searchParams.get('oobCode');
    const apiKey = firebaseUrl.searchParams.get('apiKey');

    if (!oobCode) {
      throw new Error('Failed to extract reset code');
    }

    // بناء رابط مباشر لصفحة /reset-password في موقعنا
    const directResetLink = `${origin}/reset-password?mode=resetPassword&oobCode=${oobCode}${apiKey ? `&apiKey=${apiKey}` : ''}`;

    // Send email via SMTP
    await getTransporter().sendMail({
      from: FROM_EMAIL,
      to: sanitizedEmail,
      subject: 'إعادة تعيين كلمة المرور — متطوع 🔑',
      html: buildResetEmailHtml(directResetLink),
    });

    console.log('[reset-password API] Email sent via SMTP');

    // أمان: لا نكشف إذا الإيميل موجود أو لا
    return NextResponse.json({
      success: true,
      message: 'If the email exists, a reset link has been sent',
    });

  } catch (error: any) {
    console.error('[reset-password API] Error:', error.code || error.message);

    // أمان: نرد نفس الرد حتى لو الإيميل غير موجود
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
      return NextResponse.json({
        success: true,
        message: 'If the email exists, a reset link has been sent',
      });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
