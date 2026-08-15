'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from './Logo';
import { Menu, X, LayoutDashboard, Compass, Activity, QrCode, Wrench, Monitor, User as UserIcon, LogOut, LogIn, ChevronDown, Newspaper } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { auth } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';
import MemberNotificationsDrawer from '@/components/MemberNotificationsDrawer';

export default function Navbar() {
  const pathname = usePathname() || '';
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  // Hide Main Site Navbar on Gridpass OS desktop route
  if (pathname === '/os' || pathname.startsWith('/os')) {
    return null;
  }

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

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsUserMenuOpen(false);
      setIsOpen(false);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Member';
  const initial = (displayName[0] || 'U').toUpperCase();

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
          <Link href="/news" className={linkClass('/news')}>
            News
          </Link>
          <Link href="/feed" className={linkClass('/feed')}>
            Feed
          </Link>
          <Link href="/dash" className={linkClass('/dash')}>
            Dash
          </Link>

          {/* 🛠️ TOOLS DROPDOWN MENU */}
          <div className="relative group">
            <button
              type="button"
              className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wider transition-colors hover:text-[#ff3b30] py-2 cursor-pointer ${
                pathname.startsWith('/inventory') || pathname.startsWith('/scan') ? 'text-[#ff3b30]' : isDarkTheme ? 'text-neutral-400' : 'text-neutral-600'
              }`}
            >
              <span>Tools</span>
              <span className="text-[9px]">▾</span>
            </button>

            {/* Hover / Click Dropdown Card */}
            <div className="absolute right-0 top-full pt-1 hidden group-hover:block group-focus-within:block z-50 w-64 animate-in fade-in duration-150">
              <div className="bg-white border border-neutral-200 rounded-2xl shadow-xl p-2 space-y-1 text-left">
                <Link
                  href="/inventory"
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-50 transition-colors text-xs font-mono font-bold text-neutral-900 group/item"
                >
                  <div className="p-2 bg-red-50 text-[#ff3b30] rounded-lg group-hover/item:bg-[#ff3b30] group-hover/item:text-white transition-colors">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-black uppercase text-neutral-900 text-xs">Inventory</span>
                    <span className="text-[10px] text-neutral-500 font-normal block">Parts, Equipment &amp; Storage</span>
                  </div>
                </Link>
                <Link
                  href="/os"
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-50 transition-colors text-xs font-mono font-bold text-neutral-900 group/item"
                >
                  <div className="p-2 bg-neutral-900 text-white rounded-lg group-hover/item:bg-[#ff3b30] transition-colors">
                    <Monitor className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-black uppercase text-neutral-900 text-xs flex items-center gap-1">
                      Gridpass OS
                      <span className="px-1 py-0.2 bg-red-100 text-[#ff3b30] text-[9px] rounded font-mono">DESKTOP</span>
                    </span>
                    <span className="text-[10px] text-neutral-500 font-normal block">Full-Screen Web Desktop OS</span>
                  </div>
                </Link>

                <div className="pt-2 border-t border-neutral-100 px-3 py-1.5 flex items-center justify-between font-mono text-[9px] text-neutral-400 font-bold uppercase">
                  <span>⚡ Future Tools Coming</span>
                  <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">v5.0+</span>
                </div>

                <Link
                  href="/scan"
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-neutral-50 transition-colors text-xs font-mono font-bold text-neutral-900 group/item"
                >
                  <div className="p-2 bg-neutral-100 text-neutral-800 rounded-lg group-hover/item:bg-neutral-900 group-hover/item:text-white transition-colors">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-black uppercase text-neutral-900 text-xs">QR Scanner</span>
                    <span className="text-[10px] text-neutral-500 font-normal block">Scan Gate Badges &amp; Tags</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          <Link href="/secondlife" className={linkClass('/secondlife')}>
            Second Life
          </Link>

          {/* 🔔 Member Notifications & Digest Trigger (Desktop) */}
          <MemberNotificationsDrawer />

          {/* User Auth State Status Indicator (Desktop) */}
          {user ? (
            <div className="relative group">
              <Link
                href="/dash"
                className="flex items-center gap-2 pl-1.5 pr-3 py-1 bg-neutral-100 hover:bg-neutral-200 border border-neutral-200/80 rounded-full transition-all active:scale-95 shadow-2xs"
                title={`Logged in as ${user.email}`}
              >
                <div className="w-6 h-6 rounded-full bg-[#ff3b30] text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                  {initial}
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-800 max-w-[110px] truncate">
                  {displayName}
                </span>
                <span className="text-[9px] text-neutral-400">▾</span>
              </Link>

              {/* User Dropdown */}
              <div className="absolute right-0 top-full pt-1 hidden group-hover:block group-focus-within:block z-50 w-52 animate-in fade-in duration-150">
                <div className="bg-white border border-neutral-200 rounded-2xl shadow-xl p-2 space-y-1 text-left">
                  <div className="px-3 py-2 border-b border-neutral-100">
                    <span className="block text-[9px] font-mono uppercase text-neutral-400 font-bold">Signed in as</span>
                    <span className="block text-xs font-black text-neutral-900 truncate">{user.email}</span>
                  </div>
                  <Link
                    href="/dash"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-neutral-50 text-xs font-bold text-neutral-800 transition"
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#ff3b30]" />
                    <span>User Dashboard</span>
                  </Link>
                  <Link
                    href="/dash/edit-profile"
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-neutral-50 text-xs font-bold text-neutral-800 transition"
                  >
                    <UserIcon className="w-4 h-4 text-neutral-500" />
                    <span>Manage Profile</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-red-50 text-xs font-bold text-red-600 transition cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link
              href="/login"
              className="min-h-[36px] px-3.5 py-1.5 bg-[#ff3b30] hover:bg-[#d63025] text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition shadow-xs active:scale-95 flex items-center gap-1.5"
            >
              <span>Join / Sign In</span>
              <span className="text-[11px]">→</span>
            </Link>
          )}
        </div>

        {/* Mobile Header Controls: Notifications Bell + Hamburger */}
        <div className="flex md:hidden items-center gap-1.5">
          <MemberNotificationsDrawer />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl transition-colors active:scale-95 ${menuButtonClass}`}
            aria-label="Toggle Navigation Menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div 
          className={`md:hidden border-t py-4 px-4 space-y-2 animate-in slide-in-from-top-2 duration-150 ${
            isDarkTheme ? 'bg-[#060608] border-neutral-900' : 'bg-white border-neutral-100'
          }`}
        >
          {/* Member Profile Card on Mobile */}
          {user ? (
            <div className="mb-3 p-3 bg-neutral-50 border border-neutral-200 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#ff3b30] text-white text-xs font-black flex items-center justify-center shrink-0 shadow-xs">
                  {initial}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black uppercase text-neutral-900 truncate">{displayName}</div>
                  <div className="text-[10px] font-mono text-neutral-500 truncate">{user.email}</div>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase text-red-600 hover:bg-red-50 rounded-lg transition"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="mb-3">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="w-full py-3 px-4 bg-[#ff3b30] hover:bg-[#d63025] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-2 min-h-[44px]"
              >
                <LogIn className="w-4 h-4" />
                <span>Join / Sign In to Gridpass</span>
              </Link>
            </div>
          )}

          <Link 
            href="/news" 
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 text-xs font-black uppercase tracking-wider py-3 px-2 rounded-xl active:bg-neutral-100 min-h-[44px] text-[#ff3b30]"
          >
            <Newspaper className="w-5 h-5 text-[#ff3b30]" />
            <span>News</span>
          </Link>
          <Link 
            href="/dash" 
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 text-xs font-black uppercase tracking-wider py-3 px-2 rounded-xl active:bg-neutral-100 min-h-[44px]"
          >
            <LayoutDashboard className="w-5 h-5 text-[#ff3b30]" />
            Dash
          </Link>
          <Link 
            href="/inventory" 
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 text-xs font-black uppercase tracking-wider py-3 px-2 rounded-xl active:bg-neutral-100 min-h-[44px]"
          >
            <Wrench className="w-5 h-5 text-[#ff3b30]" />
            Inventory &amp; Tools
          </Link>
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
            href="/secondlife" 
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 text-xs font-black uppercase tracking-wider py-3 px-2 rounded-xl active:bg-neutral-100 min-h-[44px]"
          >
            <Compass className="w-5 h-5 text-purple-500" />
            Second Life
          </Link>
        </div>
      )}

    </nav>
  );
}
