'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// Initialize Admin Client (Bypass RLS for updates to leads)
const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function updateLead(id: string, formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    // Extract Data
    const name = formData.get('name') as string;
    const role = formData.get('role') as string;
    const skills = (formData.get('skills') as string)?.split(',').map(s => s.trim()).filter(Boolean) || [];

    // Contact Info (JSONB)
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const bio = formData.get('bio') as string;
    const location = formData.get('location') as string;

    // Socials
    const linkedin = formData.get('linkedin') as string;
    const instagram = formData.get('instagram') as string;
    const website = formData.get('website') as string;

    // Fetch existing data to merge JSONB
    const { data: existingLead } = await supabaseAdmin
        .from('leads')
        .select('contact_info')
        .eq('id', id)
        .single();

    const currentContact = existingLead?.contact_info || {};

    const contact_info = {
        ...currentContact,
        email,
        phone,
        bio,
        location,
        linkedin,
        website,
        social_links: {
            ...(currentContact.social_links || {}),
            instagram,
            linkedin
        }
    };

    // Update
    const { error } = await supabaseAdmin
        .from('leads')
        .update({
            name,
            role,
            skills,
            contact_info
        })
        .eq('id', id);

    if (error) {
        console.error('Error updating lead:', error);
        return { error: 'Failed to update lead' };
    }

    revalidatePath(`/admin/leads/${id}/edit`);
    return { success: true };
}
