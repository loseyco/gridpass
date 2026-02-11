'use server';

import { Resend } from 'resend';
import { createAdminClient } from '@/utils/supabase/admin';
import { createClient } from '@/utils/supabase/server';

// ... existing imports

export async function toggleUserBan(userId: string, isBanned: boolean) {
    // RLS Verification confirmed standard Admins can update 'is_banned',
    // so we use the standard client (User Context) instead of Service Role.
    try {
        const supabase = await createClient();

        // 1. Update Profile
        const { error } = await supabase
            .from('profiles')
            .update({ is_banned: isBanned })
            .eq('id', userId);

        if (error) {
            console.error('Error toggling ban:', error);
            return { error: `Failed to update ban status: ${error.message}` };
        }

        return { success: true };
    } catch (e: any) {
        console.error('Unexpected error in toggleUserBan:', e);
        return { error: `Unexpected error: ${e.message}` };
    }
}

export async function registerUser(formData: FormData) {
    console.log('--- Register User Action Started ---');
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('full_name') as string;
    const trackingId = formData.get('tracking_id') as string | null;

    if (!email || !password) {
        console.log('Missing email or password');
        return { error: 'Email and password are required' };
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing');
        return { error: 'Server configuration error' };
    }

    const supabase = createAdminClient();

    // Create user with auto-confirm
    console.log(`Creating user: ${email}, Tracking: ${trackingId}`);

    // 1. Generate Username
    const username = await generateUsername(fullName, supabase);
    console.log(`Generated Username: ${username}`);

    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: fullName,
            username: username, // Pass to metadata as well
            tracking_id: trackingId || null
        }
    });

    if (error) {
        console.error('Registration Error:', error);
        return { error: error.message };
    }

    const userId = data.user?.id;
    console.log('User created successfully:', userId);

    // 2. Ensure Profile Exists with Username (Upsert to be safe against Triggers)
    if (userId) {
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                username: username,
                full_name: fullName,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

        if (profileError) {
            console.error('Profile Upsert Warning:', profileError);
            // Don't fail the registration, but log it.
        }
    }

    // Notify Admin (Fire and Forget)
    notifyNewUser(email, trackingId);

    // 3. Check for Team Invite (Auto-Join)
    const teamSlug = formData.get('team_slug') as string | null;
    const inviteCode = formData.get('invite_code') as string | null;

    if (userId && teamSlug && inviteCode) {
        console.log(`Processing auto-join for team: ${teamSlug}`);
        try {
            // Find Team
            const { data: team } = await supabase
                .from('teams')
                .select('id, invite_code')
                .eq('slug', teamSlug)
                .single();

            if (team && team.invite_code === inviteCode) {
                // Add Member
                const { error: memberError } = await supabase
                    .from('team_members')
                    .insert({
                        team_id: team.id,
                        user_id: userId,
                        role: 'member', // Default role for auto-join
                        status: 'active', // Direct active status since they used the link
                        joined_at: new Date().toISOString()
                    });

                if (memberError) {
                    console.error('Auto-join failed:', memberError);
                } else {
                    console.log(`User ${userId} auto-joined team ${team.id}`);
                }
            } else {
                console.warn('Invalid team slug or invite code for auto-join');
            }
        } catch (e) {
            console.error('Error in auto-join flow:', e);
        }
    }

    return { success: true };
}

// Helper to generate unique username
async function generateUsername(fullName: string, supabase: any): Promise<string> {
    // 1. Slugify: clean, lowercase, no spaces/special chars
    let base = fullName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!base) base = 'user'; // Fallback for empty/symbols

    // 2. Check availability
    let candidate = base;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
        // Query profiles to see if taken
        const { data } = await supabase
            .from('profiles')
            .select('username')
            .eq('username', candidate)
            .single();

        if (!data) {
            isUnique = true;
        } else {
            // Append random 4 digits
            const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 1000-9999
            candidate = `${base}${randomSuffix}`;
            attempts++;
        }
    }

    // If still failing after 5 attempts, force a timestamp
    if (!isUnique) {
        candidate = `${base}${Date.now().toString().slice(-6)}`;
    }

    return candidate;
}

export async function notifyNewUser(email: string, trackingId?: string | null) {
    // Fire and forget notification
    try {
        const resend = new Resend(process.env.RESEND_API_KEY);

        // Notify Admin
        await resend.emails.send({
            from: 'GridPass Alerts <team@gridpass.app>',
            to: ['pjlosey@gmail.com'], // Hardcoded for now as SuperAdmin
            subject: `New User Signup: ${email}`,
            html: `
                <div style="font-family: sans-serif;">
                    <h2>New User Signup</h2>
                    <p>A new user just created an account on GridPass.</p>
                    <p><strong>Email:</strong> ${email}</p>
                    ${trackingId ? `<p><strong>Tracking ID:</strong> ${trackingId}</p>` : ''}
                    <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                    <br/>
                    <a href="https://gridpass.app/admin/users" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                        Manage Users
                    </a>
                </div>
            `
        });

    } catch (error) {
        console.error('Failed to send new user notification:', error);
        // Don't throw, we don't want to block signup if email fails
    }
}
