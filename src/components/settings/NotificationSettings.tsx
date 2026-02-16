'use client'

import { usePushNotifications } from '@/hooks/usePushNotifications'
import { useState } from 'react'

export default function NotificationSettings() {
    const { isSupported, subscription, subscribe, unsubscribe, loading, error } = usePushNotifications()

    if (loading) {
        return <div className="p-4 text-[#888] text-sm">Loading notification settings...</div>
    }

    if (!isSupported) {
        return (
            <div className="p-4 border border-red-900/20 bg-red-900/10 rounded-lg">
                <p className="text-red-400 text-sm">Push notifications are not supported in this browser.</p>
            </div>
        )
    }

    return (
        <div className="bg-[#111] border border-[#333] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-medium text-white">Push Notifications</h3>
                    <p className="text-sm text-[#888]">Receive alerts about bookings, messages, and updates.</p>
                </div>
                <button
                    onClick={subscription ? unsubscribe : subscribe}
                    disabled={loading}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${subscription
                        ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20'
                        : 'bg-white text-black hover:bg-gray-200'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {loading ? 'Processing...' : subscription ? 'Disable Notifications' : 'Enable Notifications'}
                </button>
            </div>

            {error && (
                <div className="mt-4 p-3 border border-red-900/20 bg-red-900/10 rounded-lg text-red-400 text-sm">
                    Error: {error}
                </div>
            )}

            {subscription && (
                <div className="mt-4 p-3 border border-green-900/20 bg-green-900/10 rounded-lg text-green-400 text-sm">
                    <p>✓ Notifications are enabled for this device.</p>
                    <button
                        onClick={async () => {
                            try {
                                console.log('Sending test notification...');
                                await fetch('/api/web-push/send', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        title: 'Test Notification',
                                        message: 'If you see this, push notifications are working!',
                                        url: '/settings',
                                    })
                                })
                            } catch (e: any) {
                                console.error('Failed to send test notification', e)
                            }
                        }}
                        className="mt-2 text-xs underline hover:text-green-300"
                    >
                        Send Test Notification
                    </button>
                </div>
            )}

            <p className="text-xs text-[#666] mt-4">
                Note: You need to enable notifications on each device you want to receive alerts on.
            </p>
        </div>
    )
}
