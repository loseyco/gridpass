import { Resend } from 'resend';

// Initialize Resend with API Key from environment variables
// Note: You must add RESEND_API_KEY to your .env.local file
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendResumeNotification(data: {
    name: string;
    email: string;
    role: string;
    resumeId: string;
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
