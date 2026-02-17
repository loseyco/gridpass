'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendStewardsWelcomeEmail } from '@/lib/email'
import { sendPushNotification } from '@/lib/push'

export async function submitIncident(formData: FormData) {
    const supabase = await createClient()

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return { error: 'You must be logged in to submit an incident.' }
    }

    // 2. Validate Input
    const title = formData.get('title') as string
    const video_url = formData.get('video_url') as string
    const description = formData.get('description') as string
    const sim_title = formData.get('sim_title') as string

    if (!title || !video_url || !sim_title) {
        return { error: 'Missing required fields.' }
    }

    if (!video_url.includes('youtu')) {
        return { error: 'Please provide a valid YouTube link.' }
    }

    // 3. Database Insert
    const { data: incident, error } = await supabase
        .from('os_stewards_incidents')
        .insert({
            title,
            video_url,
            description,
            sim_title,
            user_id: user.id
        })
        .select()
        .single()

    if (error) {
        console.error('Failed to submit incident:', error)
        return { error: 'Failed to submit incident. Please try again.' }
    }

    // 4. Send Welcome Email (Non-blocking but awaited for simplicity in server action)
    // 4. Send Welcome Email (Non-blocking but awaited for simplicity in server action)
    if (user.email) {
        // Send email in background ideally, but await here to ensure it tries
        await sendStewardsWelcomeEmail(user.email, title, incident.id)

        // Send Push Notification
        const { data: subscription } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (subscription) {
            await sendPushNotification(subscription, {
                title: 'Incident Submitted',
                body: `Your incident "${title}" has been submitted to the Stewards Room.`,
                url: `/sim-racing/stewards/${incident.id}`
            });
        }
    }

    revalidatePath('/sim-racing/stewards')
    return { success: true, incidentId: incident.id }
}
