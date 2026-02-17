'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { Loader2, Lock, Check } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function ResumeCheckoutPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const sessionId = searchParams.get('session_id');
    const leadId = searchParams.get('lead_id');
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!sessionId || !leadId) {
            setError('Missing session information');
            setLoading(false);
            return;
        }

        // Fetch client secret from the session
        fetch(`/api/stripe/get-session?session_id=${sessionId}`)
            .then(res => res.json())
            .then(data => {
                if (data.clientSecret) {
                    setClientSecret(data.clientSecret);
                } else {
                    setError('Failed to load checkout session');
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching session:', err);
                setError('Failed to load checkout');
                setLoading(false);
            });
    }, [sessionId, leadId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mx-auto mb-4" />
                    <p className="text-white text-xl font-semibold">Loading secure checkout...</p>
                    <p className="text-neutral-500 text-sm mt-2">Please wait</p>
                </div>
            </div>
        );
    }

    if (error || !clientSecret) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-neutral-900/80 backdrop-blur-xl border border-red-500/20 rounded-2xl p-8 text-center shadow-2xl">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <div className="text-4xl">⚠️</div>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-4">Checkout Error</h2>
                    <p className="text-neutral-400 mb-6">{error || 'Failed to load checkout session'}</p>
                    <button
                        onClick={() => router.push('/resume-builder')}
                        className="w-full px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-neutral-200 transition-all shadow-lg"
                    >
                        Back to Resume Builder
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
            {/* Header */}
            <div className="border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-4 py-6">
                    <h1 className="text-3xl font-black text-white flex items-center gap-3">
                        <span className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                            GridPass
                        </span>
                        <span className="bg-white text-black px-3 py-1 rounded-lg text-sm font-extrabold uppercase tracking-wider">
                            Pro
                        </span>
                    </h1>
                    <p className="text-neutral-400 mt-2 flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Secure checkout powered by Stripe
                    </p>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-4 py-12">
                {/* Pre-Auth Notice Banner */}
                <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 border-2 border-blue-400/40 rounded-2xl p-6 mb-8 backdrop-blur-xl">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-500/30 rounded-full flex items-center justify-center flex-shrink-0">
                            <Lock className="w-6 h-6 text-blue-300" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">Pre-Authorization Only</h3>
                            <p className="text-blue-100 leading-relaxed">
                                <strong>You will NOT be charged now.</strong> We'll authorize your payment method to reserve the funds, but you'll only be charged after our team reviews your resume and you approve the final result. Think of it like a hotel hold - the money stays in your account until the work is complete.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Checkout Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                            <EmbeddedCheckoutProvider
                                stripe={stripePromise}
                                options={{ clientSecret }}
                            >
                                <EmbeddedCheckout />
                            </EmbeddedCheckoutProvider>
                        </div>
                    </div>

                    {/* Info Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Status Card */}
                        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6 backdrop-blur-xl">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                                    <Check className="w-5 h-5 text-green-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white">Account Created</h3>
                            </div>
                            <p className="text-sm text-neutral-300 leading-relaxed">
                                Your GridPass account is ready! Complete payment to unlock professional resume building services and verified badge.
                            </p>
                        </div>

                        {/* What's Included */}
                        <div className="bg-neutral-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-4">What's Included</h3>
                            <ul className="space-y-3">
                                {[
                                    'Professional resume review',
                                    'Career consultation',
                                    'Verified GridPass badge',
                                    'Priority support',
                                    'Profile optimization'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-neutral-300">
                                        <Check className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Security Notice */}
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-5">
                            <p className="text-sm text-yellow-200 leading-relaxed font-medium">
                                💳 <strong className="text-yellow-100">Pre-Authorization Hold:</strong> The button says "Pay" but this is <strong>NOT an immediate charge</strong>. We'll place a temporary hold on your card. You'll only be charged once your resume is reviewed and you approve it.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

