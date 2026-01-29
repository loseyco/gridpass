'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, ArrowRight, User } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const supabase = createClient();

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

    return (
        <nav className="sticky top-0 z-50 bg-neutral-950/80 backdrop-blur-md border-b border-white/5">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex items-center justify-between h-16">

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <img src="/logo-text.png" alt="GridPass" className="h-8 w-auto px-2 bg-white/5 rounded-lg border border-white/5" />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link href="/members" className="text-neutral-400 hover:text-white transition-colors text-sm font-medium">
                            Members Directory
                        </Link>
                        <Link href="/founder" className="text-amber-500 hover:text-amber-400 transition-colors text-sm font-bold uppercase tracking-wide">
                            Founding 50
                        </Link>

                        {user ? (
                            <Link href="/dashboard" className="flex items-center gap-2 bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg transition-colors border border-white/10">
                                <User className="w-4 h-4" />
                                <span>Dashboard</span>
                            </Link>
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
            {isOpen && (
                <div className="md:hidden bg-neutral-950 border-b border-white/5 animate-fade-in absolute w-full left-0 top-16 shadow-2xl">
                    <div className="flex flex-col p-4 space-y-4">
                        <Link
                            href="/members"
                            className="text-neutral-300 hover:text-white py-2 block"
                            onClick={() => setIsOpen(false)}
                        >
                            Members Directory
                        </Link>
                        <Link
                            href="/founder"
                            className="text-amber-500 font-bold uppercase tracking-widest py-2 block"
                            onClick={() => setIsOpen(false)}
                        >
                            Founding 50
                        </Link>

                        <div className="h-px bg-white/10 my-2"></div>

                        {user ? (
                            <Link
                                href="/dashboard"
                                className="flex items-center justify-center gap-2 bg-neutral-800 text-white p-3 rounded-lg font-bold"
                                onClick={() => setIsOpen(false)}
                            >
                                <User className="w-5 h-5" />
                                Go to Dashboard
                            </Link>
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
            )}
        </nav>
    );
}
