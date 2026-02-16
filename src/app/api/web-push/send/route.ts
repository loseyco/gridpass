import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import webPush from 'web-push'


export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
        console.error('VAPID keys are missing');
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
        webPush.setVapidDetails(
            process.env.NEXT_PUBLIC_VAPID_SUBJECT || 'mailto:support@gridpass.app',
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
            process.env.VAPID_PRIVATE_KEY
        );

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        // For now, allow any logged-in user to send a test notification to themselves
        // In production, this should be restricted to admin or triggered by system events
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { userId, title, message, url } = await request.json()

        // If userId is provided and different from current user, check admin status (TODO)
        // For now, default to sending to the current user if no userId provided
        const targetUserId = userId || user.id

        // Fetch subscriptions for the user
        const { data: subscriptions, error } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', targetUserId)

        if (error || !subscriptions || subscriptions.length === 0) {
            return NextResponse.json({ error: 'No subscriptions found for user' }, { status: 404 })
        }

        const payload = JSON.stringify({
            title: title || 'GridPass Notification',
            body: message || 'You have a new notification',
            url: url || '/dashboard',
        })

        // Send to all user's subscriptions (phone, desktop, etc.)
        const results = await Promise.allSettled(
            subscriptions.map(async (sub) => {
                try {
                    await webPush.sendNotification(
                        {
                            endpoint: sub.endpoint,
                            keys: sub.keys,
                        },
                        payload
                    )
                    return { success: true, id: sub.id }
                } catch (error: any) {
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        // Subscription is gone, delete it from DB
                        await supabase.from('push_subscriptions').delete().eq('id', sub.id)
                        return { success: false, id: sub.id, error: 'Expired subscription removed' }
                    }
                    throw error
                }
            })
        )

        const successful = results.filter((r) => r.status === 'fulfilled').length

        return NextResponse.json({
            success: true,
            sent: successful,
            total: subscriptions.length,
        })
    } catch (error) {
        console.error('Error sending notification:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
