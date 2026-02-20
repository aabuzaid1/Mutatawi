/**
 * @fileoverview خطاف مخصص لإدارة اتصالات Firestore (Custom Firestore Hook)
 * يُوفر واجهة مبسطة ومتفاعلة مع React لجلب، إضافة، تحديث، وحذف الوثائق.
 */

'use client';

import { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    QueryConstraint,
    DocumentData,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * إعدادات الخطاف المخصص (Hook Options).
 * @interface UseFirestoreOptions
 * @property {string} collectionName - اسم المجموعة في القاعدة (مثل 'users').
 * @property {QueryConstraint[]} [constraints] - قيود الاستعلام (where, orderBy, limit).
 * @property {boolean} [enabled] - تفعيل أو تعطيل الجلب التلقائي (مفيد للتأجيل).
 */
interface UseFirestoreOptions {
    collectionName: string;
    constraints?: QueryConstraint[];
    enabled?: boolean;
}

/**
 * خطاف مخصص للتعامل مع دورة حياة مستندات Firestore.
 * 
 * @template T - نوع البيانات (Interface) المتوقع إرجاعه من المجموعة.
 * @param {UseFirestoreOptions} options - خيارات الاتصال.
 * @returns كائن يحتوي على البيانات `data`، حالة التحميل `loading`، خطأ إن وجد `error`،
 * ودوال للتعديل `addDocument`, `updateDocument`, `deleteDocument`, وإعادة الجلب `refetch`.
 */
export function useFirestore<T extends DocumentData>({
    collectionName,
    constraints = [],
    enabled = true,
}: UseFirestoreOptions) {
    const [data, setData] = useState<(T & { id: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * دالة الجلب الأساسية للبيانات (Fetch Function).
     * تجمع الوثائق بناءً على القيود الممررة وتحدث حالة `data`.
     */
    const fetchData = async () => {
        if (!enabled) return;
        setLoading(true);
        try {
            const q = query(collection(db, collectionName), ...constraints);
            const snapshot = await getDocs(q);
            const docs = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as (T & { id: string })[];
            setData(docs);
            setError(null);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [collectionName, enabled]);

    /**
     * إضافة مستند جديد إلى المجموعة المحددة.
     * 
     * @param {Omit<T, 'id'>} docData - بيانات المستند بدون الـ id (يُولد تلقائياً).
     * @returns {Promise<string>} معرّف الوثيقة الجديد (Document ID).
     * @throws {Error} في حال فشل الإضافة بسبب قواعد الأمان أو انقطاع الاتصال.
     */
    const addDocument = async (docData: Omit<T, 'id'>) => {
        try {
            const docRef = await addDoc(collection(db, collectionName), {
                ...docData,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            await fetchData();
            return docRef.id;
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    /**
     * تحديث وثيقة حالية في المجموعة.
     * 
     * @param {string} id - معرّف الوثيقة المراد تحديثها.
     * @param {Partial<T>} updates - التحديثات الجزئية.
     * @returns {Promise<void>}
     */
    const updateDocument = async (id: string, updates: Partial<T>) => {
        try {
            await updateDoc(doc(db, collectionName, id), {
                ...updates,
                updatedAt: new Date(),
            });
            await fetchData();
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    /**
     * حذف وثيقة معينة من المجموعة بشكل نهائي (Hard Delete).
     * 
     * @param {string} id - المعرّف (ID) الخاص بالوثيقة.
     * @returns {Promise<void>}
     */
    const deleteDocument = async (id: string) => {
        try {
            await deleteDoc(doc(db, collectionName, id));
            await fetchData();
        } catch (err: any) {
            setError(err.message);
            throw err;
        }
    };

    return {
        data,
        loading,
        error,
        refetch: fetchData,
        addDocument,
        updateDocument,
        deleteDocument,
    };
}
