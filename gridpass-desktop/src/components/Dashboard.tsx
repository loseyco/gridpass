import { useEffect, useState } from "react";

// Simple Debug Dashboard
export default function Dashboard({ deviceId, onUnpair }: { deviceId: string; onUnpair: () => void }) {
    const [lastData, setLastData] = useState<any>(null);
    const [count, setCount] = useState(0);

    useEffect(() => {
        const removeListener = (window as any).api.onTelemetryUpdate((data: any) => {
            setLastData(data);
            setCount(c => c + 1);
        });
        return () => removeListener();
    }, []);

    const sendCmd = (cmd: string) => {
        console.log("Sending Cmd:", cmd);
        // Using Generic 'broadcast' for now, map to validated IDs later
        // Reset Car (Shift-R style) might need 'telemetry:command' with specific payload
        (window as any).api.sendTelemetryCommand({ command: 'broadcast', msg: 0 });
    };

    return (
        <div className="p-6 bg-neutral-900 text-white h-screen overflow-auto font-sans">
            <header className="flex justify-between items-center mb-8 border-b border-neutral-700 pb-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">GridPass Stats</h1>
                    <div className="text-xs text-neutral-400 font-mono mt-1">
                        PKT: {count} | STATUS: <span className={lastData ? "text-green-400" : "text-yellow-400"}>{lastData ? "LIVE" : "WAITING"}</span>
                    </div>
                </div>
                <button onClick={onUnpair} className="text-xs text-red-400 hover:text-red-300">Unpair</button>
            </header>

            {!lastData && <div className="text-neutral-500 animate-pulse">Waiting for iRacing data...</div>}

            {lastData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Session Info */}
                    <div className="bg-neutral-800 p-4 rounded-xl border border-neutral-700">
                        <h2 className="text-neutral-400 text-sm font-bold uppercase mb-2">Session</h2>
                        <div className="space-y-1">
                            <div className="text-lg"><span className="text-neutral-500">Track:</span> {lastData.track || '-'}</div>
                            <div className="text-lg"><span className="text-neutral-500">Car:</span> {lastData.car || '-'}</div>
                            <div className="text-lg"><span className="text-neutral-500">Driver:</span> {lastData.driver || '-'}</div>
                        </div>
                    </div>

                    {/* Physics */}
                    <div className="bg-neutral-800 p-4 rounded-xl border border-neutral-700">
                        <h2 className="text-neutral-400 text-sm font-bold uppercase mb-2">Physics</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-4xl font-mono">{Math.round(lastData.speed)} <span className="text-sm text-neutral-500">KPH</span></div>
                            </div>
                            <div>
                                <div className="text-4xl font-mono">{Math.round(lastData.rpm)} <span className="text-sm text-neutral-500">RPM</span></div>
                            </div>
                            <div>
                                <div className="text-4xl font-mono text-blue-400">{lastData.gear} <span className="text-sm text-neutral-500">GEAR</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Flags & State */}
                    <div className="bg-neutral-800 p-4 rounded-xl border border-neutral-700">
                        <h2 className="text-neutral-400 text-sm font-bold uppercase mb-2">State</h2>
                        <div className="flex flex-wrap gap-2">
                            <span className={`px-2 py-1 rounded text-xs ${lastData.onTrack ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                {lastData.onTrack ? 'ON TRACK' : 'OFF TRACK'}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs ${lastData.inPit ? 'bg-yellow-900 text-yellow-300' : 'bg-neutral-700'}`}>
                                PIT
                            </span>
                        </div>
                        <div className="mt-4 text-xs font-mono text-neutral-500">
                            Time: {lastData.sessionTime.toFixed(2)}
                            <br />Flags: {lastData.flags}
                        </div>
                    </div>
                </div>
            )}

            {/* Commands */}
            <div className="mt-8">
                <h3 className="text-neutral-400 text-sm font-bold uppercase mb-4">Quick Commands</h3>
                <div className="flex gap-4">
                    <button onClick={() => sendCmd('reset')} className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded text-sm transition">Reset Car</button>
                    <button onClick={() => sendCmd('exit')} className="px-4 py-2 bg-red-900/50 hover:bg-red-900 rounded text-sm transition text-red-200">Exit Sim</button>
                </div>
            </div>

            <div className="mt-8">
                <h3 className="text-neutral-400 text-sm font-bold uppercase mb-2">Raw Dump</h3>
                <pre className="text-xs bg-black text-green-500 p-4 rounded overflow-auto h-40 border border-neutral-800">
                    {lastData ? JSON.stringify(lastData, null, 2) : "No Data Yet..."}
                </pre>
            </div>
        </div>
    );
}
