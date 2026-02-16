'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type Organization = {
    id: string
    name: string
    type: 'shop' | 'team' | 'club' | 'track' | 'service'
    description?: string
    location?: string
    website?: string
    contact_email?: string
    logo_url?: string
    claimed_by?: string
    status: 'active' | 'pending_claim' | 'verified' | 'archived'
    lead_status?: 'prospect' | 'contacted' | 'interested' | 'client' | 'rejected'
    notes?: string
    slug?: string
    site_enabled?: boolean
    site_template?: string
    site_schema?: any
    latitude?: number
    longitude?: number
}

export async function getOrganizations(filter?: {
    type?: string,
    search?: string,
    site_enabled?: boolean,
    bounds?: { north: number, south: number, east: number, west: number }
}) {
    const supabase = await createClient()

    let query = supabase
        .from('organizations')
        .select('*')
        .in('status', ['active', 'verified', 'pending_claim'])
        .order('created_at', { ascending: false })

    if (filter?.type) {
        query = query.eq('type', filter.type)
    }

    if (filter?.search) {
        query = query.ilike('name', `%${filter.search}%`)
    }

    if (filter?.site_enabled !== undefined) {
        query = query.eq('site_enabled', filter.site_enabled)
    }

    if (filter?.bounds) {
        query = query
            .gte('latitude', filter.bounds.south)
            .lte('latitude', filter.bounds.north)
            .gte('longitude', filter.bounds.west)
            .lte('longitude', filter.bounds.east)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching organizations:', error)
        return []
    }

    return data as Organization[]
}

export async function createOrganization(formData: FormData) {
    const supabase = await createClient()

    // Verify auth (optional: check if admin)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('Unauthorized')
    }

    const name = formData.get('name') as string
    const type = formData.get('type') as string
    const location = formData.get('location') as string
    const website = formData.get('website') as string
    const description = formData.get('description') as string

    const { data: orgData, error } = await supabase.from('organizations').insert({
        name,
        type,
        location,
        website,
        description,
        status: 'active',
        claimed_by: user.id // Auto-claim for creator
    })
        .select() // Return the created org
        .single()

    if (error) {
        console.error('Error creating organization:', error)
        throw new Error('Failed to create organization')
    }

    revalidatePath('/map')
    return { success: true, orgId: orgData.id }
}

export async function claimOrganization(orgId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Must be logged in to claim')

    // Check if already claimed
    const { data: org } = await supabase
        .from('organizations')
        .select('claimed_by')
        .eq('id', orgId)
        .single()

    if (org?.claimed_by) throw new Error('Already claimed')

    // Update to pending_claim
    const { error } = await supabase
        .from('organizations')
        .update({
            claimed_by: user.id,
            status: 'pending_claim'
        })
        .eq('id', orgId)

    if (error) throw new Error('Failed to claim')

    revalidatePath('/map')
    return { success: true }
}

export async function updateOrganizationStatus(id: string, status: string) {
    const supabase = await createClient()
    // Verify admin/owner
    const { error } = await supabase
        .from('organizations')
        .update({ lead_status: status })
        .eq('id', id)

    if (error) throw error
    revalidatePath('/admin/orgs')
    revalidatePath('/map')
}

export async function updateOrganizationNotes(id: string, notes: string) {
    const supabase = await createClient()
    // Verify admin/owner
    const { error } = await supabase
        .from('organizations')
        .update({ notes: notes })
        .eq('id', id)

    if (error) throw error
    revalidatePath('/admin/orgs')
}

export async function updateOrganizationLocation(id: string, lat: number, lng: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Verify ownership
    const { data: org } = await supabase
        .from('organizations')
        .select('claimed_by')
        .eq('id', id)
        .single()

    if (!org || org.claimed_by !== user.id) {
        throw new Error('Not authorized')
    }

    const { error } = await supabase
        .from('organizations')
        .update({ latitude: lat, longitude: lng })
        .eq('id', id)

    if (error) throw error
    revalidatePath('/map')
    revalidatePath(`/biz/${id}`) // In case it's used there
}

export async function getOrganizationBySlug(slug: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('slug', slug)
        .single()

    if (error) {
        console.error('Error fetching organization:', error)
        return null
    }

    return data as Organization
}

export async function updateOrganizationSite(orgId: string, updates: {
    site_schema?: object
    site_template?: string
    site_enabled?: boolean
}) {
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
        throw new Error('Not authorized to edit this organization')
    }

    const { error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', orgId)

    if (error) throw error

    revalidatePath(`/biz/*`)
    revalidatePath(`/studio/site/${orgId}`)

    return { success: true }
}

