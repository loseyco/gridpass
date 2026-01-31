import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Activity, Gauge, Zap, Settings, Power, Monitor } from 'lucide-react';

type TelemetrySnapshot = {
    type: string;
    data: any;
    captured_at: string;
};

export default function ActiveDeviceView({ deviceId, deviceName }: { deviceId: string, deviceName: string }) {
    const [telemetry, setTelemetry] = useState<any | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const supabase = createClient();

    const sendCommand = async (command: string, payload: any = {}) => {
        try {
            await fetch('/api/connect/command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    device_id: deviceId,
                    command,
                    payload
                })
            });
        } catch (err) {
            alert('Failed to send command');
        }
    };

    useEffect(() => {
        // 1. Initial Fetch (Optional, mainly we want live)

        // 2. Subscribe to Realtime
        // 2. Subscribe to Realtime Broadcast (V2)
        const channel = supabase
            .channel(`device_telemetry:${deviceId}`)
            .on('broadcast', { event: 'telemetry' }, (msg) => {
                // Supabase Broadcast payload is wrapped in msg.payload
                // And our Agent wraps data in { type: 'iracing', data: { ... } }
                const raw = msg.payload || msg;
                const data = raw.data || raw;
                setTelemetry(data);
                setLastUpdate(new Date());
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [deviceId, supabase]);

    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(deviceName);
    const [saving, setSaving] = useState(false);

    useEffect(() => { setName(deviceName); }, [deviceName]);

    if (!telemetry) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 gap-4">
                <Activity className="animate-pulse" size={48} />
                <p>Waiting for data stream from {deviceName}...</p>
            </div>
        );
    }

    const handleSaveName = async () => {
        setSaving(true);
        const { error } = await supabase
            .from('devices')
            .update({ name })
            .eq('id', deviceId);

        if (error) {
            alert('Failed to rename device');
        } else {
            setIsEditing(false);
            window.location.reload(); // Quick refresh to update parent list
        }
        setSaving(false);
    };

    // Visualization (iRacing Style)
    return (
        <div className="p-8 h-full bg-zinc-950 flex flex-col gap-6">
            <header className="flex justify-between items-end border-b border-zinc-800 pb-4">
                <div>
                    <div className="flex items-center gap-3">
                        <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]" />
                        {isEditing ? (
                            <div className="flex items-center gap-2">
                                <input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xl font-bold text-white focus:outline-none focus:border-blue-500"
                                />
                                <button onClick={handleSaveName} disabled={saving} className="text-sm bg-blue-600 px-3 py-1 rounded text-white disabled:opacity-50">
                                    {saving ? '...' : 'Save'}
                                </button>
                            </div>
                        ) : (
                            <h2 className="text-2xl font-bold text-white flex items-center gap-3 group cursor-pointer" onClick={() => setIsEditing(true)}>
                                {name}
                                <Settings size={16} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                            </h2>
                        )}
                    </div>
                    <p className="text-zinc-400 text-sm mt-1 ml-6">Live Telemetry &bull; {lastUpdate?.toLocaleTimeString()}</p>
                </div>
                <div className="bg-zinc-900 px-3 py-1 rounded border border-zinc-800 text-xs font-mono text-zinc-400">
                    ID: {deviceId.split('-')[0]}...
                </div>
            </header>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* RPM Gauge */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
                    <Gauge size={32} className="text-blue-500 mb-2" />
                    <span className="text-4xl font-black text-white px-4 py-2 bg-black/40 rounded border border-zinc-700/50 font-mono">
                        {telemetry.rpm ?? '---'}
                    </span>
                    <span className="text-xs text-blue-400 uppercase tracking-widest mt-2 font-semibold">RPM</span>
                </div>

                {/* Speed Gauge */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-orange-500/5 group-hover:bg-orange-500/10 transition-colors" />
                    <Zap size={32} className="text-orange-500 mb-2" />
                    <span className="text-4xl font-black text-white px-4 py-2 bg-black/40 rounded border border-zinc-700/50 font-mono">
                        {telemetry.speed ?? '---'}
                    </span>
                    <span className="text-xs text-orange-400 uppercase tracking-widest mt-2 font-semibold">KPH</span>
                </div>

                {/* Gear / Track */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors" />
                    <span className="text-6xl font-black text-white drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]">
                        {telemetry.gear === 0 ? 'N' : telemetry.gear === -1 ? 'R' : telemetry.gear ?? '-'}
                    </span>
                    <span className="text-xs text-purple-400 uppercase tracking-widest mt-2 font-semibold">Gear</span>
                    <div className="mt-4 text-zinc-500 text-xs flex items-center gap-1">
                        <Activity size={10} /> {telemetry.track ?? 'Unknown Track'}
                    </div>
                </div>

            </div>

            {/* Command Controls */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <CommandButton
                    label="Reset Car"
                    icon={<Activity size={16} />}
                    onClick={() => sendCommand('reset_car')}
                    color="orange"
                />
                <CommandButton
                    label="Pit Stop"
                    icon={<Settings size={16} />}
                    onClick={() => sendCommand('pit_stop')}
                    color="blue"
                />
                <CommandButton
                    label="Reboot PC"
                    icon={<Power size={16} />}
                    onClick={() => sendCommand('system_reboot')}
                    color="red"
                    confirm
                />
                <CommandButton
                    label="Shutdown"
                    icon={<Power size={16} />}
                    onClick={() => sendCommand('system_shutdown')}
                    color="red"
                    confirm
                />
            </div>

            {/* Raw Data Debug (For now) */}
            <div className="mt-auto bg-black/30 border border-zinc-800 rounded p-4 font-mono text-xs text-zinc-500">
                <p className="mb-2 font-semibold text-zinc-400">Raw Payload:</p>
                <pre>{JSON.stringify(telemetry, null, 2)}</pre>
            </div>

        </div>
    );
}

function CommandButton({ label, icon, onClick, color, confirm }: any) {
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
        if (confirm && !window.confirm(`Are you sure you want to ${label}?`)) return;

        setLoading(true);
        await onClick();
        setTimeout(() => setLoading(false), 1000);
    };

    const colors: any = {
        orange: 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20',
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20',
        red: 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20',
    };

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            className={`
                h-16 rounded-xl border flex flex-col items-center justify-center gap-2 font-semibold transition-all
                ${colors[color] || colors.blue}
                ${loading ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
            `}
        >
            {loading ? <Activity className="animate-spin" size={20} /> : icon}
            <span className="text-xs uppercase tracking-wider">{loading ? 'Sent' : label}</span>
        </button>
    );
}
