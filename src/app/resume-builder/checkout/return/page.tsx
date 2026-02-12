'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function CheckoutReturnPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const sessionId = searchParams.get('session_id');
    const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
    const [profilePath, setProfilePath] = useState<string | null>(null);

    useEffect(() => {
        if (!sessionId) {
            setStatus('failed');
            return;
        }

        // Verify payment status
        fetch(`/api/stripe/verify-payment?session_id=${sessionId}`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.profilePath) {
                    setStatus('success');
                    setProfilePath(data.profilePath);
                    // Redirect after 2 seconds
                    setTimeout(() => {
                        router.push(data.profilePath);
                    }, 2000);
                } else {
                    setStatus('failed');
                }
            })
            .catch(err => {
                console.error('Error verifying payment:', err);
                setStatus('failed');
            });
    }, [sessionId, router]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Processing Payment...</h2>
                    <p className="text-neutral-400">Please wait while we confirm your payment</p>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-neutral-900 border border-green-500/20 rounded-2xl p-8 text-center">
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-3">Payment Authorized!</h2>
                    <p className="text-neutral-400 mb-6">
                        Your payment has been pre-authorized. Our team will now build your professional resume.
                        Payment will only be captured after you approve the final result.
                    </p>
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 mb-6">
                        <p className="text-sm text-indigo-300">
                            Redirecting to your profile...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-neutral-900 border border-red-500/20 rounded-2xl p-8 text-center">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <XCircle className="w-10 h-10 text-red-500" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-3">Payment Failed</h2>
                <p className="text-neutral-400 mb-6">
                    We couldn't process your payment. Your account has been created, but you'll need to complete payment to unlock professional resume services.
                </p>
                <button
                    onClick={() => router.push('/dashboard')}
                    className="w-full px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-neutral-200 transition"
                >
                    Go to Dashboard
                </button>
            </div>
        </div>
    );
}

