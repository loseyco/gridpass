import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
    const supabase = await createClient();
    const { data: leagues } = await supabase.from('os_leagues').select('*');
    const { data: seasons } = await supabase.from('os_league_seasons').select('*');
    const { count: resultsCount } = await supabase.from('os_league_race_results').select('*', { count: 'exact', head: true });

    return NextResponse.json({
        message: 'DB Check',
        leagues: leagues,
        seasons: seasons,
        seasonCount: seasons?.length,
        resultsCount: resultsCount
    });
}
