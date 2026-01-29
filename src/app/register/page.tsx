'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: ''
    });

    const router = useRouter();
    const supabase = createClient();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        try {
            // 1. Sign up user
            const { data, error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    emailRedirectTo: `${location.origin}/auth/callback`,
                },
            });

            if (signUpError) throw signUpError;

            if (data.user) {
                // 2. Create basic profile (Trigger usually handles this, but robust to do here if needed)
                // For now, rely on Trigger or Dashboard to create profile if missing.
                router.push('/dashboard?welcome=true');
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message || 'Failed to create account');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans flex flex-col md:flex-row">

            {/* Left: Marketing / Value Prop */}
            <div className="md:w-1/2 p-12 flex flex-col justify-between bg-neutral-900 border-r border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-64 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none"></div>

                <div>
                    <Link href="/" className="inline-flex items-center gap-2 mb-12">
                        <img src="/logo-square.png" alt="GridPass" className="w-10 h-10 rounded-lg shadow-lg shadow-indigo-500/20" />
                        <span className="font-bold text-xl tracking-tighter">GridPass</span>
                    </Link>

                    <h1 className="text-4xl font-bold mb-6">Join the Grid.</h1>
                    <p className="text-neutral-400 text-lg mb-8 leading-relaxed">
                        Create your free account to access community features, track your stats, and build your racer profile.
                    </p>

                    <div className="space-y-4">
                        {['Global Driver Profile', 'Community Access', 'Basic Stats Tracking'].map((item) => (
                            <div key={item} className="flex items-center gap-3 text-neutral-300">
                                <CheckCircle className="w-5 h-5 text-indigo-500" />
                                {item}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-12 p-6 bg-gradient-to-br from-amber-500/10 to-neutral-800/50 rounded-2xl border border-amber-500/20">
                    <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-widest mb-2">
                        <ShieldCheck className="w-4 h-4" />
                        Pro Tip
                    </div>
                    <p className="text-sm text-amber-100 mb-4">
                        Serious about racing? The **Founder Pass** includes lifetime Pro access, advisory council seats, and exclusive verified status.
                    </p>
                    <Link href="/founder/register" className="inline-flex items-center gap-2 text-amber-500 font-bold hover:text-white transition-colors text-sm">
                        View Founder Offer <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            {/* Right: Registration Form */}
            <div className="md:w-1/2 p-8 flex items-center justify-center">
                <div className="max-w-md w-full animate-fade-in px-4">
                    <h2 className="text-2xl font-bold mb-8">Create your account</h2>

                    <form onSubmit={handleRegister} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Email</label>
                            <input
                                type="email" required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-neutral-900 border border-white/10 p-3 rounded text-white focus:border-indigo-500 outline-none transition-colors"
                                placeholder="name@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Password</label>
                            <input
                                type="password" required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full bg-neutral-900 border border-white/10 p-3 rounded text-white focus:border-indigo-500 outline-none transition-colors"
                                placeholder="Create a strong password"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Confirm Password</label>
                            <input
                                type="password" required
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className="w-full bg-neutral-900 border border-white/10 p-3 rounded text-white focus:border-indigo-500 outline-none transition-colors"
                                placeholder="Repeat password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-white text-black font-bold py-3 rounded hover:bg-neutral-200 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                            Create Account
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-neutral-500">
                        Already have an account?{' '}
                        <Link href="/login" className="text-indigo-400 font-bold hover:underline">
                            Log in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
