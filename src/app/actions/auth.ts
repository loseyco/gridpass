'use server';

import { Resend } from 'resend';
import { createAdminClient } from '@/utils/supabase/admin';

// ... existing imports

export async function toggleUserBan(userId: string, isBanned: boolean) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing during toggleUserBan');
        return { error: 'Server configuration error: Missing Admin Key' };
    }

    try {
        const supabase = createAdminClient();

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
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: fullName,
            tracking_id: trackingId || null
        }
    });

    if (error) {
        console.error('Registration Error:', error);
        return { error: error.message };
    }

    console.log('User created successfully:', data.user?.id);

    // Notify Admin (Fire and Forget)
    notifyNewUser(email, trackingId);

    return { success: true };
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
