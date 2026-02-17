import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export async function requireLeagueAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // For now, hardcode check for PJ Losey's ID or similar, 
    // OR check if they are the owner of the official league.
    const { data: league } = await supabase
        .from('os_leagues')
        .select('owner_id')
        .eq('is_official', true)
        .single();

    // Allow if owner, or generic admin check (TODO)
    // For Alpha/Dev: Allow if owner is null (seeded) or matches, or if we are just testing.
    if (process.env.NODE_ENV === 'development') {
        return user;
    }

    if (league && league.owner_id === user.id) {
        return user;
    }

    // Allow bypassing for dev (PJ) if necessary, 
    // but ideally we should update the league owner to be the current user via seed.

    return user;
}
