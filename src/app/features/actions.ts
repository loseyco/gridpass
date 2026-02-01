'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { Resend } from 'resend';

export async function getPublicFeatures() {
    const supabase = await createClient();

    // Fetch active features (exclude denied and completed)
    const { data: features, error } = await supabase
        .from('features')
        .select('*')
        .neq('status', 'denied')
        .neq('status', 'completed')
        .order('votes', { ascending: false });

    if (error) {
        console.error('Error fetching features:', error);
        return [];
    }

    // Fetch user's votes if logged in
    const { data: { user } } = await supabase.auth.getUser();
    let userVotes: Set<string> = new Set();

    if (user) {
        const { data: votes } = await supabase
            .from('feature_votes')
            .select('feature_id')
            .eq('user_id', user.id);

        if (votes) {
            votes.forEach(v => userVotes.add(v.feature_id));
        }
    }

    // Combine
    return features.map(f => ({
        ...f,
        hasVoted: userVotes.has(f.id)
    }));
}

export async function toggleVote(featureId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'You must be logged in to vote.' };
    }

    // Check if voted
    const { data: existingVote } = await supabase
        .from('feature_votes')
        .select('id')
        .eq('feature_id', featureId)
        .eq('user_id', user.id)
        .single();

    if (existingVote) {
        // Remove vote
        const { error } = await supabase
            .from('feature_votes')
            .delete()
            .eq('id', existingVote.id);

        if (error) return { error: error.message };
    } else {
        // Add vote
        const { error } = await supabase
            .from('feature_votes')
            .insert({
                feature_id: featureId,
                user_id: user.id
            });

        if (error) return { error: error.message };
    }

    revalidatePath('/features');
    return { success: true };
}

export async function submitFeature(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Must be logged in' };

    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;

    if (!title || !description) return { error: 'Title and description are required' };

    const { error } = await supabase.from('features').insert({
        title,
        description,
        status: 'planned', // Default to planned? Or backlog? Let's say backlog/planned pending review.
        priority: 'medium',
        category: category || 'General',
        votes: 1 // Auto-vote for own feature? Or 0. Let's do 0 and let them vote.
    }).select().single();

    if (error) return { error: error.message };

    // Send notification email
    try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: 'GridPass <noreply@gridpass.app>',
            to: ['admin@gridpass.io', 'pjlosey@gmail.com'],
            subject: `New Feature Request: ${title}`,
            html: `
                <h1>New Feature Request</h1>
                <p><strong>User:</strong> ${user.email}</p>
                <p><strong>Title:</strong> ${title}</p>
                <p><strong>Category:</strong> ${category}</p>
                <p><strong>Description:</strong></p>
                <p>${description}</p>
                <br/>
                <a href="https://gridpass.app/features">View Features Board</a>
            `
        });
    } catch (err) {
        console.error('Failed to send email notif:', err);
        // Don't fail the request if email fails
    }

    revalidatePath('/features');
    return { success: true };
}

export async function getDeniedFeatures() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    // Check admin role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
        return [];
    }

    const { data, error } = await supabase
        .from('features')
        .select('*')
        .eq('status', 'denied')
        .order('created_at', { ascending: false });

    if (error) return [];

    // Check votes for these too
    const { data: votes } = await supabase
        .from('feature_votes')
        .select('feature_id')
        .eq('user_id', user.id);

    const userVotes = new Set(votes?.map(v => v.feature_id) || []);

    return data.map(f => ({
        ...f,
        hasVoted: userVotes.has(f.id)
    }));
}

export async function updateFeatureStatus(featureId: string, newStatus: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    // Check admin role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
        return { error: 'Unauthorized' };
    }

    const { error } = await supabase
        .from('features')
        .update({ status: newStatus })
        .eq('id', featureId);

    if (error) return { error: error.message };

    revalidatePath('/features');
    return { success: true };
}

export async function getCompletedFeatures() {
    const supabase = await createClient();

    // Fetch completed features
    const { data: features, error } = await supabase
        .from('features')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching completed features:', error);
        return [];
    }

    // Fetch user's votes if logged in (for display consistency)
    const { data: { user } } = await supabase.auth.getUser();
    let userVotes: Set<string> = new Set();

    if (user) {
        const { data: votes } = await supabase
            .from('feature_votes')
            .select('feature_id')
            .eq('user_id', user.id);

        if (votes) {
            votes.forEach(v => userVotes.add(v.feature_id));
        }
    }

    return features.map(f => ({
        ...f,
        hasVoted: userVotes.has(f.id)
    }));
}

export async function updateFeature(featureId: string, updates: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Unauthorized' };

    // Check admin role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
        return { error: 'Unauthorized' };
    }

    const { error } = await supabase
        .from('features')
        .update(updates)
        .eq('id', featureId);

    if (error) return { error: error.message };

    revalidatePath('/features');
    return { success: true };
}
