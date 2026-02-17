'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Circle, Car, Power, RotateCcw, LogIn, LogOut, Gauge, Flag, Fuel, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { QRCodeSVG } from 'qrcode.react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface Device {
    id: string;
    name: string;
    status: 'online' | 'offline' | 'error';
    last_heartbeat: string;
    cpu_model: string | null;
    ram_gb: number | null;
    gpu_model: string | null;
    os_version: string | null;
    remote_access_enabled: boolean;
    telemetry?: {
        sim_racing?: {
            rpm: number;
            speed: number;
            gear: number;
            fuel: number;
            oil_temp: number;
            water_temp: number;
            lat: number;
            lon: number;
            track: string;
            car: string;
        }
    };
}

interface Lap {
    id: string;
    lap_time: number;
    track: string;
    car: string;
    timestamp: string;
    sector1?: number;
    sector2?: number;
    sector3?: number;
}

export default function DeviceControlPanel() {
    const params = useParams();
    const deviceId = params.id as string;
    const [device, setDevice] = useState<Device | null>(null);
    const [laps, setLaps] = useState<Lap[]>([]);
    const [liveTelemetry, setLiveTelemetry] = useState<any>(null); // Realtime data
    const [loading, setLoading] = useState(true);
    const [executingCommand, setExecutingCommand] = useState<string | null>(null);
    const [currentUrl, setCurrentUrl] = useState('');
    const { toast } = useToast();
    const supabase = createClient();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setCurrentUrl(window.location.href);
        }
    }, []);

    useEffect(() => {
        loadDevice();
        loadLaps();

        // Subscribe to device changes (Heartbeat / Persistence)
        const deviceChannel = supabase
            .channel(`device-${deviceId}-db`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'os_devices',
                    filter: `id=eq.${deviceId}`
                },
                (payload) => {
                    setDevice(payload.new as Device);
                }
            )
            .subscribe();

        // Subscribe to Realtime Telemetry (Broadcast)
        const telemetryChannel = supabase
            .channel(`device-${deviceId}`)
            .on(
                'broadcast',
                { event: 'telemetry' },
                (payload) => {
                    setLiveTelemetry(payload.payload);
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Connected to telemetry stream');
                }
            });

        // Subscribe to new laps
        const lapsChannel = supabase
            .channel(`laps-${deviceId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'os_sim_laps'
                },
                () => {
                    loadLaps();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(deviceChannel);
            supabase.removeChannel(telemetryChannel);
            supabase.removeChannel(lapsChannel);
        };
    }, [deviceId]);

    async function loadDevice() {
        const { data, error } = await supabase
            .from('os_devices')
            .select('*')
            .eq('id', deviceId)
            .single();

        if (!error && data) {
            setDevice(data);
        }
        setLoading(false);
    }

    async function loadLaps() {
        const { data, error } = await supabase
            .from('os_sim_laps')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(10); // Show last 10 laps

        if (!error && data) {
            setLaps(data);
        }
    }

    async function sendCommand(commandType: string, parameters = {}) {
        if (!device) return;

        if (device.status !== 'online') {
            toast({
                title: 'Device Offline',
                description: 'Device must be online to execute commands',
                variant: 'destructive'
            });
            return;
        }

        setExecutingCommand(commandType);

        try {
            const response = await fetch(`/api/sim-racing/devices/${deviceId}/commands`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command_type: commandType, parameters })
            });

            const data = await response.json();

            if (response.ok) {
                toast({
                    title: 'Command Sent',
                    description: `${commandType} command queued successfully`
                });
            } else {
                toast({
                    title: 'Command Failed',
                    description: data.error || 'Failed to send command',
                    variant: 'destructive'
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to send command',
                variant: 'destructive'
            });
        } finally {
            setExecutingCommand(null);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!device) {
        return (
            <div className="container mx-auto p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Device Not Found</CardTitle>
                        <CardDescription>
                            The requested device could not be found
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    const isOnline = device.status === 'online';
    const dbTelemetry = device.telemetry?.sim_racing;
    // Use live telemetry if available, otherwise fall back to database state
    const telemetry = liveTelemetry || dbTelemetry;

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Device Header */}
            <div>
                <Link href="/sim-racing" className="text-sm text-neutral-500 hover:text-white mb-2 inline-block">
                    &larr; Back to Dashboard
                </Link>
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-3xl font-bold">{device.name}</h1>
                    <div className="flex items-center gap-2">
                        <Circle
                            className={`h-3 w-3 ${isOnline ? 'bg-green-500' : 'bg-gray-500'} rounded-full`}
                        />
                        <Badge variant={isOnline ? 'default' : 'secondary'}>
                            {device.status}
                        </Badge>
                    </div>
                </div>
                <p className="text-muted-foreground">
                    Remote control and telemetry
                </p>
            </div>

            <div className="flex flex-col gap-6">
                {/* Live Telemetry Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Gauge className="h-5 w-5" />
                            Live Telemetry
                        </CardTitle>
                        <CardDescription>
                            Real-time data from {telemetry?.track || 'Track'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isOnline && telemetry ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="p-4 bg-secondary/50 rounded-lg text-center">
                                    <div className="text-muted-foreground text-xs uppercase mb-1">Speed</div>
                                    <div className="text-3xl font-bold font-mono">
                                        {Math.round(telemetry.speed || 0)}
                                        <span className="text-sm font-normal text-muted-foreground ml-1">MPH</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-secondary/50 rounded-lg text-center">
                                    <div className="text-muted-foreground text-xs uppercase mb-1">RPM</div>
                                    <div className="text-3xl font-bold font-mono">
                                        {Math.round(telemetry.rpm || 0)}
                                    </div>
                                </div>
                                <div className="p-4 bg-secondary/50 rounded-lg text-center">
                                    <div className="text-muted-foreground text-xs uppercase mb-1">Gear</div>
                                    <div className="text-3xl font-bold font-mono">
                                        {telemetry.gear === -1 ? 'R' : telemetry.gear === 0 ? 'N' : telemetry.gear}
                                    </div>
                                </div>
                                <div className="p-4 bg-secondary/50 rounded-lg text-center">
                                    <div className="text-muted-foreground text-xs uppercase mb-1">Fuel</div>
                                    <div className="text-3xl font-bold font-mono">
                                        {Math.round(telemetry.fuel || 0)}
                                        <span className="text-sm font-normal text-muted-foreground ml-1">%</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-center p-8 text-muted-foreground">
                                {isOnline ? 'Waiting for telemetry...' : 'Device is offline'}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Command Controls */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Power className="h-5 w-5" />
                            Controls
                        </CardTitle>
                        <CardDescription>
                            Remote actions
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-4">
                        <Button
                            className="flex-1 min-w-[150px]"
                            variant="default"
                            disabled={!isOnline || executingCommand !== null}
                            onClick={() => sendCommand('enter_car')}
                        >
                            {executingCommand === 'enter_car' ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <LogIn className="h-4 w-4 mr-2" />
                            )}
                            Enter Car
                        </Button>

                        <Button
                            className="flex-1 min-w-[150px]"
                            variant="destructive"
                            disabled={!isOnline || executingCommand !== null}
                            onClick={() => sendCommand('reset_car')}
                        >
                            {executingCommand === 'reset_car' ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <RotateCcw className="h-4 w-4 mr-2" />
                            )}
                            Reset Car
                        </Button>

                        <Button
                            className="flex-1 min-w-[150px]"
                            variant="outline"
                            disabled={!isOnline || executingCommand !== null}
                            onClick={() => sendCommand('exit_car')}
                        >
                            {executingCommand === 'exit_car' ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <LogOut className="h-4 w-4 mr-2" />
                            )}
                            Exit Car
                        </Button>

                        <Button
                            className="flex-1 min-w-[150px]"
                            variant="outline"
                            disabled={!isOnline || executingCommand !== null}
                            onClick={() => sendCommand('ignition')}
                        >
                            {executingCommand === 'ignition' ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Power className="h-4 w-4 mr-2" />
                            )}
                            Toggle Ignition
                        </Button>
                    </CardContent>
                </Card>

                {/* Laptop History */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Flag className="h-5 w-5" />
                            Recent Laps
                        </CardTitle>
                        <CardDescription>
                            Last 10 laps recorded
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {laps.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Time</TableHead>
                                        <TableHead>Track</TableHead>
                                        <TableHead>Car</TableHead>
                                        <TableHead className="text-right">Recorded</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {laps.map((lap) => (
                                        <TableRow key={lap.id}>
                                            <TableCell className="font-medium font-mono">
                                                {lap.lap_time.toFixed(3)}s
                                            </TableCell>
                                            <TableCell>{lap.track}</TableCell>
                                            <TableCell>{lap.car}</TableCell>
                                            <TableCell className="text-right text-muted-foreground w-[150px]">
                                                {new Date(lap.timestamp).toLocaleTimeString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                No laps recorded yet. Go drive some laps! 🏎️
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Device Info & Mobile */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Hardware</CardTitle>
                            <CardDescription>Specs</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            {device.cpu_model && (
                                <div>
                                    <div className="text-muted-foreground">CPU</div>
                                    <div>{device.cpu_model}</div>
                                </div>
                            )}
                            {device.ram_gb && (
                                <div>
                                    <div className="text-muted-foreground">RAM</div>
                                    <div>{device.ram_gb} GB</div>
                                </div>
                            )}
                            {device.gpu_model && (
                                <div>
                                    <div className="text-muted-foreground">GPU</div>
                                    <div>{device.gpu_model}</div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* QR Code */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Smartphone className="h-5 w-5" />
                                Mobile Control
                            </CardTitle>
                            <CardDescription>Scan to control on phone</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center justify-center py-2 h-full">
                            <div className="bg-white p-4 rounded-lg mb-2">
                                {currentUrl && <QRCodeSVG value={currentUrl} size={140} />}
                            </div>
                            <p className="text-xs text-muted-foreground text-center">
                                Use phone camera to open controls
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
