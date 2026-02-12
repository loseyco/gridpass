'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import {
    Activity,
    User,
    Car,
    Users,
    Briefcase,
    AlertTriangle,
    LogIn,
    LogOut,
    UserPlus,
    Monitor,
    Smartphone,
    Globe,
    Search
} from 'lucide-react';

type LogEvent = {
    id: string;
    event_type: string;
    user_id: string | null;
    path: string;
    created_at: string;
    meta: {
        ip?: string;
        country?: string;
        city?: string;
        device_type?: string;
        user_agent?: string;
        email?: string; // Sometimes captured in auth events
        [key: string]: any;
    };
    user?: {
        email: string;
        full_name: string;
    };
};

export default function LiveLogPage() {
    const [events, setEvents] = useState<LogEvent[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [filter, setFilter] = useState('');
    const supabase = createClient();

    useEffect(() => {
        // Initial Fetch
        const fetchRecent = async () => {
            const { data } = await supabase
                .from('analytics_events')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (data) setEvents(data as LogEvent[]);
        };

        fetchRecent();

        // Real-time Subscription
        const channel = supabase
            .channel('live-logs')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'analytics_events'
                },
                (payload) => {
                    const newEvent = payload.new as LogEvent;
                    setEvents((prev) => [newEvent, ...prev].slice(0, 100)); // Keep last 100
                }
            )
            .subscribe((status) => {
                setIsConnected(status === 'SUBSCRIBED');
            });


        // Force re-render every second to update "time ago" styles
        const interval = setInterval(() => {
            setEvents(prev => [...prev]); // Trigger re-render
        }, 1000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(interval);
        };
    }, []);

    const getIcon = (type: string) => {
        if (type.startsWith('auth.login')) return <LogIn className="text-emerald-400" />;
        if (type.startsWith('auth.signup')) return <UserPlus className="text-emerald-500" />;
        if (type.startsWith('auth.logout')) return <LogOut className="text-neutral-400" />;
        if (type.startsWith('car.')) return <Car className="text-blue-400" />;
        if (type.startsWith('team.')) return <Users className="text-indigo-400" />;
        if (type.startsWith('job.')) return <Briefcase className="text-amber-400" />;
        if (type.startsWith('error')) return <AlertTriangle className="text-red-500" />;
        if (type === 'page_view') return <Activity className="text-neutral-600" />;
        return <Activity className="text-neutral-400" />;
    };

    const filteredEvents = events.filter(e =>
        filter === '' ||
        e.event_type.includes(filter) ||
        e.path.includes(filter) ||
        e.user_id?.includes(filter)
    );

    return (
        <div className="min-h-screen bg-black text-neutral-200 p-6 font-mono">
            <header className="mb-8 flex items-center justify-between border-b border-neutral-800 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Activity className="text-red-500" />
                        Live User Activity
                    </h1>
                    <p className="text-xs text-neutral-500 mt-1">
                        Real-time stream of all system events.
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-xs">
                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        {isConnected ? 'LIVE' : 'CONNECTING...'}
                    </div>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-2 top-1.5 text-neutral-500" />
                        <input
                            type="text"
                            placeholder="Filter events..."
                            className="bg-neutral-900 border border-neutral-800 rounded pl-8 pr-2 py-1 text-sm focus:outline-none focus:border-neutral-700 w-64"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <div className="space-y-2">
                {filteredEvents.map((event) => (
                    <div
                        key={event.id}
                        className={`group flex items-start gap-4 p-3 rounded-lg border transition-all duration-500 ${(() => {
                            const ageInSeconds = (new Date().getTime() - new Date(event.created_at).getTime()) / 1000;
                            if (ageInSeconds < 60) return 'border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.1)]'; // < 1 min: Green
                            if (ageInSeconds < 600) return 'border-yellow-500/30 bg-yellow-500/5'; // < 10 min: Yellow
                            return 'border-neutral-800/50 bg-neutral-900/20 hover:bg-neutral-900/50 opacity-60 hover:opacity-100'; // > 10 min: Faded Default
                        })()}`}
                    >
                        <div className="mt-1">
                            {getIcon(event.event_type)}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-sm font-bold ${event.event_type.includes('error') ? 'text-red-400' :
                                    event.event_type.includes('auth') ? 'text-emerald-400' : 'text-white'
                                    }`}>
                                    {event.event_type}
                                </span>
                                <span className="text-xs text-neutral-500 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                                    {event.path}
                                </span>
                                <span className="text-xs text-neutral-600 ml-auto whitespace-nowrap">
                                    {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-neutral-400">
                                <div className="flex items-center gap-2">
                                    <User className="w-3 h-3" />
                                    <span className="truncate">{event.user_id || 'Anonymous'}</span>
                                    {event.meta?.email && <span className="text-neutral-500">({event.meta.email})</span>}
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1" title="Location">
                                        <Globe className="w-3 h-3" />
                                        <span>{event.meta?.city ? `${event.meta.city}, ` : ''}{event.meta?.country || 'Unknown'}</span>
                                    </div>
                                    <div className="flex items-center gap-1" title="Device">
                                        {event.meta?.device_type === 'mobile' ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                                        <span>{event.meta?.device_type || 'Desktop'}</span>
                                    </div>
                                    <div className="flex items-center gap-1" title="IP Address">
                                        <span className="font-mono text-neutral-600">{event.meta?.ip}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Detailed JSON View on Hover/Focus */}
                            <div className="hidden group-hover:block mt-2 pt-2 border-t border-neutral-800">
                                <pre className="text-[10px] text-neutral-500 overflow-x-auto">
                                    {JSON.stringify(event.meta, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>
                ))}

                {filteredEvents.length === 0 && (
                    <div className="text-center py-12 text-neutral-600">
                        No events found waiting for activity...
                    </div>
                )}
            </div>
        </div>
    );
}
