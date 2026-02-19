
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const urgentOnly = searchParams.get('urgent') === 'true';

    let query = supabase
        .from('os_gigs')
        .select('*')
        .order('is_urgent', { ascending: false }) // Urgent first
        .order('start_date', { ascending: true }); // Then by date

    if (urgentOnly) {
        query = query.eq('is_urgent', true);
    }

    const { data: gigs, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(gigs);
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const body = await request.json();

    // Basic validation
    if (!body.title || !body.role || !body.start_date || !body.end_date) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: gig, error } = await supabase
        .from('os_gigs')
        .insert({
            ...body,
            created_by: user.id
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(gig);
}
