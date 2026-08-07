'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import { Menu, X, LayoutDashboard, Compass, Calendar, Activity, QrCode } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

export default function Navbar() {
  const pathname = usePathname() || '';
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const isDarkTheme = 
    pathname.startsWith('/scan') || 
    pathname.startsWith('/water');

  const navClass = isDarkTheme
    ? 'bg-[#060608]/90 text-[#f4f4f7] border-neutral-900/50 backdrop-blur-md'
    : 'bg-white/90 text-neutral-900 border-neutral-200/50 backdrop-blur-md';

  const linkClass = (path: string) => {
    const isActive = pathname === path;
    if (isDarkTheme) {
      return `text-[10px] font-black uppercase tracking-wider transition-colors hover:text-[#ff3b30] ${
        isActive ? 'text-[#ff3b30]' : 'text-neutral-400'
      }`;
    } else {
      return `text-[10px] font-black uppercase tracking-wider transition-colors hover:text-[#ff3b30] ${
        isActive ? 'text-[#ff3b30]' : 'text-neutral-600'
      }`;
    }
  };

  const menuButtonClass = isDarkTheme
    ? 'text-[#f4f4f7] hover:text-[#ff3b30]'
    : 'text-neutral-900 hover:text-[#ff3b30]';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 border-b transition-all duration-150 ${navClass}`}>
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
        
        {/* Left Side Branding */}
        <Link href={user ? '/dash' : '/'} className="flex items-center gap-1">
          <Logo 
            className="w-7 h-7" 
            textClassName={`text-sm font-black ${isDarkTheme ? 'text-white' : 'text-neutral-900'}`} 
          />
        </Link>

        {/* Right Side Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/explore" className={linkClass('/explore')}>
            Explore
          </Link>
          <Link href="/secondlife" className={linkClass('/secondlife')}>
            Second Life
          </Link>
          <Link href="/feed" className={linkClass('/feed')}>
            Feed
          </Link>
          <Link href="/dash" className={linkClass('/dash')}>
            Dash
          </Link>
        </div>

        {/* Mobile Hamburger Menu Toggle with >=44px Touch Target */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl transition-colors active:scale-95 ${menuButtonClass}`}
          aria-label="Toggle Navigation Menu"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div 
          className={`md:hidden border-t py-4 px-4 space-y-2 animate-in slide-in-from-top-2 duration-150 ${
            isDarkTheme ? 'bg-[#060608] border-neutral-900' : 'bg-white border-neutral-100'
          }`}
        >
          <Link 
            href="/explore" 
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 text-xs font-black uppercase tracking-wider py-3 px-2 rounded-xl active:bg-neutral-100 min-h-[44px]"
          >
            <Compass className="w-5 h-5 text-[#ff3b30]" />
            Explore
          </Link>
          <Link 
            href="/feed" 
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 text-xs font-black uppercase tracking-wider py-3 px-2 rounded-xl active:bg-neutral-100 min-h-[44px]"
          >
            <Activity className="w-5 h-5 text-[#ff3b30]" />
            Feed
          </Link>
          <Link 
            href="/dash" 
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 text-xs font-black uppercase tracking-wider py-3 px-2 rounded-xl active:bg-neutral-100 min-h-[44px]"
          >
            <LayoutDashboard className="w-5 h-5 text-[#ff3b30]" />
            Dash
          </Link>
        </div>
      )}

    </nav>
  );
}
