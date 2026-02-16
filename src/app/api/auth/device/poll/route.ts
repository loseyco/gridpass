import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { device_secret } = body;

        const logFile = path.join(process.cwd(), 'server.log');
        const log = (msg: string) => {
            try {
                fs.appendFileSync(logFile, `${new Date().toISOString()} - ${msg}\n`);
            } catch (e) {
                console.error("Failed to write to log file", e);
            }
        };

        if (!device_secret) {
            log(`Poll Error: Missing device_secret`);
            return NextResponse.json({ error: 'Missing device_secret' }, { status: 400 });
        }

        const supabase = await createClient();

        const { data, error } = await supabase
            .from('auth_device_requests')
            .select('status, session_data')
            .eq('device_secret', device_secret)
            .single();

        if (error || !data) {
            log(`Poll Error: Row not found or error. Secret=${device_secret} Error=${JSON.stringify(error)}`);
            return NextResponse.json({ error: 'Invalid request' }, { status: 404 });
        }

        log(`Poll Status: ${data.status} Secret=${device_secret}`);

        if (data.status === 'pending') {
            return NextResponse.json({ status: 'pending' });
        }

        if (data.status === 'expired') {
            return NextResponse.json({ status: 'expired' });
        }

        if (data.status === 'completed' && data.session_data) {
            log(`Poll Completed: Sending session`);

            // Delete it for security (one-time use)
            await supabase
                .from('auth_device_requests')
                .delete()
                .eq('device_secret', device_secret);

            return NextResponse.json({
                status: 'completed',
                session: data.session_data
            });
        }

        return NextResponse.json({ status: 'unknown' });

    } catch (error: any) {
        console.error('Poll Internal Error', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
