'use client';

import { useState } from 'react';
import { toggleUserBan } from '@/app/actions/auth';
import { Loader2, Ban, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
    userId: string;
    isBanned: boolean;
}

export default function UserBanToggle({ userId, isBanned: initialStatus }: Props) {
    const [isBanned, setIsBanned] = useState(initialStatus);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleToggle = async () => {
        if (!confirm(isBanned ? 'Unban this user?' : 'Suspend this user (Read-Only Mode)?')) return;

        setLoading(true);
        const newState = !isBanned;

        try {
            const result = await toggleUserBan(userId, newState);
            if (result.error) {
                alert(result.error);
            } else {
                setIsBanned(newState);
                router.refresh();
            }
        } catch (err) {
            console.error(err);
            alert('Failed to update status');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />;

    return (
        <button
            onClick={handleToggle}
            className={`px-3 py-1 rounded text-xs font-bold border transition-colors flex items-center gap-1.5 ${isBanned
                    ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                    : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white hover:border-neutral-500'
                }`}
            title={isBanned ? "Click to Unban" : "Click to Suspend"}
        >
            {isBanned ? <Ban className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />}
            {isBanned ? 'SUSPENDED' : 'ACTIVE'}
        </button>
    );
}
