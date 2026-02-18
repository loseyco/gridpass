import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
    const supabase = await createClient();

    // 0. Security Check
    const { getUserRole } = await import('@/utils/rbac');
    const role = await getUserRole();

    if (role !== 'superadmin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get members created in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: newMembers, error } = await supabase
        .from('profiles')
        .select('username, name, created_at')
        .gte('created_at', oneDayAgo)
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ members: newMembers || [] });
}
