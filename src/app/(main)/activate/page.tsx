'use client';

import { useState, useEffect, Suspense } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useSearchParams } from 'next/navigation';

function ActivateContent() {
    const searchParams = useSearchParams();
    const initialCode = searchParams.get('code') || '';

    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (initialCode) {
            setCode(initialCode);
        }
    }, [initialCode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Get current session
            const supabase = createBrowserClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                // Redirect to login if not logged in
                // Encode current URL as 'next'
                // Use window.location.href or just relative path?
                // path + query params
                const currentPath = `/activate${initialCode ? `?code=${initialCode}` : ''}`;
                router.push(`/login?next=${encodeURIComponent(currentPath)}`);
                return;
            }

            // Post to complete
            const formattedCode = code.toUpperCase().trim();

            const response = await fetch('/api/auth/device/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_code: formattedCode,
                    session: session
                })
            });

            if (!response.ok) {
                const data = await response.json();
                // Show detailed error if available
                throw new Error(data.details || data.error || 'Failed to link device');
            }

            setSuccess(true);
            setTimeout(() => {
                router.push('/sim-racing');
            }, 2000);
        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md w-full bg-gray-900 rounded-xl border border-gray-800 p-8">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2 text-primary-500">Connect Device</h1>
                <p className="text-gray-400">Enter the code displayed on your device</p>
            </div>

            {success ? (
                <div className="text-center">
                    <div className="text-5xl mb-4">✅</div>
                    <h2 className="text-xl font-semibold mb-2">Device Connected!</h2>
                    <p className="text-gray-400 mb-6">You can now close this window and check your device.</p>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="ABCD-1234"
                            className="w-full bg-gray-800 border-gray-700 text-center text-3xl tracking-widest py-4 rounded-lg focus:ring-2 focus:ring-primary-500 uppercase"
                            maxLength={9}
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-900/50 border border-red-800 rounded-lg text-red-200 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || code.length < 8}
                        className="w-full bg-primary-600 hover:bg-primary-500 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Connecting...' : 'Link Device'}
                    </button>
                </form>
            )}
        </div>
    );
}

export default function ActivatePage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white p-4">
            <Suspense fallback={<div className="text-white">Loading...</div>}>
                <ActivateContent />
            </Suspense>
        </div>
    );
}
