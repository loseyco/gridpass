'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, AlertTriangle, Timer } from 'lucide-react';

type EventType = 'YELLOW_FLAG' | 'BLUE_FLAG' | 'SAFETY_CAR' | 'FASTEST_LAP' | null;

export default function FieldMarshal() {
    const [activeEvent, setActiveEvent] = useState<EventType>(null);
    const [eventData, setEventData] = useState<string>('');

    useEffect(() => {
        // Randomly trigger events every 30-60 seconds
        const loop = setInterval(() => {
            const roll = Math.random();
            if (roll > 0.7) { // 30% chance of event every interval
                triggerRandomEvent();
            }
        }, 45000);

        return () => clearInterval(loop);
    }, []);

    const triggerRandomEvent = () => {
        const events: EventType[] = ['YELLOW_FLAG', 'BLUE_FLAG', 'SAFETY_CAR', 'FASTEST_LAP'];
        const type = events[Math.floor(Math.random() * events.length)];

        let data = '';
        if (type === 'YELLOW_FLAG') data = `SECTOR ${Math.floor(Math.random() * 3) + 1}`;
        if (type === 'FASTEST_LAP') data = `1:${Math.floor(Math.random() * 10) + 20}.${Math.floor(Math.random() * 999)}`;

        setActiveEvent(type);
        setEventData(data);

        // Clear event after 5-8 seconds
        setTimeout(() => setActiveEvent(null), 6000);
    };

    return (
        <AnimatePresence>
            {activeEvent && (
                <div className="absolute inset-0 z-[100] pointer-events-none flex items-center justify-center">

                    {/* YELLOW FLAG */}
                    {activeEvent === 'YELLOW_FLAG' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 1.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="bg-yellow-500 text-black px-12 py-8 rounded-xl border-8 border-yellow-300 shadow-[0_0_100px_rgba(234,179,8,0.6)] flex flex-col items-center animate-pulse"
                        >
                            <Flag className="w-32 h-32 mb-4" />
                            <h1 className="text-8xl font-black uppercase tracking-tighter">Yellow Flag</h1>
                            <h2 className="text-4xl font-bold uppercase mt-2">{eventData}</h2>
                        </motion.div>
                    )}

                    {/* BLUE FLAG */}
                    {activeEvent === 'BLUE_FLAG' && (
                        <motion.div
                            initial={{ x: 1000 }}
                            animate={{ x: 0 }}
                            exit={{ x: 1000 }}
                            className="absolute top-32 right-0 bg-blue-600 text-white pl-8 pr-32 py-6 rounded-l-full border-y-4 border-l-4 border-blue-400 shadow-2xl"
                        >
                            <div className="flex items-center gap-6">
                                <Flag className="w-16 h-16 animate-bounce" />
                                <div>
                                    <h1 className="text-6xl font-black italic uppercase">Blue Flag</h1>
                                    <p className="text-sm tracking-widest uppercase opacity-80">Let faster cars pass</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* SAFETY CAR */}
                    {activeEvent === 'SAFETY_CAR' && (
                        <motion.div
                            initial={{ y: -100 }}
                            animate={{ y: 0 }}
                            exit={{ y: -500 }}
                            className="absolute top-0 inset-x-0 h-48 bg-orange-500 flex items-center justify-center overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                            <div className="flex items-center gap-8 animate-pulse">
                                <AlertTriangle className="w-24 h-24 text-black" />
                                <h1 className="text-9xl font-black text-black tracking-widest uppercase">SC DEPLOYED</h1>
                                <AlertTriangle className="w-24 h-24 text-black" />
                            </div>
                        </motion.div>
                    )}

                    {/* FASTEST LAP */}
                    {activeEvent === 'FASTEST_LAP' && (
                        <motion.div
                            initial={{ x: -1000, skewX: -20 }}
                            animate={{ x: 0, skewX: -20 }}
                            exit={{ x: -2000, skewX: -20 }}
                            className="absolute bottom-32 left-0 bg-purple-600 text-white pl-32 pr-12 py-4 border-y-4 border-purple-400 shadow-2xl"
                        >
                            <div className="flex items-center gap-6 skew-x-[20deg]">
                                <Timer className="w-12 h-12 text-purple-200" />
                                <div>
                                    <h1 className="text-5xl font-black italic uppercase">{eventData}</h1>
                                    <p className="text-xs font-bold tracking-[0.3em] uppercase opacity-80 text-purple-200">New Overall Best</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                </div>
            )}
        </AnimatePresence>
    );
}
