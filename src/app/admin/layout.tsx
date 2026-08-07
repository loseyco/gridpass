'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/admin') {
      return pathname === '/admin' || pathname === '/admin/users';
    }
    return pathname.startsWith(path);
  };

  const navCategories = [
    {
      title: 'Global System Tools',
      items: [
        { label: 'System Analytics', path: '/admin/analytics', icon: '📈' },
        { label: 'AI Agent Staff', path: '/admin/agents', icon: '🤖' },
        { label: 'Subagent Ticket HQ', path: '/admin/tickets', icon: '🎟️' },
        { label: 'Platform & AI SOPs', path: '/admin/sop', icon: '📚' },
        { label: 'Database Inspector', path: '/admin/db', icon: '🗄️' },
        { label: 'System Changelog', path: '/admin/changelog', icon: '📝' },
        { label: 'Feature Registry', path: '/admin/features', icon: '🚀' },
      ],
    },
    {
      title: 'Core Platform Entities',
      items: [
        { label: 'Members & Drivers', path: '/admin/users', icon: '👤' },
        { label: 'Vehicles', path: '/admin/vehicles', icon: '🏎️' },
        { label: 'Businesses & Vendors', path: '/admin/businesses', icon: '🏢' },
        { label: 'Platform Staff & Reps', path: '/admin/staff', icon: '👥' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 font-sans flex flex-col md:flex-row">
      {/* Left-Hand Sidebar Menu (Compact Collapsible Bar on Mobile) */}
      <aside className="w-full md:w-60 bg-[#1c1c1e] text-white flex-shrink-0 flex flex-col justify-between p-3 md:p-4 border-b md:border-b-0 md:border-r border-neutral-800 sticky top-0 z-40 md:static">
        <div className="space-y-3 md:space-y-4">
          {/* Brand Header with Mobile Hamburger Toggle */}
          <div className="flex items-center justify-between border-b md:border-b border-neutral-800 pb-2 md:pb-3">
            <Link href="/admin" className="flex items-center gap-2 shrink-0">
              <span className="font-black text-sm sm:text-base md:text-lg text-white uppercase tracking-tight whitespace-nowrap">
                GRIDPASS<span className="text-[#ff3b30]">.ADMIN</span>
              </span>
            </Link>

            {/* Mobile Hamburger Toggle Button (>=44px touch target) */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden touch-target-44 min-w-[44px] min-h-[44px] px-3 py-1 bg-neutral-800 border border-neutral-700 rounded-lg text-white font-bold text-xs uppercase flex items-center justify-center gap-1.5 active:scale-95 transition"
              aria-label="Toggle Navigation Menu"
            >
              <span>{isMobileMenuOpen ? '✕' : '☰'}</span>
              <span>{isMobileMenuOpen ? 'Close' : 'Menu'}</span>
            </button>
          </div>

          {/* Categorized Left Navigation Menu (Collapsible on Mobile) */}
          <nav className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:block space-y-4 pt-2 md:pt-0`}>
            {navCategories.map((group) => (
              <div key={group.title} className="space-y-1">
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-3 mb-1">
                  {group.title}
                </p>
                {group.items.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition min-h-[44px] ${
                        active
                          ? 'bg-[#ff3b30] text-white font-black shadow-xs'
                          : 'text-neutral-300 hover:bg-neutral-800 hover:text-white'
                      }`}
                    >
                      <span className="text-sm">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-neutral-800 hidden md:block">
          <p className="text-[10px] font-bold text-neutral-500 uppercase">
            Gridpass Admin Ops HQ
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-3 sm:p-4 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
