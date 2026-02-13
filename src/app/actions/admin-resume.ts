'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Update a single field in a resume lead
 */
export async function updateResumeField(leadId: string, fieldKey: string, value: any) {
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

        if (error) throw error;
    } else {
        // Update top-level field
        const { error } = await supabase
            .from('resume_leads')
            .update({ [fieldKey]: value })
            .eq('id', leadId);

        if (error) throw error;
    }

    revalidatePath(`/admin/resumes/${leadId}`);
    return { success: true };
}

/**
 * Upload resume PDF to Supabase Storage
 */
export async function uploadResumePDF(leadId: string, file: File) {
    const supabase = await createClient();

    // Create filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${leadId}_resume.${fileExt}`;
    const filePath = `resumes/${fileName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file, { upsert: true });

    if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);

    // Update resume_leads with URL
    const { error: updateError } = await supabase
        .from('resume_leads')
        .update({ resume_url: publicUrl })
        .eq('id', leadId);

    if (updateError) throw updateError;

    revalidatePath(`/admin/resumes/${leadId}`);
    return { success: true, url: publicUrl };
}

/**
 * Sync all resume data to user profile
 */
export async function syncToProfile(leadId: string) {
    const { createClient: createAdminClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get lead data
    const { data: lead, error: leadError } = await supabaseAdmin
        .from('resume_leads')
        .select('*')
        .eq('id', leadId)
        .single();

    if (leadError || !lead) {
        return { success: false, error: 'Lead not found' };
    }

    if (!lead.user_id) {
        return { success: false, error: 'No user account associated with this lead' };
    }

    // Get current profile
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('metadata')
        .eq('id', lead.user_id)
        .single();

    const currentMetadata = profile?.metadata || {};

    // Build updated metadata
    const updatedMetadata = {
        ...currentMetadata,
        experience_years: lead.experience_years,
        home_airport: lead.metadata?.home_airport,
        helmet_size: lead.metadata?.helmet_size,
        salary_expectations: lead.metadata?.salary_expectations,
        availability: lead.metadata?.availability,
        passport_valid: lead.metadata?.passport_valid,
        skills: lead.metadata?.skills || [],
        dob: lead.metadata?.dob,
        nationality: lead.metadata?.nationality,
    };

    // Update profile
    const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
            bio: lead.bio,
            resume_url: lead.resume_url,
            linkedin_url: lead.linkedin_url,
            portfolio_url: lead.portfolio_url,
            indeed_url: lead.indeed_url,
            photo_url: lead.photo_url,
            metadata: updatedMetadata,
        })
        .eq('id', lead.user_id);

    if (updateError) {
        console.error('Profile update error:', updateError);
        return { success: false, error: updateError.message };
    }

    // Mark lead as "built" status
    await supabaseAdmin
        .from('resume_leads')
        .update({ status: 'built' })
        .eq('id', leadId);

    revalidatePath(`/admin/resumes/${leadId}`);
    return { success: true };
}
