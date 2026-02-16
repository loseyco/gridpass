'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitBooking(data: any) {
    const supabase = await createClient()

    const bookingData = {
        org_id: data.org_id,
        service_id: data.service_id || null,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone || null,
        preferred_date: data.preferred_date || null,
        preferred_time: data.preferred_time || null,
        vehicle_info: data.vehicle_info || {},
        message: data.message || null,
        status: 'pending'
    }

    const { data: booking, error } = await supabase
        .from('os_org_bookings')
        .insert(bookingData)
        .select()
        .single()

    if (error) {
        console.error('Error creating booking:', error)
        throw new Error('Failed to create booking')
    }

    // TODO: Send email notification to business owner
    console.log('New booking created:', booking)

    return { success: true, booking }
}

export async function getBookingsForOrganization(orgId: string) {
    const supabase = await createClient()

    const { data: bookings, error } = await supabase
        .from('os_org_bookings')
        .select('*, os_org_services(name, price)')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching bookings:', error)
        return []
    }

    return bookings
}

export async function updateBookingStatus(bookingId: string, status: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('os_org_bookings')
        .update({ status })
        .eq('id', bookingId)

    if (error) {
        console.error('Error updating booking:', error)
        throw new Error('Failed to update booking')
    }

    revalidatePath('/dashboard')
    return { success: true }
}
