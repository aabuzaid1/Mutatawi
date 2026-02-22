/**
 * POST /api/auth/reset-password
 * 
 * Server-side password reset email using Firebase Admin SDK + SMTP.
 * This bypasses Firebase's built-in email delivery and sends
 * the reset link via our own SMTP (Gmail/Nodemailer).
 * 
 * Body: { email: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/app/lib/firebase-admin';
import nodemailer from 'nodemailer';

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
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://mutatawi.vercel.app';
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
                <a href="${SITE_URL}" style="color:#6366f1;text-decoration:none;">mutatawi.vercel.app</a>
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

// ── Route Handler ───────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // استخدم origin الطلب (localhost في التطوير، الدومين الحقيقي في الإنتاج)
    const origin = request.headers.get('origin') || SITE_URL;

    console.log('📧 [reset-password API] Generating reset link for:', email);
    console.log('📧 [reset-password API] Origin:', origin);

    // Generate password reset link via Firebase Admin SDK
    const actionCodeSettings = {
      url: `${origin}/reset-password`,
      handleCodeInApp: true,
    };

    const firebaseLink = await adminAuth.generatePasswordResetLink(email, actionCodeSettings);
    console.log('✅ [reset-password API] Firebase link generated');

    // استخراج oobCode من رابط Firebase وبناء رابط مباشر لصفحتنا
    // رابط Firebase يكون: https://project.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=ABC&...
    // نحن نحتاج: https://OUR_DOMAIN/reset-password?oobCode=ABC&mode=resetPassword
    const firebaseUrl = new URL(firebaseLink);
    const oobCode = firebaseUrl.searchParams.get('oobCode');
    const apiKey = firebaseUrl.searchParams.get('apiKey');

    if (!oobCode) {
      console.error('❌ [reset-password API] Could not extract oobCode from Firebase link');
      throw new Error('Failed to extract reset code');
    }

    // بناء رابط مباشر لصفحة /reset-password في موقعنا
    const directResetLink = `${origin}/reset-password?mode=resetPassword&oobCode=${oobCode}${apiKey ? `&apiKey=${apiKey}` : ''}`;
    console.log('✅ [reset-password API] Direct link built:', directResetLink.substring(0, 80) + '...');

    // Send email via SMTP
    await getTransporter().sendMail({
      from: FROM_EMAIL,
      to: email,
      subject: 'إعادة تعيين كلمة المرور — متطوع 🔑',
      html: buildResetEmailHtml(directResetLink),
    });

    console.log('✅ [reset-password API] Email sent via SMTP to:', email);

    // أمان: لا نكشف إذا الإيميل موجود أو لا
    return NextResponse.json({ success: true, message: 'If the email exists, a reset link has been sent' });

  } catch (error: any) {
    console.error('❌ [reset-password API] Error:', error.code || error.message);

    // أمان: نرد نفس الرد حتى لو الإيميل غير موجود
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
      console.warn('⚠️ [reset-password API] Email not found — returning generic success');
      return NextResponse.json({ success: true, message: 'If the email exists, a reset link has been sent' });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
