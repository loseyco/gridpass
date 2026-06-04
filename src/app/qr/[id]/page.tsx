'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface QRRedirectProps {
    params: Promise<{ id: string }>;
}

export default function QRRedirectPage({ params }: QRRedirectProps) {
    const resolvedParams = use(params);
    const router = useRouter();

    useEffect(() => {
        if (resolvedParams?.id) {
            router.replace(`/join?id=${encodeURIComponent(resolvedParams.id)}`);
        }
    }, [resolvedParams, router]);

    return (
        <main className="min-h-screen bg-[#060608] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="mesh-glow" />
            <div className="w-full max-w-md text-center space-y-4 relative z-10">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto" />
                <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Redirecting to Join Portal...</p>
            </div>
        </main>
    );
}
