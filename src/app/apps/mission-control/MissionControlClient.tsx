
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Rss, Facebook, Youtube, Play, Pause, RefreshCw, Radio } from 'lucide-react';
import { toast } from 'sonner';

export default function MissionControlClient() {
    const [settings, setSettings] = useState<any[]>([]);
    const [heartbeat, setHeartbeat] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchSettings = async () => {
        const { data } = await supabase.from('os_system_settings').select('*').order('key');
        if (data) {
            setSettings(data);
            const hb = data.find(d => d.key === 'system.heartbeat');
            setHeartbeat(hb?.value);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchSettings();
        // Poll for heartbeat updates
        const interval = setInterval(fetchSettings, 5000);
        return () => clearInterval(interval);
    }, []);

    const toggleSetting = async (key: string, currentValue: any) => {
        const newValue = { ...currentValue, enabled: !currentValue.enabled };

        // Optimistic update
        setSettings(prev => prev.map(s => s.key === key ? { ...s, value: newValue } : s));

        const { error } = await supabase
            .from('os_system_settings')
            .update({ value: newValue })
            .eq('key', key);

        if (error) {
            toast.error('Failed to update setting');
            fetchSettings(); // Revert
        } else {
            toast.success(newValue.enabled ? 'Enabled' : 'Disabled');
        }
    };

    const isOnline = heartbeat && (new Date().getTime() - new Date(heartbeat.last_seen).getTime()) < 120000; // 2 mins

    const getIcon = (key: string) => {
        if (key.includes('news')) return <Rss className="w-5 h-5 text-orange-500" />;
        if (key.includes('facebook')) return <Facebook className="w-5 h-5 text-blue-500" />;
        if (key.includes('youtube')) return <Youtube className="w-5 h-5 text-red-500" />;
        return <Activity className="w-5 h-5 text-zinc-500" />;
    };

    return (
        <div className="space-y-6">
            {/* Status Header */}
            <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                    <div>
                        <h2 className="text-xl font-bold">Mission Control Link</h2>
                        <p className="text-zinc-400 text-sm">
                            {isOnline
                                ? `Connected to ${heartbeat?.hostname || 'Local Host'}`
                                : 'Local Script Disconnected (Run scripts/mission-control.js)'}
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-1">Last Heartbeat</div>
                    <div className="font-mono">{heartbeat?.last_seen ? new Date(heartbeat.last_seen).toLocaleTimeString() : 'Never'}</div>
                </div>
            </div>

            {/* Bots Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {settings.filter(s => s.key.startsWith('cron.')).map((setting) => (
                    <Card key={setting.key} className="bg-zinc-950 border-zinc-800">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div className="flex items-center gap-2">
                                {getIcon(setting.key)}
                                <CardTitle className="text-base font-medium">
                                    {setting.key.split('.')[1].replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                </CardTitle>
                            </div>
                            <Switch
                                checked={setting.value?.enabled}
                                onCheckedChange={() => toggleSetting(setting.key, setting.value)}
                            />
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-zinc-400 mb-4 h-10">
                                {setting.description}
                            </div>
                            <div className="flex items-center justify-between text-xs font-mono bg-zinc-900 p-2 rounded">
                                <span>Freq: {setting.value?.frequency_mins}m</span>
                                <span className={setting.value?.enabled ? 'text-green-500' : 'text-zinc-500'}>
                                    {setting.value?.enabled ? 'ACTIVE' : 'PAUSED'}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Live Status Override */}
            <Card className="bg-zinc-950 border-zinc-800 mt-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Radio className="w-5 h-5 text-red-500" />
                        Live Broadcast Override
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-zinc-400 text-sm mb-4">
                        The YouTube Monitor automates this, but you can manually force the site into "Live Mode".
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" className="border-red-900 text-red-500 hover:bg-red-950">
                            Force ON AIR
                        </Button>
                        <Button variant="outline" className="text-zinc-400">
                            Force OFF AIR
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
