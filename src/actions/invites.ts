'use server'

import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { sendTeamInviteEmail } from '@/lib/email';

export async function inviteMember(formData: FormData) {
    const supabase = await createClient(); // For auth check of sender
    const { data: { user: sender }, error: authError } = await supabase.auth.getUser();

    if (authError || !sender) {
        throw new Error('Unauthorized');
    }

    // 0. Update analytics
    const adminSupabase = createAdminClient();

    // Get sender profile for name
    const { data: senderProfile } = await supabase
        .from('profiles')
        .select('full_name, username')
        .eq('id', sender.id)
        .single();

    const inviterName = senderProfile?.full_name || senderProfile?.username || 'A team member';

    const email = formData.get('email') as string;
    const role = formData.get('role') as string;
    const teamId = formData.get('teamId') as string;
    const slug = formData.get('slug') as string;

    if (!email || !role || !teamId) {
        throw new Error('Email, Role, and Team ID are required');
    }

    // Fetch team details for email
    const { data: team } = await adminSupabase
        .from('teams')
        .select('name, slug, invite_code')
        .eq('id', teamId)
        .single();

    const teamName = team?.name || 'the team';
    const teamSlug = team?.slug || slug;
    const inviteCode = team?.invite_code || '';

    // 1. Check if user exists
    // querying auth.users is restricted, so we use admin client
    const { data: { users }, error: userError } = await adminSupabase.auth.admin.listUsers();

    // Optimization: direct retrieval by email is better if supported directly, but listUsers is the standard admin api.
    // Validating existence:
    const targetUser = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!targetUser) {
        // GROWTH FLOW: User not found, invite to platform
        // Record referral
        await adminSupabase.from('analytics_referrals').insert({
            referrer_id: sender.id,
            referred_email: email,
            status: 'pending'
        });

        const signupLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/join?ref=team_invite&by=${sender.id}&team=${teamSlug}&code=${inviteCode}`;

        await sendTeamInviteEmail({
            to: email,
            teamName,
            inviterName,
            isExistingUser: false,
            inviteLink: signupLink,
            role
        });

        return { success: true, message: `Invite sent! Since they aren't on GridPass yet, we sent them a link to sign up.` };
    }

    // 2. Check if already a member
    const { data: existingMember } = await adminSupabase
        .from('team_members')
        .select('id, status')
        .eq('team_id', teamId)
        .eq('user_id', targetUser.id)
        .maybeSingle();

    if (existingMember) {
        if (existingMember.status === 'active') {
            throw new Error('User is already a member of this team.');
        } else if (existingMember.status === 'invited') {
            // Resend email
            await sendTeamInviteEmail({
                to: email,
                teamName,
                inviterName,
                isExistingUser: true,
                inviteLink: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/invites`,
                role
            });
            return { success: true, message: `Invitation resent to ${email}` };
        }
    }

    // 3. Create Invite Record
    const { error: insertError } = await adminSupabase
        .from('team_members')
        .insert({
            team_id: teamId,
            user_id: targetUser.id,
            role: role,
            status: 'invited'
        });

    if (insertError) {
        console.error('Invite error:', insertError);
        throw new Error('Failed to send invite.');
    }

    // 4. Send Email
    await sendTeamInviteEmail({
        to: email,
        teamName,
        inviterName,
        isExistingUser: true,
        inviteLink: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/dashboard/invites`,
        role
    });

    revalidatePath(`/team/${slug}/dashboard`);
    return { success: true, message: `Invite sent to ${email}` };
}

export async function acceptInvite(teamId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const { error } = await supabase
        .from('team_members')
        .update({ status: 'active', joined_at: new Date().toISOString() })
        .eq('team_id', teamId)
        .eq('user_id', user.id);

    if (error) {
        throw new Error('Failed to accept invite');
    }

    revalidatePath('/dashboard/invites');
    // We can't easily revalidate the specific team dashboard without fetching the slug, 
    // but typically a redirect or user navigating there handles it. 
    // revalidating the user's dashboard/invites is critical.
}

export async function declineInvite(teamId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', user.id)
        .eq('status', 'invited'); // Security check

    if (error) {
        throw new Error('Failed to decline invite');
    }

    revalidatePath('/dashboard/invites');
}
