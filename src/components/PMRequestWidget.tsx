'use client';

import { useState } from 'react';
import { Send, Bot, Loader2, CheckCircle2 } from 'lucide-react';
import { createPMTask } from '@/app/admin/features/actions';

export default function PMRequestWidget() {
    const [request, setRequest] = useState('');
    const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

    async function handleSend() {
        if (!request.trim()) return;
        setStatus('sending');
        try {
            await createPMTask(request);
            setStatus('sent');
            setRequest('');
            setTimeout(() => setStatus('idle'), 3000);
        } catch (e) {
            console.error(e);
            setStatus('idle');
        }
    }

    return (
        <div className="bg-neutral-900/50 border border-indigo-500/20 rounded-xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Bot className="w-24 h-24 text-indigo-500" />
            </div>

            <div className="relative z-10">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                    <Bot className="w-5 h-5 text-indigo-400" />
                    PM Hotline
                </h3>
                <p className="text-neutral-400 text-sm mb-4">
                    Direct line to the Project Manager. Assign tasks, ask for status updates, or request new features asynchronously.
                </p>

                <div className="space-y-3">
                    <textarea
                        value={request}
                        onChange={(e) => setRequest(e.target.value)}
                        placeholder="e.g. 'Audit the landing page for SEO', 'Generate a new status report'..."
                        className="w-full bg-black/50 border border-neutral-700 rounded-lg p-3 text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 text-sm h-24 resize-none"
                    />

                    <div className="flex justify-between items-center">
                        <span className="text-xs text-neutral-500">
                            {status === 'sent' ? (
                                <span className="text-green-400 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Request Queued
                                </span>
                            ) : (
                                "Est. response time: ~2 min"
                            )}
                        </span>
                        <button
                            onClick={handleSend}
                            disabled={status === 'sending' || !request.trim()}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {status === 'sending' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            {status === 'sending' ? 'Sending...' : 'Send Request'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
