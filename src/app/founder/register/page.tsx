'use client';

import { useState, useEffect } from 'react';
import { Shield, CreditCard, Lock, Check, Loader2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';

export default function FounderRegisterPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState<'details' | 'payment'>('details');
    const [isLogin, setIsLogin] = useState(false);

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const supabase = createClient();
    const [spotsRemaining, setSpotsRemaining] = useState<number | null>(null);

    // Fetch live spot count
    useEffect(() => {
        fetch('/api/founder/count')
            .then(res => res.json())
            .then(data => setSpotsRemaining(data.remaining))
            .catch(err => console.error('Failed to fetch founder count:', err));

        // Auto-advance if logged in
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setIsLogin(false); // Ensure we are not in login mode visually
                setStep('payment');
            }
        });
    }, []);


    const handleSubmitDetails = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isLogin) {
            // LOGIN FLOW
            setIsLoading(true);
            const { error } = await supabase.auth.signInWithPassword({
                email: form.email,
                password: form.password
            });
            setIsLoading(false);
            if (error) {
                alert('Login Failed: ' + error.message);
                return;
            }
            // Move to payment on success
            setStep('payment');
        } else {
            // REGISTER FLOW
            // We verify details locally? Or just let API handle it?
            // Actually, for Register, we just collect data here and pass to API in next step?
            // Wait, we want to create/register USER first? Or do it all in one go?
            // The original plan was all in one go.
            // But if we want to confirm email is unique before payment?
            // Let's keep it simple: Just move to Payment step, and let handlePayment do the work?
            // detailed in previous steps.
            setStep('payment');
        }
    };

    const handlePayment = async () => {
        setIsLoading(true);
        try {
            // Check if we have a session (logged in)
            const { data: { session } } = await supabase.auth.getSession();

            // Prepare payload
            // If logged in, we might not need firstName/lastName if they are already in DB?
            // But sending them doesn't hurt.
            const payload = {
                firstName: form.firstName,
                lastName: form.lastName,
                email: form.email, // If logged in, email might differ? Should use session email? 
                // For now, assume form matches or ignored if session exists.
                password: form.password
            };

            const res = await fetch('/api/founder/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                window.location.href = '/founder/welcome';
            } else {
                const data = await res.json();
                alert('Registration/Payment Failed: ' + (data.error || 'Unknown Error'));
            }
        } catch (e) {
            alert('Error processing request');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans flex flex-col md:flex-row">

            {/* Left: Summary */}
            <div className="w-full md:w-1/3 p-8 bg-neutral-900 border-r border-white/5 flex flex-col justify-between">
                <div>
                    <div className="font-bold text-xl tracking-tighter flex items-center gap-2 mb-8">
                        <div className="w-8 h-8 relative rounded flex items-center justify-center font-bold text-black overflow-hidden">
                            <Image src="/logo-square.png" alt="GridPass Logo" fill className="object-cover" />
                        </div>
                        GridPass <span className="text-amber-500 text-xs">Checkout</span>
                    </div>

                    <div className="mb-8">
                        <div className="text-xs text-neutral-500 uppercase tracking-widest mb-2">Item</div>
                        <h2 className="text-2xl font-bold">Founding Member Pass</h2>
                        <div className="text-amber-500 font-mono mt-1">LIFETIME ACCESS</div>
                        {spotsRemaining !== null && (
                            <div className="text-xs text-neutral-400 mt-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                Only {spotsRemaining} Spots Left
                            </div>
                        )}
                    </div>

                    <ul className="space-y-3 mb-8">
                        {['Lifetime Pro Access', 'Founder Badge on Profile', 'Advisory Council Seat', 'Priority Support'].map(item => (
                            <li key={item} className="flex items-center gap-2 text-sm text-neutral-400">
                                <Check className="w-4 h-4 text-emerald-500" /> {item}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="border-t border-white/10 pt-6">
                    <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total Due</span>
                        <span>$1,500.00</span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-2">One-time payment. No hidden fees.</p>
                </div>
            </div>

            {/* Right: Form */}
            <div className="w-full md:w-2/3 p-8 md:p-16 flex items-center justify-center">
                <div className="max-w-md w-full">
                    {step === 'details' ? (
                        <>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-bold">{isLogin ? 'Welcome Back' : 'Create Account'}</h3>
                                <button
                                    type="button"
                                    onClick={() => setIsLogin(!isLogin)}
                                    className="text-amber-500 text-xs uppercase tracking-widest font-bold hover:text-white transition-colors"
                                >
                                    {isLogin ? 'New Founder? Register' : 'Have an account? Login'}
                                </button>
                            </div>

                            <form onSubmit={handleSubmitDetails} className="space-y-6 animate-fade-in">
                                {isLogin ? (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Email</label>
                                            <input
                                                type="email" required
                                                className="w-full bg-neutral-900 border border-white/10 p-3 rounded text-white focus:border-amber-500 outline-none"
                                                value={form.email}
                                                onChange={e => setForm({ ...form, email: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Password</label>
                                            <input
                                                type="password" required
                                                className="w-full bg-neutral-900 border border-white/10 p-3 rounded text-white focus:border-amber-500 outline-none"
                                                value={form.password}
                                                onChange={e => setForm({ ...form, password: e.target.value })}
                                            />
                                        </div>
                                        <button type="submit" disabled={isLoading} className="w-full bg-white text-black font-bold py-4 rounded hover:bg-neutral-200 transition-colors flex justify-center items-center gap-2">
                                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-4 h-4" />}
                                            Login & Continue <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">First Name</label>
                                                <input
                                                    required
                                                    className="w-full bg-neutral-900 border border-white/10 p-3 rounded text-white focus:border-amber-500 outline-none"
                                                    value={form.firstName}
                                                    onChange={e => setForm({ ...form, firstName: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Last Name</label>
                                                <input
                                                    required
                                                    className="w-full bg-neutral-900 border border-white/10 p-3 rounded text-white focus:border-amber-500 outline-none"
                                                    value={form.lastName}
                                                    onChange={e => setForm({ ...form, lastName: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Email</label>
                                            <input
                                                type="email" required
                                                className="w-full bg-neutral-900 border border-white/10 p-3 rounded text-white focus:border-amber-500 outline-none"
                                                value={form.email}
                                                onChange={e => setForm({ ...form, email: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Password</label>
                                            <input
                                                type="password" required
                                                className="w-full bg-neutral-900 border border-white/10 p-3 rounded text-white focus:border-amber-500 outline-none"
                                                value={form.password}
                                                onChange={e => setForm({ ...form, password: e.target.value })}
                                            />
                                        </div>

                                        <button type="submit" className="w-full bg-white text-black font-bold py-4 rounded hover:bg-neutral-200 transition-colors flex justify-center items-center gap-2">
                                            Create Account <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </form>
                        </>
                    ) : (
                        <div className="space-y-6 animate-fade-in">
                            <h3 className="text-2xl font-bold mb-6">Payment Method</h3>

                            <div className="p-4 border border-amber-500/50 bg-amber-500/10 rounded-lg mb-6">
                                <div className="text-amber-500 font-bold flex items-center gap-2 mb-2">
                                    <Lock className="w-4 h-4" /> Secure Transaction
                                </div>
                                <p className="text-sm text-amber-200/80">This is a secure 256-bit SSL encrypted payment.</p>
                            </div>

                            {/* Mock Credit Card Form */}
                            <div className="opacity-50 pointer-events-none grayscale select-none relative">
                                <div className="absolute inset-0 z-10"></div> {/* Disable clicks */}
                                <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Card Number</label>
                                <div className="flex items-center gap-2 bg-neutral-900 border border-white/10 p-3 rounded mb-4">
                                    <CreditCard className="w-5 h-5 text-neutral-500" />
                                    <input type="text" placeholder="0000 0000 0000 0000" className="bg-transparent w-full outline-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" placeholder="MM / YY" className="bg-neutral-900 border border-white/10 p-3 rounded outline-none" />
                                    <input type="text" placeholder="CVC" className="bg-neutral-900 border border-white/10 p-3 rounded outline-none" />
                                </div>
                            </div>

                            <div className="text-center text-xs text-neutral-500 mb-4">* Mock Payment System Active</div>

                            <button
                                disabled={true}
                                className="w-full bg-neutral-800 text-neutral-400 font-bold py-4 rounded cursor-not-allowed flex justify-center items-center gap-2 border border-white/5"
                            >
                                <Lock className="w-4 h-4" />
                                Applications Temporarily Paused
                            </button>
                            <p className="text-center text-xs text-amber-500 mt-2 font-medium">
                                We are updating our payment processor. Please check back in 24 hours.
                            </p>

                            <button onClick={() => setStep('details')} className="w-full text-neutral-500 text-sm hover:text-white mt-4">
                                Back to Details
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
