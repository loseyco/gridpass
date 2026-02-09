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
    const resend = new Resend(process.env.RESEND_API_KEY);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const message = formData.get('message') as string;
    const recipientUsername = formData.get('recipientUsername') as string;

    if (!name || !email || !message || !recipientUsername) {
        return { success: false, error: 'Missing required fields' };
    }

    try {
        // 1. Check for Service Key
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

        // EMERGENCY FALLBACK: If DB fails, ensures PJ specifically always gets mail.
        if ((profileError || !profile) && recipientUsername.toLowerCase() === 'pjlosey') {
            console.log('Using Emergency Fallback for pjlosey');
            // Mock profile for fallback
            const fallbackEmail = 'loseyp@gmail.com';

            const data = await resend.emails.send({
                from: 'GridPass <team@gridpass.app>',
                to: fallbackEmail,
                subject: `[Fallback] Inquiry from ${name}`,
                replyTo: email,
                text: `
    *** EMERGENCY FALLBACK MODE (DB Lookup Failed) ***
    
    You have a new work inquiry!
    
    FROM: ${name}
    EMAIL: ${email}
    
    MESSAGE:
    --------------------------------------------------
    ${message}
    --------------------------------------------------
                `
            });

            if (data.error) return { success: false, error: data.error.message };
            return { success: true };
        }

        if (profileError || !profile) {
            console.error('Profile Lookup Failed:', profileError);
            return { success: false, error: 'User not found' };
        }

        // 2. Get Verification Email
        const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id);

        if (userError || !user || !user.email) {
            return { success: false, error: 'Could not contact user' };
        }

        // SKIP DB LOGGING as requested for stability

        // 3. Send Notification Email
        const dashboardLink = `https://gridpass.app/dashboard/messages`;

        const data = await resend.emails.send({
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

        if (data.error) {
            console.error('Resend Error:', data.error);
            return { success: false, error: data.error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('Email Server Error:', error);
        return { success: false, error: 'Internal server error' };
    }
}
