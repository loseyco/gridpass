'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Loader2, Monitor, Circle, Download } from 'lucide-react';

interface Device {
    id: string;
    name: string;
    status: 'online' | 'offline' | 'error';
    last_heartbeat: string;
    cpu_model: string | null;
    ram_gb: number | null;
    gpu_model: string | null;
    client_version: string | null;
    modules_enabled: Record<string, boolean>;
    created_at: string;
}

export default function DevicesPage() {
    const [devices, setDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        loadDevices();

        // Subscribe to device changes
        const channel = supabase
            .channel('os_devices_changes')
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
        switch (status) {
            case 'online': return 'bg-green-500';
            case 'offline': return 'bg-gray-500';
            case 'error': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    }

    function getLastSeenText(lastHeartbeat: string) {
        const diff = Date.now() - new Date(lastHeartbeat).getTime();
        const minutes = Math.floor(diff / 60000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    }

    function getEnabledModules(modulesEnabled: Record<string, boolean>) {
        return Object.entries(modulesEnabled || {})
            .filter(([_, enabled]) => enabled)
            .map(([name]) => name)
            .join(', ') || 'None';
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">GridPass Devices</h1>
                <p className="text-muted-foreground">
                    Manage your GridPass Clients across all your devices
                </p>
            </div>

            {devices.length === 0 ? (
                <Card>
                    <CardHeader>
                        <CardTitle>No Devices Registered</CardTitle>
                        <CardDescription>
                            Download and install the GridPass Client to get started
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild>
                            <Link href="/downloads">
                                <Download className="h-4 w-4 mr-2" />
                                Download GridPass Client
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {devices.map((device) => (
                        <Card key={device.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <Monitor className="h-5 w-5" />
                                        <CardTitle className="text-lg">{device.name}</CardTitle>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Circle className={`h-3 w-3 ${getStatusColor(device.status)} rounded-full`} />
                                        <Badge variant={device.status === 'online' ? 'default' : 'secondary'}>
                                            {device.status}
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
                                    {device.client_version && (
                                        <div>Client: v{device.client_version}</div>
                                    )}
                                    <div>
                                        <span className="font-medium">Modules:</span> {getEnabledModules(device.modules_enabled)}
                                    </div>
                                </div>
                                <Button asChild className="w-full">
                                    <Link href={`/devices/${device.id}`}>
                                        Control Panel
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
