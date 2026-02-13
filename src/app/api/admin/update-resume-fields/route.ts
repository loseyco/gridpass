import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const { leadId, fields } = await request.json();

        if (!leadId || !fields) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Map AI fields to database columns
        const updates: any = {};

        // Direct mappings
        if (fields.name) updates.name = fields.name;
        if (fields.email) updates.email = fields.email;
        if (fields.phone) updates.phone = fields.phone;
        if (fields.linkedin) updates.linkedin = fields.linkedin;
        if (fields.city) updates.city = fields.city;
        if (fields.currentRole) updates.job_title = fields.currentRole;

        // Metadata fields
        const metadataUpdates: any = {};
        if (fields.professionalBio) metadataUpdates.professional_bio = fields.professionalBio;
        if (fields.skills) metadataUpdates.skills = fields.skills;
        if (fields.experience) metadataUpdates.experience = fields.experience;
        if (fields.education) metadataUpdates.education = fields.education;

        // Get existing metadata and merge
        const { data: existingLead } = await supabase
            .from('resume_leads')
            .select('metadata')
            .eq('id', leadId)
            .single();

        if (Object.keys(metadataUpdates).length > 0) {
            updates.metadata = {
                ...(existingLead?.metadata || {}),
                ...metadataUpdates,
            };
        }

        // Update the lead
        const { error } = await supabase
            .from('resume_leads')
            .update(updates)
            .eq('id', leadId);

        if (error) {
            console.error('Update error:', error);
            return NextResponse.json(
                { error: 'Failed to update fields' },
                { status: 500 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in update endpoint:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
