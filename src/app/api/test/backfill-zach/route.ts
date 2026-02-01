import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Get Zach
    const { data: zach } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'founder') // Assuming safe since we largely cleared it, or we filter by name
        .ilike('full_name', '%Zach%')
        .single();

    if (!zach) {
        return NextResponse.json({ error: "Zach not found" });
    }

    // 2. Update real_world_info
    const currentInfo = zach.real_world_info || {};
    const updatedInfo = {
        ...currentInfo,
        founder_ref: 1
    };

    const { error } = await supabase
        .from('profiles')
        .update({ real_world_info: updatedInfo })
        .eq('id', zach.id);

    if (error) {
        return NextResponse.json({ error: error.message });
    }

    return NextResponse.json({
        success: true,
        message: "Zach assigned Founder #1",
        profile: zach.full_name
    });
}
