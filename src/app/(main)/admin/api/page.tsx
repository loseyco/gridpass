'use client';

import { useState, useEffect } from 'react';
import {
    Terminal,
    Activity,
    Play,
    Trash2,
    RotateCw,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';

export default function ApiPlayground() {
    const [method, setMethod] = useState('GET');
    const [endpoint, setEndpoint] = useState('/api/users');
    const [body, setBody] = useState('{\n  \n}');
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<any>(null);
    const [status, setStatus] = useState<number | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    // Manual testing state (for immediate UI feedback)
    const [verifiedEndpoints, setVerifiedEndpoints] = useState<string[]>([]);
    const [failedEndpoints, setFailedEndpoints] = useState<string[]>([]);

    // State for DB-driven endpoints
    const [dbEndpoints, setDbEndpoints] = useState<any[]>([]);
    const [computedCategories, setComputedCategories] = useState<any[]>([]);

    // Regression Runner State
    const [isRunningSuite, setIsRunningSuite] = useState(false);
    const [suiteProgress, setSuiteProgress] = useState({ total: 0, current: 0 });

    // Local AI Monitor State
    const [aiStatus, setAiStatus] = useState<any>({ state: 'offline' });

    useEffect(() => {
        const poll = setInterval(async () => {
            try {
                const res = await fetch('/api/admin/ai-status');
                if (res.ok) setAiStatus(await res.json());
            } catch (e) { }
        }, 2000);
        return () => clearInterval(poll);
    }, []);

    // Fetch Registry on Mount
    useEffect(() => {
        fetchRegistry();
    }, []);

    const fetchRegistry = async () => {
        try {
            const res = await fetch('/api/admin/registry');
            if (res.ok) {
                const data = await res.json();
                setDbEndpoints(data);

                // Group by Category
                const groups: any = {};
                data.forEach((ep: any) => {
                    const cat = ep.category || 'Uncategorized';
                    if (!groups[cat]) groups[cat] = [];
                    groups[cat].push(ep);
                });

                const cats = Object.keys(groups).sort().map(name => ({
                    name,
                    endpoints: groups[name]
                }));
                setComputedCategories(cats);
            }
        } catch (e) {
            console.error("Failed to load registry", e);
        }
    };

    const categories = computedCategories;

    // Derived Stats
    const totalEndpoints = dbEndpoints.length;
    const countVerified = dbEndpoints.filter(e => e.status === 'verified' || verifiedEndpoints.includes(`${e.method} ${e.path}`)).length;
    const countFailed = dbEndpoints.filter(e => e.status === 'failed' || failedEndpoints.includes(`${e.method} ${e.path}`)).length;
    const countUntested = totalEndpoints - countVerified - countFailed;

    const log = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

    const selectEndpoint = (ep: any) => {
        setMethod(ep.method);
        setEndpoint(ep.path);
        setBody(typeof ep.default_body === 'string' ? ep.default_body : JSON.stringify(ep.default_body || {}, null, 2));
    };

    // --- Dynamic Harness Logic (Ported from Script) ---

    const inferIdNameFromPath = (path: string) => {
        const parts = path.split('/');
        const resource = parts[parts.length - 1];
        if (resource.endsWith('ies')) return resource.slice(0, -3) + 'yId';
        if (resource.endsWith('s')) return resource.slice(0, -1) + 'Id';
        return resource + 'Id';
    };

    const runRegressionSuite = async () => {
        if (isRunningSuite) return;
        setIsRunningSuite(true);
        setLogs([]); // Clear logs
        log('🚀 Starting Client-Side Regression Suite...');

        // 1. Context Init
        const context: any = { userId: 'me' };
        const executed = new Set<string>();
        let madeProgress = true;

        // Use current dbEndpoints as the source
        const registry = [...dbEndpoints];
        setSuiteProgress({ total: registry.length, current: 0 });

        while (madeProgress) {
            madeProgress = false;
            let passCount = 0;

            for (const ep of registry) {
                const key = `${ep.method} ${ep.path}`;
                if (executed.has(key)) continue;

                // Resolve Path
                let resolvedPath = ep.path;
                let missingDeps = false;
                const matches = resolvedPath.match(/\{([^}]+)\}/g);
                if (matches) {
                    for (const m of matches) {
                        const paramKey = m.slice(1, -1);
                        if (context[paramKey]) {
                            resolvedPath = resolvedPath.replace(m, context[paramKey]);
                        } else {
                            missingDeps = true;
                        }
                    }
                }

                if (missingDeps) continue;

                // Ready to execute
                log(`Testing ${ep.method} ${resolvedPath}...`);
                const start = Date.now();
                let status = 'failed';
                let responseMs = 0;

                try {
                    const opts: RequestInit = {
                        method: ep.method,
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include'
                    };

                    if (ep.method !== 'GET' && ep.method !== 'DELETE') {
                        opts.body = typeof ep.default_body === 'string' ? ep.default_body : JSON.stringify(ep.default_body || {});
                    }

                    const res = await fetch(resolvedPath, opts);
                    responseMs = Date.now() - start;

                    if (res.ok) {
                        status = 'verified';
                        setVerifiedEndpoints(prev => [...prev, key]);

                        // Extract ID
                        if (ep.method === 'POST') {
                            try {
                                const data = await res.json();
                                const id = data.id || data.data?.id;
                                if (id) {
                                    const idKey = inferIdNameFromPath(ep.path);
                                    context[idKey] = id;
                                    log(`   Captured ${idKey}: ${id}`);
                                }
                            } catch (e) { }
                        }
                    } else {
                        setFailedEndpoints(prev => [...prev, key]);
                    }
                } catch (e: any) {
                    log(`🔥 Error: ${e.message}`);
                    setFailedEndpoints(prev => [...prev, key]);
                }

                // Report to DB (Background)
                await fetch('/api/admin/registry/status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        method: ep.method,
                        path: ep.path,
                        status,
                        response_ms: responseMs
                    })
                });

                executed.add(key);
                madeProgress = true;
                passCount++;
                setSuiteProgress(prev => ({ ...prev, current: executed.size }));

                // Small delay to allow UI to update
                await new Promise(r => setTimeout(r, 50));
            }
        }

        log(`🏁 Suite Complete. Executed ${executed.size} / ${registry.length}`);
        setIsRunningSuite(false);
        // Refresh registry to sync final state
        fetchRegistry();
    };


    const executeRequest = async () => {
        setLoading(true);
        setResponse(null);
        setStatus(null);
        const key = `${method} ${endpoint}`;
        log(`🚀 ${method} ${endpoint}`);

        try {
            const options: RequestInit = {
                method,
                headers: { 'Content-Type': 'application/json' }
            };

            if (method !== 'GET' && method !== 'HEAD') {
                options.body = body;
            }

            // Critical: Include credentials (cookies) to maintain Auth session
            options.credentials = 'include';

            const res = await fetch(endpoint, options);
            setStatus(res.status);

            const data = await res.json();
            setResponse(data);

            if (res.ok) {
                log(`✅ ${res.status} OK`);
                setFailedEndpoints(prev => prev.filter(k => k !== key));
                if (!verifiedEndpoints.includes(key)) {
                    setVerifiedEndpoints(prev => [...prev, key]);
                }
            } else {
                log(`❌ ${res.status} ${res.statusText}`);
                setVerifiedEndpoints(prev => prev.filter(k => k !== key));
                if (!failedEndpoints.includes(key)) {
                    setFailedEndpoints(prev => [...prev, key]);
                }
            }

            // Also update DB for single manual tests
            await fetch('/api/admin/registry/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    method,
                    path: endpoint,
                    status: res.ok ? 'verified' : 'failed',
                    response_ms: 0
                })
            });

        } catch (error: any) {
            log(`🔥 Network Error: ${error.message}`);
            setResponse({ error: error.message });
            setVerifiedEndpoints(prev => prev.filter(k => k !== key));
            if (!failedEndpoints.includes(key)) {
                setFailedEndpoints(prev => [...prev, key]);
            }
        }
        setLoading(false);
    };

    return (
        <div className="flex h-screen bg-neutral-950 text-white font-mono overscroll-none overflow-hidden">

            {/* Sidebar */}
            <div className="w-80 border-r border-white/5 flex flex-col bg-neutral-900/50">
                <div className="p-4 border-b border-white/5 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <h1 className="font-bold flex items-center gap-2">
                            <Terminal className="w-5 h-5 text-indigo-500" />
                            GridPass API
                        </h1>
                        <button
                            onClick={fetchRegistry}
                            className="text-neutral-500 hover:text-white transition-colors"
                            title="Refresh Registry"
                        >
                            <RotateCw className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Status Dashboard */}
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-bold uppercase tracking-wider">
                        <div className="bg-emerald-500/10 p-2 rounded border border-emerald-500/20 text-center">
                            <div className="text-emerald-400 text-lg">{countVerified}</div>
                            <div className="text-emerald-600">Verified</div>
                        </div>
                        <div className="bg-orange-500/10 p-2 rounded border border-orange-500/20 text-center">
                            <div className="text-orange-400 text-lg">{countUntested}</div>
                            <div className="text-orange-600">Untested</div>
                        </div>
                        <div className="bg-red-500/10 p-2 rounded border border-red-500/20 text-center">
                            <div className="text-red-400 text-lg">{countFailed}</div>
                            <div className="text-red-600">Failed</div>
                        </div>
                    </div>

                    {/* Local AI Monitor */}
                    <div className="mt-4 p-3 bg-neutral-950 rounded border border-white/10 relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 p-1`}>
                            <div className={`w-2 h-2 rounded-full ${aiStatus.state === 'active' ? 'bg-green-500 animate-ping' : 'bg-neutral-700'}`}></div>
                        </div>
                        <div className="text-[10px] font-bold text-neutral-500 uppercase flex items-center gap-2 mb-1">
                            <Activity className="w-3 h-3" />
                            Neural Monitor
                        </div>

                        <div className="font-mono text-xs text-indigo-400 truncate">
                            {aiStatus.stage || 'Idle'}
                        </div>
                        {aiStatus.target && (
                            <div className="text-[10px] text-neutral-600 truncate mt-0.5">
                                {aiStatus.target}
                            </div>
                        )}

                        {aiStatus.hasPlan && (
                            <div className="mt-2 bg-emerald-900/30 border border-emerald-500/30 p-2 rounded text-emerald-400 text-[10px] font-bold animate-pulse">
                                REPAIR PLAN READY
                            </div>
                        )}
                    </div>

                    {/* Test All Button */}
                    <button
                        onClick={runRegressionSuite}
                        disabled={isRunningSuite}
                        className={`w-full py-2 rounded text-xs font-bold uppercase tracking-widest transition-all
                            ${isRunningSuite ? 'bg-indigo-600/50 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-500'}
                        `}
                    >
                        {isRunningSuite ? `Testing... (${suiteProgress.current}/${suiteProgress.total})` : 'Run Full Suite'}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-6">
                    {categories.map((cat) => (
                        <div key={cat.name}>
                            <div className="px-3 text-xs text-neutral-500 uppercase tracking-widest font-bold mb-2">
                                {cat.name}
                            </div>
                            <div className="space-y-0.5">
                                {cat.endpoints.map((ep: any) => {
                                    // Normalize path comparison
                                    const key = `${ep.method} ${ep.path}`;
                                    // Prioritize local test state (instant feedback) over DB state
                                    const locallyVerified = verifiedEndpoints.includes(key);
                                    const locallyFailed = failedEndpoints.includes(key);

                                    const isVerified = locallyVerified || (!locallyFailed && ep.status === 'verified');
                                    const isFailed = locallyFailed || (!locallyVerified && ep.status === 'failed');

                                    const isActive = method === ep.method && endpoint === ep.path;

                                    return (
                                        <button
                                            key={`${ep.method}-${ep.path}`}
                                            onClick={() => selectEndpoint(ep)}
                                            className={`w-full text-left px-3 py-2 rounded text-sm flex items-center justify-between group transition-colors
                                                ${isActive ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-neutral-400'}
                                            `}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold text-xs w-8 ${ep.method === 'GET' ? 'text-emerald-400' :
                                                    ep.method === 'POST' ? 'text-yellow-400' :
                                                        ep.method === 'PUT' ? 'text-blue-400' : 'text-red-400'
                                                    }`}>{ep.method}</span>
                                                <span className="truncate max-w-[160px]" title={ep.desc}>{ep.path}</span>
                                            </div>
                                            {isVerified ? (
                                                <CheckCircle className="w-3 h-3 text-emerald-500" />
                                            ) : isFailed ? (
                                                <XCircle className="w-3 h-3 text-red-500" />
                                            ) : (
                                                <div className="w-2 h-2 rounded-full bg-orange-500/50" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Request Builder */}
            <div className="flex-1 flex flex-col">

                {/* Request Bar */}
                <div className="p-4 border-b border-white/5 bg-neutral-900">
                    <div className="flex gap-2">
                        <select
                            value={method}
                            onChange={e => setMethod(e.target.value)}
                            className="bg-neutral-950 border border-white/10 rounded px-3 py-2 font-bold focus:outline-none focus:border-indigo-500"
                        >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                        </select>
                        <input
                            type="text"
                            value={endpoint}
                            onChange={e => setEndpoint(e.target.value)}
                            className="flex-1 bg-neutral-950 border border-white/10 rounded px-3 py-2 focus:outline-none focus:border-indigo-500 font-mono"
                        />
                        <button
                            onClick={executeRequest}
                            disabled={loading}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded font-bold flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Play className="w-4 h-4 fill-white" />}
                            Send
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">

                    {/* Request Body Editor */}
                    <div className="w-1/2 flex flex-col border-r border-white/5">
                        <div className="p-2 text-xs font-bold text-neutral-500 uppercase bg-neutral-900/30 border-b border-white/5 flex justify-between items-center">
                            <span>Request Body (JSON)</span>
                            <button onClick={() => setBody('{\n  \n}')} className="hover:text-white"><Trash2 className="w-3 h-3" /></button>
                        </div>
                        <textarea
                            value={body}
                            onChange={e => setBody(e.target.value)}
                            className="flex-1 bg-neutral-950 p-4 resize-none focus:outline-none text-sm text-neutral-300 font-mono leading-relaxed"
                            spellCheck={false}
                        />
                    </div>

                    {/* Response Viewer */}
                    <div className="w-1/2 flex flex-col bg-neutral-900/20">
                        <div className="p-2 text-xs font-bold text-neutral-500 uppercase bg-neutral-900/30 border-b border-white/5 flex justify-between items-center">
                            <span>Response</span>
                            {status && (
                                <span className={`px-2 py-0.5 rounded text-[10px] ${status >= 200 && status < 300 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                    {status}
                                </span>
                            )}
                        </div>
                        <div className="flex-1 overflow-auto p-4">
                            {response ? (
                                <pre className="text-xs text-emerald-300 whitespace-pre-wrap break-all font-mono">
                                    {JSON.stringify(response, null, 2)}
                                </pre>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-neutral-600 gap-2">
                                    <Activity className="w-8 h-8 opacity-20" />
                                    <p className="text-xs">No response yet</p>
                                </div>
                            )}
                        </div>
                        {/* Mini Log */}
                        <div className="h-48 border-t border-white/5 bg-neutral-950 p-2 overflow-y-auto font-mono text-[10px]">
                            {logs.map((l, i) => (
                                <div key={i} className="text-neutral-500 border-l-2 border-white/10 pl-2 mb-1 hover:text-white transition-colors">{l}</div>
                            ))}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
