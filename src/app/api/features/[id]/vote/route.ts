
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();

    // In a real app, we check if user already voted (maybe a votes table).
    // For now, we just increment the counter on the feature validation-free (Founder Power).

    // First get current votes
    const { data: feature, error: fetchError } = await supabase
        .from('gp_features')
        .select('votes')
        .eq('id', id)
        .single();

    if (fetchError || !feature) {
        return NextResponse.json({ success: false, error: 'Feature not found' }, { status: 404 });
    }

    const newVotes = (feature.votes || 0) + 1;

    const { error: updateError } = await supabase
        .from('gp_features')
        .update({ votes: newVotes })
        .eq('id', id);

    if (updateError) {
        return NextResponse.json({ success: false, error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, votes: newVotes });
}
