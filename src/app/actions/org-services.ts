'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type Service = {
    id: string
    org_id: string
    name: string
    description?: string
    price: number
    currency?: string
    features?: any // JSONB
    display_order?: number
    is_featured?: boolean
    created_at?: string
}

export async function getServices(orgId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('os_org_services')
        .select('*')
        .eq('org_id', orgId)
        .order('price', { ascending: true })

    if (error) {
        console.error('Error fetching services:', error)
        return []
    }

    return data as Service[]
}

export async function createService(orgId: string, formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Verify ownership (simplified)
    const { data: org } = await supabase.from('organizations').select('claimed_by').eq('id', orgId).single()
    if (!org || org.claimed_by !== user.id) throw new Error('Unauthorized')

    const name = formData.get('name') as string
    const price = parseFloat(formData.get('price') as string)
    const description = formData.get('description') as string

    if (!name || isNaN(price)) throw new Error('Invalid input')

    const { error } = await supabase.from('os_org_services').insert({
        org_id: orgId,
        name,
        price,
        description
    })

    if (error) throw new Error('Failed to create service')

    revalidatePath(`/manage/${orgId}/services`)
    revalidatePath(`/biz/${orgId}`) // Assuming slug revalidation might be needed if using ID in path, but usually it's separate
    return { success: true }
}

export async function deleteService(orgId: string, serviceId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Verify ownership
    const { data: org } = await supabase.from('organizations').select('claimed_by').eq('id', orgId).single()
    if (!org || org.claimed_by !== user.id) throw new Error('Unauthorized')

    const { error } = await supabase.from('os_org_services').delete().eq('id', serviceId)

    if (error) throw new Error('Failed to delete service')

    revalidatePath(`/manage/${orgId}/services`)
    return { success: true }
}
