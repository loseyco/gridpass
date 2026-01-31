'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { notFound } from 'next/navigation';
import { Resend } from 'resend';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export interface Recommendation {
    id: string;
    target_user_id: string;
    author_id: string | null;
    author_name: string | null;
    relationship: string | null;
    content: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    author?: {
        full_name: string | null;
        username: string | null;
        avatar_url: string | null;
    }
}

export async function submitRecommendation(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const targetUserId = formData.get('targetUserId') as string;
    const authorName = formData.get('authorName') as string;
    const authorEmail = formData.get('authorEmail') as string;
    const relationship = formData.get('relationship') as string;
    const content = formData.get('content') as string;

    if (!targetUserId || !content) {
        throw new Error('Missing required fields');
    }

    const payload: any = {
        target_user_id: targetUserId,
        content,
        relationship,
        // If logged in, link to profile. If not, store provided details.
        author_id: user ? user.id : null,
        author_name: user ? null : authorName, // Use profile name if linked
        author_email: user ? null : authorEmail,
        status: 'pending'
    };

    const { error } = await supabase
        .from('recommendations')
        .insert(payload);

    if (error) {
        console.error('Error submitting recommendation:', error);
        throw new Error('Failed to submit recommendation');
    }


    // ----------------------------------------------------------------------
    // EMAIL NOTIFICATIONS
    // ----------------------------------------------------------------------
    // We instantiate Resend here. In a real app, maybe shared util, but this is fine.
    const resend = new Resend(process.env.RESEND_API_KEY);
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    ); // Needed to fetch target user email securely if they are not the current user

    try {
        // 1. Fetch Target User Profile & Email
        // We need the email (private) and the name (profile).
        // Since we are server-side, we can query the profile directly using the service role to ensure we get the data.

        // Fetch Email via Admin Auth (Correct)
        const { data: { user: targetUser }, error: targetUserError } = await supabaseAdmin.auth.admin.getUserById(targetUserId);

        // Fetch Profile Name (Reliable)
        const { data: targetProfile } = await supabaseAdmin
            .from('profiles')
            .select('full_name, username')
            .eq('id', targetUserId)
            .single();

        const targetName = targetProfile?.full_name || targetProfile?.username || 'GridPass User';

        if (targetUser && targetUser.email) {
            // Notify Target User
            await resend.emails.send({
                from: 'GridPass Alerts <team@gridpass.app>',
                to: targetUser.email,
                subject: `New Recommendation from ${user?.user_metadata?.full_name || authorName}`,
                html: `
                    <div style="font-family: sans-serif; color: #333;">
                        <h2>New Recommendation</h2>
                        <p><strong>${user?.user_metadata?.full_name || authorName}</strong> (${relationship}) just wrote a recommendation for you:</p>
                        <blockquote style="background: #f9f9f9; padding: 15px; border-left: 4px solid #6366f1; margin: 20px 0;">
                            "${content}"
                        </blockquote>
                        <a href="https://gridpass.app/dashboard" style="display: inline-block; background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                            Review & Approve
                        </a>
                    </div>
                `
            });
        }

        // 2. Notify Author (The Recommender)
        const authorEmailToUse = user ? user.email : authorEmail;
        const authorNameToUse = user ? (user.user_metadata?.full_name || authorName) : authorName;

        if (authorEmailToUse) {
            await resend.emails.send({
                from: 'GridPass Team <team@gridpass.app>',
                to: authorEmailToUse,
                subject: `Recommendation sent to ${targetName}!`,
                html: `
                    <div style="font-family: sans-serif; color: #333;">
                        <h2>Thanks for being a good teammate, ${authorNameToUse}.</h2>
                        <p>Your recommendation for <strong>${targetName}</strong> has been sent and is pending their approval.</p>
                        
                        <div style="background: #111; color: white; padding: 20px; border-radius: 10px; margin-top: 30px;">
                            <h3 style="color: #f59e0b; margin-top: 0;">Don't miss out.</h3>
                            <p>GridPass is becoming the <strong>single source of truth</strong> for the racing and automotive world. Ensure your career history, stats, and reputation are claimed.</p>
                            <a href="https://gridpass.app/register" style="display: inline-block; background: #fff; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">
                                Create Your Driver Profile
                            </a>
                        </div>
                    </div>
                `
            });
        }

    } catch (emailError) {
        // Don't block the actual submission if email fails, but log it.
        console.error("Failed to send recommendation emails:", emailError);
    }

    revalidatePath(`/u/[username]`);
    return { success: true };
}

export async function getRecommendations(targetUserId: string): Promise<Recommendation[]> {
    const supabase = await createClient();

    // Fetch approved recommendations
    const { data, error } = await supabase
        .from('recommendations')
        .select(`
            *,
            author:author_id (
                full_name,
                username,
                avatar_url
            )
        `)
        .eq('target_user_id', targetUserId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching recommendations:', error);
        return [];
    }

    return data as Recommendation[];
}

export async function getPendingRecommendations() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('recommendations')
        .select(`
             *,
            author:author_id (
                full_name,
                username,
                avatar_url
            )
        `)
        .eq('target_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return [];
    }

    return data as Recommendation[];
}

export async function getAllMyRecommendations() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await supabase
        .from('recommendations')
        .select(`
             *,
            author:author_id (
                full_name,
                username,
                avatar_url
            )
        `)
        .eq('target_user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return [];
    }

    return data as Recommendation[];
}

export async function updateRecommendationStatus(id: string, status: 'approved' | 'rejected') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    // Verify ownership implicitly via RLS (policy checks auth.uid() = target_user_id)
    const { error } = await supabase
        .from('recommendations')
        .update({ status })
        .eq('id', id)
        .eq('target_user_id', user.id); // Extra safety

    if (error) {
        throw new Error('Failed to update status');
    }

    revalidatePath('/u/[username]');
}
