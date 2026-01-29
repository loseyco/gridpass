
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from('gp_tracks')
            .select('*')
            .eq('active', true)
            .order('name', { ascending: true });

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

        if (!body.name || !body.location) {
            return NextResponse.json({
                success: false,
                error: { code: "VALIDATION_ERROR", message: "Name and Location are required." }
            }, { status: 400 });
        }

        // Check if exists
        const { data: existing } = await supabase
            .from('gp_tracks')
            .select('*')
            .eq('name', body.name)
            .single();

        let data, error;

        if (existing) {
            data = existing;
            error = null;
        } else {
            const result = await supabase
                .from('gp_tracks')
                .insert({
                    name: body.name,
                    location: body.location,
                    country: body.country || 'USA',
                    timezone: body.timezone || 'America/Chicago',
                    created_by: user.id
                })
                .select()
                .single();
            data = result.data;
            error = result.error;
        }

        if (error) throw error;

        return NextResponse.json({
            success: true,
            data: data,
            message: "Track Created"
        }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
