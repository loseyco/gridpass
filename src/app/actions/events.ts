'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type Event = {
    id: string
    title: string
    description?: string
    start_time: string
    end_time?: string
    location_name?: string
    address?: string
    city?: string
    state?: string
    type: 'social' | 'meetup' | 'track_day' | 'watch_party' | 'drinks'
    organizer_id: string
    attendees_count?: number
    is_attending?: boolean
}

export async function getEvents(filter?: { type?: string, search?: string }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let query = supabase
        .from('social_events')
        .select(`
            *,
            attendees:social_event_attendees(count),
            is_attending:social_event_attendees!inner(user_id)
        `)
        .order('start_time', { ascending: true })
        .gte('start_time', new Date().toISOString())

    if (filter?.type) {
        query = query.eq('type', filter.type)
    }

    if (filter?.search) {
        query = query.ilike('title', `%${filter.search}%`)
    }

    // This join logic is a bit tricky with `is_attending` filtering.
    // Simpler: fetch events then check attendance separately or rely on left join.
    // But supabase postgrest doesn't do "is_attending: true/false" easily without RPC or view.
    // Instead, I'll fetch events and if user logic is needed (for UI "Going" state),
    // I might just fetch all attendees or do a second query.
    // For now, let's keep it simple and just fetch events.

    const { data, error } = await supabase
        .from('social_events')
        .select('*')
        .order('start_time', { ascending: true })
        .gte('start_time', new Date().toISOString()) // Only future events

    if (error) {
        console.error('Error fetching events:', error)
        return []
    }

    // Enhance with attendance data if user is logged in
    const eventsWithStatus = await Promise.all(data.map(async (event) => {
        const { count } = await supabase
            .from('social_event_attendees')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', event.id)

        let isAttending = false
        if (user) {
            const { data: attendance } = await supabase
                .from('social_event_attendees')
                .select('status')
                .eq('event_id', event.id)
                .eq('user_id', user.id)
                .single()
            if (attendance) isAttending = true
        }

        return {
            ...event,
            attendees_count: count || 0,
            is_attending: isAttending
        }
    }))

    return eventsWithStatus as Event[]
}

export async function createEvent(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('Unauthorized')
    }

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const start_time = formData.get('start_time') as string
    const location_name = formData.get('location_name') as string
    const type = formData.get('type') as string

    const { error } = await supabase.from('social_events').insert({
        title,
        description,
        start_time,
        location_name,
        type,
        organizer_id: user.id
    })

    if (error) {
        console.error('Error creating event:', error)
        throw new Error('Failed to create event')
    }

    revalidatePath('/social')
    return { success: true }
}

export async function joinEvent(eventId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Must be logged in to join')

    // Check if already joined
    const { data: existing } = await supabase
        .from('social_event_attendees')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single()

    if (existing) {
        // Toggle off (Leave)
        const { error } = await supabase
            .from('social_event_attendees')
            .delete()
            .eq('event_id', eventId)
            .eq('user_id', user.id)

        if (error) throw new Error('Failed to leave event')
    } else {
        // Join
        const { error } = await supabase
            .from('social_event_attendees')
            .insert({
                event_id: eventId,
                user_id: user.id,
                status: 'going'
            })

        if (error) throw new Error('Failed to join event')
    }

    revalidatePath('/social')
    return { success: true }
}
