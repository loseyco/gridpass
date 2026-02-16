'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, getButtonClasses } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Loader2, Monitor, Circle } from 'lucide-react';
import { SimRacingLanding } from './SimRacingLanding';
import { InstallGuideDialog } from './InstallGuideDialog';
import { DevModeSwitch } from './DevModeSwitch';

interface Device {
    id: string;
    name: string;
    status: 'online' | 'offline' | 'error';
    last_heartbeat: string;
    cpu_model: string | null;
    ram_gb: number | null;
    gpu_model: string | null;
    created_at: string;
}

export default function SimRacingDashboard() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) {
                loadDevices();
                // Subscribe only if logged in
                const channel = supabase
                    .channel('devices')
                    .on(
                        'postgres_changes',
                        {
                            event: '*',
                            schema: 'public',
                            table: 'os_devices'
                        },
                        () => {
                            loadDevices();
                        }
                    )
                    .subscribe();
                return () => {
                    supabase.removeChannel(channel);
                };
            } else {
                setLoading(false);
            }
        });
    }, []);

    async function loadDevices() {
        const { data, error } = await supabase
            .from('os_devices')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) {
            setDevices(data);
        }
        setLoading(false);
    }

    function getStatusColor(status: string) {
        // Red color if offline
        return 'bg-gray-500'; // Default
    }

    // Hydration Safe Date Display
    const [now, setNow] = useState(Date.now());
    useEffect(() => {
        setNow(Date.now());
        const interval = setInterval(() => setNow(Date.now()), 10000); // 10s checks
        return () => clearInterval(interval);
    }, []);

    const isDeviceOnline = (device: Device) => {
        if (!device.last_heartbeat) return false;
        // If last heartbeat was more than 90 seconds ago, it's offline
        const diff = now - new Date(device.last_heartbeat).getTime();
        return diff < 90000;
    };

    function getLastSeenText(lastHeartbeat: string) {
        if (!lastHeartbeat) return 'Never';
        const diff = now - new Date(lastHeartbeat).getTime();
        const minutes = Math.floor(diff / 60000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!session) {
        return <SimRacingLanding />;
    }

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Sim Racing Devices</h1>
                    <p className="text-muted-foreground">
                        Manage your racing PCs and send remote commands
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <InstallGuideDialog>
                        <Button variant="outline">
                            Install Client
                        </Button>
                    </InstallGuideDialog>
                </div>
            </div>

            <DevModeSwitch />

            {devices.length === 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Welcome to GridPass Sim Control!</CardTitle>
                        <CardDescription>
                            Let's get your simulator connected in 3 easy steps.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="flex flex-col gap-2 p-4 bg-neutral-900/50 rounded-lg border border-neutral-800">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm">1</span>
                                <h3 className="font-semibold text-white">Download</h3>
                                <p className="text-sm text-neutral-400">Download the client .zip file to your Sim Racing PC.</p>
                                <a href="/client.zip" download className={getButtonClasses("default", "sm", "w-full mt-auto")}>
                                    Download Client
                                </a>
                            </div>

                            <div className="flex flex-col gap-2 p-4 bg-neutral-900/50 rounded-lg border border-neutral-800">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white font-bold text-sm">2</span>
                                <h3 className="font-semibold text-white">Install</h3>
                                <p className="text-sm text-neutral-400">
                                    Extract the zip file. Open the folder and double-click
                                    <code className="bg-neutral-800 px-1 py-0.5 rounded mx-1 text-white">Install.bat</code>.
                                </p>
                            </div>

                            <div className="flex flex-col gap-2 p-4 bg-neutral-900/50 rounded-lg border border-neutral-800">
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-600 text-white font-bold text-sm">3</span>
                                <h3 className="font-semibold text-white">Connect</h3>
                                <p className="text-sm text-neutral-400">Wait for the terminal to say "Client Ready". This page will automatically update!</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="flex flex-col gap-4">
                    {devices.map((device) => {
                        const online = isDeviceOnline(device);
                        return (
                            <Card key={device.id} className="hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2">
                                            <Monitor className="h-5 w-5" />
                                            <CardTitle className="text-lg">{device.name}</CardTitle>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Circle className={`h-3 w-3 ${online ? 'bg-green-500' : 'bg-red-500'} rounded-full`} />
                                            <Badge variant={online ? 'default' : 'secondary'}>
                                                {online ? 'Online' : 'Offline'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <CardDescription>
                                        Last seen: {getLastSeenText(device.last_heartbeat)}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                                        {device.cpu_model && (
                                            <div>CPU: {device.cpu_model}</div>
                                        )}
                                        {device.ram_gb && (
                                            <div>RAM: {device.ram_gb} GB</div>
                                        )}
                                        {device.gpu_model && (
                                            <div>GPU: {device.gpu_model}</div>
                                        )}
                                    </div>
                                    <Link href={`/sim-racing/devices/${device.id}`} className={getButtonClasses("default", "default", "w-full")}>
                                        Control Panel
                                    </Link>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {devices.length > 0 && devices.every(d => d.status !== 'online') && (
                <div className="mt-8 p-4 border rounded-lg bg-neutral-900/50 flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-white">Racing PC Offline?</h3>
                        <p className="text-sm text-neutral-400">Make sure the GridPass Client is running on your simulator.</p>
                    </div>
                    <a href="/GridPass_Client.zip" download className={getButtonClasses("default")}>
                        Download Installer
                    </a>
                </div>
            )}
        </div>
    );
}
