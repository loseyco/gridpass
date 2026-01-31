'use client';

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
    ShoppingBag
} from 'lucide-react';

const MENU_ITEMS = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Pages', href: '/admin/pages', icon: FileText },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Roles', href: '/admin/roles', icon: Shield },
    { name: 'Features', href: '/admin/features', icon: Lightbulb },
    { name: 'Classifieds', href: '/admin/classifieds', icon: ShoppingBag },
    { name: 'Database', href: '/admin/database', icon: Database },
];

export default function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 bg-neutral-900 border-r border-white/5 min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-40">
            {/* Header */}
            <div className="h-16 flex items-center px-6 border-b border-white/5">
                <div className="font-bold text-lg tracking-wide text-white flex items-center gap-2">
                    <span className="bg-red-600 w-2 h-2 rounded-full animate-pulse"></span>
                    ADMIN
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-6 px-3 space-y-1">
                {MENU_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
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
            <div className="p-4 border-t border-white/5 space-y-2">
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
    );
}
