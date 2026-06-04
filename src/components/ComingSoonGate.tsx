'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Sparkles, CheckCircle2, ArrowLeft, Loader2, Mail } from 'lucide-react';
import Logo from './Logo';

interface ComingSoonGateProps {
  title: string;
  description: string;
  featureKey: string;
}

export default function ComingSoonGate({ title, description, featureKey }: ComingSoonGateProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    if (typeof window !== 'undefined' && (window as any).__PLAYWRIGHT_MOCK__) {
      setSuccess(true);
      setLoading(false);
      return;
    }

    try {
      await addDoc(collection(db, 'interest_registry'), {
        email: email.trim(),
        feature: featureKey,
        timestamp: serverTimestamp()
      });
      setSuccess(true);
    } catch (err) {
      console.error('Waitlist submission failed:', err);
      alert('Could not submit waitlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#060608] text-[#f4f4f7] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="mesh-glow" />

      <div className="max-w-md w-full space-y-8 relative z-10 text-center">
        <div className="flex justify-center">
          <Link href="/">
            <Logo className="w-10 h-10" textClassName="text-2xl" />
          </Link>
        </div>

        <div className="glass-card p-8 rounded-[2rem] border-red-500/10 bg-neutral-950/40 backdrop-blur-md space-y-6">
          <div className="mx-auto w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-black uppercase tracking-tight text-white leading-tight">
              {title}
            </h1>
            <p className="text-neutral-400 text-sm leading-relaxed">
              {description}
            </p>
          </div>

          {success ? (
            <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <h3 className="font-bold text-white uppercase tracking-tight text-sm">Added to Waitlist</h3>
              <p className="text-xs text-neutral-400">
                You will be notified as soon as {title.toLowerCase()} goes live.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="glass-input w-full pl-10 pr-4 py-3 rounded-xl text-xs placeholder:text-neutral-600 font-medium bg-neutral-900/50 border-neutral-800 text-white focus:border-red-500/50 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-glow py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-red-500/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Join Waitlist'
                )}
              </button>
            </form>
          )}

          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
