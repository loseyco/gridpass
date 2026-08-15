'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2, Link as LinkIcon, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { ExperienceLinkItem } from './ExperienceLinksInput';

export interface ExtractedExperiencePayload {
  title?: string;
  company?: string;
  dateRange?: string;
  description?: string;
  skills?: string[];
  links?: ExperienceLinkItem[];
}

interface AiExperienceAutoFillCardProps {
  onExtractSuccess?: (data: ExtractedExperiencePayload) => void;
  onExtractBatch?: (experiences: ExtractedExperiencePayload[]) => void;
  className?: string;
}

export function AiExperienceAutoFillCard({
  onExtractSuccess,
  onExtractBatch,
  className = '',
}: AiExperienceAutoFillCardProps) {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const handleAutoFill = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const rawInput = inputText.trim();
    if (!rawInput) {
      setError('Please paste a URL or resume text before extracting.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessBanner(null);

    try {
      // Determine if input is a URL or text
      const isUrl = /^https?:\/\//i.test(rawInput) ||
        /^www\.[a-z0-9]/i.test(rawInput) ||
        (/^[a-z0-9-]+\.[a-z]{2,}(\/.*)?$/i.test(rawInput) && !rawInput.includes('\n') && !rawInput.includes(' '));

      const payload: { url?: string; raw_text?: string } = {};
      if (isUrl) {
        payload.url = rawInput;
      } else {
        payload.raw_text = rawInput;
        // Check if there's an embedded URL in the text
        const embeddedUrlMatch = rawInput.match(/https?:\/\/[^\s]+/i);
        if (embeddedUrlMatch) {
          payload.url = embeddedUrlMatch[0];
        }
      }

      const res = await fetch('/api/ai/extract-experience', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json?.auth_required) {
        setError(json.message || 'Login wall detected. Please copy your resume or profile text and paste it into the box above for instant AI extraction!');
        setLoading(false);
        return;
      }

      if (!res.ok || (!json?.experiences && !json?.data)) {
        throw new Error(json?.error || 'Failed to parse experience details.');
      }

      const rawList: any[] = Array.isArray(json.experiences) && json.experiences.length > 0
        ? json.experiences
        : (json.data ? [json.data] : []);

      if (rawList.length === 0) {
        throw new Error('No experience details could be extracted.');
      }

      const extractedList: ExtractedExperiencePayload[] = rawList.map((item: any) => ({
        title: item.title || '',
        company: item.company || '',
        dateRange: item.date_range || item.dateRange || '',
        description: item.description || '',
        skills: Array.isArray(item.skills) ? item.skills : [],
        links: Array.isArray(item.links)
          ? item.links.map((l: any) => ({
              title: l.title || 'Reference Link',
              url: l.url || '',
            }))
          : [],
      }));

      if (onExtractBatch) {
        onExtractBatch(extractedList);
      }

      if (extractedList.length === 1 && onExtractSuccess) {
        onExtractSuccess(extractedList[0]);
      } else if (!onExtractBatch && onExtractSuccess && extractedList.length > 0) {
        onExtractSuccess(extractedList[0]);
      }

      if (extractedList.length > 1) {
        setSuccessBanner(`✨ Extracted ${extractedList.length} experiences! Staged in batch queue below.`);
      } else {
        setSuccessBanner('✨ Form pre-filled by AI! Review and edit anything before saving.');
      }
    } catch (err: any) {
      console.error('Error during AI auto-fill:', err);
      setError(err?.message || 'Unable to extract information. Please verify the URL or text.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-testid="ai-autofill-card"
      className={`relative overflow-hidden rounded-2xl bg-neutral-900 border-2 border-neutral-800 p-5 md:p-6 text-white shadow-xl ${className}`}
    >
      {/* Background Accent Gradient */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-[#ff3b30] opacity-15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#ff3b30] text-white flex items-center justify-center shadow-md shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-black uppercase tracking-tight text-white flex items-center gap-1.5">
              ✨ AI Instant Auto-Fill
            </h3>
            <p className="text-xs text-neutral-400 font-mono">
              Paste a URL or resume text to populate role, company, skills, links, and details.
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-800 border border-neutral-700 text-[11px] font-mono font-bold text-neutral-300">
          <Sparkles className="w-3 h-3 text-[#ff3b30]" /> Gemini AI
        </span>
      </div>

      {/* Input Form */}
      <form onSubmit={handleAutoFill} className="space-y-3 mt-4">
        <div className="relative">
          <textarea
            rows={2}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            data-testid="ai-autofill-input"
            placeholder="Paste URL (LinkedIn, Indeed, Facebook, Article, Portfolio) or paste resume text..."
            className="w-full min-h-[52px] p-3.5 bg-neutral-950 border border-neutral-700 hover:border-neutral-600 focus:border-[#ff3b30] focus:ring-1 focus:ring-[#ff3b30] rounded-xl text-xs font-mono text-neutral-100 placeholder:text-neutral-500 focus:outline-none transition-all resize-none shadow-inner"
          />
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-400">
            <span className="inline-flex items-center gap-1">
              <LinkIcon className="w-3.5 h-3.5 text-neutral-500" /> LinkedIn, GitHub, News
            </span>
            <span className="inline-flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-neutral-500" /> Raw Resume Excerpt
            </span>
          </div>

          <div className="flex items-center gap-2">
            {inputText && (
              <button
                type="button"
                onClick={() => {
                  setInputText('');
                  setError(null);
                }}
                className="min-h-[44px] min-w-[44px] px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer inline-flex items-center justify-center"
              >
                Clear
              </button>
            )}

            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              data-testid="ai-autofill-btn"
              className="flex-1 sm:flex-none min-h-[44px] min-w-[44px] px-5 py-2.5 bg-[#ff3b30] hover:bg-[#bd2925] disabled:bg-neutral-800 disabled:text-neutral-500 text-white text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer inline-flex items-center justify-center gap-2 shadow-lg active:scale-95 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Extracting Asset Data...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>✨ Auto-Fill Form</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Success Notification Banner */}
      {successBanner && (
        <div
          data-testid="ai-autofill-success-banner"
          className="mt-4 p-3.5 bg-neutral-950 border border-neutral-700 rounded-xl flex items-start justify-between gap-3 text-xs font-mono text-white animate-fadeIn"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-[#ff3b30] shrink-0" />
            <span className="font-bold text-neutral-100">{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner(null)}
            aria-label="Dismiss message"
            className="min-h-[44px] min-w-[44px] -mr-2 -my-2 inline-flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div
          data-testid="ai-autofill-error-banner"
          className="mt-4 p-3.5 bg-neutral-950 border border-[#ff3b30]/60 rounded-xl flex items-start justify-between gap-3 text-xs font-mono text-[#ff3b30] animate-fadeIn"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#ff3b30] shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            aria-label="Dismiss error"
            className="min-h-[44px] min-w-[44px] -mr-2 -my-2 inline-flex items-center justify-center text-neutral-400 hover:text-[#ff3b30] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
