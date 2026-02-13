import { NextRequest, NextResponse } from 'next/server';
import { parseResumeWithAI } from '@/lib/ai-resume-parser';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const { leadId, resumeUrl } = await request.json();

        if (!leadId || !resumeUrl) {
            return NextResponse.json(
                { error: 'Missing leadId or resumeUrl' },
                { status: 400 }
            );
        }

        // Parse resume with AI
        const parsedData = await parseResumeWithAI(resumeUrl);

        // Store parsed data in resume_leads for reference
        const supabase = await createClient();
        await supabase
            .from('resume_leads')
            .update({
                metadata: {
                    ai_parsed_data: parsedData,
                    ai_parsed_at: new Date().toISOString(),
                }
            })
            .eq('id', leadId);

        return NextResponse.json(parsedData);
    } catch (error) {
        console.error('Error parsing resume:', error);
        return NextResponse.json(
            { error: 'Failed to parse resume' },
            { status: 500 }
        );
    }
}
