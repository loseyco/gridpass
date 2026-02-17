'use client';

import { Trash2, ToggleLeft, ToggleRight, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SourceList({ sources }: { sources: any[] }) {
    const router = useRouter();
    const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

    const toggleSource = async (id: string, currentStatus: boolean) => {
        setLoadingIds(prev => new Set(prev).add(id));
        try {
            await fetch('/api/news/sources', {
                method: 'PATCH',
                body: JSON.stringify({ id, enabled: !currentStatus }),
                headers: { 'Content-Type': 'application/json' },
            });
            router.refresh();
        } finally {
            setLoadingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const deleteSource = async (id: string) => {
        if (!confirm('Are you sure? This will stop pulling news from this source.')) return;
        setLoadingIds(prev => new Set(prev).add(id));
        try {
            await fetch(`/api/news/sources?id=${id}`, {
                method: 'DELETE',
            });
            router.refresh();
        } finally {
            setLoadingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    if (!sources || sources.length === 0) {
        return <div className="text-center py-8 text-zinc-500 italic">No sources configured. Add one to get started.</div>;
    }

    return (
        <div className="space-y-2 mt-4">
            {sources.map((source) => (
                <div key={source.id} className="flex items-center justify-between p-4 bg-zinc-800/30 rounded border border-white/5 hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => toggleSource(source.id, source.enabled)}
                            className="text-zinc-400 hover:text-white transition-colors"
                            disabled={loadingIds.has(source.id)}
                        >
                            {source.enabled ? <ToggleRight className="w-6 h-6 text-green-500" /> : <ToggleLeft className="w-6 h-6 text-zinc-600" />}
                        </button>
                        <div>
                            <div className="font-bold text-sm text-zinc-200">{source.name}</div>
                            <a href={source.url} target="_blank" className="text-xs text-zinc-500 hover:text-blue-400 flex items-center gap-1">
                                {source.url} <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-zinc-500">
                        <span className="hidden md:inline">
                            Last Scraped: {source.last_scraped_at ? new Date(source.last_scraped_at).toLocaleString() : 'Never'}
                        </span>
                        <button
                            onClick={() => deleteSource(source.id)}
                            className="p-2 hover:bg-red-500/10 hover:text-red-500 rounded transition-colors"
                            disabled={loadingIds.has(source.id)}
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}
