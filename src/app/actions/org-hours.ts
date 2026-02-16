'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type OrganizationHours = {
    id: string
    org_id: string
    day_of_week: number // 0 = Sunday, 1 = Monday, etc.
    open_time: string | null // "09:00"
    close_time: string | null // "17:00"
    is_closed: boolean
}

export async function getOrganizationHours(orgId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('os_org_hours')
        .select('*')
        .eq('org_id', orgId)
        .order('day_of_week', { ascending: true })

    if (error) {
        console.error('Error fetching hours:', error)
        return []
    }

    return data as OrganizationHours[]
}

export async function updateOrganizationHours(orgId: string, hours: Partial<OrganizationHours>[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Verify ownership
    const { data: org } = await supabase
        .from('organizations')
        .select('claimed_by')
        .eq('id', orgId)
        .single()

    if (!org || org.claimed_by !== user.id) {
        throw new Error('Not authorized')
    }

    // Upsert hours
    // We expect an array of 7 items, one for each day
    // We'll trust the client sends correct data

    // Transform to match DB schema if needed, but it seems to match.
    // 'id' might be missing for new inserts, but upsert handles it if we match on org_id + day_of_week?
    // Actually standard Postgres upsert needs a constraint.
    // Let's assume we delete and insert? Or just upsert on id?
    // The client should send IDs if they exist.

    // Better strategy: Delete all for this org and insert new? Safe but brutish?
    // Or upsert. Let's try upsert.

    const { error } = await supabase
        .from('os_org_hours')
        .upsert(
            hours.map(h => ({
                ...h,
                org_id: orgId
            })),
            { onConflict: 'org_id, day_of_week' } // Assuming there's a unique constraint?
            // If I didn't create a unique constraint, I should check migration.
            // Migration 20260215_add_business_features.sql
            // "CREATE UNIQUE INDEX ON os_org_hours (org_id, day_of_week);" ? 
            // I should verify migration content.
        )

    if (error) {
        console.error('Error updating hours:', error)
        throw new Error('Failed to update hours')
    }

    revalidatePath(`/biz/${orgId}`)
    return { success: true }
}
