/**
 * @fileoverview نظام تتبع الإحصائيات باستخدام Firebase Firestore.
 * يخزن بيانات زيارات الصفحات والأحداث المخصصة في Firestore.
 */

import {
    collection,
    doc,
    setDoc,
    getDocs,
    getDoc,
    increment,
    serverTimestamp,
    orderBy,
    query,
    Timestamp,
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

// ===================== PER-OPPORTUNITY VIEW TRACKING =====================

/**
 * تسجيل مشاهدة فرصة تطوعية معينة.
 * يُنشئ أو يُحدّث وثيقة خاصة بالفرصة ويزيد عدد المشاهدات.
 * @param opportunityId - معرف الفرصة
 */
export async function trackOpportunityView(opportunityId: string) {
    try {
        const ref = doc(db, 'opportunity_views', opportunityId);
        await setDoc(ref, {
            opportunityId,
            viewCount: increment(1),
            lastViewed: serverTimestamp(),
        }, { merge: true });
    } catch (error) {
        console.warn('Analytics trackOpportunityView error:', error);
    }
}

export interface OpportunityViewStat {
    opportunityId: string;
    viewCount: number;
    lastViewed: Date;
}

/**
 * جلب إحصائيات المشاهدات لمجموعة من الفرص.
 * @param opportunityIds - قائمة بمعرفات الفرص
 */
export async function getOpportunityViewStats(opportunityIds: string[]): Promise<Record<string, OpportunityViewStat>> {
    const result: Record<string, OpportunityViewStat> = {};
    if (opportunityIds.length === 0) return result;

    // Fetch each opportunity's view doc
    const promises = opportunityIds.map(async (oppId) => {
        try {
            const ref = doc(db, 'opportunity_views', oppId);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                const data = snap.data();
                result[oppId] = {
                    opportunityId: oppId,
                    viewCount: data.viewCount || 0,
                    lastViewed: data.lastViewed?.toDate?.() || new Date(),
                };
            } else {
                result[oppId] = { opportunityId: oppId, viewCount: 0, lastViewed: new Date() };
            }
        } catch {
            result[oppId] = { opportunityId: oppId, viewCount: 0, lastViewed: new Date() };
        }
    });

    await Promise.all(promises);
    return result;
}

// ===================== FETCH ANALYTICS =====================

export interface PageViewStat {
    path: string;
    viewCount: number;
    lastVisited: Date;
}

export interface EventStat {
    eventName: string;
    count: number;
    lastTriggered: Date;
}

/**
 * جلب جميع إحصائيات الصفحات.
 */
export async function getPageViewStats(): Promise<PageViewStat[]> {
    const snapshot = await getDocs(collection(db, 'page_views'));
    return snapshot.docs
        .map(doc => {
            const data = doc.data();
            return {
                path: data.path || doc.id,
                viewCount: data.viewCount || 0,
                lastVisited: data.lastVisited?.toDate?.() || new Date(),
            };
        })
        .sort((a, b) => b.viewCount - a.viewCount);
}

/**
 * جلب إحصائيات الأحداث المخصصة.
 */
export async function getEventStats(): Promise<EventStat[]> {
    const snapshot = await getDocs(collection(db, 'analytics_events'));
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            eventName: data.eventName || doc.id,
            count: data.count || 0,
            lastTriggered: data.lastTriggered?.toDate?.() || new Date(),
        };
    });
}

/**
 * جلب إجمالي الزيارات.
 */
export async function getTotalPageViews(): Promise<number> {
    const stats = await getPageViewStats();
    return stats.reduce((sum, s) => sum + s.viewCount, 0);
}
