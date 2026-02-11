'use server';

import { createClient } from '@/utils/supabase/server';

export type PublicStats = {
    users: number;
    teams: number;
    jobs: number;
    classifieds: number;
    services: number;
};

export async function getPublicStats(): Promise<PublicStats> {
    const supabase = await createClient();

    // Run queries in parallel for performance
    const [users, teams, jobs, classifieds, services] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('teams').select('*', { count: 'exact', head: true }),
        supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('classifieds').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('user_services').select('*', { count: 'exact', head: true }),
    ]);

    return {
        users: users.count || 0,
        teams: teams.count || 0,
        jobs: jobs.count || 0,
        classifieds: classifieds.count || 0,
        services: services.count || 0,
    };
}
