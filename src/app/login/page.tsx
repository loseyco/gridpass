'use client';

import React, { Suspense, useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { auth } from '@/lib/firebase/config';
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { useAuth } from '@/components/auth/AuthProvider';
import Logo from '@/components/Logo';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dash';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { user, loading } = useAuth();

  // If already logged in, redirect away
  useEffect(() => {
    if (!loading && user) {
      router.replace(redirectUrl);
    }
  }, [user, loading, router, redirectUrl]);

  async function handleEmailSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        router.push(redirectUrl);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error("Login Error:", err);
        setErrorMsg(errMsg || 'An error occurred during sign in.');
      }
    });
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (!resetEmail) {
      setErrorMsg("Please enter your email address.");
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      try {
        await sendPasswordResetEmail(auth, resetEmail);
        setSuccessMsg("Password reset email sent! Check your inbox.");
        setIsResetMode(false);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        setErrorMsg(errMsg || 'Failed to send reset email.');
      }
    });
  }

  async function handleGoogleLogin() {
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      try {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
        router.push(redirectUrl);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error("Google Sign-In Error:", err);
        setErrorMsg(errMsg || 'Failed to sign in with Google.');
      }
    });
  }

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060608]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-[#060608]">
      {/* Decorative premium glow backgrounds */}
      <div className="mesh-glow" />
      
      <div className="w-full max-w-md relative z-10">
        {/* Brand logo & header */}
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900/80 border border-neutral-800 text-xs font-semibold text-neutral-300">
            <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
            GRIDPASS UNIVERSAL SECURITY
          </div>
          <Logo className="w-9 h-9 mx-auto" textClassName="text-4xl" />
          <p className="text-neutral-400 text-sm max-w-xs mx-auto">
            {isResetMode 
              ? "Recover access to your digital garage assets" 
              : "Sign in to synchronize your physical keys and logs"}
          </p>
        </div>

        {/* Dynamic Glassmorphic Card */}
        <div className="glass-card p-8 rounded-3xl space-y-6">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs text-center font-medium animate-fadeIn">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-xs text-center font-medium animate-fadeIn">
              {successMsg}
            </div>
          )}

          {isResetMode ? (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider" htmlFor="resetEmail">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="resetEmail"
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="driver@gridpass.app"
                    className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm placeholder:text-neutral-600 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-glow w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/10 text-sm flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>
                      Send Recovery Link
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setIsResetMode(false);
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="w-full py-3 text-neutral-400 hover:text-white text-xs font-semibold hover:underline"
                >
                  Return to Sign In
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Form Input fields */}
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider" htmlFor="email">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="driver@gridpass.app"
                      className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm placeholder:text-neutral-600 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider" htmlFor="password">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetMode(true);
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-sm placeholder:text-neutral-600 font-medium"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="btn-glow w-full py-3.5 mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/10 text-sm flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <>
                      Sign In
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              {/* Curated Divider */}
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-neutral-800"></div>
                <span className="flex-shrink mx-4 text-neutral-600 text-xs font-bold uppercase tracking-widest">or</span>
                <div className="flex-grow border-t border-neutral-800"></div>
              </div>

              {/* OAuth Providers */}
              <button
                onClick={handleGoogleLogin}
                disabled={isPending}
                className="w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-neutral-200 font-bold rounded-xl text-sm flex items-center justify-center gap-3 transition-all disabled:opacity-50"
              >
                {/* SVG Google Icon */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>
            </>
          )}
        </div>

        {/* Footer info link */}
        <p className="text-center text-xs text-neutral-500 mt-6 font-semibold uppercase tracking-wider">
          New to the universal keyway?{' '}
          <Link href={`/join?redirect=${encodeURIComponent(redirectUrl)}`} className="text-blue-500 hover:text-blue-400 font-bold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#060608]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
