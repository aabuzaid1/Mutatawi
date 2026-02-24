'use client';

/**
 * @fileoverview مكون تتبع الصفحات تلقائياً.
 * يستمع لتغييرات المسار ويسجل كل زيارة في Firestore.
 */

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/app/lib/analytics';

export default function AnalyticsTracker() {
    const pathname = usePathname();
    const lastPath = useRef<string>('');

    useEffect(() => {
        if (pathname && pathname !== lastPath.current) {
            lastPath.current = pathname;
            trackPageView(pathname);
        }
    }, [pathname]);

    return null;
}
