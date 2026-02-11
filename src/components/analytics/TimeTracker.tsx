'use client';
import { useEffect } from 'react';
import { incrementTimeOnSite } from '@/app/actions/analytics';

export function TimeTracker() {
    useEffect(() => {
        const interval = setInterval(() => {
            // Check if user is active? For now just track open tab time
            if (document.visibilityState === 'visible') {
                incrementTimeOnSite(60);
            }
        }, 60000); // Every minute

        return () => clearInterval(interval);
    }, []);

    return null;
}
