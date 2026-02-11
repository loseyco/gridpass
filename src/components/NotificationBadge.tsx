'use client';

import { useEffect, useState } from 'react';
import { getNewNotificationCount } from '@/app/actions/notifications';

export default function NotificationBadge() {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const checkNotifications = async () => {
            try {
                const num = await getNewNotificationCount();
                setCount(num);
            } catch (e) {
                // Silent fail
            }
        };

        checkNotifications();
        // Poll every minute
        const interval = setInterval(checkNotifications, 60000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    if (count === 0) return null;

    return (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-1 ring-white">
            {count > 9 ? '9+' : count}
        </span>
    );
}
