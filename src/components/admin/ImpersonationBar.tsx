'use client';

import { useState, useTransition, useEffect } from 'react';
import { getRecentUsers, SimpleProfile } from '@/app/actions/users';
import { setImpersonationRole, setImpersonationUserId } from '@/app/actions/impersonate';
import { trackPageView, getPageStats, updatePageSEO } from '@/app/actions/analytics'; // Ensure these are exported
import { ROLES, UserRole } from '@/utils/rbac-shared';
import { Eye, X, Loader2, RefreshCw, Activity, Shield, MapPin, Globe, PenTool, Save } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminHUD({ currentRole: role }: { currentRole: any }) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'identity' | 'intel' | 'seo'>('identity');
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const pathname = usePathname();

    // Stats State
    const [stats, setStats] = useState<{
        summary: { visits: number; last_visited: string } | null;
        events: { created_at: string; event_type: string; meta: any }[] | null;
    } | null>(null);

    // SEO Form State
    const [seoForm, setSeoForm] = useState({ title: '', description: '', image_url: '' });
    const [seoLoading, setSeoLoading] = useState(false);

    // Track View on Mount
    useEffect(() => {
        if (role === 'superadmin') {
            trackPageView(pathname, window.navigator.userAgent).then(() => {
                getPageStats(pathname).then(data => {
                    if (data) setStats(data);
                });
            });
        }
    }, [pathname, role]);

    const [recentUsers, setRecentUsers] = useState<SimpleProfile[]>([]);

    useEffect(() => {
        if (isOpen) {
            getRecentUsers().then(setRecentUsers);
        }
    }, [isOpen]);

    const handleSetRole = (role: UserRole | 'clear') => {
        startTransition(async () => {
            await setImpersonationRole(role);
            router.refresh();
        });
    };

    const handleSetUserId = (userId: string) => {
        startTransition(async () => {
            await setImpersonationUserId(userId || 'clear');
            router.refresh();
        });
    };

    const handleSaveSEO = async () => {
        setSeoLoading(true);
        try {
            await updatePageSEO(pathname, seoForm);
            // Assuming setSeoOpen is meant to close the HUD or switch tab,
            // but it's not defined. Keeping the original behavior of showing an alert.
            alert('SEO Updated! Refresh to see changes.');
        } catch (e) {
            console.error(e);
            alert('Failed to save SEO'); // Keep alert for user feedback
        } finally {
            setSeoLoading(false);
        }
    };

    // Simple Permission Matcher
    const getRequiredRole = (path: string) => {
        if (path.startsWith('/admin')) return 'SUPERADMIN';
        if (path.startsWith('/dashboard')) return 'AUTHENTICATED';
        if (path.startsWith('/founder')) return 'FOUNDER';
        return 'PUBLIC';
    };

    if (!isOpen) {
        return (
            <div className="fixed bottom-4 right-4 z-50 print:hidden">
                <button
                    onClick={() => setIsOpen(true)}
                    className="bg-neutral-900 border border-white/10 text-white p-2 rounded-full shadow-lg hover:bg-neutral-800 transition-colors"
                >
                    <Eye className="w-5 h-5 text-red-500" />
                </button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 flex items-end gap-2 print:hidden animate-in slide-in-from-bottom-2 fade-in duration-300">
            <div className="bg-neutral-900/95 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl w-80 overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-3 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-bold uppercase tracking-wider text-white">Admin HUD</span>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="text-neutral-400 hover:text-white">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10">
                    <button
                        onClick={() => setActiveTab('identity')}
                        className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider ${activeTab === 'identity' ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                    >
                        Identity
                    </button>
                    <button
                        onClick={() => setActiveTab('intel')}
                        className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider ${activeTab === 'intel' ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                    >
                        Intel
                    </button>
                    <button
                        onClick={() => setActiveTab('seo')}
                        className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider ${activeTab === 'seo' ? 'bg-white/10 text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                    >
                        SEO
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 max-h-[400px] overflow-y-auto">
                    {activeTab === 'identity' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] text-neutral-500 uppercase font-bold">Role Simulation</label>
                                <div className="flex gap-2">
                                    <select
                                        value={Object.values(ROLES).includes(role as any) || role === 'public' ? role : ''}
                                        onChange={(e) => handleSetRole(e.target.value as UserRole)}
                                        className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white w-full appearance-none cursor-pointer hover:border-white/30 transition-colors"
                                    >
                                        <option value="" disabled>Select a role...</option>
                                        {Object.values(ROLES).map((r) => (
                                            <option key={r} value={r}>
                                                {r.charAt(0).toUpperCase() + r.slice(1)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button
                                disabled={isPending}
                                onClick={() => handleSetRole('clear')}
                                className="w-full px-3 py-2 text-xs font-bold rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                            >
                                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                Reset Identity
                            </button>

                            <div className="pt-4 border-t border-white/10">
                                <label className="text-[10px] text-neutral-500 uppercase font-bold mb-2 block">Impersonate User</label>
                                <div className="flex gap-2">
                                    <select
                                        className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white w-full appearance-none cursor-pointer hover:border-white/30 transition-colors"
                                        onChange={(e) => {
                                            if (e.target.value) {
                                                handleSetUserId(e.target.value);
                                            }
                                        }}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Select a user...</option>
                                        {recentUsers.map(u => (
                                            <option key={u.id} value={u.id}>
                                                {u.username || u.full_name || 'Unknown'} ({u.role || 'User'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="text-[10px] text-neutral-600 mt-1">Select logic auto-applies</div>
                                <button
                                    onClick={() => handleSetUserId('clear')}
                                    className="text-[10px] text-red-400 hover:text-red-300 underline mt-2 block"
                                >
                                    Clear User Impersonation
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'intel' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-start gap-3 p-2 bg-white/5 rounded-lg">
                                    <MapPin className="w-4 h-4 text-neutral-500 mt-1" />
                                    <div className="overflow-hidden">
                                        <div className="text-[10px] text-neutral-500 uppercase font-bold">Current Path</div>
                                        <div className="text-xs text-white break-all font-mono">{pathname}</div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-2 bg-white/5 rounded-lg">
                                    <Shield className="w-4 h-4 text-neutral-500 mt-1" />
                                    <div>
                                        <div className="text-[10px] text-neutral-500 uppercase font-bold">Required Access</div>
                                        <div className="text-xs text-indigo-400 font-bold">{getRequiredRole(pathname)}</div>
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-lg p-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Activity className="w-4 h-4 text-neutral-500" />
                                        <div className="text-[10px] text-neutral-500 uppercase font-bold">Recent Traffic</div>
                                    </div>
                                    <div className="text-xs space-y-1">
                                        <div className="flex justify-between text-neutral-400 border-b border-white/5 pb-1 mb-1">
                                            <span>Total Visits</span>
                                            <span className="text-white font-mono">{stats?.summary?.visits?.toLocaleString() || 0}</span>
                                        </div>
                                        {stats?.events?.map((e, i) => (
                                            <div key={i} className="flex justify-between text-[10px] text-neutral-500">
                                                <span>{new Date(e.created_at).toLocaleTimeString()}</span>
                                                <span className="truncate max-w-[120px]">{e.event_type}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'seo' && (
                        <div className="space-y-3">
                            <div className="text-[10px] text-neutral-500 uppercase font-bold mb-2">Override Page Metadata</div>

                            <div>
                                <label className="text-[10px] text-neutral-400 block mb-1">Title Tag</label>
                                <input
                                    type="text"
                                    value={seoForm.title} onChange={(e) => setSeoForm({ ...seoForm, title: e.target.value })}
                                    placeholder={document.title}
                                    className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] text-neutral-400 block mb-1">Description</label>
                                <textarea
                                    value={seoForm.description} onChange={(e) => setSeoForm({ ...seoForm, description: e.target.value })}
                                    rows={3}
                                    className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] text-neutral-400 block mb-1">OG Image URL</label>
                                <input
                                    type="text"
                                    value={seoForm.image_url} onChange={(e) => setSeoForm({ ...seoForm, image_url: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            <button
                                disabled={seoLoading}
                                onClick={handleSaveSEO}
                                className="w-full px-3 py-2 text-xs font-bold rounded bg-indigo-600 text-white hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 mt-2"
                            >
                                {seoLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                Save Overrides
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Status */}
                <div className="bg-neutral-950 px-4 py-1 text-[10px] text-neutral-600 border-t border-white/5 flex justify-between shrink-0">
                    <span>GridPass v1.3</span>
                    <span>{isPending ? 'Syncing...' : 'System Ready'}</span>
                </div>
            </div >
        </div >
    );
}
