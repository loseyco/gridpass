import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const subscription = await request.json()

        if (!subscription) {
            return NextResponse.json({ error: 'No subscription provided' }, { status: 400 })
        }

        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if subscription already exists for this endpoint
        const { data: existing } = await supabase
            .from('push_subscriptions')
            .select('id')
            .eq('endpoint', subscription.endpoint)
            .single()

        if (existing) {
            // Update existing if needed (though usually endpoint is unique enough)
            return NextResponse.json({ success: true, message: 'Subscription updated' })
        }

        const { error } = await supabase.from('push_subscriptions').insert({
            user_id: user.id,
            endpoint: subscription.endpoint,
            keys: subscription.keys,
        })

        if (error) {
            console.error('Error saving subscription:', error)
            return NextResponse.json({ error: 'Database error' }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error in subscribe route:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
