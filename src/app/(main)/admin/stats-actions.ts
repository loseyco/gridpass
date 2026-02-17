'use server';

import { createClient } from '@/utils/supabase/server';

export async function getAdminStats() {
    const supabase = await createClient();

    // 1. Count Users (if profile table exists, otherwise just show 1 for Admin)
    // Safe fallback: Just count features as "Workload"
    const { count: featureCount } = await supabase
        .from('features')
        .select('*', { count: 'exact', head: true });

    // 2. Count Pending PM Tasks
    const { count: pendingTaskCount } = await supabase
        .from('pm_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

    // 3. Count Completed Features
    const { count: completedFeatures } = await supabase
        .from('features')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

    return {
        totalFeatures: featureCount || 0,
        pendingTasks: pendingTaskCount || 0,
        completedFeatures: completedFeatures || 0
    };
}
