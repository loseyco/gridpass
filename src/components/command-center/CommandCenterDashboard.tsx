'use client';

import { useState } from 'react';
import DeviceManager from '@/components/connect/DeviceManager';
import ActiveDeviceView from '@/components/connect/ActiveDeviceView';

type Device = {
    id: string;
    name: string;
    status: string;
    capabilities: any;
    last_seen_at: string;
};

export default function CommandCenterDashboard({ initialDevices, autoOpenLinking }: { initialDevices: Device[], autoOpenLinking?: boolean }) {
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(initialDevices?.[0]?.id || null);

    const selectedDevice = initialDevices.find(d => d.id === selectedDeviceId);

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-black text-white">
            {/* Sidebar: Device Manager */}
            <DeviceManager
                initialDevices={initialDevices}
                onSelectDevice={setSelectedDeviceId}
                selectedDeviceId={selectedDeviceId}
                autoOpenLinking={autoOpenLinking}
            />

            {/* Main Stage */}
            <div className="flex-1 flex flex-col bg-zinc-950">
                {selectedDeviceId && selectedDevice ? (
                    <ActiveDeviceView deviceId={selectedDeviceId} deviceName={selectedDevice.name} />
                ) : (
                    <>
                        <header className="h-14 border-b border-zinc-800 flex items-center px-6">
                            <h1 className="text-lg font-bold text-zinc-100">Command Center</h1>
                        </header>

                        <main className="flex-1 p-6 flex items-center justify-center text-zinc-500">
                            <div className="text-center">
                                <p>Select a connected device to view telemetry.</p>
                                <div className="mt-4 p-4 border border-zinc-800 rounded bg-zinc-900 max-w-sm mx-auto text-left text-sm">
                                    <p className="font-semibold text-zinc-300 mb-2">How to connect:</p>
                                    <ol className="list-decimal list-inside space-y-1">
                                        <li>Install <strong>GridPass Desktop</strong> on your PC.</li>
                                        <li>Launch the app to see your pairing code.</li>
                                        <li>Click <strong>+</strong> in the Devices list here.</li>
                                        <li>Enter the code to link.</li>
                                    </ol>
                                </div>
                            </div>
                        </main>
                    </>
                )}
            </div>
        </div>
    );
}
