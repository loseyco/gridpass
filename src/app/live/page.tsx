'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import SceneController from './components/SceneController';

function LiveStudioContent() {
    return (
        <div className="relative w-full h-full bg-black shadow-2xl">
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
