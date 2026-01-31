'use server';

import { Resend } from 'resend';

export async function notifyNewUser(email: string) {
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
