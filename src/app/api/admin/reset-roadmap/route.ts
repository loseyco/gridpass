
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST() {
    const supabase = await createClient();

    // Whitelist to keep completed
    const whitelist = ['Feature Planning System', 'Founder Pack Landing Page'];

    // 1. Get all completed features
    const { data: features } = await supabase.from('gp_features').select('*').eq('status', 'completed');

    if (!features) return NextResponse.json({ success: true, count: 0 });

    let updatedCount = 0;

    for (const f of features) {
        if (!whitelist.includes(f.title)) {
            await supabase.from('gp_features').update({ status: 'in_progress' }).eq('id', f.id);
            updatedCount++;
        }
    }

    return NextResponse.json({ success: true, updated: updatedCount });
}
