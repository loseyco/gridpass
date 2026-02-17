'use client';

import { motion } from 'framer-motion';
import { Calendar, Monitor, Trophy } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ScheduleScene() {
    const [events, setEvents] = useState<any[]>([]);

    useEffect(() => {
        // Fetch real calendar data
        fetch('/api/live/data')
            .then(res => res.json())
            .then(data => {
                if (data.calendar) {
                    setEvents(data.calendar);
                }
            })
            .catch(e => console.error("Calendar fetch failed", e));
    }, []);

    const DISPLAY_EVENTS = events.length > 0 ? events : [
        // Fallback if no real data
        { time: 'NO DATA', series: 'CHECK', event: 'GRIDPASS.APP', channel: 'ONLINE' }
    ];

    return (
        <div className="w-full h-full bg-slate-900 flex flex-col p-16 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-6 mb-12 relative z-10">
                <div className="w-3 h-16 bg-red-600"></div>
                <div>
                    <h2 className="text-6xl font-black italic tracking-tighter text-white uppercase leading-none">
                        Broadcast
                    </h2>
                    <h3 className="text-3xl font-bold text-slate-400 uppercase tracking-[0.2em]">
                        Schedule
                    </h3>
                </div>
            </div>

            {/* Timetable */}
            <div className="relative z-10 flex-1 flex flex-col gap-4">
                {DISPLAY_EVENTS.map((evt: any, i: number) => (
                    <motion.div
                        key={i}
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center bg-black/40 border-l-4 border-slate-700 hover:border-red-500 p-6 backdrop-blur-sm group transition-colors"
                    >
                        <div className="w-48 text-right pr-8 border-r border-white/10">
                            <div className="text-2xl font-bold text-white group-hover:text-red-500 transition-colors">
                                {new Date(evt.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                                {new Date(evt.start_time).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="flex-1 pl-8">
                            <div className="flex items-baseline gap-3 mb-1">
                                <span className="text-red-500 font-black italic uppercase text-lg tracking-wide">
                                    {evt.series}
                                </span>
                            </div>
                            <div className="text-4xl font-bold text-white leading-none">
                                {evt.title}
                            </div>
                        </div>
                        <div className="px-8 flex items-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                            <div className="text-right">
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    Watch On
                                </div>
                                <div className="text-xl font-bold text-white">
                                    {evt.channel}
                                </div>
                            </div>
                            <div className="w-12 h-12 bg-slate-800 rounded flex items-center justify-center">
                                {/* Channel Logo Mock */}
                                <div className="text-xs font-bold text-slate-500">TV</div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Background Effects */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                <div className="absolute bottom-0 right-0 w-2/3 h-full bg-gradient-to-l from-blue-900/10 to-transparent"></div>
            </div>
        </div>
    );
}
