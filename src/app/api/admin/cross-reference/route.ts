import { NextRequest, NextResponse } from 'next/server';
import { performBackgroundCheck } from '@/lib/ai-background-check';

export async function POST(request: NextRequest) {
    try {
        const { leadId, leadData } = await request.json();

        if (!leadId || !leadData) {
            return NextResponse.json(
                { error: 'Missing required data' },
                { status: 400 }
            );
        }

        // Cross-reference the data
        const result = await performBackgroundCheck(leadData);

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error cross-referencing data:', error);
        return NextResponse.json(
            { error: 'Failed to cross-reference data' },
            { status: 500 }
        );
    }
}
