'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Loader2, ArrowRight, Mail, Lock, UserPlus, LogIn, ChevronLeft, Shield, Users, ChevronRight, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { registerUser } from '@/app/actions/auth';
import Link from 'next/link';

interface Props {
    invite?: any;  // If present, we are in "Golden Ticket" mode
    user?: any;    // Current logged in user
    trackingId?: string; // Business Card ID
}

export default function JoinFlow({ invite, user, trackingId }: Props) {
    const [loading, setLoading] = useState(false);
    const [mode, setMode] = useState<'initial' | 'view' | 'login' | 'register'>(invite ? 'view' : 'initial');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const router = useRouter();
    const supabase = createClient();

    const handleClaim = async () => {
        if (!invite) return; // Should not happen
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('claim_invite', { token_input: invite.token });
            if (error) throw error;
            router.push('/dashboard?welcome=true');
        } catch (err: any) {
            console.error('Claim error:', err);
            setError(err.message || 'Failed to claim invite');
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

            if (invite) {
                await handleClaim();
            } else {
                router.push('/dashboard');
            }
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('JoinFlow: Handle Register Clicked');
        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('email', email);
            formData.append('password', password);
            formData.append('full_name', fullName);
            if (trackingId) {
                formData.append('tracking_id', trackingId);
            }

            const result = await registerUser(formData);
            if (result.error) throw new Error(result.error);

            const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
            if (signInError) throw signInError;

            if (invite) {
                await handleClaim();
            } else {
                router.push('/dashboard?welcome=true');
            }
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    // ----------------------------------------------------
    // Scenario A: Golden Ticket Invite
    // ----------------------------------------------------
    if (invite) {
        if (user) {
            // Logged in + Invite -> Just Claim
            return (
                <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center shadow-2xl relative z-10 animate-fade-in-up mx-auto">
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
                    <button onClick={handleClaim} disabled={loading} className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-neutral-200 transition-all flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Accept Invitation'}
                    </button>
                </div>
            );
        }

        if (mode === 'view') {
            return (
                <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center shadow-2xl relative z-10 animate-fade-in-up mx-auto">
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
            );
        }
    }

    // ----------------------------------------------------
    // Scenario B: Standard Join (Initial Choice)
    // ----------------------------------------------------
    if (mode === 'initial' && !invite) {
        return (
            <div className="w-full space-y-4 max-w-lg mx-auto">
                {/* Hero Text specific to tracking if needed */}
                {trackingId && (
                    <div className="text-center mb-6">
                        <p className="text-sm font-bold text-indigo-400 uppercase tracking-widest">Welcome via Card #{trackingId}</p>
                    </div>
                )}

                {/* 1. Founder Card */}
                <Link href="/founder/checkout" className="group relative block w-full">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-red-600 rounded-2xl opacity-75 group-hover:opacity-100 blur transition duration-500"></div>
                    <div className="relative flex items-center justify-between p-6 bg-neutral-900 rounded-2xl border border-white/10 hover:bg-neutral-800/90 transition-all">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-red-600 flex items-center justify-center shadow-lg shadow-amber-900/40">
                                <Shield className="w-6 h-6 text-white fill-white/20" />
                            </div>
                            <div className="text-left">
                                <div className="text-amber-500 text-xs font-bold uppercase tracking-wider mb-0.5">Limited Access</div>
                                <h3 className="text-xl font-bold text-white">Founding 50</h3>
                                <p className="text-neutral-400 text-xs">Lifetime Membership + Badge</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                </Link>

                {/* 2. Driver Card (Triggers Inline Register) */}
                <button onClick={() => setMode('register')} className="group block w-full text-left">
                    <div className="flex items-center justify-between p-6 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 hover:border-white/20 backdrop-blur-sm transition-all">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center border border-white/5">
                                <Users className="w-6 h-6 text-neutral-300" />
                            </div>
                            <div>
                                <div className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-0.5">Free Account</div>
                                <h3 className="text-lg font-bold text-white">Driver Profile</h3>
                                <p className="text-neutral-400 text-xs">Track stats & build career</p>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </div>
                </button>

                <div className="pt-4 text-center">
                    <button onClick={() => setMode('login')} className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors">
                        Already a member? <span className="font-bold text-white underline decoration-neutral-700 underline-offset-4">Log in</span>
                    </button>
                </div>
            </div>
        );
    }

    // ----------------------------------------------------
    // Scenario C: Auth Form (Login/Register)
    // ----------------------------------------------------
    return (
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl relative z-10 animate-fade-in-up mx-auto">
            <button
                onClick={() => setMode(invite ? 'view' : 'initial')}
                className="text-neutral-500 hover:text-white mb-6 flex items-center gap-1 text-sm"
            >
                <ChevronLeft className="w-4 h-4" /> Back
            </button>

            <h2 className="text-2xl font-bold text-white mb-6 text-center">
                {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded mb-4 text-center">
                    {error}
                </div>
            )}

            <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className="space-y-4">
                {mode === 'register' && (
                    <div className="relative">
                        <User className="w-5 h-5 text-neutral-500 absolute left-3 top-3.5" />
                        <input type="text" required placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)}
                            className="w-full bg-neutral-950 border border-neutral-800 p-3 pl-10 rounded text-white focus:border-amber-500 outline-none" />
                    </div>
                )}
                <div className="relative">
                    <Mail className="w-5 h-5 text-neutral-500 absolute left-3 top-3.5" />
                    <input type="email" required placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 p-3 pl-10 rounded text-white focus:border-amber-500 outline-none" />
                </div>
                <div className="relative">
                    <Lock className="w-5 h-5 text-neutral-500 absolute left-3 top-3.5" />
                    <input type="password" required placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
                        className="w-full bg-neutral-950 border border-neutral-800 p-3 pl-10 rounded text-white focus:border-amber-500 outline-none" />
                </div>

                <button type="submit" disabled={loading} className={`w-full font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2 ${mode === 'register' ? 'bg-[#635BFF] hover:bg-[#5851E1] text-white' : 'bg-white hover:bg-neutral-200 text-black'}`}>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>
                            {mode === 'login' ? (invite ? 'Log In & Claim' : 'Log In') : (invite ? 'Create & Claim' : 'Create Account')}
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
