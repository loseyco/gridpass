'use client';

import { useEffect, useState } from 'react';
import { getNotifications, markAllNotificationsAsRead } from '@/app/actions/notifications';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Check, Info, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function AdminNotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, []);

    async function loadNotifications() {
        setLoading(true);
        const data = await getNotifications();
        setNotifications(data);
        setLoading(false);
    }

    async function handleMarkRead() {
        await markAllNotificationsAsRead();
        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        // Reload to be sure
        loadNotifications();
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'alert': return <AlertTriangle className="w-5 h-5 text-red-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-neutral-800 rounded-xl border border-white/5">
                        <Bell className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Notifications</h1>
                        <p className="text-neutral-400">Updates and alerts for your account</p>
                    </div>
                </div>

                {notifications.some(n => !n.is_read) && (
                    <button
                        onClick={handleMarkRead}
                        className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors text-sm font-medium border border-white/5"
                    >
                        <Check className="w-4 h-4" />
                        Mark all read
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-12 text-neutral-500">Loading notifications...</div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-12 bg-neutral-900/50 rounded-xl border border-white/5 border-dashed">
                        <Bell className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
                        <h3 className="text-lg font-medium text-white">All caught up</h3>
                        <p className="text-neutral-500">You verify have no new notifications.</p>
                    </div>
                ) : (
                    notifications.map((notification) => (
                        <div
                            key={notification.id}
                            className={`
                                relative p-4 rounded-xl border transition-all duration-200
                                ${notification.is_read
                                    ? 'bg-neutral-900/30 border-white/5 opacity-75'
                                    : 'bg-neutral-900 border-indigo-500/30 shadow-lg shadow-indigo-900/10'
                                }
                            `}
                        >
                            {!notification.is_read && (
                                <span className="absolute top-4 right-4 text-xs font-bold text-indigo-400 px-2 py-1 bg-indigo-500/10 rounded-full">
                                    NEW
                                </span>
                            )}

                            <div className="flex items-start gap-4">
                                <div className={`pt-1 ${notification.is_read ? 'opacity-50' : ''}`}>
                                    {getIcon(notification.type)}
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-bold text-lg mb-1 ${notification.is_read ? 'text-neutral-300' : 'text-white'}`}>
                                        {notification.title}
                                    </h3>
                                    <p className="text-neutral-400 leading-relaxed mb-3">
                                        {notification.message}
                                    </p>

                                    <div className="flex items-center gap-4 text-xs">
                                        <span className="text-neutral-600 font-mono">
                                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                        </span>

                                        {notification.link && (
                                            <Link
                                                href={notification.link}
                                                className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
                                            >
                                                View Details
                                                <ExternalLink className="w-3 h-3" />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
