'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    User,
    Settings,
    LogOut,
    Shield,
    Trophy,
    Home,
    Inbox,
    Star,
    Menu,
    X,
    MoreVertical
} from 'lucide-react';
import NotificationBadge from '@/components/NotificationBadge';
import LogoutButton from '@/components/LogoutButton';

interface SidebarProps {
    userEmail: string | undefined;
    isFounder: boolean;
}

export default function DashboardSidebar({ userEmail, isFounder }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === '/dashboard' && pathname === '/dashboard') return true;
        if (path !== '/dashboard' && pathname?.startsWith(path)) return true;
        return false;
    };

    const linkClass = (path: string) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive(path)
            ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20'
            : 'text-neutral-400 hover:text-white hover:bg-white/5'
        }`;

    return (
        <>
            {/* Mobile Header (Replaces the one in layout) */}
            <div className="md:hidden p-4 border-b border-white/5 flex items-center justify-between bg-neutral-900 sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsOpen(true)} className="p-2 -ml-2 text-neutral-400 hover:text-white">
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="font-bold text-lg">GridPass</div>
                </div>
                <Link href="/dashboard/profile" className="p-2 bg-neutral-800 rounded-full">
                    <User className="w-5 h-5" />
                </Link>
            </div>

            {/* Sidebar Overlay (Mobile) */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden animate-in fade-in"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Content */}
            <aside className={`
                fixed md:sticky md:top-0 h-screen w-72 bg-neutral-900 border-r border-white/5 flex flex-col z-50 transition-transform duration-300
                ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
                md:w-64 md:border-r md:bg-neutral-900/50
            `}>
                {/* Close Button (Mobile) */}
                <div className="md:hidden absolute top-4 right-4">
                    <button onClick={() => setIsOpen(false)} className="p-2 text-neutral-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 border-b border-white/5">
                    <Link href="/" className="font-bold text-xl tracking-tighter flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <span className="font-bold text-lg text-white">G</span>
                        </div>
                        <span className="text-white">GridPass</span>
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
                    <Link href="/dashboard" className={linkClass('/dashboard')} onClick={() => setIsOpen(false)}>
                        <LayoutDashboard className="w-5 h-5" />
                        Dashboard
                    </Link>
                    <Link href="/dashboard/profile" className={linkClass('/dashboard/profile')} onClick={() => setIsOpen(false)}>
                        <User className="w-5 h-5" />
                        My Profile
                    </Link>
                    <Link href="/dashboard/recommendations" className={`${linkClass('/dashboard/recommendations')} relative group`} onClick={() => setIsOpen(false)}>
                        <Star className="w-5 h-5" />
                        Recommendations
                        <NotificationBadge />
                    </Link>
                    <Link href="/dashboard/messages" className={linkClass('/dashboard/messages')} onClick={() => setIsOpen(false)}>
                        <Inbox className="w-5 h-5" />
                        Messages
                    </Link>

                    {/* Founder Exclusive Section */}
                    {isFounder && (
                        <div className="mt-8 pt-4 border-t border-white/5">
                            <div className="px-4 text-xs font-bold text-amber-500 uppercase tracking-widest mb-2">Founder Access</div>
                            <Link href="#" className="flex items-center gap-3 px-4 py-3 text-amber-200/80 hover:text-amber-100 hover:bg-amber-500/10 rounded-lg transition-colors">
                                <Shield className="w-5 h-5" />
                                Advisory Council
                            </Link>
                        </div>
                    )}

                    <div className="mt-8 pt-4 border-t border-white/5">
                        {/* We need to wrap LogoutButton since it might not be styled fully for sidebar or might need onclick close? 
                             Actually LogoutButton is likely a client component that handles logout. 
                         */}
                        <div onClick={() => setIsOpen(false)}>
                            <LogoutButton />
                        </div>
                    </div>
                </nav>

                <div className="p-4 border-t border-white/5 bg-neutral-950/30">
                    <div className="flex items-center gap-3 px-4 py-3 text-neutral-500 text-sm">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        Systems Online
                    </div>
                    {/* User Mini Profile */}
                    <div className="mt-2 text-xs text-neutral-600 px-4 truncate font-mono">
                        {userEmail}
                    </div>
                </div>
            </aside>
        </>
    );
}
