'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Facebook, FileText, Smartphone, ArrowRight, QrCode, User, Star } from 'lucide-react';

export default function PromoScene() {
    const [promos, setPromos] = useState<any[]>([]);
    const [currentPromoIndex, setCurrentPromoIndex] = useState(0);

    useEffect(() => {
        // Fetch real ads data
        fetch('/api/live/data')
            .then(res => res.json())
            .then(data => {
                if (data.ads && data.ads.length > 0) {
                    setPromos(data.ads);
                } else {
                    // Fallback to internal promos if no paid ads
                    setPromos([
                        {
                            id: 'facebook',
                            headline: 'JOIN THE COMMUNITY',
                            subtitle: 'Connect with fellow racers on Facebook',
                            icon: Facebook,
                            color: 'bg-blue-600',
                            textColor: 'text-blue-500',
                            cta: 'LuxeCorsaAutoSuites',
                            image_url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80'
                        },
                        {
                            id: 'resume',
                            headline: 'NEED A DRIVER?',
                            subtitle: 'Hire PJ Losey for your team',
                            icon: User,
                            color: 'bg-emerald-600',
                            textColor: 'text-emerald-500',
                            cta: 'gridpass.app/u/pjlosey',
                            image_url: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80'
                        }
                    ]);
                }
            })
            .catch(e => console.error("Ads fetch failed", e));
    }, []);

    useEffect(() => {
        if (promos.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentPromoIndex(prev => (prev + 1) % promos.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [promos]);

    if (promos.length === 0) return null;
    const promo = promos[currentPromoIndex];

    return (
        <div className="w-full h-full flex bg-slate-900 overflow-hidden relative">
            {/* LEFT: Visual */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={promo.id}
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -50, opacity: 0 }}
                    className="w-1/2 h-full relative"
                >
                    <img src={promo.image_url} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent"></div>

                    <div className="absolute inset-0 flex flex-col justify-center px-16">
                        <div className={`w-16 h-16 ${promo.color || 'bg-red-600'} rounded-2xl flex items-center justify-center mb-8 shadow-2xl skew-x-[-12deg]`}>
                            {promo.icon ? <promo.icon className="w-8 h-8 text-white skew-x-[12deg]" /> : <Star className="w-8 h-8 text-white skew-x-[12deg]" />}
                        </div>
                        <h2 className="text-6xl font-black text-white leading-tight italic uppercase tracking-tighter drop-shadow-xl mb-4">
                            {promo.headline}
                        </h2>
                        <p className={`text-2xl font-bold ${promo.textColor || 'text-slate-400'} uppercase tracking-widest`}>
                            {promo.subtitle || 'Official Partner'}
                        </p>
                    </div>

                </motion.div>
            </AnimatePresence>

            {/* Right: QR / CTA */}
            <div className="w-1/2 h-full bg-white flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

                <motion.div
                    key={promo.id + 'qr'}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="relative z-10 text-center"
                >
                    <div className="w-64 h-64 bg-slate-900 rounded-xl p-4 shadow-2xl mx-auto mb-8 rotate-3 transition-transform duration-500 hover:rotate-0">
                        {/* Mock QR Code */}
                        <div className="w-full h-full bg-white flex items-center justify-center overflow-hidden">
                            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${promo.cta}`} className="w-full h-full" />
                        </div>
                    </div>

                    <div className="bg-black text-white px-8 py-3 rounded-full text-xl font-bold tracking-widest uppercase shadow-xl">
                        SCAN TO VISIT
                    </div>
                    <div className="mt-4 text-slate-500 font-mono text-sm">
                        {promo.cta}
                    </div>
                </motion.div>
            </div>
        </div >
    );
}
