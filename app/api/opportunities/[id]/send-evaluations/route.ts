/**
 * POST /api/opportunities/[id]/send-evaluations
 *
 * Sends evaluation request emails to all accepted volunteers for an opportunity
 * whose date has passed. Sets `evaluationEmailsSent: true` on the opportunity
 * to prevent duplicate sends.
 *
 * Security:
 *   - Verifies Firebase ID token via firebase-admin
 *   - Ensures caller role == "organization"
 *   - Ensures opportunity belongs to the caller organization
 *
 * Headers: Authorization: Bearer <idToken>
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';
import { sendEvaluationEmail } from '@/app/lib/email';

export const runtime = 'nodejs';

const THROTTLE_EVERY_N = 10;
const THROTTLE_DELAY_MS = 300;

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const opportunityId = params.id;

        // ========== 1. Auth ==========
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

        const callerUid = decodedToken.uid;

        // ========== 2. Check caller is organization ==========
        const userDoc = await adminDb.collection('users').doc(callerUid).get();
        if (!userDoc.exists || userDoc.data()?.role !== 'organization') {
            return NextResponse.json(
                { error: 'Only organizations can send evaluation emails' },
                { status: 403 }
            );
        }

        // ========== 3. Load opportunity ==========
        const oppRef = adminDb.collection('opportunities').doc(opportunityId);
        const oppDoc = await oppRef.get();

        if (!oppDoc.exists) {
            return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
        }

        const oppData = oppDoc.data()!;

        // ========== 3a. Ownership check ==========
        if (oppData.organizationId !== callerUid) {
            return NextResponse.json(
                { error: 'You can only send evaluations for your own opportunities' },
                { status: 403 }
            );
        }

        // ========== 3b. Already sent check ==========
        if (oppData.evaluationEmailsSent) {
            return NextResponse.json({
                success: true,
                message: 'Evaluation emails were already sent',
                sent: 0,
            });
        }

        // ========== 3c. Check opportunity date has passed ==========
        if (oppData.date) {
            const oppEndTime = new Date(`${oppData.date}T${oppData.endTime || oppData.startTime || '23:59'}`);
            if (oppEndTime > new Date()) {
                return NextResponse.json(
                    { error: 'Cannot send evaluation emails before the opportunity has ended' },
                    { status: 400 }
                );
            }
        }

        // ========== 4. Get accepted applications ==========
        const appsSnapshot = await adminDb
            .collection('applications')
            .where('opportunityId', '==', opportunityId)
            .where('status', '==', 'accepted')
            .get();

        const acceptedApps = appsSnapshot.docs;

        if (acceptedApps.length === 0) {
            // Mark as sent even if no accepted volunteers to prevent retrying
            await oppRef.update({ evaluationEmailsSent: true });
            return NextResponse.json({
                success: true,
                message: 'No accepted volunteers to notify',
                sent: 0,
            });
        }

        // ========== 5. Send emails with throttling ==========
        let sentCount = 0;
        let failedCount = 0;

        for (let i = 0; i < acceptedApps.length; i++) {
            const appData = acceptedApps[i].data();
            const maskedEmail = appData.volunteerEmail
                ? appData.volunteerEmail.replace(/(.{2}).*(@.*)/, '$1***$2')
                : '***';

            try {
                await sendEvaluationEmail(
                    appData.volunteerName || 'متطوع',
                    appData.volunteerEmail,
                    oppData.title
                );
                sentCount++;
                console.log(`[SendEvaluations] ✅ Sent to ${maskedEmail}`);
            } catch (emailErr: any) {
                failedCount++;
                console.error(`[SendEvaluations] ❌ Failed to send to ${maskedEmail}:`, emailErr.message);
            }

            // Throttle every N emails
            if ((i + 1) % THROTTLE_EVERY_N === 0 && i < acceptedApps.length - 1) {
                await sleep(THROTTLE_DELAY_MS);
            }
        }

        // ========== 6. Mark opportunity as evaluation emails sent ==========
        await oppRef.update({
            evaluationEmailsSent: true,
            evaluationEmailsSentAt: new Date(),
        });

        console.log(
            `[SendEvaluations] Opportunity ${opportunityId}: sent=${sentCount} failed=${failedCount}`
        );

        return NextResponse.json({
            success: true,
            sent: sentCount,
            failed: failedCount,
            total: acceptedApps.length,
        });
    } catch (error: any) {
        console.error('[SendEvaluations] Error:', error.message);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
