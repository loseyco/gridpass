
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const season_year = searchParams.get('season_year');
    const track_id = searchParams.get('track_id');
    const series = searchParams.get('series');

    try {
        let query = supabase
            .from('events')
            .select(`
                *,
                track:tracks(name, location)
            `)
            .order('start_date', { ascending: true });

        if (season_year) query = query.eq('season_year', season_year);
        if (track_id) query = query.eq('track_id', track_id);
        if (series) query = query.eq('series', series);

        const { data, error } = await query;

        if (error) throw error;

        return NextResponse.json({
            success: true,
            data: data,
            meta: { total: data.length }
        }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const supabase = await createClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        if (!body.name || !body.track_id || !body.start_date || !body.end_date) {
            return NextResponse.json({
                success: false,
                error: { code: "VALIDATION_ERROR", message: "Name, Track ID, and Dates are required." }
            }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('events')
            .insert({
                name: body.name,
                track_id: body.track_id,
                season_year: body.season_year || new Date(body.start_date).getFullYear(),
                series: body.series || 'Open',
                start_date: body.start_date,
                end_date: body.end_date,
                status: 'scheduled',
                created_by: user.id
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            data: data,
            message: "Event Created"
        }, { status: 201 });

    } catch (error: any) {
        console.error("Events POST Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
}
