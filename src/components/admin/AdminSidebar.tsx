'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Shield,
    Lightbulb,
    Database,
    ArrowLeft,
    Settings,
    LogOut,
    FileText,
    ShoppingBag,
    Ticket,
    Menu,
    X,
    LineChart
} from 'lucide-react';

const MENU_ITEMS = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Pages', href: '/admin/pages', icon: FileText },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Roles', href: '/admin/roles', icon: Shield },
    { name: 'Features', href: '/admin/features', icon: Lightbulb },
    { name: 'Invites', href: '/admin/invites', icon: Ticket },
    { name: 'Classifieds', href: '/admin/classifieds', icon: ShoppingBag },
    { name: 'Analytics', href: '/admin/analytics', icon: LineChart },
    { name: 'Database', href: '/admin/database', icon: Database },
];

export default function AdminSidebar() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    return (
        <>
            {/* Mobile Header (Hamburger) */}
            <div className="md:hidden p-4 border-b border-white/5 flex items-center justify-between bg-neutral-900 sticky top-0 z-40">
                <div className="flex items-center gap-3">
                    <button onClick={() => setIsOpen(true)} className="p-2 -ml-2 text-neutral-400 hover:text-white">
                        <Menu className="w-6 h-6" />
                    </button>
                    <div className="font-bold text-lg text-white flex items-center gap-2">
                        <span className="bg-red-600 w-2 h-2 rounded-full animate-pulse"></span>
                        ADMIN
                    </div>
                </div>
            </div>

            {/* Sidebar Overlay (Mobile) */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm md:hidden animate-in fade-in"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <aside className={`
                fixed md:sticky md:top-0 h-screen w-64 bg-neutral-900 border-r border-white/5 flex flex-col z-50 transition-transform duration-300
                ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
            `}>
                {/* Close Button (Mobile) */}
                <div className="md:hidden absolute top-4 right-4">
                    <button onClick={() => setIsOpen(false)} className="p-2 text-neutral-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Header */}
                <div className="h-16 flex items-center px-6 border-b border-white/5 bg-neutral-950/50">
                    <div className="font-bold text-lg tracking-wide text-white flex items-center gap-2">
                        <span className="bg-red-600 w-2 h-2 rounded-full animate-pulse"></span>
                        ADMIN
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto custom-scrollbar">
                    {MENU_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setIsOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-white/5 space-y-2 bg-neutral-950/30">
                    <Link
                        href="/"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to GridPass
                    </Link>
                    <div className="px-4 py-2 text-xs text-neutral-600 font-mono">
                        v1.0.0 (Superadmin)
                    </div>
                </div>
            </aside>
        </>
    );
}
