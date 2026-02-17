'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Zap } from 'lucide-react';
import { switchClientEnvironment } from './actions';
import { toast } from '@/hooks/use-toast';

export function DevModeSwitch() {
    const [isPending, startTransition] = useTransition();

    const handleSwitch = (env: 'local' | 'production') => {
        startTransition(async () => {
            const result = await switchClientEnvironment(env);
            if (result.error) {
                toast({
                    variant: "destructive",
                    title: "Failed to switch environment",
                    description: result.error
                });
            } else {
                toast({
                    title: "Environment Switched",
                    description: `Sent '${env}' command to ${result.count} devices.`
                });
            }
        });
    };

    return (
        <div className="flex items-center gap-2 p-4 border rounded-lg bg-neutral-900/50 mb-4">
            <Zap className="text-yellow-500 w-5 h-5" />
            <div className="flex-1">
                <h3 className="text-sm font-semibold text-white">Super Admin: Client Environment</h3>
                <p className="text-xs text-neutral-400">Force all your clients to switch API endpoint.</p>
            </div>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSwitch('local')}
                    disabled={isPending}
                    className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10"
                >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Local (192.168...)"}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSwitch('production')}
                    disabled={isPending}
                    className="border-blue-500/50 text-blue-500 hover:bg-blue-500/10"
                >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Production (Vercel)"}
                </Button>
            </div>
        </div>
    );
}
