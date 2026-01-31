'use client';

import { useState, useTransition, useEffect } from 'react';
import { setImpersonationRole } from '@/app/actions/impersonate';
import { trackPageView, getPageStats, updatePageSEO } from '@/app/actions/analytics'; // Ensure these are exported
import { ROLES, UserRole } from '@/utils/rbac-shared';
import { Eye, X, Loader2, RefreshCw, Activity, Shield, MapPin, Globe, PenTool, Save } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

export default function AdminHUD({ currentRole }: { currentRole: string }) {
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
        if (currentRole === 'superadmin') {
            trackPageView(pathname, window.navigator.userAgent).then(() => {
                getPageStats(pathname).then(data => {
                    if (data) setStats(data);
                });
            });
        }
    }, [pathname, currentRole]);

    const handleSetRole = (role: UserRole | 'clear') => {
        startTransition(async () => {
            await setImpersonationRole(role);
            router.refresh();
        });
    };

    const handleSaveSEO = async () => {
        setSeoLoading(true);
        try {
            await updatePageSEO(pathname, seoForm);
            alert('SEO Updated! Refresh to see changes.');
        } catch (e) {
            alert('Failed to save SEO');
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
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 right-4 z-50 bg-red-600/90 text-white p-3 rounded-full shadow-lg hover:bg-red-500 transition-all border border-white/10 group"
                title="Open Admin HUD"
            >
                <Eye className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl w-80 animate-in slide-in-from-bottom-4 fade-in duration-200 overflow-hidden flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/20 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                        God Mode
                    </h3>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setActiveTab('identity')} className={`p-1 rounded hover:bg-white/10 ${activeTab === 'identity' ? 'text-white' : 'text-neutral-500'}`} title="Identity">
                        <Shield className="w-4 h-4" />
                    </button>
                    <button onClick={() => setActiveTab('intel')} className={`p-1 rounded hover:bg-white/10 ${activeTab === 'intel' ? 'text-white' : 'text-neutral-500'}`} title="Intel">
                        <Activity className="w-4 h-4" />
                    </button>
                    <button onClick={() => setActiveTab('seo')} className={`p-1 rounded hover:bg-white/10 ${activeTab === 'seo' ? 'text-white' : 'text-neutral-500'}`} title="SEO">
                        <Globe className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-white/10 mx-1"></div>
                    <button onClick={() => setIsOpen(false)} className="text-neutral-500 hover:text-white transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="p-4 overflow-y-auto">
                {activeTab === 'identity' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-neutral-500">Effective Role</span>
                            <span className={`px-2 py-0.5 rounded font-bold uppercase ${currentRole === 'superadmin' ? 'bg-red-500/20 text-red-500' : 'bg-yellow-500/20 text-yellow-500'}`}>
                                {currentRole}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.values(ROLES).map((role) => (
                                <button
                                    key={role}
                                    disabled={isPending}
                                    onClick={() => handleSetRole(role)}
                                    className={`px-3 py-2 text-xs font-bold rounded border transition-all ${currentRole === role ? 'bg-white text-black border-white' : 'bg-neutral-800 text-neutral-400 border-white/5 hover:border-white/20 hover:text-white'}`}
                                >
                                    {role.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        <button
                            disabled={isPending}
                            onClick={() => handleSetRole('clear')}
                            className="w-full px-3 py-2 text-xs font-bold rounded bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                            Reset Identity
                        </button>
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
        </div>
    );
}
