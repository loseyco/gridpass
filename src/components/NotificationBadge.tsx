'use client';

import { useEffect, useState } from 'react';
import { getPendingRecommendations } from '@/app/actions/recommendations';

export default function NotificationBadge() {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const checkNotifications = async () => {
            try {
                // We reuse the pending recommendations action. 
                // In the future, we might want a dedicated lightweight "count" action.
                const pending = await getPendingRecommendations();
                setCount(pending.length);
            } catch (e) {
                // Silent fail
            }
        };

        checkNotifications();
        // Poll every minute
        const interval = setInterval(checkNotifications, 60000);

        // Listen for local updates
        const handleUpdate = () => checkNotifications();
        window.addEventListener('recommendation-updated', handleUpdate);

        return () => {
            clearInterval(interval);
            window.removeEventListener('recommendation-updated', handleUpdate);
        };
    }, []);

    if (count === 0) return null;

    return (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {count > 9 ? '9+' : count}
        </span>
    );
}
