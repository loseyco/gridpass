'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createClient } from '@/utils/supabase/client';
import { Loader2, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

type Season = {
    id: string;
    metadata: any;
};

type PointsConfig = {
    [position: string]: number;
} & {
    fastest_lap: number;
    pole_position: number;
    led_lap: number;
    led_most_laps: number;
    incident_limit: number; // 0 = no limit
};

const PRESETS: Record<string, Partial<PointsConfig>> = {
    'f1': {
        '1': 25, '2': 18, '3': 15, '4': 12, '5': 10, '6': 8, '7': 6, '8': 4, '9': 2, '10': 1,
        fastest_lap: 1, pole_position: 0, led_lap: 0, led_most_laps: 0
    },
    'indycar': {
        '1': 50, '2': 40, '3': 35, '4': 32, '5': 30, '6': 28, '7': 26, '8': 24, '9': 22, '10': 20,
        '11': 19, '12': 18, '13': 17, '14': 16, '15': 15, '16': 14, '17': 13, '18': 12, '19': 11, '20': 10,
        pole_position: 1, led_lap: 1, led_most_laps: 2
    },
    'nascar': {
        '1': 40, '2': 35, '3': 34, '4': 33, '5': 32, '6': 31, '7': 30, '8': 29, '9': 28, '10': 27,
        // ... simplified for example
        '36': 1,
        pole_position: 0, led_lap: 0, led_most_laps: 0,
        // Stage points usually separate
    }
};

export function PointsSystem({ season }: { season: Season | undefined }) {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState<PointsConfig>({
        fastest_lap: 0,
        pole_position: 0,
        led_lap: 0,
        led_most_laps: 0,
        incident_limit: 0
    });

    useEffect(() => {
        if (season?.metadata?.points_system) {
            setConfig(season.metadata.points_system);
        }
    }, [season]);

    const handlePresetChange = (value: string) => {
        if (PRESETS[value]) {
            // Merge preset with existing config (preserving un-specified keys if any, though usually we want to replace position points)
            // Actually, let's reset positions 1-40 to 0 first to be clean
            const newConfig: any = { ...config };
            for (let i = 1; i <= 40; i++) newConfig[i] = 0;

            Object.assign(newConfig, PRESETS[value]);
            setConfig(newConfig);
            toast.success(`Applied ${value.toUpperCase()} preset`);
        }
    };

    const handlePointChange = (position: number, value: string) => {
        setConfig(prev => ({
            ...prev,
            [position]: parseInt(value) || 0
        }));
    };

    const handleBonusChange = (key: keyof PointsConfig, value: string) => {
        setConfig(prev => ({
            ...prev,
            [key]: parseInt(value) || 0
        }));
    };

    const handleSave = async () => {
        if (!season) {
            toast.error('No active season found');
            return;
        }

        setLoading(true);
        try {
            const updatedMetadata = {
                ...season.metadata,
                points_system: config
            };

            const { error } = await supabase
                .from('os_league_seasons')
                .update({ metadata: updatedMetadata })
                .eq('id', season.id);

            if (error) throw error;
            toast.success('Points system saved successfully');
        } catch (error: any) {
            toast.error('Failed to save: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!season) {
        return <div className="text-gray-500">Please create a season first.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold text-white">Points Configuration</h3>
                    <p className="text-sm text-gray-400">Define how points are awarded for race results.</p>
                </div>
                <div className="flex gap-2">
                    <Select onValueChange={handlePresetChange}>
                        <SelectTrigger className="w-[180px] bg-zinc-900 border-zinc-700">
                            <SelectValue placeholder="Load Preset" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                            <SelectItem value="f1">Formula 1 (Current)</SelectItem>
                            <SelectItem value="indycar">IndyCar</SelectItem>
                            <SelectItem value="nascar">NASCAR (Simple)</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={handleSave} disabled={loading} className="bg-cyan-500 text-black font-bold">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-zinc-900 border-zinc-800 text-white md:col-span-2">
                    <CardHeader>
                        <CardTitle>Position Points</CardTitle>
                        <CardDescription>Points awarded for finishing position.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {Array.from({ length: 40 }).map((_, i) => {
                                const pos = i + 1;
                                return (
                                    <div key={pos} className="flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${pos <= 3 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-zinc-800 text-gray-400'}`}>
                                            P{pos}
                                        </div>
                                        <Input
                                            type="number"
                                            value={config[pos] || 0}
                                            onChange={(e) => handlePointChange(pos, e.target.value)}
                                            className="bg-black border-zinc-700 h-8"
                                            min={0}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="bg-zinc-900 border-zinc-800 text-white">
                        <CardHeader>
                            <CardTitle>Bonus Points</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Pole Position</Label>
                                <Input
                                    type="number"
                                    value={config.pole_position || 0}
                                    onChange={(e) => handleBonusChange('pole_position', e.target.value)}
                                    className="bg-black border-zinc-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Fastest Lap</Label>
                                <Input
                                    type="number"
                                    value={config.fastest_lap || 0}
                                    onChange={(e) => handleBonusChange('fastest_lap', e.target.value)}
                                    className="bg-black border-zinc-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Led a Lap</Label>
                                <Input
                                    type="number"
                                    value={config.led_lap || 0}
                                    onChange={(e) => handleBonusChange('led_lap', e.target.value)}
                                    className="bg-black border-zinc-700"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Led Most Laps</Label>
                                <Input
                                    type="number"
                                    value={config.led_most_laps || 0}
                                    onChange={(e) => handleBonusChange('led_most_laps', e.target.value)}
                                    className="bg-black border-zinc-700"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900 border-zinc-800 text-white">
                        <CardHeader>
                            <CardTitle>Penalties / Limits</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Incident Point Limit (DQ)</Label>
                                <Input
                                    type="number"
                                    value={config.incident_limit || 0}
                                    onChange={(e) => handleBonusChange('incident_limit', e.target.value)}
                                    className="bg-black border-zinc-700"
                                    placeholder="0 = No Limit"
                                />
                                <p className="text-xs text-gray-500">Drivers exceeding this are disqualified.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
