'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, DollarSign, User } from 'lucide-react';

interface VehicleData {
    id: string;
    year: number;
    make: string;
    model: string;
    photo_url?: string;
    nickname?: string;
    profiles: {
        username: string;
    };
}

export default function GarageScene() {
    const [vehicles, setVehicles] = useState<VehicleData[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        fetch('/api/live/data')
            .then(res => res.json())
            .then(data => {
                if (data.garage) setVehicles(data.garage);
            });
    }, []);

    useEffect(() => {
        if (!vehicles.length) return;
        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % vehicles.length);
        }, 8000);
        return () => clearInterval(interval);
    }, [vehicles]);

    if (!vehicles.length) return null;

    const vehicle = vehicles[currentIndex];

    return (
        <div className="w-full h-full bg-black relative overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.div
                    key={vehicle.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0"
                >
                    {/* Background Image */}
                    {vehicle.photo_url ? (
                        <img
                            src={vehicle.photo_url}
                            className="w-full h-full object-cover opacity-60"
                            style={{ filter: 'brightness(0.6)' }}
                        />
                    ) : (
                        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                            <Car className="w-64 h-64 text-slate-800" />
                        </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/80 to-transparent"></div>

                    {/* Content */}
                    <div className="absolute bottom-24 left-16 z-20 max-w-4xl">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="bg-yellow-500 text-black font-extrabold px-3 py-1 text-sm uppercase tracking-widest rounded-sm">
                                Garage Showcase
                            </div>
                            <div className="text-slate-400 font-mono flex items-center gap-2">
                                <User className="w-4 h-4" /> Owned by {vehicle.profiles?.username || 'Unknown'}
                            </div>
                        </div>

                        <h1 className="text-8xl font-black text-white uppercase italic tracking-tighter leading-none mb-2">
                            {vehicle.make}
                        </h1>
                        <h2 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500 leading-tight">
                            {vehicle.model}
                        </h2>
                        <div className="text-4xl font-light text-slate-400 mt-2">
                            {vehicle.year} {vehicle.nickname && `"${vehicle.nickname}"`}
                        </div>
                    </div>

                    {/* Tech stats decoration */}
                    <div className="absolute top-16 right-16 flex flex-col items-end gap-2 opacity-50">
                        <div className="h-[1px] w-32 bg-white"></div>
                        <div className="text-xs font-mono text-white">CHASSIS_ID: {vehicle.id.slice(0, 8).toUpperCase()}</div>
                    </div>

                </motion.div>
            </AnimatePresence>
        </div>
    );
}
