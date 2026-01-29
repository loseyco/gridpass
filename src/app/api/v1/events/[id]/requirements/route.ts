
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { id } = await params;
    try {
        const { data, error } = await supabase
            .from('gp_event_requirements')
            .select('*')
            .eq('event_id', id);

        if (error) throw error;

        return NextResponse.json({ success: true, data: data }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient();
    const { id } = await params;
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        // console.log("DEBUG: Events params", params);
        if (!id) {
            return NextResponse.json({ success: false, error: "Event ID parameter missing" }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('gp_event_requirements')
            .insert({
                event_id: id,
                required_credential_type: body.required_credential_type,
                role_scope: body.role_scope || 'all'
            })
            .select()
            .single();

        if (error) {
            console.error("DEBUG: Insert Error", error);
            throw error;
        }

        return NextResponse.json({
            success: true,
            data: data,
            message: "Requirement Added"
        }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
}
