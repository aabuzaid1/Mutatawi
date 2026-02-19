/**
 * Mailer — Nodemailer SMTP Transporter
 * دالة عامة لإرسال الإيميلات من السيرفر
 * 
 * المتغيرات المطلوبة في .env.local:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, FROM_EMAIL
 */

import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

/**
 * إنشاء transporter مرة واحدة (Singleton)
 */
function getTransporter(): nodemailer.Transporter {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: false, // true for 465, false for 587 (STARTTLS)
            auth: {
                user: process.env.SMTP_USER || process.env.SMTP_EMAIL,
                pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
            },
        });
    }
    return transporter;
}

/**
 * إرسال إيميل عام
 * @param to - البريد الإلكتروني للمستلم
 * @param subject - عنوان الإيميل
 * @param html - محتوى HTML للإيميل
 */
export async function sendEmail(
    to: string,
    subject: string,
    html: string
): Promise<void> {
    const fromEmail = process.env.FROM_EMAIL || `متطوعي <${process.env.SMTP_USER || process.env.SMTP_EMAIL}>`;

    await getTransporter().sendMail({
        from: fromEmail,
        to,
        subject,
        html,
    });
}
