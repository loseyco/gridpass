'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Eye, Radio } from 'lucide-react';
import LikeSubscribePopup from './LikeSubscribePopup';

interface BroadcastOverlayProps {
    stats: {
        total_members: number;
        page_views: number;
    } | null;
}

export default function BroadcastOverlay({ stats }: BroadcastOverlayProps) {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="absolute inset-0 z-[100] pointer-events-none">
            {/* Top Right: LIVE Indicator & Clock */}
            <div className="absolute top-8 right-8 flex flex-col items-end gap-2">
                <div className="flex items-center gap-3 bg-black/80 backdrop-blur-md px-4 py-2 rounded border border-white/10 shadow-lg">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]"></span>
                        <span className="font-bold text-white tracking-wider text-sm">LIVE</span>
                    </div>
                    <div className="w-px h-4 bg-white/20 mx-2"></div>
                    <span className="font-mono font-bold text-white text-lg tabular-nums tracking-widest">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                </div>
            </div>

            {/* Bottom Left: Branding Watermark */}
            <div className="absolute bottom-8 left-8 flex flex-col items-start gap-1 opacity-80">
                <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded border border-white/5 text-white/50 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                    <span>Made in KC by</span>
                    <span className="text-white">Losey.Co</span>
                </div>
                <div className="text-2xl font-black italic tracking-tighter text-white drop-shadow-md">
                    GRID<span className="text-red-500">PASS</span>.APP
                </div>
            </div>

            {/* Engagement Popup (Auto-triggers) */}
            <LikeSubscribePopup />

            {/* Top Bar: Ticker Stats (If stats exist) */}
            {stats && (
                <div className="absolute top-0 left-0 right-0 h-10 bg-black/90 border-b border-white/10 flex items-center justify-center gap-12 text-xs font-bold uppercase tracking-widest text-slate-400">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-red-500" />
                        <span className="text-white">{stats.total_members.toLocaleString()}</span> Members
                    </div>
                    <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-blue-500" />
                        <span className="text-white">{stats.page_views.toLocaleString()}</span> Views today
                    </div>
                </div>
            )}
        </div>
    );
}
