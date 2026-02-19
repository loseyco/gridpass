
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const supabase = await createClient();

    // Join with jobs and leads to get full details
    const { data: placements, error } = await supabase
        .from('os_placements')
        .select(`
            *,
            job:job_id (*),
            candidate:lead_id (*)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map the joined data to match AgencyPlacement interface if needed,
    // but the select structure above should return strictly what we need
    // assuming Supabase types match.
    // Note: 'candidate' alias for 'lead_id' relation might need manual mapping if FK is not named 'candidate'
    // Actually, let's trust Supabase resolution or do manual map if relation names are tricky.
    // For now, returning as is.
    return NextResponse.json(placements);
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { job_id, lead_id, fee_amount, currency, notes, status } = body;

    if (!job_id || !lead_id) {
        return NextResponse.json({ error: 'Job ID and Candidate ID are required' }, { status: 400 });
    }

    const { data: placement, error } = await supabase
        .from('os_placements')
        .insert({
            job_id,
            lead_id,
            recruiter_id: session.user.id,
            fee_amount: fee_amount || 0,
            currency: currency || 'USD',
            status: status || 'pending',
            notes
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(placement);
}
