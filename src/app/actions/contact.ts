'use server';

import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

// Resend instantiated inside function to prevent build crash
// const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function sendContactEmail(formData: FormData) {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const message = formData.get('message') as string;
    const recipientUsername = formData.get('recipientUsername') as string;

    if (!name || !email || !message || !recipientUsername) {
        return { success: false, error: 'Missing required fields' };
    }

    try {
        // 1. Check for Service Key (DB Access)
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing');
            return { success: false, error: 'Server misconfiguration: Missing API Key' };
        }

        // 2. Get User ID from Profile
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, username')
            .ilike('username', recipientUsername)
            .single();

        // ... (Emergency fallback logic removed for brevity as it relied on email) ...

        if (profileError || !profile) {
            console.error('Profile Lookup Failed:', profileError);
            return { success: false, error: 'User not found' };
        }

        // 3. Save to Messages DB (This is the primary method now)
        const { error: msgError } = await supabaseAdmin
            .from('profile_messages')
            .insert({
                recipient_id: profile.id,
                sender_name: name,
                sender_email: email,
                content: message
            });

        if (msgError) {
            console.error('Failed to save message to DB:', msgError);
            return { success: false, error: 'Failed to save message' };
        }

        // 4. Send Notification Email (Optional)
        const resendKey = process.env.RESEND_API_KEY;
        if (resendKey) {
            const resend = new Resend(resendKey);

            // Get Verification Email
            const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id);

            if (!userError && user && user.email) {
                const dashboardLink = `https://gridpass.app/dashboard/messages`;

                await resend.emails.send({
                    from: `${name} via GridPass <team@gridpass.app>`,
                    to: user.email,
                    subject: `[GridPass] New Inquiry from ${name}`,
                    replyTo: email,
                    text: `
You have a new message on GridPass!

FROM: ${name} (${email})
--------------------------------------------------
${message}
--------------------------------------------------

View & Reply here: ${dashboardLink}
                    `
                });
            }
        } else {
            console.warn('RESEND_API_KEY missing. Skipping email notification.');
        }

        return { success: true };
    } catch (error) {
        console.error('Message Handler Error:', error);
        return { success: false, error: 'Internal server error' };
    }
}
