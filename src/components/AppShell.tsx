'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { auth } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';
import { 
  Car, Compass, QrCode, User, ArrowLeft, LogOut, Loader2, LayoutDashboard, Users, Building2, Calendar
} from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/Logo';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-screen w-screen bg-black text-white flex items-center justify-center font-sans">
        <Loader2 className="w-8 h-8 text-[#ff3b30] animate-spin" />
      </div>
    );
  }

  const isAuthPage = pathname === '/login';

  // Determine active tab for highlight
  const getActiveTab = () => {
    if (pathname === '/dash' || pathname === '/') return 'dash';
    if (pathname === '/members' || pathname?.startsWith('/u/')) return 'members';
    if (pathname === '/vehicles' || pathname?.startsWith('/v/')) return 'vehicles';
    if (pathname === '/events' || pathname?.startsWith('/events/')) return 'events';
    if (pathname === '/businesses' || pathname?.startsWith('/b/')) return 'buisniess';
    if (pathname?.startsWith('/explore')) {
      if (typeof window !== 'undefined') {
        const tab = new URLSearchParams(window.location.search).get('tab');
        if (tab === 'people') return 'members';
        if (tab === 'businesses') return 'buisniess';
        if (tab === 'venues') return 'events';
        return 'vehicles';
      }
      return 'vehicles';
    }
    return '';
  };
  const activeMenu = getActiveTab();

  // Check if we are on a detail/sub-page that needs a Back button
  const isTabRoute = pathname === '/dash' || pathname === '/' || pathname === '/members' || pathname === '/vehicles' || pathname === '/events' || pathname === '/businesses' || pathname === '/explore' || pathname === '/scan' || (user && pathname === `/u/${user.uid}`);
  const showBackButton = !isTabRoute && pathname !== '/login';

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (err) {
      console.error("Sign-out error:", err);
    }
  };

  // Get Page Title for Top App Bar
  const getPageTitle = () => {
    if (pathname === '/' || pathname === '/dash') return '';
    if (pathname === '/members') return 'Members';
    if (pathname === '/vehicles') return 'Vehicles';
    if (pathname === '/dash/edit-profile') return 'Edit Profile';
    if (pathname?.startsWith('/explore')) return 'Explore';
    if (pathname?.startsWith('/scan')) return 'Scanner';
    if (pathname?.startsWith('/u/')) return 'Member Profile';
    if (pathname?.startsWith('/v/')) return 'Vehicle Profile';
    if (pathname?.startsWith('/b/')) return 'Business Profile';
    if (pathname?.startsWith('/build-tag')) return 'Decal Studio';
    if (pathname?.startsWith('/join')) return 'Join Gridpass';
    if (pathname?.startsWith('/guides')) return 'Local Guides';
    if (pathname === '/login') return 'Gridpass';
    return '';
  };

  return (
    <div className="min-h-screen bg-[#f2f2f7] text-[#1c1c1e] flex flex-col font-sans selection:bg-[#ff3b30]/30">
      
      {/* Dynamic Top Header Navigation */}
      {!isAuthPage && (
        <header className="h-14 shrink-0 bg-white/85 backdrop-blur-md border-b border-neutral-200 flex items-center px-4 md:px-8 justify-between w-full z-40 sticky top-0">
          <div className="flex items-center gap-4">
            {showBackButton ? (
              <button 
                onClick={() => router.back()}
                className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-black transition-all cursor-pointer flex items-center justify-center"
                aria-label="Back"
              >
                <ArrowLeft className="w-5 h-5 text-[#ff3b30]" />
              </button>
            ) : (
              <Link href="/" className="hover:opacity-90 transition-opacity flex items-center gap-2">
                <Logo className="w-6 h-6" textClassName="text-sm font-extrabold text-neutral-900 hidden sm:block" />
              </Link>
            )}

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 ml-4">
              <Link 
                href="/dash" 
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                  activeMenu === 'dash' ? 'text-[#ff3b30] bg-[#ff3b30]/5' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Dash
              </Link>
               <Link 
                href="/members" 
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                  activeMenu === 'members' ? 'text-[#ff3b30] bg-[#ff3b30]/5' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Members
              </Link>
              <Link 
                href="/vehicles" 
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                  activeMenu === 'vehicles' ? 'text-[#ff3b30] bg-[#ff3b30]/5' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Vehicles
              </Link>
              <Link 
                href="/events" 
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                  activeMenu === 'events' ? 'text-[#ff3b30] bg-[#ff3b30]/5' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Events
              </Link>
              <Link 
                href="/businesses" 
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                  activeMenu === 'buisniess' ? 'text-[#ff3b30] bg-[#ff3b30]/5' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Businesses
              </Link>
            </nav>
          </div>

          <div className="text-sm font-black uppercase tracking-wider text-neutral-900 absolute left-1/2 -translate-x-1/2 pointer-events-none md:pointer-events-auto">
            {getPageTitle()}
          </div>

          <div className="flex items-center gap-2">
            {user ? (
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-red-500 hover:text-red-600 text-[10px] font-bold uppercase rounded-lg transition-colors cursor-pointer"
                title="Sign Out"
              >
                Sign Out
              </button>
            ) : (
              <Link 
                href="/login"
                className="text-xs font-bold text-[#ff3b30] hover:underline uppercase tracking-wide px-2 py-1"
              >
                Sign In
              </Link>
            )}
          </div>
        </header>
      )}

      {/* Main Responsive App Content Area */}
      <main className="flex-1 w-full bg-white flex flex-col relative min-h-0 overflow-y-auto pb-20 md:pb-0">
        {children}
      </main>

      {/* iOS Style Bottom Navigation Tab Bar (Mobile only, hidden on desktop) */}
      {user && !isAuthPage && (
        <nav className="h-16 shrink-0 bg-neutral-50/95 backdrop-blur-md border-t border-neutral-200 flex justify-around items-center px-2 w-full md:hidden z-40 sticky bottom-0">
          
          <Link 
            href="/dash" 
            className={`flex flex-col items-center justify-center w-14 h-12 transition-colors ${
              activeMenu === 'dash' ? 'text-[#ff3b30]' : 'text-neutral-500 hover:text-[#bd2925]'
            }`}
          >
            <LayoutDashboard className="w-4.5 h-4.5" />
            <span className="text-[8px] font-bold uppercase tracking-wider mt-1">Dash</span>
          </Link>

          <Link 
            href="/members" 
            className={`flex flex-col items-center justify-center w-14 h-12 transition-colors ${
              activeMenu === 'members' ? 'text-[#ff3b30]' : 'text-neutral-500 hover:text-[#bd2925]'
            }`}
          >
            <Users className="w-4.5 h-4.5" />
            <span className="text-[8px] font-bold uppercase tracking-wider mt-1">Members</span>
          </Link>

          <Link 
            href="/vehicles" 
            className={`flex flex-col items-center justify-center w-14 h-12 transition-colors ${
              activeMenu === 'vehicles' ? 'text-[#ff3b30]' : 'text-neutral-500 hover:text-[#bd2925]'
            }`}
          >
            <Car className="w-4.5 h-4.5" />
            <span className="text-[8px] font-bold uppercase tracking-wider mt-1">Vehicles</span>
          </Link>

          <Link 
            href="/events" 
            className={`flex flex-col items-center justify-center w-14 h-12 transition-colors ${
              activeMenu === 'events' ? 'text-[#ff3b30]' : 'text-neutral-500 hover:text-[#bd2925]'
            }`}
          >
            <Calendar className="w-4.5 h-4.5" />
            <span className="text-[8px] font-bold uppercase tracking-wider mt-1">Events</span>
          </Link>

          <Link 
            href="/businesses" 
            className={`flex flex-col items-center justify-center w-14 h-12 transition-colors ${
              activeMenu === 'buisniess' ? 'text-[#ff3b30]' : 'text-neutral-500 hover:text-[#bd2925]'
            }`}
          >
            <Building2 className="w-4.5 h-4.5" />
            <span className="text-[8px] font-bold uppercase tracking-wider mt-1">Biz</span>
          </Link>
        </nav>
      )}

    </div>
  );
}
