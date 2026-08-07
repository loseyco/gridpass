'use client';

import React, { Suspense, useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { KeyRound, Mail, Loader2, User } from 'lucide-react';
import { auth, db } from '@/lib/firebase/config';
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signInWithPopup, 
  GoogleAuthProvider,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/components/auth/AuthProvider';
import Logo from '@/components/Logo';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams ? searchParams.get('redirect') || '/dash' : '/dash';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const initialMode = searchParams ? searchParams.get('mode') === 'register' || searchParams.get('register') === 'true' : false;
  const [isRegisterMode, setIsRegisterMode] = useState(initialMode);
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { user, loading } = useAuth();

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

  async function handleRegisterSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    if (!displayName.trim()) {
      setErrorMsg("Please enter a display name.");
      return;
    }

    startTransition(async () => {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const registeredUser = userCredential.user;
        
        const userDocRef = doc(db, 'users', registeredUser.uid);
        await setDoc(userDocRef, {
          display_name: displayName.trim().toUpperCase(),
          email: email,
          bio: 'Welcome to Gridpass! Add your bio here.',
          is_supporter: false,
          location: 'USA',
          spots_submitted: 0,
          created_at: new Date().toISOString()
        });

        // Auto-award 250 Grid Credits Join Welcome Bonus ($2.50 value)
        try {
          const { addDoc, collection, serverTimestamp } = await import('firebase/firestore');
          await addDoc(collection(db, 'points_logs'), {
            userId: registeredUser.uid,
            userName: displayName.trim().toUpperCase(),
            userEmail: email,
            actionKey: 'achievement_join_gridpass',
            ruleTitle: '🏆 Achievement: Join Gridpass (Welcome Bonus)',
            pointsAwarded: 250,
            status: 'approved',
            notes: 'Automatic welcome bonus upon joining Gridpass',
            timestamp: serverTimestamp(),
          });
        } catch (pointsErr) {
          console.warn('Error awarding join bonus:', pointsErr);
        }

        router.push(redirectUrl);

      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error("Registration Error:", err);
        setErrorMsg(errMsg || 'An error occurred during registration.');
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
        const result = await signInWithPopup(auth, provider);
        const loggedUser = result.user;

        const userDocRef = doc(db, 'users', loggedUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
          await setDoc(userDocRef, {
            display_name: (loggedUser.displayName || loggedUser.email?.split('@')[0] || 'DRIVER').toUpperCase(),
            email: loggedUser.email || '',
            bio: 'Welcome to Gridpass! Add your bio here.',
            is_supporter: false,
            location: 'USA',
            spots_submitted: 0,
            created_at: new Date().toISOString()
          });
        }

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
      <div className="min-h-screen flex items-center justify-center bg-white text-neutral-900">
        <Loader2 className="w-8 h-8 text-[#ff3b30] animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-white text-neutral-900">
      <div className="w-full max-w-md space-y-6 py-8">
        
        {/* Logo and title */}
        <div className="text-center space-y-2">
          <Logo className="w-8 h-8 mx-auto" textClassName="text-2xl text-neutral-900 font-black" />
          <p className="text-neutral-500 text-xs font-mono font-bold uppercase tracking-wider">
            {isResetMode 
              ? "Recover access to your digital garage" 
              : isRegisterMode
                ? "Join Gridpass to claim your vehicle tag"
                : "Sign in to synchronize your physical keys and garage"}
          </p>
        </div>

        {/* Clean Light-Mode Card */}
        <div className="bg-neutral-50 border border-neutral-200 p-8 rounded-3xl space-y-6">
          {errorMsg && (
            <div className="bg-[#ff3b30]/10 border border-[#ff3b30]/20 text-[#ff3b30] p-4 rounded-xl text-xs text-center font-bold uppercase">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="bg-[#34c759]/10 border border-[#34c759]/20 text-[#30b351] p-4 rounded-xl text-xs text-center font-bold uppercase">
              {successMsg}
            </div>
          )}

          {isResetMode ? (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider" htmlFor="resetEmail">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="resetEmail"
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="driver@gridpass.app"
                    className="w-full bg-white border border-neutral-200 text-neutral-900 pl-9 pr-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#ff3b30]"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-3 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Recovery Link'}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setIsResetMode(false);
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="w-full py-2 text-neutral-500 hover:text-neutral-900 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : isRegisterMode ? (
            <>
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider" htmlFor="displayName">
                    Display Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="displayName"
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="MARCUS MUSTANG"
                      className="w-full bg-white border border-neutral-200 text-neutral-900 pl-9 pr-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#ff3b30] uppercase font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider" htmlFor="email">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="driver@gridpass.app"
                      className="w-full bg-white border border-neutral-200 text-neutral-900 pl-9 pr-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#ff3b30]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider" htmlFor="password">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border border-neutral-200 text-neutral-900 pl-9 pr-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#ff3b30]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider" htmlFor="confirmPassword">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      id="confirmPassword"
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border border-neutral-200 text-neutral-900 pl-9 pr-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#ff3b30]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-3 mt-2 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join'}
                </button>
              </form>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-neutral-200"></div>
                <span className="flex-shrink mx-3 text-neutral-400 text-[8px] font-mono font-bold uppercase tracking-wider">or</span>
                <div className="flex-grow border-t border-neutral-200"></div>
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={isPending}
                className="w-full py-3 px-4 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-800 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                Google Login
              </button>
            </>
          ) : (
            <>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider" htmlFor="email">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="driver@gridpass.app"
                      className="w-full bg-white border border-neutral-200 text-neutral-900 pl-9 pr-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#ff3b30]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider" htmlFor="password">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetMode(true);
                        setErrorMsg(null);
                        setSuccessMsg(null);
                      }}
                      className="text-xs font-bold text-[#ff3b30] hover:underline uppercase"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border border-neutral-200 text-neutral-900 pl-9 pr-4 py-2.5 rounded-xl text-xs focus:outline-none focus:border-[#ff3b30]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-3 mt-2 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
                </button>
              </form>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-neutral-200"></div>
                <span className="flex-shrink mx-3 text-neutral-400 text-[8px] font-mono font-bold uppercase tracking-wider">or</span>
                <div className="flex-grow border-t border-neutral-200"></div>
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={isPending}
                className="w-full py-3 px-4 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-800 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                Google Login
              </button>
            </>
          )}
        </div>

        {/* Switch Mode Link */}
        {!isResetMode && (
          <p className="text-center text-xs text-neutral-500 font-bold uppercase tracking-wider">
            {isRegisterMode ? (
              <>
                Already have an account?{' '}
                <button
                  onClick={() => {
                    setIsRegisterMode(false);
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-[#ff3b30] hover:underline font-bold"
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                New to the registry?{' '}
                <button
                  onClick={() => {
                    setIsRegisterMode(true);
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="text-[#ff3b30] hover:underline font-bold"
                >
                  Join here
                </button>
              </>
            )}
          </p>
        )}

      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white text-neutral-900">
        <Loader2 className="w-8 h-8 text-[#ff3b30] animate-spin" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
