'use client';

import { useState, useEffect } from 'react';
import { ScrollText, Send, User, Bot, Terminal } from 'lucide-react';
import { getFeatureLogs, addFeatureLog } from '@/app/(main)/admin/features/actions';

type Log = {
    id: string;
    message: string;
    type: 'user' | 'system' | 'ai';
    created_at: string;
};

export default function FeatureLogs({ featureId }: { featureId: string }) {
    const [logs, setLogs] = useState<Log[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadLogs();
    }, [featureId]);

    async function loadLogs() {
        const data = await getFeatureLogs(featureId);
        setLogs(data as Log[]);
    }

    async function handleSend() {
        if (!newMessage.trim()) return;
        setLoading(true);
        await addFeatureLog(featureId, newMessage, 'user');
        setNewMessage('');
        await loadLogs();
        setLoading(false);
    }

    return (
        <div className="bg-neutral-950 border border-neutral-800 rounded-lg flex flex-col h-64">
            <div className="p-3 border-b border-neutral-800 flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase">
                <ScrollText className="w-3 h-3" /> Activity Log
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {logs.length === 0 ? (
                    <div className="text-center text-neutral-600 text-xs italic py-4">No activity recorded.</div>
                ) : (
                    logs.map(log => (
                        <div key={log.id} className="flex gap-2 text-xs">
                            <div className={`
                                w-5 h-5 rounded flex items-center justify-center flex-shrink-0
                                ${log.type === 'ai' ? 'bg-indigo-500/10 text-indigo-500' :
                                    log.type === 'system' ? 'bg-amber-500/10 text-amber-500' :
                                        'bg-neutral-800 text-neutral-400'}
                            `}>
                                {log.type === 'ai' ? <Bot className="w-3 h-3" /> :
                                    log.type === 'system' ? <Terminal className="w-3 h-3" /> :
                                        <User className="w-3 h-3" />}
                            </div>
                            <div>
                                <div className="text-neutral-300">{log.message}</div>
                                <div className="text-[10px] text-neutral-600 mt-0.5">
                                    {new Date(log.created_at).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-2 border-t border-neutral-800 flex gap-2">
                <input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Add a note..."
                    className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500"
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                />
                <button
                    onClick={handleSend}
                    disabled={loading}
                    className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded transition-colors"
                >
                    <Send className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
}
