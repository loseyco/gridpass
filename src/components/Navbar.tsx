'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  QrCode, LogOut, User, ChevronDown, CreditCard, Layers, Compass
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { auth } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';
import Logo from '@/components/Logo';

export default function Navbar() {
  const { user, loading } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on click away
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      window.location.href = '/';
    } catch (err) {
      console.error("Sign-out error:", err);
    }
  };

  const userPrefix = user?.email ? user.email.split('@')[0] : 'Driver';

  return (
    <nav className="fixed top-0 w-full z-50 border-b border-neutral-900 bg-[#060608]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="hover:opacity-90 transition-opacity">
          <Logo className="w-7 h-7" textClassName="text-lg" />
        </Link>
        <div className="flex items-center gap-4 md:gap-6 text-sm font-medium">
          <Link href="/pricing" className="text-neutral-400 hover:text-white transition-colors flex items-center gap-1">
            <CreditCard className="w-3.5 h-3.5 text-rose-500" />
            <span>Pricing</span>
          </Link>
          <Link href="/scan" className="text-neutral-400 hover:text-white transition-colors flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#bd2925]"></span>
            </span>
            <span>Scan Tag</span>
          </Link>

          {!loading && user ? (
            <div className="relative" ref={profileDropdownRef}>
              <button 
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border transition-all text-xs font-bold cursor-pointer select-none shadow-md ${
                  profileDropdownOpen 
                    ? 'bg-neutral-900 border-[#bd2925]/50 text-white shadow-[#bd2925]/5' 
                    : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5 text-rose-500" />
                <span className="max-w-[80px] truncate">{userPrefix}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-neutral-800 bg-[#060608]/95 backdrop-blur-xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-neutral-900 mb-1">
                    <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-widest block font-bold">DRIVER IDENTITY</span>
                    <span className="text-xs text-neutral-300 font-bold truncate block mt-0.5">{user.email}</span>
                  </div>
                  <div className="space-y-0.5">
                    <Link 
                      href="/dash" 
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900/60 transition-all text-xs font-medium"
                    >
                      <Layers className="w-3.5 h-3.5 text-rose-500" />
                      <span>Digital Garage</span>
                    </Link>
                    <Link 
                      href={`/u/${user.uid}`} 
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900/60 transition-all text-xs font-medium"
                    >
                      <Compass className="w-3.5 h-3.5 text-rose-500" />
                      <span>Public Passport</span>
                    </Link>
                    <button 
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleSignOut();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-500 hover:text-red-400 hover:bg-red-950/20 transition-all text-xs font-medium cursor-pointer text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="text-neutral-400 hover:text-white transition-colors text-xs font-bold">Sign In</Link>
              <Link href="/login" className="bg-white text-neutral-950 px-4 py-2 rounded-lg hover:bg-neutral-200 transition-colors shadow-lg font-bold text-xs">
                Join
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
