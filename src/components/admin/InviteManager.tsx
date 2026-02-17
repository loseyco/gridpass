'use client';

import { useState, useEffect } from 'react';
import { createInvite, getInvites } from '@/app/(main)/admin/invites/actions';
import { UserRole } from '@/utils/rbac-shared';
import { Copy, Loader2, Plus, Ticket } from 'lucide-react';

export default function InviteManager() {
    const [invites, setInvites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);

    // Form State
    const [note, setNote] = useState('');
    const [role, setRole] = useState<UserRole>('founder');

    useEffect(() => {
        // Hydrate from URL
        const params = new URLSearchParams(window.location.search);
        const emailParam = params.get('email');
        const noteParam = params.get('note');

        if (emailParam) setNote(`Invite for ${emailParam}`);
        if (noteParam) setNote(noteParam);

        loadInvites();
    }, []);

    const loadInvites = async () => {
        setLoading(true);
        const data = await getInvites();
        setInvites(data);
        setLoading(false);
    };

    const handleCreate = async () => {
        setCreating(true);
        try {
            await createInvite(role, note);
            setNote('');
            loadInvites(); // Refresh list
        } catch (err) {
            alert('Failed to create invite');
        } finally {
            setCreating(false);
        }
    };

    const copyLink = (token: string) => {
        const url = `${window.location.origin}/join?token=${token}`;
        navigator.clipboard.writeText(url);
        alert('Copied to clipboard: ' + url);
    };

    return (
        <div className="space-y-6">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-amber-500" /> Generate Golden Ticket
                </h3>

                <div className="grid md:grid-cols-4 gap-4 items-end">
                    <div className="col-span-2">
                        <label className="block text-xs font-mono text-neutral-500 mb-1">NOTE (Who is this for?)</label>
                        <input
                            type="text"
                            className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-white"
                            placeholder="e.g. VIP access for Bob"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-mono text-neutral-500 mb-1">ROLE</label>
                        <select
                            className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm text-white"
                            value={role}
                            onChange={(e) => setRole(e.target.value as UserRole)}
                        >
                            <option value="founder">Founder</option>
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                            <option value="superadmin">Superadmin</option>
                        </select>
                    </div>
                    <div>
                        <button
                            onClick={handleCreate}
                            disabled={creating || !note}
                            className="w-full bg-white text-black font-bold py-2 rounded hover:bg-neutral-200 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            Create
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-neutral-900 text-neutral-500 font-mono text-xs uppercase">
                        <tr>
                            <th className="px-4 py-3">Token</th>
                            <th className="px-4 py-3">Role</th>
                            <th className="px-4 py-3">Note</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-900">
                        {invites.map((inv) => (
                            <tr key={inv.id} className="hover:bg-neutral-900/50">
                                <td className="px-4 py-3 font-mono text-neutral-400">{inv.token.slice(0, 8)}...</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase
                                        ${inv.role === 'founder' ? 'bg-amber-500/10 text-amber-500' :
                                            inv.role === 'admin' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-neutral-800 text-neutral-400'}
                                    `}>
                                        {inv.role}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-white">{inv.note || '-'}</td>
                                <td className="px-4 py-3">
                                    {inv.used_at ? (
                                        <span className="text-emerald-500 text-xs">Used by {inv.claimer?.username || 'Unknown'}</span>
                                    ) : (
                                        <span className="text-neutral-500 text-xs">Active</span>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button
                                        onClick={() => copyLink(inv.token)}
                                        className="text-neutral-400 hover:text-white p-1"
                                        title="Copy Link"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {invites.length === 0 && !loading && (
                    <div className="p-8 text-center text-neutral-500">No tickets generated yet.</div>
                )}
            </div>
        </div>
    );
}
