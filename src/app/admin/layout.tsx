'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/admin') {
      return pathname === '/admin' || pathname === '/admin/users';
    }
    return pathname.startsWith(path);
  };

  const navCategories = [
    {
      title: 'Data & Records',
      items: [
        { label: 'Members', path: '/admin/users', icon: '👤' },
        { label: 'Vehicles', path: '/admin/vehicles', icon: '🏎️' },
        { label: 'Events', path: '/admin/events', icon: '🏁' },
        { label: 'Businesses', path: '/admin/businesses', icon: '🏢' },
        { label: 'Products Catalog', path: '/admin/products', icon: '📦' },
        { label: 'Industries Catalog', path: '/admin/industries', icon: '🏭' },
      ],
    },
    {
      title: 'Sales & CRM',
      items: [
        { label: 'Sales CRM & Deals', path: '/admin/crm', icon: '💼' },
        { label: 'Sales Staff & Reps', path: '/admin/staff', icon: '👥' },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-100 text-neutral-900 font-sans flex flex-col md:flex-row">
      {/* Left-Hand Sidebar Menu */}
      <aside className="w-full md:w-60 bg-[#1c1c1e] text-white flex-shrink-0 flex flex-col justify-between p-4 border-b md:border-b-0 md:border-r border-neutral-800">
        <div className="space-y-4">
          {/* Brand Header */}
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <Link href="/admin" className="flex items-center gap-2">
              <span className="font-black text-lg text-white uppercase tracking-tight">
                GRIDPASS<span className="text-[#ff3b30]">.ADMIN</span>
              </span>
            </Link>
          </div>

          {/* Categorized Left Navigation Menu */}
          <nav className="space-y-4">
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
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition ${
                        active
                          ? 'bg-[#ff3b30] text-white font-black shadow-sm'
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
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
