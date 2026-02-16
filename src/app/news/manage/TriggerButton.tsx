'use client';

import { useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TriggerButton() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const router = useRouter();

    const handleTrigger = async () => {
        setLoading(true);
        setStatus('idle');
        try {
            const res = await fetch('/api/cron/daily-news');
            if (!res.ok) throw new Error('Failed to trigger');

            setStatus('success');
            router.refresh(); // Refresh data on the page

            // Reset status after a few seconds
            setTimeout(() => setStatus('idle'), 3000);
        } catch (error) {
            console.error(error);
            setStatus('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleTrigger}
            disabled={loading}
            className={`
        px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-2
        ${status === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' :
                    status === 'error' ? 'bg-red-600 hover:bg-red-700 text-white' :
                        'bg-red-600 hover:bg-red-700 text-white'}
        ${loading ? 'opacity-80 cursor-wait' : ''}
      `}
        >
            {loading ? (
                <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Scraping...
                </>
            ) : status === 'success' ? (
                <>
                    <CheckCircle className="w-3 h-3" />
                    Done!
                </>
            ) : status === 'error' ? (
                <>
                    <AlertCircle className="w-3 h-3" />
                    Error
                </>
            ) : (
                <>
                    <RefreshCw className="w-3 h-3" />
                    Trigger Scraper
                </>
            )}
        </button>
    );
}
