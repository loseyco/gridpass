'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'neutral';
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      data-testid="confirm-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-description"
        className="relative w-full max-w-md bg-white border border-neutral-200 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden"
        data-testid="confirm-modal"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 transition-colors disabled:opacity-50"
          aria-label="Close modal"
          data-testid="confirm-modal-close-btn"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          {/* Alert Icon Badge */}
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-[#ff3b30]/20 flex items-center justify-center mb-4 text-[#ff3b30] shadow-sm">
            <AlertTriangle className="w-7 h-7 stroke-[2.2]" />
          </div>

          {/* Title */}
          <h3 
            id="confirm-modal-title" 
            className="text-lg font-black tracking-tight text-neutral-900 uppercase font-mono"
            data-testid="confirm-modal-title"
          >
            {title}
          </h3>

          {/* Description */}
          <p 
            id="confirm-modal-description" 
            className="mt-2.5 text-xs text-neutral-600 leading-relaxed font-sans"
            data-testid="confirm-modal-description"
          >
            {message}
          </p>

          {/* Actions */}
          <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 w-full">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full sm:flex-1 min-h-[44px] px-4 py-2.5 text-xs font-mono font-bold uppercase rounded-xl border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-colors disabled:opacity-50 flex items-center justify-center"
              data-testid="confirm-modal-cancel-btn"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={async () => {
                await onConfirm();
              }}
              disabled={isLoading}
              className={`w-full sm:flex-1 min-h-[44px] px-4 py-2.5 text-xs font-mono font-bold uppercase rounded-xl text-white transition-all shadow-md flex items-center justify-center disabled:opacity-50 ${
                variant === 'danger'
                  ? 'bg-[#ff3b30] hover:bg-[#d92d24] active:bg-[#bd2925]'
                  : 'bg-neutral-900 hover:bg-black active:bg-neutral-800'
              }`}
              data-testid="confirm-modal-confirm-btn"
            >
              {isLoading ? 'Processing...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
