'use client';

import React, { useState } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/components/ToastContext';
import { Flag, X, Check, Tag, AlertTriangle, Link as LinkIcon, Image as ImageIcon } from 'lucide-react';
import { NEWS_CATEGORIES, NewsCategory } from '@/lib/types/news';

interface ReportArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  articleId: string;
  articleSlug: string;
  articleTitle: string;
  currentCategory: string;
}

const REPORT_REASONS = [
  { id: 'wrong_category', label: 'Wrong Motorsport Category', icon: Tag, desc: 'e.g. Sports car tagged as Open Wheel' },
  { id: 'inaccurate_info', label: 'Inaccurate / Fake News', icon: AlertTriangle, desc: 'Misleading quotes, fake claims, or rumors' },
  { id: 'broken_source', label: 'Broken / Missing Source', icon: LinkIcon, desc: 'Primary link is broken or 404' },
  { id: 'wrong_photo', label: 'Incorrect Image / Cover', icon: ImageIcon, desc: 'Image does not match the car/driver' },
];

export function ReportArticleModal({
  isOpen,
  onClose,
  articleId,
  articleSlug,
  articleTitle,
  currentCategory,
}: ReportArticleModalProps) {
  const { showToast } = useToast();
  const [selectedReason, setSelectedReason] = useState<string>('wrong_category');
  const [suggestedCategory, setSuggestedCategory] = useState<NewsCategory>('sportscar');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // 1. Log community report record
      await addDoc(collection(db, 'news_reports'), {
        article_id: articleId,
        article_slug: articleSlug,
        article_title: articleTitle,
        current_category: currentCategory,
        reason: selectedReason,
        suggested_category: selectedReason === 'wrong_category' ? suggestedCategory : null,
        notes: notes.trim(),
        status: 'pending_review',
        created_at: serverTimestamp(),
      });

      // 2. Automatically generate an official AI Subagent Investigation Ticket
      const ticketNum = `TICK-${Math.floor(1000 + Math.random() * 9000)}`;
      const reasonLabel = REPORT_REASONS.find((r) => r.id === selectedReason)?.label || selectedReason;

      await addDoc(collection(db, 'agent_tickets'), {
        ticket_number: ticketNum,
        agent_role: 'site_auditor',
        title: `Community Wire Audit: ${reasonLabel} on "${articleTitle.slice(0, 50)}..."`,
        category: 'data_audit',
        priority: selectedReason === 'inaccurate_info' ? 'high' : 'medium',
        status: 'PENDING',
        components_used: ['ReportArticleModal', 'NewsEditorialReader', 'NewsClassifier'],
        files_modified: ['src/lib/news-classifier.ts', 'src/app/news/[slug]/page.tsx'],
        issue_description: `Community flagged article: ${reasonLabel}. Notes: ${notes.trim() || 'No extra notes provided.'} Current category: ${currentCategory}${selectedReason === 'wrong_category' ? ` (Suggested: ${suggestedCategory})` : ''}. Route: /news/${articleSlug}`,
        root_cause: `Community reported potential discrepancy. AI Site Auditor & Fact-Check Agent must verify source references, timing sheets, and cross-discipline taxonomy before applying corrections.`,
        resolution_summary: `Pending investigation by Gridpass AI Site Auditor.`,
        sop_summary: `SOP for fact-checking community reports and verifying motorsport wire accuracy.`,
        sop_steps: [
          '1. Inspect original source references and compare statements against official timing/telemetry records.',
          '2. If category taxonomy is wrong (e.g. TA2 Muscle Cars in Open Wheel), reclassify article and update Firestore.',
          '3. If factual error confirmed, append a verified editorial correction note to the article timeline.',
          '4. If verified false/malicious rumor with no source of truth, archive or toggle is_public: false.',
          '5. Resolve ticket with verification proof.'
        ],
        created_at: new Date().toISOString().slice(0, 10),
        verified_by_agent: 'site_auditor',
        audit_status: 'pending_review',
        telemetry_verified: false,
      });

      showToast({
        title: 'Report & Investigation Ticket Created',
        message: 'Our AI site auditor has logged an investigation ticket to verify and fact-check this dispatch.',
        icon: '🛡️',
      });

      onClose();
    } catch (err) {
      console.error('Error submitting report:', err);
      showToast({
        title: 'Submission Error',
        message: 'Could not submit report. Please try again.',
        icon: '⚠️',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 space-y-5 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-50 text-[#ff3b30] flex items-center justify-center">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase text-neutral-900">Report & Suggest Edit</h3>
              <p className="text-[11px] text-neutral-500 font-medium">Help maintain the Motorsport Source of Truth</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-neutral-400 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Article Summary */}
        <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs">
          <p className="font-mono text-[10px] text-neutral-500 uppercase font-bold">Article</p>
          <p className="font-bold text-neutral-900 line-clamp-1">{articleTitle}</p>
          <p className="text-[11px] text-neutral-600 mt-1">Current Tag: <span className="font-bold uppercase text-[#ff3b30]">{currentCategory}</span></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-neutral-700">Select Issue</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {REPORT_REASONS.map((r) => {
                const Icon = r.icon;
                const active = selectedReason === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedReason(r.id)}
                    className={`min-h-[44px] p-3 text-left rounded-xl border text-xs font-bold transition flex items-start gap-2.5 cursor-pointer ${
                      active
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                        : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${active ? 'text-[#ff3b30]' : 'text-neutral-400'}`} />
                    <div>
                      <div className="leading-tight">{r.label}</div>
                      <div className={`text-[10px] font-normal leading-snug mt-0.5 ${active ? 'text-neutral-300' : 'text-neutral-500'}`}>{r.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* If Wrong Category: Selector */}
          {selectedReason === 'wrong_category' && (
            <div className="space-y-2 pt-1 animate-in fade-in">
              <label className="text-xs font-black uppercase tracking-wider text-neutral-700">Suggested Category</label>
              <select
                value={suggestedCategory}
                onChange={(e) => setSuggestedCategory(e.target.value as NewsCategory)}
                className="w-full min-h-[44px] px-3.5 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-900 text-xs font-bold focus:bg-white focus:border-[#ff3b30] outline-none"
              >
                {NEWS_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Optional Notes */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-neutral-700">Additional Notes / Correction (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. This is a TA2 Mustang race at Queensland Raceway, not Formula Ford..."
              rows={2}
              className="w-full p-3 rounded-xl border border-neutral-200 bg-neutral-50 text-neutral-900 text-xs font-medium focus:bg-white focus:border-[#ff3b30] outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2 text-xs font-bold text-neutral-600 hover:text-neutral-900 rounded-xl hover:bg-neutral-100 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="min-h-[44px] px-6 py-2 bg-[#ff3b30] hover:bg-[#bd2925] text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Suggestion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
