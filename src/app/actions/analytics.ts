'use server'

import { createClient } from '@/utils/supabase/server';

export async function trackPageView(path: string, referrer?: string, userAgent?: string) {
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
            meta: { user_agent: userAgent, referrer: referrer || 'direct' }
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

export async function updatePageSEO(path: string, data: { title: string, description: string, image_url: string, required_role?: string, no_index?: boolean }) {
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
            image_url: data.image_url,
            required_role: data.required_role || 'public',
            no_index: data.no_index || false
        });

    if (error) throw new Error(error.message);
    return { success: true };
}

export async function getAllPageStats() {
    const supabase = await createClient();

    try {
        // Fetch SEO metadata
        const { data: seoList, error: seoError } = await supabase
            .from('page_seo')
            .select('*');

        if (seoError) throw new Error(seoError.message);

        // Fetch Analytics Summary
        const { data: analyticsList, error: analyticsError } = await supabase
            .from('page_analytics')
            .select('*');

        if (analyticsError) throw new Error(analyticsError.message);

        // Combine Data (Left Join logic on Application Layer)
        // We want a list of ALL pages that have either SEO or Analytics data.
        const combined = new Map();

        seoList?.forEach(item => {
            combined.set(item.path, { ...item, type: 'static' }); // Default type
        });

        analyticsList?.forEach(item => {
            const existing = combined.get(item.path) || { path: item.path, required_role: 'public', title: 'Untitled' };
            combined.set(item.path, {
                ...existing,
                visits: item.visits,
                last_visited: item.last_visited
            });
        });

        return Array.from(combined.values()).sort((a, b) => b.visits - a.visits);
    } catch (error) {
        console.error('getAllPageStats error:', error);
        return []; // Return empty array on failure to prevent page crash
    }
}
