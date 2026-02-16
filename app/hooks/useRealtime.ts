'use client';

import { useState, useEffect } from 'react';
import {
    collection,
    query,
    onSnapshot,
    QueryConstraint,
    DocumentData,
} from 'firebase/firestore';
import { db } from '../lib/firebase';

interface UseRealtimeOptions {
    collectionName: string;
    constraints?: QueryConstraint[];
    enabled?: boolean;
}

export function useRealtime<T extends DocumentData>({
    collectionName,
    constraints = [],
    enabled = true,
}: UseRealtimeOptions) {
    const [data, setData] = useState<(T & { id: string })[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!enabled) {
            setLoading(false);
            return;
        }

        const q = query(collection(db, collectionName), ...constraints);

        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const docs = snapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                })) as (T & { id: string })[];
                setData(docs);
                setLoading(false);
                setError(null);
            },
            (err) => {
                setError(err.message);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [collectionName, enabled]);

    return { data, loading, error };
}
