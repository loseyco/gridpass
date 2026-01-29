import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard,
    User,
    Settings,
    LogOut,
    Shield,
    Trophy,
    Home
} from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    // Check Auth
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
        redirect('/login');
    }

    // Check Founder Status
    const { data: roles } = await supabase
        .from('gp_roles')
        .select('*')
        .eq('user_id', user.id)
        .eq('role_type', 'Founder')
        .single();

    const isFounder = !!roles;

    return (
        <div className="flex min-h-screen bg-neutral-950 text-white font-sans">
            {/* Sidebar */}
            <aside className="w-64 border-r border-white/5 bg-neutral-900/50 hidden md:flex flex-col">
                <div className="p-6 border-b border-white/5">
                    <Link href="/" className="font-bold text-xl tracking-tighter flex items-center gap-2">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                            <span className="font-bold text-lg">G</span>
                        </div>
                        GridPass
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                        <LayoutDashboard className="w-5 h-5" />
                        Dashboard
                    </Link>
                    <Link href="/dashboard/profile" className="flex items-center gap-3 px-4 py-3 text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                        <User className="w-5 h-5" />
                        My Profile
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
                        <LogoutButton />
                    </div>
                </nav>

                <div className="p-4 border-t border-white/5">
                    <div className="flex items-center gap-3 px-4 py-3 text-neutral-500 text-sm">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        Systems Online
                    </div>
                    {/* User Mini Profile */}
                    <div className="mt-2 text-xs text-neutral-600 px-4 truncate">
                        {user.email}
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                {/* Mobile Header (Simplified) */}
                <div className="md:hidden p-4 border-b border-white/5 flex items-center justify-between bg-neutral-900">
                    <div className="font-bold">GridPass</div>
                    <Link href="/dashboard/profile" className="p-2 bg-neutral-800 rounded">
                        <User className="w-5 h-5" />
                    </Link>
                </div>

                <div className="p-8 max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
