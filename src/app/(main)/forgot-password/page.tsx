'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [email, setEmail] = useState('');
    const supabase = createClient();

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setStatus('idle');

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${location.origin}/reset-password`,
            });
            if (error) throw error;
            setStatus('success');
        } catch (error) {
            setStatus('error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-sans flex items-center justify-center p-4">
            <div className="max-w-md w-full animate-fade-in">

                <Link href="/login" className="inline-flex items-center gap-2 text-neutral-500 hover:text-white mb-8 transition-colors text-sm">
                    <ArrowLeft className="w-4 h-4" /> Back to Login
                </Link>

                <div className="bg-neutral-900 border border-white/5 p-8 rounded-2xl shadow-2xl">
                    <div className="mb-6">
                        <div className="w-12 h-12 bg-neutral-800 rounded-xl flex items-center justify-center mb-4">
                            <Mail className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
                        <p className="text-neutral-400 text-sm">
                            Enter the email associated with your account and we'll send you a link to reset your password.
                        </p>
                    </div>

                    {status === 'success' ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-lg text-center animate-fade-in">
                            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                            <h3 className="font-bold text-white mb-1">Check your inbox</h3>
                            <p className="text-sm text-neutral-400">
                                If an account exists for {email}, we've sent instructions to reset your password.
                            </p>
                            <button
                                onClick={() => setStatus('idle')}
                                className="mt-4 text-xs text-emerald-400 hover:text-emerald-300 font-bold"
                            >
                                Try another email
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleReset} className="space-y-6">
                            {status === 'error' && (
                                <div className="p-3 bg-red-500/10 text-red-400 text-sm rounded border border-red-500/20">
                                    Error sending reset email. Please try again.
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500 mb-2">Email Address</label>
                                <input
                                    type="email" required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-neutral-950 border border-white/10 p-3 rounded text-white focus:border-indigo-500 outline-none transition-colors"
                                    placeholder="name@example.com"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-white text-black font-bold py-3 rounded hover:bg-neutral-200 transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
