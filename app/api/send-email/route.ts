/**
 * POST /api/send-email
 * 
 * إرسال إيميلات — يتطلب Firebase ID Token للمصادقة
 * 
 * Body: { type: string, data: object }
 * Headers: Authorization: Bearer <idToken>
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/app/lib/firebase-admin';
import {
    sendWelcomeEmail,
    sendApplicationConfirmation,
    sendNewApplicationNotification,
    sendApplicationAccepted,
    sendApplicationRejected,
} from '@/app/lib/email';

export const runtime = 'nodejs';

// ❌ تم حذف GET endpoint التجريبي — كان مكشوفاً للجميع

export async function POST(request: NextRequest) {
    try {
        // ========== 1. التحقق من المصادقة ==========
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Missing or invalid Authorization header' },
                { status: 401 }
            );
        }

        const idToken = authHeader.split('Bearer ')[1];
        let decodedToken;
        try {
            decodedToken = await adminAuth.verifyIdToken(idToken);
        } catch {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        console.log(`[Email API] Authenticated user: ${decodedToken.uid}`);

        // ========== 2. معالجة الطلب ==========
        const body = await request.json();
        const { type, data } = body;

        if (!type || !data) {
            return NextResponse.json(
                { error: 'type and data are required' },
                { status: 400 }
            );
        }

        console.log('[Email API] Sending email type:', type);

        switch (type) {
            case 'welcome':
                if (!data.name || !data.email || !data.role) {
                    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
                }
                await sendWelcomeEmail(data.name, data.email, data.role);
                break;

            case 'application-confirmation':
                if (!data.volunteerName || !data.volunteerEmail || !data.opportunityTitle) {
                    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
                }
                await sendApplicationConfirmation(
                    data.volunteerName,
                    data.volunteerEmail,
                    data.opportunityTitle
                );
                break;

            case 'new-application':
                if (!data.orgEmail || !data.orgName || !data.volunteerName || !data.opportunityTitle) {
                    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
                }
                await sendNewApplicationNotification(
                    data.orgEmail,
                    data.orgName,
                    data.volunteerName,
                    data.opportunityTitle
                );
                break;

            case 'application-accepted':
                if (!data.volunteerName || !data.volunteerEmail || !data.opportunityTitle) {
                    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
                }
                await sendApplicationAccepted(
                    data.volunteerName,
                    data.volunteerEmail,
                    data.opportunityTitle
                );
                break;

            case 'application-rejected':
                if (!data.volunteerName || !data.volunteerEmail || !data.opportunityTitle) {
                    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
                }
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
        console.error('[Email API] Error:', error.message);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
