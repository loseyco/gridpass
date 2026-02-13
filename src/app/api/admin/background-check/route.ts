import { NextRequest, NextResponse } from 'next/server';
import { performBackgroundCheck } from '@/lib/ai-background-check';

export async function POST(request: NextRequest) {
    try {
        const { leadData } = await request.json();

        if (!leadData) {
            return NextResponse.json(
                { error: 'Missing lead data' },
                { status: 400 }
            );
        }

        // Perform AI background check
        const result = await performBackgroundCheck(leadData);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Background check API error:', error);
        return NextResponse.json(
            { error: 'Failed to perform background check' },
            { status: 500 }
        );
    }
}
