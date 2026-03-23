import { NextResponse } from 'next/server';
import { adminDb } from '@/app/lib/firebase-admin';

/**
 * GET /api/stats
 * Public endpoint — returns site-wide statistics.
 * Uses Admin SDK so it bypasses Firestore security rules.
 */
export async function GET() {
    try {
        // 1. Count volunteers & sum hours
        const volunteersSnap = await adminDb
            .collection('users')
            .where('role', '==', 'volunteer')
            .get();

        let totalHours = 0;
        volunteersSnap.forEach((doc) => {
            const data = doc.data();
            if (data.hoursVolunteered) {
                totalHours += data.hoursVolunteered;
            }
        });

        // 2. Count organizations
        const orgsSnap = await adminDb
            .collection('users')
            .where('role', '==', 'organization')
            .get();

        // 3. Count opportunities
        const oppsSnap = await adminDb.collection('opportunities').get();

        return NextResponse.json({
            volunteerCount: volunteersSnap.size,
            totalHours: Math.round(totalHours),
            orgCount: orgsSnap.size,
            oppCount: oppsSnap.size,
        }, {
            headers: {
                // Cache for 5 minutes to avoid hammering the database
                'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            },
        });
    } catch (error: any) {
        console.error('Error fetching stats:', error);
        return NextResponse.json(
            { error: 'Failed to fetch stats' },
            { status: 500 },
        );
    }
}
