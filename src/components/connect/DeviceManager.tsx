'use client';

import { useState, useEffect } from 'react';
import { Monitor, Plus, Circle, Terminal, Activity } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

type Device = {
    id: string;
    name: string;
    status: string;
    capabilities: any;
    last_seen_at: string;
};

export default function DeviceManager({
    initialDevices,
    onSelectDevice,
    selectedDeviceId,
    autoOpenLinking = false
}: {
    initialDevices: Device[],
    onSelectDevice?: (id: string) => void,
    selectedDeviceId?: string | null,
    autoOpenLinking?: boolean
}) {
    const [devices, setDevices] = useState<Device[]>(initialDevices);

    useEffect(() => {
        setDevices(initialDevices);
    }, [initialDevices]);
    const [isLinking, setIsLinking] = useState(autoOpenLinking);
    const [linkCode, setLinkCode] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (autoOpenLinking) setIsLinking(true);
    }, [autoOpenLinking]);

    const handleLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            const res = await fetch('/api/link-device', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: linkCode })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to link');

            setSuccess(`Linked device: ${data.name}`);
            setLinkCode('');
            setIsLinking(false);
            // Refresh list (Quick hack: reload or re-fetch. Ideally we subscribe to realtime or just append if we had the full device object)
            window.location.reload();
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                <h2 className="font-semibold text-zinc-100 flex items-center gap-2">
                    <Monitor size={18} /> Devices
                </h2>
                <button
                    onClick={() => setIsLinking(!isLinking)}
                    className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
                >
                    <Plus size={16} />
                </button>
            </div>

            {isLinking && (
                <div className="p-4 bg-zinc-800 border-b border-zinc-700">
                    <form onSubmit={handleLink}>
                        <label className="text-xs text-zinc-400 block mb-1">Enter Pairing Code</label>
                        <input
                            type="text"
                            value={linkCode}
                            onChange={(e) => setLinkCode(e.target.value)}
                            placeholder="e.g. 123-456"
                            className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-white mb-2"
                        />
                        {error && <p className="text-red-400 text-xs mb-2">{error}</p>}
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs py-1 rounded">
                            Link Device
                        </button>
                    </form>
                </div>
            )}

            <div className="flex-1 overflow-y-auto">
                {devices.length === 0 ? (
                    <div className="p-4 text-zinc-500 text-sm text-center">
                        No devices linked.
                    </div>
                ) : (
                    <ul className="space-y-1 p-2">
                        {devices.map(device => (
                            <li key={device.id}>
                                <button
                                    onClick={() => onSelectDevice?.(device.id)}
                                    className={`w-full text-left px-3 py-2 rounded flex items-center gap-3 transition-colors group
                                        ${selectedDeviceId === device.id ? 'bg-zinc-800 text-white shadow-inner' : 'hover:bg-zinc-800 text-zinc-300 hover:text-white'}
                                    `}
                                >
                                    <div className={`w-2 h-2 rounded-full ${device.status === 'online' ? 'bg-green-500' : 'bg-zinc-600'}`} />
                                    <div className="flex-1 truncate">
                                        <span className="block text-sm font-medium">{device.name}</span>
                                        <span className="block text-xs text-zinc-500 capitalize">{device.status}</span>
                                    </div>
                                    {device.capabilities?.iracing && (
                                        <Activity size={12} className="text-zinc-600 group-hover:text-blue-400" />
                                    )}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="p-3 border-t border-zinc-800">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    GridPass Link Active
                </div>
            </div>
        </div>
    );
}
