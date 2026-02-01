"use client";

import { useState } from "react";
import { Heart, Shield, Loader2, X, Lock } from "lucide-react";
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function DonationCard({ userEmail, profile }: { userEmail?: string, profile?: any }) {
    const [amount, setAmount] = useState<number | ''>(25);
    const [message, setMessage] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Stripe Modal State
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);

    const PRESETS = [10, 25, 50, 100];

    const handleDonate = async () => {
        if (!amount || amount < 1) {
            alert("Please enter a valid donation amount.");
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    isDonation: true,
                    amount: Number(amount),
                    message,
                    isAnonymous,
                    email: userEmail // Pass logged-in email
                }),
            });

            const { clientSecret, error } = await res.json();
            if (error) throw new Error(error);

            setClientSecret(clientSecret);
            setShowModal(true);
        } catch (err: any) {
            console.error("Donation failed:", err);
            alert("Failed to initialize donation. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="bg-neutral-900 border border-indigo-500/20 rounded-2xl p-8 max-w-lg w-full relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-32 bg-indigo-500/5 blur-[80px] rounded-full pointer-events-none group-hover:bg-indigo-500/10 transition-colors"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-indigo-500/10 rounded-lg">
                            <Heart className="w-6 h-6 text-indigo-500 fill-indigo-500/20" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">Fuel the Vision</h3>
                            <p className="text-sm text-neutral-400">100% of contributions go to server costs.</p>
                        </div>
                    </div>

                    {profile && (
                        <div className="mb-6 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold">
                                {profile.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="text-sm">
                                <div className="font-bold text-indigo-200">Logged in as {profile.username || 'User'}</div>
                                <div className="text-indigo-400/60 text-xs">Your donation will be linked to you.</div>
                            </div>
                        </div>
                    )}

                    {/* Amount Presets */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                        {PRESETS.map(preset => (
                            <button
                                key={preset}
                                onClick={() => setAmount(preset)}
                                className={`py-2 rounded-lg font-bold text-sm border transition-all ${amount === preset
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                                    : 'bg-neutral-800 border-white/5 text-neutral-400 hover:bg-neutral-700 hover:text-white'
                                    }`}
                            >
                                ${preset}
                            </button>
                        ))}
                    </div>

                    {/* Custom Amount */}
                    <div className="mb-6">
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-bold">$</span>
                            <input
                                type="number"
                                min="1"
                                placeholder="Custom Amount"
                                value={amount}
                                onChange={(e) => setAmount(Number(e.target.value))}
                                className="w-full bg-neutral-950 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white placeholder-neutral-600 focus:border-indigo-500 outline-none font-mono"
                            />
                        </div>
                    </div>

                    {/* Message */}
                    <div className="mb-6">
                        <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">
                            Message to the Team (Optional)
                        </label>
                        <textarea
                            rows={3}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Tell us what you want to see built..."
                            className="w-full bg-neutral-950 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-indigo-500 outline-none resize-none"
                        />
                        <div className="flex items-center gap-1 mt-2 text-[10px] text-neutral-500">
                            <Lock className="w-3 h-3" />
                            Sent privately to the team. Not public.
                        </div>
                    </div>

                    {/* Checkbox */}
                    <label className="flex items-center gap-3 mb-6 cursor-pointer group/check">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isAnonymous ? 'bg-indigo-500 border-indigo-500' : 'bg-neutral-800 border-white/20 group-hover/check:border-white/40'}`}>
                            {isAnonymous && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <input
                            type="checkbox"
                            checked={isAnonymous}
                            onChange={(e) => setIsAnonymous(e.target.checked)}
                            className="hidden"
                        />
                        <span className="text-sm text-neutral-400">Make contribution anonymous</span>
                    </label>

                    <button
                        onClick={handleDonate}
                        disabled={isLoading || !amount}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Heart className="w-5 h-5 fill-white/20" />}
                        Donate ${amount || 0}
                    </button>

                    {!profile && (
                        <div className="mt-4 text-center text-xs text-neutral-500">
                            Consider <a href="/register" className="text-indigo-400 hover:underline">creating an account</a> to track your contribution history.
                        </div>
                    )}

                </div>
            </div>

            {/* STRIPE MODAL */}
            {showModal && clientSecret && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto z-10">
                        <div className="p-4 bg-neutral-100 border-b flex justify-between items-center text-black">
                            <h3 className="font-bold flex items-center gap-2">
                                <Shield className="w-5 h-5 text-indigo-500" />
                                Secure Contribution
                            </h3>
                            <button onClick={() => setShowModal(false)}>
                                <X className="w-6 h-6 text-neutral-500 hover:text-red-500 transition-colors" />
                            </button>
                        </div>
                        <div className="p-1">
                            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                                <EmbeddedCheckout />
                            </EmbeddedCheckoutProvider>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
