'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { Activity, UserPlus, Zap } from 'lucide-react';

interface EventLog {
    id: string;
    message: string;
    type: 'view' | 'signup' | 'action';
    timestamp: Date;
}

export default function RealtimeTicker() {
    const [events, setEvents] = useState<EventLog[]>([]);
    const [stats, setStats] = useState({ activeUsers: 0 });

    useEffect(() => {
        const supabase = createClient();

        // Subscribe to Page Views
        const viewChannel = supabase
            .channel('realtime-analytics')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'analytics_events'
                },
                (payload: any) => {
                    const newEvent: EventLog = {
                        id: payload.new.id,
                        message: `Page View: ${payload.new.path}`, // Simplified
                        type: 'view',
                        timestamp: new Date()
                    };
                    addEvent(newEvent);
                }
            )
            .subscribe();

        // Subscribe to New Users
        const userChannel = supabase
            .channel('realtime-users')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'profiles'
                },
                (payload: any) => {
                    const newEvent: EventLog = {
                        id: payload.new.id,
                        message: `New User Joined: ${payload.new.full_name || 'Anonymous'}`,
                        type: 'signup',
                        timestamp: new Date()
                    };
                    addEvent(newEvent);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(viewChannel);
            supabase.removeChannel(userChannel);
        };
    }, []);

    const addEvent = (event: EventLog) => {
        setEvents((prev) => [event, ...prev].slice(0, 5)); // Keep last 5
    };

    return (
        <div className="bg-neutral-900 border border-white/5 rounded-xl p-6 mb-8 print:hidden">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                Live Activity Feed
            </h3>

            <div className="space-y-3">
                {events.length === 0 ? (
                    <div className="text-sm text-neutral-600 italic py-2">
                        Listening for live events...
                    </div>
                ) : (
                    events.map((e) => (
                        <div key={e.id} className="flex items-center gap-3 animate-in slide-in-from-left-2 fade-in duration-300">
                            <div className={`w-2 h-2 rounded-full ${e.type === 'signup' ? 'bg-emerald-500' : 'bg-indigo-500'} animate-pulse`} />
                            <div className="text-sm font-mono text-neutral-300">
                                <span className="opacity-50 mr-2">{e.timestamp.toLocaleTimeString()}</span>
                                {e.message}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
