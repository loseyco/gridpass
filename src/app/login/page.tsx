'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Lock, ChevronRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            router.push('/dashboard');
            router.refresh();
        } catch (err: any) {
            setError(err.message || 'Failed to login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans flex items-center justify-center p-4">
            <div className="max-w-md w-full animate-fade-in">

                {/* Logo Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 mb-4 group">
                        <img src="/logo-square.png" alt="GridPass" className="w-12 h-12 rounded-xl shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform" />
                        <span className="font-bold text-2xl tracking-tighter">GridPass</span>
                    </Link>
                    <h1 className="text-xl font-bold text-white">Welcome Back</h1>
                    <p className="text-neutral-400 text-sm mt-1">Enter your credentials to access your dashboard.</p>
                </div>

                <div className="bg-neutral-900 border border-white/5 p-8 rounded-2xl shadow-2xl">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 text-red-400 text-sm">
                                <AlertCircle className="w-5 h-5 shrink-0" />
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Email</label>
                            <input
                                type="email" required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-neutral-950 border border-white/10 p-3 rounded text-white focus:border-indigo-500 outline-none transition-colors"
                                placeholder="name@example.com"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500">Password</label>
                                <Link href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300">
                                    Forgot password?
                                </Link>
                            </div>
                            <input
                                type="password" required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-neutral-950 border border-white/10 p-3 rounded text-white focus:border-indigo-500 outline-none transition-colors"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-indigo-600 text-white font-bold py-3 rounded hover:bg-indigo-500 transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-4 h-4" />}
                            Sign In
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-white/5 text-center text-sm text-neutral-400">
                        Don't have an account?{' '}
                        <Link href="/register" className="text-white font-bold hover:underline">
                            Sign up
                        </Link>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <Link href="/founder/register" className="inline-flex items-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-widest hover:text-amber-400 border border-amber-500/20 bg-amber-500/5 px-4 py-2 rounded-full transition-colors">
                        Become a Founder <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>

            </div>
        </div>
    );
}
