import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
        return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
    }

    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        return NextResponse.json({
            clientSecret: session.client_secret,
            status: session.status,
        });
    } catch (error: any) {
        console.error('Error retrieving session:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve session' },
            { status: 500 }
        );
    }
}
