import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
    try {
        const { leadId, email, name } = await request.json();

        if (!leadId || !email) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // 1. Generate a magic token
        // In production, you'd verify this token against the DB or sign it efficiently
        // For now, we'll create a simple token and update the lead
        const token = Buffer.from(`${leadId}-${Date.now()}`).toString('base64');
        const claimUrl = `${process.env.NEXT_PUBLIC_APP_URL}/claim/${token}`;

        // Update lead with verification token
        const { error: updateError } = await supabase
            .from('resume_leads')
            .update({
                verification_token: token,
                status: 'pending_verification'
            })
            .eq('id', leadId);

        if (updateError) throw updateError;

        // 2. Send Email
        // Note: If no RESEND_API_KEY, we'll just log the link (dev mode)
        if (process.env.RESEND_API_KEY) {
            await resend.emails.send({
                from: 'GridPass <onboarding@gridpass.ai>',
                to: email,
                subject: 'Review Your GridPass Profile',
                html: `
                <h1>Welcome to GridPass, ${name || 'Candidate'}</h1>
                <p>We've created a preliminary profile for you based on public information.</p>
                <p>Please review and confirm your details to activate your account:</p>
                <a href="${claimUrl}" style="background:#4F46E5;color:white;padding:12px 24px;border-radius:4px;text-decoration:none;">Review Profile</a>
                <p>Or copy this link: ${claimUrl}</p>
            `
            });
        } else {
            console.log(`[DEV] Mock Email sent to ${email}: ${claimUrl}`);
        }

        return NextResponse.json({ success: true, claimUrl });

    } catch (error) {
        console.error('Send report error:', error);
        return NextResponse.json(
            { error: 'Failed to send report' },
            { status: 500 }
        );
    }
}
