import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = await createClient();

    // 1. Fetch Random Spotlight Users (Active users with avatars preferred)
    // Note: 'random()' is not standard Supabase, we'll fetch a batch and shuffle in JS for now or use a random ID approach if large. 
    // For small DBs, fetching latest 50 and picking 3 is fine.
    const { data: users } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, location, created_at')
        .not('username', 'is', null)
        .order('updated_at', { ascending: false })
        .limit(50);

    const shuffledUsers = users ? users.sort(() => 0.5 - Math.random()).slice(0, 5) : [];

    // 2. Fetch Garage Showcase (Vehicles with photos preferred)
    const { data: vehicles } = await supabase
        .from('vehicles')
        .select('*, profiles(username)')
        .not('photo_url', 'is', null) // Only show cool cars
        .limit(20);

    let shuffledVehicles = vehicles ? vehicles.sort(() => 0.5 - Math.random()).slice(0, 5) : [];

    if (shuffledVehicles.length === 0) {
        shuffledVehicles = [
            {
                id: 'mock-1',
                year: 2024,
                make: 'Porsche',
                model: '911 GT3 R',
                photo_url: 'https://images.unsplash.com/photo-1503376763036-066120622c74?auto=format&fit=crop&q=80',
                profiles: { username: 'Stig' }
            },
            {
                id: 'mock-2',
                year: 2023,
                make: 'Ferrari',
                model: '296 GT3',
                photo_url: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80',
                profiles: { username: 'DriftKing' }
            },
            {
                id: 'mock-3',
                year: 1991,
                make: 'Mazda',
                model: '787B',
                photo_url: 'https://images.unsplash.com/photo-1629813291263-23c21c25785f?auto=format&fit=crop&q=80',
                profiles: { username: 'RotaryHead' }
            }
        ];
    }

    // 3. Generate Ticker Events
    const ticker = [];

    // Latest Members
    const { data: newMembers } = await supabase
        .from('profiles')
        .select('username')
        .order('created_at', { ascending: false })
        .limit(3);

    newMembers?.forEach(m => ticker.push(`NEW MEMBER: ${m.username?.toUpperCase()}`));

    // Random "Race Control" Messages
    const raceControlMessages = [
        "TRACK TEMP: 32°C",
        "FLAG STATUS: GREEN",
        "SAFETY CAR: IN LAP",
        "INCIDENT: TURN 1 - NO INVESTIGATION",
        "PIT WINDOW: OPEN",
        "FASTEST LAP: 1:32.450 (SIMULATED)",
    ];
    ticker.push(raceControlMessages[Math.floor(Math.random() * raceControlMessages.length)]);

    // 4. Platform Stats
    const { count: memberCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    // Mock views for now
    const pageViews = 12543 + Math.floor(Math.random() * 100);

    // 5. Fetch ADS (Internal Monetization)
    const { data: ads } = await supabase
        .from('os_ads')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

    // 6. Fetch Calendar (Real Schedule)
    const { data: calendarEvents } = await supabase
        .from('os_calendar_events')
        .select('*')
        .gte('start_time', new Date().toISOString())
        .order('start_time', { ascending: true })
        .limit(5);

    // Format calendar events for frontend
    const formattedCalendar = calendarEvents?.map(evt => ({
        ...evt,
        // Frontend expects 'time', 'series', 'event', 'channel' logic or uses the raw fields
        // We'll pass raw fields and let frontend handle date formatting, but ensure structure matches
        title: evt.title,  // Frontend ScheduleScene uses 'title' or 'event'? Let's check. 
        // Wait, ScheduleScene uses 'evt.title' and 'evt.series'.
        // The hardcoded fallback uses 'event'. I should align them.
    })) || [];

    // Fallback if DB is empty
    const finalCalendar = formattedCalendar.length > 0 ? formattedCalendar : [
        { start_time: new Date().toISOString(), series: 'F1', title: 'Bahrain Grand Prix', channel: 'ESPN', is_fallback: true },
        { start_time: new Date(Date.now() + 86400000).toISOString(), series: 'NASCAR', title: 'Daytona 500', channel: 'FOX', is_fallback: true }
    ];

    return NextResponse.json({
        spotlight: shuffledUsers,
        garage: shuffledVehicles,
        ticker: ticker,
        stats: {
            total_members: memberCount || 0,
            page_views: pageViews
        },
        ads: ads || [], // Return fetched ads
        calendar: finalCalendar,
        breaking_news: Math.random() > 0.9
    });
}
