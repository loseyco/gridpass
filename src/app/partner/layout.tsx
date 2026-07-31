'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function PartnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Helper to check active state
  const isActive = (path: string) => {
    if (path === '/partner') {
      return pathname === '/partner';
    }
    return pathname.startsWith(path);
  };

  // If viewing a client proposal page, render clean layout without internal co-founder admin header
  if (pathname.startsWith('/partner/proposal')) {
    return <div className="min-h-screen bg-white text-neutral-900 font-sans">{children}</div>;
  }

  const navItems = [
    { label: 'Overview', path: '/partner', icon: '📊' },
    { label: 'Live Sales Demo', path: '/partner/demo', icon: '🎬' },
    { label: 'Clients & Toggles', path: '/partner/clients', icon: '🏢' },
    { label: 'Feedback & Bugs', path: '/partner/requests', icon: '🐞' },
    { label: 'Revenue Analytics', path: '/partner/analytics', icon: '💰' },
  ];

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 font-sans pb-16 md:pb-8">
      {/* Top Desktop / Mobile Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/partner" className="flex items-center gap-2">
              <span className="bg-[#ff3b30] text-white font-black text-xs px-2 py-1 rounded uppercase tracking-wider">
                OPS
              </span>
              <span className="font-extrabold text-lg text-[#1c1c1e] uppercase tracking-tight">
                GRIDPASS<span className="text-[#ff3b30]">.</span>OPS
              </span>
            </Link>
            <span className="hidden sm:inline-block text-xs font-semibold px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded border border-neutral-200">
              Co-Founder Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/partner/demo"
              className="bg-[#ff3b30] hover:bg-[#bd2925] text-white font-bold text-xs uppercase px-3 py-2 rounded transition shadow-sm flex items-center gap-1.5"
            >
              <span>⚡ Sales Demo Studio</span>
            </Link>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <div className="max-w-5xl mx-auto px-4 hidden md:flex gap-6 border-t border-neutral-100 text-xs font-bold uppercase tracking-wider pt-1">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`py-2.5 border-b-2 transition flex items-center gap-1.5 ${
                  active
                    ? 'text-[#ff3b30] border-[#ff3b30] font-black'
                    : 'text-neutral-600 border-transparent hover:text-black hover:border-neutral-300'
                }`}
              >
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6">
        {children}
      </main>

      {/* Bottom Fixed Mobile Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 z-50 px-2 py-2 flex justify-around items-center text-[10px] font-bold uppercase tracking-wider">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center transition ${
                active ? 'text-[#ff3b30] font-black' : 'text-neutral-600 hover:text-black'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
