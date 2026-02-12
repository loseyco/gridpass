'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Legacy redirect handler for /resume/success
 * Redirects to the proper /resume-builder/checkout/return page
 */
export default function ResumeSuccessRedirect() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const sessionId = searchParams.get('session_id');

    useEffect(() => {
        // Redirect to the correct return page
        if (sessionId) {
            router.replace(`/resume-builder/checkout/return?session_id=${sessionId}`);
        } else {
            // No session ID, redirect to resume builder
            router.replace('/resume-builder');
        }
    }, [sessionId, router]);

    return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
            <div className="text-center">
                <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Redirecting...</h2>
                <p className="text-neutral-400">Please wait</p>
            </div>
        </div>
    );
}
