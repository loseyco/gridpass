'use client';
import { motion } from 'framer-motion';

const CATEGORIES = ['HEADLINES', 'F1', 'NASCAR', 'INDYCAR', 'SIM RACING', 'AUTOMOTIVE'];

export default function DailyBriefingHeader({ activeCategory = 'HEADLINES' }: { activeCategory?: string }) {
    return (
        <div className="w-full h-20 bg-black border-b-4 border-red-600 flex items-center justify-between px-12 shrink-0 relative z-50 shadow-2xl">
            {/* Logo Area */}
            <div className="flex flex-col leading-none">
                <div className="text-3xl font-black italic tracking-tighter text-white">
                    GRID<span className="text-red-600">PASS</span>
                </div>
                <div className="text-xs font-bold text-slate-400 tracking-[0.2em] uppercase">
                    Daily Briefing
                </div>
            </div>

            {/* Manage Button (Visual Only) */}
            <div className="ml-8 px-4 py-1 border border-red-900 bg-red-950/30 text-red-500 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                Live Feed
            </div>

            <div className="flex-1"></div>

            {/* Categories */}
            <div className="flex items-center gap-8 h-full">
                {CATEGORIES.map((cat) => (
                    <div key={cat} className="relative h-full flex items-center px-2">
                        <span className={`text-sm font-bold tracking-widest uppercase transition-colors duration-300 ${activeCategory === cat ? 'text-white' : 'text-slate-500'
                            }`}>
                            {cat}
                        </span>
                        {activeCategory === cat && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-1 bg-red-600"
                                initial={false}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
