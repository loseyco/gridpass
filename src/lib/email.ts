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
