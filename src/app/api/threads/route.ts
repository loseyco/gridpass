
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        // Fetch threads where user is a participant
        // We also want to fetch the latest message for preview
        const { data, error } = await supabase
            .from('os_threads')
            .select(`
                *,
                os_messages (
                    content,
                    created_at,
                    read_at,
                    sender_id
                )
            `)
            .contains('participants', [user.id])
            .order('updated_at', { ascending: false });

        if (error) throw error;

        // Process data to get latest message efficiently (or rely on frontend)
        // For now returning raw data
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

        // Check if thread already exists
        // This is a bit complex with arrays, so we might just check if there is a thread 
        // with these exact 2 participants.
        // For simplicity in MVP, we can try to find one or create one.

        // 1. Try to find existing thread
        const { data: existingThreads } = await supabase
            .from('os_threads')
            .select('*')
            .contains('participants', [user.id, recipient_id]);

        // Filter strictly for 2 participants to avoid group chat confusion if we add that later
        const existingThread = existingThreads?.find(t => t.participants.length === 2);

        if (existingThread) {
            return NextResponse.json({ success: true, data: existingThread }, { status: 200 });
        }

        // 2. Create new thread
        const { data, error } = await supabase
            .from('os_threads')
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
