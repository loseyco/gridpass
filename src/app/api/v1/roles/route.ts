
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const season_year = searchParams.get('season_year');

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        let query = supabase
            .from('roles')
            .select('*')
            .order('created_at', { ascending: false });

        if (season_year) {
            query = query.eq('season_year', season_year);
        }

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

        // Basic Validation
        if (!body.season_year || !body.role) {
            return NextResponse.json({
                success: false,
                error: { code: "VALIDATION_ERROR", message: "Season Year and Role are required." }
            }, { status: 400 });
        }

        // Insert logic
        const { data, error } = await supabase
            .from('roles')
            .insert({
                user_id: user.id,
                season_year: body.season_year,
                role: body.role,
                verified: false // Always false on creation
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            data: data,
            message: "Role Application Submitted"
        }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
