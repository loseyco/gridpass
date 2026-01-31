'use server'

import { createClient } from '@/utils/supabase/server';

export async function getDailyTraffic(days: number = 30) {
    const supabase = await createClient();

    // Calculate start date
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
        .from('analytics_events')
        .select('created_at')
        .eq('event_type', 'page_view')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);

    // Group by Date
    const grouped = new Map<string, number>();

    // Initialize all dates with 0
    for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        grouped.set(d.toISOString().split('T')[0], 0);
    }

    data?.forEach((event) => {
        const date = event.created_at.split('T')[0];
        if (grouped.has(date)) {
            grouped.set(date, (grouped.get(date) || 0) + 1);
        }
    });

    // Convert to Array
    return Array.from(grouped.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getUserGrowth(days: number = 30) {
    const supabase = await createClient();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);

    const grouped = new Map<string, number>();

    for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        grouped.set(d.toISOString().split('T')[0], 0);
    }

    data?.forEach((user) => {
        const date = user.created_at.split('T')[0];
        if (grouped.has(date)) {
            grouped.set(date, (grouped.get(date) || 0) + 1);
        }
    });

    return Array.from(grouped.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

export async function getTopReferrers() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('analytics_events')
        .select('meta')
        .eq('event_type', 'page_view')
        .limit(1000); // Analyze last 1000 views

    if (error) throw new Error(error.message);

    const referrers = new Map<string, number>();

    data?.forEach((event: any) => {
        const ref = event.meta?.referrer || 'Direct';
        referrers.set(ref, (referrers.get(ref) || 0) + 1);
    });

    return Array.from(referrers.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5
}
