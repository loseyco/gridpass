import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        let user = null;
        let supabaseClient = null;

        // 1. Authenticate (Support both Bearer token for devices and Cookies for browser)
        const authHeader = request.headers.get('authorization');

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);

            // Create client scoped to this token
            const supabaseWithToken = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    global: {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                }
            );

            const { data: { user: tokenUser }, error } = await supabaseWithToken.auth.getUser();
            if (!error && tokenUser) {
                user = tokenUser;
                supabaseClient = supabaseWithToken;
            }
        }

        // Fallback to Session (Browser)
        if (!user) {
            const supabaseFromCookies = await createServerClient();
            const { data: { user: sessionUser }, error } = await supabaseFromCookies.auth.getUser();
            if (!error && sessionUser) {
                user = sessionUser;
                supabaseClient = supabaseFromCookies;
            }
        }

        if (!user || !supabaseClient) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse Data
        const body = await request.json();
        const { game, track, car, lap_time, sector1, sector2, sector3, fuel_used } = body;

        if (!game || !lap_time) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 3. Insert Lap
        const { data, error } = await supabaseClient
            .from('os_sim_laps')
            .insert({
                user_id: user.id,
                game,
                track: track || 'Unknown',
                car: car || 'Unknown',
                lap_time,
                sector1,
                sector2,
                sector3,
                fuel_used
            })
            .select()
            .single();

        if (error) {
            console.error('Error saving lap:', error);
            // Return detailed error for debugging
            return NextResponse.json({
                error: 'Failed to save lap',
                details: error.message,
                code: error.code
            }, { status: 500 });
        }

        return NextResponse.json({ success: true, id: data.id });

    } catch (error: any) {
        console.error('Lap telemetry error:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}
