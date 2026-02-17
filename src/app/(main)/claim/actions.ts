'use server'

import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function claimEntity(token: string) {
    const supabase = await createClient(); // Session check
    const supabaseAdmin = createAdminClient( // Privileged updates
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('Not authenticated');
    }

    // 1. Verify Token (Admin)
    const { data: tokenData, error: tokenError } = await supabaseAdmin
        .from('claim_tokens')
        .select('*')
        .eq('token', token)
        .single();

    if (tokenError || !tokenData) {
        throw new Error('Invalid or expired token');
    }

    if (tokenData.redeemed_at) {
        throw new Error('This profile has already been claimed');
    }

    // 2. Process Claim based on Type
    try {
        if (tokenData.entity_type === 'lead') {
            // A. Claiming a Person Profile

            const { data: lead } = await supabase
                .from('leads')
                .select('*')
                .eq('id', tokenData.entity_id)
                .single();

            if (!lead) throw new Error('Lead data not found');

            // Link Lead to User
            await supabase
                .from('leads')
                .update({
                    claimed_by_user_id: user.id,
                    status: 'claimed'
                })
                .eq('id', lead.id);

            // Update User Profile (if empty)
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            const updates: any = {};
            // Basic Info
            if (!profile?.full_name && lead.name) updates.full_name = lead.name;
            if (!profile?.bio && lead.contact_info?.bio) updates.bio = lead.contact_info.bio;
            if (!profile?.avatar_url && lead.contact_info?.avatar_url) updates.avatar_url = lead.contact_info.avatar_url;

            // Social Links (New)
            if (!profile?.social_links && lead.contact_info?.social_links) {
                updates.social_links = lead.contact_info.social_links;
            }

            // Skills (New)
            if ((!profile?.skills || profile.skills.length === 0) && lead.skills) {
                updates.skills = lead.skills;
            }

            // Career History (New)
            if ((!profile?.career_history || profile.career_history.length === 0) && lead.contact_info?.career_history) {
                updates.career_history = lead.contact_info.career_history;
            }

            if (Object.keys(updates).length > 0) {
                await supabase
                    .from('profiles')
                    .update(updates)
                    .eq('id', user.id);
            }

            // Assign Role if applicable (e.g. Driver)
            if (lead.role && ['Driver', 'Mechanic', 'Sim Racer'].includes(lead.role)) {
                await supabase
                    .from('roles')
                    .upsert({
                        user_id: user.id,
                        role: lead.role,
                        verified: true // They claimed a verification token
                    }, { onConflict: 'user_id, role', ignoreDuplicates: true });
            }

            // 3. Mark Token Redeemed
            await supabase
                .from('claim_tokens')
                .update({ redeemed_at: new Date().toISOString() })
                .eq('id', tokenData.id);

            // Redirect to User Profile Public View
            revalidatePath('/dashboard');
            // Default to user's username if profile not fully loaded, or just /dashboard/profile
            redirect(`/u/${profile?.username || user.user_metadata?.username || 'me'}`);

        } else if (tokenData.entity_type === 'job') {
            // B. Claiming a Job Posting (Team Owner)
            const { data: job } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', tokenData.entity_id)
                .single();

            if (!job) throw new Error('Job data not found');

            // Link Job to User (Team Owner)
            await supabase
                .from('jobs')
                .update({
                    status: 'claimed',
                })
                .eq('id', job.id);

            // Grant "Team Principal" role to user?
            await supabase
                .from('roles')
                .upsert({
                    user_id: user.id,
                    role: 'Team Principal',
                    verified: true
                }, { onConflict: 'user_id, role', ignoreDuplicates: true });

            // 3. Mark Token Redeemed
            await supabase
                .from('claim_tokens')
                .update({ redeemed_at: new Date().toISOString() })
                .eq('id', tokenData.id);

            revalidatePath('/dashboard');
            redirect('/dashboard');
        }

    } catch (e: any) {
        if (e.message === 'NEXT_REDIRECT') throw e; // Let Next.js handle redirect
        console.error('Claim Error:', e);
        throw new Error(e.message);
    }
}
