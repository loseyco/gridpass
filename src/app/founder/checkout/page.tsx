'use client';

import { useState, useEffect } from 'react';
import { Shield, CreditCard, Lock, Check, Loader2, ChevronRight, X } from 'lucide-react';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { calculateFounderPrice } from '@/utils/pricing';

// Initialize Stripe loader (only once)
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function FounderRegisterPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState<'details' | 'payment'>('details');
    const [isLogin, setIsLogin] = useState(false);

    // Embedded Checkout State
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const supabase = createClient();
    const [spotsRemaining, setSpotsRemaining] = useState<number | null>(null);

    // Check if user is already a founder
    const [isFounder, setIsFounder] = useState(false);

    // Fetch live spot count & User Profile
    useEffect(() => {
        fetch('/api/founder/count')
            .then(res => res.json())
            .then(data => setSpotsRemaining(data.remaining))
            .catch(err => console.error('Failed to fetch founder count:', err));

        const checkUserStatus = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setIsLogin(false);
                setStep('payment');

                // Check Profile Role
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();

                if (profile?.role === 'founder') {
                    setIsFounder(true);
                }
            }
        };

        checkUserStatus();
    }, []);


    const handleSubmitDetails = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (isLogin) {
            // LOGIN FLOW
            const { error } = await supabase.auth.signInWithPassword({
                email: form.email,
                password: form.password
            });
            setIsLoading(false);
            if (error) {
                alert('Login Failed: ' + error.message);
                return;
            }
            setStep('payment');
        } else {
            // REGISTER FLOW
            const { data, error } = await supabase.auth.signUp({
                email: form.email,
                password: form.password,
                options: {
                    data: {
                        first_name: form.firstName,
                        last_name: form.lastName,
                        full_name: `${form.firstName} ${form.lastName}`.trim()
                    }
                }
            });

            setIsLoading(false);

            if (error) {
                alert('Registration Failed: ' + error.message);
                return;
            }

            setStep('payment');
        }
    };

    const handleStripeCheckout = async () => {
        setIsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id;
            const email = session?.user?.email || form.email;

            if (!userId) {
                alert('User session not found. Please log in again.');
                setStep('details');
                setIsLoading(false);
                return;
            }

            // Call internal API to create Stripe Session (Embedded)
            const res = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, email }),
            });

            const { clientSecret, error } = await res.json();

            if (error) throw new Error(error);

            // Open Modal with Embedded Checkout
            setClientSecret(clientSecret);
            setShowCheckoutModal(true);

        } catch (err: any) {
            console.error('Payment Error:', err);
            alert('Failed to initialize payment: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans flex flex-col md:flex-row relative">

            {/* EMBEDDED CHECKOUT MODAL */}
            {showCheckoutModal && clientSecret && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowCheckoutModal(false)} />

                    {/* Modal Content */}
                    <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
                        <div className="p-4 bg-neutral-100 border-b flex justify-between items-center text-black">
                            <h3 className="font-bold flex items-center gap-2">
                                <Shield className="w-5 h-5 text-amber-500" />
                                Secure Checkout
                            </h3>
                            <button onClick={() => setShowCheckoutModal(false)}>
                                <X className="w-6 h-6 text-neutral-500 hover:text-red-500 transition-colors" />
                            </button>
                        </div>

                        <div className="p-1">
                            <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret }}>
                                <EmbeddedCheckout className="w-full" />
                            </EmbeddedCheckoutProvider>
                        </div>
                    </div>
                </div>
            )}


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

                <div className="bg-neutral-800/50 p-4 rounded-lg border border-white/5 mb-6">
                    <div className="flex justify-between items-center text-sm text-neutral-400 mb-2">
                        <span>Dynamic Price (Spot #{spotsRemaining !== null ? (100 - spotsRemaining) + 1 : '...'})</span>
                    </div>
                    <div className="flex justify-between items-center text-3xl font-black text-amber-500">
                        <span>Total Due</span>
                        <span>
                            {spotsRemaining !== null
                                ? `$${calculateFounderPrice(100 - spotsRemaining).toLocaleString()}`
                                : '...'}
                        </span>
                    </div>
                </div>
                <p className="text-xs text-neutral-500">
                    One-time payment. Price locked for 15 minutes.
                    <br />
                    <span className="text-amber-500/50">Next spot will be higher.</span>
                </p>
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
                            <h3 className="text-2xl font-bold mb-6">Complete Purchase</h3>

                            <div className="p-4 border border-emerald-500/50 bg-emerald-500/10 rounded-lg mb-6 flex gap-3">
                                <Shield className="w-5 h-5 text-emerald-500 shrink-0" />
                                <div>
                                    <h4 className="font-bold text-emerald-400 text-sm">Account Created</h4>
                                    <p className="text-xs text-neutral-400">You are logged in.</p>
                                </div>
                            </div>

                            {isFounder ? (
                                <div className="p-6 border border-amber-500/30 bg-amber-500/10 rounded-xl text-center space-y-4">
                                    <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
                                        <Image src="/logo-square.png" width={40} height={40} alt="GridPass" className="brightness-0 invert" />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold text-white">You are a Founding Member</h4>
                                        <p className="text-neutral-400 text-sm mt-1">Thank you for your support. Your exclusive badge is active.</p>
                                    </div>
                                    <a
                                        href="/dashboard"
                                        className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded font-bold hover:bg-neutral-200 transition-colors"
                                    >
                                        Go to Dashboard <ChevronRight className="w-4 h-4" />
                                    </a>
                                </div>
                            ) : (
                                <>
                                    <button
                                        disabled={isLoading}
                                        onClick={handleStripeCheckout}
                                        className="w-full bg-[#635BFF] hover:bg-[#5851E1] text-white font-bold py-4 rounded transition-colors flex justify-center items-center gap-2 shadow-lg shadow-indigo-500/20"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Secure Checkout...
                                            </>
                                        ) : (
                                            <>
                                                <CreditCard className="w-5 h-5" />
                                                Pay Securely with Stripe (Popup)
                                            </>
                                        )}
                                    </button>

                                    <div className="flex justify-center gap-2 mt-4 grayscale opacity-50">
                                        <div className="text-[10px] bg-white text-black px-1 rounded font-bold">VISA</div>
                                        <div className="text-[10px] bg-white text-black px-1 rounded font-bold">MC</div>
                                        <div className="text-[10px] bg-white text-black px-1 rounded font-bold">AMEX</div>
                                    </div>
                                </>
                            )}

                            <button onClick={() => setStep('details')} className="w-full text-neutral-500 text-sm hover:text-white mt-4">
                                Back to Details
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
