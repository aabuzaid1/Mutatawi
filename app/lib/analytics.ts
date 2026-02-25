/**
 * @fileoverview نظام تتبع الإحصائيات باستخدام Firebase Firestore.
 * يخزن بيانات زيارات الصفحات والأحداث المخصصة في Firestore.
 */

import {
    collection,
    doc,
    setDoc,
    getDocs,
    increment,
    serverTimestamp,
    query,
    where,
} from 'firebase/firestore';
import { db } from './firebase';

// ===================== PAGE VIEW TRACKING =====================

/**
 * تسجيل زيارة صفحة في Firestore.
 * يستخدم مسار الصفحة كمعرف فريد ويزيد العداد بـ 1.
 * @param path - مسار الصفحة (مثل: /opportunities, /register)
 */
export async function trackPageView(path: string) {
    try {
        const docId = path.replace(/\//g, '_') || '_home';
        const ref = doc(db, 'page_views', docId);
        await setDoc(ref, {
            path,
            viewCount: increment(1),
            lastVisited: serverTimestamp(),
        }, { merge: true });
    } catch (error) {
        // Silent fail - analytics should never break the app
        console.warn('Analytics trackPageView error:', error);
    }
}

// ===================== CUSTOM EVENT TRACKING =====================

export type AnalyticsEventName = 'register_success' | 'view_opportunity' | 'click_apply';

/**
 * تسجيل حدث مخصص في Firestore.
 * @param eventName - اسم الحدث
 * @param data - بيانات إضافية مرتبطة بالحدث
 */
export async function trackEvent(eventName: AnalyticsEventName, data?: Record<string, any>) {
    try {
        // Increment counter in summary doc
        const summaryRef = doc(db, 'analytics_events', eventName);
        await setDoc(summaryRef, {
            eventName,
            count: increment(1),
            lastTriggered: serverTimestamp(),
        }, { merge: true });
    } catch (error) {
        console.warn('Analytics trackEvent error:', error);
    }
}

// ===================== ORGANIZATION-SPECIFIC TRACKING =====================

/**
 * تسجيل مشاهدة فرصة تطوعية مع ربطها بالمنظمة.
 * @param opportunityId - معرف الفرصة
 * @param organizationId - معرف المنظمة المالكة للفرصة
 * @param opportunityTitle - عنوان الفرصة
 */
export async function trackOpportunityView(
    opportunityId: string,
    organizationId: string,
    opportunityTitle: string
) {
    try {
        const ref = doc(db, 'opportunity_views', opportunityId);
        await setDoc(ref, {
            opportunityId,
            organizationId,
            opportunityTitle,
            viewCount: increment(1),
            lastViewed: serverTimestamp(),
        }, { merge: true });
    } catch (error) {
        console.warn('Analytics trackOpportunityView error:', error);
    }
}

export interface OpportunityViewStat {
    opportunityId: string;
    opportunityTitle: string;
    viewCount: number;
    lastViewed: Date;
}

/**
 * جلب إحصائيات المنظمة (المشاهدات والطلبات لكل فرصة).
 * @param organizationId - معرف المنظمة
 */
export async function getOrganizationViewStats(organizationId: string): Promise<OpportunityViewStat[]> {
    try {
        const q = query(
            collection(db, 'opportunity_views'),
            where('organizationId', '==', organizationId)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => {
            const data = d.data();
            return {
                opportunityId: data.opportunityId || d.id,
                opportunityTitle: data.opportunityTitle || '',
                viewCount: data.viewCount || 0,
                lastViewed: data.lastViewed?.toDate?.() || new Date(),
            };
        });
    } catch (error) {
        console.warn('getOrganizationViewStats error:', error);
        return [];
    }
}
