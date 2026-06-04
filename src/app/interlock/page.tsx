'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  query,
  onSnapshot
} from 'firebase/firestore';
import { logEvent } from '@/lib/logger';
import { 
  Cpu, 
  Terminal, 
  Send, 
  Lock,
  ArrowRight,
  Loader2
} from 'lucide-react';

interface SwarmQuestion {
  id: string;
  question: string;
  category: string;
  placeholder: string;
  status: 'pending' | 'resolved';
  answer: string;
  updatedAt?: string | object | null;
  updatedBy?: string;
}

const SEED_QUESTIONS: SwarmQuestion[] = [
  {
    id: 'stripe-integration',
    question: 'We noticed Stripe billing code in the iracersresource companion project. For Gridpass split-billing at venues/tracks (e.g., $27.00 ticket fee + $2.99 Gridpass split), should we implement Stripe Connect Standard or Express accounts for track owners to onboard? How should refunds or chargebacks be split?',
    category: 'FinOps & Billing',
    placeholder: 'e.g. Let\'s go with Stripe Express to keep onboarding frictionless. Track owner takes chargeback liability, Gridpass split is non-refundable.',
    status: 'pending',
    answer: '',
  },
  {
    id: 'digital-garage-lookup',
    question: 'In the User Dashboard (/dash), what specific specifications should be in the vehicle passport? Should we integrate a paid license plate/VIN lookup API to auto-fill vehicle data, or keep it strictly manual/social first to minimize bootstrap cost?',
    category: 'UX & Product',
    placeholder: 'e.g. Keep it manual/social first to save cost. Let them type Year, Make, Model, License Plate, and list of mods with photo uploads.',
    status: 'pending',
    answer: '',
  },
  {
    id: 'qr-gate-operator-auth',
    question: 'With 1,000 holographic QR tags active in the wild pointing to gridpass.app/join?id=xxxx, when a track gate operator scans a visitor\'s tag: should it open a live-updating staff check-in screen (requiring track staff authentication), or should we allow a low-friction public confirmation view displaying waiver status and registration?',
    category: 'Access Control',
    placeholder: 'e.g. Public confirmation view first, but with a secured "Gate Manager" pin-entry overlay for staff check-in actions.',
    status: 'pending',
    answer: '',
  },
  {
    id: 'outreach-email-channel',
    question: 'Our CRM has 52 leads populated in leads.csv. To kick off cold email campaigns (HPDE track pitches, Off-road parks, and Enthusiast car clubs): should the automated outreach pipeline dispatch emails directly using a unified growth@gridpass.app address via SendGrid/Resend, or do you want to review each draft locally first?',
    category: 'Outreach & Marketing',
    placeholder: 'e.g. Send directly for car clubs, but queue HPDE track drafts in the team console so I can review them before they go out.',
    status: 'pending',
    answer: '',
  },
  {
    id: 'waiver-system-integration',
    question: 'For track access control, do we need to store and sign custom waiver forms directly inside Gridpass (digital signatures), or should we link out to external third-party digital waiver systems (e.g. SmartWaiver) and store a verified integration token?',
    category: 'Legal & Compliance',
    placeholder: 'e.g. Let\'s support external links first to keep it simple, but build a native basic waiver e-sign template as a premium Pro feature.',
    status: 'pending',
    answer: '',
  },
  {
    id: 'gridpass-pro-subscription',
    question: 'Apart from the $2.99 per gate-pass split fee, should we introduce a premium "Gridpass Pro" tier for vehicle enthusiasts (e.g. $4.99/mo for holographic tags, dynamic mod lists, digital garage showcases, and custom QR designs), or focus purely on SaaS fees charged to the venues?',
    category: 'Monetization & Strategy',
    placeholder: 'e.g. Yes! Gridpass Pro at $4.99/mo is a great idea. We can bundle it with a physical high-quality metallic QR tag shipped to their door.',
    status: 'pending',
    answer: '',
  }
];

export default function InterlockPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [questions, setQuestions] = useState<SwarmQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([
    '[10:39:01] [ORCHESTRATOR] Initializing Interlock Gating Protocol...',
    '[10:39:02] [ORCHESTRATOR] Listening to Firestore interlock state...',
  ]);

  const isOwner = user?.email === 'loseyp@gmail.com';

  // Real-time synchronization & self-seeding
  useEffect(() => {
    Promise.resolve().then(() => {
      setTelemetryLogs(prev => [...prev, '[10:39:10] [DB] querying interlock collection...']);
    });
    
    const q = query(collection(db, 'swarm_interlock'));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const list: SwarmQuestion[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as SwarmQuestion);
      });

      if (list.length === 0) {
        // Database is empty, initiate seeding!
        setTelemetryLogs(prev => [...prev, '[10:39:15] [WARNING] interlock empty. Triggering self-seed...']);
        try {
          for (const qObj of SEED_QUESTIONS) {
            const docRef = doc(db, 'swarm_interlock', qObj.id);
            await setDoc(docRef, {
              ...qObj,
              createdAt: serverTimestamp()
            });
          }
          setTelemetryLogs(prev => [...prev, '[10:39:18] [SUCCESS] All 6 questions successfully seeded into Firestore!']);
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          console.error("Seeding failed:", err);
          setTelemetryLogs(prev => [...prev, `[10:39:19] [ERROR] Seeding failed: ${errMsg}`]);
        }
      } else {
        // Sort questions to maintain fixed order
        const order = SEED_QUESTIONS.map(q => q.id);
        list.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
        
        setQuestions(list);
        setLoading(false);
        
        // Load existing answers into local state
        const initialAnswers: Record<string, string> = {};
        list.forEach(q => {
          initialAnswers[q.id] = q.answer || '';
        });
        setAnswers(initialAnswers);

        // Update telemetry status based on resolved items
        const resolvedCount = list.filter(q => q.status === 'resolved').length;
        setTelemetryLogs(prev => [
          ...prev, 
          `[10:39:25] [SYNC] Loaded ${list.length} questions. Status: ${resolvedCount}/${list.length} Blockers resolved.`
        ]);
        
        // Add specific telemetry lines for pending questions
        list.forEach(q => {
          if (q.status === 'pending') {
            setTelemetryLogs(prev => [
              ...prev,
              `[SYSTEM-WAIT] System blocked on: [${q.id.toUpperCase()}] (${q.category})`
            ]);
          } else {
            setTelemetryLogs(prev => [
              ...prev,
              `[SYSTEM-OK] Interlock resolved for [${q.id.toUpperCase()}]: "${q.answer.substring(0, 45)}..."`
            ]);
          }
        });
      }
    }, (error) => {
      console.error("Firestore onSnapshot error:", error);
      setErrorMsg("Failed to synchronize with Interlock database.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function handleLockAnswer(questionId: string) {
    const answerText = answers[questionId];
    if (!answerText || answerText.trim() === '') {
      alert("Please provide a valid answer before locking in decision.");
      return;
    }

    setSubmitting(prev => ({ ...prev, [questionId]: true }));
    setTelemetryLogs(prev => [...prev, `[10:40:02] [COMMIT] locking decision for [${questionId.toUpperCase()}]...`]);

    try {
      const docRef = doc(db, 'swarm_interlock', questionId);
      await updateDoc(docRef, {
        answer: answerText,
        status: 'resolved',
        updatedAt: serverTimestamp(),
        updatedBy: user?.email || 'loseyp@gmail.com'
      });

      // Central logging telemetry
      await logEvent(
        'success',
        'system',
        `Interlock resolved by Losey: ${questionId}`,
        { questionId, answerPreview: answerText.substring(0, 100) }
      );

      setTelemetryLogs(prev => [
        ...prev, 
        `[10:40:05] [SUCCESS] Decision synchronized: [${questionId.toUpperCase()}]. Broadcasted to operations pipeline.`
      ]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.error("Error updating answer:", err);
      alert("Failed to commit answer to Firestore: " + errMsg);
      setTelemetryLogs(prev => [...prev, `[10:40:06] [ERROR] Failed commit for [${questionId.toUpperCase()}]: ${errMsg}`]);
    } finally {
      setSubmitting(prev => ({ ...prev, [questionId]: false }));
    }
  }

  return (
    <main className="min-h-screen bg-[#060608] text-white relative overflow-hidden flex flex-col justify-between">
      <div className="mesh-glow" />
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 pt-24 pb-16 relative z-10 w-full flex-grow grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Telemetry & Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 rounded-3xl space-y-4 border-blue-500/10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400">
              <Cpu className="w-3.5 h-3.5 animate-pulse" />
              Decision Core
            </div>
            
            <h1 className="text-3xl font-black tracking-tighter">
              SYSTEM INTERLOCK
            </h1>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Welcome, **loseyp@gmail.com** and the Gridpass development pipeline. Below is the operational interlock pipeline. 
              The compiler resolves specifications directly from this live queue. 
              Lock in decisions to unblock background tasks immediately.
            </p>

            <div className="pt-4 border-t border-neutral-900 grid grid-cols-2 gap-4">
              <div className="bg-neutral-950/60 p-4 rounded-2xl border border-neutral-900">
                <div className="text-xs font-bold text-neutral-500 uppercase">Blockers</div>
                <div className="text-2xl font-black text-red-500 mt-1">
                  {questions.filter(q => q.status === 'pending').length}
                </div>
              </div>
              <div className="bg-neutral-950/60 p-4 rounded-2xl border border-neutral-900">
                <div className="text-xs font-bold text-neutral-500 uppercase">Resolved</div>
                <div className="text-2xl font-black text-emerald-400 mt-1">
                  {questions.filter(q => q.status === 'resolved').length} / {questions.length}
                </div>
              </div>
            </div>
          </div>

          {/* Telemetry Logger Terminal */}
          <div className="glass-card p-6 rounded-3xl space-y-3 border-neutral-900">
            <div className="flex items-center justify-between text-xs font-bold text-neutral-400 uppercase tracking-widest">
              <span className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                Live Operations Feed
              </span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <div className="bg-black/80 rounded-2xl p-4 border border-neutral-900 font-mono text-[11px] text-neutral-400 h-64 overflow-y-auto space-y-2 scrollbar-thin">
              {telemetryLogs.map((log, i) => (
                <div key={i} className={`leading-relaxed ${
                  log.includes('[ERROR]') ? 'text-red-400' :
                  log.includes('[SUCCESS]') ? 'text-emerald-400' :
                  log.includes('[COMMIT]') ? 'text-yellow-400 animate-pulse' :
                  log.includes('[SYSTEM-WAIT]') ? 'text-amber-500/80' :
                  log.includes('[SYSTEM-OK]') ? 'text-cyan-400/80' : 'text-neutral-500'
                }`}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Columns: Interactive Questions */}
        <div className="lg:col-span-2 space-y-6 relative">
          
          {/* Auth Guard Banner/Overlay */}
          {!authLoading && !isOwner && (
            <div className="absolute inset-0 bg-[#060608]/75 backdrop-blur-md rounded-3xl z-20 flex items-center justify-center p-8">
              <div className="w-full max-w-lg glass-card p-8 rounded-3xl border-red-500/20 text-center space-y-6 shadow-2xl relative">
                <div className="w-16 h-16 mx-auto bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-400">
                  <Lock className="w-8 h-8" />
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-white tracking-tight uppercase">Operations Terminal Restricted</h2>
                  <p className="text-neutral-400 text-sm leading-relaxed">
                    This terminal coordinates strategic building blocks between owner **loseyp@gmail.com** and the active automated pipelines. 
                    You are currently viewing a **read-only telemetry preview**.
                  </p>
                  <p className="text-neutral-500 text-xs italic">
                    {user ? `Currently authenticated as: ${user.email}` : "No active session loaded."}
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => router.push(`/login?redirect=${encodeURIComponent('/interlock')}`)}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 group"
                  >
                    Authenticate as Owner
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                  <button
                    onClick={() => router.push('/team')}
                    className="w-full py-3 bg-neutral-950 hover:bg-neutral-900 border border-neutral-900 text-neutral-300 font-bold rounded-xl text-sm transition-all"
                  >
                    Return to Operations Staff
                  </button>
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs text-center font-semibold">
              {errorMsg}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
              <p className="text-neutral-500 text-sm font-semibold">Loading Interlock Channel...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((q) => {
                const isPending = q.status === 'pending';
                const answerValue = answers[q.id] || '';
                
                return (
                  <div 
                    key={q.id} 
                    className={`glass-card p-6 rounded-3xl transition-all duration-300 border ${
                      isPending 
                        ? 'border-yellow-500/10 hover:border-yellow-500/20 shadow-lg shadow-yellow-500/2' 
                        : 'border-emerald-500/10 hover:border-emerald-500/20 shadow-lg shadow-emerald-500/2'
                    }`}
                  >
                    {/* Card Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${
                          isPending 
                            ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' 
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        }`}>
                          {q.category}
                        </span>
                        <span className="text-xs font-mono text-neutral-500 uppercase">
                          ID: {q.id}
                        </span>
                      </div>

                      {/* Status Indicator */}
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${isPending ? 'bg-yellow-500 animate-pulse' : 'bg-emerald-400'}`} />
                        <span className={`text-xs font-black uppercase tracking-wider ${isPending ? 'text-yellow-500' : 'text-emerald-400'}`}>
                          {isPending ? 'Pending Action' : 'Resolved & Synced'}
                        </span>
                      </div>
                    </div>

                    {/* Question Content */}
                    <h3 className="text-sm md:text-base font-bold text-neutral-100 leading-relaxed mb-4">
                      {q.question}
                    </h3>

                    {/* Answer Inputs */}
                    <div className="space-y-3">
                      <textarea
                        disabled={!isOwner}
                        value={answerValue}
                        onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        placeholder={q.placeholder}
                        rows={3}
                        className="glass-input w-full px-4 py-3 rounded-2xl text-sm placeholder:text-neutral-600 font-medium resize-none text-white disabled:opacity-75 disabled:cursor-not-allowed"
                      />

                      {isOwner && (
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                            {q.updatedAt ? `Last update: ${(q.updatedAt as { toDate?: () => Date }).toDate ? (q.updatedAt as { toDate?: () => Date }).toDate!().toLocaleTimeString() : 'Just now'}` : 'Not answered yet'}
                          </span>
                          <button
                            onClick={() => handleLockAnswer(q.id)}
                            disabled={submitting[q.id]}
                            className={`py-2 px-5 font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer ${
                              isPending
                                ? 'bg-yellow-600 hover:bg-yellow-500 text-black shadow-lg shadow-yellow-600/15'
                                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/15'
                            } disabled:opacity-50`}
                          >
                            {submitting[q.id] ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                {isPending ? 'Lock In Decision' : 'Update Response'}
                                <Send className="w-3 h-3" />
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {!isOwner && q.answer && (
                        <div className="p-4 bg-emerald-950/20 border border-emerald-500/10 rounded-2xl mt-2 text-xs">
                          <span className="font-bold text-emerald-400 block mb-1 uppercase tracking-wider text-[10px]">
                            Approved Decision:
                          </span>
                          <p className="text-neutral-300 italic">&quot;{q.answer}&quot;</p>
                          {q.updatedBy && (
                            <span className="text-[10px] text-neutral-500 block mt-2 text-right">
                              Resolved by: {q.updatedBy}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  );
}
