'use client';
import { useState } from 'react';
import { Users, Eye, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function Leaderboard({ initialData }: { initialData: any }) {
    const [activeTab, setActiveTab] = useState<'invites' | 'views' | 'time'>('invites');

    const tabs = [
        { id: 'invites', label: 'Top Recruiters', icon: Users },
        { id: 'views', label: 'Most Viewed Profiles', icon: Eye },
        { id: 'time', label: 'Most Time on Grid', icon: Clock }
    ];

    const currentList = activeTab === 'invites' ? initialData.inviteLeaderboard
        : activeTab === 'views' ? initialData.viewsLeaderboard
            : initialData.timeLeaderboard;

    return (
        <div>
            {/* Tabs */}
            <div className="flex space-x-2 mb-8 bg-neutral-900/50 p-1 rounded-xl w-fit border border-white/5">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id
                                ? 'bg-neutral-800 text-white shadow-sm'
                                : 'text-neutral-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="bg-neutral-900/50 border border-white/5 rounded-2xl overflow-hidden">
                {currentList.length === 0 ? (
                    <div className="p-12 text-center text-neutral-500">
                        No data yet. Start competing!
                    </div>
                ) : (
                    <div className="divide-y divide-white/5">
                        {currentList.map((user: any, index: number) => (
                            <div key={user.user_id || user.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${index === 0 ? 'bg-yellow-500/10 text-yellow-500' :
                                            index === 1 ? 'bg-zinc-400/10 text-zinc-400' :
                                                index === 2 ? 'bg-amber-700/10 text-amber-700' :
                                                    'text-neutral-500'
                                        }`}>
                                        {index + 1}
                                    </div>
                                    <Link href={`/u/${user.username}`} className="flex items-center gap-3 group">
                                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-neutral-800 border border-white/10">
                                            {user.avatar_url ? (
                                                <Image src={user.avatar_url} alt={user.username || 'User'} fill className="object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs text-neutral-500">
                                                    {(user.username?.[0] || 'U').toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium text-white group-hover:text-indigo-400 transition-colors">
                                                {user.full_name || user.username || 'Unknown User'}
                                            </div>
                                            <div className="text-xs text-neutral-500">@{user.username || 'user'}</div>
                                        </div>
                                    </Link>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-white tabular-nums">
                                        {activeTab === 'invites' && (user.invite_count || 0)}
                                        {activeTab === 'views' && (user.view_count || 0)}
                                        {activeTab === 'time' && formatDuration(user.total_time_seconds || 0)}
                                    </div>
                                    <div className="text-xs text-neutral-500 uppercase tracking-wider">
                                        {activeTab === 'invites' && 'Invites'}
                                        {activeTab === 'views' && 'Views'}
                                        {activeTab === 'time' && 'Hours'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function formatDuration(seconds: number) {
    if (!seconds) return '0h';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
}
