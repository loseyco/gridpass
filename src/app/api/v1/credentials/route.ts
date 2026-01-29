
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
            .from('gp_credentials')
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
        if (!body.credential_type || !body.issuer || !body.scope) {
            return NextResponse.json({
                success: false,
                error: { code: "VALIDATION_ERROR", message: "Type, Issuer, and Scope are required." }
            }, { status: 400 });
        }

        // Insert logic
        const { data, error } = await supabase
            .from('gp_credentials')
            .insert({
                user_id: user.id,
                season_year: body.season_year || null,
                credential_type: body.credential_type,
                issuer: body.issuer,
                scope: body.scope,
                event_id: body.event_id || null,
                expires_at: body.expires_at || null,
                verification_status: 'pending' // Always pending on create
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            data: data,
            message: "Credential Added"
        }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
