import { Resend } from 'resend';

// Initialize Resend with API Key from environment variables
// Note: You must add RESEND_API_KEY to your .env.local file
const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key_for_build');

export async function sendResumeNotification(data: {
    name: string;
    email: string;
    role: string;
    resumeId: string;
    paymentLink?: string;
}) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY is missing. Email notification skipped.');
        return;
    }

    try {
        await resend.emails.send({
            from: 'GridPass Admin <onboarding@resend.dev>', // Change this to your verify domain later
            to: 'pjlos@example.com', // TODO: Make this dynamic or configurable (User's admin email)
            subject: `New Resume Request: ${data.name}`,
            html: `
        <h1>New Resume Build Request</h1>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Role:</strong> ${data.role}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <br/>
        <p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/resumes/${data.resumeId}" 
             style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            View Request in Admin
          </a>
        </p>
        ${data.paymentLink ? `
        <p style="margin-top: 20px;">
            <strong>Auto-Generated Payment Link:</strong><br/>
            <a href="${data.paymentLink}">${data.paymentLink}</a>
        </p>
        ` : ''}
      `
        });
        console.log('Notification email sent for', data.name);
    } catch (error) {
        console.error('Failed to send email notification:', error);
    }
}

export async function sendFeedbackNotification(data: {
    type: string;
    title: string;
    message: string;
    page_url: string;
    user_email?: string;
}) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY is missing. Email notification skipped.');
        return;
    }

    try {
        await resend.emails.send({
            from: 'GridPass Admin <onboarding@resend.dev>',
            to: 'pjlos@example.com', // TODO: Make dynamic
            subject: `New Feedback: [${data.type.toUpperCase()}] ${data.title || 'No Title'}`,
            html: `
        <h1>New Feedback Submission</h1>
        <p><strong>Type:</strong> ${data.type}</p>
        <p><strong>Title:</strong> ${data.title || 'N/A'}</p>
        <p><strong>Message:</strong> ${data.message}</p>
        <p><strong>Page:</strong> ${data.page_url}</p>
        ${data.user_email ? `<p><strong>User Email:</strong> ${data.user_email}</p>` : ''}
        <br/>
        <p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/feedback" 
             style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            View in Admin Panel
          </a>
        </p>
      `
        });
        console.log('Feedback notification email sent');
    } catch (error) {
        console.error('Failed to send feedback notification:', error);
    }
}

export async function sendTeamInviteEmail(data: {
    to: string;
    teamName: string;
    inviterName: string;
    isExistingUser: boolean;
    inviteLink: string;
    role: string;
}) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY is missing. Team invite email skipped.');
        return;
    }

    const subject = data.isExistingUser
        ? `You've been invited to join ${data.teamName} on GridPass`
        : `${data.inviterName} invited you to join ${data.teamName} on GridPass`;

    const actionText = data.isExistingUser ? 'Accept Invitation' : 'Create Account & Join';

    // For non-users, inviteLink should probably point to signup with a specific query param or just general signup
    // For now, let's keep it simple: existing users -> dashboard/invites, new users -> root/signup

    const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1>Join ${data.teamName}</h1>
            <p><strong>${data.inviterName}</strong> has invited you to join their team as a <strong>${data.role}</strong>.</p>
            
            ${!data.isExistingUser ? `<p>GridPass is the platform for motorsports professionals. create your profile to join the team and start tracking your career.</p>` : ''}
            
            <br/>
            <p>
                <a href="${data.inviteLink}" 
                   style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                    ${actionText}
                </a>
            </p>
            <br/>
            <p style="color: #666; font-size: 14px;">If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
    `;

    try {
        await resend.emails.send({
            from: 'GridPass Team <onboarding@resend.dev>',
            to: data.to,
            subject: subject,
            html: htmlContent
        });
        console.log(`Team invite email sent to ${data.to}`);
    } catch (error) {
        console.error('Failed to send team invite email:', error);
    }
}

export async function sendPaymentLinkEmail(data: {
    to: string;
    name: string;
    paymentLink: string;
}) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY is missing. Payment link email skipped.');
        return;
    }

    const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #1a1a1a;">Complete Your GridPass Resume Payment</h1>
            <p>Hi <strong>${data.name}</strong>,</p>
            
            <p>Thank you for submitting your resume to GridPass! To complete your professional resume and verify your profile, please complete your payment.</p>
            
            <p style="margin: 30px 0;">
                <a href="${data.paymentLink}" 
                   style="background-color: #ef4444; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    Complete Payment & Verify Profile
                </a>
            </p>
            
            <p style="color: #666; font-size: 14px;">Once payment is complete, our team will build your professional resume page and it will go live on GridPass.</p>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px;">If you have any questions, feel free to reply to this email.</p>
            
            <p style="color: #999; font-size: 12px; margin-top: 40px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
    `;

    try {
        await resend.emails.send({
            from: 'GridPass <onboarding@resend.dev>',
            to: data.to,
            subject: 'Complete Your GridPass Resume Payment',
            html: htmlContent
        });
        console.log(`Payment link email sent to ${data.to}`);
    } catch (error) {
        console.error('Failed to send payment link email:', error);
        throw error;
    }
}
