
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    let query = supabase
        .from('os_availability')
        .select('*')
        .order('start_date', { ascending: true });

    if (userId) {
        query = query.eq('user_id', userId);
    }

    const { data: availability, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(availability);
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const body = await request.json();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Force user_id to be currently logged in user
    const { data: record, error } = await supabase
        .from('os_availability')
        .insert({
            ...body,
            user_id: user.id
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(record);
}
