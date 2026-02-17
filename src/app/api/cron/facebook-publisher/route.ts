import { NextRequest, NextResponse } from 'next/server';
import { FacebookPublisher } from '@/lib/facebook-publisher';

export async function GET(req: NextRequest) {
    // 1. Verify Cron Secret
    const authHeader = req.headers.get('authorization');
    const url = new URL(req.url);
    const key = url.searchParams.get('key');

    // DEBUG LOGGING
    console.log(`Cron Debug: AuthHeader=${authHeader}, Key=${key}, Expected=${process.env.CRON_SECRET}`);

    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        if (key !== process.env.CRON_SECRET) {
            return new NextResponse('Unauthorized', { status: 401 });
        }
    }

    // 2. Check Facebook Config
    const pageId = process.env.FACEBOOK_PAGE_ID;
    const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;

    if (!pageId || !accessToken) {
        return NextResponse.json({ error: 'Facebook credentials not configured' }, { status: 500 });
    }

    try {
        const publisher = new FacebookPublisher(pageId, accessToken);
        const logs: string[] = [];

        // Override console.log and console.error to capture logs for response
        const originalLog = console.log;
        const originalError = console.error;

        console.log = (...args) => {
            logs.push(`LOG: ${args.join(' ')}`);
            originalLog(...args);
        };

        console.error = (...args) => {
            logs.push(`ERROR: ${args.join(' ')}`);
            originalError(...args);
        };

        // 3. Run Logic
        await publisher.publishPendingNews();
        await publisher.publishNewMembers();

        // Restore console
        console.log = originalLog;
        console.error = originalError;

        return NextResponse.json({ success: true, logs });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
