import { createClient } from '@/utils/supabase/server';

export const FOUNDER_LIMIT = 50;

export async function getFounderCount() {
    const supabase = await createClient();

    // Count user roles with role_type 'Founder'
    const { count, error } = await supabase
        .from('gp_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role_type', 'Founder');

    if (error) {
        console.error('Error fetching founder count:', error);
        return {
            count: 0,
            remaining: FOUNDER_LIMIT,
            limit: FOUNDER_LIMIT
        };
    }

    const currentCount = count || 0;
    const remaining = Math.max(0, FOUNDER_LIMIT - currentCount);

    return {
        count: currentCount,
        remaining,
        limit: FOUNDER_LIMIT
    };
}
