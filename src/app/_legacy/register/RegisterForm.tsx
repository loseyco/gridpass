'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, UserPlus, ChevronRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { notifyNewUser, registerUser } from '@/app/actions/auth';

export default function RegisterForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // 1. Create User via Server Action (Bypasses Email Verification)
            const formData = new FormData();
            formData.append('email', email);
            formData.append('password', password);

            const result = await registerUser(formData);
            if (result.error) throw new Error(result.error);

            // 2. Sign In Immediately (Since email is auto-confirmed)
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (signInError) throw signInError;

            // 3. Redirect
            const next = searchParams.get('next');
            router.push(next || '/dashboard?welcome=true');
        } catch (err: any) {
            setError(err.message || 'Failed to register');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-neutral-900 border border-white/5 p-8 rounded-2xl shadow-2xl">
            <form onSubmit={handleRegister} className="space-y-6">
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
                    <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Password</label>
                    <input
                        type="password" required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-neutral-950 border border-white/10 p-3 rounded text-white focus:border-indigo-500 outline-none transition-colors"
                        placeholder="••••••••"
                        minLength={6}
                    />
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-indigo-600 text-white font-bold py-3 rounded hover:bg-indigo-500 transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    Create Account
                </button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/5 text-center text-sm text-neutral-400">
                Already have an account?{' '}
                <Link href="/login" className="text-white font-bold hover:underline">
                    Log in
                </Link>
            </div>
        </div>
    );
}
