'use server'

import { createClient } from '@/utils/supabase/server';
import { logActivity } from '@/utils/analytics-logger';
import { headers } from 'next/headers';

export async function trackPageView(path: string, referrer?: string, userAgent?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const headerStore = await headers();
    let ip = headerStore.get('x-forwarded-for') || 'unknown';
    if (ip !== 'unknown' && ip.includes(',')) {
        ip = ip.split(',')[0].trim();
    }
    // Fallback if needed
    if (ip === 'unknown') {
        ip = headerStore.get('x-real-ip') || 'unknown';
    }
    const country = headerStore.get('x-vercel-ip-country') || 'unknown';

    // Fire and forget - don't block
    try {
        // 1. Atomic Counter
        await supabase.rpc('increment_page_view', { page_path: path });

        // Detect Device / OS
        const ua = userAgent || headerStore.get('user-agent') || '';
        let device_type = 'desktop';
        let os = 'unknown';

        if (/mobile/i.test(ua)) device_type = 'mobile';
        if (/ipad|tablet/i.test(ua)) device_type = 'tablet';

        if (/windows/i.test(ua)) os = 'windows';
        else if (/macintosh|mac os x/i.test(ua)) os = 'macos';
        else if (/linux/i.test(ua)) os = 'linux';
        else if (/android/i.test(ua)) os = 'android';
        else if (/iphone|ipad|ipod/i.test(ua)) os = 'ios';

        // 2. Event Log (Centralized)
        await logActivity('page_view', {
            device_type,
            os,
            referrer: referrer || 'direct',
            ip,
            country
        }, path, user?.id);

        // 3. Leaderboard Tracking (Profile Views)
        if (path.startsWith('/u/')) {
            const username = path.split('/')[2];
            if (username) {
                // Get profile ID efficiently
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('username', username)
                    .single();

                if (profile) {
                    await supabase.from('analytics_page_views').insert({
                        profile_id: profile.id,
                        viewer_id: user?.id || null,
                        path,
                        device_type // Track this for creator analytics later
                    });
                }
            }
        }

        return { success: true };
    } catch (e) {
        console.error('Failed to track page view:', e);
        return { success: false };
    }
}

export async function incrementTimeOnSite(seconds: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.rpc('increment_time_on_site', {
        user_id: user.id,
        seconds
    });

    return { success: true };
}

export async function getLeaderboardData() {
    const supabase = await createClient();

    // 1. Most Invites (Referrals)
    const { data: invites } = await supabase
        .from('leaderboard_invites_with_profiles')
        .select('*')
        .limit(10);

    // 2. Most Page Views
    const { data: views } = await supabase
        .from('leaderboard_views_with_profiles')
        .select('*')
        .limit(10);

    // 3. Most Time
    const { data: time } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, total_time_seconds')
        .order('total_time_seconds', { ascending: false })
        .limit(10);

    return {
        timeLeaderboard: time || [],
        inviteLeaderboard: invites || [],
        viewsLeaderboard: views || []
    };
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
