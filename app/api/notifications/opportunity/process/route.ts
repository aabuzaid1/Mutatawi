/**
 * POST /api/notifications/opportunity/process
 *
 * Processes a notification job in batches to avoid Vercel timeouts.
 * Security:
 *   - Verifies Firebase ID token via firebase-admin
 *   - Ensures caller role == "organization"
 *   - Ensures job.createdByOrgId === caller uid (ownership check)
 * Idempotency:
 *   - If job status is "processing" and was updated < 2 min ago → reject (lock)
 * Rate limiting:
 *   - batchSize capped at 50 (Gmail SMTP safety)
 *   - 300ms delay every 10 emails to avoid Gmail rate-limit
 *
 * Body: { jobId: string, batchSize?: number }
 * Headers: Authorization: Bearer <idToken>
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/app/lib/firebase-admin';
import { sendNewOpportunityNotification } from '@/app/lib/email';

export const runtime = 'nodejs';

const SITE_URL = 'https://mutatawi.vercel.app';
const DEFAULT_BATCH_SIZE = 50;
const MAX_BATCH_SIZE = 50;
const LOCK_WINDOW_MS = 2 * 60 * 1000; // 2 minutes
const THROTTLE_EVERY_N = 10; // pause every N emails
const THROTTLE_DELAY_MS = 300; // ms to pause

function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

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
        console.log(`[NotifyProcess] Authenticated user: ${callerUid}`);

        // ========== 2. Check caller is organization ==========
        const userDoc = await adminDb.collection('users').doc(callerUid).get();
        if (!userDoc.exists || userDoc.data()?.role !== 'organization') {
            return NextResponse.json(
                { error: 'Only organizations can process notifications' },
                { status: 403 }
            );
        }

        // ========== 3. Parse body ==========
        const body = await request.json();
        const { jobId, batchSize: requestedBatch = DEFAULT_BATCH_SIZE } = body;
        const batchSize = Math.min(requestedBatch, MAX_BATCH_SIZE);

        if (!jobId) {
            return NextResponse.json(
                { error: 'jobId is required' },
                { status: 400 }
            );
        }

        // ========== 4. Load job ==========
        const jobRef = adminDb.collection('notificationJobs').doc(jobId);
        const jobDoc = await jobRef.get();

        if (!jobDoc.exists) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        const jobData = jobDoc.data()!;

        // ========== 4a. Security: ownership check ==========
        if (jobData.createdByOrgId !== callerUid) {
            console.warn(`[NotifyProcess] Forbidden: job ${jobId} belongs to ${jobData.createdByOrgId}, not ${callerUid}`);
            return NextResponse.json(
                { error: 'You can only process your own notification jobs' },
                { status: 403 }
            );
        }

        // ========== 4b. Already done or failed ==========
        if (jobData.status === 'done' || jobData.status === 'failed') {
            console.log(`[NotifyProcess] Job ${jobId} already ${jobData.status}`);
            return NextResponse.json({
                success: true,
                processed: 0,
                done: true,
                totalSent: jobData.sentCount || 0,
            });
        }

        // ========== 4c. Idempotency lock: if "processing" and updated <2min ago, reject ==========
        if (jobData.status === 'processing') {
            const updatedAt = jobData.updatedAt?.toDate?.()
                ?? jobData.updatedAt
                ?? null;
            if (updatedAt) {
                const elapsed = Date.now() - new Date(updatedAt).getTime();
                if (elapsed < LOCK_WINDOW_MS) {
                    console.log(`[NotifyProcess] Job ${jobId} is locked (processing for ${Math.round(elapsed / 1000)}s)`);
                    return NextResponse.json({
                        success: false,
                        error: 'Job is currently being processed. Try again later.',
                        retryAfterMs: LOCK_WINDOW_MS - elapsed,
                    }, { status: 409 });
                }
            }
            // If processing but stale (>2min), it likely crashed — allow re-processing
            console.warn(`[NotifyProcess] Job ${jobId} was stale-processing, re-acquiring`);
        }

        // ========== 5. Set status to processing with timestamp ==========
        await jobRef.update({
            status: 'processing',
            updatedAt: new Date(),
        });

        // ========== 6. Query subscribed volunteers in batch ==========
        const opportunityUrl = `${SITE_URL}/opportunities/${jobData.opportunityId}`;
        let volunteersQuery = adminDb
            .collection('users')
            .where('role', '==', 'volunteer')
            .where('emailNotifications', '==', true)
            .orderBy('__name__')
            .limit(batchSize);

        // Use cursor for pagination
        if (jobData.lastCursor) {
            const cursorDoc = await adminDb.collection('users').doc(jobData.lastCursor).get();
            if (cursorDoc.exists) {
                volunteersQuery = volunteersQuery.startAfter(cursorDoc);
            }
        }

        const snapshot = await volunteersQuery.get();
        const volunteers = snapshot.docs;

        console.log(`[NotifyProcess] Job ${jobId}: found ${volunteers.length} volunteers in this batch`);

        // ========== 7. Send emails with throttling ==========
        let sentThisBatch = 0;
        let failedThisBatch = 0;
        let lastProcessedId: string | null = jobData.lastCursor;

        for (let i = 0; i < volunteers.length; i++) {
            const volDoc = volunteers[i];
            const volData = volDoc.data();
            const maskedEmail = volData.email
                ? volData.email.replace(/(.{2}).*(@.*)/, '$1***$2')
                : '***';

            try {
                await sendNewOpportunityNotification(
                    volData.email,
                    volData.displayName || 'متطوع',
                    jobData.opportunityTitle,
                    opportunityUrl
                );
                sentThisBatch++;
                console.log(`[NotifyProcess] ✅ Sent to ${maskedEmail}`);
            } catch (emailErr: any) {
                failedThisBatch++;
                console.error(`[NotifyProcess] ❌ Failed to send to ${maskedEmail}:`, emailErr.message);
                // Continue with next volunteer — don't fail the batch
            }

            lastProcessedId = volDoc.id;

            // Throttle every N emails to respect Gmail rate limits
            if ((i + 1) % THROTTLE_EVERY_N === 0 && i < volunteers.length - 1) {
                await sleep(THROTTLE_DELAY_MS);
            }
        }

        // ========== 8. Update job ==========
        const isDone = volunteers.length < batchSize;
        const newSentCount = (jobData.sentCount || 0) + sentThisBatch;

        await jobRef.update({
            sentCount: newSentCount,
            lastCursor: lastProcessedId,
            status: isDone ? 'done' : 'pending', // back to "pending" so next batch can acquire lock
            updatedAt: new Date(),
        });

        console.log(
            `[NotifyProcess] Job ${jobId}: sent=${sentThisBatch} failed=${failedThisBatch} total=${newSentCount} done=${isDone}`
        );

        return NextResponse.json({
            success: true,
            processed: sentThisBatch,
            failed: failedThisBatch,
            done: isDone,
            totalSent: newSentCount,
            nextCursor: isDone ? null : lastProcessedId,
        });
    } catch (error: any) {
        console.error('[NotifyProcess] Error:', error.message);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
