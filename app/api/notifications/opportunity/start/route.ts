/**
 * POST /api/notifications/opportunity/start
 *
 * Creates a notification job when a new opportunity is posted.
 * - Verifies Firebase ID token
 * - Ensures caller is an organization
 * - Ensures opportunity belongs to the caller
 * - Creates a notificationJobs doc with status "pending"
 *
 * Body: { opportunityId: string }
 * Headers: Authorization: Bearer <idToken>
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
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
        console.log(`[NotifyStart] Authenticated user: ${callerUid}`);

        // ========== 2. Check caller is organization ==========
        const userDoc = await adminDb.collection('users').doc(callerUid).get();
        if (!userDoc.exists || userDoc.data()?.role !== 'organization') {
            console.warn(`[NotifyStart] Forbidden: user ${callerUid} is not an organization`);
            return NextResponse.json(
                { error: 'Only organizations can trigger notifications' },
                { status: 403 }
            );
        }

        // ========== 3. Parse body ==========
        const body = await request.json();
        const { opportunityId } = body;

        if (!opportunityId) {
            return NextResponse.json(
                { error: 'opportunityId is required' },
                { status: 400 }
            );
        }

        // ========== 4. Verify opportunity belongs to caller ==========
        const oppDoc = await adminDb.collection('opportunities').doc(opportunityId).get();
        if (!oppDoc.exists) {
            return NextResponse.json(
                { error: 'Opportunity not found' },
                { status: 404 }
            );
        }

        const oppData = oppDoc.data()!;
        if (oppData.organizationId !== callerUid) {
            console.warn(`[NotifyStart] Forbidden: opportunity ${opportunityId} does not belong to ${callerUid}`);
            return NextResponse.json(
                { error: 'You can only notify for your own opportunities' },
                { status: 403 }
            );
        }

        // ========== 5. Create notification job ==========
        const jobRef = await adminDb.collection('notificationJobs').add({
            opportunityId,
            opportunityTitle: oppData.title || '',
            createdAt: new Date(),
            createdByOrgId: callerUid,
            status: 'pending',
            lastCursor: null,
            sentCount: 0,
            error: null,
        });

        console.log(`[NotifyStart] Created job ${jobRef.id} for opportunity "${oppData.title}" by org ${callerUid}`);

        return NextResponse.json({
            success: true,
            jobId: jobRef.id,
        });
    } catch (error: any) {
        console.error('[NotifyStart] Error:', error.message);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
