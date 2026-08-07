'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { auth } from '@/lib/firebase/config';
import { signOut } from 'firebase/auth';
import { 
  Car, Compass, QrCode, User, ArrowLeft, LogOut, Loader2, LayoutDashboard, Users, Building2, Calendar, Activity, Menu, X, Globe
} from 'lucide-react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { FloatingFeedbackDrawer } from '@/components/FloatingFeedbackDrawer';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthPage = pathname === '/login';
  const isSecondLifePage = pathname?.startsWith('/secondlife');

  // Determine active tab for highlight
  const getActiveTab = () => {
    if (pathname?.startsWith('/explore') || pathname === '/members' || pathname === '/vehicles' || pathname === '/businesses' || pathname?.startsWith('/u/') || pathname?.startsWith('/v/') || pathname?.startsWith('/b/') || pathname?.startsWith('/venue/')) return 'explore';
    if (pathname === '/dash' || pathname === '/') return 'dash';
    if (pathname === '/events' || pathname?.startsWith('/events/')) return 'events';
    if (pathname === '/feed' || pathname?.startsWith('/feed/')) return 'feed';
    if (pathname === '/scan' || pathname?.startsWith('/scan/')) return 'scan';
    return '';
  };
  const activeMenu = getActiveTab();

  // Check if we are on a detail/sub-page that needs a Back button
  const isTabRoute = pathname === '/dash' || pathname === '/' || pathname === '/explore' || pathname === '/events' || pathname === '/feed' || pathname === '/scan' || pathname === '/members' || pathname === '/vehicles' || pathname === '/businesses' || (user && pathname === `/u/${user.uid}`);
  const showBackButton = !isTabRoute && pathname !== '/login';

  const handleSmartBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 2) {
      router.back();
    } else {
      if (pathname?.startsWith('/v/')) router.push('/vehicles');
      else if (pathname?.startsWith('/u/')) router.push('/members');
      else if (pathname?.startsWith('/b/')) router.push('/businesses');
      else if (pathname?.startsWith('/events/')) router.push('/events');
      else if (pathname?.startsWith('/admin')) router.push('/admin');
      else if (pathname?.startsWith('/guides')) router.push('/guides');
      else router.push('/dash');
    }
  };

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
    if (pathname?.startsWith('/explore')) return 'Explore';
    if (pathname === '/members') return 'Members';
    if (pathname === '/vehicles') return 'Vehicles';
    if (pathname === '/businesses') return 'Businesses';
    if (pathname === '/events') return 'Events';
    if (pathname?.startsWith('/feed')) return 'Live Feed';
    if (pathname?.startsWith('/scan')) return 'Scanner';
    if (pathname?.startsWith('/dash/edit-profile')) return 'Edit Profile';
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
      {/* Dynamic Top Header Navigation (Hidden on event hub pages and secondlife pages which have dedicated floating headers) */}
      {!isAuthPage && !isSecondLifePage && !(pathname.startsWith('/events/') && pathname !== '/events' && pathname !== '/events/create') && (
        <header className="h-14 shrink-0 bg-white/85 backdrop-blur-md border-b border-[#e5e5ea] flex items-center px-4 md:px-8 justify-between w-full z-40 sticky top-0">
          <div className="flex items-center gap-4">
            {showBackButton ? (
              <button 
                onClick={handleSmartBack}
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
                href="/explore" 
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                  activeMenu === 'explore' ? 'text-[#ff3b30] bg-[#ff3b30]/5' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Explore
              </Link>
              <Link 
                href="/feed" 
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                  activeMenu === 'feed' ? 'text-[#ff3b30] bg-[#ff3b30]/5' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Feed
              </Link>
              <Link 
                href="/dash" 
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                  activeMenu === 'dash' ? 'text-[#ff3b30] bg-[#ff3b30]/5' : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Dash
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
                className="px-3 py-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-red-500 hover:text-red-600 text-[10px] font-bold uppercase rounded-lg transition-colors cursor-pointer min-h-[44px] flex items-center"
                title="Sign Out"
              >
                Sign Out
              </button>
            ) : (
              <Link 
                href="/login"
                className="text-xs font-bold text-[#ff3b30] hover:underline uppercase tracking-wide px-3 py-2 min-h-[44px] flex items-center"
              >
                Sign In
              </Link>
            )}

            {/* Mobile Hamburger Drawer Toggle (Mobile only, hidden on desktop) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-xl text-neutral-800 hover:text-[#ff3b30] hover:bg-neutral-100 transition-colors active:scale-95"
              aria-label="Toggle Mobile Navigation Drawer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>
      )}

      {/* Slide-Down Mobile Drawer Overlay for Logged-In & Logged-Out Visitors */}
      {mobileMenuOpen && !isAuthPage && (
        <div className="md:hidden sticky top-14 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-xl px-4 py-4 space-y-2 animate-in slide-in-from-top-2 duration-150">
          <Link 
            href="/explore" 
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 text-xs font-black uppercase tracking-wider py-3 px-3 rounded-xl hover:bg-neutral-100 active:bg-neutral-200 min-h-[44px]"
          >
            <Compass className="w-5 h-5 text-[#ff3b30]" />
            <span>Explore All</span>
          </Link>

          <Link 
            href="/vehicles" 
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 text-xs font-black uppercase tracking-wider py-3 px-3 rounded-xl hover:bg-neutral-100 active:bg-neutral-200 min-h-[44px]"
          >
            <Car className="w-5 h-5 text-[#ff3b30]" />
            <span>Vehicles & Builds</span>
          </Link>

          <Link 
            href="/events" 
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 text-xs font-black uppercase tracking-wider py-3 px-3 rounded-xl hover:bg-neutral-100 active:bg-neutral-200 min-h-[44px]"
          >
            <Calendar className="w-5 h-5 text-[#ff3b30]" />
            <span>Events & Pit Passes</span>
          </Link>

          <Link 
            href="/businesses" 
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 text-xs font-black uppercase tracking-wider py-3 px-3 rounded-xl hover:bg-neutral-100 active:bg-neutral-200 min-h-[44px]"
          >
            <Building2 className="w-5 h-5 text-[#ff3b30]" />
            <span>Businesses & Food Trucks</span>
          </Link>

          <Link 
            href="/feed" 
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 text-xs font-black uppercase tracking-wider py-3 px-3 rounded-xl hover:bg-neutral-100 active:bg-neutral-200 min-h-[44px]"
          >
            <Activity className="w-5 h-5 text-[#ff3b30]" />
            <span>Live Activity Feed</span>
          </Link>

          <Link 
            href="/secondlife" 
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 text-xs font-black uppercase tracking-wider py-3 px-3 rounded-xl hover:bg-neutral-100 active:bg-neutral-200 min-h-[44px]"
          >
            <Globe className="w-5 h-5 text-[#ff3b30]" />
            <span>Second Life Track Telemetry</span>
          </Link>

          <div className="pt-2 border-t border-neutral-100 flex flex-col gap-2">
            <Link 
              href="/join" 
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 bg-[#ff3b30] hover:bg-[#bd2925] text-white font-black text-center text-xs uppercase tracking-wider rounded-xl shadow-xs active:scale-95 transition-all min-h-[44px] flex items-center justify-center"
            >
              Claim Tag / Join Gridpass
            </Link>
            {!user && (
              <Link 
                href="/login" 
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 font-bold text-center text-xs uppercase tracking-wider rounded-xl active:scale-95 transition-all min-h-[44px] flex items-center justify-center"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Main Responsive App Content Area */}
      <main className={`flex-1 w-full bg-white flex flex-col relative min-h-0 overflow-y-auto ${isSecondLifePage ? 'pb-0' : 'pb-20 md:pb-0'}`}>
        {children}
      </main>

      {/* iOS Style Bottom Navigation Tab Bar (Mobile only, hidden on desktop - Enabled for ALL visitors!) */}
      {!isAuthPage && !isSecondLifePage && (
        <nav className="h-16 shrink-0 bg-neutral-50/95 backdrop-blur-md border-t border-neutral-200 flex justify-around items-center px-2 w-full md:hidden z-40 sticky bottom-0">
          
          <Link 
            href="/explore" 
            className={`flex flex-col items-center justify-center w-14 h-12 transition-colors ${
              activeMenu === 'explore' ? 'text-[#ff3b30]' : 'text-neutral-500 hover:text-[#bd2925]'
            }`}
          >
            <Compass className="w-4.5 h-4.5" />
            <span className="text-[8px] font-bold uppercase tracking-wider mt-1">Explore</span>
          </Link>

          <Link 
            href="/vehicles" 
            className={`flex flex-col items-center justify-center w-14 h-12 transition-colors ${
              pathname === '/vehicles' ? 'text-[#ff3b30]' : 'text-neutral-500 hover:text-[#bd2925]'
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
            href={user ? "/dash" : "/login"} 
            className={`flex flex-col items-center justify-center w-14 h-12 transition-colors ${
              activeMenu === 'dash' ? 'text-[#ff3b30]' : 'text-neutral-500 hover:text-[#bd2925]'
            }`}
          >
            {user ? <LayoutDashboard className="w-4.5 h-4.5" /> : <User className="w-4.5 h-4.5" />}
            <span className="text-[8px] font-bold uppercase tracking-wider mt-1">{user ? 'Dash' : 'Sign In'}</span>
          </Link>

          <Link 
            href="/scan" 
            className={`flex flex-col items-center justify-center w-14 h-12 transition-colors ${
              activeMenu === 'scan' ? 'text-[#ff3b30]' : 'text-neutral-500 hover:text-[#bd2925]'
            }`}
          >
            <QrCode className="w-4.5 h-4.5 text-[#ff3b30]" />
            <span className="text-[8px] font-bold uppercase tracking-wider mt-1 text-[#ff3b30]">Scanner</span>
          </Link>

        </nav>
      )}

      {/* Universal Floating Feedback & Ticket Intake Drawer */}
      <FloatingFeedbackDrawer />

    </div>
  );
}
