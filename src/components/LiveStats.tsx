'use client';

import { Users, Activity, Server, Cpu, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAdminStats } from '@/app/admin/stats-actions';

export default function LiveStats() {
    const [stats, setStats] = useState({
        totalFeatures: 0,
        pendingTasks: 0,
        completedFeatures: 0
    });

    useEffect(() => {
        getAdminStats().then(setStats);
    }, []);

    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl flex items-center justify-between">
                <div>
                    <div className="text-xs text-neutral-500 uppercase font-bold mb-1">Feature Backlog</div>
                    <div className="text-2xl font-bold text-indigo-400 flex items-center gap-2">
                        {stats.totalFeatures}
                        <span className="text-xs text-neutral-600 font-normal">items</span>
                    </div>
                </div>
                <Activity className="w-8 h-8 text-neutral-700" />
            </div>

            <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl flex items-center justify-between">
                <div>
                    <div className="text-xs text-neutral-500 uppercase font-bold mb-1">AI Queue</div>
                    <div className="text-2xl font-bold text-amber-400">
                        {stats.pendingTasks}
                    </div>
                </div>
                <Cpu className="w-8 h-8 text-neutral-700" />
            </div>

            <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl flex items-center justify-between">
                <div>
                    <div className="text-xs text-neutral-500 uppercase font-bold mb-1">Shipped</div>
                    <div className="text-lg font-bold text-green-400">
                        {stats.completedFeatures}
                    </div>
                </div>
                <CheckCircle className="w-8 h-8 text-neutral-700" />
            </div>

            <div className="bg-neutral-900/50 border border-neutral-800 p-4 rounded-xl flex items-center justify-between">
                <div>
                    <div className="text-xs text-neutral-500 uppercase font-bold mb-1">Database</div>
                    <div className="text-lg font-bold text-emerald-600">
                        Connected
                    </div>
                </div>
                <Server className="w-8 h-8 text-neutral-700" />
            </div>
        </div>
    );
}
