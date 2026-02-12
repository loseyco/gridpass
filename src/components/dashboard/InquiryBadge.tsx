'use client';

import { useEffect, useState } from 'react';
import { getUnreadInquiryCount } from '@/app/actions/inquiries';

export default function InquiryBadge() {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const fetchCount = async () => {
            try {
                const c = await getUnreadInquiryCount();
                setCount(c);
            } catch (e) {
                console.error('Failed to fetch badge count', e);
            }
        };

        fetchCount();

        // Optional: Poll every minute
        const interval = setInterval(fetchCount, 60000);
        return () => clearInterval(interval);
    }, []);

    if (count === 0) return null;

    return (
        <span className="ml-auto bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-indigo-500/50">
            {count}
        </span>
    );
}
