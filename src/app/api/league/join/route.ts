import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
    // 1. Verify User Auth
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { seasonId } = body;

        console.log(`[Join API] User ${user.id} attempting to join season ${seasonId}`);

        if (!seasonId) {
            return NextResponse.json({ error: 'Missing seasonId' }, { status: 400 });
        }

        // 2. Use Service Role to bypass RLS for Admin/Insertion tasks
        const adminClient = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 3. Get Season Details
        const { data: season, error: seasonError } = await adminClient
            .from('os_league_seasons')
            .select('league_id, name')
            .eq('id', seasonId)
            .single();

        if (seasonError || !season) {
            console.error('[Join API] Season lookup failed:', seasonError);
            return NextResponse.json({ error: 'Season not found' }, { status: 404 });
        }

        // 4. Add Member
        const { error: memberError } = await adminClient
            .from('os_league_members')
            .upsert({
                league_id: season.league_id,
                user_id: user.id,
                role: 'driver',
                status: 'active',
                joined_at: new Date().toISOString()
            }, { onConflict: 'league_id, user_id' });

        if (memberError) {
            console.error('[Join API] Insert failed:', memberError);
            return NextResponse.json({ error: 'Failed to join league' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: `Joined ${season.name}` });

    } catch (err: any) {
        console.error('[Join API] Unexpected error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
