import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
    try {
        const { leadId, fieldKey, value } = await request.json();

        if (!leadId || !fieldKey) {
            return NextResponse.json(
                { success: false, error: 'Missing leadId or fieldKey' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Handle nested metadata fields
        if (fieldKey.startsWith('metadata.')) {
            const metadataKey = fieldKey.replace('metadata.', '');

            // Get current metadata
            const { data: lead } = await supabase
                .from('resume_leads')
                .select('metadata')
                .eq('id', leadId)
                .single();

            const currentMetadata = lead?.metadata || {};

            // Update metadata
            const { error } = await supabase
                .from('resume_leads')
                .update({
                    metadata: {
                        ...currentMetadata,
                        [metadataKey]: value
                    }
                })
                .eq('id', leadId);

            if (error) {
                console.error('Update error:', error);
                return NextResponse.json(
                    { success: false, error: error.message },
                    { status: 500 }
                );
            }
        } else {
            // Update top-level field
            const { error } = await supabase
                .from('resume_leads')
                .update({ [fieldKey]: value })
                .eq('id', leadId);

            if (error) {
                console.error('Update error:', error);
                return NextResponse.json(
                    { success: false, error: error.message },
                    { status: 500 }
                );
            }
        }

        revalidatePath(`/admin/resumes/${leadId}`);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update error:', error);
        return NextResponse.json(
            { success: false, error: 'Update failed' },
            { status: 500 }
        );
    }
}
