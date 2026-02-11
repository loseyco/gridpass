'use server'

import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createTeam(formData: FormData) {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error('Unauthorized');
    }

    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const description = formData.get('description') as string;

    if (!name || !slug) {
        throw new Error('Name and URL Slug are required');
    }

    // Basic slug validation
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
        throw new Error('Slug can only contain lowercase letters, numbers, and hyphens');
    }

    const adminSupabase = createAdminClient();

    // 1. Create Team
    const { data: team, error: teamError } = await adminSupabase
        .from('teams')
        .insert({
            name,
            slug,
            description,
            owner_id: user.id
        })
        .select()
        .single();

    if (teamError) {
        if (teamError.code === '23505') { // Unique violation
            throw new Error('A team with this URL Slug already exists.');
        }
        console.error('Error creating team:', teamError);
        throw new Error('Failed to create team: ' + teamError.message);
    }

    // 2. Add Owner as Team Member
    const { error: memberError } = await adminSupabase
        .from('team_members')
        .insert({
            team_id: team.id,
            user_id: user.id,
            role: 'owner',
            status: 'active'
        });

    if (memberError) {
        console.error('Error adding owner to team:', memberError);
        await adminSupabase.from('teams').delete().eq('id', team.id);
        throw new Error('Failed to add owner to team');
    }

    revalidatePath(`/team/${slug}`);
    redirect(`/team/${slug}/dashboard`);
}
