import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const tier = searchParams.get('tier');

        let query = supabase.from('features').select('*').order('created_at', { ascending: false });

        if (status) query = query.eq('status', status);
        if (tier) query = query.eq('tier', tier);

        const { data, error } = await query;

        if (error) throw error;
        return NextResponse.json({ success: true, data }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const supabase = await createClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();

        // Basic Validation
        if (!body.title) return NextResponse.json({ success: false, error: 'Title required' }, { status: 400 });

        // Create or Update (Upsert by Title)
        const { data, error } = await supabase
            .from('features')
            .upsert({
                title: body.title,
                description: body.description,
                status: body.status || 'planned',
                priority: body.priority || 'medium',
                tier: body.tier || 'core',
                category: body.category || 'General',
                votes: body.votes || 0,
                estimated_hours: body.estimated_hours,
                assigned_expert: body.assigned_expert
            }, { onConflict: 'title' })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 }); // Will allow 500 initial, can refine later.
    }
}
