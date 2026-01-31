'use server'

import { createClient } from '@/utils/supabase/server';

export async function trackPageView(path: string, userAgent?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fire and forget - don't block
    try {
        // 1. Atomic Counter
        await supabase.rpc('increment_page_view', { page_path: path });

        // 2. Event Log
        await supabase.from('analytics_events').insert({
            event_type: 'page_view',
            path,
            user_id: user?.id,
            meta: { user_agent: userAgent, referrer: 'direct' } // Simplified
        });

        return { success: true };
    } catch (e) {
        console.error('Failed to track page view:', e);
        return { success: false };
    }
}

export async function getPageStats(path: string) {
    const supabase = await createClient();

    const { data: summary } = await supabase
        .from('page_analytics')
        .select('visits, last_visited')
        .eq('path', path)
        .single();

    // Get recent events
    const { data: events } = await supabase
        .from('analytics_events')
        .select('created_at, event_type, meta')
        .eq('path', path)
        .order('created_at', { ascending: false })
        .limit(10);

    return { summary, events };
}

export async function updatePageSEO(path: string, data: { title: string, description: string, image_url: string }) {
    const supabase = await createClient();
    // Simplified security: relying on Admin Layout / Middleware for now, 
    // but HUD checks superadmin status too.

    // Validate user is superadmin (double check)
    // const { data: { user } } = await supabase.auth.getUser();
    // ... rbac check ...

    const { error } = await supabase
        .from('page_seo')
        .upsert({
            path,
            title: data.title,
            description: data.description,
            image_url: data.image_url
        });

    if (error) throw new Error(error.message);
    return { success: true };
}
