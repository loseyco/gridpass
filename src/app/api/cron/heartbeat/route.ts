
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { hostname } = body;

        const supabase = createAdminClient();

        const { error } = await supabase
            .from('os_system_settings')
            .upsert({
                key: 'system.heartbeat',
                value: {
                    status: 'online',
                    last_seen: new Date().toISOString(),
                    hostname: hostname || 'Unknown Host'
                }
            });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
