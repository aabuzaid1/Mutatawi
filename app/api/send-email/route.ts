import { NextRequest, NextResponse } from 'next/server';
import {
    sendWelcomeEmail,
    sendApplicationConfirmation,
    sendNewApplicationNotification,
    sendApplicationAccepted,
    sendApplicationRejected,
} from '@/app/lib/email';

// GET endpoint for testing — visit /api/send-email?to=YOUR_EMAIL in browser
export async function GET(request: NextRequest) {
    const testEmail = request.nextUrl.searchParams.get('to') || 'mutatawi@gmail.com';
    try {
        // Check env vars
        if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
            return NextResponse.json({
                error: 'Missing SMTP env vars',
                hasEmail: !!process.env.SMTP_EMAIL,
                hasPassword: !!process.env.SMTP_PASSWORD,
            }, { status: 500 });
        }

        await sendWelcomeEmail('اختبار', testEmail, 'volunteer');
        return NextResponse.json({ success: true, message: `Test email sent to ${testEmail}` });
    } catch (error: any) {
        console.error('Test email error:', error);
        return NextResponse.json({
            error: error.message || 'Unknown error',
            code: error.code,
            stack: error.stack?.split('\n').slice(0, 3),
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, data } = body;

        console.log('[Email API] Sending email type:', type, 'data:', JSON.stringify(data));

        switch (type) {
            case 'welcome':
                await sendWelcomeEmail(data.name, data.email, data.role);
                break;

            case 'application-confirmation':
                await sendApplicationConfirmation(
                    data.volunteerName,
                    data.volunteerEmail,
                    data.opportunityTitle
                );
                break;

            case 'new-application':
                await sendNewApplicationNotification(
                    data.orgEmail,
                    data.orgName,
                    data.volunteerName,
                    data.opportunityTitle
                );
                break;

            case 'application-accepted':
                await sendApplicationAccepted(
                    data.volunteerName,
                    data.volunteerEmail,
                    data.opportunityTitle
                );
                break;

            case 'application-rejected':
                await sendApplicationRejected(
                    data.volunteerName,
                    data.volunteerEmail,
                    data.opportunityTitle
                );
                break;

            default:
                return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
        }

        console.log('[Email API] Email sent successfully, type:', type);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Email API] Error:', error.message, error.code, error.stack);
        return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
    }
}
