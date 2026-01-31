'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, ArrowRight, Mail, Lock, UserPlus, LogIn, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/app/actions/auth';

export default function ClaimInviteClient({ invite, user }: { invite: any, user: any }) {
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'view' | 'login' | 'register'>('view');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const router = useRouter();
    const supabase = createClient();

    const handleClaim = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('claim_invite', { token_input: invite.token });
            if (error) throw error;
            router.push('/dashboard?welcome=true');
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            // Immediate claim after login
            await handleClaim();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('email', email);
            formData.append('password', password);

            const result = await registerUser(formData);
            if (result.error) throw new Error(result.error);

            const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            if (signInError) throw signInError;

            // Immediate claim after register
            await handleClaim();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    // If logged in, show simple accept screen
    if (user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,rgba(0,0,0,0)_70%)]" />
                <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center shadow-2xl relative z-10 animate-fade-in-up">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/20">
                        <span className="text-2xl">🎫</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">You're Invited!</h1>
                    <p className="text-neutral-400 mb-6">
                        Claim your <span className="text-amber-400 font-bold uppercase">{invite.role}</span> status.
                    </p>

                    <div className="bg-neutral-800/50 p-4 rounded-lg flex items-center justify-center gap-2 text-sm text-neutral-300 mb-6">
                        <span>Logged in as <strong>{user.email}</strong></span>
                    </div>

                    {error && <div className="text-red-400 text-sm mb-4">{error}</div>}

                    <button
                        onClick={handleClaim}
                        disabled={loading}
                        className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-neutral-200 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Accept Invitation'}
                    </button>
                </div>
            </div>
        );
    }

    // Auth Forms
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,rgba(0,0,0,0)_70%)]" />
            <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl relative z-10 animate-fade-in-up">

                {mode === 'view' ? (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/20">
                            <span className="text-2xl">🎫</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">You're Invited!</h1>
                        <p className="text-neutral-400 mb-8">
                            Join GridPass as a <span className="text-amber-400 font-bold uppercase">{invite.role}</span>.
                        </p>
                        <div className="space-y-3">
                            <button onClick={() => setMode('register')} className="w-full bg-[#635BFF] text-white font-bold py-3 rounded-lg hover:bg-[#5851E1] transition-all">
                                Create Account
                            </button>
                            <button onClick={() => setMode('login')} className="w-full bg-neutral-800 text-white font-bold py-3 rounded-lg hover:bg-neutral-700 transition-all">
                                Log In
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <button onClick={() => { setMode('view'); setError(''); }} className="text-neutral-500 hover:text-white mb-6 flex items-center gap-1 text-sm">
                            <ChevronLeft className="w-4 h-4" /> Back
                        </button>

                        <h2 className="text-2xl font-bold text-white mb-6 text-center">
                            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                        </h2>

                        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm text-center">
                                    {error}
                                </div>
                            )}

                            <div className="relative">
                                <Mail className="w-5 h-5 text-neutral-500 absolute left-3 top-3.5" />
                                <input
                                    type="email" required placeholder="Email Address"
                                    value={email} onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-neutral-950 border border-neutral-800 p-3 pl-10 rounded text-white focus:border-amber-500 outline-none"
                                />
                            </div>
                            <div className="relative">
                                <Lock className="w-5 h-5 text-neutral-500 absolute left-3 top-3.5" />
                                <input
                                    type="password" required placeholder="Password"
                                    value={password} onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-neutral-950 border border-neutral-800 p-3 pl-10 rounded text-white focus:border-amber-500 outline-none"
                                />
                            </div>

                            <button
                                type="submit" disabled={loading}
                                className={`w-full font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'register' ? 'bg-[#635BFF] hover:bg-[#5851E1] text-white' : 'bg-white hover:bg-neutral-200 text-black'
                                    }`}
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        {mode === 'login' ? 'Log In & Claim' : 'Create & Claim'}
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
