
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { id: threadId } = await params;

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const { data, error } = await supabase
            .from('gp_messages')
            .select('*')
            .eq('thread_id', threadId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return NextResponse.json({ success: true, data }, { status: 200 });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { id: threadId } = await params;

    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const { content } = await request.json();
        if (!content) return NextResponse.json({ success: false, error: 'Content required' }, { status: 400 });

        const { data, error } = await supabase
            .from('gp_messages')
            .insert({
                thread_id: threadId,
                sender_id: user.id,
                content
            })
            .select()
            .single();

        if (error) throw error;

        // Update thread's updated_at
        await supabase.from('gp_threads').update({ updated_at: new Date().toISOString() }).eq('id', threadId);

        return NextResponse.json({ success: true, data }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 409 });
    }
}
