'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { updatePageSEO } from '@/app/actions/analytics';
import { Edit2, ExternalLink, Eye, Shield, Save, Loader2, X, Search } from 'lucide-react';
import Link from 'next/link';

interface PageData {
    path: string;
    title?: string;
    visits?: number;
    last_visited?: string;
    required_role?: string;
    no_index?: boolean;
    description?: string;
    image_url?: string;
}

export default function PageManagementTable({ initialData }: { initialData: PageData[] }) {
    const [pages, setPages] = useState<PageData[]>(initialData);
    const [search, setSearch] = useState('');
    const [showProfiles, setShowProfiles] = useState(false);
    const [editingPage, setEditingPage] = useState<PageData | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const filteredPages = pages.filter(p => {
        // Search Filter
        const matchesSearch = p.path.toLowerCase().includes(search.toLowerCase()) ||
            p.title?.toLowerCase().includes(search.toLowerCase());

        // Profile Filter (Default: Hide /u/ unless toggled or searched)
        const isProfile = p.path.startsWith('/u/');
        if (isProfile && !showProfiles && !search) return false;

        return matchesSearch;
    });

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPage) return;

        setIsSaving(true);
        try {
            await updatePageSEO(editingPage.path, {
                title: editingPage.title || '',
                description: editingPage.description || '',
                image_url: editingPage.image_url || '',
                required_role: editingPage.required_role,
                no_index: editingPage.no_index
            });

            // Optimistic Update (Immediate feedback)
            setPages(current => current.map(p => p.path === editingPage.path ? { ...p, ...editingPage } : p));

            setEditingPage(null);
        } catch (error) {
            console.error(error);
            alert('Failed to save changes');
        } finally {
            setIsSaving(false);
        }
    };

    // Realtime Subscription
    useEffect(() => {
        const supabase = createClient();
        const channel = supabase
            .channel('page-seo-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'page_seo'
                },
                (payload) => {
                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        const newPage = payload.new as PageData;
                        setPages((current) => {
                            const exists = current.find(p => p.path === newPage.path);
                            if (exists) {
                                return current.map(p => p.path === newPage.path ? { ...p, ...newPage } : p);
                            } else {
                                return [...current, newPage];
                            }
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const getRoleColor = (role?: string) => {
        switch (role) {
            case 'superadmin': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'admin': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            case 'founder': return 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20';
            case 'authenticated': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            default: return 'text-green-500 bg-green-500/10 border-green-500/20';
        }
    };

    return (
        <div className="bg-neutral-900/50 border border-white/5 rounded-xl overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-white/5 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search pages (e.g. /dashboard)..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-neutral-900 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                </div>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-400 hover:text-white select-none">
                        <input
                            type="checkbox"
                            checked={showProfiles}
                            onChange={(e) => setShowProfiles(e.target.checked)}
                            className="rounded bg-neutral-800 border-white/10 text-indigo-500 focus:ring-indigo-500"
                        />
                        Show User Profiles
                    </label>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-neutral-400">
                    <thead className="bg-white/5 text-neutral-300 font-bold uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3">Page / Path</th>
                            <th className="px-6 py-3">Role Access</th>
                            <th className="px-6 py-3 text-right">Visits</th>
                            <th className="px-6 py-3 text-right">Last Visit</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredPages.map((page) => (
                            <tr key={page.path} className="hover:bg-white/5 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-white mb-0.5">{page.title || 'Untitled Page'}</div>
                                    <div className="font-mono text-xs text-neutral-500 flex items-center gap-2">
                                        {page.path}
                                        <a href={page.path} target="_blank" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ExternalLink className="w-3 h-3 hover:text-indigo-400" />
                                        </a>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold border ${getRoleColor(page.required_role)}`}>
                                        {page.required_role || 'public'}
                                    </span>
                                    {page.no_index && (
                                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-neutral-800 text-neutral-500 border border-white/10">
                                            NO INDEX
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right font-mono text-white">
                                    {page.visits?.toLocaleString() || 0}
                                </td>
                                <td className="px-6 py-4 text-right text-xs">
                                    {page.last_visited ? new Date(page.last_visited).toLocaleDateString() : '--'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => setEditingPage(page)}
                                        className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editingPage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-neutral-900 border border-white/10 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-4 border-b border-white/10 bg-white/5">
                            <h3 className="font-bold text-lg text-white">Edit Page Settings</h3>
                            <button onClick={() => setEditingPage(null)} className="text-neutral-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Page Path</label>
                                <input disabled value={editingPage.path} className="w-full bg-neutral-950 border border-white/10 rounded px-3 py-2 text-neutral-500 font-mono text-sm" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Required Role</label>
                                    <select
                                        value={editingPage.required_role || 'public'}
                                        onChange={e => setEditingPage({ ...editingPage, required_role: e.target.value })}
                                        className="w-full bg-neutral-950 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none"
                                    >
                                        <option value="public">Public</option>
                                        <option value="authenticated">Authenticated</option>
                                        <option value="founder">Founder</option>
                                        <option value="admin">Admin</option>
                                        <option value="superadmin">Superadmin</option>
                                    </select>
                                </div>
                                <div className="flex items-center pt-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editingPage.no_index || false}
                                            onChange={e => setEditingPage({ ...editingPage, no_index: e.target.checked })}
                                            className="rounded bg-neutral-800 border-white/10 text-indigo-500 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-neutral-300">No Index (Hidden)</span>
                                    </label>
                                </div>
                            </div>

                            <div className="border-t border-white/10 pt-4 mt-2">
                                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">SEO Title</label>
                                <input
                                    value={editingPage.title || ''}
                                    onChange={e => setEditingPage({ ...editingPage, title: e.target.value })}
                                    className="w-full bg-neutral-950 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none"
                                    placeholder="Page Title"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">SEO Description</label>
                                <textarea
                                    value={editingPage.description || ''}
                                    onChange={e => setEditingPage({ ...editingPage, description: e.target.value })}
                                    rows={3}
                                    className="w-full bg-neutral-950 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none"
                                    placeholder="Meta description for search engines..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">OG Image URL</label>
                                <div className="flex gap-2">
                                    <input
                                        value={editingPage.image_url || ''}
                                        onChange={e => setEditingPage({ ...editingPage, image_url: e.target.value })}
                                        className="flex-1 bg-neutral-950 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none font-mono"
                                        placeholder="https://..."
                                    />
                                    {editingPage.image_url && (
                                        <div className="w-10 h-10 rounded overflow-hidden border border-white/10 bg-neutral-800 relative group">
                                            <img src={editingPage.image_url} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                <button
                                    type="button"
                                    onClick={() => setEditingPage(null)}
                                    className="px-4 py-2 rounded-lg text-sm font-bold text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-6 py-2 rounded-lg text-sm font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors flex items-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
