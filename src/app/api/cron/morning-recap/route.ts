import { NextRequest, NextResponse } from 'next/server';
import { FacebookPublisher } from '@/lib/facebook-publisher';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const pageId = process.env.FACEBOOK_PAGE_ID!;
        const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN!;

        if (!pageId || !accessToken) {
            throw new Error('Missing Facebook credentials');
        }

        const publisher = new FacebookPublisher(pageId, accessToken);

        console.log('Starting Morning Recap...');
        await publisher.publishDailySummary();

        return NextResponse.json({ success: true, message: 'Morning Recap executed' });

    } catch (error: any) {
        console.error('Error in morning recap:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
