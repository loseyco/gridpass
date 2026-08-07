'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Trophy, Zap, CheckCircle, X } from 'lucide-react';

export interface ToastMessage {
  id?: string;
  title: string;
  message: string;
  creditsAwarded?: number;
  totalCredits?: number;
  icon?: string;
  type?: 'credit' | 'achievement' | 'info';
}

interface ToastContextType {
  showToast: (toast: ToastMessage) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (toast: ToastMessage) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast = { ...toast, id };

    setToasts((prev) => {
      // Remove any existing toast with exact same title & message to prevent duplicate clutter
      const deduplicated = prev.filter(t => !(t.title === toast.title && t.message === toast.message));
      // Cap at max 2 existing toasts so stack size is max 3
      return [...deduplicated.slice(-2), newToast];
    });

    // Auto dismiss after 3.5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const removeToast = (id?: string) => {
    if (!id) return;
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Global Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto bg-[#1c1c1e] text-white p-4 rounded-2xl border border-amber-400/40 shadow-2xl flex items-start gap-3 transition-all transform animate-in slide-in-from-top-3 duration-300 relative overflow-hidden"
          >
            {/* Ambient Gold Glow Background */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

            <div className="w-10 h-10 rounded-xl bg-[#ff3b30] text-white flex items-center justify-center text-xl font-black shrink-0 shadow-md">
              {toast.icon || '🏆'}
            </div>

            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-1.5">
                <h4 className="font-black text-xs uppercase text-white tracking-wider truncate">
                  {toast.title}
                </h4>
                {toast.creditsAwarded !== undefined && (
                  <span className="bg-amber-400 text-neutral-900 text-[10px] font-black uppercase px-2 py-0.2 rounded-full shrink-0 shadow-xs">
                    +{toast.creditsAwarded} Pts
                  </span>
                )}
              </div>

              <p className="text-xs text-neutral-300 mt-0.5 leading-snug">
                {toast.message}
              </p>

              {toast.totalCredits !== undefined && (
                <p className="text-[10px] font-bold text-emerald-400 mt-1 font-mono">
                  ⚡ New Balance: {toast.totalCredits.toLocaleString()} Grid Credits (${(toast.totalCredits / 100).toFixed(2)})
                </p>
              )}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="text-neutral-400 hover:text-white font-bold p-1 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
