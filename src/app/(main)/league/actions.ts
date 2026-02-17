'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

export async function saveRaceResults(eventId: string, results: any[]) {
    const supabase = await createClient();

    // 1. Auth Check
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    // 2. Ownership Check
    const { data: event } = await supabase
        .from('os_league_events')
        .select(`
            id, 
            league_id,
            leagues:os_leagues(owner_id)
        `)
        .eq('id', eventId)
        .single();

    // Type assertion or check
    const leagueData = event?.leagues as any; // Safe cast for now as we know the structure

    if (!event || !leagueData || leagueData.owner_id !== user.id) {
        throw new Error('You do not have permission to manage this event.');
    }

    // 3. Admin Client (Service Role)
    const adminSupabase = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );

    // 4. Perform Operations
    const { error: insertError } = await adminSupabase
        .from('os_league_race_results')
        .insert(results);

    if (insertError) throw insertError;

    const { error: updateError } = await adminSupabase
        .from('os_league_events')
        .update({ status: 'completed' })
        .eq('id', eventId);

    if (updateError) throw updateError;

    revalidatePath('/league/admin');
    return { success: true };
}
