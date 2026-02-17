'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import SceneController from './components/SceneController';

function LiveStudioContent() {
    const searchParams = useSearchParams();
    const zoomParam = searchParams.get('zoom');
    const zoom = zoomParam ? parseFloat(zoomParam) : 0.67; // Default to HD (720p)

    return (
        <div className="relative w-[1920px] h-[1080px] bg-black shadow-2xl origin-center" style={{ zoom: zoom }}>
            <SceneController />
        </div>
    );
}

export default function LiveStudioPage() {
    return (
        <div className="w-screen h-screen bg-black overflow-hidden flex items-center justify-center">
            <Suspense fallback={<div className="text-white">Loading Studio...</div>}>
                <LiveStudioContent />
            </Suspense>
        </div>
    );
}
