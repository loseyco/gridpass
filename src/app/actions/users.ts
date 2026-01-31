'use server'

import { createClient } from '@/utils/supabase/server';

export type SimpleProfile = {
    id: string;
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
    role: string | null;
};

export async function getRecentUsers(limit = 20): Promise<SimpleProfile[]> {
    const supabase = await createClient();

    // Fetch most recently updated profiles
    // We could also join with auth.users but profiles should be 1:1 and contain the display info
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, role')
        .order('updated_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching recent users:', error);
        return [];
    }

    return profiles || [];
}
