
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const { token, user_id } = await request.json();

    if (!token || !user_id) {
        return NextResponse.json({ error: 'Missing token or user_id' }, { status: 400 });
    }

    // Use Service Role to bypass RLS and perform admin-like migration
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Validate Token
    const { data: claim, error: tokenError } = await supabase
        .from('os_claim_tokens')
        .select('*')
        .eq('token', token)
        .eq('is_used', false) // Use proper status logic if available
        .single();

    if (tokenError || !claim) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    // 2. Fetch Lead Data
    const { data: lead, error: leadError } = await supabase
        .from('os_leads')
        .select('*')
        .eq('id', claim.entity_id)
        .single();

    if (leadError || !lead) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // 3. Update Profile (Migrate data)
    // Update os_user_profiles
    const { error: updateError } = await supabase
        .from('os_user_profiles')
        .update({
            target_role: lead.role,
            bio: lead.notes || `Candidate for ${lead.role}`,
            is_open_to_work: true,
            cv_url: lead.resume_url,
            social_links: {
                linkedin: lead.linkedin_url,
                website: lead.source_link
            }
        })
        .eq('id', user_id);

    if (updateError) {
        console.error("Failed to update profile:", updateError);
        return NextResponse.json({ error: 'Failed to migrate data' }, { status: 500 });
    }

    // Insert Skills
    if (lead.skills && Array.isArray(lead.skills)) {
        const skillsToInsert = lead.skills.map((skill: string) => ({
            user_id: user_id,
            skill: skill,
            proficiency: 3 // Default
        }));

        const { error: skillsError } = await supabase
            .from('os_user_skills')
            .insert(skillsToInsert);

        if (skillsError) {
            console.error("Failed to insert skills:", skillsError);
            // Non-fatal, continue
        }
    }

    // 4. Mark Token as Used
    await supabase.from('os_claim_tokens').update({ is_used: true }).eq('id', claim.id);

    // 5. Optionally delete or archive the lead?
    // User asked "no reason to have another table".
    // We can mark the lead as 'claimed' or 'converted' so it doesn't show up as a duplicate.
    await supabase.from('os_leads').update({ status: 'claimed' }).eq('id', lead.id);

    return NextResponse.json({ success: true });
}
