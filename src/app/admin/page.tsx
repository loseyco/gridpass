import Link from 'next/link';
import LiveStats from '@/components/LiveStats';
import PMRequestWidget from '@/components/PMRequestWidget';
import {
    LayoutDashboard,
    Database,
    Cpu,
    ShieldCheck,
    KanbanSquare,
    Users,
    Settings,
    Activity,
    Terminal
} from 'lucide-react';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-mono p-8 relative overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

            <div className="relative z-10 max-w-6xl mx-auto">
                <header className="mb-12 border-b border-white/10 pb-6">
                    <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
                        <ShieldCheck className="w-10 h-10 text-emerald-500" />
                        Admin Command Center
                    </h1>
                    <p className="text-neutral-400">System Status: <span className="text-emerald-500 font-bold">ONLINE</span> | User: {user.email}</p>
                </header>

                <div className="mb-8">
                    <LiveStats />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Column 1: Core Operations */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-neutral-300 border-l-4 border-indigo-500 pl-3">Platform</h2>

                        <Link href="/admin/features" className="group block bg-neutral-900/50 border border-white/10 p-6 rounded-xl hover:bg-neutral-800 transition-all hover:border-indigo-500/50">
                            <div className="flex items-center justify-between mb-4">
                                <span className="p-3 bg-indigo-500/10 rounded-lg text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                    <KanbanSquare className="w-6 h-6" />
                                </span>
                                <span className="text-xs font-bold text-neutral-500">FEATURE MGMT</span>
                            </div>
                            <h3 className="text-lg font-bold mb-2 group-hover:text-indigo-400">Feature Roadmap</h3>
                            <p className="text-sm text-neutral-400">Manage backlog, paid requests, and development priority.</p>
                        </Link>

                        <Link href="/admin/users" className="group block bg-neutral-900/50 border border-white/10 p-6 rounded-xl hover:bg-neutral-800 transition-all hover:border-blue-500/50">
                            <div className="flex items-center justify-between mb-4">
                                <span className="p-3 bg-blue-500/10 rounded-lg text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                                    <Users className="w-6 h-6" />
                                </span>
                                <span className="text-xs font-bold text-neutral-500">USER MGMT</span>
                            </div>
                            <h3 className="text-lg font-bold mb-2 group-hover:text-blue-400">User Directory</h3>
                            <p className="text-sm text-neutral-400">Manage founders, memberships, and access roles.</p>
                        </Link>
                    </div>

                    {/* Column 2: AI Operations */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-neutral-300 border-l-4 border-amber-500 pl-3">Intelligence</h2>

                        <PMRequestWidget />

                        <div className="bg-neutral-900/50 border border-white/10 p-6 rounded-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-50">
                                <Cpu className="w-24 h-24 text-neutral-800 group-hover:text-amber-500/10 transition-colors" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" />
                                    <span className="text-sm font-bold text-green-500 tracking-widest">AI WORKFORCE ACTIVE</span>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                                        <span className="text-neutral-400">Project Manager</span>
                                        <span className="text-emerald-500">Idle</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                                        <span className="text-neutral-400">SEO Expert</span>
                                        <span className="text-emerald-500">Idle</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                                        <span className="text-neutral-400">Trainer</span>
                                        <span className="text-amber-500">Training...</span>
                                    </div>
                                </div>

                                <div className="mt-6 flex gap-2">
                                    <Link href="/admin/operations" className="flex-1 bg-amber-600 hover:bg-amber-500 text-black font-bold py-2 rounded text-xs transition-colors text-center">
                                        OPEN HUD
                                    </Link>
                                    <Link href="/admin/training" className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-2 rounded text-xs transition-colors text-center border border-white/10">
                                        VIEW TRAINING
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <Link href="/admin/analytics" className="group block bg-neutral-900/50 border border-white/10 p-6 rounded-xl hover:bg-neutral-800 transition-all hover:border-purple-500/50">
                            <div className="flex items-center justify-between mb-4">
                                <span className="p-3 bg-purple-500/10 rounded-lg text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                                    <Activity className="w-6 h-6" />
                                </span>
                                <span className="text-xs font-bold text-neutral-500">ANALYTICS</span>
                            </div>
                            <h3 className="text-lg font-bold mb-2 group-hover:text-purple-400">SEO & Performance</h3>
                            <p className="text-sm text-neutral-400">Review search rankings, traffic, and system health.</p>
                        </Link>
                    </div>

                    {/* Column 3: System */}
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-neutral-300 border-l-4 border-red-500 pl-3">System Internal</h2>

                        <Link href="/admin/database" className="group block bg-neutral-900/50 border border-white/10 p-6 rounded-xl hover:bg-neutral-800 transition-all hover:border-red-500/50">
                            <div className="flex items-center justify-between mb-4">
                                <span className="p-3 bg-red-500/10 rounded-lg text-red-400 group-hover:bg-red-500 group-hover:text-white transition-colors">
                                    <Database className="w-6 h-6" />
                                </span>
                                <span className="text-xs font-bold text-neutral-500">DATABASE</span>
                            </div>
                            <h3 className="text-lg font-bold mb-2 group-hover:text-red-400">Supabase Console</h3>
                            <p className="text-sm text-neutral-400">Direct query access, migrations, and backups.</p>
                        </Link>

                        <div className="bg-neutral-900/50 border border-white/10 p-6 rounded-xl">
                            <div className="flex items-center justify-between mb-4">
                                <span className="p-3 bg-neutral-800 rounded-lg text-neutral-400">
                                    <Terminal className="w-6 h-6" />
                                </span>
                                <span className="text-xs font-bold text-neutral-500">LOGS</span>
                            </div>
                            <div className="font-mono text-xs text-neutral-500 space-y-1 h-32 overflow-y-auto mb-4 custom-scrollbar">
                                <p>&gt; System init...</p>
                                <p>&gt; Database connected [Supabase]</p>
                                <p>&gt; AI Agents: 4 online</p>
                                <p>&gt; SEO Check: PASS</p>
                                <p>&gt; User login: admin@gridpass.io</p>
                            </div>
                            <button className="w-full border border-white/10 text-neutral-400 hover:text-white hover:bg-white/5 py-2 rounded text-xs transition-colors">
                                EXPORT LOGS
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
