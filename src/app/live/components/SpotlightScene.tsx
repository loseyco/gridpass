'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Trophy, MapPin, Flag } from 'lucide-react';

interface SpotlightData {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
    location?: string;
    driver_info?: {
        license_class?: string;
        irating?: number;
    };
    created_at: string;
}

export default function SpotlightScene() {
    const [users, setUsers] = useState<SpotlightData[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        // Fetch data
        fetch('/api/live/data')
            .then(res => res.json())
            .then(data => {
                if (data.spotlight) setUsers(data.spotlight);
            });
    }, []);

    useEffect(() => {
        if (!users.length) return;
        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % users.length);
        }, 10000); // Rotate every 10s
        return () => clearInterval(interval);
    }, [users]);

    if (!users.length) return null;

    const user = users[currentIndex];
    if (!user) return null;

    return (
        <div className="w-full h-full relative overflow-hidden flex items-center justify-start pl-24">

            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-slate-900">
                {user.avatar_url && (
                    <img
                        src={user.avatar_url}
                        className="w-full h-full object-cover opacity-10 blur-xl scale-110"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent"></div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ type: "spring", stiffness: 100, damping: 20 }}
                    className="relative z-10 w-[600px] bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
                >
                    {/* Header Image / Pattern */}
                    <div className="h-32 bg-gradient-to-r from-red-600 to-red-800 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30"></div>
                        <div className="absolute bottom-4 left-6 text-white/90 font-mono text-sm tracking-widest uppercase">
                            Member Spotlight
                        </div>
                    </div>

                    <div className="p-8 pt-0 relative">
                        {/* Avatar / Joke */}
                        <div className="absolute -top-16 left-6">
                            {user.avatar_url ? (
                                <img
                                    src={user.avatar_url}
                                    className="w-32 h-32 rounded-xl border-4 border-slate-900 object-cover shadow-lg"
                                />
                            ) : (
                                <div className="w-32 h-32 rounded-xl border-4 border-slate-900 bg-slate-800 flex items-center justify-center shadow-lg">
                                    <User className="w-16 h-16 text-slate-600" />
                                </div>
                            )}
                        </div>

                        <div className="mt-20">
                            <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">
                                {user.username}
                            </h1>
                            <p className="text-xl text-slate-400 font-light truncate">{user.full_name}</p>

                            {!user.avatar_url && (
                                <div className="mt-6 bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg text-yellow-200 text-sm italic">
                                    "Hey {user.username}, tell your friends you need a profile pic! We can't roast you if we can't see you! :)"
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 mt-8">
                                <div className="bg-slate-800/50 p-4 rounded border border-white/5">
                                    <div className="text-slate-500 text-xs font-bold uppercase mb-1 flex items-center gap-2">
                                        <MapPin className="w-3 h-3" /> Location
                                    </div>
                                    <div className="text-xl font-mono text-white truncate">
                                        {user.location || 'Unknown'}
                                    </div>
                                </div>
                                <div className="bg-slate-800/50 p-4 rounded border border-white/5">
                                    <div className="text-slate-500 text-xs font-bold uppercase mb-1 flex items-center gap-2">
                                        <Trophy className="w-3 h-3" /> Member Since
                                    </div>
                                    <div className="text-xl font-mono text-white">
                                        {new Date(user.created_at).getFullYear()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
