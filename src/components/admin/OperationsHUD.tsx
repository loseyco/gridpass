'use client';

import { useEffect, useState, useRef } from 'react';
import { Terminal, Activity, Server, Clock, MessageSquare, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming global utils

type AgentState = 'thinking' | 'active' | 'success' | 'error' | 'idle';

interface AgentData {
    state: AgentState;
    updatedAt: string;
    log: string; // fallback
    logs?: string[]; // detailed logs
}

interface SystemData {
    cpu: string;
    ram: string;
    agencies?: Record<string, AgentData>;
}

interface TaskData {
    active?: { request: string };
    queue?: { request: string }[];
    lastCompleted?: { request: string, response: string };
}

export default function OperationsHUD() {
    const [system, setSystem] = useState<SystemData>({ cpu: '--', ram: '--' });
    const [tasks, setTasks] = useState<TaskData>({});
    const [isConnected, setIsConnected] = useState(false);
    const [input, setInput] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Polling
    useEffect(() => {
        const poll = async () => {
            try {
                // 1. Fetch System & Agents
                const statusRes = await fetch('http://localhost:3005/api/status');
                if (statusRes.ok) {
                    const statusData = await statusRes.json();
                    // Merge cpu/ram from a separate call usually, but let's check if our server provides it in status?
                    // renderer.js separated /api/system and /api/status. Let's do both.

                    const systemRes = await fetch('http://localhost:3005/api/system');
                    const systemData = await systemRes.json();

                    setSystem({ ...systemData, agencies: statusData.agencies });
                    setIsConnected(true);
                } else {
                    setIsConnected(false);
                }

                // 2. Fetch Tasks
                const tasksRes = await fetch('http://localhost:3005/api/tasks');
                if (tasksRes.ok) {
                    setTasks(await tasksRes.json());
                }

            } catch (e) {
                setIsConnected(false);
            }
        };

        const interval = setInterval(poll, 1000);
        poll(); // Initial
        return () => clearInterval(interval);
    }, []);

    const sendCommand = async () => {
        if (!input.trim() || isSending) return;
        setIsSending(true);
        try {
            await fetch('http://localhost:3005/api/pm', {
                method: 'POST',
                body: JSON.stringify({ request: input })
            });
            setInput('');
        } catch (e) {
            alert('Failed to send command to Local Client');
        }
        setIsSending(false);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] bg-black text-green-500 font-mono p-4 rounded-lg border border-green-900 overflow-hidden shadow-2xl">

            {/* Header */}
            <div className="flex justify-between items-center mb-4 border-b border-green-900 pb-2">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Terminal className="w-5 h-5" /> GRIDPASS LINK v2.1
                </h2>
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                        <Server className="w-3 h-3" />
                        <span>CPU: {system.cpu}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Activity className="w-3 h-3" />
                        <span>RAM: {system.ram}</span>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_10px_#10b981]' : 'bg-red-900'}`} />
                </div>
            </div>

            {/* Connection Warning */}
            {!isConnected && (
                <div className="bg-red-900/20 border border-red-900 text-red-400 p-4 mb-4 rounded flex items-center justify-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>Local Client Disconnected. Run <code>npm run link</code> in your terminal.</span>
                </div>
            )}

            {/* Input Console */}
            <div className="flex gap-2 mb-4">
                <div className="flex-1 bg-gray-900 border border-green-900 rounded flex items-center px-3">
                    <span className="text-green-700 mr-2">$</span>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && sendCommand()}
                        placeholder="Command Project Manager AI..."
                        className="bg-transparent border-none outline-none flex-1 text-white placeholder-green-800"
                        disabled={!isConnected}
                    />
                </div>
                <button
                    onClick={sendCommand}
                    disabled={!isConnected || isSending}
                    className="bg-green-900/30 border border-green-900 hover:bg-green-900/50 text-green-400 px-6 py-2 rounded font-bold transition-all disabled:opacity-50"
                >
                    {isSending ? 'SENDING...' : 'EXECUTE'}
                </button>
            </div>

            {/* Status Rows */}
            <div className="flex flex-col gap-2 mb-4 text-xs">
                {/* Active Mission */}
                {tasks.active && (
                    <div className="bg-blue-900/20 border-l-4 border-blue-500 p-2 text-blue-200">
                        <span className="font-bold text-blue-400">ACTIVE MISSION:</span> {tasks.active.request}
                    </div>
                )}

                {/* Queue */}
                <div className="bg-gray-900/50 border border-gray-800 p-2 flex gap-2 items-center text-gray-400">
                    <span className="font-bold text-gray-500">QUEUE:</span>
                    {tasks.queue?.length ? (
                        tasks.queue.map((t, i) => (
                            <span key={i} className="bg-gray-800 px-2 py-0.5 rounded text-gray-300">"{t.request}"</span>
                        ))
                    ) : (
                        <span className="italic opacity-50">Empty</span>
                    )}
                </div>

                {/* Last Completed */}
                <div className="bg-green-900/10 border-l-4 border-green-800 p-2 text-gray-400">
                    <span className="font-bold text-green-700">LAST LOG:</span>
                    {tasks.lastCompleted ? (
                        <span> "{tasks.lastCompleted.request}" → {tasks.lastCompleted.response.substring(0, 60)}...</span>
                    ) : (
                        " --"
                    )}
                </div>
            </div>

            {/* Agents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto flex-1 pr-2 custom-scrollbar">
                {system.agencies ? (
                    Object.entries(system.agencies).map(([name, agent]) => (
                        <AgentCard key={name} name={name} agent={agent} />
                    ))
                ) : (
                    <div className="col-span-full text-center text-green-900 italic py-10">Waiting for agents...</div>
                )}
            </div>

        </div>
    );
}

function AgentCard({ name, agent }: { name: string, agent: AgentData }) {
    const logRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logs
    useEffect(() => {
        if (logRef.current) {
            logRef.current.scrollTop = logRef.current.scrollHeight;
        }
    }, [agent.log, agent.logs]);

    const getStatusColor = (s: AgentState) => {
        switch (s) {
            case 'thinking': return 'text-blue-400';
            case 'active': return 'text-amber-400';
            case 'success': return 'text-green-400';
            case 'error': return 'text-red-400';
            default: return 'text-gray-500';
        }
    };

    const timeAgo = Math.floor((Date.now() - new Date(agent.updatedAt).getTime()) / 1000);

    return (
        <div className="bg-gray-950 border border-gray-800 rounded flex flex-col h-64 shadow-lg group hover:border-green-900/50 transition-colors">
            <div className="flex justify-between items-center p-2 border-b border-gray-900 bg-gray-900/30">
                <span className="font-bold text-sm text-gray-300 group-hover:text-green-400 transition-colors">{name}</span>
                <span className="text-[10px] text-gray-600 font-mono">{timeAgo}s ago</span>
            </div>

            <div className={`text-[10px] font-bold tracking-wider px-2 py-1 ${getStatusColor(agent.state)}`}>
                {agent.state.toUpperCase()}
            </div>

            <div ref={logRef} className="flex-1 overflow-y-auto p-2 text-[11px] font-mono leading-relaxed opacity-80 custom-scrollbar">
                {agent.logs ? (
                    agent.logs.map((line, i) => {
                        if (line.includes('Input:')) return <div key={i} className="text-white font-bold mt-2">{line}</div>;
                        if (line.includes('PM Says:')) return <div key={i} className="text-blue-400 mt-1">{line}</div>;
                        return <div key={i} className="text-gray-500 pl-1 border-l border-gray-800 ml-1">{line}</div>;
                    })
                ) : (
                    <div className="text-gray-500">{agent.log}</div>
                )}
            </div>
        </div>
    );
}
