'use client';

import React, { useState } from 'react';
import { Link2, Plus, X, Globe, ExternalLink } from 'lucide-react';

export interface ExperienceLinkItem {
  title: string;
  url: string;
}

interface ExperienceLinksInputProps {
  links: ExperienceLinkItem[];
  onChange: (links: ExperienceLinkItem[]) => void;
  label?: string;
  description?: string;
  badge?: React.ReactNode;
}

export function getDomain(rawUrl: string): string {
  try {
    const trimmed = rawUrl.trim();
    if (!trimmed) return '';
    const normalized = trimmed.startsWith('http://') || trimmed.startsWith('https://')
      ? trimmed
      : `https://${trimmed}`;
    const urlObj = new URL(normalized);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    return rawUrl;
  }
}

export function normalizeUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function ExperienceLinksInput({
  links = [],
  onChange,
  label = 'External Verification Links & References',
  description = 'Add links to articles, race results, team announcements, code repositories, or media coverage.',
  badge,
}: ExperienceLinksInputProps) {
  const [titleInput, setTitleInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [imageErrorMap, setImageErrorMap] = useState<Record<number, boolean>>({});

  const addLink = () => {
    const trimmedTitle = titleInput.trim();
    const trimmedUrl = urlInput.trim();

    if (!trimmedUrl) return;

    const normalized = normalizeUrl(trimmedUrl);
    const domain = getDomain(normalized);
    const finalTitle = trimmedTitle || domain || 'External Reference';

    onChange([...links, { title: finalTitle, url: normalized }]);
    setTitleInput('');
    setUrlInput('');
  };

  const removeLink = (indexToRemove: number) => {
    const updated = links.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addLink();
    }
  };

  return (
    <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-2xl space-y-4 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-neutral-200 pb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-xs font-mono font-bold uppercase text-neutral-900 flex items-center gap-1.5">
              <Link2 className="w-4 h-4 text-[#ff3b30]" /> {label}
            </label>
            {badge}
          </div>
          {description && (
            <p className="text-[11px] text-neutral-500 font-mono mt-0.5">{description}</p>
          )}
        </div>
        <span className="text-[11px] font-mono font-bold text-neutral-500">
          {links.length} {links.length === 1 ? 'Link' : 'Links'} Added
        </span>
      </div>

      {/* Rich Link Preview Rows */}
      {links.length > 0 && (
        <div className="space-y-2 pt-1" data-testid="experience-links-list">
          {links.map((link, idx) => {
            const domain = getDomain(link.url);
            const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64` : '';
            const hasFaviconError = imageErrorMap[idx];

            return (
              <div
                key={idx}
                data-testid={`link-preview-row-${idx}`}
                className="flex items-center justify-between gap-3 p-3 bg-white border border-neutral-200 hover:border-neutral-300 rounded-xl shadow-2xs transition-all"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0 overflow-hidden">
                    {faviconUrl && !hasFaviconError ? (
                      <img
                        src={faviconUrl}
                        alt=""
                        className="w-5 h-5 object-contain"
                        onError={() => setImageErrorMap((prev) => ({ ...prev, [idx]: true }))}
                      />
                    ) : (
                      <Globe className="w-5 h-5 text-neutral-400" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1 text-left">
                    <h4 className="text-xs font-bold text-neutral-900 truncate">
                      {link.title}
                    </h4>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[44px] text-[11px] font-mono text-neutral-500 hover:text-[#ff3b30] transition-colors inline-flex items-center gap-1 truncate max-w-full"
                    >
                      <span className="truncate">{domain || link.url}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeLink(idx)}
                  data-testid={`remove-link-btn-${idx}`}
                  aria-label={`Remove link ${link.title}`}
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-neutral-400 hover:text-[#ff3b30] hover:bg-neutral-100 rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Input Row: Title & URL + Add Link Button */}
      <div className="space-y-2 pt-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onKeyDown={handleKeyDown}
            data-testid="link-title-input"
            placeholder="Link Title (e.g. Race Results, Losey.co)..."
            className="w-full min-h-[44px] h-11 px-3.5 bg-white border border-neutral-200 rounded-xl text-xs font-mono font-bold text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#ff3b30] shadow-2xs"
          />
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={handleKeyDown}
            data-testid="link-url-input"
            placeholder="https://..."
            className="w-full min-h-[44px] h-11 px-3.5 bg-white border border-neutral-200 rounded-xl text-xs font-mono font-bold text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#ff3b30] shadow-2xs"
          />
        </div>

        <button
          type="button"
          onClick={addLink}
          disabled={!urlInput.trim()}
          data-testid="add-link-btn"
          className="w-full sm:w-auto min-h-[44px] min-w-[44px] px-5 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-mono font-bold uppercase rounded-xl transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4 text-[#ff3b30]" /> Add Link
        </button>
      </div>
    </div>
  );
}
