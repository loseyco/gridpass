'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function convertToMember(leadId: string) {
    const supabase = await createClient();

    // Auth Check
    const { data: { user: adminUser } } = await supabase.auth.getUser();
    if (!adminUser) return { error: 'Unauthorized' };

    // 1. Fetch Lead
    const { data: lead, error: leadError } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

    if (leadError || !lead) return { error: 'Lead not found' };

    const email = lead.contact_info?.email;
    if (!email) return { error: 'Lead has no email address' };

    // 2. Invite User (Creates Auth Record + Sends Email)
    const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);

    if (inviteError) {
        // If user already exists, we might still want to link/update profile?
        // But for "Convert" flow usually implies new user.
        return { error: 'Failed to invite user: ' + inviteError.message };
    }

    const newUserId = inviteData.user.id;

    // 3. Populate Profile
    const updates: any = {
        full_name: lead.name,
        bio: lead.contact_info?.bio,
        avatar_url: lead.contact_info?.avatar_url,
        social_links: lead.contact_info?.social_links,
        skills: lead.skills,
        career_history: lead.contact_info?.career_history
    };

    // Remove undefined/null
    Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);

    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
            id: newUserId,
            ...updates,
            updated_at: new Date().toISOString()
        });

    if (profileError) {
        console.error('Profile update error:', profileError);
        // Continue anyway, auth user is created
    }

    // 4. Assign Role
    if (lead.role) {
        await supabaseAdmin
            .from('roles')
            .upsert({
                user_id: newUserId,
                role: lead.role,
                verified: true
            }, { onConflict: 'user_id, role', ignoreDuplicates: true });
    }

    // 5. Update Lead Status
    await supabaseAdmin
        .from('leads')
        .update({
            status: 'converted',
            claimed_by_user_id: newUserId
        })
        .eq('id', leadId);

    revalidatePath(`/admin/resumes`);
    return { success: true };
}
