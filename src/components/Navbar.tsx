'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ArrowRight, User } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { UserRole } from '@/utils/rbac-shared';
import NotificationBadge from './NotificationBadge';

export default function Navbar({ effectiveRole }: { effectiveRole?: UserRole | 'public' | null }) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    // Use effectiveRole as the primary source of UI truth if provided
    // If effectiveRole is 'public' (from impersonation), we treat as logged out.
    // Otherwise check for actual user session if effectiveRole is undefined (initial load fallback)
    const [user, setUser] = useState<any>(null);
    const supabase = createClient();

    const isEffectiveAuth = effectiveRole && effectiveRole !== 'public';
    const isAdmin = effectiveRole === 'superadmin' || effectiveRole === 'admin';

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        checkUser();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Combine real auth state with role override
    // If effectiveRole is 'public', force logged out UI
    // If effectiveRole is present (other than public), force logged in UI regardless of client auth delay
    // Fallback to client 'user' state if no effectiveRole passed (shouldn't happen with new layout)
    const showLoggedIn = (effectiveRole && effectiveRole !== 'public') || (!effectiveRole && user);

    return (
        <nav className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-md border-b border-white/5">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between h-16">

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-2xl font-black italic uppercase tracking-tighter text-white">
                            Grid<span className="text-red-600">Pass</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link href="/members" className="text-neutral-400 hover:text-white transition-colors text-sm font-medium">
                            Members Directory
                        </Link>
                        {/* <Link href="/matchmaking" className="text-neutral-400 hover:text-white transition-colors text-sm font-medium">
                            Arrive & Drive
                        </Link> */}
                        <Link href="/network" className="text-neutral-400 hover:text-white transition-colors text-sm font-medium">
                            Network
                        </Link>
                        {!showLoggedIn && (
                            <Link href="/resume-builder" className="text-neutral-400 hover:text-white transition-colors text-sm font-medium">
                                Resume Builder
                            </Link>
                        )}
                        <Link href="/founder" className="text-amber-500 hover:text-amber-400 transition-colors text-sm font-bold uppercase tracking-wide">
                            Founding 100
                        </Link>
                        <Link href="/features" className="text-neutral-400 hover:text-white transition-colors text-sm font-medium">
                            Features
                        </Link>
                        {/* <Link href="/changelog" className="text-neutral-400 hover:text-white transition-colors text-sm font-medium">
                            Changelog
                        </Link> */}


                        {showLoggedIn ? (
                            <div className="flex items-center gap-4">
                                {isAdmin && (
                                    <Link href="/admin" className="text-red-500 hover:text-red-400 font-bold uppercase tracking-wider text-xs border border-red-500/20 bg-red-500/10 px-2 py-1 rounded transition-colors">
                                        Admin
                                    </Link>
                                )}
                                {!pathname?.startsWith('/dashboard') && (
                                    <Link href="/dashboard" className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg transition-colors border border-white/10 relative">
                                        <User className="w-4 h-4" />
                                        <span>Dashboard</span>
                                        <NotificationBadge />
                                    </Link>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link href="/login" className="text-neutral-400 hover:text-white transition-colors text-sm font-medium">
                                    Login
                                </Link>
                                <Link href="/register" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors">
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-neutral-400 hover:text-white"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {
                isOpen && (
                    <div className="md:hidden bg-neutral-950 border-b border-white/5 animate-fade-in absolute w-full left-0 top-16 shadow-2xl">
                        <div className="flex flex-col p-4 space-y-4">
                            <Link
                                href="/members"
                                className="text-neutral-300 hover:text-white py-2 block"
                                onClick={() => setIsOpen(false)}
                            >
                                Members Directory
                            </Link>
                            {/* <Link
                                href="/matchmaking"
                                className="text-neutral-300 hover:text-white py-2 block"
                                onClick={() => setIsOpen(false)}
                            >
                                Arrive & Drive
                            </Link> */}
                            <Link
                                href="/network"
                                className="text-neutral-300 hover:text-white py-2 block"
                                onClick={() => setIsOpen(false)}
                            >
                                Network
                            </Link>
                            {!showLoggedIn && (
                                <Link
                                    href="/resume-builder"
                                    className="text-neutral-300 hover:text-white py-2 block"
                                    onClick={() => setIsOpen(false)}
                                >
                                    Resume Builder
                                </Link>
                            )}
                            <Link
                                href="/founder"
                                className="text-amber-500 font-bold uppercase tracking-widest py-2 block"
                                onClick={() => setIsOpen(false)}
                            >
                                Founding 100
                            </Link>
                            <Link
                                href="/features"
                                className="text-neutral-300 hover:text-white py-2 block"
                                onClick={() => setIsOpen(false)}
                            >
                                Features
                            </Link>
                            {/* <Link
                                href="/changelog"
                                className="text-neutral-300 hover:text-white py-2 block"
                                onClick={() => setIsOpen(false)}
                            >
                                Changelog
                            </Link> */}

                            <div className="h-px bg-white/10 my-2"></div>

                            {showLoggedIn ? (
                                <>
                                    {isAdmin && (
                                        <Link
                                            href="/admin"
                                            className="text-center text-red-500 font-bold uppercase tracking-widest py-2 block border border-red-500/20 bg-red-500/5 rounded-lg mb-2"
                                            onClick={() => setIsOpen(false)}
                                        >
                                            Admin Command
                                        </Link>
                                    )}
                                    <Link
                                        href="/dashboard"
                                        className="flex items-center justify-center gap-2 bg-neutral-800 text-white p-3 rounded-lg font-bold relative"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <User className="w-5 h-5" />
                                        Go to Dashboard
                                        <NotificationBadge />
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="text-center text-neutral-300 hover:text-white py-2 block"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Log In
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="text-center bg-indigo-600 text-white p-3 rounded-lg font-bold block"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Get Started
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )
            }
        </nav >
    );
}
