'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';

export function JoinButton({ seasonId }: { seasonId: string }) {
    const [loading, setLoading] = useState(false);

    const handleJoin = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/league/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ seasonId })
            });

            const data = await res.json();
            if (data.success) {
                window.location.href = '/league/driver';
            } else {
                alert(data.error || 'Failed to join');
                setLoading(false);
            }
        } catch (err) {
            console.error(err);
            alert('Error joining league');
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleJoin}
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold h-12 text-lg shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-shadow hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] disabled:opacity-50 disabled:cursor-not-allowed">
            <Zap className="mr-2 h-5 w-5" />
            {loading ? 'Joining...' : 'Join Now (Free)'}
        </Button>
    );
}
