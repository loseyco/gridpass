import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;
    const supabase = await createClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const { data, error } = await supabase
            .from('applications')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    }
}

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;
    const supabase = await createClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();

        // Ensure only allowed fields
        const { data, error } = await supabase
            .from('applications')
            .update({
                status: body.status,
                cover_letter: body.cover_letter
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data, message: 'Application Updated' }, { status: 200 });
    } catch (error: any) {
        console.error("Applications PUT Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;
    const supabase = await createClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const { error } = await supabase
            .from('applications')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true, message: 'Application Deleted' }, { status: 200 });
    } catch (error: any) {
        console.error("Applications DELETE Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
}
