'use client';

import { useState } from 'react';
import { Plus, Zap, Loader2, Check } from 'lucide-react';
import { quickLogEvent } from './actions';
import { useRouter } from 'next/navigation';

export default function QuickLogWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleQuickLog = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        const formData = new FormData(e.currentTarget);

        try {
            await quickLogEvent(formData);
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setIsOpen(false);
                router.refresh();
            }, 1000);
        } catch (err) {
            console.error(err);
        } finally {
            setIsSaving(false);
        }
    };

    if (success) {
        return (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl flex flex-col items-center justify-center text-center h-full min-h-[180px]">
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mb-2 animate-bounce">
                    <Check className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-emerald-500">Logged!</h3>
                <p className="text-sm text-emerald-200/60">Experience added to profile.</p>
            </div>
        );
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full h-full min-h-[180px] bg-gradient-to-br from-indigo-900/20 to-neutral-900 border border-indigo-500/30 p-6 rounded-2xl flex flex-col items-center justify-center text-center hover:border-indigo-500/60 transition-all group"
            >
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/30">
                    <Plus className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">Log Today's Event</h3>
                <p className="text-sm text-neutral-400 max-w-[200px]">At a track? Quickly add it to your career timeline.</p>
            </button>
        );
    }

    return (
        <div className="bg-neutral-900 border border-white/10 p-6 rounded-2xl relative animate-fade-in shadow-xl">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Quick Log
                </h3>
                <button onClick={() => setIsOpen(false)} className="text-xs text-neutral-500 hover:text-white">Cancel</button>
            </div>

            <form onSubmit={handleQuickLog} className="space-y-3">
                <div>
                    <input name="event_name" required placeholder="Event Name (e.g. Indy 500)" className="w-full bg-black border border-white/10 p-2 rounded text-sm text-white focus:border-indigo-500 outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <input name="organization" required placeholder="Team / Org" className="w-full bg-black border border-white/10 p-2 rounded text-sm text-white focus:border-indigo-500 outline-none" />
                    <input name="vehicle_info" placeholder="Car (e.g. GT3)" className="w-full bg-black border border-white/10 p-2 rounded text-sm text-white focus:border-indigo-500 outline-none" />
                </div>

                {/* Hidden title default */}
                <input type="hidden" name="title" value="Participant" />
                {/* Or allow user to type role if they want, but keep it simple for speed */}

                <button disabled={isSaving} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded text-sm flex items-center justify-center gap-2 transition-colors">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add to Profile'}
                </button>
                <p className="text-[10px] text-center text-neutral-500">Adds an entry for {new Date().toLocaleDateString()}</p>
            </form>
        </div>
    );
}
