'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Lock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
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

        const emailTrimmed = email.trim();
        const passwordTrimmed = password.trim();

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: emailTrimmed,
                password: passwordTrimmed
            });

            if (error) throw error;

            router.push('/dashboard');
            router.refresh();
        } catch (err: any) {
            console.error('Login Error:', err);
            if (err.message === 'Invalid login credentials') {
                setError('Invalid email or password. Please try again.');
            } else {
                setError(err.message || 'Failed to login');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
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
    );
}
