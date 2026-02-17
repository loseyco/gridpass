'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function ClientTestPage() {
    const [deviceId, setDeviceId] = useState('');
    const [status, setStatus] = useState<string[]>([]);
    const [token, setToken] = useState('');

    const log = (message: string) => {
        setStatus(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    const getToken = () => {
        try {
            const authData = localStorage.getItem('sb-localhost-auth-token');
            if (authData) {
                const parsed = JSON.parse(authData);
                setToken(parsed.access_token);
                log('✅ Retrieved auth token from localStorage');
                return parsed.access_token;
            } else {
                log('❌ No auth token found - please login first');
                return null;
            }
        } catch (e) {
            log('❌ Error getting token: ' + e);
            return null;
        }
    };

    const registerDevice = async () => {
        const authToken = token || getToken();
        if (!authToken) return;

        log('📡 Registering device...');

        try {
            const response = await fetch('/api/sim-racing/devices/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    name: 'Browser Test Device',
                    hardware_fingerprint: 'test-' + Math.random().toString(36).substring(7),
                    cpu_model: navigator.userAgent,
                    ram_gb: 16,
                    os_version: navigator.platform,
                    gpu_model: 'Unknown'
                })
            });

            const data = await response.json();

            if (response.ok) {
                setDeviceId(data.device_id);
                log(`✅ Device registered: ${data.device_id}`);
            } else {
                log(`❌ Registration failed: ${JSON.stringify(data)}`);
            }
        } catch (e) {
            log(`❌ Error: ${e}`);
        }
    };

    const sendHeartbeat = async () => {
        if (!deviceId) {
            log('❌ No device ID - register first');
            return;
        }

        const authToken = token || getToken();
        if (!authToken) return;

        log('💓 Sending heartbeat...');

        try {
            const response = await fetch(`/api/sim-racing/devices/${deviceId}/heartbeat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    status: 'online',
                    telemetry: { sim_racing: { connected: false } }
                })
            });

            const data = await response.json();

            if (response.ok) {
                log(`✅ Heartbeat sent`);
                if (data.commands && data.commands.length > 0) {
                    log(`📨 Received ${data.commands.length} command(s):`);
                    data.commands.forEach((cmd: any) => {
                        log(`   - ${cmd.command_type}`);
                    });
                }
            } else {
                log(`❌ Heartbeat failed: ${JSON.stringify(data)}`);
            }
        } catch (e) {
            log(`❌ Error: ${e}`);
        }
    };

    const sendCommand = async (commandType: string) => {
        if (!deviceId) {
            log('❌ No device ID - register first');
            return;
        }

        const authToken = token || getToken();
        if (!authToken) return;

        log(`⚡ Sending command: ${commandType}`);

        try {
            const response = await fetch(`/api/sim-racing/devices/${deviceId}/commands`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({
                    command_type: commandType,
                    parameters: {}
                })
            });

            const data = await response.json();

            if (response.ok) {
                log(`✅ Command sent: ${data.command_id}`);
            } else {
                log(`❌ Command failed: ${JSON.stringify(data)}`);
            }
        } catch (e) {
            log(`❌ Error: ${e}`);
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">GridPass Client Test</h1>

            <div className="grid gap-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Device Registration</CardTitle>
                        <CardDescription>Test device registration and heartbeat</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Button onClick={registerDevice}>Register Device</Button>
                            <Button onClick={sendHeartbeat} disabled={!deviceId}>Send Heartbeat</Button>
                        </div>

                        {deviceId && (
                            <div className="text-sm">
                                Device ID: <code className="bg-muted px-2 py-1 rounded">{deviceId}</code>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Send Commands</CardTitle>
                        <CardDescription>Test remote command sending</CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-2 flex-wrap">
                        <Button onClick={() => sendCommand('reset_car')} disabled={!deviceId}>
                            Reset Car
                        </Button>
                        <Button onClick={() => sendCommand('enter_car')} disabled={!deviceId}>
                            Enter Car
                        </Button>
                        <Button onClick={() => sendCommand('exit_car')} disabled={!deviceId}>
                            Exit Car
                        </Button>
                        <Button onClick={() => sendCommand('ignition')} disabled={!deviceId}>
                            Ignition
                        </Button>
                        <Button onClick={() => sendCommand('pit_limiter')} disabled={!deviceId}>
                            Pit Limiter
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Activity Log</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
                            {status.map((msg, i) => (
                                <div key={i}>{msg}</div>
                            ))}
                            {status.length === 0 && (
                                <div className="text-gray-500">Waiting for activity...</div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
