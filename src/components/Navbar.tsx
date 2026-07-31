'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import { Menu, X, LayoutDashboard, Users, CarFront, Calendar, Building2 } from 'lucide-react';
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
          <Link href="/dash" className={linkClass('/dash')}>
            Dash
          </Link>
          <Link href="/members" className={linkClass('/members')}>
            Members
          </Link>
          <Link href="/vehicles" className={linkClass('/vehicles')}>
            Vehicles
          </Link>
          <Link href="/events" className={linkClass('/events')}>
            Events
          </Link>
          <Link href="/businesses" className={linkClass('/businesses')}>
            Businesses
          </Link>
        </div>

        {/* Hamburger Menu Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`md:hidden p-1 transition-colors ${menuButtonClass}`}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div 
          className={`md:hidden border-t py-4 px-4 space-y-4 animate-in slide-in-from-top-2 duration-150 ${
            isDarkTheme ? 'bg-[#060608] border-neutral-900' : 'bg-white border-neutral-100'
          }`}
        >
          <Link 
            href="/dash" 
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 text-xs font-black uppercase tracking-wider py-1.5"
          >
            <LayoutDashboard className="w-4 h-4 text-[#ff3b30]" />
            Dash
          </Link>
          <Link 
            href="/members" 
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 text-xs font-black uppercase tracking-wider py-1.5"
          >
            <Users className="w-4 h-4 text-[#ff3b30]" />
            Members
          </Link>
          <Link 
            href="/vehicles" 
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 text-xs font-black uppercase tracking-wider py-1.5"
          >
            <CarFront className="w-4 h-4 text-[#ff3b30]" />
            Vehicles
          </Link>
          <Link 
            href="/events" 
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 text-xs font-black uppercase tracking-wider py-1.5"
          >
            <Calendar className="w-4 h-4 text-[#ff3b30]" />
            Events
          </Link>
          <Link 
            href="/businesses" 
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 text-xs font-black uppercase tracking-wider py-1.5"
          >
            <Building2 className="w-4 h-4 text-[#ff3b30]" />
            Businesses
          </Link>
        </div>
      )}

    </nav>
  );
}
