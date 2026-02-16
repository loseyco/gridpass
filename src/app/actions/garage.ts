'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getGarage(userId: string) {
    const supabase = await createClient()

    const { data: vehicles } = await supabase
        .from('vehicles')
        .select('*')
        .eq('owner_id', userId)

    const { data: tools } = await supabase
        .from('tools')
        .select('*')
        .eq('owner_id', userId)

    return {
        vehicles: vehicles || [],
        tools: tools || []
    }
}

export async function getVehicle(id: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .single()
    return data
}

export async function addVehicle(data: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('vehicles')
        .insert({
            ...data,
            owner_id: user.id
        })

    if (error) throw error
    revalidatePath('/dashboard/profile')
    return { success: true }
}

export async function updateVehicle(id: string, data: any) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('vehicles')
        .update(data)
        .eq('id', id)

    if (error) throw error
    revalidatePath('/dashboard/profile')
    return { success: true }
}

export async function deleteVehicle(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id)

    if (error) throw error
    revalidatePath('/dashboard/profile')
    return { success: true }
}

export async function addTool(data: any) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('tools')
        .insert({
            ...data,
            owner_id: user.id
        })

    if (error) throw error
    revalidatePath('/dashboard/profile')
    return { success: true }
}

export async function updateTool(id: string, data: any) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('tools')
        .update(data)
        .eq('id', id)

    if (error) throw error
    revalidatePath('/dashboard/profile')
    return { success: true }
}

export async function deleteTool(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('tools')
        .delete()
        .eq('id', id)

    if (error) throw error
    revalidatePath('/dashboard/profile')
    return { success: true }
}
