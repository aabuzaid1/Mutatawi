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

interface UseFirestoreOptions {
    collectionName: string;
    constraints?: QueryConstraint[];
    enabled?: boolean;
}

export function useFirestore<T extends DocumentData>({
    collectionName,
    constraints = [],
    enabled = true,
}: UseFirestoreOptions) {
    const [data, setData] = useState<(T & { id: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
