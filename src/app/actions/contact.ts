'use server';

import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

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
        // 1. Get User ID from Profile
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, username')
            .ilike('username', recipientUsername)
            .single();

        if (!profile) return { success: false, error: 'User not found' };

        // 2. Get Verification Email
        const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id);

        if (userError || !user || !user.email) {
            return { success: false, error: 'Could not contact user' };
        }

        // 3. Log Message in Database (Persistent Inbox)
        const { error: dbError } = await supabaseAdmin
            .from('profile_messages')
            .insert({
                sender_name: name,
                sender_email: email,
                recipient_id: profile.id,
                content: message
            });

        if (dbError) {
            console.error('DB Insert Error:', dbError);
            // We continue sending email even if DB log fails? Or fail?
            // Let's log it but proceed to ensure they get the alert.
        }

        // 4. Send Notification Email
        const dashboardLink = `https://gridpass.app/dashboard/messages`;

        const data = await resend.emails.send({
            from: 'GridPass <team@gridpass.app>',
            to: user.email,
            subject: `[GridPass] New Inquiry from ${name}`,
            replyTo: email,
            text: `
You have a new message on GridPass!

FROM: ${name} (${email})
--------------------------------------------------
${message}
--------------------------------------------------

This message has been saved to your Inbox.
View & Reply here: ${dashboardLink}

(You can also reply directly to this email)
            `,
            html: `
                <div style="font-family: sans-serif; color: #333;">
                    <h2>New Inquiry on GridPass</h2>
                    <p><strong>${name}</strong> (${email}) sent you a message:</p>
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        ${message.replace(/\n/g, '<br/>')}
                    </div>
                    <a href="${dashboardLink}" style="background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        View in Dashboard
                    </a>
                    <p style="color: #666; font-size: 12px; margin-top: 30px;">
                        You can also reply directly to this email.
                    </p>
                </div>
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
