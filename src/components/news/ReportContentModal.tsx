'use client';

import React, { useState } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/components/ToastContext';
import { Flag, X, AlertTriangle, ShieldAlert, Image, MessageSquare, Tag, Check } from 'lucide-react';

export type ReportTargetType = 'post' | 'comment' | 'photo' | 'article';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetTitle?: string;
  targetAuthor?: string;
}

const REPORT_REASONS = [
  { id: 'spam_scam', label: 'Spam, Scam or Phishing', icon: ShieldAlert, desc: 'Unwanted promotional spam, bot posts, or scam links' },
  { id: 'inappropriate_media', label: 'Inappropriate / Explicit Photo', icon: Image, desc: 'Explicit imagery, dangerous content, or offensive media' },
  { id: 'harassment', label: 'Harassment or Hate Speech', icon: AlertTriangle, desc: 'Bullying, targeted abuse, insults, or hostile attacks' },
  { id: 'impersonation_fake', label: 'Fake Build or Impersonation', icon: Flag, desc: 'Stolen vehicle photos, claiming cars they do not own' },
  { id: 'wrong_category', label: 'Wrong Category or Tag', icon: Tag, desc: 'Post tagged in the wrong discipline or marketplace topic' },
];

export default function ReportContentModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
  targetAuthor,
}: Props) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [selectedReason, setSelectedReason] = useState<string>('spam_scam');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await addDoc(collection(db, 'content_reports'), {
        target_type: targetType,
        target_id: targetId,
        target_title: targetTitle || 'Untitled Content',
        target_author: targetAuthor || 'Unknown Author',
        reason: selectedReason,
        details: details.trim(),
        reported_by_uid: user?.uid || null,
        reported_by_email: user?.email || 'guest',
        status: 'PENDING_REVIEW',
        created_at: new Date().toISOString(),
      });

      showToast({
        title: 'Report Submitted',
        message: 'Thank you for helping keep the paddock clean, authentic, and safe.',
        icon: '🛡️',
      });

      setDetails('');
      onClose();
    } catch (err: any) {
      console.error('Error submitting report:', err);
      showToast({
        title: 'Submission Failed',
        message: err.message || 'Could not submit report. Please try again.',
        icon: '❌',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-neutral-200 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl space-y-4 p-5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-100 text-[#ff3b30] flex items-center justify-center font-bold">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase text-neutral-950 tracking-tight">
                Report {targetType}
              </h3>
              <p className="text-[11px] text-neutral-500">Flag inappropriate content for admin review.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 rounded-xl transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Summary */}
        {targetTitle && (
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 text-xs text-neutral-700 space-y-0.5">
            <span className="text-[10px] font-black uppercase text-neutral-400">Content Item:</span>
            <p className="font-bold text-neutral-900 line-clamp-1">{targetTitle}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase text-neutral-600 tracking-wider">
              Reason for Report:
            </label>
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
              {REPORT_REASONS.map((r) => {
                const Icon = r.icon;
                const isSelected = selectedReason === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedReason(r.id)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition ${
                      isSelected
                        ? 'border-[#ff3b30] bg-red-50/50 shadow-2xs'
                        : 'border-neutral-200 hover:bg-neutral-50'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        isSelected ? 'text-[#ff3b30]' : 'text-neutral-500'
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs font-black uppercase ${
                          isSelected ? 'text-[#ff3b30]' : 'text-neutral-900'
                        }`}
                      >
                        {r.label}
                      </p>
                      <p className="text-[10px] text-neutral-500 leading-tight">{r.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Details / Explanation */}
          <div className="space-y-1">
            <label className="text-[11px] font-black uppercase text-neutral-600 tracking-wider">
              Additional Details (Optional):
            </label>
            <textarea
              rows={2}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Explain why this content violates community guidelines..."
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#ff3b30]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold uppercase rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              {submitting ? (
                <span>Submitting...</span>
              ) : (
                <>
                  <Flag className="w-3.5 h-3.5" />
                  <span>Submit Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
