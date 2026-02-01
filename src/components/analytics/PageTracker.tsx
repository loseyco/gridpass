'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { trackPageView } from '@/app/actions/analytics';

export default function PageTracker() {
    const pathname = usePathname();
    // Use a ref to prevent double-firing in Strict Mode if needed, 
    // though for analytics rough counts are usually fine. 
    // We'll keep it simple for now.

    useEffect(() => {
        if (pathname) {
            // Prevent tracking on localhost
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return;

            // Fire and forget, passing referrer
            trackPageView(pathname, document.referrer);
        }
    }, [pathname]);

    return null;
}
