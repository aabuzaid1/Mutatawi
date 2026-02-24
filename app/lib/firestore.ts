import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    Timestamp,
    increment,
} from 'firebase/firestore';
import { db } from './firebase';
import { Opportunity, Application, UserProfile, Feedback } from '../types';

// ===================== OPPORTUNITIES =====================

export async function createOpportunity(data: Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt'>) {
    console.log('createOpportunity called with data:', JSON.stringify(data, null, 2));
    try {
        const docRef = await addDoc(collection(db, 'opportunities'), {
            ...data,
            spotsFilled: 0,
            status: 'open',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });
        console.log('Opportunity created with ID:', docRef.id);
        return docRef.id;
    } catch (error: any) {
        console.error('Firestore createOpportunity error:', error.code, error.message);
        throw error;
    }
}

export async function getOpportunities(filters?: {
    category?: string;
    location?: string;
    status?: string;
    organizationId?: string;
    featured?: boolean;
    excludePast?: boolean;
}) {
    try {
        // Build query constraints
        const constraints: any[] = [];

        if (filters?.status) {
            constraints.push(where('status', '==', filters.status));
        }
        if (filters?.category) {
            constraints.push(where('category', '==', filters.category));
        }
        if (filters?.organizationId) {
            constraints.push(where('organizationId', '==', filters.organizationId));
        }

        let results;
        try {
            // Try with orderBy (requires composite index)
            const q = query(collection(db, 'opportunities'), ...constraints, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            results = snapshot.docs;
        } catch (indexError: any) {
            // Fallback: if index doesn't exist, query without orderBy
            console.warn('Firestore index missing, fetching without sort:', indexError.message);
            const q = query(collection(db, 'opportunities'), ...constraints);
            const snapshot = await getDocs(q);
            results = snapshot.docs;
        }

        let mappedResults = results.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
        })) as Opportunity[];

        // Filter out past opportunities if excludePast is true
        if (filters?.excludePast) {
            const now = new Date();
            mappedResults = mappedResults.filter(opp => {
                if (!opp.date) return true; // Keep if no date is set
                const oppDateTime = new Date(`${opp.date}T${opp.startTime || '00:00'}`);
                return oppDateTime >= now;
            });
        }

        return mappedResults;
    } catch (error: any) {
        console.error('getOpportunities error:', error.code, error.message);
        return [];
    }
}

export async function getOpportunity(id: string) {
    const docSnap = await getDoc(doc(db, 'opportunities', id));
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
    } as Opportunity;
}

export async function updateOpportunity(id: string, data: Partial<Opportunity>) {
    await updateDoc(doc(db, 'opportunities', id), {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteOpportunity(id: string) {
    // Mark all applications for this opportunity as 'deleted'
    const appsQuery = query(
        collection(db, 'applications'),
        where('opportunityId', '==', id)
    );
    const appsSnap = await getDocs(appsQuery);
    const updatePromises = appsSnap.docs.map(appDoc =>
        updateDoc(doc(db, 'applications', appDoc.id), {
            status: 'deleted',
            updatedAt: serverTimestamp(),
        })
    );
    await Promise.all(updatePromises);

    // Delete the opportunity
    await deleteDoc(doc(db, 'opportunities', id));
}

// ===================== APPLICATIONS =====================

export async function createApplication(data: {
    opportunityId: string;
    opportunityTitle: string;
    volunteerId: string;
    volunteerName: string;
    volunteerEmail: string;
    volunteerPhone?: string;
    message: string;
}) {
    // Check if already applied
    const existing = query(
        collection(db, 'applications'),
        where('opportunityId', '==', data.opportunityId),
        where('volunteerId', '==', data.volunteerId)
    );
    const existingSnap = await getDocs(existing);
    if (!existingSnap.empty) {
        throw new Error('لقد تقدمت لهذه الفرصة مسبقاً');
    }

    const docRef = await addDoc(collection(db, 'applications'), {
        ...data,
        status: 'pending',
        appliedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });

    // Increment spotsFilled
    await updateDoc(doc(db, 'opportunities', data.opportunityId), {
        spotsFilled: increment(1),
    });

    return docRef.id;
}

export async function getApplicationsByOrganization(organizationId: string) {
    // Get all opportunities for this organization
    const oppsQuery = query(
        collection(db, 'opportunities'),
        where('organizationId', '==', organizationId)
    );
    const oppsSnap = await getDocs(oppsQuery);
    const oppIds = oppsSnap.docs.map(d => d.id);

    if (oppIds.length === 0) return [];

    // Get applications for those opportunities (Firestore 'in' supports up to 30)
    const batchIds = oppIds.slice(0, 30);
    const appsQuery = query(
        collection(db, 'applications'),
        where('opportunityId', 'in', batchIds)
    );
    const appsSnap = await getDocs(appsQuery);

    return appsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        appliedAt: doc.data().appliedAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    })) as Application[];
}

export async function getApplicationsByVolunteer(volunteerId: string) {
    try {
        const q = query(
            collection(db, 'applications'),
            where('volunteerId', '==', volunteerId),
            orderBy('appliedAt', 'desc')
        );
        const snapshot = await getDocs(q);
        console.log(`getApplicationsByVolunteer: found ${snapshot.size} applications for ${volunteerId}`);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            appliedAt: doc.data().appliedAt?.toDate?.() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
        })) as Application[];
    } catch (error: any) {
        console.warn('getApplicationsByVolunteer: index missing, fetching without orderBy', error.message);
        // Fallback: fetch without orderBy if composite index doesn't exist
        const q = query(
            collection(db, 'applications'),
            where('volunteerId', '==', volunteerId)
        );
        const snapshot = await getDocs(q);
        console.log(`getApplicationsByVolunteer fallback: found ${snapshot.size} applications`);
        const results = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            appliedAt: doc.data().appliedAt?.toDate?.() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
        })) as Application[];
        // Sort client-side
        return results.sort((a, b) => b.appliedAt.getTime() - a.appliedAt.getTime());
    }
}

export async function updateApplicationStatus(id: string, status: 'accepted' | 'rejected') {
    await updateDoc(doc(db, 'applications', id), {
        status,
        updatedAt: serverTimestamp(),
    });
}

export async function withdrawApplication(applicationId: string, opportunityId: string) {
    // Delete the application
    await deleteDoc(doc(db, 'applications', applicationId));
    // Decrement spotsFilled
    await updateDoc(doc(db, 'opportunities', opportunityId), {
        spotsFilled: increment(-1),
    });
}

// ===================== VOLUNTEER STATS SYNC =====================

export async function syncVolunteerStats(volunteerId: string): Promise<{
    hoursVolunteered: number;
    opportunitiesCompleted: number;
    completedApps: Array<{ opportunityId: string; opportunityTitle: string; date: string; duration: number }>;
}> {
    // Get all accepted applications for this volunteer
    const q = query(
        collection(db, 'applications'),
        where('volunteerId', '==', volunteerId),
        where('status', '==', 'accepted')
    );
    const snapshot = await getDocs(q);
    const acceptedApps = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Application[];

    if (acceptedApps.length === 0) {
        return { hoursVolunteered: 0, opportunitiesCompleted: 0, completedApps: [] };
    }

    // Fetch opportunity details for each accepted app
    const now = new Date();
    const completedApps: Array<{ opportunityId: string; opportunityTitle: string; date: string; duration: number }> = [];
    let totalHours = 0;

    await Promise.all(
        acceptedApps.map(async (app) => {
            const opp = await getOpportunity(app.opportunityId);
            if (opp && opp.date) {
                const oppDate = new Date(`${opp.date}T${opp.endTime || opp.startTime || '23:59'}`);
                if (oppDate < now) {
                    // Opportunity has ended - count as completed
                    const duration = opp.duration || 0;
                    totalHours += duration;
                    completedApps.push({
                        opportunityId: app.opportunityId,
                        opportunityTitle: app.opportunityTitle,
                        date: opp.date,
                        duration,
                    });
                }
            }
        })
    );

    // Update user profile with latest stats
    await updateDoc(doc(db, 'users', volunteerId), {
        hoursVolunteered: totalHours,
        opportunitiesCompleted: completedApps.length,
        updatedAt: serverTimestamp(),
    });

    return { hoursVolunteered: totalHours, opportunitiesCompleted: completedApps.length, completedApps };
}

// ===================== USER PROFILES =====================

export async function updateUserProfile(uid: string, data: Partial<UserProfile>) {
    await updateDoc(doc(db, 'users', uid), {
        ...data,
        updatedAt: serverTimestamp(),
    });
}

export async function getUserStats(uid: string, role: 'volunteer' | 'organization') {
    if (role === 'volunteer') {
        const appsQuery = query(
            collection(db, 'applications'),
            where('volunteerId', '==', uid)
        );
        const appsSnap = await getDocs(appsQuery);
        const apps = appsSnap.docs.map(d => d.data());

        return {
            totalApplications: apps.length,
            accepted: apps.filter(a => a.status === 'accepted').length,
            completed: apps.filter(a => a.status === 'completed').length,
            pending: apps.filter(a => a.status === 'pending').length,
        };
    } else {
        const oppsQuery = query(
            collection(db, 'opportunities'),
            where('organizationId', '==', uid)
        );
        const oppsSnap = await getDocs(oppsQuery);

        const totalApplicants = oppsSnap.docs.reduce((sum, d) => sum + (d.data().spotsFilled || 0), 0);

        return {
            totalOpportunities: oppsSnap.size,
            totalApplicants,
            openOpportunities: oppsSnap.docs.filter(d => d.data().status === 'open').length,
        };
    }
}

// ===================== PLATFORM STATS =====================

export async function getPlatformStats() {
    const [usersSnap, oppsSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'opportunities')),
    ]);

    const users = usersSnap.docs.map(d => d.data());
    const volunteers = users.filter(u => u.role === 'volunteer').length;
    const organizations = users.filter(u => u.role === 'organization').length;

    return {
        totalVolunteers: volunteers || 200,
        totalOrganizations: organizations || 5,
        totalHours: 100,
        totalOpportunities: oppsSnap.size || 20,
    };
}

// ===================== FEEDBACK =====================

export async function createFeedback(data: Omit<Feedback, 'id' | 'createdAt'>) {
    // Check if already submitted feedback
    const existing = query(
        collection(db, 'feedbacks'),
        where('opportunityId', '==', data.opportunityId),
        where('volunteerId', '==', data.volunteerId)
    );
    const existingSnap = await getDocs(existing);
    if (!existingSnap.empty) {
        throw new Error('لقد أرسلت تقييمك لهذه الفرصة مسبقاً');
    }

    const docRef = await addDoc(collection(db, 'feedbacks'), {
        ...data,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function hasVolunteerRated(opportunityId: string, volunteerId: string): Promise<boolean> {
    const q = query(
        collection(db, 'feedbacks'),
        where('opportunityId', '==', opportunityId),
        where('volunteerId', '==', volunteerId)
    );
    const snap = await getDocs(q);
    return !snap.empty;
}

export async function getFeedbacks(limitCount: number = 10) {
    const q = query(
        collection(db, 'feedbacks'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    })) as Feedback[];
}

export async function getFeedbacksByOpportunity(opportunityId: string) {
    const q = query(
        collection(db, 'feedbacks'),
        where('opportunityId', '==', opportunityId),
        orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
    })) as Feedback[];
}

// ===================== USER PROFILES =====================

export async function getUserProfileById(uid: string): Promise<UserProfile | null> {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
    }
    return null;
}
