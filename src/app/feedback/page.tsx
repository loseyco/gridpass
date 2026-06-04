'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { logEvent } from '@/lib/logger';
import { 
  FileText, 
  Bug, 
  Sparkles, 
  Cpu, 
  Send, 
  Loader2, 
  CheckCircle,
  Home
} from 'lucide-react';
import Logo from '@/components/Logo';

type FeedbackCategory = 'bug' | 'feature' | 'ui_issue' | 'optimization';

export default function FeedbackPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<FeedbackCategory>('feature');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !description) {
      setErrorMsg("Please fill out all required fields.");
      return;
    }

    setErrorMsg(null);

    startTransition(async () => {
      try {
        const payload = {
          title,
          category,
          description,
          status: 'open', // open, in-progress, resolved, closed
          userEmail: user?.email || 'Anonymous',
          userId: user?.uid || null,
          createdAt: serverTimestamp(),
          metadata: {
            userAgent: navigator.userAgent,
            path: window.location.href,
            viewport: `${window.innerWidth}x${window.innerHeight}`
          }
        };

        // Persist the feedback ticket to Firestore queue
        const feedbackRef = collection(db, 'feedback_queue');
        const docRef = await addDoc(feedbackRef, payload);

        // Append to the central telemetry logger
        await logEvent(
          'success', 
          'feedback', 
          `New Feedback [${category.toUpperCase()}] submitted: "${title}"`, 
          { ticketId: docRef.id, userEmail: user?.email || 'Anonymous' }
        );

        setSuccess(true);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error("Feedback submit error:", err);
        setErrorMsg(errMsg || "Failed to submit feedback ticket. Please try again.");
        
        await logEvent(
          'error',
          'feedback',
          `Failed feedback submission: ${errMsg}`
        );
      }
    });
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#060608] px-6 relative overflow-hidden">
        <div className="mesh-glow" />
        <div className="w-full max-w-md glass-card p-8 rounded-3xl text-center space-y-6 relative z-10 border-emerald-500/20">
          <div className="w-16 h-16 mx-auto bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight text-white">Ticket Submitted</h1>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Your ticket has been written directly to the automated operations queue! The operations team will scan this database record, analyze the telemetry, and implement the requested updates.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => {
                setSuccess(false);
                setTitle('');
                setDescription('');
              }}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all"
            >
              Submit Another Request
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" /> Back to Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-[#060608]">
      <div className="mesh-glow" />

      <div className="w-full max-w-xl relative z-10 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900/80 border border-neutral-800 text-xs font-semibold text-neutral-300">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin" />
            Continuous Integration Loop
          </div>
          <div className="flex flex-col items-center justify-center gap-1.5 mb-2">
            <Logo className="w-9 h-9 mx-auto" textClassName="text-3xl md:text-4xl" />
            <span className="font-mono text-xs text-neutral-500 uppercase tracking-widest">DISPATCH CENTER</span>
          </div>
          <p className="text-neutral-400 text-sm max-w-sm mx-auto">
            Report bugs, request new modules, or detail structural changes. The system scans this queue and executes fixes live.
          </p>
        </div>

        {/* Feedback Card */}
        <div className="glass-card p-8 rounded-3xl space-y-6">
          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs text-center font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Select Dispatch Category
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { value: 'feature', label: 'Feature', icon: <Sparkles className="w-3.5 h-3.5" /> },
                  { value: 'bug', label: 'Bug', icon: <Bug className="w-3.5 h-3.5" /> },
                  { value: 'ui_issue', label: 'UI Issue', icon: <FileText className="w-3.5 h-3.5" /> },
                  { value: 'optimization', label: 'Speed', icon: <Cpu className="w-3.5 h-3.5" /> },
                ].map(item => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setCategory(item.value as FeedbackCategory)}
                    className={`py-3 px-3 rounded-xl border text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-2 transition-all ${category === item.value ? 'bg-blue-600/15 border-blue-500 text-blue-400 shadow-md' : 'bg-neutral-950/40 border-neutral-900 text-neutral-500 hover:text-neutral-300 hover:border-neutral-800'}`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ticket Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider" htmlFor="feedback-title">
                Short Title / Requirement
              </label>
              <input
                id="feedback-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. AddVenmo integration to in-app wallet"
                className="glass-input w-full px-4 py-3 rounded-xl text-sm placeholder:text-neutral-600 font-medium"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider" htmlFor="feedback-description">
                Description of Bug or Request
              </label>
              <textarea
                id="feedback-description"
                rows={5}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Include exact specifications, reproduction steps, or the visual layout you'd like our team to implement."
                className="glass-input w-full px-4 py-3 rounded-xl text-sm placeholder:text-neutral-600 font-medium resize-none"
              />
            </div>

            {/* User Attribution Display */}
            <div className="p-4 bg-neutral-950/60 border border-neutral-900 rounded-xl flex items-center justify-between text-xs">
              <span className="text-neutral-500 font-semibold uppercase tracking-wider">Submitting as:</span>
              <span className="font-mono text-neutral-300 font-bold max-w-[200px] truncate">
                {user ? user.email : 'Guest User'}
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isPending}
              className="btn-glow w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/10 text-sm flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  Dispatch Ticket to Queue
                  <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </main>
  );
}
