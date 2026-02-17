'use client';

import { useState } from 'react';
import { updateFeedbackStatus } from '@/app/actions/feedback';
import { BadgeCheck, Archive, Eye, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

type FeedbackProps = {
    submissions: any[];
};

export default function FeedbackTable({ submissions }: FeedbackProps) {
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleStatusUpdate = async (id: string, status: 'new' | 'reviewed' | 'archived') => {
        setLoadingId(id);
        const result = await updateFeedbackStatus(id, status);

        if (result.error) {
            toast.error(result.error);
        } else {
            toast.success(`Feedback marked as ${status}`);
        }
        setLoadingId(null);
    };

    return (
        <div className="bg-neutral-900 border border-white/5 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-neutral-400">
                    <thead className="bg-neutral-950 text-neutral-200 font-medium uppercase tracking-wider text-xs border-b border-white/5">
                        <tr>
                            <th className="px-6 py-4">Type</th>
                            <th className="px-6 py-4">Title / Message</th>
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Page</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4 text-right">Status</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {submissions.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-neutral-500 italic">
                                    No feedback submissions yet.
                                </td>
                            </tr>
                        ) : (
                            submissions.map((item) => (
                                <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <span className={`
                                            inline-flex items-center px-2 py-1 rounded text-xs font-bold uppercase tracking-wide
                                            ${item.type === 'bug' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                                                item.type === 'feature' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' :
                                                    'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}
                                        `}>
                                            {item.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 max-w-xs">
                                        <div className="font-bold text-white mb-1 truncate" title={item.title || 'No Title'}>{item.title || 'No Title'}</div>
                                        <div className="text-neutral-500 line-clamp-2 text-xs">{item.message}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {item.profiles ? (
                                            <div className="flex items-center gap-2">
                                                {item.profiles.avatar_url && (
                                                    <img src={item.profiles.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                                                )}
                                                <span className="text-white">{item.profiles.full_name || item.profiles.username}</span>
                                            </div>
                                        ) : (
                                            <span className="text-neutral-600 italic">Anonymous</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 max-w-[150px] truncate">
                                        {item.page_url ? (
                                            <a href={item.page_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-indigo-400 transition-colors">
                                                <ExternalLink className="w-3 h-3" />
                                                <span className="truncate">{new URL(item.page_url).pathname}</span>
                                            </a>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`
                                            inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                                            ${item.status === 'new' ? 'bg-blue-500/10 text-blue-500' :
                                                item.status === 'reviewed' ? 'bg-amber-500/10 text-amber-500' :
                                                    'bg-neutral-500/10 text-neutral-500'}
                                        `}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {item.status !== 'reviewed' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(item.id, 'reviewed')}
                                                    disabled={loadingId === item.id}
                                                    title="Mark as Reviewed"
                                                    className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-lg transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            )}
                                            {item.status !== 'archived' && (
                                                <button
                                                    onClick={() => handleStatusUpdate(item.id, 'archived')}
                                                    disabled={loadingId === item.id}
                                                    title="Archive"
                                                    className="p-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-lg transition-colors"
                                                >
                                                    <Archive className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
