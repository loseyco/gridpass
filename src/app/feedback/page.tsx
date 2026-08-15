'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ToastContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function FeedbackPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'bug' | 'feature' | 'improvement' | 'general'>('bug');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showToast({
        title: 'Missing Required Fields',
        message: 'Please provide both a title and description for your feedback.',
        icon: '⚠️',
      });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        category,
        priority,
        description: description.trim(),
        user_id: user?.uid || 'anonymous',
        submitted_by_email: user?.email || 'anonymous',
        submitted_by_name: user?.displayName || 'Gridpass Member',
        page_route: '/feedback',
        page_url: typeof window !== 'undefined' ? window.location.href : '/feedback',
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
        status: 'PENDING_REVIEW',
        source_collection: 'user_feedback',
        created_at: serverTimestamp(),
      };

      // Dual write to user_feedback and feedback_queue collections
      await addDoc(collection(db, 'user_feedback'), payload);
      await addDoc(collection(db, 'feedback_queue'), {
        title: title.trim(),
        category,
        description: description.trim(),
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || 'anonymous',
        status: 'open',
        metadata: {
          path: typeof window !== 'undefined' ? window.location.href : '/feedback',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
          viewport: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A',
        },
        createdAt: serverTimestamp(),
      });

      showToast({
        title: 'Feedback Submitted! 🚀',
        message: 'Thank you! Your feedback has been sent directly to Super Admin Triage HQ.',
        icon: '✅',
      });

      setTitle('');
      setDescription('');
      setTimeout(() => {
        router.push(user ? '/dash' : '/');
      }, 1200);
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      showToast({
        title: 'Submission Error',
        message: err.message || 'Failed to submit feedback. Please try again.',
        icon: '❌',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Top Header & Prominent Back Button */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href={user ? '/dash' : '/'}
            className="inline-flex items-center gap-2 px-3 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs uppercase tracking-wider rounded-xl transition min-h-[44px]"
          >
            <span>← Back to Gridpass</span>
          </Link>
          <span className="text-xs font-mono font-bold text-neutral-500 uppercase tracking-widest">
            Member Triage Intake
          </span>
        </div>

        {/* Page Card Container */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-[#1c1c1e]">
              GRIDPASS<span className="text-[#ff3b30]">.FEEDBACK</span>
            </h1>
            <p className="text-xs font-semibold text-neutral-500 mt-1">
              Have an idea, bug report, or feature request? Submit it directly to our Super Admin execution queue.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title Input */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-neutral-700 mb-1">
                Title / Short Summary *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Navigation back button enhancement..."
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium focus:outline-none focus:border-[#ff3b30] transition text-neutral-900 placeholder:text-neutral-400"
              />
            </div>

            {/* Category & Priority Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-neutral-700 mb-1">
                  Feedback Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30] transition min-h-[44px]"
                >
                  <option value="bug">🐛 Bug / Issue Report</option>
                  <option value="feature">💡 Feature Request</option>
                  <option value="improvement">⚡ Experience Improvement</option>
                  <option value="general">💬 General Comment</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-neutral-700 mb-1">
                  Priority Level
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-bold text-neutral-900 focus:outline-none focus:border-[#ff3b30] transition min-h-[44px]"
                >
                  <option value="low">🟢 Low (Nice to have)</option>
                  <option value="medium">🟡 Medium (Normal Priority)</option>
                  <option value="high">🔴 High (Urgent Attention)</option>
                </select>
              </div>
            </div>

            {/* Description Textarea */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-neutral-700 mb-1">
                Detailed Description *
              </label>
              <textarea
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you observed or what enhancement you would like to see..."
                className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium focus:outline-none focus:border-[#ff3b30] transition text-neutral-900 placeholder:text-neutral-400 resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-[#ff3b30] hover:bg-[#d63025] disabled:bg-neutral-400 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-2 min-h-[48px] cursor-pointer"
              >
                <span>{submitting ? 'Submitting to Triage HQ...' : '🚀 Submit Feedback to Super Admin'}</span>
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
