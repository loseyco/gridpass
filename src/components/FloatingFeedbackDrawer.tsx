'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { db } from '@/lib/firebase/config';
import { collection, addDoc } from 'firebase/firestore';
import { logAgentExecutionTicket } from '@/lib/agent-logger';

export function FloatingFeedbackDrawer() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Form State
  const [category, setCategory] = useState<'bug' | 'feature' | 'suggestion' | 'access'>('bug');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Hide feedback drawer on login/join landing screens if desired, or keep visible
  if (pathname.startsWith('/login') || pathname.startsWith('/join')) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const feedbackPayload = {
        category,
        priority,
        title,
        description,
        submitted_by_uid: user?.uid || 'guest_visitor',
        submitted_by_email: user?.email || 'guest@gridpass.app',
        submitted_by_name: user?.displayName || 'Anonymous Member',
        page_url: typeof window !== 'undefined' ? window.location.href : pathname,
        page_route: pathname,
        user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
        viewport_width: typeof window !== 'undefined' ? window.innerWidth : 1080,
        viewport_height: typeof window !== 'undefined' ? window.innerHeight : 1920,
        status: 'PENDING_AGENT_REVIEW',
        created_at: now,
      };

      // 1. Save to user_feedback collection
      try {
        await addDoc(collection(db, 'user_feedback'), feedbackPayload);
      } catch (e1) {
        console.warn('user_feedback Firestore write warning:', e1);
      }

      // 2. Also log as a pending TODO Execution Ticket in agent_tickets
      try {
        const ticketNum = `TICK-${Math.floor(2000 + Math.random() * 8000)}`;
        await logAgentExecutionTicket({
          ticket_number: ticketNum,
          agent_role: 'site_auditor',
          title: `[${category.toUpperCase()}] ${title}`,
          category: category === 'bug' ? 'ui_design' : 'feature',
          priority,
          status: 'TODO',
          components_used: ['FloatingFeedbackDrawer', 'UserFeedbackQueue'],
          files_modified: [pathname],
          issue_description: `User Feedback from ${user?.email || 'Visitor'} on page ${pathname}: ${description}`,
          root_cause: `Submitted via Universal Floating Feedback Drawer on ${pathname}.`,
          resolution_summary: 'Pending agent team review during sprint planning meeting.',
          verification_proof: 'Awaiting subagent verification upon ticket triage.',
          sop_summary: `User feedback ticket submitted from ${pathname}.`,
          sop_steps: [
            `Review submitted feedback item ${ticketNum} during sprint planning meeting.`,
            `Assign responsible subagent (architect, site_auditor, mobile_expert, etc.).`,
            `Execute code modifications and update ticket status to VERIFIED upon completion.`
          ],
        });
      } catch (e2) {
        console.warn('agent_tickets write warning:', e2);
      }

      // 3. Log to system_logs for telemetry
      try {
        await addDoc(collection(db, 'system_logs'), {
          timestamp: now,
          category: 'USER',
          actor: user?.email || 'Anonymous Visitor',
          actor_role: 'member',
          action: 'USER_FEEDBACK_SUBMITTED',
          target_path: pathname,
          details: `Submitted ${category} ticket: "${title}"`,
          metadata: feedbackPayload,
        });
      } catch (e3) {
        console.warn('system_logs write warning:', e3);
      }

      setSubmitting(false);
      setSubmittedSuccess(true);
      setTimeout(() => {
        setSubmittedSuccess(false);
        setIsOpen(false);
        setTitle('');
        setDescription('');
      }, 2500);
    } catch (err) {
      console.error('Failed to submit user feedback:', err);
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Action Badge Pinned to Bottom-Right Corner (Out of the way of action buttons) */}
      <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex items-center gap-1">
        {isMinimized ? (
          <button
            onClick={() => setIsMinimized(false)}
            className="w-10 h-10 bg-[#ff3b30] hover:bg-[#d63025] text-white rounded-full shadow-2xl flex items-center justify-center font-black text-sm transition active:scale-95 border-2 border-white"
            title="Open Feedback Drawer"
          >
            💬
          </button>
        ) : (
          <div className="flex items-center bg-[#ff3b30] text-white rounded-full shadow-2xl border-2 border-white overflow-hidden transition">
            <button
              onClick={() => setIsOpen(true)}
              className="px-3.5 py-2 hover:bg-[#d63025] font-black text-xs uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition min-h-[44px]"
            >
              <span>💬</span>
              <span>Feedback</span>
            </button>
            <button
              onClick={() => setIsMinimized(true)}
              className="px-2 py-2 hover:bg-[#d63025] border-l border-white/30 text-white/80 hover:text-white font-bold text-xs active:scale-95 transition min-h-[44px] min-w-[32px] flex items-center justify-center"
              title="Minimize to tiny bubble"
            >
              ⎯
            </button>
          </div>
        )}
      </div>

      {/* Slide-Out Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-md h-full flex flex-col justify-between shadow-2xl border-l border-neutral-200 animate-in slide-in-from-right duration-200 font-sans">
            
            {/* Header */}
            <div className="p-5 border-b border-neutral-200 bg-neutral-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">💬</span>
                <div>
                  <h2 className="font-black text-base uppercase tracking-tight text-white">
                    Submit Feedback & Ticket
                  </h2>
                  <p className="text-[11px] text-neutral-400 font-medium">
                    Report a bug, suggest a feature, or request permissions.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="touch-target-44 text-neutral-400 hover:text-white font-bold active:scale-95 transition"
              >
                ✕
              </button>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {submittedSuccess ? (
                <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3 my-auto">
                  <span className="text-4xl block">✅</span>
                  <h3 className="font-black text-lg text-emerald-950 uppercase">Feedback Received!</h3>
                  <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                    Your report has been logged to our agent ticket queue and system telemetry stream. Our team will review it shortly!
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Category Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-neutral-600 block">
                      Feedback Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'bug', label: '🐛 Bug Report' },
                        { id: 'feature', label: '🚀 Feature Request' },
                        { id: 'suggestion', label: '💡 General Idea' },
                        { id: 'access', label: '🔒 Access Issue' },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id as any)}
                          className={`p-2.5 rounded-xl border text-xs font-bold text-left transition active:scale-95 ${
                            category === cat.id
                              ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                              : 'bg-neutral-50 text-neutral-800 border-neutral-200 hover:bg-neutral-100'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Priority Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-wider text-neutral-600 block">
                      Priority Level
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: 'low', label: '⚪ Low' },
                        { id: 'medium', label: '🔵 Med' },
                        { id: 'high', label: '⚡ High' },
                        { id: 'urgent', label: '🚨 Urgent' },
                      ].map((prio) => (
                        <button
                          key={prio.id}
                          type="button"
                          onClick={() => setPriority(prio.id as any)}
                          className={`py-1.5 px-2 rounded-lg border text-[10px] font-black uppercase text-center transition active:scale-95 ${
                            priority === prio.id
                              ? 'bg-[#ff3b30] text-white border-[#ff3b30]'
                              : 'bg-neutral-50 text-neutral-700 border-neutral-200'
                          }`}
                        >
                          {prio.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subject / Title */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-neutral-600 block">
                      Title / Subject *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Buttons cut off on narrow screens..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full text-xs font-medium p-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff3b30] bg-neutral-50"
                    />
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase tracking-wider text-neutral-600 block">
                      Detailed Description *
                    </label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Explain what happened or what feature you would like added..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full text-xs font-medium p-3 border border-neutral-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff3b30] bg-neutral-50"
                    />
                  </div>

                  {/* Auto-Captured Context Info */}
                  <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl space-y-1 text-[10px] font-mono text-neutral-500">
                    <span className="font-bold text-neutral-700 block uppercase">Auto-Captured Context:</span>
                    <p className="truncate">📍 Page: {pathname}</p>
                    <p>👤 User: {user?.email || 'Guest Visitor'}</p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-[#ff3b30] hover:bg-[#d63025] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition active:scale-95 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting Ticket...' : '🚀 Submit Feedback to Agents'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
