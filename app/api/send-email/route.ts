import { NextRequest, NextResponse } from 'next/server';
import {
    sendWelcomeEmail,
    sendApplicationConfirmation,
    sendNewApplicationNotification,
    sendApplicationAccepted,
    sendApplicationRejected,
} from '@/app/lib/email';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, data } = body;

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

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Email sending error:', error);
        return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
    }
}
