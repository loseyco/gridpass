'use client';

import { useState } from 'react';
import { Zap, Loader2, CheckCircle, AlertTriangle, Image as ImageIcon, FileText, Search, User, ExternalLink } from 'lucide-react';

interface AIAutoPilotProps {
    leadId: string;
    leadName?: string;
    resumeUrl?: string | null;
}

export function AIAutoPilot({ leadId, leadName, resumeUrl }: AIAutoPilotProps) {
    const [running, setRunning] = useState(false);
    const [results, setResults] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const handleRunAutoPilot = async () => {
        setRunning(true);
        setError(null);
        setResults(null);

        try {
            const response = await fetch('/api/admin/run-ai-autopilot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadId, resumeUrl }),
            });

            if (!response.ok) throw new Error('Auto-Pilot failed');

            const data = await response.json();
            setResults(data.summary);

            // Don't auto-reload - let user review results and send report
            // They can manually refresh to see updated fields

        } catch (err) {
            console.error('Auto-Pilot failed:', err);
            setError(`Failed to run AI Auto-Pilot: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setRunning(false);
        }
    };

    const handleSendReport = async () => {
        if (!confirm('Send verification email to candidate?')) return;

        try {
            const res = await fetch('/api/admin/send-candidate-report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leadId: leadId,
                    name: leadName || 'Candidate',
                    // In a real app we'd get this from the lead data
                    email: 'test@example.com'
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.claimUrl) {
                    // For demo purposes, alert the link so the admin can test it
                    prompt("Report sent! Here is the magic link to test:", data.claimUrl);
                } else {
                    alert('Report sent!');
                }
            }
        } catch (e) {
            alert('Failed to send report');
        }
    };

    if (results) {
        return (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 mb-8 text-neutral-200">
                <h3 className="text-xl font-bold text-emerald-400 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-6 h-6" />
                    Auto-Pilot Complete
                </h3>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-black/20 p-3 rounded-lg">
                            <p className="text-xs text-neutral-400 uppercase font-bold">Data Source</p>
                            <p className="text-lg font-mono text-emerald-300">
                                {results.source || 'Resume Parsed'}
                            </p>
                        </div>
                        <div className="bg-black/20 p-3 rounded-lg">
                            <p className="text-xs text-neutral-400 uppercase font-bold">Background Check</p>
                            <p className="text-lg font-mono text-emerald-300">
                                {results.background?.confidence === 'high' ? 'Verified' : 'Completed'}
                            </p>
                        </div>
                        <div className="bg-black/20 p-3 rounded-lg flex items-center gap-3">
                            <div className="bg-emerald-500/20 p-2 rounded-full">
                                <ImageIcon className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xs text-neutral-400 uppercase font-bold">Cover Photo</p>
                                <p className="text-sm">{results.generated?.coverPhoto}</p>
                            </div>
                        </div>
                        <div className="bg-black/20 p-3 rounded-lg flex items-center gap-3">
                            <div className="bg-emerald-500/20 p-2 rounded-full">
                                <FileText className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xs text-neutral-400 uppercase font-bold">Bio</p>
                                <p className="text-sm">{results.generated?.enhancedBio === 'Yes' ? 'Enhanced' : 'Standard'}</p>
                            </div>
                        </div>
                    </div>

                    {results.remainingTasks && results.remainingTasks.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-emerald-500/20">
                            <h4 className="font-bold text-neutral-300 mb-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4 text-amber-400" />
                                Remaining Tasks
                            </h4>
                            <ul className="space-y-2">
                                {results.remainingTasks.map((task: string, i: number) => (
                                    <li key={i} className="flex items-center gap-2 text-sm text-neutral-400 bg-black/20 p-2 rounded border border-white/5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                        {task}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <p className="text-xs text-emerald-500/60 mt-2 text-center">
                        Page will refresh in 3 seconds...
                    </p>

                    <div className="mt-6 flex justify-center border-t border-emerald-500/20 pt-6">
                        <button
                            onClick={handleSendReport}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 font-medium transition-colors shadow-lg shadow-indigo-500/20"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Send Verification Report to Candidate
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const isDiscoveryMode = !resumeUrl;

    return (
        <div className={`
      relative overflow-hidden group border rounded-xl p-8 mb-8 text-center
      ${isDiscoveryMode
                ? 'bg-gradient-to-r from-blue-900/50 to-cyan-900/50 border-blue-500/30'
                : 'bg-gradient-to-r from-indigo-900/50 to-purple-900/50 border-indigo-500/30'
            }
    `}>
            <div className="absolute inset-0 bg-noise opacity-10 pointer-events-none"></div>

            {/* Glow effect */}
            <div className={`
        absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] blur-[100px] rounded-full pointer-events-none transition-all duration-700
        ${isDiscoveryMode ? 'bg-blue-500/20 group-hover:bg-blue-500/30' : 'bg-indigo-500/20 group-hover:bg-indigo-500/30'}
      `}></div>

            <div className="relative z-10">
                <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-3">
                    {isDiscoveryMode ? (
                        <Search className="w-6 h-6 text-cyan-400" />
                    ) : (
                        <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                    )}
                    {isDiscoveryMode ? 'Run AI Discovery' : 'Run AI Auto-Pilot'}
                </h2>
                <p className={`${isDiscoveryMode ? 'text-blue-200' : 'text-indigo-200'} mb-6 max-w-lg mx-auto`}>
                    {isDiscoveryMode
                        ? `No resume found for ${leadName || 'this candidate'}. AI will search the web for their profile, social presence, and professional history.`
                        : "One-click automation: Parses resume, verifies background, generates professional cover photo, enhances bio, and checks social presence."
                    }
                </p>

                <button
                    onClick={handleRunAutoPilot}
                    disabled={running}
                    className={`
                px-8 py-4 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all
                items-center justify-center inline-flex gap-3
                ${isDiscoveryMode
                            ? 'bg-white text-blue-950 hover:bg-neutral-100'
                            : 'bg-white text-indigo-950 hover:bg-neutral-100'
                        }
            `}
                >
                    {running ? (
                        <>
                            <Loader2 className="w-6 h-6 animate-spin" />
                            {isDiscoveryMode ? 'Searching Web...' : 'Running Auto-Pilot...'}
                        </>
                    ) : (
                        <>
                            {isDiscoveryMode ? <Search className="w-6 h-6" /> : <Zap className="w-6 h-6 fill-current" />}
                            {isDiscoveryMode ? 'FIND CANDIDATE' : 'START AUTO-PILOT'}
                        </>
                    )}
                </button>

                {error && (
                    <p className="mt-4 text-red-400 bg-red-950/30 inline-block px-4 py-1 rounded-lg border border-red-500/20">
                        {error}
                    </p>
                )}

                {isDiscoveryMode && (
                    <p className="mt-4 text-xs text-blue-300/60 font-medium">
                        Uses AI to scrape public data. Accuracy may vary.
                    </p>
                )}
            </div>
        </div>
    );
}
