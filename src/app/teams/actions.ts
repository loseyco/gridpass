'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createTeam(formData: FormData) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('Not authenticated')
    }

    const name = formData.get('name') as string
    const slug = formData.get('slug') as string
    const description = formData.get('description') as string

    if (!name || !slug) {
        throw new Error('Name and slug are required')
    }

    // 1. Create Team
    const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
            name,
            slug,
            description,
            owner_id: user.id
        })
        .select()
        .single()

    if (teamError) {
        console.error('Error creating team:', teamError)
        throw new Error('Failed to create team: ' + teamError.message)
    }

    // 2. Add Owner as Team Member
    // Note: The RLS policy for insert on teams enforces owner_id = auth.uid()
    // We should also add the user to team_members immediately.
    // Although we could use a database trigger, explicit insertion is clearer here.

    const { error: memberError } = await supabase
        .from('team_members')
        .insert({
            team_id: team.id,
            user_id: user.id,
            role: 'owner',
            status: 'active'
        })

    if (memberError) {
        // If member creation fails, we should probably delete the team to avoid orphan records, 
        // or rely on a transaction if we were doing this in a stored procedure.
        // For MVP, we'll just log it.
        console.error('Error adding owner to team members:', memberError)
        // Attempt rollback (optional for MVP but good practice)
        await supabase.from('teams').delete().eq('id', team.id)
        throw new Error('Failed to join team as owner')
    }

    revalidatePath('/dashboard')
    redirect(`/team/${team.slug}/dashboard`)
}

export async function getTeam(slug: string) {
    const supabase = await createClient()
    const { data: team, error } = await supabase
        .from('teams')
        .select(`
      *,
      members:team_members(count)
    `)
        .eq('slug', slug)
        .single()

    if (error) {
        console.error('Error fetching team:', error)
        return null
    }

    return team
}

export async function getMyTeams() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data: memberships, error } = await supabase
        .from('team_members')
        .select(`
      team:teams(*)
    `)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error fetching my teams:', error)
        return []
    }

    return memberships.map(m => m.team)
}
