'use client';

import { AlertTriangle, Lock } from 'lucide-react';

interface Props {
    isBanned: boolean;
}

export default function SuspendedBanner({ isBanned }: Props) {
    if (!isBanned) return null;

    return (
        <div className="w-full bg-red-600 text-white px-4 py-2 flex items-center justify-center gap-3 font-bold text-sm shadow-xl relative z-50">
            <Lock className="w-4 h-4" />
            <span>ACCOUNT SUSPENDED: READ-ONLY MODE</span>
            <span className="hidden md:inline font-normal opacity-80">- You can browse but cannot edit. Contact support.</span>
        </div>
    );
}
