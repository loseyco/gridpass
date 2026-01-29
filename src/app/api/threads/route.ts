
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        // Using Postgres array containment operator @>
        const { data, error } = await supabase
            .from('gp_threads')
            .select('*')
            .contains('participants', [user.id])
            .order('updated_at', { ascending: false });

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

        const { recipient_id } = await request.json();
        if (!recipient_id) return NextResponse.json({ success: false, error: 'Recipient required' }, { status: 400 });

        const { data, error } = await supabase
            .from('gp_threads')
            .insert({
                participants: [user.id, recipient_id]
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data }, { status: 201 });

    } catch (error: any) {
        console.error("Threads POST Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
}
