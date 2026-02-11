'use client';

import { useEffect, useState } from 'react';
import { getNotifications, markAllNotificationsAsRead } from '@/app/actions/notifications';
import { formatDistanceToNow } from 'date-fns';
import { Bell, Check, Info, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function NotificationsWidget() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadNotifications();
    }, []);

    async function loadNotifications() {
        setLoading(true);
        const data = await getNotifications();
        // Limit to 5 for widget
        setNotifications(data.slice(0, 5));
        setLoading(false);
    }

    async function handleMarkRead() {
        await markAllNotificationsAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'alert': return <AlertTriangle className="w-4 h-4 text-red-500" />;
            case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
            default: return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    if (loading) return null;
    if (notifications.length === 0) return null;

    return (
        <div className="bg-neutral-900 border border-white/5 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <Bell className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-white">Notifications</h3>
                    </div>
                </div>
                {notifications.some(n => !n.is_read) && (
                    <button
                        onClick={handleMarkRead}
                        className="text-xs text-neutral-400 hover:text-white transition-colors"
                    >
                        Mark all read
                    </button>
                )}
            </div>

            <div className="space-y-3">
                {notifications.map((notification) => (
                    <div
                        key={notification.id}
                        className={`
                            relative p-3 rounded-lg border transition-all duration-200 flex items-start gap-3
                            ${notification.is_read
                                ? 'bg-neutral-950/30 border-white/5 opacity-75'
                                : 'bg-neutral-800 border-indigo-500/30 shadow-lg shadow-indigo-900/10'
                            }
                        `}
                    >
                        <div className={`pt-0.5 ${notification.is_read ? 'opacity-50' : ''}`}>
                            {getIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <p className={`text-sm font-medium ${notification.is_read ? 'text-neutral-400' : 'text-white'}`}>
                                    {notification.title}
                                </p>
                                <span className="text-[10px] text-neutral-600 whitespace-nowrap ml-2">
                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                </span>
                            </div>
                            <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                                {notification.message}
                            </p>
                            {notification.link && (
                                <Link
                                    href={notification.link}
                                    className="block mt-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                                >
                                    View Details &rarr;
                                </Link>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 pt-4 border-t border-white/5 text-center">
                <Link href="/admin/notifications" className="text-xs text-neutral-500 hover:text-white transition-colors">
                    View All Notifications
                </Link>
            </div>
        </div>
    );
}
